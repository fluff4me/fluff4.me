import type { Work, WorkReference } from 'api.fluff4.me'

namespace Works {
	export function resolve (reference: WorkReference | null | undefined, works: Work[]): Work | undefined {
		return !reference ? undefined : works.find(work => work.author === reference.author && work.vanity === reference.vanity)
	}
}

export default Works
