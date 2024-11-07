import type App from "App"
import type View from "ui/view/View"
import type { PromiseOr } from "utility/Type"

interface ViewDefinitionBase<VIEW extends View, PARAMS extends object | undefined, LOAD_PARAMS extends object | undefined = undefined> {
	requiresLogin?: true
	load?(params: PARAMS): PromiseOr<LOAD_PARAMS>
	create (params: PARAMS, loadParams?: LOAD_PARAMS): PromiseOr<VIEW | undefined>
}

interface ViewDefinition<VIEW extends View, PARAMS extends object | undefined, LOAD_PARAMS extends object | undefined> extends ViewDefinitionBase<VIEW, PARAMS, LOAD_PARAMS> {
	navigate (app: App, params: PARAMS): Promise<VIEW | undefined>
}

function ViewDefinition<VIEW extends View, PARAMS extends object | undefined, LOAD_PARAMS extends object | undefined> (definition: ViewDefinitionBase<VIEW, PARAMS, LOAD_PARAMS>): ViewDefinition<VIEW, PARAMS, LOAD_PARAMS> {
	const result: ViewDefinition<VIEW, PARAMS, LOAD_PARAMS> = {
		...definition,
		navigate: (app, params) => app.view.show(result, params),
	}
	return result
}

export default ViewDefinition
