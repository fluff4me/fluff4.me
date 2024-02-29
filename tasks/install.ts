import Task from "./utility/Task";

export default Task("install", async () => {
	await Task.cli({ cwd: "src" }, "PATH:npm", "install");
});
