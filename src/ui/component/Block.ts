import Component from "ui/Component"

export enum BlockClasses {
	Main = "block",
}

export default Component.Builder((component = Component()) => component
	.classes.add(BlockClasses.Main)
)
