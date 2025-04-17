import type { Author } from 'api.fluff4.me'

export interface AuthorReference {
	vanity: string
}

namespace Authors {
	export function resolve (vanity: string | null | undefined, authors: Author[]): Author | undefined {
		return !vanity ? undefined : authors.find(author => author.vanity === vanity)
	}
}

export default Authors
