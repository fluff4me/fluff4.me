import type { ManifestFormInputLengths } from "api.fluff4.me"
import EndpointFormInputLengths from "endpoint/manifest/EndpointFormInputLengths"
import Manifest from "model/Manifest"

export default Manifest<ManifestFormInputLengths>({
	get () {
		return EndpointFormInputLengths.query()
	},
	orElse () {
		const empy = {}
		return new Proxy({} as ManifestFormInputLengths, {
			get (target, p, receiver) {
				return empy
			},
		})
	},
})
