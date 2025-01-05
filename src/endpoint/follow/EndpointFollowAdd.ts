import Endpoint from 'endpoint/Endpoint'

export interface FollowParams {
	type: 'author' | 'tag'
	vanity: string
	author: string
}

export default Endpoint('/follow/{type}/{vanity}', 'post')
