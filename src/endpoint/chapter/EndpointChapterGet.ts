import Endpoint from "endpoint/Endpoint"
import type { WorkParams } from "endpoint/work/EndpointWorkGet"

export interface ChapterParams extends WorkParams {
	url: string
}

export default Endpoint("/work/{author}/{vanity}/chapter/{url}/get", "get")
