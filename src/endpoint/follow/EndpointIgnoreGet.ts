import type { Paths } from 'api.fluff4.me'
import Endpoint from 'endpoint/Endpoint'

type FollowType = Extract<keyof Paths, `/ignores/${string}/{id}`> extends `/ignores/${infer T}/{id}` ? Exclude<T, `${string}/${string}`> : never

export default {
	Author: Endpoint('/ignores/author/{id}', 'get'),
	// Work: Endpoint('/ignores/work/{id}', 'get'),
	Tag: Endpoint('/ignores/tag/{id}', 'get'),
	Category: Endpoint('/ignores/category/{id}', 'get'),
} satisfies { [TYPE in FollowType as Capitalize<TYPE>]: Endpoint<`/ignores/${TYPE}/{id}`> }
