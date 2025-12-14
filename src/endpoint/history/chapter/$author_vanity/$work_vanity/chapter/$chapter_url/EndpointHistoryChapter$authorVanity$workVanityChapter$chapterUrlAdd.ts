import Endpoint from 'endpoint/Endpoint'

export default Endpoint('/v2/history/chapter/{author_vanity}/{work_vanity}/chapter/{chapter_url}/add', 'post').noResponse()
