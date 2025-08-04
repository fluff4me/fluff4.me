import ansi from 'ansicolor'
import fs from 'fs-extra'
import { Log, Task } from 'task'
import Env from './utility/Env'

export default Task('static', async (task, file?: string) => {
	file = file?.replace(/\\/g, '/')
	if (file) {
		Log.info('Detected file change:', ansi.lightGreen(file))
	}

	while (!await fs.copy('static', 'docs')
		.then(() => true).catch(() => false));

	if (!Env.URL_ORIGIN)
		throw new Error('URL_ORIGIN env var must be set')

	const html = await fs.readFile('docs/index.html', 'utf8')

	await fs.writeFile('docs/index.html', html
		.replace(/\.\//g, Env.URL_ORIGIN))
})
