import chokidar from 'chokidar'
import { chiriwatch } from './chiri'
import Server from './server/Server'
import _static from './static'
import { tsWatch } from './ts'
import Hash from './utility/Hash'
import Task from './utility/Task'
import { weavewatch } from './weaving'

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))

export default Task('watch', async task => {
	chokidar.watch(['static/**/*'], { ignoreInitial: true })
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		.on('all', async (event, path) => true
			&& (await Hash.fileChanged(path))
			&& task.debounce(_static, path))

	chokidar.watch(['docs/style/index.*'], { ignoreInitial: true })
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		.on('all', async (event, path) => {
			await sleep(10)
			if (!await Hash.fileChanged(path))
				return

			emitStyleUpdate()
		})

	chokidar.watch(['docs/lang/**/*.js'], { ignoreInitial: true })
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		.on('all', async (event, path) => {
			await sleep(100)
			if (!await Hash.fileChanged(path))
				return

			emitLangUpdate()
		})

	await task.run(task.parallel(chiriwatch, weavewatch, tsWatch))
})

let lastStyleUpdateEmit = 0
function emitStyleUpdate () {
	const now = Date.now()
	const elapsed = now - lastStyleUpdateEmit
	if (elapsed < 200)
		return

	lastStyleUpdateEmit = now
	Server.sendMessage('updateStyle', null)
}

let lastLangUpdateEmit = 0
function emitLangUpdate () {
	const now = Date.now()
	const elapsed = now - lastLangUpdateEmit
	if (elapsed < 200)
		return

	lastLangUpdateEmit = now
	Server.sendMessage('updateLang', null)
}
