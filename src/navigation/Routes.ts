import Route from "navigation/Route"
import AccountView from "ui/view/AccountView"
import DebugView from "ui/view/DebugView"

export default [
	Route("/", AccountView.navigate),
	Route("/debug", DebugView.navigate),
]
