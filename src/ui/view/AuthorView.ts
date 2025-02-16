import EndpointAuthorGet from 'endpoint/author/EndpointAuthorGet'
import EndpointWorkGetAllAuthor from 'endpoint/work/EndpointWorkGetAllAuthor'
import PagedListData from 'model/PagedListData'
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
	async load (params: AuthorViewParams) {
		const response = await EndpointAuthorGet.query({ params })
		if (response instanceof Error)
			throw response

		const author = response.data
		return { author }
	},
	create (params: AuthorViewParams, { author }) {
		const view = View('author')

		Author(author)
			.viewTransition('author-view-author')
			.setContainsHeading()
			.appendTo(view.content)

		const works = PagedListData.fromEndpoint(25, EndpointWorkGetAllAuthor.prep({
			params: {
				author: params.vanity,
			},
		}))
		Paginator()
			.viewTransition('author-view-works')
			.tweak(p => p.title.text.use('view/author/works/title'))
			.setActionsMenu(popover => popover
				.append(Slot()
					.if(Session.Auth.author.map(popover, author => author?.vanity === params.vanity), () => Button()
						.type('flush')
						.setIcon('plus')
						.text.use('view/author/works/action/label/new')
						.event.subscribe('click', () => navigate.toURL('/work/new'))))
			)
			.set(works, (slot, works) =>
				slot.append(...works.map(workData =>
					Link(`/work/${author.vanity}/${workData.vanity}`)
						.and(Work, workData, author)
						.viewTransition(false)
						.type('flush')
						.appendTo(slot))))
			.orElse(slot => Component()
				.style('placeholder')
				.text.use('view/author/works/content/empty')
				.appendTo(slot))
			.appendTo(view.content)

		return view
	},
})
