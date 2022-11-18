export type OnRange = (data: {
	start: number
	end: number
	current: number
	getPosition: (start: number, end: number) => ReturnType<typeof inRange>
}) => void

// videoOnScroll({
// 	url: 'https://tilda.ws/video_test/drawing_4_1_3.mp4',
// 	scrollSize: 2000,
// 	eventsOnScroll: [
// 		({ current, getPosition }) => {
// 			console.log(current)
// 			console.log(...getPosition(100, 200))
// 		},
// 	],
// })

export default async function videoOnScroll({
	url,
	scrollSize,
	eventsOnTime,
	eventsOnScroll,
}: {
	url: string | URL
	scrollSize: number
	eventsOnTime?: Array<OnRange>
	eventsOnScroll?: Array<OnRange>
}) {
	const heightSetter = createHeigthSetter(scrollSize)
	const container = createContainer()
	container.append(heightSetter)
	const video = createVideo(url)

	await waitForLoad(video)
	mount(container, video)
	window.scrollTo(0, 0)

	const heightSetterRect = heightSetter.getBoundingClientRect()
	const pxToTime = getPxToTime(video.duration, heightSetterRect.height)
	let lastPosition = window.scrollY
	const scrollPlay = () => {
		const scrolled = window.scrollY
		if (lastPosition === scrolled) {
			return window.requestAnimationFrame(scrollPlay)
		}

		const frameNumber = pxToTime(scrolled)
		if (frameNumber >= video.duration) {
			onEnd(video, scrolled)
			return window.requestAnimationFrame(scrollPlay)
		}

		if (frameNumber < 0) {
			return window.requestAnimationFrame(scrollPlay)
		}

		onStart(video)

		video.currentTime = frameNumber
		if (lastPosition !== scrolled) {
			if (eventsOnScroll?.length) {
				const data = {
					start: 0,
					end: scrollSize,
					current: scrolled,
					getPosition: (start: number, end: number) =>
						inRange(start, end, scrolled),
				}
				for (let i = 0; i < eventsOnScroll.length; i++) {
					const onScrollHandler = eventsOnScroll[i]
					onScrollHandler(data)
				}
			}

			if (eventsOnTime?.length) {
				const data = {
					start: 0,
					end: video.duration,
					current: frameNumber,
					getPosition: (start: number, end: number) =>
						inRange(start, end, frameNumber),
				}
				for (let i = 0; i < eventsOnTime.length; i++) {
					const onTimeHandler = eventsOnTime[i]
					onTimeHandler(data)
				}
			}
		}
		lastPosition = scrolled
		return window.requestAnimationFrame(scrollPlay)
	}

	window.requestAnimationFrame(scrollPlay)
}

function getPxToTime(duration: number, scrollLength: number) {
	const playbackSpeed = duration / (scrollLength - window.innerHeight)
	console.log({
		scrollLength,
		duration,
		playbackSpeed,
	})
	return (scrolled: number) => {
		console.log(scrolled, scrolled * playbackSpeed)
		return scrolled * playbackSpeed
	}
}

function inRange(
	start: number,
	end: number,
	current: number
): [inRange: boolean, traveledWithinRange: number] {
	return [
		current >= start && current <= end,
		traveledInRange(start, end, current),
	]
}

function traveledInRange(start: number, end: number, current: number): number {
	const rangeSize = end - start
	const currentPositionInRange = current - start
	return (rangeSize / 100) * currentPositionInRange
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
	videoContainer.style.display = 'none'
	videoContainer.style.position = 'absolute'
	videoContainer.style.top = '0'
	videoContainer.style.left = '0'
	videoContainer.style.overflow = 'hidden'
	videoContainer.style.height = window.innerHeight + 'px'
	videoContainer.style.width = window.innerWidth + 'px'
	videoContainer.appendChild(video)
	container.appendChild(videoContainer)
	document.body.prepend(container)
	setVideoStyles(video)
	videoContainer.style.display = 'block'
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

function createContainer(): HTMLDivElement {
	const container = document.createElement('div')
	container.style.position = 'relative'
	return container
}

function onEnd(video: HTMLVideoElement, scrolled: number) {
	const parent = video.parentNode as HTMLDivElement
	if (parent.style.position === 'fixed') {
		parent.style.position = 'absolute'
		parent.style.top = scrolled + 'px'
		parent.style.backgroundColor = 'red'
		parent.style.display = 'flex'
		parent.style.alignItems = 'bottom'
		if (video.style.position === 'fixed') {
			video.style.position = 'absolute'
		}
	}
}

function onStart(video: HTMLVideoElement) {
	const parent = video.parentNode as HTMLDivElement
	if (parent.style.position !== 'fixed') {
		parent.style.position = 'fixed'
		parent.style.top = '0'
		parent.style.float = 'none'
		setVideoStyles(video)
	}
}
