import State from 'utility/State'

namespace PageListener {
	export const visible = State(document.visibilityState === 'visible')

	document.addEventListener('visibilitychange', () =>
		visible.asMutable?.setValue(document.visibilityState === 'visible'))
}

export default PageListener
