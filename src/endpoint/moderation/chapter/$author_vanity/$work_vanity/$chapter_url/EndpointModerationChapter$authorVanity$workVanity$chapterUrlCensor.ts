import Endpoint from 'endpoint/Endpoint'

export default Endpoint('/v2/moderation/chapter/{author_vanity}/{work_vanity}/{chapter_url}/censor', 'post').noResponse()
