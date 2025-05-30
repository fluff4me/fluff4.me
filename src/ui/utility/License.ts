import type { Quilt } from 'ui/utility/StringApplicator'
import Objects from 'utility/Objects'

export type License = keyof { [KEY in keyof Quilt as KEY extends `license/${infer LICENSE}` ? LICENSE extends `${string}/link` ? never : LICENSE : never]: true }
export const LICENSES = Objects.keys({
	'all-rights-reserved': true,
	'cc-by': true,
	'cc-by-sa': true,
	'cc-by-nc': true,
	'cc-by-nc-sa': true,
	'cc-by-nd': true,
	'cc-by-nc-nd': true,
	'cc0': true,
	'custom': true,
} satisfies Record<License, true>)

export type LicenseNoLink = keyof { [LICENSE in License as `license/${LICENSE}/link` extends keyof Quilt ? never : LICENSE]: true }
export const LICENSES_NO_LINK = Objects.keys({
	'all-rights-reserved': true,
	'custom': true,
} satisfies Record<LicenseNoLink, true>)
