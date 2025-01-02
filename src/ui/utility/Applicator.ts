import type Component from "ui/Component"
import type { UnsubscribeState } from "utility/State"
import State from "utility/State"

interface Applicator<HOST, T> {
	readonly state: State<T>
	set (value: T): HOST
	bind (state: State<T>): HOST
	unbind (): HOST
	rehost<NEW_HOST> (newHost: NEW_HOST): Applicator<NEW_HOST, T>
}

function Applicator<HOST, T> (host: HOST, apply: (value?: T) => any): Applicator.Optional<HOST, T>
function Applicator<HOST, T> (host: HOST, defaultValue: T, apply: (value: T) => any): Applicator<HOST, T>
function Applicator<HOST, T> (host: HOST, defaultValueOrApply: T | undefined | ((value?: T) => any), apply?: (value: T) => any): Applicator.Optional<HOST, T> {
	const defaultValue = !apply ? undefined : defaultValueOrApply as T
	apply ??= defaultValueOrApply as (value?: T) => any

	let unbind: UnsubscribeState | undefined
	const result = makeApplicator(host)
	return result

	function makeApplicator<HOST> (host: HOST): Applicator.Optional<HOST, T> {
		return {
			state: State(defaultValue),
			set: value => {
				unbind?.()
				setInternal(value)
				return host
			},
			bind: state => {
				unbind?.()
				unbind = state?.use(host as Component, setInternal)
				if (!state)
					setInternal(defaultValue)
				return host
			},
			unbind: () => {
				unbind?.()
				setInternal(defaultValue)
				return host
			},
			rehost: makeApplicator,
		}
	}

	function setInternal (value?: T | null) {
		if (result.state.value !== value) {
			result.state.value = value
			apply!(value!)
		}
	}
}

namespace Applicator {

	export interface Optional<HOST, T> extends Omit<Applicator<HOST, T>, "state" | "set" | "bind" | "rehost"> {
		state: State<T | undefined | null>
		set (value?: T | null): HOST
		bind (state?: State<T | undefined | null>): HOST
		rehost<NEW_HOST> (newHost: NEW_HOST): Applicator.Optional<NEW_HOST, T>
	}

}

export default Applicator

