import Endpoint from 'endpoint/Endpoint'

export default Endpoint('/v2/reactions/chapter/{author_vanity}/{work_vanity}/{chapter_url}/supporter/add', 'post').noResponse()
