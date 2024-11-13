import fs from "fs/promises"
import path from "path"
import Task from "./utility/Task"

interface VendorScript {
	name: string
	package?: string
	file?: string
	noUMD?: true
}

const VENDOR_SCRIPTS: (string | VendorScript)[] = [
	"prosemirror-commands",
	"prosemirror-dropcursor",
	"prosemirror-example-setup",
	"prosemirror-gapcursor",
	"prosemirror-history",
	"prosemirror-inputrules",
	"prosemirror-keymap",
	"prosemirror-markdown",
	"prosemirror-model",
	"prosemirror-schema-list",
	"prosemirror-state",
	"prosemirror-transform",
	"prosemirror-view",

	"linkify-it",
	"markdown-it",
	"mdurl",
	"orderedmap",
	"punycode.js",
	"rope-sequence",
	"uc.micro",
	"w3c-keyname",

	"entities",
	...[
		"decode",
		"encode",
		"escape",
		"decode_codepoint",
		"generated/decode-data-html",
		"generated/encode-html",
		"generated/decode-data-xml",
	].map(file => ({
		package: "entities",
		name: `entities/${file}`,
		file: `lib/${file}.js`,
	})),

	{
		name: "source-map-support",
		file: "browser-source-map-support.js",
		noUMD: true,
	},
]

const NO_OP_MODULES = [
	"prosemirror-menu",
	"crelt",
]

export default Task("vendor", async () => {
	let js = ""
	for (let script of VENDOR_SCRIPTS) {
		if (typeof script === "string" || !script.file) {
			interface PackageJson {
				main?: string
			}

			const name = typeof script === "string" ? script : script.package ?? script.name
			const packageJson = JSON.parse(await fs.readFile(`src/node_modules/${name}/package.json`, "utf8").catch(() => "null")) as PackageJson | null
			if (!packageJson?.main)
				throw new Error(`Unable to resolve "main" for module "${name}"`)

			script = {
				name,
				file: path.join(`src/node_modules/${name}`, packageJson.main),
			}

		} else {
			script.file = path.join(`src/node_modules/${script.package ?? script.name}`, script.file)
		}

		let content = await fs.readFile(script.file!, "utf8").catch(() => undefined)
		if (!content)
			throw new Error(`Unable to resolve script "${script.name}"`)

		content = content.replace(/\/\/# sourceMappingURL=.*?(\n|$)/g, "")

		if (!script.noUMD)
			content = `define("${script.name}",["require","exports"],(require,exports)=>{var module={get exports(){return exports},set exports(value){exports._replace(value);exports=value}};\n${content}\n});\n`

		js += content
	}

	for (const module of NO_OP_MODULES)
		js += `define("${module}",[],()=>{})\n`

	await fs.writeFile("docs/js/vendor.js", js)
})
