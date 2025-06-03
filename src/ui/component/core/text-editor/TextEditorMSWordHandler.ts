namespace TextEditorMSWordHandler {
	export function isPasteHTML (html: string): boolean {
		return html.slice(0, 300).includes('xmlns:m="http://schemas.microsoft.com/office/2004/12/omml"')
	}

	export function fixPasteHTML (html: string): string {
		return html.replaceAll(/\bname(?=="_ftn)/g, 'id')
	}
}

export default TextEditorMSWordHandler
