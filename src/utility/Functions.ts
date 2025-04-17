import type { SupplierOr } from 'utility/Type'

namespace Functions {

	export const NO_OP = () => { }

	export function resolve<ARGS extends any[], RETURN> (fn: SupplierOr<RETURN, ARGS>, ...args: ARGS): RETURN {
		return typeof fn === 'function' ? (fn as (...args: ARGS) => RETURN)(...args) : fn
	}

	export function throwing (message: string): () => never {
		return () => {
			throw new Error(message)
		}
	}
}

export default Functions
