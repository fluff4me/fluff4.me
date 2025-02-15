import State from 'utility/State'

namespace BrowserListener {
	export const isWebkit = State(/AppleWebKit/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent))
}

export default BrowserListener
