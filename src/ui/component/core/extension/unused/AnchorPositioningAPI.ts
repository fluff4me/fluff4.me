//#region Not currently used

// interface AnchorNameManipulator<HOST> {
// 	(name: string): HOST
// 	remove (name: string): HOST
// }

// interface AnchorComponentExtensions {
// 	anchorName: AnchorNameManipulator<this>
// }

// declare module "ui/Component" {
// 	interface ComponentExtensions extends AnchorComponentExtensions { }
// }

// Component.extend<AnchorComponentExtensions>(component => {
// 	let anchorNames: string[] | undefined
// 	return {
// 		anchorName: Object.assign(
// 			(name: string) => {
// 				anchorNames ??= []
// 				if (!name.startsWith("--"))
// 					name = `--${name}`

// 				anchorNames.push(name)
// 				component.style.setProperty("anchor-name", anchorNames.join(","))
// 				return component
// 			},
// 			{
// 				remove: (name: string) => {
// 					const index = anchorNames?.indexOf(name) ?? -1
// 					if (index === -1)
// 						return component

// 					anchorNames!.splice(index, 1)
// 					if (!anchorNames!.length)
// 						component.style.removeProperties("anchor-name")
// 					else
// 						component.style.setProperty("anchor-name", anchorNames!.join(","))
// 					return component
// 				},
// 			},
// 		),
// 	}
// })

// namespace Anchor {
// 	const INDICES: Record<string, number> = {}

// 	export function name (type: string) {
// 		const id = INDICES[type] ?? 0
// 		INDICES[type] = id + 1
// 		return `--${type}-${id}`
// 	}
// }

// export default Anchor
