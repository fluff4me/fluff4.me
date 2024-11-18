import type { Tag as TagData } from "api.fluff4.me"
import Component from "ui/Component"
import Button from "ui/component/core/Button"
import Link from "ui/component/core/Link"

interface TagExtensions {
	tag: TagData
}

interface Tag extends Link, TagExtensions { }

const toURLRegex = /\W+/g
const toURL = (name: string) => name.replaceAll(toURLRegex, "-").toLowerCase()
const Tag = Component.Builder("a", (component, tag: TagData): Tag => {
	component
		.and(Link, `/tag/${toURL(tag.category)}/${toURL(tag.name)}`)
		.and(Button)
		.style("tag")

	Component()
		.style("tag-category")
		.text.set(tag.category)
		.appendTo(component)

	Component()
		.style("tag-name")
		.text.set(tag.name)
		.appendTo(component)

	// component.href.use(`/tag/${tag.id}`)

	return component.extend<TagExtensions>(component => ({ tag }))
})

export default Tag
