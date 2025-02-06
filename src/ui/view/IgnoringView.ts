import Tabinator from 'ui/component/core/Tabinator'
import FollowingAuthorsTab from 'ui/view/following/FollowingAuthorsTab'
import FollowingTagsTab from 'ui/view/following/FollowingTagsTab'
import FollowingWorksTab from 'ui/view/following/FollowingWorksTab'
import View from 'ui/view/shared/component/View'
import ViewDefinition from 'ui/view/shared/component/ViewDefinition'

export default ViewDefinition({
	create: () => {
		const view = View('ignoring')

		view.breadcrumbs.title.text.use('view/ignoring/main/title')
		view.breadcrumbs.description.text.use('view/ignoring/main/description')

		Tabinator()
			.addTab(FollowingWorksTab('ignoring'))
			.addTab(FollowingAuthorsTab('ignoring'))
			.addTab(FollowingTagsTab('ignoring'))
			.appendTo(view.content)

		return view
	},
})
