import { Task } from 'task'
import chiri from './chiri'
import compress from './compress'
import env from './env'
import _static from './static'
import ts from './ts'
import vendor from './vendor'
import weaving from './weaving'

export default Task('build', task => task.series(
	task.parallel(chiri, weaving, vendor, _static),
	ts,
	env,
	compress,
))
