import Env from "./utility/Env"
import Task from "./utility/Task"

export default Task("chiri", () =>
	Task.cli("chiri", "style/index.chiri", "--out", "docs", "--out-dts", "src"))

export const chiriwatch = Task("chiriwatch", () =>
	Task.cli(
		{
			env: {
				CHIRI_ENV: Env.CHIRI_ENV,
				CHIRI_STACK_LENGTH: Env.CHIRI_STACK_LENGTH,
				CHIRI_AST: Env.CHIRI_AST,
				CHIRI_INSPECT: Env.CHIRI_INSPECT,
				CHIRI_INSPECT_PORT: Env.CHIRI_INSPECT_PORT,
			},
		},
		"chiri", "style/index.chiri", "--out", "docs", "--out-dts", "src", "-w"))
