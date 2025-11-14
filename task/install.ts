import * as fs from 'fs/promises'
import path from 'path'
import { Task } from 'task'

export default Task('install', async task => {
	// await task.install(
	// 	{
	// 		path: '.',
	// 		dependencies: {
	// 			task: { repo: 'chirivulpes/task', branch: 'package' },
	// 			lint: { repo: 'fluff4me/lint' },
	// 			chiri: { repo: 'fluff4me/chiri', branch: 'package' },
	// 			weaving: { repo: 'chirivulpes/weaving', branch: 'package' },
	// 		},
	// 	},
	// 	{
	// 		path: 'src',
	// 		dependencies: {
	// 			'api.fluff4.me': { name: 'api.fluff4.me' },
	// 		},
	// 	}
	// )

	const typesPath = 'src/node_modules/api.fluff4.me/index.d.ts'
	const types = await fs.readFile(typesPath, 'utf8')
	// await fs.writeFile(typesPath, types
	// 	.replace('interface ErrorResponse ', 'interface ErrorResponse<T = any> '))

	const ents = await fs.readdir('src/endpoint', { recursive: true, withFileTypes: true })
	ents.sort((a, b) => (b.parentPath.length + b.name.length) - (a.parentPath.length + a.name.length))

	for (const ent of ents) {
		if (!ent.isFile() || ent.name.endsWith('Endpoint.ts'))
			continue

		await fs.unlink(path.join(ent.parentPath, ent.name))
	}

	for (const ent of ents) {
		if (ent.isFile())
			continue

		await fs.rmdir(path.join(ent.parentPath, ent.name))
	}

	const pathsText = types.match(/export interface Paths \{(.*?\n)\}/s)?.[1]
	for (const [, path, pathText] of pathsText?.matchAll(/\n\t"([^"]*)": \{(.*?\n\t)\}/gs) ?? []) {
		const method = pathText.match(/method: "([A-Za-z]+)"/)?.[1]
		const isNoResponse = pathText.includes('response: void')

		const pathSegments = path.slice(1)
			.split('/')
			.map(segment => segment.startsWith('{')
				? `$${segment.slice(1, -1)}`
				: segment
			)

		const dir = `src/endpoint/${pathSegments.slice(0, -1).join('/')}`
		const fileName = `Endpoint${(pathSegments
			.map(segment => `${segment[0].toUpperCase()}${(segment
				.slice(1)
				.replaceAll(/[-_\s]+([a-zA-Z0-9])/g, (_, c) => c.toUpperCase())
			)}`)
			.join('')
		)}.ts`
		const defPath = `${dir}/${fileName}`

		const defFile = `
			import Endpoint from 'endpoint/Endpoint'

			export default Endpoint('${path}', '${method?.toLowerCase()}')${isNoResponse ? '.noResponse()' : ''}
		`.replaceAll(/^\t+/gm, '').trim()

		await fs.mkdir(dir, { recursive: true })
		await fs.writeFile(defPath, defFile)
	}
})
