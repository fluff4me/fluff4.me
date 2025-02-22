// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./util/https-localhost.d.ts" />
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./messages/MessageTypeRegistry.d.ts" />

import ansi from 'ansicolor'
import https from 'https'
import { getCerts } from 'https-localhost/certs'
import type MessageTypeRegistry from 'MessageTypeRegistry'
import os from 'os'
import WebSocket from 'ws'
import Router from '../server/Router'
import { ROOT } from '../server/util/SendFile'
import Env from '../utility/Env'
import Log from '../utility/Log'
import ngrok from './util/ngrok'

interface SocketDefinition {
	onConnect?(socket: WebSocket): any
	onClose?(socket: WebSocket): any
	onMessage?: Record<string, (socket: WebSocket, data: any) => any>
	onInvalidMessageType?(socket: WebSocket, data: any): any
	onInvalidMessage?(socket: WebSocket, message: WebSocket.RawData): any
}

interface Server {
	listen (): Promise<void>
	socket (definition?: SocketDefinition): void
	announce (): void
}

const websocketConnections = new Set<WebSocket>()

const Server = Object.assign(
	async function () {
		const server = https.createServer(
			{
				...await getCerts(process.env.HOST || 'localhost'),
			},
			Router,
		)

		const port = +Env.PORT! || 8095

		const result: Server = {
			async listen () {
				if (Env.ENVIRONMENT === 'dev')
					ngrok.watch()

				return new Promise<void>(resolve => server.listen(port, resolve))
			},
			socket (definition) {
				const wss = new WebSocket.Server({ server })
				wss.on('connection', ws => {
					websocketConnections.add(ws)
					definition?.onConnect?.(ws)

					ws.on('message', message => {
						try {
							// eslint-disable-next-line @typescript-eslint/no-base-to-string
							const parsedMessage = JSON.parse(message.toString('utf8')) as { type?: string, data?: any }
							// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
							const { type, data } = typeof parsedMessage === 'object' && parsedMessage !== null ? parsedMessage : {}

							const handler = definition?.onMessage?.[type!] ?? definition?.onInvalidMessageType
							handler?.(ws, data)
						}
						catch {
							definition?.onInvalidMessage?.(ws, message)
						}
					})

					ws.on('close', () => {
						websocketConnections.delete(ws)
						definition?.onClose?.(ws)
					})
				})
			},
			announce () {
				Log.info('Listening on port', ansi.lightGreen(port))

				const networkInterfaces = os.networkInterfaces()
				Log.info('Serving', ansi.cyan(ROOT), 'on:', ...(Env.HOSTNAME ? [Env.HOSTNAME]
					: Object.values(networkInterfaces)
						.flatMap(interfaces => interfaces)
						.filter((details): details is os.NetworkInterfaceInfoIPv4 => details?.family === 'IPv4')
						.map(details => details.address))
					.map(hostname => ansi.darkGray(`https://${hostname}:${port}`)))
			},
		}

		return result
	},
	{
		sendMessage<TYPE extends keyof MessageTypeRegistry> (type: TYPE, data: NoInfer<MessageTypeRegistry[TYPE]>) {
			for (const socket of websocketConnections) {
				socket.send(JSON.stringify({
					type,
					data,
				}))
			}
		},
	},
)
export default Server
