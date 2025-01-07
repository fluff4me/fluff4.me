import ansi from 'ansicolor'
import fs from 'fs/promises'
import path from 'path'
import Env from './utility/Env'
import Log from './utility/Log'
import Task from './utility/Task'

export default Task('ci:dev', async () => {
	if (Env.ENVIRONMENT !== 'dev')
		return

	const packageJsonString = await fs.readFile('./package.json', 'utf8')

	type Link = [name: string, path: string]
	const linkModules = (Env.NPM_LINK ?? '')
		.slice(1, -1)
		.split(' ')
		.map(module => module.split(':') as Link)
		.map(([name, modulePath]) => [name, modulePath.startsWith('"') ? modulePath.slice(1, -1) : modulePath] as Link)
		.map(([name, modulePath]) => [name, path.resolve(`../${modulePath}`)] as Link)

	////////////////////////////////////
	//#region Uninstall custom stuff

	const uninstallModules = ['lint', ...linkModules.map(([name]) => name)]
	await Task.cli('NPM:PATH:npm', 'uninstall', ...uninstallModules, '--save', '--no-audit', '--no-fund')

	//#endregion
	////////////////////////////////////

	await Task.cli('NPM:PATH:npm', 'ci', '--no-audit', '--no-fund')

	////////////////////////////////////
	//#region Update lint config

	Log.info(`Fetching ${ansi.lightCyan('lint@latest')}...`)
	let response = ''
	await Task.cli({ stdout: data => response += data.toString() }, 'PATH:git', 'ls-remote', 'https://github.com/fluff4me/lint.git', 'HEAD')
	const lintSHA = response.trim().split(/\s+/)[0]
	if (!lintSHA)
		throw new Error('Failed to get SHA of latest commit of lint repository')

	Log.info(`Installing ${ansi.lightCyan(`lint#${lintSHA}`)}...`)
	const lintPackageVersionString = `github:fluff4me/lint#${lintSHA}`
	await Task.cli('NPM:PATH:npm', 'install', lintPackageVersionString, '--save-dev', '--no-audit', '--no-fund')

	//#endregion
	////////////////////////////////////

	const packageLockJsonString = await fs.readFile('./package-lock.json', 'utf8')

	////////////////////////////////////
	//#region Link local packages

	let error: Error | undefined
	try {
		for (const [name, linkModule] of linkModules) {
			Log.info(`Linking ${ansi.lightCyan(name)}...`)
			await Task.cli('NPM:PATH:npm', 'link', linkModule, '--save', '--no-audit', '--no-fund')
		}
	}
	catch (err) {
		error = err as never
	}

	//#endregion
	////////////////////////////////////

	await fs.writeFile('./package.json', packageJsonString)
	await fs.writeFile('./package-lock.json', packageLockJsonString)

	if (error) {
		await Task.cli('NPM:PATH:npm', 'ci', '--no-audit', '--no-fund')
		console.error(error)
		process.exit(1)
	}
})
