import type { AuthService, Paths } from 'api.fluff4.me'
import Env from 'utility/Env'
import Popup from 'utility/Popup'
import type State from 'utility/State'
import Store from 'utility/Store'

interface DangerTokenMetadata {
	uses: number
	expiryTime: string
}

declare module 'utility/Store' {
	interface ILocalStorage {
		dangerTokenMetadataTransfer?: DangerTokenMetadata
	}
}

export type DangerTokenType = keyof { [KEY in keyof Paths as KEY extends `/danger-token/request/${infer TOKEN}/{service}/begin` ? TOKEN : never]: true }

namespace DangerToken {

	interface DangerToken {
		type: DangerTokenType
		uses: number
		expiryTime: Date
	}

	const activeDangerTokens = new Map<DangerTokenType, DangerToken>()
	function getActiveDangerToken (type: DangerTokenType) {
		for (const token of [...activeDangerTokens.values()])
			if (token.expiryTime <= new Date() || token.uses <= 0)
				activeDangerTokens.delete(token.type)

		return activeDangerTokens.get(type)
	}

	let isRequestingDangerToken: boolean

	export function canRequest () {
		return !isRequestingDangerToken
	}

	export function canUse (type: DangerTokenType) {
		return !!getActiveDangerToken(type)
	}

	const PopupDangerToken = Popup({ width: 600, height: 900 })

	export async function request (owner: State.Owner, type: DangerTokenType, service: AuthService) {
		const token = getActiveDangerToken(type)
		if (token) {
			token.uses--
			return true
		}

		if (isRequestingDangerToken)
			return false

		isRequestingDangerToken = true
		const result = await PopupDangerToken
			.show(owner, {
				translation: quilt => quilt['shared/popup/danger-token/title'](service.name),
				url: `${Env.API_ORIGIN}danger-token/request/${type}/${service.id}/begin`,
			})
			.toastError()
		isRequestingDangerToken = false

		if (!result)
			return false

		const metadata = Store.items.dangerTokenMetadataTransfer
		if (metadata) {
			delete Store.items.dangerTokenMetadataTransfer
			const uses = metadata.uses - 1
			if (uses)
				activeDangerTokens.set(type, { type, uses, expiryTime: new Date(metadata.expiryTime) })
		}

		return result
	}

	export function handleAuthParams (params: URLSearchParams) {
		const usesRaw = params.get('danger-token-uses')
		const expiryTimeRaw = params.get('danger-token-expiry')
		if (!usesRaw || !expiryTimeRaw)
			return

		const uses = +usesRaw
		const expiryTime = new Date(expiryTimeRaw)
		if (isNaN(uses) || isNaN(expiryTime.getTime()))
			return

		Store.items.dangerTokenMetadataTransfer = { uses, expiryTime: expiryTimeRaw }
	}

}

export default DangerToken
