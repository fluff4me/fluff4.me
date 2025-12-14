import Endpoint from 'endpoint/Endpoint'

export default Endpoint('/v2/reports/chapter/{author_vanity}/{work_vanity}/{chapter_url}/add', 'post').noResponse()
