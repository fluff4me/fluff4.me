import type { AuthorMetadata } from 'api.fluff4.me'

export interface AuthorReference {
	vanity: string
}

namespace Authors {
	export function resolve (vanity: string | null | undefined, authors: AuthorMetadata[]): AuthorMetadata | undefined {
		return !vanity ? undefined : authors.find(author => author.vanity === vanity)
	}
}

export default Authors
