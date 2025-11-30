import * as fs from 'fs/promises'
import { Task } from 'task'

export default Task('install', async task => {
	await task.install(
		{
			path: '.',
			devDependencies: {
				task: { repo: 'chirivulpes/task', branch: 'package' },
				lint: { repo: 'fluff4me/lint' },
				chiri: { repo: 'fluff4me/chiri', branch: 'package' },
				weaving: { repo: 'chirivulpes/weaving', branch: 'package' },
			},
		},
		{
			path: 'src',
			devDependencies: {
				'api.fluff4.me': { name: 'api.fluff4.me' },
			},
		}
	)

	const typesPath = 'src/node_modules/api.fluff4.me/index.d.ts'
	const types = await fs.readFile(typesPath, 'utf8')
	await fs.writeFile(typesPath, types
		.replace('interface ErrorResponse ', 'interface ErrorResponse<T = any> '))
})
