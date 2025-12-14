import Endpoint from 'endpoint/Endpoint'

export default Endpoint('/v2/works/{author_vanity}/{work_vanity}/delete', 'post').noResponse()
