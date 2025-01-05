import chiri from './chiri'
import env from './env'
import _static from './static'
import ts from './ts'
import Task from './utility/Task'
import vendor from './vendor'
import weaving from './weaving'

export default Task('pre_watch_build', task => task.series(
	task.parallel(chiri, weaving, vendor, _static),
	_ => task.try(ts),
	env,
))
