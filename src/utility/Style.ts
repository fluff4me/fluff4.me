import State from 'utility/State'
import Task from 'utility/Task'

namespace Style {

	export const properties = State.JIT(() => window.getComputedStyle(document.documentElement))

	const measured: Record<string, State<number>> = {}
	export function measure (property: string): State<number> {
		if (measured[property])
			return measured[property]

		return properties.mapManual(properties => {
			const value = properties.getPropertyValue(property)
			const element = document.createElement('div')
			element.style.width = value
			element.style.pointerEvents = 'none'
			element.style.opacity = '0'
			document.body.appendChild(element)
			const state = measured[property] = State(0)
			void Task.yield().then(() => {
				state.value = element.clientWidth
				element.remove()
			})
			return measured[property]
		})
	}

	export async function reload (path: string) {
		const oldStyle = document.querySelector(`link[rel=stylesheet][href^="${path}"]`)
		const style = document.createElement('link')
		style.rel = 'stylesheet'
		style.href = `${path}?${Date.now()}`
		return new Promise<void>((resolve, reject) => {
			style.onload = () => resolve()
			style.onerror = reject
			document.head.appendChild(style)
		}).finally(() => oldStyle?.remove())
	}
}

export default Style
