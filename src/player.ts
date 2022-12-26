import { subscribe } from './subscription'
import { fillRect } from './fillRect'
import { centerRect } from './centerRect'

const playerHandlers = async ({
	urls,
	onLoadProgress,
	onFrameChange,
}: {
	urls: Array<string>
	onLoadProgress: (percentLoaded: number) => void
	onFrameChange: (frame: number) => void
}) => {
	const { setValue: setLoaded, unsubscribe: unsubscribeFromLoaded } =
		subscribe(0, updatedLoaded => {
			// Update counter
			const percent = Math.floor((updatedLoaded / urls.length) * 100)
			onLoadProgress(percent)
			if (updatedLoaded === urls.length) {
				// Display page
				unsubscribeFromLoaded()
				document
					.querySelectorAll('[data-preloaded]')
					.forEach(element => {
						element.parentNode?.removeChild(element)
					})
			}
		})

	const imagesRects = [] as Array<{ x: number; y: number }>
	await new Promise<void>(resolve => {
		for (const src of urls) {
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
				setLoaded(current => {
					const next = current + 1
					if (next === urls.length - 1) {
						resolve()
					}
					return next
				})
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
	scrollSize,
	onFrameChange,
}: {
	images: Array<string>
	scrollSize: number
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
		onLoadProgress: _percent => {
			/* @TODO: add progressbar */
		},
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

	const startingScrollPosition = window.scrollY
	let prevScrollValue = startingScrollPosition
	const { setValue: setScroll } = subscribe(
		startingScrollPosition,
		scroll => {
			if (prevScrollValue === scroll) {
				return
			}
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
		}
	)

	let listening = true
	const onScroll = () => {
		if (listening) {
			setScroll(Math.abs(startingScrollPosition - window.scrollY))
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
