import type { AuthorMetadata, ChapterMetadata, WorkMetadata } from 'api.fluff4.me'
import type PagedData from 'model/PagedData'
import Component from 'ui/Component'
import type { CommentData, CommentMetadata } from 'ui/component/Comment'
import Comment from 'ui/component/Comment'
import Block from 'ui/component/core/Block'
import Paginator from 'ui/component/core/Paginator'
import Slot from 'ui/component/core/Slot'
import type { StateOr } from 'utility/State'
import State from 'utility/State'

export interface ContextualComment {
	data: CommentData
	metadata?: CommentMetadata
}

export interface CommentListPageData {
	comments: ContextualComment[]
	authors: StateOr<AuthorMetadata[]>
	works?: StateOr<WorkMetadata[]>
	chapters?: StateOr<ChapterMetadata[]>
	threadAuthor?: string
}

export interface CommentListDefinition {
	data: PagedData<CommentListPageData>
	placeholder?: (placeholder: Component) => unknown
}

interface CommentListExtensions {
	paginator: Paginator
	set (definition: CommentListDefinition): this
}

interface CommentList extends Component, CommentListExtensions { }

export default Component.Builder((component): CommentList => {
	let placeholderInitialiser: ((placeholder: Component) => unknown) | undefined

	const paginator = Paginator()
		.style('comment-list')
		.tweak(p => p.content
			.style('comment-list-content')
		)
		// .tweak(p => p.title.text.use('view/author/comments/title'))
		.orElse(slot => Block()
			.type('flush')
			.style('comment-list-placeholder-wrapper')
			.tweak(block => Component()
				.style('placeholder')
				.text.use('comment/list/empty')
				.tweak(placeholderInitialiser)
				.appendTo(block.content))
			.appendTo(slot))
		.appendTo(component.and(Slot))

	return component.extend<CommentListExtensions>(list => ({
		paginator,
		set (definition) {
			placeholderInitialiser = definition.placeholder
			paginator
				.set(definition.data, 0, (slot, { comments, authors, works, chapters, threadAuthor }) =>
					slot.append(...comments.map(({ data, metadata }) =>
						Comment(
							{
								threadAuthor: threadAuthor ?? '@',
								comments: State(comments.map(comment => comment.data)),
								authors: State.get(authors),
							},
							data,
							metadata && {
								...metadata,
								context: metadata.context && {
									...metadata.context,
									authors,
									works,
									chapters,
								},
							},
						)
							.style('comment-list-comment')
							.appendTo(slot)
					))
				)
				.setHasResults((data, hasResults) => data && hasResults(data.comments))
			return list
		},
	}))
})
