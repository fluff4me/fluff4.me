import State from 'utility/State'

namespace FontsListener {
	export const loaded = State(false)

	export async function listen () {
		await document.fonts.ready
		loaded.asMutable?.setValue(true)
	}
}

export default FontsListener
