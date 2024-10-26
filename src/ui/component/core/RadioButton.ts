import Component from "ui/Component"
import Checkbutton from "ui/component/core/Checkbutton"

export default Component.Builder(() => {
	const cb = Checkbutton()
	cb.ariaRole("radio")
	cb.input.attributes.set("type", "radio")
	return cb
})
