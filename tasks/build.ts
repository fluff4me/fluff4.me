import chiri from "./chiri"
import env from "./env"
import _static from "./static"
import ts from "./ts"
import Task from "./utility/Task"

export default Task("build", task => task.series(
	task.parallel(chiri, _static),
	ts,
	env,
))
