import Arrays from "utility/Arrays"
import applyDOMRectPrototypes from "utility/DOMRect"
import Elements from "utility/Elements"

// @ts-expect-error no types
import sourceMapSupport from "browser-source-map-support"
import Env from "utility/Env"
// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
sourceMapSupport.install({
	environment: "browser",
})

// view transition api fallback
const noopViewTransition: ViewTransition = {
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
Elements.applyPrototypes()

void (async () => {
	await Env.load()
	const app = await import("App")
	await app.default()
})()
