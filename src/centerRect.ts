type Rect = {
	x: number
	y: number
}

export const centerRect = (container: Rect, child: Rect): Rect => {
	return {
		x: centerLine(container.x, child.x),
		y: centerLine(container.y, child.y),
	}
}

const centerLine = (containerLine: number, childLine: number): number => {
	return (containerLine - childLine) / 2
}
