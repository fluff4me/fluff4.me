import type { ChangelogInsertBody, ChangelogItem } from 'api.fluff4.me'
import EndpointChangelogAdd from 'endpoint/changelog/EndpointChangelogAdd'
import EndpointChangelogDelete from 'endpoint/changelog/EndpointChangelogDelete'
import EndpointChangelogGet from 'endpoint/changelog/EndpointChangelogGet'
import EndpointChangelogUpdate from 'endpoint/changelog/EndpointChangelogUpdate'
import FormInputLengths from 'model/FormInputLengths'
import Session from 'model/Session'
import Component from 'ui/Component'
import Block from 'ui/component/core/Block'
import Button from 'ui/component/core/Button'
import Form from 'ui/component/core/Form'
import InfiniteScroll from 'ui/component/core/InfiniteScroll'
import LabelledTable from 'ui/component/core/LabelledTable'
import Paragraph from 'ui/component/core/Paragraph'
import Placeholder from 'ui/component/core/Placeholder'
import Slot from 'ui/component/core/Slot'
import Small from 'ui/component/core/Small'
import TextEditor from 'ui/component/core/TextEditor'
import TextInput from 'ui/component/core/TextInput'
import Env from 'utility/Env'
import State from 'utility/State'

export default Component.Builder(component => {
	Block()
		.tweak(block => {
			block.title.text.use('document/roadmap/title')
			block.content.useMarkdownContent('document/roadmap')
		})
		.appendTo(component)

	const changelog = InfiniteScroll().and(Slot)
	Block()
		.type('flush')
		.style('view-type-about-changelog-wrapper')
		.tweak(block => {
			block.title.text.use('view/about/roadmap/changelog/title')

			block.content.style('view-type-about-changelog')

			const editingItem = State<ChangelogItem | undefined>(undefined)

			const bodyInput = TextEditor()
				.setMaxLength(FormInputLengths.map(block, lengths => lengths?.changelog?.body))
				.setRequired()

			const timeInput = TextInput()
				.setValidityHandler(input => {
					if (!input.length.value)
						return undefined

					if (isNaN(new Date(input.value).getTime()))
						return quilt => quilt['shared/form/invalid/time']()
				})
				.placeholder.use('shared/form/time/placeholder')

			const versionInput = TextInput()
				.filter((...segments) => (
					segments.map(segment => segment.replace(/[^0-9]/g, ''))
				) as [string, string, string])
				.placeholder.set(`v${+Env.BUILD_NUMBER! || 0}`)

			const editingBlock = Block()
				.tweak(block => {
					block.title.text.bind(editingItem.map(block, item => quilt => quilt[!item ? 'view/about/roadmap/changelog-editor/title/create' : 'view/about/roadmap/changelog-editor/title/update']()))
					const form = block.and(Form, block.title) as Component<HTMLFormElement> & Block & Form

					const table = LabelledTable().appendTo(form.content)

					table.label(label => label.text.use('view/about/roadmap/changelog-editor/label/body'))
						.content((content, label) => content.append(bodyInput.setLabel(label)))

					const currentTimeState = State.Generator(() => new Date().toLocaleString(navigator.language))
					const i = setInterval(() => currentTimeState.refresh(), 1000)
					block.onRemoveManual(() => clearInterval(i))

					table.label(label => label.text.use('view/about/roadmap/changelog-editor/label/time'))
						.content((content, label) => content
							.append(timeInput.setLabel(label))
							.append(Paragraph().and(Placeholder).and(Small)
								.text.bind(State.Map(content, [timeInput.state, currentTimeState],
									(inputTime, currentTime) => !inputTime ? currentTime : new Date(inputTime).toLocaleString(navigator.language)
								))
							)
						)

					table.label(label => label.text.use('view/about/roadmap/changelog-editor/label/version'))
						.content((content, label) => content.append(versionInput.setLabel(label)))

					let submitting = false
					form.submit
						.text.bind(editingItem.map(form, item => quilt => quilt[!item ? 'view/about/roadmap/changelog-editor/action/submit/create' : 'view/about/roadmap/changelog-editor/action/submit/save']()))
						.event.subscribe('click', async () => {
							if (versionInput.value && isNaN(+versionInput.value))
								return

							if (submitting)
								return

							submitting = true

							const body: ChangelogInsertBody = {
								body: bodyInput.useMarkdown(),
								version: !versionInput.value ? +Env.BUILD_NUMBER! || 0 : +versionInput.value,
								time: !timeInput.value ? undefined : new Date(timeInput.value).toISOString(),
							}
							const response = editingItem.value
								? await EndpointChangelogUpdate.query({ params: { id: editingItem.value.id }, body })
								: await EndpointChangelogAdd.query({ body })

							submitting = false
							if (toast.handleError(response))
								return

							bodyInput.importMarkdown('')
							versionInput.value = ''
							timeInput.value = ''
							changelog.reset()
						})

					Button()
						.text.use('view/about/roadmap/changelog-editor/action/cancel')
						.event.subscribe('click', () => {
							bodyInput.importMarkdown('')
							versionInput.value = ''
							timeInput.value = ''
							editingItem.value = undefined
						})
						.appendToWhen(editingItem.truthy, block.footer.left)
				})
				.appendToWhen(Session.Auth.privileged.ChangelogModify, block.content)

			changelog
				.setFromEndpoint(EndpointChangelogGet.prep(), (changelogItems, slot, signal) => {
					for (const item of changelogItems) {
						Block()
							.style('view-type-about-changelog-item')
							.tweak(block => block.content
								.style('view-type-about-changelog-item-content')
								.append(Component()
									.style('view-type-about-changelog-item-body')
									.setMarkdownContent(item.body)
								)
							)
							.tweak(block => block.footer.left.and(Placeholder).and(Small).text.set(`v${item.version}`))
							.tweak(block => block.footer.right.and(Placeholder).and(Small).text.set(new Date(item.time).toLocaleDateString(navigator.language)))
							.setActionsMenu(popover => {
								if (!Session.Auth.privileged.ChangelogModify.value)
									return

								Button()
									.type('flush')
									.setIcon('pencil')
									.text.use('view/about/roadmap/changelog-editor/action/edit')
									.event.subscribe('click', () => {
										editingItem.value = item
										bodyInput.importMarkdown(item.body)
										versionInput.value = `${item.version}`
										timeInput.value = new Date(item.time).toISOString()
										editingBlock.header.element.scrollIntoView({ behavior: 'smooth' })
									})
									.appendTo(popover)

								Button()
									.type('flush')
									.setIcon('trash')
									.text.use('view/about/roadmap/changelog-editor/action/delete')
									.event.subscribe('click', async () => {
										const response = await EndpointChangelogDelete.query({ params: { id: item.id } })
										if (toast.handleError(response))
											return

										changelog.reset()
									})
									.appendTo(popover)
							})
							.tweak(block => {
								block.primaryActions.style('view-type-about-changelog-item-primary-actions').appendTo(block.content)
								block.header.remove()
							})
							.appendTo(slot)
					}
				})
				.appendTo(block.content)
		})
		.appendTo(component)

	return component
})
