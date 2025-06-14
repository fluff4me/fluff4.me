import JSZip from 'jszip'
import mammoth from 'mammoth'
import TextEditor from 'ui/component/core/TextEditor'
import Functions from 'utility/Functions'
import State from 'utility/State'
import Task from 'utility/Task'

namespace Documents {

	export function basename (filename: string) {
		filename = filename.slice(filename.lastIndexOf('/') + 1)
		filename = filename.slice(filename.lastIndexOf('\\') + 1)
		filename = filename.slice(0, filename.lastIndexOf('.'))
		return filename
	}

	export interface ImportDocument {
		file: string
		title: string
		body: string
		error?: undefined
	}

	export interface ImportError {
		file: string
		title?: undefined
		body?: undefined
		error: Error
	}

	export function importFrom (owner: State.Owner, state: State<FileList | null>) {
		return State.Async(owner, state, async (fileList, signal, setProgress) => {
			if (!fileList)
				return

			interface FileProvider {
				text (): Promise<{ text: string, error: undefined } | { text: undefined, error: Error }>
				json (): Promise<{ data: object, error: undefined } | { data: undefined, error: Error }>
				raw (): Promise<{ buffer: ArrayBuffer, error: undefined } | { buffer: undefined, error: Error }>
			}

			const imports: (ImportDocument | ImportError)[] = []

			////////////////////////////////////
			//#region File Discovery

			interface QueuedFile {
				dir: string
				path: string
				file: FileProvider
			}

			const queue: QueuedFile[] = []

			for (let i = 0; i < fileList.length; i++) {
				const file = fileList[i]
				if (signal.aborted)
					return

				setProgress(0.1 * (i / fileList.length), quilt => quilt['utility/documents/load/discovering'](i, fileList.length))
				await Task.yield()
				await queueFile('', file.name, {
					text: () => file.text().then(text => ({ text, error: undefined }), error => ({ text: undefined, error })),
					json: () => file.text().then(text => JSON.parse(text)).then(data => ({ data, error: undefined }), error => ({ data: undefined, error })),
					raw: () => file.arrayBuffer().then(buffer => ({ buffer, error: undefined }), error => ({ buffer: undefined, error })),
				})
			}

			async function queueFile (dir: string, path: string, file: FileProvider, originalPath?: string) {
				const extension = path.slice(path.lastIndexOf('.'))
				const qualifiedPath = dir + '/' + (originalPath ?? path)
				switch (extension) {
					case '.zip': {
						const { buffer, error } = await file.raw()
						if (error) {
							imports.push({ file: qualifiedPath, error })
							return
						}

						const dir = path
						const zip = await JSZip.loadAsync(buffer)
						for (const [path, file] of Object.entries(zip.files)) {
							if (file.dir)
								return

							await queueFile(dir, path, {
								text: () => file.async('text').then(text => ({ text, error: undefined }), error => ({ text: undefined, error })),
								json: () => file.async('text').then(text => JSON.parse(text)).then(data => ({ data, error: undefined }), error => ({ data: undefined, error })),
								raw: () => file.async('arraybuffer').then(buffer => ({ buffer, error: undefined }), error => ({ buffer: undefined, error })),
							})
						}
						return
					}
					default: {
						queue.push({ dir, path, file })
						return
					}
				}
			}

			//#endregion
			////////////////////////////////////

			////////////////////////////////////
			//#region Document Processing

			for (let i = 0; i < queue.length; i++) {
				const { dir, path, file } = queue[i]
				if (signal.aborted)
					return

				setProgress(0.1 + 0.9 * (i / queue.length), quilt => quilt['utility/documents/load/processing'](i, queue.length))
				await Task.yield()
				await onFile(dir, path, file, path)
			}

			async function onFile (dir: string, path: string, file: FileProvider, originalPath?: string) {
				const extension = path.slice(path.lastIndexOf('.'))
				const qualifiedPath = dir + '/' + (originalPath ?? path)
				switch (extension) {
					case '.txt': {
						const { text, error } = await file.text()
						if (error) {
							imports.push({ file: qualifiedPath, error })
							return
						}

						return passThroughTextEditor(qualifiedPath, editor => !!editor.mirror?.pasteText(text))
					}

					case '.md': {
						const { text, error } = await file.text()
						if (error) {
							imports.push({ file: qualifiedPath, error })
							return
						}

						return passThroughTextEditor(qualifiedPath, editor => {
							editor.importMarkdown(text)
							return true
						})
					}

					// case '.json': {
					// 	const { data, error } = await file.json()
					// 	if (error) {
					// 		imports.push({ file: displayPath, error })
					// 		return
					// 	}

					// 	imports.push({ file: displayPath, title: basename(path), body: "", ...data })
					// 	return
					// }

					case '.docx': {
						const { buffer, error } = await file.raw()
						if (error) {
							imports.push({ file: qualifiedPath, error })
							return
						}

						const { result, error: error2 } = await mammoth.convertToHtml({ arrayBuffer: buffer }).then(result => ({ result, error: undefined }), error => ({ result: undefined, error: new Error('Unable to convert docx to html:', { cause: error }) }))
						if (error2) {
							imports.push({ file: qualifiedPath, error: error2 })
							return
						}

						await Task.yield()

						return onFile(dir, path + `/${basename(path)}.html`, {
							text: () => Promise.resolve({ text: result.value, error: undefined }),
							json: Functions.throwing('This file\'s text should be processed as HTML'),
							raw: Functions.throwing('This file\'s text should be processed as HTML'),
						}, path)
					}

					case '.html': {
						const { text, error } = await file.text()
						if (error) {
							imports.push({ file: qualifiedPath, error })
							return
						}

						return passThroughTextEditor(qualifiedPath, editor => !!editor.mirror?.pasteHTML(text))
					}

					default: {
						imports.push({ file: qualifiedPath, error: new Error(`Unsupported file type ${extension}`) })
						return
					}
				}
			}

			function passThroughTextEditor (file: string, init: (editor: TextEditor) => boolean) {
				try {
					const result = TextEditor.passThrough(init)
					imports.push({ file, title: basename(file), body: result })
				}
				catch (err) {
					imports.push({ file, error: err as Error })
				}
			}

			//#endregion
			////////////////////////////////////

			return imports.sort((a, b) => a.file.localeCompare(b.file))
		})
	}
}

export default Documents
