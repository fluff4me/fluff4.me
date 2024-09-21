import Endpoint from "utility/endpoint/Endpoint"

export default Endpoint("/session", "get")
	.headers({ "Accept": "application/json" })
