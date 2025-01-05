import Endpoint from 'endpoint/Endpoint'

export interface WorkParams {
	author: string
	vanity: string
}

export default Endpoint('/work/{author}/{vanity}/get', 'get')
