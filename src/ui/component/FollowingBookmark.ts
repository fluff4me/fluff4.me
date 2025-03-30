import Follows from 'model/Follows'
import Component from 'ui/Component'
import type State from 'utility/State'

interface FollowingBookmarkExtensions {
	readonly isFollowing: State<boolean>
}

interface FollowingBookmark extends Component, FollowingBookmarkExtensions { }

const FollowingBookmark = Component.Builder((component, following: (follows: typeof Follows) => boolean): FollowingBookmark => {
	const isFollowing = Follows.map(component, () => following(Follows))
	return component
		.style('following-bookmark')
		.style.bind(isFollowing.falsy, 'following-bookmark--hidden')
		.extend<FollowingBookmarkExtensions>(bookmark => ({
			isFollowing,
		}))
})

export default FollowingBookmark
