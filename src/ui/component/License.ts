import type { License as WorkLicense } from 'api.fluff4.me'
import Component from 'ui/Component'
import ExternalLink from 'ui/component/core/ExternalLink'
import Slot from 'ui/component/core/Slot'
import type { License, LicenseNoLink } from 'ui/utility/License'
import { LICENSES, LICENSES_NO_LINK } from 'ui/utility/License'
import { Quilt } from 'ui/utility/StringApplicator'
import type { StateOr } from 'utility/State'
import State from 'utility/State'

export default Component.Builder((component, authorName: StateOr<string | undefined>, license: StateOr<WorkLicense | null | undefined>) => {
	component.and(Slot)
		.style.remove('slot')
		.style('license')
		.use(State.Use(component, { quilt: Quilt.State, license: State.get(license), authorName: State.get(authorName) }), (slot, { quilt, license, authorName }) => {
			let licenseName: string | Quilt.Handler = license?.name ?? ('all-rights-reserved' satisfies License)
			let licenseLink = license?.link
			const licenseId = licenseName as License
			if (LICENSES.includes(licenseId)) {
				licenseName = quilt => quilt[`license/${licenseId}`](authorName)
				if (!LICENSES_NO_LINK.includes(licenseId as LicenseNoLink))
					licenseLink = quilt[`license/${license?.name as Exclude<License, LicenseNoLink>}/link`]().toString()
			}

			return ExternalLink(licenseLink)
				.text.set(licenseName)
		})

	return component
})
