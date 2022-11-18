import videoOnScroll from '.'
import './style.css'

videoOnScroll({
	url: '/test.mp4',
	scrollSize: 400,
	// eventsOnScroll: [
	// 	({ current, getPosition }) => {
	// 		const [inRange, traveled] = getPosition(100, 200)
	// 		if (inRange) {
	// 			console.log('current', {
	// 				current,
	// 				traveled,
	// 			})
	// 		}
	// 	},
	// ],
})
