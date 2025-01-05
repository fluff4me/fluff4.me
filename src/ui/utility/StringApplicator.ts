import type { Quilt as QuiltBase, Weave, WeavingArg, Weft } from 'lang/en-nz'
import quilt from 'lang/en-nz'
import type Component from 'ui/Component'
import type { StateOr, UnsubscribeState } from 'utility/State'
import State from 'utility/State'

export type Quilt = QuiltBase
export namespace Quilt {
	export type SimpleKey = QuiltBase.SimpleKey
	export type Handler = (quilt: Quilt, helper: typeof QuiltHelper) => Weave
}

export namespace QuiltHelper {
	export function renderWeave (weave: Weave): Node[] {
		return weave.content.map(renderWeft)
	}

	// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
	export function arg (arg: StateOr<WeavingArg | Quilt.SimpleKey | Quilt.Handler>) {
		if (typeof arg === 'object' && arg && 'map' in arg)
			arg = arg.value

		if (typeof arg === 'function')
			arg = arg(quilt, QuiltHelper)

		if (typeof arg === 'string' && arg in quilt)
			arg = quilt[arg as Quilt.SimpleKey]()

		return arg
	}

	function isPlaintextWeft (weft: Weft): weft is Weft & { content: string } {
		return true
			&& typeof weft.content === 'string'
	}

	function renderWeft (weft: Weft): Node {
		if (isPlaintextWeft(weft))
			return document.createTextNode(weft.content)

		let element: HTMLElement | undefined
		const tag = weft.tag?.toLowerCase()
		if (tag) {
			if (tag.startsWith('link(')) {
				const link = element = document.createElement('a')
				const href = tag.slice(5, -1)
				link.href = href
				link.addEventListener('click', event => {
					event.preventDefault()
					navigate.toRawURL(href)
				})
			}
		}

		element ??= document.createElement('span')

		if (Array.isArray(weft.content))
			element.append(...weft.content.map(renderWeft))
		else if (typeof weft.content === 'object' && weft.content)
			element.append(...renderWeave(weft.content))
		else
			element.textContent = `${weft.content ?? ''}`

		return element
	}
}

interface StringApplicator<HOST> {
	readonly state: State<string>
	set (value: string): HOST
	use (translation: Quilt.SimpleKey | Quilt.Handler): HOST
	bind (state: State<string>): HOST
	unbind (): HOST
	refresh (): void
	rehost<NEW_HOST> (newHost: NEW_HOST): StringApplicator<NEW_HOST>
}

function StringApplicator<HOST> (host: HOST, apply: (value?: string) => unknown): StringApplicator.Optional<HOST>
function StringApplicator<HOST> (host: HOST, defaultValue: string, apply: (value: string) => unknown): StringApplicator<HOST>
function StringApplicator<HOST> (host: HOST, defaultValueOrApply: string | undefined | ((value?: string) => unknown), apply?: (value: string) => unknown): StringApplicator.Optional<HOST> {
	const defaultValue = !apply ? undefined : defaultValueOrApply as string
	apply ??= defaultValueOrApply as (value?: string) => unknown

	let translationHandler: Quilt.Handler | undefined
	let unbind: UnsubscribeState | undefined
	const result = makeApplicator(host)
	return result

	function makeApplicator<HOST> (host: HOST): StringApplicator.Optional<HOST> {
		return {
			state: State(defaultValue),
			set: value => {
				unbind?.()
				translationHandler = undefined
				setInternal(value)
				return host
			},
			use: translation => {
				unbind?.()
				if (typeof translation === 'string') {
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
			refresh: () => {
				if (!translationHandler)
					return

				setInternal(translationHandler(quilt, QuiltHelper).toString())
			},
			rehost: makeApplicator,
		}
	}

	function setInternal (value?: string | Weave | null) {
		if (typeof value === 'object' && value !== null)
			value = value.toString()

		if (result.state.value !== value) {
			result.state.value = value
			apply!(value!)
		}
	}
}

namespace StringApplicator {

	export interface Optional<HOST> extends Omit<StringApplicator<HOST>, 'state' | 'set' | 'bind' | 'rehost'> {
		state: State<string | undefined | null>
		set (value?: string | null): HOST
		bind (state?: State<string | Weave | undefined | null>): HOST
		rehost<NEW_HOST> (newHost: NEW_HOST): StringApplicator.Optional<NEW_HOST>
	}

}

export default StringApplicator
