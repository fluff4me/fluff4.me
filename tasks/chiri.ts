import Task from "./utility/Task"

export default Task("chiri", () =>
	Task.cli("chiri", "style/index.chiri", "--out", "docs", "--out-dts", "src"))

export const chiriwatch = Task("chiriwatch", () =>
	Task.cli(
		{
			env: {
				// makes it so chirilang watches its lib folder
				CHIRI_ENV: "dev",
			},
		},
		"chiri", "style/index.chiri", "--out", "docs", "--out-dts", "src", "-w"))
