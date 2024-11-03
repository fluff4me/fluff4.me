import Endpoint from "endpoint/Endpoint"

export default Endpoint("/work/{author}/{vanity}/get", "get")
	.acceptJSON()
