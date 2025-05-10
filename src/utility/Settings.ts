import EndpointAuthorUpdateSettings from 'endpoint/author/EndpointAuthorUpdateSettings'
import Session from 'model/Session'
import type { Quilt } from 'ui/utility/StringApplicator'
import Define from 'utility/Define'
import Functions from 'utility/Functions'
import State from 'utility/State'
import Store from 'utility/Store'
import type { SupplierOr } from 'utility/Type'

declare module 'utility/Store' {
	interface ILocalStorage {
		settings: string
	}
}

interface SettingBaseDefinition<ID extends string, TYPE> {
	tag?: SupplierOr<string>
	name: Quilt.SimpleKey
	description?: Quilt.SimpleKey
	type: ID
	default: TYPE
	tweakState?(state: State.Generator<TYPE>): unknown
}

type SettingBooleanDefinition = SettingBaseDefinition<'boolean', boolean>

interface SettingNumberDefinition extends SettingBaseDefinition<'number', number> {
	min?: number
	max?: number
	step?: number
}

interface SettingStringDefinition extends SettingBaseDefinition<'string', string> {
	minLength?: number
	maxLength?: number
}

export type SettingDefinition =
	| SettingBooleanDefinition
	| SettingStringDefinition
	| SettingNumberDefinition

interface SettingValue<TYPE> {
	state: State.MutableSetOnly<TYPE | undefined>
}

type Setting = {
	[KEY in SettingDefinition['type']]:
	| Extract<SettingDefinition, SettingBaseDefinition<KEY, any>> extends infer SETTING extends SettingBaseDefinition<KEY, any>
	? SETTING & SettingValue<SETTING['default']>
	: never
}[SettingDefinition['type']]

export interface SettingsGroupDefinition {
	name: Quilt.SimpleKey
	settings: SettingDefinition[]
	hidden?: true
}

export interface SettingsGroup extends SettingsGroupDefinition {
	settings: Setting[]
}

namespace Settings {
	const DEFS: SettingsGroup[] = []

	const SETTINGS = State
		.JIT(() => {
			const settings = Session.Auth.author.value ? Session.Auth.author.value?.settings : Store.items.settings
			if (!settings)
				return {}

			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return JSON.parse(settings)
		})
		.observe(Session.Auth.author)

	export function boolean (def: Omit<SettingBooleanDefinition, 'type'>) {
		return { ...def, type: 'boolean' } as SettingBooleanDefinition & SettingValue<boolean>
	}

	export function string (def: Omit<SettingStringDefinition, 'type'>) {
		return { ...def, type: 'string' } as SettingStringDefinition & SettingValue<string>
	}

	export function number (def: Omit<SettingNumberDefinition, 'type'>) {
		return { ...def, type: 'number' } as SettingNumberDefinition & SettingValue<number>
	}

	export function get (): readonly SettingsGroup[] {
		return DEFS
	}

	export function registerGroup<const SETTINGS extends Record<string, SettingDefinition>> (name: Quilt.SimpleKey, settings: SETTINGS) {
		DEFS.push({
			name,
			settings: Object.values(settings).map(setting => {
				const id = () => `${setting.tag ? `${Functions.resolve(setting.tag)}:` : ''}${setting.name}`
				// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
				const state = SETTINGS.mapManual(settings => settings[id()] ?? setting.default)
				setting.tweakState?.(state as never)
				Define.magic(state, 'value', {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-return
					get: () => State.getInternalValue(state),
					set: (value: any) => {
						// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
						const settings = SETTINGS.value
						// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
						if (value === settings[id()])
							return

						// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
						settings[id()] = value ?? null

						const author = Session.Auth.author.value
						if (author) {
							author.settings = JSON.stringify(settings)
							Session.Auth.author.emit()
							void EndpointAuthorUpdateSettings.query({ body: { settings: author.settings } })
							Session.setAuthor(author)
						}
						else {
							Store.items.settings = JSON.stringify(settings)
						}
					},
				})
				return Object.assign(setting, { state }) as Setting
			}),
		})

		return settings as any as {
			[KEY in keyof SETTINGS]:
			| SETTINGS[KEY] extends infer SETTING extends SettingDefinition
			? SETTING & SettingValue<SETTING['default']>
			: never
		}
	}
}

Object.assign(window, { Settings })
export default Settings
