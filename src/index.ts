const ZERO_BLOCK_RECORD_TYPE = '396'

export type OnRange = (data: {
	start: number
	end: number
	current: number
	getPositionData: (
		start: number,
		end: number
	) => {
		inRange: boolean
		position: number
		linearGradient: number
		easeOutExpo: number
	}
}) => void
;(window as any).videoOnScroll = videoOnScroll
;(window as any).getEventHandler = getEventHandler

const canvasGetter = canvasCreator()

export default async function videoOnScroll({
	url,
	scrollSize,
	onScroll,
	onTime,
}: {
	url: string | URL
	scrollSize: number
	onScroll?: OnRange
	onTime?: OnRange
}) {
	const video = createVideo(url)

	const heightSetter = createHeigthSetter(scrollSize)
	const container = document.createElement('div')
	container.style.position = 'relative'
	container.append(heightSetter)
	mount(container, video)
	window.scrollTo(0, 0)

	await waitForLoad(video)

	const heightSetterRect = heightSetter.getBoundingClientRect()
	const pxToTime = getPxToTime(video.duration, heightSetterRect.height)
	let lastPosition = window.scrollY

	const getRangeHandler = (handler?: OnRange) => {
		return handler
			? (current: number) => {
					handler({
						start: 0,
						end: scrollSize,
						current,
						getPositionData: (start: number, end: number) => {
							return {
								inRange: inRange(start, end, current),
								position: traveledInRange(start, end, current),
								linearGradient: linearGradient(
									start,
									end,
									current
								),
								easeOutExpo: easeOutExpo(
									linearGradient(start, end, current),
									0,
									1,
									100
								),
							}
						},
					})
			  }
			: () => void 0
	}

	const handleScroll = getRangeHandler(onScroll)
	const handleTime = getRangeHandler(onTime)

	const scrollPlay = () => {
		const scrolled = window.scrollY
		if (lastPosition === scrolled) {
			return window.requestAnimationFrame(scrollPlay)
		}

		const time = pxToTime(scrolled)
		if (time >= video.duration) {
			onEnd(video, scrolled)
			return window.requestAnimationFrame(scrollPlay)
		}

		if (time < 0) {
			return window.requestAnimationFrame(scrollPlay)
		}

		onStart(video)

		video.currentTime = time
		if (lastPosition !== scrolled) {
			handleScroll(scrolled)
			handleTime(time)
		}
		lastPosition = scrolled
		return window.requestAnimationFrame(scrollPlay)
	}

	window.requestAnimationFrame(scrollPlay)
}

function getPxToTime(duration: number, scrollLength: number) {
	const playbackSpeed = duration / (scrollLength - window.innerHeight)
	return (scrolled: number) => {
		return scrolled * playbackSpeed
	}
}

function inRange(start: number, end: number, current: number): boolean {
	return current >= start && current <= end
}

function traveledInRange(start: number, end: number, current: number): number {
	const rangeSize = end - start
	const currentPositionInRange = current - start
	return (currentPositionInRange / rangeSize) * 100
}

function linearGradient(start: number, end: number, current: number): number {
	const vertex = (end - start) / 2 + start
	const ascend = traveledInRange(start, vertex, current)
	return ascend < 100 ? ascend : 200 - ascend
}

function waitForLoad(video: HTMLVideoElement): Promise<void> {
	let loadedCounter = 0
	const addEventListener = (
		eventName: keyof HTMLVideoElementEventMap,
		resolve: () => void
	) => {
		loadedCounter += 1
		const callback = () => {
			loadedCounter -= 1
			if (loadedCounter === 0) {
				video.removeEventListener(eventName, callback)
				return resolve()
			}
		}
		video.addEventListener(eventName, callback)
	}

	return new Promise<void>(resolve => {
		video.load()
		if (video.readyState > 2) {
			return resolve()
		}
		addEventListener('loadedmetadata', resolve)
		addEventListener('loadeddata', resolve)
	})
}

function getVideoWidth(video: HTMLVideoElement): `${number}px` {
	const videoRatio = video.videoWidth / video.videoHeight
	const screenRatio = window.innerWidth / window.innerHeight
	const elementsRatio = videoRatio / screenRatio
	const width =
		elementsRatio >= 1 ? window.innerHeight * videoRatio : window.innerWidth
	return `${Math.floor(width)}px`
}

function getVideoStyles(video: HTMLVideoElement) {
	return {
		display: 'block',
		position: 'fixed',
		top: '0',
		left: '0',
		width: getVideoWidth(video),
	} as const
}

function setVideoStyles(video: HTMLVideoElement) {
	const videoStyles = getVideoStyles(video)
	for (const [key, value] of Object.entries(videoStyles)) {
		video.style[key as keyof typeof videoStyles] = value
	}
}

function mount(container: HTMLElement, video: HTMLVideoElement) {
	const videoContainer = document.createElement('div')
	videoContainer.style.display = 'flex'
	videoContainer.style.alignItems = 'bottom'
	videoContainer.style.position = 'absolute'
	videoContainer.style.width = '100%'
	videoContainer.style.inset = '0'
	videoContainer.style.overflow = 'hidden'
	videoContainer.appendChild(video)
	container.appendChild(videoContainer)
	document.body.prepend(container)
	setVideoStyles(video)
}

function createVideo(url: string | URL): HTMLVideoElement {
	const video = document.createElement('video')
	const source = document.createElement('source')
	source.src = new URL(url, window.location.href).toString()
	video.src = source.src
	video.appendChild(source)

	// Set up video attributes
	video.setAttribute('tabindex', '0')
	video.setAttribute('autobuffer', '')
	video.muted = true
	video.controls = false
	video.preload = 'auto'

	return video
}

function createHeigthSetter(scrollSize: number): HTMLDivElement {
	const heightSetter = document.createElement('div')
	heightSetter.style.height = window.innerHeight * 2 + scrollSize + 'px'
	return heightSetter
}

function onEnd(video: HTMLVideoElement, scrolled: number) {
	getCanvas().unmount()
	const parent = video.parentNode as HTMLDivElement
	if (parent.style.position === 'fixed') {
		parent.style.position = 'absolute'
		parent.style.top = scrolled + 'px'
		if (video.style.position === 'fixed') {
			video.style.position = 'absolute'
		}
	}
}

function onStart(video: HTMLVideoElement) {
	getCanvas().mount()
	const parent = video.parentNode as HTMLDivElement
	if (parent.style.position === 'absolute') {
		parent.style.position = 'fixed'
		parent.style.top = '0'
		setVideoStyles(video)
	}
}

function easeOutExpo(
	time: number,
	start: number,
	change: number,
	duration: number
): number {
	return time === duration
		? start + change
		: change * (-Math.pow(2, (-10 * time) / duration) + 1) + start
}

function canvasCreator() {
	const container = document.createElement('div') as HTMLDivElement & {
		mount: typeof mount
		unmount: typeof unmount
		addContent: typeof addContent
	}

	container.setAttribute('data-role', 'canvas')
	container.style.position = 'fixed'
	container.style.width = '100vw'
	container.style.height = '100vh'
	container.style.inset = '0'
	document.body.appendChild(container)
	function mount() {
		container.style.display = 'block'
		return unmount
	}

	function unmount() {
		container.style.display = 'none'
		return mount
	}

	const getContentBlock = () => {
		const contentContainer = document.createElement(
			'div'
		) as HTMLDivElement & {}
		contentContainer.style.position = 'absolute'
		contentContainer.style.top = '0'
		contentContainer.style.left = '0'
		contentContainer.style.width = '100vw'
		contentContainer.setAttribute('data-role', 'canvas-content')
		return contentContainer
	}

	function addContent(element: HTMLElement) {
		const contentBlock = getContentBlock()
		container.appendChild(contentBlock)
		contentBlock.appendChild(element)
		if (element.dataset.recordType === ZERO_BLOCK_RECORD_TYPE) {
			element.style.width = '100%'
		}
	}
	container.mount = mount
	container.unmount = unmount
	container.addContent = addContent
	return () => container
}

function getCanvas() {
	return canvasGetter()
}

function createElementHandler({
	id,
	start,
	end,
}: {
	id: string
	start: number
	end: number
}) {
	const element = document.querySelector(id) as HTMLElement | null
	if (!element) {
		console.error(`Could not find element with id: ${id}`)
		return () => void 0
	}
	if (!element.parentNode) {
		console.error(`Element with id: \`${id}\` has no parentNode`)
		return () => void 0
	}
	element.parentNode.removeChild(element)
	element.style.position = 'absolute'
	element.style.opacity = '0'
	const container = getCanvas()
	container.addContent(element)

	return ({
		getPositionData,
	}: {
		getPositionData: (
			start: number,
			end: number
		) => {
			inRange: boolean
			easeOutExpo: number
		}
	}) => {
		const { inRange, easeOutExpo } = getPositionData(start, end)
		if (inRange) {
			element.style.opacity = `${easeOutExpo}`
			return
		}
		element.style.opacity = '0'
		return
	}
}

function getEventHandler(config: {
	[id: `#${string}`]: {
		start: number
		end: number
	}
}): OnRange {
	const handlers = Object.entries(config).map(([id, { start, end }]) => {
		return createElementHandler({
			id,
			start,
			end,
		})
	})
	const onRange: OnRange = data => {
		for (let i = 0; i < handlers.length; i++) {
			const handler = handlers[i]
			handler(data)
		}
	}

	return onRange
}

// videoOnScroll({
// 	url: 'https://tilda.ws/video_test/drawing_4_1_3.mp4',
// 	scrollSize: 4000,
// 	onScroll: getEventHandler({
// 		id: '#test',
// 		start: 200,
// 		end: 400,
// 	}),
// })
