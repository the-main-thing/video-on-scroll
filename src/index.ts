import { createPlayer } from './player'

const ZERO_BLOCK_RECORD_TYPE = '396'

export type OnRange = (data: {
	start: number
	end: number
	frame: number
	scroll: number
	inRange: (start: number, end: number, value: number) => boolean
	position: (start: number, end: number, value: number) => number
	linearGradient: (start: number, end: number, value: number) => number
	easeOutExpo: (start: number, end: number, value: number) => number
}) => void
;(window as any).videoOnScroll = videoOnScroll
;(window as any).getEventHandler = getEventHandler

const canvasGetter = canvasCreator()

export default async function videoOnScroll({
	images,
	scrollSize,
	onScroll,
}: {
	images: Array<string>
	scrollSize: number
	onScroll: OnRange
}) {
	if (!images.length) {
		throw new Error('No images provided.')
	}
	const totalFrames = images.length
	const lastFrame = totalFrames - 1
	const { start, canvas } = await createPlayer({
		images,
		scrollSize,
		onFrameChange: ({ frame, scroll }) => {
			onScroll({
				start: 0,
				end: lastFrame,
				frame,
				scroll,
				inRange,
				position: traveledInRange,
				linearGradient,
				easeOutExpo,
			})
			if (scroll >= scrollSize) {
				return onEnd(canvas, scroll)
			}
			return onStart(canvas)
		},
	})

	const heightSetter = createHeigthSetter(scrollSize)
	const container = document.createElement('div')
	container.style.position = 'relative'
	container.append(heightSetter)
	mount(container, canvas)
	window.scrollTo(0, 0)
	start()
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

function mount(container: HTMLElement, canvas: HTMLCanvasElement) {
	const videoContainer = document.createElement('div')
	videoContainer.style.display = 'flex'
	videoContainer.style.alignItems = 'bottom'
	videoContainer.style.position = 'fixed'
	videoContainer.style.width = '100vw'
	videoContainer.style.height = '100vh'
	videoContainer.style.inset = '0px'
	videoContainer.style.overflow = 'hidden'
	videoContainer.appendChild(canvas)
	container.appendChild(videoContainer)
	document.body.prepend(container)
}

function createHeigthSetter(scrollSize: number): HTMLDivElement {
	const heightSetter = document.createElement('div')
	heightSetter.style.position = 'absolute'
	heightSetter.style.height = window.innerHeight * 2 + scrollSize + 'px'
	return heightSetter
}

function onEnd(video: HTMLCanvasElement, scrolled: number) {
	getCanvas().unmount()
	const parent = video.parentNode as HTMLDivElement
	if (parent.style.position === 'fixed') {
		parent.style.position = 'absolute'
		parent.style.top = scrolled + 'px'
		parent.style.left = '0px'
	}
}

function onStart(video: HTMLCanvasElement) {
	getCanvas().mount()
	const parent = video.parentNode as HTMLDivElement
	if (parent.style.position === 'absolute') {
		parent.style.position = 'fixed'
		parent.style.top = 'none'
		parent.style.inset = '0px'
		parent.style.left = '0px'
	}
}

function easeOutExpo(start: number, end: number, value: number): number {
	return calculateEaseOutExpo(linearGradient(start, end, value), 0, 1, 100)
}

function calculateEaseOutExpo(
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
		removeContent: typeof removeContent
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

	function removeContent(element: HTMLElement) {
		const contentBlock = element.parentElement
		if (!contentBlock) {
			console.warn('Element marked to remove has no parentElement')
			container.removeChild(element)
			return
		}
		container.removeChild(contentBlock)
	}

	container.mount = mount
	container.unmount = unmount
	container.addContent = addContent
	container.removeContent = removeContent
	return () => container
}

function getCanvas() {
	return canvasGetter()
}

function createElementHandler({
	id,
	start,
	end,
	handleOpacity,
}: {
	id: string
	start: number
	end: number
	handleOpacity: boolean
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
	return ({ scroll }: { scroll: number }) => {
		if (inRange(start, end, scroll)) {
			container.addContent(element)
			if (!handleOpacity) {
				element.style.opacity = '1'
				return
			}
			const opacity = easeOutExpo(start, end, scroll)
			element.style.opacity = `${opacity}`
			return
		}
		element.style.opacity = '0'
		return
	}
}

export function getEventHandler(config: {
	[id: `#${string}`]: {
		start: number
		end: number
		handleOpacity?: boolean
	}
}): OnRange {
	const handlers = Object.entries(config).map(
		([id, { start, end, handleOpacity }]) => {
			return createElementHandler({
				id,
				start,
				end,
				handleOpacity:
					typeof handleOpacity === 'boolean' ? handleOpacity : true,
			})
		}
	)
	const onRange: OnRange = data => {
		for (let i = 0; i < handlers.length; i++) {
			const handler = handlers[i]
			handler(data)
		}
	}

	return onRange
}
