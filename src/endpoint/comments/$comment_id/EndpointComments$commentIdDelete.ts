import Endpoint from 'endpoint/Endpoint'

export default Endpoint('/v2/comments/{comment_id}/delete', 'post').noResponse()
