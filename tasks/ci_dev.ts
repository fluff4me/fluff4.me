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
	const linkModules = !Env.NPM_LINK ? [] : Env.NPM_LINK
		.slice(1, -1)
		.split(' ')
		.map(module => module.split(':') as Link)
		.map(([name, modulePath]) => [name, modulePath.startsWith('"') ? modulePath.slice(1, -1) : modulePath] as Link)
		.map(([name, modulePath]) => [name, path.resolve(`../${modulePath}`)] as Link)

	////////////////////////////////////
	//#region Uninstall custom stuff

	await Task.cli('NPM:PATH:npm', 'uninstall', 'lint', '--save', '--no-audit', '--no-fund')

	//#endregion
	////////////////////////////////////

	await Task.cli('NPM:PATH:npm', 'ci', '--no-audit', '--no-fund')

	////////////////////////////////////
	//#region Update GitHub packages

	await updateGitHubPackage('lint', 'fluff4me/lint')

	const githubPackages: [packageName: string, githubName: string, branch?: string][] = [
		['chiri', 'fluff4me/chiri', 'package'],
		['weaving', 'ChiriVulpes/weaving', 'package'],
	]

	for (const [name, path, branch] of githubPackages) {
		if (linkModules.some(([linkName]) => linkName === name))
			continue

		await updateGitHubPackage(name, path, branch)
	}

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

async function updateGitHubPackage (packageName: string, path: string, branch?: string) {
	Log.info(`Fetching ${ansi.lightCyan(`${packageName}@latest`)}...`)
	let response = ''
	const branchArg = branch ? `refs/heads/${branch}` : 'HEAD'
	await Task.cli({ stdout: data => response += data.toString() }, 'PATH:git', 'ls-remote', `https://github.com/${path}.git`, branchArg)
	const sha = response.trim().split(/\s+/)[0]
	if (!sha)
		throw new Error(`Failed to get SHA of latest commit of ${packageName} repository`)

	Log.info(`Installing ${ansi.lightCyan(`${packageName}#${sha}`)}...`)
	const packageVersionString = `github:${path}#${sha}`
	await Task.cli('NPM:PATH:npm', 'install', packageVersionString, '--save-dev', '--no-audit', '--no-fund')
}
