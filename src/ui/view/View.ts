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

const View = (id: string): View => Component()
	.classes.add(ViewClasses.Main, `${ViewClasses.Type_}${id}`)
	.extend<ViewExtensions>({
		async hide () {
			this.classes.add(ViewClasses._Hidden)
			await Async.sleep(VIEW_HIDE_TIME)
			this.remove()
		},
	})

export default View
