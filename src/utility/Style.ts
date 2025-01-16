namespace Style {
	export async function reload (path: string) {
		const oldStyle = document.querySelector(`link[rel=stylesheet][href^="${path}"]`)
		const style = document.createElement('link')
		style.rel = 'stylesheet'
		style.href = `${path}?${Date.now()}`
		return new Promise<void>((resolve, reject) => {
			style.onload = () => resolve()
			style.onerror = reject
			document.head.appendChild(style)
		}).finally(oldStyle?.remove)
	}
}

export default Style
