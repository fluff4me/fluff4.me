import Arrays from 'utility/Arrays'
import applyDOMRectPrototypes from 'utility/DOMRect'
import Elements from 'utility/Elements'

declare global {
	export const _: undefined
	export function select<R> (fn: () => R): R
}

Object.assign(window, {
	_: undefined,
	select: (fn: () => unknown) => fn(),
})

import Env from 'utility/Env'
import Import from 'utility/Import'
import Maps from 'utility/Maps'

interface BrowserSourceMapSupport {
	install (options: { environment: string }): void
}

Import.getModule<BrowserSourceMapSupport>('browser-source-map-support')?.install({
	environment: 'browser',
})

// view transition api fallback
const noopViewTransition: ViewTransition = {
	types: new Set(),
	finished: Promise.resolve(undefined),
	ready: Promise.resolve(undefined),
	updateCallbackDone: Promise.resolve(undefined),
	skipTransition: () => { },
}

document.startViewTransition ??= cb => {
	cb?.()
	return noopViewTransition
}

applyDOMRectPrototypes()
Arrays.applyPrototypes()
Maps.applyPrototypes()
Elements.applyPrototypes()

void (async () => {
	await Env.load()
	const app = await import('App')
	await app.default()
})()
