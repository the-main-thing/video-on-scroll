export type OnRange = (data: {
	start: number
	end: number
	current: number
	inRange: typeof inRange
	traveledInRange: typeof traveledInRange
}) => void

export async function videoOnScroll({
	video: videoSelector,
	scrollSize,
	eventsOnTime,
	eventsOnScroll,
}: {
	video: string | HTMLVideoElement
	scrollSize: number
	eventsOnTime?: Array<OnRange>
	eventsOnScroll?: Array<OnRange>
}) {
	const video =
		typeof videoSelector === 'string'
			? (document.querySelector(videoSelector) as HTMLVideoElement)
			: videoSelector
	if (!video) {
		if (typeof videoSelector === 'string') {
			throw new Error(
				`Could not find video element using selector: "${videoSelector}"`
			)
		}
		throw new Error(
			'No video passed. Should pass video as a css selector or a HTMLElement'
		)
	}

	if (video.nodeName.toLowerCase() !== 'video') {
		if (typeof videoSelector === 'string') {
			throw new Error(
				`Element found using css selector "${videoSelector}" is not a \`<video>\` HTML tag.`
			)
		}
		throw new Error('Element passed as video is not an HTMLVideoElement')
	}

	// Set up video attributes
	video.setAttribute('tabindex', '0')
	video.setAttribute('autobuffer', '')
	video.setAttribute('preload', '')
	video.style.position = 'fixed'

	// Create height setter
	const heightSetter = document.createElement('div')
	heightSetter.style.display = 'block'
	document.body.appendChild(heightSetter)
	const windowHeight = window.innerHeight
	const scrollHeigth = windowHeight + scrollSize
	heightSetter.style.height = scrollHeigth + 'px'
	const startingPosition = heightSetter.getBoundingClientRect().top

	await waitForLoad(video)

	let lastPosition = startingPosition
	const playbackSpeed = Math.floor(scrollSize / video.duration)
	const scrollPlay = () => {
		const scrolled =
			startingPosition - heightSetter.getBoundingClientRect().top
		const frameNumber = window.pageYOffset / playbackSpeed
		video.currentTime = frameNumber
		if (lastPosition !== scrolled) {
			if (eventsOnScroll?.length) {
				const data = {
					start: 0,
					end: scrollSize,
					current: scrolled,
					inRange,
					traveledInRange,
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
					inRange,
					traveledInRange,
				}
				for (let i = 0; i < eventsOnTime.length; i++) {
					const onTimeHandler = eventsOnTime[i]
					onTimeHandler(data)
				}
			}
		}
		lastPosition = scrolled
		window.requestAnimationFrame(scrollPlay)
	}

	window.requestAnimationFrame(scrollPlay)
}

function inRange(start: number, end: number, current: number): boolean {
	return current >= start && current <= end
}

function traveledInRange(start: number, end: number, current: number): number {
	const rangeSize = end - start
	const currentPositionInRange = current - start
	return (rangeSize / 100) * currentPositionInRange
}

async function waitForLoad(video: HTMLVideoElement): Promise<void> {
	await Promise.all([
		new Promise<void>(resolve => {
			let loadedCounter = 0
			const addEventListener = (
				eventName: keyof HTMLVideoElementEventMap
			) => {
				loadedCounter += 1
				const callback = () => {
					loadedCounter -= 1
					if (loadedCounter === 0) {
						window.removeEventListener(eventName, callback)
						return resolve()
					}
				}
				video.addEventListener(eventName, callback)
			}

			if (video.readyState > 2) {
				return resolve()
			}
			addEventListener('loadedmetadata')
		}),
		loadVideo(video),
	])
}

function loadVideo(video: HTMLVideoElement): Promise<void> {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest()
		const url = new URL(video.src)
		xhr.open('GET', url, true)
		xhr.responseType = 'arraybuffer'
		xhr.onloadend = () => resolve()
		xhr.onerror = () =>
			reject(new Error(`Error loading video: ${xhr.status}`))
		xhr.send()
	})
}
