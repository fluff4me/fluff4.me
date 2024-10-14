import Endpoint from "endpoint/Endpoint"

export default Endpoint("/session", "get")
	.headers({ "Accept": "application/json" })
