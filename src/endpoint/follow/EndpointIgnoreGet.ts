import type { Paths } from 'api.fluff4.me'
import Endpoint from 'endpoint/Endpoint'

type FollowType = Extract<keyof Paths, `/ignores/${string}/{vanity}`> extends `/ignores/${infer T}/{vanity}` ? Exclude<T, `${string}/${string}`> : never

export default {
	Author: Endpoint('/ignores/author/{vanity}', 'get'),
	Work: Endpoint('/ignores/work/{vanity}', 'get'),
	Tag: Endpoint('/ignores/tag/{vanity}', 'get'),
	Category: Endpoint('/ignores/category/{vanity}', 'get'),
} satisfies { [TYPE in FollowType as Capitalize<TYPE>]: Endpoint<`/ignores/${TYPE}/{vanity}`> }
