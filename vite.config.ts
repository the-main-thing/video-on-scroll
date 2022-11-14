import path from 'path'
import { defineConfig } from 'vite'

import typescript from '@rollup/plugin-typescript'

const pathResolve = (...pathStr: Array<string>) => {
	return path.resolve(__dirname, ...pathStr)
}

export default defineConfig(({ command }) => {
	if (command === 'serve') {
		return {}
	}
	return {
		mode: 'production',
		build: {
			lib: {
				entry: pathResolve('src/index.ts'),
				name: 'video-on-scroll',
				fileName: mode =>
					mode === 'umd' ? 'index.js' : `index.${mode}.js`,
				formats: ['umd', 'es'],
			},
			sourcemap: true,
			minify: true,
			rollupOptions: {
				plugins: [typescript()],
				output: {
					dir: 'dist',
				},
			},
		},
	}
})
