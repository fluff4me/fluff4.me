import type { ComponentBrand } from "ui/Component"
import Component from "ui/Component"
import type Input from "ui/component/core/extension/Input"
import Form from "ui/component/core/Form"
import View from "ui/view/View"
import type { UnsubscribeState } from "utility/State"
import State from "utility/State"

interface LabelExtensions {
	for: State<string | undefined>
	setFor (inputName?: string): this
	setRequired (required?: boolean | State<boolean>): this
	setInput (input?: Input): this
}

interface Label extends Component, LabelExtensions { }

const Label = Component.Builder("label", (label): Label => {
	label.style("label")

	let requiredState: State<boolean> | undefined
	return label
		.extend<LabelExtensions>(label => ({
			for: State(undefined),
			setFor: inputName => {
				label.attributes.set("for", inputName)
				label.for.value = inputName
				return label
			},
			setRequired: (required = true) => {
				label.style.unbind(requiredState)
				requiredState = undefined
				if (typeof required === "boolean")
					label.style.toggle("label-required")
				else
					label.style.bind(requiredState = required, "label-required")
				return label
			},
			setInput: input => {
				if (!label.is(AutoLabel))
					label.setFor(input?.name.value)

				label.setRequired(input?.required)
				return label
			},
		}))
})

export default Label


interface AutoLabelExtensions extends ComponentBrand<"autolabel"> {
}

export interface AutoLabel extends Label, AutoLabelExtensions { }

let globalI = 0
export const AutoLabel = Component.Builder("label", (component): AutoLabel => {
	const i = globalI++

	const label = component.and(Label)

	let formName: string | undefined
	let viewPath: string | undefined

	let unuseFormName: UnsubscribeState | undefined

	label.receiveAncestorInsertEvents()
	label.event.subscribe(["insert", "ancestorInsert"], () => {
		unuseFormName?.()

		const form = label.closest(Form)
		unuseFormName = form?.name.use(label, name => formName = name)

		const view = label.closest(View)
		viewPath = view ? location.pathname.slice(1).replaceAll("/", "-") : "_"

		updateFor()
	})
	label.text.state.use(label, () => updateFor())

	return label.extend<AutoLabelExtensions>(label => ({}))

	function updateFor () {
		const text = label.text.state.value.toString().toLowerCase().replace(/\W+/g, "-")
		if (!formName)
			label.setFor(`${viewPath}--${text}--${i}`)
		else
			label.setFor(`${viewPath}--${formName}--${text}`)
	}
})
