import ansicolor from 'ansicolor'
import Env from '../../utility/Env'
import Log from '../../utility/Log'

const _ = undefined

namespace ngrok {
	let lastStaticOrigin = Env.URL_ORIGIN!
	export function getStaticOrigin () {
		return lastStaticOrigin
	}

	let lastAPIOrigin = Env.API_ORIGIN!
	export function getAPIOrigin () {
		return lastAPIOrigin
	}

	let interval: NodeJS.Timeout | undefined
	export function watch () {
		if (interval)
			clearInterval(interval)

		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		interval = setInterval(async () => {
			interface Tunnel {
				name: string
				public_url: string
			}
			const ngrokTunnels = await fetch('http://localhost:4040/api/tunnels')
				.then(res => res.json())
				.catch(() => undefined)
				.then(data => (data as { tunnels: Tunnel[] } | undefined)?.tunnels)

			const staticOrigin = _
				?? ngrokTunnels?.find(tunnel => tunnel.name === 'static.fluff4.me')?.public_url.concat('/')
				?? Env.URL_ORIGIN!

			if (lastStaticOrigin !== staticOrigin) {
				Log.info(`Serving on: ${ansicolor.lightGreen(staticOrigin)}`)
				lastStaticOrigin = staticOrigin
			}

			lastAPIOrigin = _
				?? ngrokTunnels?.find(tunnel => tunnel.name === 'api.fluff4.me')?.public_url.concat('/')
				?? Env.API_ORIGIN!
		}, 100)
	}
}

export default ngrok
