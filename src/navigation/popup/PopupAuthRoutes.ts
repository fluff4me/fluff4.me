import DangerToken from 'model/DangerToken'
import PopupRoute from 'navigation/popup/PopupRoute'
import Store from 'utility/Store'

export default PopupRoute.collect(

	PopupRoute(/\/auth\/(.*)\/error/, () => {
		const params = new URLSearchParams(location.search)
		Store.items.popupError = {
			code: +(params.get('code') ?? '500'),
			message: params.get('message') ?? 'Internal Server Error',
		}

		// eslint-disable-next-line no-debugger
		debugger
		window.close()
	}),

	PopupRoute(/\/auth\/(.*)\/ok/, () => {
		const params = new URLSearchParams(location.search)
		DangerToken.handleAuthParams(params)

		// eslint-disable-next-line no-debugger
		debugger
		window.close()
	}),

)
