import cssnano from 'cssnano'
import * as fs from 'fs/promises'
import path from 'path'
import postcss from 'postcss'
import { Task } from 'task'
import * as terser from 'terser'
import Env from './utility/Env'

const postnano = postcss([cssnano])

async function replace (string: string, pattern: RegExp, replacer: (match: string, ...groups: string[]) => Promise<string>) {
	const matches = pattern.global
		? string.matchAll(pattern)
		: [string.match(pattern)].filter((match): match is RegExpMatchArray => match !== null)

	for (const match of [...matches].reverse()) {
		const replacement = await replacer(match[0], ...match.slice(1))
		string = string.slice(0, match.index) + replacement + string.slice(match.index! + match[0].length)
	}

	return string
}

export default Task('compress', async () => {
	let html = await fs.readFile('docs/index.html', 'utf8')

	html = await replace(html, /<link rel="stylesheet" href="([^"]+?)">/g, async (match, href) => {
		href = href.slice(Env.URL_ORIGIN?.length)
		const file = path.join('docs', href)
		let css = await fs.readFile(file, 'utf8')
		await fs.unlink(file)
		css = css.replace(/url\('\.\.\//g, `url('${Env.URL_ORIGIN}`)
		const minified = await postnano.process(css, { map: false, from: undefined })
		await fs.writeFile(`${file.slice(0, -4)}.${Env.BUILD_NUMBER}.min.css`, minified.css)
		return `<link rel="stylesheet" href="${href.slice(0, -4)}.${Env.BUILD_NUMBER}.min.css">`
	})

	html = await replace(html, /<script src="([^"]+?)"([^>]*?)><\/script>/g, async (match, src, attributes) => {
		const osrc = src
		src = src.slice(Env.URL_ORIGIN?.length)
		const file = path.join('docs', src)
		const js = await fs.readFile(file, 'utf8')
		await fs.unlink(file)
		const minified = await terser.minify(js)
		if (!minified.code) throw new Error(`Terser failed to minify ${file}`)
		await fs.writeFile(`${file.slice(0, -3)}.${Env.BUILD_NUMBER}.min.js`, minified.code)
		return `<script data-src="${osrc}" src="${osrc.slice(0, -3)}.${Env.BUILD_NUMBER}.min.js"${attributes}></script>`
	})

	html = await replace(html, /(?=<\/head>)/, async () => {
		const file = 'docs/env.json'
		const env = await fs.readFile(file, 'utf8')
		await fs.unlink(file)
		return `\t<script id="env-json" type="application/json">${env}</script>\n`
	})

	await fs.writeFile('docs/index.html', html)
})
