import type style from "style"
import Component from "ui/Component"
import Async from "utility/Async"

export const VIEW_HIDE_TIME = 500

interface ViewExtensions {
	hide (this: View): Promise<void>
}

interface View extends Component, ViewExtensions { }

type ViewId = keyof { [KEY in keyof typeof style as KEY extends `view-type-${infer ID}` ? ID : never]: string[] }

const View = (id: ViewId): View => Component()
	.style("view", `view-type-${id}`)
	.extend<ViewExtensions>(view => ({
		hide: async () => {
			view.style("view--hidden")
			await Async.sleep(VIEW_HIDE_TIME)
			view.remove()
		},
	}))

export default View
