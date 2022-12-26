import videoOnScroll, { getEventHandler } from '.'
import './style.css'

const images = Array(65)
	.fill(0)
	.map((_, index) => `/images/${String(index + 1).padStart(3, '0')}.jpg`)

videoOnScroll({
	images,
	scrollSize: 3000,
	onScroll: getEventHandler({
		'#test': {
			start: 300,
			end: 800,
			handleOpacity: false,
		},
	}),
})
