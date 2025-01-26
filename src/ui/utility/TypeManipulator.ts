import type Component from 'ui/Component'
import type { ComponentName } from 'ui/utility/StyleManipulator'
import State from 'utility/State'

interface TypeManipulator<HOST, TYPE extends string> {
	readonly state: State<ReadonlySet<TYPE>>
	(...types: TYPE[]): HOST
	remove (...types: TYPE[]): HOST
}

const TypeManipulator = Object.assign(
	function <HOST, TYPE extends string> (host: HOST, onAdd: (types: TYPE[]) => unknown, onRemove: (types: TYPE[]) => unknown): TypeManipulator<HOST, TYPE> {
		const state = State(new Set<TYPE>())
		return Object.assign(
			(...types: TYPE[]) => {
				const typesSize = state.value.size
				const newTypes = types.filter(type => !state.value.has(type))
				for (const type of newTypes)
					state.value.add(type)

				onAdd(newTypes)

				if (state.value.size !== typesSize)
					state.emit()

				return host
			},
			{
				state,
				remove (...types: TYPE[]) {
					const typesSize = state.value.size
					const oldTypes = types.filter(type => state.value.has(type))

					for (const type of oldTypes)
						state.value.delete(type)

					onRemove(oldTypes)

					if (state.value.size !== typesSize)
						state.emit()

					return host
				},
			},
		)
	},
	{
		Style: <HOST extends Component, TYPE extends string> (host: HOST, toComponentName: (type: TYPE) => ComponentName) => TypeManipulator<HOST, TYPE>(host,
			types => {
				for (const type of types)
					host.style(toComponentName(type))
			},
			types => {
				for (const type of types)
					host.style.remove(toComponentName(type))
			},
		),
	}
)

export default TypeManipulator
