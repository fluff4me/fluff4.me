import { Middleware, Server, Task } from 'task'
import Env from './utility/Env'

declare module 'task/server/Server' {
	interface MessageTypeRegistry {
		updateStyle: null
		updateLang: null
	}
}

const _ = undefined

export default Task('serve', async task => {
	if (!Env.PORT)
		throw new Error('Must set PORT environment variable')

	if (!Env.URL_REWRITE)
		throw new Error('Must set URL_REWRITE environment variable')

	const router = Middleware((definition, req, res) => _
		?? Middleware.Static(definition, req, res)
		?? Middleware.E404(definition, req, res)
	)
	const server = await Server({
		port: +Env.PORT,
		root: 'docs',
		serverIndex: '/index.html',
		spaIndexRewrite: Env.URL_REWRITE,
		router,
	})

	await server.listen()
	server.socket()
	server.announce()

	task.watch(['docs/style/index.css', 'docs/style/index.js'], Task(null, () => {
		server.sendMessage('updateStyle', null)
	}))

	task.watch(['docs/lang/index.js'], Task(null, () => {
		server.sendMessage('updateLang', null)
	}))
})
