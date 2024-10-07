import type App from "App"
import type View from "ui/view/View"
import type { PromiseOr } from "utility/Type"

interface ViewDefinitionBase<VIEW extends View, PARAMS extends object> {
	create (params: PARAMS): PromiseOr<VIEW>
}

interface ViewDefinition<VIEW extends View, PARAMS extends object> extends ViewDefinitionBase<VIEW, PARAMS> {
	navigate (app: App, params: PARAMS): Promise<VIEW>
}

function ViewDefinition<VIEW extends View, PARAMS extends object> (definition: ViewDefinitionBase<VIEW, PARAMS>): ViewDefinition<VIEW, PARAMS> {
	const result: ViewDefinition<VIEW, PARAMS> = {
		...definition,
		navigate: (app, params) => app.view.show(result, params),
	}
	return result
}

export default ViewDefinition
