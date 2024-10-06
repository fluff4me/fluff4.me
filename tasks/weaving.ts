import Task from "./utility/Task"

export default Task("weave", () =>
	Task.cli("weaving", "./lang", "--out", "./docs", "--outTypes", "./src"))

export const weavewatch = Task("weavewatch", () =>
	Task.cli(
		{
			env: {
			},
		},
		"weaving", "./lang", "--watch", "--out", "./docs", "--outTypes", "./src"))
