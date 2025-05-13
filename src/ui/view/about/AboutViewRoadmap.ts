import EndpointChangelogAdd from 'endpoint/changelog/EndpointChangelogAdd'
import EndpointChangelogGet from 'endpoint/changelog/EndpointChangelogGet'
import FormInputLengths from 'model/FormInputLengths'
import Session from 'model/Session'
import Component from 'ui/Component'
import Block from 'ui/component/core/Block'
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

			Block()
				.tweak(block => {
					block.title.text.use('view/about/roadmap/create-changelog/title')
					const form = block.and(Form, block.title) as Component<HTMLFormElement> & Block & Form

					const table = LabelledTable().appendTo(form.content)

					const bodyInput = TextEditor()
						.setMaxLength(FormInputLengths.map(table, lengths => lengths?.changelog?.body))
						.setRequired()
					table.label(label => label.text.use('view/about/roadmap/create-changelog/label/body'))
						.content((content, label) => content.append(bodyInput.setLabel(label)))

					const currentTimeState = State.Generator(() => new Date().toLocaleString(navigator.language))
					const i = setInterval(() => currentTimeState.refresh(), 1000)
					block.onRemoveManual(() => clearInterval(i))

					const timeInput = TextInput()
						.setValidityHandler(input => {
							if (!input.length.value)
								return undefined

							if (isNaN(new Date(input.value).getTime()))
								return quilt => quilt['shared/form/invalid/time']()
						})
						.placeholder.use('shared/form/time/placeholder')
					table.label(label => label.text.use('view/about/roadmap/create-changelog/label/time'))
						.content((content, label) => content
							.append(timeInput.setLabel(label))
							.append(Paragraph().and(Placeholder).and(Small)
								.text.bind(State.Map(content, [timeInput.state, currentTimeState],
									(inputTime, currentTime) => !inputTime ? currentTime : new Date(inputTime).toLocaleString(navigator.language)
								))
							)
						)

					const versionInput = TextInput()
						.filter((...segments) => (
							segments.map(segment => segment.replace(/[^0-9]/g, ''))
						) as [string, string, string])
						.placeholder.set(`v${+Env.BUILD_NUMBER! || 0}`)
					table.label(label => label.text.use('view/about/roadmap/create-changelog/label/version'))
						.content((content, label) => content.append(versionInput.setLabel(label)))

					form.submit.text.use('view/about/roadmap/create-changelog/action/submit')
						.event.subscribe('click', async () => {
							if (versionInput.value && isNaN(+versionInput.value))
								return

							const response = await EndpointChangelogAdd.query({
								body: {
									body: bodyInput.useMarkdown(),
									version: !versionInput.value ? +Env.BUILD_NUMBER! || 0 : +versionInput.value,
									time: !timeInput.value ? undefined : new Date(timeInput.value).toISOString(),
								},
							})

							if (toast.handleError(response))
								return

							changelog.reset()
						})
				})
				.appendToWhen(Session.Auth.privileged.ChangelogModify, block.content)

			changelog
				.setFromEndpoint(EndpointChangelogGet.prep(), (changelog, slot, signal) => {
					for (const item of changelog) {
						Block()
							.style('view-type-about-changelog-item')
							.tweak(block => block.content.setMarkdownContent(item.body))
							.tweak(block => block.footer.left.and(Placeholder).and(Small).text.set(`v${item.version}`))
							.tweak(block => block.footer.right.and(Placeholder).and(Small).text.set(new Date(item.time).toLocaleDateString()))
							.appendTo(slot)
					}
				})
				.appendTo(block.content)
		})
		.appendTo(component)

	return component
})
