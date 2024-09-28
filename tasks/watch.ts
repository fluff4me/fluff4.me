import chokidar from "chokidar"
import chiriwatch from "./chiri"
import _static from "./static"
import { tsWatch } from "./ts"
import Hash from "./utility/Hash"
import Task from "./utility/Task"

export default Task("watch", async task => {
	await task.run(chiriwatch)

	chokidar.watch(["static/**/*"], { ignoreInitial: true })
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		.on("all", async (event, path) => true
			&& (await Hash.fileChanged(path))
			&& task.debounce(_static, path))

	await task.run(tsWatch)
})
