import EndpointAuthorUpdateSettings from "endpoint/author/EndpointAuthorUpdateSettings"
import Session from "model/Session"
import { Quilt } from "ui/utility/StringApplicator"
import Define from "utility/Define"
import State from "utility/State"

interface SettingBaseDefinition<ID extends string, TYPE> {
	name: Quilt.SimpleKey
	description?: Quilt.SimpleKey
	type: ID
	default: TYPE
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
	value: State.MutableSetOnly<TYPE>
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
}

export interface SettingsGroup extends SettingsGroupDefinition {
	settings: Setting[]
}

namespace Settings {
	const DEFS: SettingsGroup[] = []

	const SETTINGS = State
		.JIT(() => {
			const settings = Session.Auth.author.value?.settings
			if (!settings)
				return {}

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
			settings: Object.values(settings).map((setting) => {
				const state = SETTINGS.mapManual((settings) => settings[setting.name] ?? setting.default)
				Define.magic(state, 'value', {
					get: () => State.getInternalValue(state),
					set: (value: any) => {
						const settings = SETTINGS.value
						if (value === settings[setting.name])
							return

						settings[setting.name] = value ?? null

						const author = Session.Auth.author.value
						if (author) {
							author.settings = JSON.stringify(settings)
							Session.Auth.author.emit()
							EndpointAuthorUpdateSettings.query({ body: { settings: author.settings } })
						}
					},
				})
				return Object.assign(setting, { value: state }) as Setting
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
