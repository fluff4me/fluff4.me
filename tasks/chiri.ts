import Task from "./utility/Task"

export default Task("chiri", () =>
	Task.cli("chiri", "style/index.chiri", "--out", "docs", "--out-es", "docs/js", "--out-dts", "src"))

export const chiriwatch = Task("chiriwatch", () =>
	Task.cli("chiri", "style/index.chiri", "--out", "docs", "--out-es", "docs/js", "--out-dts", "src", "-w"))
