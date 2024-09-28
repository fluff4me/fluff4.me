import ansi from "ansicolor"
import Env from "./utility/Env"
import Log from "./utility/Log"
import Task from "./utility/Task"

export default Task("install", async () => {
	await Task.cli({ cwd: "src" }, "PATH:npm", "install")
	if (Env.ENVIRONMENT === "dev") {
		Log.info(`Installing ${ansi.lightCyan("api.fluff4.me@latest")}...`)
		await Task.cli({ cwd: "src" }, "PATH:npm", "install", "api.fluff4.me@latest")
	}
})
