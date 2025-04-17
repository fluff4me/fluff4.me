import Route from 'navigation/Route'
import { RoutePath } from 'navigation/RoutePath'
import AccountView from 'ui/view/AccountView'
import AuthorView from 'ui/view/AuthorView'
import ChapterEditView from 'ui/view/ChapterEditView'
import ChapterNewBulkView from 'ui/view/ChapterNewBulkView'
import ChapterView from 'ui/view/ChapterView'
import DebugView from 'ui/view/DebugView'
import FeedView from 'ui/view/FeedView'
import FollowingView from 'ui/view/FollowingView'
import HistoryView from 'ui/view/HistoryView'
import IgnoringView from 'ui/view/IgnoringView'
import ManageTagsView from 'ui/view/ManageTagsView'
import NewView from 'ui/view/NewView'
import NotificationsView from 'ui/view/NotificationsView'
import TagView from 'ui/view/TagView'
import WorkEditView from 'ui/view/WorkEditView'
import WorkView from 'ui/view/WorkView'

const Routes = [
	Route('/debug', DebugView.navigate),

	Route('/', NewView.navigate),
	Route('/feed', FeedView.navigate),
	Route('/history', HistoryView.navigate),

	Route('/following', FollowingView.navigate),
	Route('/ignoring', IgnoringView.navigate),

	Route('/account', AccountView.navigate),
	Route('/author/$vanity', AuthorView.navigate),
	Route('/notifications', NotificationsView.navigate),

	Route('/work/new', WorkEditView.navigate),
	Route('/work/$author/$vanity', WorkView.navigate),
	Route('/work/$author/$vanity/edit', WorkEditView.navigate),

	Route('/work/$author/$work/chapter/new', ChapterEditView.navigate),
	Route('/work/$author/$work/chapter/new/bulk', ChapterNewBulkView.navigate),
	Route('/work/$author/$work/chapter/$url', ChapterView.navigate),
	Route('/work/$author/$work/chapter/$url/edit', ChapterEditView.navigate),

	Route('/tag/$category/$name', TagView.navigate),
	// Route('/tag/$custom_name', TagView.navigate),

	Route('/manage/tags', ManageTagsView.navigate),
]

RoutePath.setRoutes(Routes)
export default Routes
