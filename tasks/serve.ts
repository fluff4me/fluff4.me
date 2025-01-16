import Server from './server/Server'
import Task from './utility/Task'

export default Task('serve', async () => {
	const server = await Server()
	await server.listen()
	server.socket()
	server.announce()
})
