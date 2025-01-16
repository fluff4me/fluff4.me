// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="server/util/https-localhost.d.ts" />

import ansi from 'ansicolor'
import https from 'https'
import { getCerts } from 'https-localhost/certs'
import os from 'os'
import Router from './server/Router'
import { ROOT } from './server/util/SendFile'
import Env from './utility/Env'
import Log from './utility/Log'
import Task from './utility/Task'

export default Task('serve', async () => {
	const server = https.createServer(
		{
			...await getCerts(process.env.HOST || 'localhost'),
		},
		Router,
	)

	const port = +Env.PORT! || 8095
	await new Promise<void>(resolve => server.listen(port, resolve))

	Log.info('Listening on port', ansi.lightGreen(port))

	const networkInterfaces = os.networkInterfaces()
	Log.info('Serving', ansi.cyan(ROOT), 'on:', ...(Env.HOSTNAME ? [Env.HOSTNAME]
		: Object.values(networkInterfaces)
			.flatMap(interfaces => interfaces)
			.filter((details): details is os.NetworkInterfaceInfoIPv4 => details?.family === 'IPv4')
			.map(details => details.address))
		.map(hostname => ansi.darkGray(`https://${hostname}:${port}`)))
})
