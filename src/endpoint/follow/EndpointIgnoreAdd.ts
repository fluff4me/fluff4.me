import type { Paths } from 'api.fluff4.me'
import Endpoint from 'endpoint/Endpoint'

type FollowType = Extract<keyof Paths, `/ignore/${string}/{vanity}`> extends `/ignore/${infer T}/{vanity}` ? Exclude<T, `${string}/${string}`> : never

export default {
	Author: Endpoint('/ignore/author/{vanity}', 'post'),
	Work: Endpoint('/ignore/work/{vanity}', 'post'),
	Tag: Endpoint('/ignore/tag/{vanity}', 'post'),
	Category: Endpoint('/ignore/category/{vanity}', 'post'),
} satisfies { [TYPE in FollowType as Capitalize<TYPE>]: Endpoint<`/ignore/${TYPE}/{vanity}`> }
