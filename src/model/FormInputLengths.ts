import EndpointFormInputLengths from "endpoint/manifest/EndpointFormInputLengths"
import Manifest from "model/Manifest"

export default Manifest({
	get () {
		return EndpointFormInputLengths.query()
	},
})
