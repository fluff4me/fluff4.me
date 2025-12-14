import Endpoint from 'endpoint/Endpoint'

export default Endpoint('/v2/reactions/comment/{comment_id}/{reaction_type}/add', 'post').noResponse()
