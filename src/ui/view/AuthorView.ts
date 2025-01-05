import EndpointAuthorGet from 'endpoint/author/EndpointAuthorGet'
import EndpointWorkGetAllAuthor from 'endpoint/work/EndpointWorkGetAllAuthor'
import Session from 'model/Session'
import Component from 'ui/Component'
import Author from 'ui/component/Author'
import Button from 'ui/component/core/Button'
import Link from 'ui/component/core/Link'
import Paginator from 'ui/component/core/Paginator'
import Slot from 'ui/component/core/Slot'
import Work from 'ui/component/Work'
import View from 'ui/view/shared/component/View'
import ViewDefinition from 'ui/view/shared/component/ViewDefinition'

interface AuthorViewParams {
	vanity: string
}

export default ViewDefinition({
	create: async (params: AuthorViewParams) => {
		const view = View('author')

		const author = await EndpointAuthorGet.query({ params })
		if (author instanceof Error)
			throw author

		Author(author.data)
			.viewTransition('author-view-author')
			.setContainsHeading()
			.appendTo(view)

		const paginator = Paginator()
			.viewTransition('author-view-works')
			.tweak(p => p.title.text.use('view/author/works/title'))
			.tweak(p => p.primaryActions.append(Slot()
				.if(Session.Auth.loggedIn, () => Button()
					.setIcon('plus')
					.ariaLabel.use('view/author/works/action/label/new')
					.event.subscribe('click', () => navigate.toURL('/work/new')))))
			.appendTo(view)
		const worksQuery = EndpointWorkGetAllAuthor.prep({
			params: {
				author: params.vanity,
			},
		})
		await paginator.useEndpoint(worksQuery, (slot, works) =>
			slot.append(...works.map(workData =>
				Link(`/work/${author.data.vanity}/${workData.vanity}`)
					.and(Work, workData, author.data)
					.viewTransition()
					.type('flush')
					.appendTo(slot))))
		paginator.orElse(slot => Component()
			.style('placeholder')
			.text.use('view/author/works/content/empty')
			.appendTo(slot))

		return view
	},
})
