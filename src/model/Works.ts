import type { Work, WorkReference } from 'api.fluff4.me'

namespace Works {
	export function resolve (reference: WorkReference | null | undefined, works: Work[]): Work | undefined {
		return !reference ? undefined : works.find(work => work.author === reference.author && work.vanity === reference.vanity)
	}

	export function equals (a?: WorkReference | null, b?: WorkReference | null) {
		return !!a && !!b && a.author === b.author && a.vanity === b.vanity
	}
}

export default Works
