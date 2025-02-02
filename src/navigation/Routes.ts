import type { RoutePathInput } from 'navigation/Route'
import Route from 'navigation/Route'
import AccountView from 'ui/view/AccountView'
import AuthorView from 'ui/view/AuthorView'
import ChapterEditView from 'ui/view/ChapterEditView'
import ChapterView from 'ui/view/ChapterView'
import DebugView from 'ui/view/DebugView'
import FeedView from 'ui/view/FeedView'
import HistoryView from 'ui/view/HistoryView'
import NewView from 'ui/view/NewView'
import NotificationsView from 'ui/view/NotificationsView'
import TagView from 'ui/view/TagView'
import HomeView from 'ui/view/TestView'
import WorkEditView from 'ui/view/WorkEditView'
import WorkView from 'ui/view/WorkView'
import Env from 'utility/Env'

const Routes = [
	Route('/debug', DebugView.navigate),

	Route('/', Env.isDev ? NewView.navigate : HomeView.navigate),
	Route('/feed', FeedView.navigate),
	Route('/history', HistoryView.navigate),

	Route('/account', AccountView.navigate),
	Route('/author/$vanity', AuthorView.navigate),
	Route('/notifications', NotificationsView.navigate),

	Route('/work/new', WorkEditView.navigate),
	Route('/work/$author/$vanity', WorkView.navigate),
	Route('/work/$author/$vanity/edit', WorkEditView.navigate),

	Route('/work/$author/$work/chapter/new', ChapterEditView.navigate),
	Route('/work/$author/$work/chapter/$url', ChapterView.navigate),
	Route('/work/$author/$work/chapter/$url/edit', ChapterEditView.navigate),

	Route('/tag/$category/$name', TagView.navigate),
	Route('/tag/$custom_name', TagView.navigate),
]

export default Routes

export type RoutePath = ((typeof Routes)[number] extends Route<infer PATH, any> ? PATH : never) extends infer ROUTE_PATH extends string ?

	{ [KEY in ROUTE_PATH]: RoutePathInput<KEY> } extends infer ROUTE_PATH_INPUT ?

	ROUTE_PATH_INPUT[keyof ROUTE_PATH_INPUT]

	: never
	: never
