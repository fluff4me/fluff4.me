import { readFileSync } from 'fs'
import Task from './utility/Task'

export default Task('weave', async () => {
	await Task.cli('NPM:weaving', './lang', '--out', './docs', '--outTypes', './src', '--outWhitespace')
	console.log(readFileSync('src/lang/en-nz.d.ts', 'utf8'))
})

export const weavewatch = Task('weavewatch', () =>
	Task.cli(
		{
			env: {
			},
		},
		'NPM:weaving', './lang', '--watch', '--out', './docs', '--outTypes', './src', '--outWhitespace'))
