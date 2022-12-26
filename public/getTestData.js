const https = require('https')
const fs = require('fs')
const path = require('path')

/**
 *
 * @param url - the url where we have our file
 * @param fileFullPath - the full file path where we want to store our image
 * @return {Promise<>}
 */
const downloadFile = async (url, fileFullPath) => {
	console.info('downloading file from url: ' + url)
	return new Promise(resolve => {
		https
			.get(url, resp => {
				// chunk received from the server
				resp.on('data', chunk => {
					fs.appendFileSync(fileFullPath, chunk)
				})

				// last chunk received, we are done
				resp.on('end', () => {
					resolve('File downloaded and stored at: ' + fileFullPath)
				})
			})
			.on('error', _ => {})
	})
}

const main = async () => {
	const promises = []
	for (let i = 0; i < 65; i++) {
		const filename = `${String(i + 1).padStart(3, '0')}.jpg`
		promises.push(
			downloadFile(
				`https://torebentsen.com/canairi/sq1/${filename}`,
				path.resolve(__dirname, path.join('images', filename))
			)
		)
	}
	await Promise.all(promises)
	console.log('\nDone!\n')
}

main()
