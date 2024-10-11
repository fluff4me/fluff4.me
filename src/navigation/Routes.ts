import type { RoutePathInput } from "navigation/Route"
import Route from "navigation/Route"
import AccountView from "ui/view/AccountView"
import DebugView from "ui/view/DebugView"
import HomeView from "ui/view/HomeView"

const Routes = [
	Route("/", HomeView.navigate),
	Route("/account", AccountView.navigate),
	Route("/debug", DebugView.navigate),
]

export default Routes

export type RoutePath = ((typeof Routes)[number] extends Route<infer PATH, any> ? PATH : never) extends infer ROUTE_PATH extends string ?

	{ [KEY in ROUTE_PATH]: RoutePathInput<KEY> } extends infer ROUTE_PATH_INPUT ?

	ROUTE_PATH_INPUT[keyof ROUTE_PATH_INPUT]

	: never
	: never
