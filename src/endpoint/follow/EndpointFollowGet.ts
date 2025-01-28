import type { Paths } from 'api.fluff4.me'
import Endpoint from 'endpoint/Endpoint'

type FollowType = Extract<keyof Paths, `/follows/${string}/{vanity}`> extends `/follows/${infer T}/{vanity}` ? Exclude<T, `${string}/${string}`> : never

export default {
	Author: Endpoint('/follows/author/{vanity}', 'get'),
	Work: Endpoint('/follows/work/{vanity}', 'get'),
	Tag: Endpoint('/follows/tag/{vanity}', 'get'),
	Category: Endpoint('/follows/category/{vanity}', 'get'),
} satisfies { [TYPE in FollowType as Capitalize<TYPE>]: Endpoint<`/follows/${TYPE}/{vanity}`> }
