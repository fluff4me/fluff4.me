import type { RoutePathInput } from "navigation/Route"
import Route from "navigation/Route"
import AccountView from "ui/view/AccountView"
import AuthorView from "ui/view/AuthorView"
import DebugView from "ui/view/DebugView"
import HomeView from "ui/view/HomeView"
import TagView from "ui/view/TagView"
import WorkEditView from "ui/view/WorkEditView"

const Routes = [
	Route("/debug", DebugView.navigate),

	Route("/", HomeView.navigate),

	Route("/account", AccountView.navigate),
	Route("/author/$vanity", AuthorView.navigate),

	Route("/work/new", WorkEditView.navigate),
	Route("/work/$author/$vanity/edit", WorkEditView.navigate),

	Route("/tag/$category/$name", TagView.navigate),
]

export default Routes

export type RoutePath = ((typeof Routes)[number] extends Route<infer PATH, any> ? PATH : never) extends infer ROUTE_PATH extends string ?

	{ [KEY in ROUTE_PATH]: RoutePathInput<KEY> } extends infer ROUTE_PATH_INPUT ?

	ROUTE_PATH_INPUT[keyof ROUTE_PATH_INPUT]

	: never
	: never
