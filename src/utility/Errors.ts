import type { RoutePath } from 'navigation/RoutePath'

namespace Errors {
	export const Impossible = () => new Error('Something impossible appears to have happened, what are you?')
	export const NotFound = () => Object.assign(new Error('Not found'), { code: 404 })
	export const Forbidden = () => Object.assign(new Error('Forbidden'), { code: 403 })
	export const BadData = (message?: string) => Object.assign(new Error('Bad data was sent by the server', { cause: message }), { code: 500 })
	export const create = (message: string) => Object.assign(new Error(message), { code: 600 })

	const SYMBOL_REDIRECTING = Symbol('REDIRECTING')
	export type Redirecting = typeof SYMBOL_REDIRECTING
	export type Redirection = () => Redirecting
	export const redirection = (path: RoutePath): Redirection => {
		return () => {
			void navigate.toURL(path)
			return SYMBOL_REDIRECTING
		}
	}
}

export default Errors
