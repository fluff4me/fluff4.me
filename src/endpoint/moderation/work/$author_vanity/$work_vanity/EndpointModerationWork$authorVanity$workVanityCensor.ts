import Endpoint from 'endpoint/Endpoint'

export default Endpoint('/v2/moderation/work/{author_vanity}/{work_vanity}/censor', 'post').noResponse()
