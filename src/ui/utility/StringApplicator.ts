import type { Quilt as QuiltBase, Weave, Weft } from 'lang/en-nz'
import quiltBase, { WeavingArg } from 'lang/en-nz'
import type { RoutePath } from 'navigation/RoutePath'
import type Component from 'ui/Component'
import type ExternalLinkFunction from 'ui/component/core/ExternalLink'
import type LinkFunction from 'ui/component/core/Link'
import { style } from 'ui/utility/StyleManipulator'
import DevServer from 'utility/DevServer'
import Env from 'utility/Env'
import Script from 'utility/Script'
import type { StateOr, UnsubscribeState } from 'utility/State'
import State from 'utility/State'

export let quilt!: QuiltBase
const quiltState = State(quiltBase)
Object.defineProperty(window, 'quilt', { get: () => quiltState.value })
Object.defineProperty(exports, 'quilt', { get: () => quiltState.value })

DevServer.onMessage('updateLang', async () => {
	Script.allowModuleRedefinition('lang/en-nz')
	await Script.reload(`${Env.URL_ORIGIN}lang/en-nz.js`)
	quiltState.value = await import('lang/en-nz').then(module => module.default)
})

export type Quilt = QuiltBase
export namespace Quilt {
	export type SimpleKey = QuiltBase.SimpleKey
	export type Handler = (quilt: Quilt, helper: typeof QuiltHelper) => Weave | null | undefined

	export type KeyPrefixed<PREFIX extends string> = keyof { [KEY in keyof QuiltBase as KEY extends `${PREFIX}/${infer TYPE}` ? TYPE : never]: true }

	export function fake (text: string): () => Weave {
		const weave: Weave = { content: [{ content: text }], toString: () => text }
		return () => weave
	}

	export const State = quiltState
}

type ComponentFunction = typeof Component
export namespace QuiltHelper {

	let isComponent!: (value: unknown) => value is Component
	let Component!: ComponentFunction
	let Break!: Component.Builder<[], Component>
	let Link!: typeof LinkFunction
	let ExternalLink!: typeof ExternalLinkFunction
	export function init (dependencies: {
		Component: typeof Component
		Link: typeof LinkFunction
		ExternalLink: typeof ExternalLinkFunction
	}) {
		Component = dependencies.Component
		Link = dependencies.Link
		ExternalLink = dependencies.ExternalLink

		Break = Component
			.Builder('br', component => component.style('break'))
			.setName('Break')

		isComponent = Component.is
	}

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

	export function toString (arg: StateOr<Quilt.SimpleKey | Quilt.Handler>): string {
		if (State.is(arg))
			arg = arg.value

		if (typeof arg !== 'function') {
			const key = arg
			arg = () => quilt[key]()
		}

		return arg(quilt, QuiltHelper)?.toString() ?? ''
	}

	function isPlaintextWeft (weft: Weft): weft is Weft & { content: string } {
		return true
			&& typeof weft.content === 'string'
			&& !weft.content.includes('\n')
			&& !weft.tag
	}

	export function createTagElement (tag: string): HTMLElement | undefined {
		tag = tag.toLowerCase()

		if (tag.startsWith('link(')) {
			const href = tag.slice(5, -1)
			const link = href.startsWith('/')
				? Link(href as RoutePath)
				: ExternalLink(href)

			return link.element
		}

		if (tag.startsWith('.')) {
			const className = tag.slice(1)
			if (className in style.value)
				return Component()
					.style(className as keyof typeof style.value)
					.element
		}

		if (tag.startsWith('icon.')) {
			const className = `button-icon-${tag.slice(5)}`
			if (className in style.value)
				return Component()
					.style('button-icon', className as keyof typeof style.value, 'button-icon--inline')
					.element
		}

		switch (tag) {
			case 'b': return document.createElement('strong')
			case 'i': return document.createElement('em')
			case 'u': return document.createElement('u')
			case 's': return document.createElement('s')

			case 'sm': return Component('small')
				.style('small')
				.element

			case 'supporters-only': return Component()
				.style('label-supporter')
				.text.use('shared/term/supporters')
				.element
		}
	}

	function renderWeft (weft: Weft): Node {
		if (isPlaintextWeft(weft))
			return document.createTextNode(weft.content)

		const tag = weft.tag?.toLowerCase()

		let element = !tag ? undefined : createTagElement(tag)
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
	set (value: string | Quilt.Handler): HOST
	use (translation?: Quilt.SimpleKey | Quilt.Handler): HOST
	bind (state: State<string | Quilt.Handler>): HOST
	unbind (): HOST
	/** Create a new string applicator with the same target that returns a different host */
	rehost<NEW_HOST> (newHost: NEW_HOST): StringApplicator<NEW_HOST>
}

function BaseStringApplicator<HOST> (
	host: HOST,
	defaultValue: string | undefined,
	set: (result: StringApplicator.Optional<HOST>, value?: string | Weave | null) => void,
): StringApplicator.Optional<HOST> {
	let unbind: UnsubscribeState | undefined
	let unown: UnsubscribeState | undefined
	let subUnown: UnsubscribeState | undefined
	let removed = false
	const state = State(defaultValue)
	const result = makeApplicator(host)
	const setInternal = set.bind(null, result)
	return result

	function makeApplicator<HOST> (host: HOST): StringApplicator.Optional<HOST> {
		State.Owner.getOwnershipState(host)?.matchManual(true, () => {
			removed = true
			unbind?.(); unbind = undefined
			unown?.(); unown = undefined
			subUnown?.(); subUnown = undefined
		})

		return {
			state,
			set: value => {
				if (removed)
					return host

				if (typeof value === 'function') {
					result.use(value)
					return host
				}

				unbind?.(); unbind = undefined
				unown?.(); unown = undefined
				subUnown?.(); subUnown = undefined

				setInternal(value)
				return host
			},
			use: translation => {
				if (removed)
					return host

				unbind?.(); unbind = undefined
				unown?.(); unown = undefined
				subUnown?.(); subUnown = undefined

				if (typeof translation === 'string') {
					unown = quiltState.useManual(quilt => setInternal(quilt[translation]()))
					return host
				}

				setInternal(translation?.(quilt, QuiltHelper))
				return host
			},
			bind: (state?: StateOr<string | Weave | Quilt.Handler | null | undefined>) => {
				if (removed)
					return host

				unbind?.(); unbind = undefined
				unown?.(); unown = undefined
				subUnown?.(); subUnown = undefined

				if (state === undefined || state === null) {
					setInternal(defaultValue)
					return host
				}

				if (typeof state === 'function') {
					const stateFunction = state
					const owner = State.Owner.create()
					unown = owner.remove
					state = quiltState.map(owner, quilt => stateFunction(quilt, QuiltHelper))
				}

				if (!State.is(state)) {
					setInternal(state)
					return host
				}

				unbind = state?.use(host as Component, state => {
					subUnown?.(); subUnown = undefined

					if (typeof state !== 'function')
						return setInternal(state)

					const stateFunction = state
					const subOwner = State.Owner.create()
					subUnown = subOwner.remove
					quiltState.use(subOwner, quilt => setInternal(stateFunction(quilt, QuiltHelper)))
				})
				return host
			},
			unbind: () => {
				unbind?.(); unbind = undefined
				unown?.(); unown = undefined
				subUnown?.(); subUnown = undefined
				setInternal(defaultValue)
				return host
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
			result.state.asMutable?.setValue(value)
			apply(value ?? undefined)
		}
	})
}

namespace StringApplicator {

	export interface Optional<HOST> extends Omit<StringApplicator<HOST>, 'state' | 'set' | 'bind' | 'rehost'> {
		state: State<string | undefined | null>
		set (value?: string | Quilt.Handler | null): HOST
		bind (state?: StateOr<string | Quilt.Handler | undefined | null>): HOST
		/** Create a new string applicator with the same target that returns a different host */
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

			result.state.asMutable?.setValue(valueString)
			apply(render(value))
		})
	}

}

export default StringApplicator
