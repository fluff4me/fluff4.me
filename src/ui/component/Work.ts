import type { Author, Work as WorkData, WorkFull } from "api.fluff4.me"
import Session from "model/Session"
import Tags from "model/Tags"
import Component from "ui/Component"
import Block from "ui/component/core/Block"
import Button from "ui/component/core/Button"
import Link from "ui/component/core/Link"
import Slot from "ui/component/core/Slot"
import TextLabel from "ui/component/core/TextLabel"
import Timestamp from "ui/component/core/Timestamp"
import Tag from "ui/component/Tag"
import AbortPromise from "utility/AbortPromise"

interface WorkExtensions {
	work: WorkData
}

interface Work extends Block, WorkExtensions { }

const Work = Component.Builder((component, work: WorkData & Partial<WorkFull>, author?: Author, notFullOverride?: true): Work => {
	author = author ?? work.synopsis?.mentions[0]

	component
		.viewTransition("work")
		.style("work")
		.style.toggle(component.is(Link), "work--link")

	const block = component.and(Block)
	const isFlush = block.type.state.mapManual(types => types.has("flush"))

	block.header.style("work-header")
	block.title
		.style("work-name")
		.text.set(work.name)

	if (author)
		block.description
			.style("work-author-list")
			.style.bind(isFlush, "work-author-list--flush")
			.append(Link(`/author/${author.vanity}`)
				.style("work-author")
				.text.set(author.name))

	block.content.style("work-content")

	Slot()
		.use(isFlush, (slot, isFlush) => {
			isFlush ||= notFullOverride ?? false

			const shouldShowDescription = isFlush || (work.synopsis?.body && work.description)
			if (shouldShowDescription)
				Component()
					.style("work-description")
					.style.toggle(!work.description, "placeholder")
					.tweak(component => {
						if (work.description)
							component.text.set(work.description)
						else
							component.text.use("work/description/empty")
					})
					.appendTo(slot)

			if (!isFlush)
				Component()
					.style("work-synopsis")
					.style.toggle(!work.synopsis?.body && !work.description, "placeholder")
					.append(Slot.using(work.synopsis ?? work.description, (slot, synopsis) => {
						if (typeof synopsis === "string")
							slot.text.set(synopsis)
						else if (!synopsis.body)
							slot.text.use("work/description/empty")
						else
							slot.setMarkdownContent(synopsis.body)
					}))
					.appendTo(slot)
		})
		.appendTo(block.content)

	Slot()
		.use(work.global_tags, AbortPromise.asyncFunction(async (signal, slot, tagStrings) => {
			const tags = await Tags.resolve(tagStrings)
			return tags?.length && Component()
				.style("work-tags", "work-tags-global")
				.style.bind(isFlush, "work-tags--flush")
				.append(...tags.map(tag => Tag(tag)))
		}))
		.appendTo(block.content)

	Slot()
		.use(work.custom_tags, (slot, customTags) => customTags && Component()
			.style("work-tags", "work-tags-custom")
			.style.bind(isFlush, "work-tags--flush")
			.append(...customTags.map(tag => Tag(tag))))
		.appendTo(block.content)

	TextLabel()
		.tweak(textLabel => textLabel.label.text.use("work/chapters/label"))
		.tweak(textLabel => textLabel.content.text.set(`${work.chapter_count_public}`))
		.appendTo(block.footer.left)

	if (work.time_last_update)
		block.footer.right.append(Timestamp(work.time_last_update).style("work-timestamp"))

	block.setActionsMenu((popover, button) => {
		Button()
			.type("flush")
			.text.use("view/author/works/action/label/view")
			.event.subscribe("click", () => navigate.toURL(`/work/${author?.vanity}/${work.vanity}`))
			.appendTo(popover)

		if (author && author.vanity === Session.Auth.author.value?.vanity) {
			Button()
				.type("flush")
				.text.use("view/author/works/action/label/edit")
				.event.subscribe("click", () => navigate.toURL(`/work/${author.vanity}/${work.vanity}/edit`))
				.appendTo(popover)

			Button()
				.type("flush")
				.text.use("view/author/works/action/label/delete")
				.event.subscribe("click", () => { })
				.appendTo(popover)

		} else if (Session.Auth.loggedIn.value) {
			Button()
				.type("flush")
				.text.use("view/author/works/action/label/follow")
				.event.subscribe("click", () => { })
				.appendTo(popover)

			Button()
				.type("flush")
				.text.use("view/author/works/action/label/ignore")
				.event.subscribe("click", () => { })
				.appendTo(popover)
		}
	})

	return block.extend<WorkExtensions>(component => ({ work }))
})

export default Work
