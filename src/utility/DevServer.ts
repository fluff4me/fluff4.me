// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../tasks/server/messages/MessageTypeRegistry.d.ts" />

import type MessageTypeRegistry from 'MessageTypeRegistry'
import Env from 'utility/Env'

interface DevServer {
	connect (): void
	onMessage<TYPE extends keyof MessageTypeRegistry> (type: TYPE, handler: NoInfer<(type: TYPE, data: MessageTypeRegistry[TYPE]) => any>): void
	close (): void
}

const handlerRegistry: Record<string, ((type: string, data: any) => void)[]> = {}
let socket: WebSocket | undefined = undefined
const DevServer: DevServer = {
	connect () {
		if (socket)
			return

		if (Env.ENVIRONMENT !== 'dev')
			return

		const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
		const wsUrl = `${wsProtocol}//${window.location.host}`

		socket = new WebSocket(wsUrl)

		socket.addEventListener('message', event => {
			try {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
				const message = JSON.parse(event.data) as { type?: string, data?: any }
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				const { type, data } = typeof message === 'object' && message !== null ? message : {}

				const handlers = handlerRegistry[type as string]
				if (!handlers?.length) {
					console.warn('No handler for devserver message type:', type)
					return
				}

				for (const handler of handlers)
					handler(type!, data)
			}
			catch {
				console.warn('Unsupported devserver message:', event.data)
			}
		})
	},
	onMessage (type, handler) {
		handlerRegistry[type] ??= []
		handlerRegistry[type].push(handler as never)
	},
	close () {
		socket?.close()
		socket = undefined
	},
}

export default DevServer
