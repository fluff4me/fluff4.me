import type App from "App"
import type View from "ui/view/View"
import type { PromiseOr } from "utility/Type"

interface ViewDefinitionBase<VIEW extends View, PARAMS extends object | undefined> {
	prepare?(params: PARAMS): PromiseOr<void>
	create (params: PARAMS): PromiseOr<VIEW | undefined>
}

interface ViewDefinition<VIEW extends View, PARAMS extends object | undefined> extends ViewDefinitionBase<VIEW, PARAMS> {
	navigate (app: App, params: PARAMS): Promise<VIEW | undefined>
}

function ViewDefinition<VIEW extends View, PARAMS extends object | undefined> (definition: ViewDefinitionBase<VIEW, PARAMS>): ViewDefinition<VIEW, PARAMS> {
	const result: ViewDefinition<VIEW, PARAMS> = {
		...definition,
		navigate: (app, params) => app.view.show(result, params),
	}
	return result
}

export default ViewDefinition
