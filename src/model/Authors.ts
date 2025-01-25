import type { Author } from 'api.fluff4.me'

namespace Authors {
	export function resolve (vanity: string | null | undefined, authors: Author[]): Author | undefined {
		return !vanity ? undefined : authors.find(author => author.vanity === vanity)
	}
}

export default Authors
