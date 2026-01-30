import Endpoint from 'endpoint/Endpoint'

export default Endpoint('/v2/reactions/work/{author_vanity}/{work_vanity}/delete', 'post').noResponse()
