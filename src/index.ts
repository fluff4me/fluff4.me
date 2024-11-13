import Arrays from "utility/Arrays"
import applyDOMRectPrototypes from "utility/DOMRect"
import Elements from "utility/Elements"

// @ts-expect-error
import sourceMapSupport from "browser-source-map-support"
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

void import("App").then(app => app.default())
