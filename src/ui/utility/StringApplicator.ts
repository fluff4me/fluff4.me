import type { Quilt as QuiltBase, Weave, Weft } from 'lang/en-nz'
import quilt, { WeavingArg } from 'lang/en-nz'
import type Component from 'ui/Component'
import type { ReadonlyStateOr, UnsubscribeState } from 'utility/State'
import State from 'utility/State'

Object.assign(window, { quilt })

export type Quilt = QuiltBase
export namespace Quilt {
	export type SimpleKey = QuiltBase.SimpleKey
	export type Handler = (quilt: Quilt, helper: typeof QuiltHelper) => Weave
}

export namespace QuiltHelper {

	let isComponent!: (value: unknown) => value is Component
	let Break!: Component.Builder<[], Component>
	export function setComponent (ComponentFunction: typeof Component) {
		isComponent = ComponentFunction.is
		Break = ComponentFunction
			.Builder('br', component => component.style('break'))
			.setName('Break')
	}

	export function renderWeave (weave: Weave): Node[] {
		return weave.content.map(renderWeft)
	}

	// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
	export function arg (arg: ReadonlyStateOr<WeavingArg | Quilt.SimpleKey | Quilt.Handler>) {
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
			&& !weft.content.includes('\n')
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

			switch (tag) {
				case 'b': element = document.createElement('strong'); break
				case 'i': element = document.createElement('em'); break
				case 'u': element = document.createElement('u'); break
				case 's': element = document.createElement('s'); break
			}
		}

		element ??= document.createElement('span')

		if (Array.isArray(weft.content))
			element.append(...weft.content.map(renderWeft))
		else if (typeof weft.content === 'object' && weft.content) {
			if (!WeavingArg.isRenderable(weft.content))
				element.append(...renderWeave(weft.content))
			else if (isComponent(weft.content))
				element.append(weft.content.element)
			else if (weft.content instanceof Node)
				element.append(weft.content)
			else
				console.warn('Unrenderable weave content:', weft.content)
		}
		else {
			const value = `${weft.content ?? ''}`
			const texts = value.split('\n')
			for (let i = 0; i < texts.length; i++) {
				if (i > 0)
					element.append(Break().element)

				element.append(document.createTextNode(texts[i]))
			}
		}

		return element
	}
}

interface StringApplicator<HOST> {
	readonly state: State<string>
	set (value: string | Weave): HOST
	use (translation: Quilt.SimpleKey | Quilt.Handler): HOST
	bind (state: State<string | Weave>): HOST
	unbind (): HOST
	refresh (): void
	rehost<NEW_HOST> (newHost: NEW_HOST): StringApplicator<NEW_HOST>
}

function BaseStringApplicator<HOST> (
	host: HOST,
	defaultValue: string | undefined,
	set: (result: StringApplicator.Optional<HOST>, value?: string | Weave | null) => void,
): StringApplicator.Optional<HOST> {
	let translationHandler: Quilt.Handler | undefined
	let unbind: UnsubscribeState | undefined
	const result = makeApplicator(host)
	const setInternal = set.bind(null, result)
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
				unbind?.(); unbind = undefined

				if (state === undefined || state === null) {
					setInternal(defaultValue)
					return host
				}

				if (!State.is(state)) {
					setInternal(state)
					return host
				}

				unbind = state?.use(host as Component, setInternal)
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
}

function StringApplicator<HOST> (host: HOST, apply: (value?: string) => unknown): StringApplicator.Optional<HOST>
function StringApplicator<HOST> (host: HOST, defaultValue: string, apply: (value: string) => unknown): StringApplicator<HOST>
function StringApplicator<HOST> (host: HOST, defaultValueOrApply: string | undefined | ((value?: string) => unknown), maybeApply?: (value: string) => unknown): StringApplicator.Optional<HOST> {
	const defaultValue = !maybeApply ? undefined : defaultValueOrApply as string
	const apply = (maybeApply ?? defaultValueOrApply) as (value?: string) => unknown

	return BaseStringApplicator(host, defaultValue, (result, value) => {
		if (typeof value === 'object' && value !== null)
			value = value.toString()

		if (result.state.value !== value) {
			result.state.value = value
			apply(value ?? undefined)
		}
	})
}

namespace StringApplicator {

	export interface Optional<HOST> extends Omit<StringApplicator<HOST>, 'state' | 'set' | 'bind' | 'rehost'> {
		state: State<string | undefined | null>
		set (value?: string | Weave | null): HOST
		bind (state?: ReadonlyStateOr<string | Weave | undefined | null>): HOST
		rehost<NEW_HOST> (newHost: NEW_HOST): StringApplicator.Optional<NEW_HOST>
	}

	export function render (content?: string | Weave | null): Node[] {
		if (typeof content === 'string')
			content = { content: [{ content }] }

		return !content ? [] : QuiltHelper.renderWeave(content)
	}

	export function Nodes<HOST> (host: HOST, apply: (nodes: Node[]) => unknown): StringApplicator.Optional<HOST>
	export function Nodes<HOST> (host: HOST, defaultValue: string, apply: (nodes: Node[]) => unknown): StringApplicator<HOST>
	export function Nodes<HOST> (host: HOST, defaultValueOrApply: string | undefined | ((nodes: Node[]) => unknown), maybeApply?: (nodes: Node[]) => unknown): StringApplicator.Optional<HOST> {
		const defaultValue = !maybeApply ? undefined : defaultValueOrApply as string
		const apply = (maybeApply ?? defaultValueOrApply) as (nodes: Node[]) => unknown

		return BaseStringApplicator(host, defaultValue, (result, value) => {
			const valueString = typeof value === 'object' && value !== null ? value.toString() : value
			if (result.state.value === valueString)
				return

			result.state.value = valueString
			apply(render(value))
		})
	}

}

export default StringApplicator
