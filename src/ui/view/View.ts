import type style from "style/index"
import Component from "ui/Component"
import Async from "utility/Async"

export enum ViewClasses {
	Main = "view",
	Type_ = "view-type-",
	_Hidden = "view--hidden",
}

export const VIEW_HIDE_TIME = 500

interface ViewExtensions {
	hide (this: View): Promise<void>
}

interface View extends Component, ViewExtensions { }

type ViewId = keyof { [KEY in keyof typeof style as KEY extends `view-type-${infer ID}` ? ID : never]: string[] }

const View = (id: ViewId): View => Component()
	.style("view", `${ViewClasses.Type_}${id}`)
	.classes.add(ViewClasses.Main,)
	.extend<ViewExtensions>({
		async hide () {
			this.classes.add(ViewClasses._Hidden)
			await Async.sleep(VIEW_HIDE_TIME)
			this.remove()
		},
	})

export default View
