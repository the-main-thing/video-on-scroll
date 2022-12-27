import videoOnScroll, { getEventHandler } from '.'
import './style.css'

const images = `https://i.postimg.cc/VsT8CZDV/001.jpg
https://i.postimg.cc/YqWwfNPq/002.jpg
https://i.postimg.cc/VkPP7ry9/003.jpg
https://i.postimg.cc/6pVJFWwk/004.jpg
https://i.postimg.cc/rp8XkBwK/005.jpg
https://i.postimg.cc/26KPn3FZ/006.jpg
https://i.postimg.cc/B66r82D3/007.jpg
https://i.postimg.cc/6QYs5M8z/008.jpg
https://i.postimg.cc/4yHjPZBF/009.jpg
https://i.postimg.cc/QVLwnPzN/010.jpg
https://i.postimg.cc/c1KJ2nzP/011.jpg
https://i.postimg.cc/3rPwTw5N/012.jpg
https://i.postimg.cc/bwPNZFvj/013.jpg
https://i.postimg.cc/dV9Qrm7Z/014.jpg
https://i.postimg.cc/PqrX4pZ3/015.jpg
https://i.postimg.cc/R0sMbSLM/016.jpg
https://i.postimg.cc/0Qz9TTV7/017.jpg
https://i.postimg.cc/85xTNZY9/018.jpg
https://i.postimg.cc/C5DS1jT1/019.jpg
https://i.postimg.cc/QNWX0r93/020.jpg
https://i.postimg.cc/pXbPS1zn/021.jpg
https://i.postimg.cc/kXQ7PFvY/022.jpg
https://i.postimg.cc/NjQBs9Ns/023.jpg
https://i.postimg.cc/0yZxbk3p/024.jpg
https://i.postimg.cc/d01FdMPg/025.jpg
https://i.postimg.cc/vmNstPGT/026.jpg
https://i.postimg.cc/76JysgLV/027.jpg
https://i.postimg.cc/4yCRrm7T/028.jpg
https://i.postimg.cc/MHyJxqVf/029.jpg
https://i.postimg.cc/8kWSLB9k/030.jpg
https://i.postimg.cc/VL8cg0Pq/031.jpg
https://i.postimg.cc/7YnrWPqp/032.jpg
https://i.postimg.cc/0y51RgQr/033.jpg
https://i.postimg.cc/3xL53L41/034.jpg
https://i.postimg.cc/q7zfq82T/035.jpg
https://i.postimg.cc/KzMdrx9p/036.jpg
https://i.postimg.cc/T1vBtFFd/037.jpg
https://i.postimg.cc/GtPVVznk/038.jpg
https://i.postimg.cc/66Ck864y/039.jpg
https://i.postimg.cc/NfYWmhRb/040.jpg
https://i.postimg.cc/5N3DmP3J/041.jpg
https://i.postimg.cc/Sxx31WTM/042.jpg
https://i.postimg.cc/wj4PC7Zb/043.jpg
https://i.postimg.cc/CKZtSwVM/044.jpg
https://i.postimg.cc/wBSrBn6X/045.jpg
https://i.postimg.cc/KzBH3Qzd/046.jpg
https://i.postimg.cc/902NdTwz/047.jpg
https://i.postimg.cc/gjKtNJ3s/048.jpg
https://i.postimg.cc/ZYPQTfXN/049.jpg
https://i.postimg.cc/bNzBdxjB/050.jpg
https://i.postimg.cc/Qx0n7F8x/051.jpg
https://i.postimg.cc/Bnb7BJb5/052.jpg
https://i.postimg.cc/g27SM1LC/053.jpg
https://i.postimg.cc/k5tjLwxB/054.jpg
https://i.postimg.cc/G2wMRYQz/055.jpg
https://i.postimg.cc/tT3B4Tvb/056.jpg
https://i.postimg.cc/HnTBcgFy/057.jpg
https://i.postimg.cc/tJDDFcHm/058.jpg
https://i.postimg.cc/BZChWj1c/059.jpg
https://i.postimg.cc/gkkgGGV9/060.jpg
https://i.postimg.cc/c49XHPhv/061.jpg
https://i.postimg.cc/4xYwhw2B/062.jpg
https://i.postimg.cc/nhN2K76Z/063.jpg
https://i.postimg.cc/KYLN0j2T/064.jpg
https://i.postimg.cc/bJhRWPyB/065.jpg
`.split('\n').filter(Boolean)

// const images = Array(65)
// 	.fill(0)
// 	.map((_, index) => `/images/${String(index + 1).padStart(3, '0')}.jpg`)

videoOnScroll({
	images,
	scrollSize: 2000,
	onScroll: getEventHandler({
		'#test': {
			start: 600,
			end: 1000,
			handleOpacity: false,
		},
	}),
})
