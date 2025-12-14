import Endpoint from 'endpoint/Endpoint'

export default Endpoint('/v2/feed/{feed_id}/authed/rss.xml', 'get').noResponse()
