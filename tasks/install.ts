import ansi from "ansicolor"
import * as fs from "fs/promises"
import Env from "./utility/Env"
import Log from "./utility/Log"
import Task from "./utility/Task"

export default Task("install", async () => {
	await Task.cli({ cwd: "src" }, "PATH:npm", "ci")
	if (Env.ENVIRONMENT === "dev") {
		Log.info(`Installing ${ansi.lightCyan("api.fluff4.me@latest")}...`)
		await Task.cli({ cwd: "src" }, "PATH:npm", "install", "api.fluff4.me@latest")
	}

	const typesPath = "src/node_modules/api.fluff4.me/index.d.ts"
	const types = await fs.readFile(typesPath, "utf8")
	await fs.writeFile(typesPath, types
		.replace("interface ErrorResponse ", "interface ErrorResponse<T = any> "))
})
