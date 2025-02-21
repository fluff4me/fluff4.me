import Endpoint from 'endpoint/Endpoint'

export interface TagParams {
	vanity: string
}

export default Endpoint('/tag/promote', 'post')
