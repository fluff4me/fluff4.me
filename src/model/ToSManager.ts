import quilt from 'lang/en-nz'
import Session from 'model/Session'
import Component from 'ui/Component'
import Button from 'ui/component/core/Button'
import type { Quilt } from 'ui/utility/StringApplicator'
import Settings from 'utility/Settings'
import State from 'utility/State'

const lastAccepted = Settings.registerHiddenGroup('footer/heading/legal', {
	termsOfService: Settings.number({
		name: 'document/legal/terms-of-service/title',
		default: -1,
		min: -1,
		step: 1,
	}),
	privacyPolicy: Settings.number({
		name: 'document/legal/privacy-policy/title',
		default: -1,
		min: -1,
		step: 1,
	}),
})

namespace ToSManager {
	export function getLatestVersionNumbers () {
		return ({
			'privacy-policy': getDocumentVersions('privacy-policy').at(-1)!,
			'terms-of-service': getDocumentVersions('terms-of-service').at(-1)!,
		} satisfies Record<Document, number>)
	}

	type Document = keyof { [TKEY in keyof Quilt as TKEY extends `document/legal/${infer DOC}/v${bigint}` ? DOC : never]: true }
	export function getDocumentVersions (document: Document) {
		const docPrefix = `document/legal/${document}/v`
		const docVersions = Object.keys(quilt)
			.map(tkey => !tkey.startsWith(docPrefix) ? undefined : +tkey.slice(docPrefix.length))
			.filterInPlace((v): v is number => !isNaN(v!))
		return docVersions.sort((a, b) => a - b)
	}

	export async function ensureAccepted () {
		const lastAcceptedToS = lastAccepted.termsOfService.state.value ?? -1
		const lastAcceptedPrivacy = lastAccepted.privacyPolicy.state.value ?? -1
		const latestVersionNumbers = getLatestVersionNumbers()
		if (lastAcceptedToS < latestVersionNumbers['terms-of-service'] || lastAcceptedPrivacy < latestVersionNumbers['privacy-policy']) {
			await banner.queue(banner => {
				banner.body.append(
					Component().text.use(lastAcceptedToS < 0
						? 'banner/legal-notification/initial'
						: Session.Auth.loggedIn.value
							? 'banner/legal-notification/update-logged-in'
							: 'banner/legal-notification/update-logged-out',
					),
					Button().type('icon', 'flush').setIcon('xmark')
						.event.subscribe('click', banner.dismiss),
				)

				const unsubscribe = State.Use(banner, { tos: lastAccepted.termsOfService.state, privacy: lastAccepted.privacyPolicy.state }).use(banner, ({ tos = -1, privacy = -1 }) => {
					if (tos >= latestVersionNumbers['terms-of-service'] && privacy >= latestVersionNumbers['privacy-policy']) {
						banner.dismiss()
						unsubscribe()
						return
					}
				})
			})

			lastAccepted.termsOfService.state.value = latestVersionNumbers['terms-of-service']
			lastAccepted.privacyPolicy.state.value = latestVersionNumbers['privacy-policy']
		}
	}
}

export default ToSManager
