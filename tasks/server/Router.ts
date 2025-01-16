import E404 from './middleware/E404'
import Static from './middleware/Static'
import { RequestListener } from './util/Middleware'

const _ = undefined
export default RequestListener(async (req, res) => _
	?? await Static(req, res)
	?? await E404(req, res)
)
