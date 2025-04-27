import type Component from 'ui/Component'
import type { ComponentName } from 'ui/utility/StyleManipulator'
import type { ArrayOr } from 'utility/Arrays'
import Arrays from 'utility/Arrays'
import type { StateOr, UnsubscribeState } from 'utility/State'
import State from 'utility/State'

interface TypeManipulator<HOST, TYPE extends string> {
	readonly state: State<ReadonlySet<TYPE>>
	(...types: TYPE[]): HOST
	remove (...types: TYPE[]): HOST
	toggle (has: boolean, ...types: TYPE[]): HOST
}

const TypeManipulator = Object.assign(
	function <HOST, TYPE extends string> (host: HOST, onAdd: (types: TYPE[]) => unknown, onRemove: (types: TYPE[]) => unknown): TypeManipulator<HOST, TYPE> {
		const state = State(new Set<TYPE>())
		return Object.assign(
			add,
			{
				state,
				remove,
				toggle (has: boolean, ...types: TYPE[]) {
					if (has)
						return add(...types)
					else
						return remove(...types)
				},
			},
		)

		function add (...types: TYPE[]) {
			const typesSize = state.value.size
			const newTypes = types.filter(type => !state.value.has(type))
			for (const type of newTypes)
				state.value.add(type)

			onAdd(newTypes)

			if (state.value.size !== typesSize)
				state.emit()

			return host
		}

		function remove (...types: TYPE[]) {
			const typesSize = state.value.size
			const oldTypes = types.filter(type => state.value.has(type))

			for (const type of oldTypes)
				state.value.delete(type)

			onRemove(oldTypes)

			if (state.value.size !== typesSize)
				state.emit()

			return host
		}
	},
	{
		Style: TypeManipulatorStyle,
	}
)

function TypeManipulatorStyle<HOST extends Component, TYPE extends string> (host: HOST, toComponentName: (type: TYPE) => ComponentName): TypeManipulator<HOST, TYPE>
function TypeManipulatorStyle<HOST extends Component, TYPE extends string> (host: HOST, applyTo: [StateOr<ArrayOr<Component>>, (type: TYPE) => ComponentName][]): TypeManipulator<HOST, TYPE>
function TypeManipulatorStyle<HOST extends Component, TYPE extends string> (host: HOST, applyToIn: [StateOr<ArrayOr<Component>>, (type: TYPE) => ComponentName][] | ((type: TYPE) => ComponentName)) {
	const applyTo = Array.isArray(applyToIn) ? applyToIn : [[host, applyToIn] as const]

	const currentTypes: TYPE[] = []
	let unown: UnsubscribeState | undefined
	return TypeManipulator<HOST, TYPE>(host,
		types => {
			currentTypes.push(...types)
			currentTypes.distinctInPlace()

			unown?.()
			const owner = State.Owner.create()
			unown = owner.remove

			for (const [components, toComponentName] of applyTo) {
				if (State.is(components)) {
					components.use(owner, components => {
						for (const component of Arrays.resolve(components))
							for (const type of currentTypes)
								component.style(toComponentName(type))
					})
					continue
				}

				for (const type of types)
					for (const component of Arrays.resolve(components))
						component.style(toComponentName(type))
			}
		},
		types => {
			currentTypes.filterInPlace(type => !types.includes(type))

			for (const type of types)
				for (let [components, toComponentName] of applyTo) {
					if (State.is(components))
						components = components.value

					for (const component of Arrays.resolve(components))
						component.style.remove(toComponentName(type))
				}
		},
	)
}

export default TypeManipulator
