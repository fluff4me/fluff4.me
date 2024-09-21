import type View from "ui/view/View"
import type { PromiseOr } from "utility/Type"

interface ViewDefinition<VIEW extends View> {
	create (): PromiseOr<VIEW>
}

function ViewDefinition<VIEW extends View> (definition: ViewDefinition<VIEW>): ViewDefinition<VIEW> {
	return definition
}

export default ViewDefinition
