import Endpoint from 'endpoint/Endpoint'

export interface PrivilegeParams {
	vanity: string
}

export default Endpoint('/privilege/get/{vanity}', 'get')
