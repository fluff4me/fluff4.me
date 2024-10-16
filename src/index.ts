import App from "App"
import Arrays from "utility/Arrays"
import applyDOMRectPrototypes from "utility/DOMRect"
import Elements from "utility/Elements"

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
void App()
