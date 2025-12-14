import Endpoint from 'endpoint/Endpoint'

export default Endpoint('/v2/authors/{author_vanity}/rss.xml', 'get').noResponse()
