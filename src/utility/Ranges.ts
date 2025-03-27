import Define from 'utility/Define'

declare global {
	interface Range {
		replaceContents (...nodes: Node[]): void
	}
}

namespace Ranges {
	export function applyPrototypes () {
		Define(Range.prototype, 'replaceContents', function (...nodes: Node[]) {
			this.deleteContents()

			let lastNode: Node = this.endContainer
			const dumbExtraBrowserNodesToRemove: ChildNode[] = []
			for (const node of nodes.reverse()) {
				const intendedNextSibling = lastNode.nextSibling
				lastNode = node
				this.insertNode(node)
				const newNextSibling = node.nextSibling
				if (newNextSibling && newNextSibling !== intendedNextSibling)
					dumbExtraBrowserNodesToRemove.push(newNextSibling)
			}

			for (const node of dumbExtraBrowserNodesToRemove)
				node.remove()
		})
	}
}

export default Ranges
