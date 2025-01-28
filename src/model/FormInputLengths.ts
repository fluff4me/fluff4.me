import type { ManifestFormInputLengths } from 'api.fluff4.me'
import EndpointFormInputLengths from 'endpoint/manifest/EndpointFormInputLengths'
import Manifest from 'model/Manifest'
import Time from 'utility/Time'

export default Manifest<ManifestFormInputLengths>({
	valid: Time.minutes(5),
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
