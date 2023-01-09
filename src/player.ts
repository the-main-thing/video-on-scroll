import { subscribe } from './subscription'
import { fillRect } from './fillRect'
import { centerRect } from './centerRect'

type OnProgress = (info: {
	loaded: number
	total: number
	percent: number
}) => void
const makeProgressHandler = () => {
	const onProgress = new Set<OnProgress>()
	const { value, setValue, unsubscribe } = subscribe(
		[0, 0] as [loaded: number, total: number],
		([loaded, total]) => {
			const percent = Math.round((loaded / total) * 100) || 0
			const info = { loaded, total, percent }
			for (const handler of onProgress.values()) {
				handler(info)
			}
		}
	)

	return {
		addToTotal: (toAdd: number) => {
			setValue(([loaded, total]) => [loaded, total + toAdd])
		},
		addToProgress: (toAdd: number) => {
			setValue(([loaded, total]) => [loaded + toAdd, total])
		},
		addListener: (listener: OnProgress) => {
			onProgress.add(listener)
			return () => onProgress.delete(listener)
		},
		removeListener: (listener: OnProgress) => {
			return onProgress.delete(listener)
		},
		onProgress: () => {
			setValue(([loaded, total]) => [loaded + 1, total])
		},
		currentValue: value,
		finish: () => {
			onProgress.clear()
			unsubscribe()
		},
	}
}

const progress = makeProgressHandler()

const getScrollPosition = (offset: number, scrolled: number) => {
	return Math.abs(scrolled) - offset
}

const playerHandlers = async ({
	urls,
	onLoadProgress,
	onFrameChange,
}: {
	urls: Array<string>
	onLoadProgress: (percentLoaded: number) => void
	onFrameChange: (frame: number) => void
}) => {
	progress.addListener(({ percent }) => {
		onLoadProgress(percent)
	})
	progress.addToTotal(urls.length)

	const imagesRects = [] as Array<{ x: number; y: number }>
	await new Promise<void>(resolve => {
		const totalImagesCount = urls.length
		let loaded = 0
		for (let i = 0; i < totalImagesCount; i++) {
			const src = urls[i]
			const preloadImage = document.createElement('img')
			preloadImage.style.position = 'absolute'
			preloadImage.style.opacity = '0'
			preloadImage.style.transform = 'translate(-2000vw, -2000vh)'
			preloadImage.style.width = '1px'
			preloadImage.style.height = '1px'
			preloadImage.src = src
			preloadImage.dataset.preloaded = 'true'
			document.body.appendChild(preloadImage)

			const imageRect = {
				x: 0,
				y: 0,
			}
			const img = new Image()
			const onLoad = () => {
				imageRect.x = img.width
				imageRect.y = img.height
				progress.onProgress()
				loaded += 1
				if (loaded === totalImagesCount) {
					resolve()
				}
				img.removeEventListener('load', onLoad)
			}
			img.addEventListener('load', onLoad)
			img.src = src
			imagesRects.push(imageRect)
		}
	})

	const { setValue: setFrame, value: currentFrame } = subscribe(
		0 as number,
		onFrameChange
	)

	return {
		currentFrame,
		setFrame,
		imagesRects,
	}
}

const setCanvasStyles = (
	canvas: HTMLCanvasElement,
	{ x, y }: { x: number; y: number }
) => {
	canvas.width = x
	canvas.height = y
}

const getFrameFromScroll = ({
	scroll,
	totalFrames,
	scrollSize,
}: {
	scroll: number
	totalFrames: number
	scrollSize: number
}): number => {
	if (scroll <= 0) {
		return 0
	}
	if (scroll >= scrollSize) {
		return totalFrames - 1
	}

	const ratio = (totalFrames - 1) / scrollSize

	return Math.round(scroll * ratio)
}

export const createPlayer = async ({
	images,
	startOffset,
	scrollSize,
	onFrameChange,
	onLoadProgress,
}: {
	images: Array<string>
	startOffset: number
	scrollSize: number
	onLoadProgress: (progress: number) => void
	onFrameChange: (info: {
		frame: number
		scroll: number
		scrollSize: number
		totalFrames: number
		inViewPort: boolean
	}) => void
}) => {
	const totalFrames = images.length
	const canvas = document.createElement('canvas')

	const { setValue: setInfo } = subscribe(
		{
			frame: 0,
			scroll: 0,
			scrollSize,
			totalFrames,
			inViewPort: false,
		},
		info => {
			onFrameChange(info)
		}
	)

	let imagesContainerRect = {
		x: window.innerWidth,
		y: window.innerHeight,
	}
	setCanvasStyles(canvas, imagesContainerRect)

	const drawImage = (frame: number) => {
		const imageRect = fillRect(imagesContainerRect, imagesRects[frame])
		const image = new Image()
		image.src = images[frame]
		const { x: dx, y: dy } = centerRect(imagesContainerRect, imageRect)
		const context = canvas.getContext('2d')
		context?.drawImage(image, dx, dy, imageRect.x, imageRect.y)
	}

	const { setFrame, imagesRects, currentFrame } = await playerHandlers({
		urls: images,
		onLoadProgress,
		onFrameChange: drawImage,
	})

	const { setValue: setImagesContainerRect } = subscribe(
		imagesContainerRect,
		container => {
			imagesContainerRect = container
			setCanvasStyles(canvas, imagesContainerRect)
			setFrame(current => current)
		}
	)

	window.addEventListener('resize', () => {
		setImagesContainerRect({
			x: window.innerWidth,
			y: window.innerHeight,
		})
	})

	const { setValue: setScroll } = subscribe(0, scroll => {
		const frameIndex = getFrameFromScroll({
			scroll,
			scrollSize,
			totalFrames,
		})
		setFrame(frameIndex)
		const imageRect = imagesRects[frameIndex]
		setInfo({
			scroll,
			frame: frameIndex,
			totalFrames,
			scrollSize,
			inViewPort: scrollSize - scroll + imageRect.y > 0,
		})
	})

	let listening = true
	const onScroll = () => {
		if (listening) {
			const scrolled = getScrollPosition(startOffset, window.scrollY)
			setScroll(scrolled)
			window.requestAnimationFrame(onScroll)
		}
	}

	const stop = () => {
		listening = false
	}

	const start = () => {
		listening = true
		drawImage(currentFrame())
		onScroll()
		return stop
	}

	return {
		start,
		stop,
		canvas,
	}
}
