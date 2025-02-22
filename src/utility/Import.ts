namespace Import {
	export function hasModule (name: string) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
		return !!(window as any).hasModule?.(name)
	}

	export function getModule<T> (name: string): T | undefined {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
		const result = hasModule(name) ? (window as any).getModule?.(name) : undefined
		if (result && 'default' in result)
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
			return result.default

		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return result
	}
}

export default Import
