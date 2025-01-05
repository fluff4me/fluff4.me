import Endpoint from 'endpoint/Endpoint'

export interface RoleParams {
	role: string
	author: string
}

export default Endpoint('/role/grant/{role}/{author}', 'post')
