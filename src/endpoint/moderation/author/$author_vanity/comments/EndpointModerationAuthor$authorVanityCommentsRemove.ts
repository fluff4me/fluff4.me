import Endpoint from 'endpoint/Endpoint'

export default Endpoint('/v2/moderation/author/{author_vanity}/comments/remove', 'post').noResponse()
