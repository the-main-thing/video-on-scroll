import { createPlayer } from './player'

const ZERO_BLOCK_RECORD_TYPE = '396'

export type OnRange = (data: {
	start: number
	end: number
	frame: number
	scroll: number
	appendChild: (element: Element) => void
	removeChild: (element: Element) => void
	inRange: (start: number, end: number, value: number) => boolean
	position: (start: number, end: number, value: number) => number
	linearGradient: (start: number, end: number, value: number) => number
	easeOutExpo: (start: number, end: number, value: number) => number
}) => void

export const playVideos = async (
	...configs: Array<{
		parent: `#${string}`
		scrollSize: number
		images: Array<string>
		content: Array<{
			id: `#${string}`
			start: number
			end: number
			handleOpacity?: boolean
		}>
	}>
) => {
	for (const { images, scrollSize, parent, content } of configs) {
		await videoOnScroll({
			images,
			scrollSize,
			parent,
			onScroll: getEventHandler(content),
		})
	}
}
;(window as any).playVideos = playVideos

const getContainer = (scrollHeight: number) => {
	const wrapper = document.createElement('div')
	const setWrapperSize = () => {
		wrapper.style.height = `${window.innerHeight + scrollHeight}px`
	}
	setWrapperSize()
	wrapper.style.position = 'relative'
	const container = document.createElement('div')
	container.style.position = 'absolute'
	container.style.top = '0px'
	container.style.left = '0px'
	container.style.width = '100vw'
	container.style.height = '100vh'
	wrapper.appendChild(container)

	const mount = (parent: Element) => {
		parent.appendChild(wrapper)
		window.addEventListener('resize', setWrapperSize)
	}
	const unmount = () => {
		wrapper.parentElement?.removeChild(wrapper)
		window.removeEventListener('resize', setWrapperSize)
	}
	const onEnterView = () => {
		container.style.position = 'fixed'
		container.style.bottom = ''
		container.style.top = '0px'
		container.style.left = '0px'
	}
	const onExitView = (side: 'top' | 'bottom') => {
		container.style.position = 'absolute'
		container.style.inset = ''
		container.style.top = ''
		container.style.bottom = ''
		container.style[side] = '0px'
		container.style.left = '0px'
	}

	const appendChild = (element: Element) => {
		container.appendChild(element)
		return () => container.removeChild(element)
	}

	const removeChild = (element: Element) => {
		try {
			container.removeChild(element)
		} catch {
			// do nothing
		}
	}

	return {
		mount,
		unmount,
		onEnterView,
		onExitView,
		appendChild,
		removeChild,
	}
}

const videoOnScroll = async ({
	images,
	scrollSize,
	onScroll,
	parent: parentId,
}: {
	images: Array<string>
	scrollSize: number
	onScroll: OnRange
	parent: `#${string}`
}) => {
	if (!images.length) {
		throw new Error('No images provided.')
	}
	const parent = document.querySelector(parentId)
	if (!parent) {
		throw new Error(`No parent element found with id: ${parentId}`)
	}

	const parentRect = parent.getBoundingClientRect()
	const startOffset = Math.floor(Math.abs(parentRect.top))

	const container = getContainer(scrollSize)
	container.mount(parent)
	const { appendChild, removeChild } = container
	const { start, canvas } = await createPlayer({
		images,
		startOffset,
		scrollSize,
		onFrameChange: ({ frame, scroll, scrollSize }) => {
			const roundedScroll = Math.round(scroll)
			if (inRange(0, scrollSize, roundedScroll)) {
				container.onEnterView()
				onScroll({
					start: 0,
					end: scrollSize,
					frame,
					scroll,
					inRange,
					appendChild,
					removeChild,
					position: traveledInRange,
					linearGradient,
					easeOutExpo,
				})
				return
			}
			if (roundedScroll > scrollSize) {
				return container.onExitView('bottom')
			}
			return container.onExitView('top')
		},
	})

	container.appendChild(canvas)

	const play = () => {
		start()
		window.requestAnimationFrame(play)
	}
	play()
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

const ELEMENTS_CONTAINERS_STORE = {} as Record<
	string,
	[HTMLDivElement, HTMLElement]
>

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
}): OnRange {
	const elementToShow = document.querySelector(id) as HTMLElement | null
	if (elementToShow) {
		elementToShow.parentElement?.removeChild(elementToShow)
		const elementContainer = document.createElement('div')
		elementContainer.style.position = 'absolute'
		elementContainer.style.width = '100vw'
		elementContainer.style.height = '100vh'
		elementContainer.style.inset = '0'
		elementContainer.style.opacity = '0'
		elementContainer.appendChild(elementToShow)
		ELEMENTS_CONTAINERS_STORE[id] = [elementContainer, elementToShow]
	}
	const elementsTuple = ELEMENTS_CONTAINERS_STORE[id]
	if (!elementsTuple) {
		console.error(`Could not find element with id: ${id}`)
		return () => void 0
	}

	const [elementContainer, element] = elementsTuple
	let elementIsOnPage = false
	const addToPage = (parent: { appendChild: (element: Element) => void }) => {
		if (!elementIsOnPage) {
			parent.appendChild(elementContainer)
			elementIsOnPage = true
		}
	}

	const removeFromPage = (parent: {
		removeChild: (element: Element) => void
	}) => {
		parent.removeChild(elementContainer)
		elementIsOnPage = false
	}

	return ({ scroll, appendChild, removeChild }) => {
		if (inRange(start, end, scroll)) {
			addToPage({ appendChild })
			if (!handleOpacity) {
				elementContainer.style.opacity = '1'
				if (element.dataset.recordType === ZERO_BLOCK_RECORD_TYPE) {
					element.style.width = '100%'
				}
				return
			}
			const opacity = easeOutExpo(start, end, scroll)
			elementContainer.style.opacity = `${opacity}`
			return
		}
		if (elementIsOnPage) {
			elementContainer.style.opacity = '0'
			removeFromPage({ removeChild })
		}
		return
	}
}

export function getEventHandler(
	config: Array<{
		id: `#${string}`
		start: number
		end: number
		handleOpacity?: boolean
	}>
): OnRange {
	const handlers = config.map(({ id, start, end, handleOpacity }) => {
		return createElementHandler({
			id,
			start,
			end,
			handleOpacity:
				typeof handleOpacity === 'boolean' ? handleOpacity : true,
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
