import Task from './utility/Task'

export default Task('weave', async () => {
	await Task.cli('NPM:weaving', './lang/en-nz/index.quilt', '--out', './docs', '--outTypes', './src', '--outWhitespace')
})

export const weavewatch = Task('weavewatch', () =>
	Task.cli(
		{
			env: {
			},
		},
		'NPM:weaving', './lang/en-nz/index.quilt', '--watch', '--out', './docs', '--outTypes', './src', '--outWhitespace'))
