import Component from "ui/Component"
import type Toast from "ui/component/core/toast/Toast"
import type { ComponentNameType } from "ui/utility/StyleManipulator"
import Async from "utility/Async"
import Task from "utility/Task"
import Time from "utility/Time"

declare global {
	export const toast: ToastList
}

////////////////////////////////////
//#region Toast Component

interface ToastTypeManipulator<HOST> {
	(...toastTypes: ToastType[]): HOST
	remove (...toastTypes: ToastType[]): HOST
}

interface ToastExtensions {
	readonly title: Component
	readonly content: Component
	readonly type: ToastTypeManipulator<this>
}

export interface ToastComponent extends Component, ToastExtensions { }

type ToastType = ComponentNameType<"toast-type">

const ToastComponent = Component.Builder((component): ToastComponent => {
	const title = Component()
		.style("toast-title")
		.appendTo(component)

	return component
		.style("toast")
		.extend<ToastExtensions>(toast => ({
			title,
			content: undefined!,
			type: Object.assign(
				(...types: ToastType[]) => {
					for (const type of types)
						toast.style(`toast-type-${type}`)
					return toast
				},
				{
					remove (...types: ToastType[]) {
						for (const type of types)
							toast.style.remove(`toast-type-${type}`)
						return toast
					},
				},
			),
		}))
		.extendJIT("content", toast => Component()
			.style("toast-content")
			.appendTo(toast))
}).setName("Toast")

//#endregion
////////////////////////////////////

////////////////////////////////////
//#region Toast List

interface ToastListExtensions extends Record<ToastType, <PARAMS extends any[]>(toast: Toast<PARAMS>, ...params: PARAMS) => ToastComponent> {

}

interface ToastList extends Component, ToastListExtensions { }

const ToastList = Component.Builder((component): ToastList => {
	const toasts: ToastList = component
		.style("toast-list")
		.extend<ToastListExtensions>(toasts => ({
			info: add.bind(null, "info"),
			success: add.bind(null, "success"),
			warning: add.bind(null, "warning"),
		}))

	Object.assign(window, { toast: toasts })
	return toasts

	function add<PARAMS extends any[]> (type: ToastType, toast: Toast<PARAMS>, ...params: PARAMS) {
		const component = ToastComponent()
			.type(type)
			.style("toast--measuring")
			.tweak(toast.initialise, ...params)

		void lifecycle(toast, component)

		return component
	}

	async function lifecycle (toast: Toast<any[]>, component: ToastComponent) {
		const wrapper = Component().style("toast-wrapper").appendTo(toasts)
		component.style("toast--measuring").appendTo(wrapper)
		await Task.yield()
		const rect = component.rect.value
		component.style.remove("toast--measuring")
		wrapper.style.setProperty("height", `${rect.height}px`)

		await Async.sleep(toast.duration)

		component.style("toast--hide")
		wrapper.style.removeProperties("height")
		await Promise.race([
			new Promise<any>(resolve => component.event.subscribe("animationend", resolve)),
			Async.sleep(Time.seconds(1)),
		])

		return
		wrapper.remove()
	}
})

//#endregion
////////////////////////////////////

export default ToastList
