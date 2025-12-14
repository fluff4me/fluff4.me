import Route from 'navigation/Route'
import { RoutePath } from 'navigation/RoutePath'
import AboutView from 'ui/view/AboutView'
import AccountView from 'ui/view/AccountView'
import AuthorView from 'ui/view/AuthorView'
import ChapterEditView from 'ui/view/ChapterEditView'
import ChapterNewBulkView from 'ui/view/ChapterNewBulkView'
import ChapterView from 'ui/view/ChapterView'
import ContactView from 'ui/view/ContactView'
import DebugView from 'ui/view/DebugView'
import FeedView from 'ui/view/FeedView'
import FollowingView from 'ui/view/FollowingView'
import FundraiserView from 'ui/view/FundraiserView'
import HistoryView from 'ui/view/HistoryView'
import IgnoringView from 'ui/view/IgnoringView'
import LegalView from 'ui/view/LegalView'
import LoginView from 'ui/view/LoginView'
import ManageCommentsView from 'ui/view/ManageCommentsView'
import ManageTagsView from 'ui/view/ManageTagsView'
import NewView from 'ui/view/NewView'
import NotificationsView from 'ui/view/NotificationsView'
import SearchView from 'ui/view/SearchView'
// import SupporterFinishView from 'ui/view/SupporterFinishView'
import TagView from 'ui/view/TagView'
import WorkEditView from 'ui/view/WorkEditView'
import WorkView from 'ui/view/WorkView'

const Routes = [
	Route('/debug', DebugView.navigate),

	// TODO when / goes to a special homepage for logged out users, and this gets its own route
	// make sure you update SearchView's redirect
	Route('/', NewView.navigate),

	Route('/about', AboutView.navigate),
	Route('/about/$tab', AboutView.navigate),
	Route('/contact', ContactView.navigate),
	Route('/legal', LegalView.navigate),
	Route('/legal/$tab', LegalView.navigate),

	Route('/feed', FeedView.navigate),
	Route('/history', HistoryView.navigate),
	Route('/search', SearchView.navigate),

	Route('/following', FollowingView.navigate),
	Route('/following/$tab', FollowingView.navigate),
	Route('/ignoring', IgnoringView.navigate),
	Route('/ignoring/$tab', IgnoringView.navigate),

	Route('/login', LoginView.navigate),
	Route('/account', AccountView.navigate),
	Route('/account/$tab', AccountView.navigate),
	Route('/author/$author_vanity', AuthorView.navigate),
	Route('/author/$author_vanity/$tab', AuthorView.navigate),
	Route('/notifications', NotificationsView.navigate),

	Route('/work/new', WorkEditView.navigate),
	Route('/work/$author_vanity/$work_vanity', WorkView.navigate),
	Route('/work/$author_vanity/$work_vanity/edit', WorkEditView.navigate),

	Route('/work/$author_vanity/$work_vanity/chapter/new', ChapterEditView.navigate),
	Route('/work/$author_vanity/$work_vanity/chapter/new/bulk', ChapterNewBulkView.navigate),
	Route('/work/$author_vanity/$work_vanity/chapter/$chapter_url', ChapterView.navigate),
	Route('/work/$author_vanity/$work_vanity/chapter/$chapter_url/edit', ChapterEditView.navigate),

	Route('/tag/$category/$name', TagView.navigate),
	// Route('/tag/$custom_name', TagView.navigate),

	Route('/manage/tags', ManageTagsView.navigate),
	Route('/manage/comments', ManageCommentsView.navigate),
	Route('/manage/comments/$tab', ManageCommentsView.navigate),

	// Route('/supporter/finish', SupporterFinishView.navigate),

	Route('/fundraiser', FundraiserView.navigate),
]

RoutePath.setRoutes(Routes)
export default Routes
