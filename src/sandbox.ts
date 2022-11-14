import { videoOnScroll } from '.'
import './style.css'

videoOnScroll({
	video: '#video',
	scrollSize: 1000,
	eventsOnScroll: [
		({ current, inRange, traveledInRange }) => {
			if (inRange(100, 200, current)) {
				console.log('current', {
					current,
					traveled: traveledInRange(100, 200, current),
				})
			}
		},
	],
})
