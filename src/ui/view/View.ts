import type style from "style"
import Component from "ui/Component"

interface ViewExtensions {
}

interface View extends Component, ViewExtensions { }

type ViewId = keyof { [KEY in keyof typeof style as KEY extends `view-type-${infer ID}` ? ID : never]: string[] }

const View = Component.Builder((_, id: ViewId): View => Component()
	.style("view", `view-type-${id}`)
	.extend<ViewExtensions>(view => ({})))

export default View
