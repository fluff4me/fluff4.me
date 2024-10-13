import type { Quilt } from "lang/en-nz"
import quilt from "lang/en-nz"
import type Component from "ui/Component"
import type { UnsubscribeState } from "utility/State"
import State from "utility/State"

interface StringApplicator<HOST extends Component> {
	state: State<string>
	set (value: string): HOST
	use (translation: Quilt.SimpleKey | Quilt.Handler): HOST
	bind (state: State<string>): HOST
	unbind (): HOST
	refresh (): void
}

function StringApplicator<HOST extends Component> (host: HOST, apply: (value?: string) => any): StringApplicator.Optional<HOST>
function StringApplicator<HOST extends Component> (host: HOST, defaultValue: string, apply: (value: string) => any): StringApplicator<HOST>
function StringApplicator<HOST extends Component> (host: HOST, defaultValueOrApply: string | undefined | ((value?: string) => any), apply?: (value: string) => any): StringApplicator.Optional<HOST> {
	const defaultValue = !apply ? undefined : defaultValueOrApply as string
	apply ??= defaultValueOrApply as (value?: string) => any

	let translationHandler: Quilt.Handler | undefined
	let unbind: UnsubscribeState | undefined
	const result: StringApplicator.Optional<HOST> = {
		state: State(defaultValue),
		set: value => {
			unbind?.()
			translationHandler = undefined
			setInternal(value)
			return host
		},
		use: translation => {
			unbind?.()
			if (typeof translation === "string") {
				translationHandler = undefined
				setInternal(quilt[translation]().toString())
				return host
			}

			translationHandler = translation
			result.refresh()
			return host
		},
		bind: state => {
			translationHandler = undefined
			unbind?.()
			unbind = state?.use(host, setInternal)
			if (!state)
				setInternal(defaultValue)
			return host
		},
		unbind: () => {
			unbind?.()
			setInternal(defaultValue)
			return host
		},
		refresh: () => {
			if (!translationHandler)
				return

			setInternal(translationHandler(quilt).toString())
		},
	}

	return result

	function setInternal (value?: string) {
		if (result.state.value !== value) {
			result.state.value = value
			apply!(value!)
		}
	}
}

namespace StringApplicator {

	export interface Optional<HOST extends Component> extends Omit<StringApplicator<HOST>, "state" | "set" | "bind"> {
		state: State<string | undefined>
		set (value?: string): HOST
		bind (state?: State<string | undefined>): HOST
	}

}

export default StringApplicator
