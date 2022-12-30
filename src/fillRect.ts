export const fillRect = (
	container: { x: number; y: number },
	child: { x: number; y: number }
): { x: number; y: number } => {
	const containerRatio = container.x / container.y
	const childRatio = child.x / child.y
	if (!childRatio || !containerRatio) {
		return container
	}

	// horizontal
	if (containerRatio >= 1 && childRatio >= 1) {
		return {
			x: container.x,
			y: container.x / childRatio,
		}
	}

	// Vertical, horizontal
	if (containerRatio <= 1 && childRatio >= 1) {
		return {
			x: container.y / childRatio,
			y: container.y,
		}
	}

	// Horizontal, vertical
	if (containerRatio >= 1 && childRatio <= 1) {
		return {
			x: container.x,
			y: container.x / childRatio,
		}
	}

	// vertical
	if (containerRatio <= 1 && childRatio <= 1) {
		return {
			x: container.y / childRatio,
			y: container.y,
		}
	}

	throw new Error(
		`Unexpected condition. ${JSON.stringify(
			{ container, child, containerRatio, childRatio },
			null,
			2
		)}`
	)
}
