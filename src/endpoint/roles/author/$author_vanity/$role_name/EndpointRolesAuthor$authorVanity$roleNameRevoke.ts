import Endpoint from 'endpoint/Endpoint'

export default Endpoint('/v2/roles/author/{author_vanity}/{role_name}/revoke', 'post').noResponse()
