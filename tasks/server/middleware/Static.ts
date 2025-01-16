import Env from '../../utility/Env'
import Middleware from '../util/Middleware'
import SendFile from '../util/SendFile'

////////////////////////////////////
//#region Load Rewrites

enum RewriteCheckType {
	Equals,
	StartsWith,
}

interface RewriteCheck {
	type: RewriteCheckType
	not?: true
	compare: string
}

let rewrites: RewriteCheck[] | undefined
function getRewriteChecks () {
	if (rewrites)
		return rewrites

	const equalsToken = 'http.request.uri.path eq "'
	const notEqualsToken = 'http.request.uri.path ne "'
	const startsWithToken = 'starts_with(http.request.uri.path, "'
	return rewrites = (Env.URL_REWRITE?.slice(1, -1) ?? '').split(' and ')
		.map(expr => {
			const check: Partial<RewriteCheck> = {}
			if (expr.startsWith('not ')) {
				check.not = true
				expr = expr.slice(4)
			}

			if (expr.startsWith(startsWithToken)) {
				check.type = RewriteCheckType.StartsWith
				check.compare = expr.slice(startsWithToken.length, -2)
			}

			if (expr.startsWith(equalsToken)) {
				check.type = RewriteCheckType.Equals
				check.compare = expr.slice(equalsToken.length, -1)
			}

			if (expr.startsWith(notEqualsToken)) {
				check.type = RewriteCheckType.Equals
				check.not = true
				check.compare = expr.slice(notEqualsToken.length, -1)
			}

			return check as RewriteCheck
		})
}

//#endregion
////////////////////////////////////

export default Middleware((req, res) => {
	if (req.url === '/' || req.url.startsWith('/?'))
		req.url = '/index.html'

	const rewrites = getRewriteChecks()
	const shouldRewrite = rewrites.every(rewrite => {
		let result: boolean
		switch (rewrite.type) {
			case RewriteCheckType.Equals:
				result = rewrite.compare === req.url
				break
			case RewriteCheckType.StartsWith:
				result = req.url.startsWith(rewrite.compare)
				break
		}
		return rewrite.not ? !result : result
	})

	if (shouldRewrite)
		req.url = '/index.html'

	req.url = `.${req.url}`

	return SendFile(req, res, req.url)
})
