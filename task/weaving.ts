import { Task } from 'task'

export default Task('weave', async task => {
	await task.exec('NPM:weaving', './lang/en-nz/index.quilt', '--out', './docs', '--outTypes', './src', '--outWhitespace')
})

export const weavewatch = Task('weavewatch', task =>
	task.exec(
		{
			env: {
			},
		},
		'NPM:weaving', './lang/en-nz/index.quilt', '--watch', '--out', './docs', '--outTypes', './src', '--outWhitespace'))
