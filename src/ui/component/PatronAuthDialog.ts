import EndpointAuthPatreonPatronDelete from 'endpoint/auth/patreon/patron/EndpointAuthPatreonPatronDelete'
import Endpoint from 'endpoint/Endpoint'
import Session from 'model/Session'
import OAuthService from 'ui/component/auth/OAuthService'
import OAuthServices from 'ui/component/auth/OAuthServices'
import ConfirmDialog from 'ui/component/core/ConfirmDialog'
import Popup from 'utility/Popup'
import State from 'utility/State'

const PopupPatron = Popup({
	translation: 'view/chapter/dialog/patron/popup/title',
	url: Endpoint.path('/auth/patreon/patron/begin'),
	width: 600,
	height: 900,
})

namespace PatronAuthDialog {

	export function auth (owner: State.Owner) {
		return ConfirmDialog.prompt(owner, {
			titleTranslation: 'view/chapter/dialog/patron/title',
			bodyTranslation: 'view/chapter/dialog/patron/description',
			confirmButtonTranslation: 'view/chapter/dialog/patron/done',
			cancelButtonTranslation: false,
			async tweak (dialog) {
				const patron = Session.Auth.account.map(dialog, author => author?.patreon_patron ?? undefined)
				const services = await OAuthServices(State('none'))

				OAuthService(services.data.patreon,
					{
						authorisationState: patron,
						async onClick () {
							if (patron.value)
								await unlink()
							else
								await relink()
							return true
						},
					})
					.appendTo(dialog.content)

				async function relink () {
					await PopupPatron.show(dialog).toastError()
					await Session.refresh()
				}

				async function unlink () {
					await EndpointAuthPatreonPatronDelete.query()
					await Session.refresh()
				}
			},
		})
	}

}

export default PatronAuthDialog
