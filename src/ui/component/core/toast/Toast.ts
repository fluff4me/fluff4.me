import type { ErrorResponse } from 'api.fluff4.me'
import Component from 'ui/Component'
import type { ToastComponent } from 'ui/component/core/toast/ToastList'
import type { Quilt } from 'ui/utility/StringApplicator'

interface Toast<PARAMS extends any[] = []> {
	duration: number
	initialise: (toast: ToastComponent, ...params: PARAMS) => unknown
}

function Toast<PARAMS extends any[]> (toast: Toast<PARAMS>) {
	return toast
}

export default Toast

export const TOAST_SUCCESS = Toast({
	duration: 2000,
	initialise (toast, translation: Quilt.SimpleKey | Quilt.Handler) {
		toast.title.text.use(translation)
	},
})

function isErrorResponse (error: Error): error is ErrorResponse {
	return (error as ErrorResponse).headers !== undefined
}

export const TOAST_ERROR = Toast({
	duration: 5000,
	initialise (toast, translation: Quilt.SimpleKey | Quilt.Handler, error: Error) {
		console.error(error)
		toast.title.text.use(translation)
		if (!isErrorResponse(error) || !error.detail)
			toast.content.text.set(error.message)
		else
			toast.content
				.append(Component()
					.style('toast-error-type')
					.text.set(error.message))
				.text.append(': ')
				.text.append(error.detail)
	},
})
