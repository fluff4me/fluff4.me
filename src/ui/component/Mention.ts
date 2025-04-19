import type { Author } from 'api.fluff4.me'
import Component from 'ui/Component'
import GradientText from 'ui/component/core/ext/GradientText'
import Link from 'ui/component/core/Link'
import AuthorPopover from 'ui/component/popover/AuthorPopover'
import MarkdownContent from 'ui/utility/MarkdownContent'

interface MentionExtensions {

}

interface Mention extends Component, MentionExtensions { }

const Mention = Component.Builder('a', (component, author?: Author): Mention => {
	return component
		.and(Link, author && `/author/${author.vanity}`)
		.append(Component().style('mention-punctuation').text.set('@'))
		.append(Component().style('mention-author-name').text.set(author?.name ?? (quilt => quilt['shared/mention/unresolved']())))
		.setPopover('hover', popover => author && popover.and(AuthorPopover, author))
		.style('mention')
		.and(GradientText)
		.useGradient(author?.supporter?.vanity_colours)
})

export default Mention

export function registerMarkdownMentionHandler () {
	MarkdownContent.handle((element, context) => {
		if (element.tagName !== 'MENTION')
			return

		return () => {
			const vanity = element.getAttribute('vanity')
			const author = context.mentions?.find(author => author.vanity === vanity)

			const mention = Mention(author)
			element.replaceWith(mention.element)
		}
	})
}
