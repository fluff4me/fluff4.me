import Define from 'utility/Define'

declare global {
	interface Map<K, V> {
		compute (key: K, provider: (key: K) => V): V
	}
}

namespace Maps {
	export function applyPrototypes () {
		Define(Map.prototype, 'compute', function <K, V> (this: Map<K, V>, key: K, provider: (key: K) => V): V {
			if (this.has(key))
				return this.get(key)!

			const value = provider(key)
			this.set(key, value)
			return value
		})
	}
}

export default Maps
