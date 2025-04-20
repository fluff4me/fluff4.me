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
import Maps from 'utility/Maps'
import Ranges from 'utility/Ranges'
import SelfScript from 'utility/SelfScript'
import SourceMapping from 'utility/SourceMapping'

SourceMapping.init()

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
Ranges.applyPrototypes()

void (async () => {
	await Env.load()
	if (Env.isDev)
		SelfScript.value = await fetch(`${Env.URL_ORIGIN}index.js`).then(response => response.text())

	const app = await import('App')
	await app.default()
})()
