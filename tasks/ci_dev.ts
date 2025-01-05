import ansi from 'ansicolor'
import fs from 'fs/promises'
import path from 'path'
import Env from './utility/Env'
import Log from './utility/Log'
import Task from './utility/Task'

export default Task('ci:dev', async () => {
	if (Env.ENVIRONMENT !== 'dev')
		return

	await Task.cli('PATH:npm', 'ci')

	type Link = [name: string, path: string]
	const linkModules = (Env.NPM_LINK ?? '')
		.slice(1, -1)
		.split(' ')
		.map(module => module.split(':') as Link)
		.map(([name, modulePath]) => [name, modulePath.startsWith('"') ? modulePath.slice(1, -1) : modulePath] as Link)
		.map(([name, modulePath]) => [name, path.resolve(`../${modulePath}`)] as Link)

	const packageJsonString = await fs.readFile('./package.json', 'utf8')
	const packageLockJsonString = await fs.readFile('./package-lock.json', 'utf8')

	let error: Error | undefined
	try {
		for (const [name] of linkModules)
			await Task.cli('PATH:npm', 'uninstall', name)

		for (const [name, linkModule] of linkModules) {
			Log.info(`Linking ${ansi.lightCyan(name)}...`)
			await Task.cli('PATH:npm', 'link', linkModule, '--save')
		}
	}
	catch (err) {
		error = err as never
	}

	await fs.writeFile('./package.json', packageJsonString)
	await fs.writeFile('./package-lock.json', packageLockJsonString)

	if (error) {
		await Task.cli('PATH:npm', 'ci')
		console.error(error)
		process.exit(1)
	}
})
