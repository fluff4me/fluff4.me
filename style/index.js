(factory => {
	if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports)
        if (v !== undefined) module.exports = v
    }
    else if (typeof define === "function" && define.amd)
        define(["require", "exports"], factory)
})((require, exports) => {
    "use strict"
    Object.defineProperty(exports, "__esModule", { value: true })
	exports.default = {
		"body": [
			"margin-0",
			"overflow-hidden",
			"body_2",
			"body",
		],
		"slot": [
			"contents",
		],
		"paragraph": [
			"block",
			"margin-bottom-3",
		],
		"block": [
			"block",
			"padding-4",
			"border-radius-2",
			"inset-border-1",
			"width-100",
			"block-border-shadow",
			"scheme-light-dark",
			"border-box",
			"block_3",
			"block_2",
		],
		"block-header": [
			"block",
			"border-bottom-1",
			"unmargin-4",
			"padding-inline-4",
			"padding-block-2",
			"margin-bottom-4",
			"border-top-radius-2",
			"block-header",
		],
		"block-title": [
			"z-index-0",
		],
		"block-description": [
		],
		"link": [
		],
		"button": [
			"borderless",
			"inline-block",
			"padding-2-3",
			"cursor-pointer",
			"no-select",
			"weight-bold",
			"border-radius-1",
			"font-family-inherit",
			"font-3",
			"box-shadow-1",
			"button",
			"button__hover-any_focus-any",
			"translate-up-1__hover-any_focus-any",
			"box-shadow-2__hover-any_focus-any",
			"button__hover-any_focus-any_3",
			"button__active-any",
			"translate-y-0__active-any",
			"box-shadow-inset-1__active-any",
			"button__active-any_3",
		],
		"button-type-flush": [
			"box-shadow-none",
			"button-type-flush",
		],
		"button-text": [
			"font-vertical-align",
		],
		"button--disabled": [
		],
		"text-input": [
			"borderless",
			"background-none",
			"font-inherit",
			"font-family-inherit",
			"relative",
			"block",
			"width-100",
			"padding-2-3",
			"border-box",
			"border-1",
			"border-radius-1",
			"text-input",
			"background-unclip",
		],
		"heading": [
			"before-after",
			"relative",
			"margin-0",
			"weight-normal",
			"font-inherit",
			"text-shadow",
			"heading",
			"absolute__before-after",
			"z-index-bg__before-after",
			"heading__before-after",
			"heading__before",
			"heading__after",
		],
		"heading-1": [
			"font-6",
			"font-righteous",
		],
		"heading-2": [
		],
		"heading-3": [
		],
		"heading-4": [
		],
		"heading-5": [
		],
		"heading-6": [
		],
		"checkbutton": [
		],
		"checkbutton-input": [
			"hidden",
		],
		"checkbutton--checked": [
		],
		"label": [
		],
		"label-required": [
			"after",
			"label-required__after",
		],
		"label--invalid": [
			"label--invalid",
		],
		"labelled-table": [
			"gap-3",
			"grid",
			"labelled-table",
		],
		"labelled-row": [
			"gap-3",
			"align-items-centre",
		],
		"labelled-row--in-labelled-table": [
			"grid",
			"columns-subgrid",
			"align-items-start",
			"labelled-row--in-labelled-table",
		],
		"labelled-row-label": [
			"sticky",
			"top-0",
			"padding-2-0",
		],
		"labelled-row-content": [
			"block",
			"relative",
		],
		"action-row": [
			"flex",
			"width-100",
			"gap-3",
			"action-row",
		],
		"action-row-left": [
			"flex",
			"flex-grow",
			"justify-content-start",
			"gap-3",
		],
		"action-row-middle": [
			"flex",
			"flex-grow",
			"justify-content-centre",
			"gap-3",
		],
		"action-row-right": [
			"flex",
			"flex-grow",
			"justify-content-end",
			"gap-3",
		],
		"popover": [
			"padding-3",
			"border-radius-2",
			"inset-border-1",
			"borderless",
			"backdrop-blur",
			"flex-column",
			"gap-2",
			"block-border-shadow__2",
			"scheme-light-dark",
			"transparent",
			"translate-down-3",
			"margin-inline-0",
			"margin-block-2",
			"popover",
			"transition-discrete",
			"flex__popover",
			"opaque__popover",
			"popover__popover",
			"translate-y-0__popover",
			"transparent__popover__start",
			"translate-up-2__popover__start",
		],
		"text-editor": [
			"block",
			"width-100",
			"padding-2-3",
			"padding-top-0",
			"border-box",
			"border-1",
			"border-radius-1",
			"cursor-text",
			"text-editor",
			"background-unclip__2",
			"text-editor__focus-any_active-any",
		],
		"text-editor-toolbar": [
			"block",
			"unmargin-0-3",
			"sticky",
			"border-bottom-1",
			"cursor-default",
			"z-index-fg",
			"backdrop-blur",
			"border-top-radius-1",
			"top-0",
			"text-editor-toolbar",
		],
		"text-editor-toolbar-button": [
			"relative",
			"font-1",
			"border-box",
			"text-align-centre",
			"vertical-align-middle",
			"text-editor-toolbar-button",
			"before",
			"block__before",
			"absolute__before",
			"text-align-centre__before",
			"width-100__before",
			"text-editor-toolbar-button__before",
		],
		"text-editor-toolbar-button--enabled": [
			"after",
			"block__after",
			"absolute__after",
			"border-radius-1__after",
			"background-3__after",
			"inset-block-1__after",
			"z-index-bg__after",
			"text-editor-toolbar-button--enabled__after",
		],
		"text-editor-toolbar-bold": [
			"background-none",
			"box-shadow-none",
			"padding-2-3",
			"font-3",
			"font-font-awesome",
			"content-box",
			"size-em",
			"box-shadow-none__hover-any_focus-any",
			"before",
			"text-editor-toolbar-bold__before",
			"padding-left-3",
			"border-top-left-radius-1",
			"text-editor-toolbar-bold",
		],
		"text-editor-toolbar-italic": [
			"background-none",
			"box-shadow-none",
			"padding-2-3",
			"font-3",
			"font-font-awesome",
			"content-box",
			"size-em",
			"box-shadow-none__hover-any_focus-any__2",
			"before",
			"text-editor-toolbar-italic__before",
		],
		"text-editor-toolbar-underline": [
			"background-none",
			"box-shadow-none",
			"padding-2-3",
			"font-3",
			"font-font-awesome",
			"content-box",
			"size-em",
			"box-shadow-none__hover-any_focus-any__3",
			"before",
			"text-editor-toolbar-underline__before",
		],
		"text-editor-toolbar-strikethrough": [
			"background-none",
			"box-shadow-none",
			"padding-2-3",
			"font-3",
			"font-font-awesome",
			"content-box",
			"size-em",
			"box-shadow-none__hover-any_focus-any__4",
			"before",
			"text-editor-toolbar-strikethrough__before",
		],
		"text-editor-toolbar-subscript": [
			"background-none",
			"box-shadow-none",
			"padding-2-3",
			"font-3",
			"font-font-awesome",
			"content-box",
			"size-em",
			"box-shadow-none__hover-any_focus-any__5",
			"before",
			"text-editor-toolbar-subscript__before",
		],
		"text-editor-toolbar-superscript": [
			"background-none",
			"box-shadow-none",
			"padding-2-3",
			"font-3",
			"font-font-awesome",
			"content-box",
			"size-em",
			"box-shadow-none__hover-any_focus-any__6",
			"before",
			"text-editor-toolbar-superscript__before",
		],
		"text-editor-toolbar-blockquote": [
			"background-none",
			"box-shadow-none",
			"padding-2-3",
			"font-3",
			"font-font-awesome",
			"content-box",
			"size-em",
			"box-shadow-none__hover-any_focus-any__7",
			"before",
			"text-editor-toolbar-blockquote__before",
		],
		"text-editor-toolbar-code": [
			"background-none",
			"box-shadow-none",
			"padding-2-3",
			"font-3",
			"font-font-awesome",
			"content-box",
			"size-em",
			"box-shadow-none__hover-any_focus-any__8",
			"before",
			"text-editor-toolbar-code__before",
		],
		"text-editor-document": [
			"block",
			"no-outline",
			"text-editor-document",
			"text-editor-document_2",
			"text-editor-document_3",
		],
		"text-editor--required": [
		],
		"form": [
		],
		"form-content": [
		],
		"form-footer": [
			"unmargin-4",
			"padding-inline-4",
			"padding-block-3",
			"margin-top-4",
			"border-top-1",
			"border-bottom-radius-2",
			"form-footer",
			"background-unclip__3",
		],
		"form-submit": [
			"form-submit",
			"form-submit__hover-any_focus-any",
			"form-submit__active-any",
		],
		"flag": [
			"size-em",
			"flag",
		],
		"flag-stripe": [
			"flag-stripe",
			"absolute",
			"top-0",
			"left-0",
			"height-100",
			"flag-stripe_3",
		],
		"flag-stripe-blue": [
			"flag-stripe-blue",
		],
		"flag-stripe-pink": [
			"flag-stripe-pink",
		],
		"flag-stripe-white": [
			"flag-stripe-white",
		],
		"flag-stripe-1": [
			"flag-stripe-1",
			"flag-stripe-1_2",
		],
		"flag-stripe-2": [
			"flag-stripe-2",
			"flag-stripe-2_2",
		],
		"flag-stripe-3": [
			"flag-stripe-3",
			"flag-stripe-3_2",
		],
		"flag-stripe-4": [
			"flag-stripe-4",
			"flag-stripe-4_2",
		],
		"flag-stripe-5": [
			"flag-stripe-5",
			"flag-stripe-5_2",
		],
		"flag-stripe--animate": [
			"flag-stripe--animate",
		],
		"flag-stripe--animate-end-0": [
			"flag-stripe--animate-end-0",
		],
		"flag-stripe--animate-end-1": [
			"flag-stripe--animate-end-1",
		],
		"flag--focused": [
			"flag--focused",
		],
		"flag--active": [
			"flag--active",
		],
		"masthead": [
			"background-dark-a30",
			"grid",
			"align-content-centre",
			"font-4",
			"padding-1-0",
			"masthead",
			"masthead_3",
			"masthead_2",
		],
		"masthead-skip-nav": [
			"no-pointer-events",
			"transparent",
			"masthead-skip-nav",
			"z-index-fg",
			"masthead-skip-nav_3",
			"opaque__hover-any_focus-any",
			"pointer-events__hover-any_focus-any",
		],
		"masthead-left": [
			"flex",
			"padding-left-2",
			"margin-left-2",
			"masthead-left",
		],
		"masthead-left-hamburger": [
			"background-none",
			"box-shadow-none",
			"padding-2-3",
			"font-3",
			"font-font-awesome",
			"content-box",
			"size-em",
			"box-shadow-none__hover-any_focus-any__9",
			"before",
			"masthead-left-hamburger__before",
		],
		"masthead-left-hamburger-sidebar": [
			"masthead-left-hamburger-sidebar",
		],
		"masthead-left-hamburger-popover": [
			"hidden",
			"masthead-left-hamburger-popover",
		],
		"masthead-home": [
			"before-after",
			"font-inherit__2",
			"size-fit",
			"flex",
			"gap-2",
			"padding-2-3",
			"background-none",
			"box-shadow-none",
			"box-shadow-none__hover-any_focus-any__10",
			"masthead-home__before-after",
		],
		"masthead-home-logo": [
		],
		"masthead-home-logo-wordmark": [
			"no-pointer-events",
			"height-em",
		],
		"masthead-search": [
			"masthead-search",
		],
		"masthead-user": [
			"flex",
			"align-content-centre",
			"padding-right-2",
			"margin-right-2",
			"justify-content-end",
			"masthead-user",
		],
		"masthead-user-notifications": [
			"background-none",
			"box-shadow-none",
			"padding-2-3",
			"font-3",
			"font-font-awesome",
			"content-box",
			"size-em",
			"box-shadow-none__hover-any_focus-any__11",
			"before",
			"masthead-user-notifications__before",
		],
		"masthead-user-profile": [
			"background-none",
			"box-shadow-none",
			"padding-2-3",
			"font-3",
			"font-font-awesome",
			"content-box",
			"size-em",
			"box-shadow-none__hover-any_focus-any__12",
			"before",
			"masthead-user-profile__before",
		],
		"sidebar": [
			"padding-4",
			"margin-right-4",
			"relative",
			"height-100",
			"border-box",
			"transparent",
			"translate",
			"sidebar",
			"after",
			"block__after",
			"absolute__after__2",
			"left-100__after",
			"top-5__after",
			"bottom-5__after",
			"border-left-1__after",
			"border-color-4__after",
			"box-shadow-right-inset-1__after",
			"width-1__after",
			"gradient-mask__after",
			"sidebar__after",
			"sidebar__focus-any",
			"opaque__focus-any",
			"sidebar_3",
			"sidebar_2",
		],
		"sidebar--visible": [
			"sidebar--visible",
			"opaque",
		],
		"sidebar--visible-due-to-keyboard-navigation": [
			"sidebar--visible-due-to-keyboard-navigation",
			"opaque",
		],
		"view": [
			"flex",
			"flex-column",
			"align-items-center",
			"gap-4",
			"padding-4-0",
		],
		"view-container": [
		],
		"view--hidden": [
		],
		"view-transition-0": [
			"view-transition-0",
		],
		"view-transition-1": [
			"view-transition-1",
		],
		"view-transition-2": [
			"view-transition-2",
		],
		"view-transition-3": [
			"view-transition-3",
		],
		"view-transition-4": [
			"view-transition-4",
		],
		"view-transition-5": [
			"view-transition-5",
		],
		"view-transition-6": [
			"view-transition-6",
		],
		"view-transition-7": [
			"view-transition-7",
		],
		"view-transition-8": [
			"view-transition-8",
		],
		"view-transition-9": [
			"view-transition-9",
		],
		"view-transition-10": [
			"view-transition-10",
		],
		"view-transition-11": [
			"view-transition-11",
		],
		"view-transition-12": [
			"view-transition-12",
		],
		"view-transition-13": [
			"view-transition-13",
		],
		"view-transition-14": [
			"view-transition-14",
		],
		"view-transition-15": [
			"view-transition-15",
		],
		"view-transition-16": [
			"view-transition-16",
		],
		"view-transition-17": [
			"view-transition-17",
		],
		"view-transition-18": [
			"view-transition-18",
		],
		"view-transition-19": [
			"view-transition-19",
		],
		"view-transition-20": [
			"view-transition-20",
		],
		"view-transition-21": [
			"view-transition-21",
		],
		"view-transition-22": [
			"view-transition-22",
		],
		"view-transition-23": [
			"view-transition-23",
		],
		"view-transition-24": [
			"view-transition-24",
		],
		"view-transition-25": [
			"view-transition-25",
		],
		"view-transition-26": [
			"view-transition-26",
		],
		"view-transition-27": [
			"view-transition-27",
		],
		"view-transition-28": [
			"view-transition-28",
		],
		"view-transition-29": [
			"view-transition-29",
		],
		"view-transition-30": [
			"view-transition-30",
		],
		"view-transition-31": [
			"view-transition-31",
		],
		"view-transition-32": [
			"view-transition-32",
		],
		"view-transition-33": [
			"view-transition-33",
		],
		"view-transition-34": [
			"view-transition-34",
		],
		"view-transition-35": [
			"view-transition-35",
		],
		"view-transition-36": [
			"view-transition-36",
		],
		"view-transition-37": [
			"view-transition-37",
		],
		"view-transition-38": [
			"view-transition-38",
		],
		"view-transition-39": [
			"view-transition-39",
		],
		"subview-transition": [
			"subview-transition",
		],
		"view-type-error": [
		],
		"view-type-debug": [
			"flex",
			"flex-column",
			"gap-4",
			"padding-4",
		],
		"debug-block": [
			"flex",
			"gap-3",
		],
		"view-type-account": [
		],
		"account-view-oauth-service": [
			"relative",
			"flex",
			"gap-3",
			"align-items-centre",
			"account-view-oauth-service",
			"height-lh",
			"account-view-oauth-service_3",
			"account-view-oauth-service__hover-any_focus-any",
			"account-view-oauth-service__active-any",
		],
		"account-view-oauth-service-container": [
			"block",
		],
		"account-view-oauth-service-list": [
			"flex",
			"flex-column",
			"gap-3",
		],
		"account-view-oauth-service-icon": [
			"size-constrain-em",
		],
		"account-view-oauth-service-name": [
			"font-vertical-align",
			"flex-grow",
		],
		"account-view-oauth-service-state": [
			"before-after",
			"block",
			"absolute",
			"inset-0",
			"rotate-45",
			"block__before-after",
			"absolute__before-after__2",
			"size-1__before-after",
			"opacity-0__before-after",
			"background-currentcolour__before-after",
			"account-view-oauth-service-state__before-after",
			"height-100__before",
			"top-0__before",
			"width-50__after",
			"left-0__after",
			"account-view-oauth-service-state__after",
		],
		"account-view-oauth-service-state-wrapper": [
			"relative",
			"block",
			"size-100",
			"account-view-oauth-service-state-wrapper",
		],
		"account-view-oauth-service-state-wrapper--focus": [
			"translate-left-1",
		],
		"account-view-oauth-service-state--authenticated": [
			"before-after",
			"opacity-1__before-after",
		],
		"account-view-oauth-service-state--focus": [
			"after",
			"width-100__after",
			"account-view-oauth-service-state--focus__after",
		],
		"account-view-oauth-service-username": [
			"transparent",
		],
		"account-view-oauth-service-username--has-username": [
			"opacity-70",
		],
		"account-view-oauth-service--authenticated": [
		],
		"account-view-form-create": [
		],
		"view-type-home": [
		],
		"view-type-author": [
		],
		"app": [
			"fixed",
			"height-100",
			"width-100",
			"grid",
			"app_2",
			"app",
		],
		"app-content": [
			"grid",
			"columns-subgrid",
			"overflow-auto-y",
			"gutter-stable",
			"app-content_2",
			"app-content",
		],
		"app-content-related": [
			"app-content-related_2",
			"app-content-related",
		],
	};
})

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiIsImZpbGUiOiIvaG9tZS9ydW5uZXIvd29yay9mbHVmZjQubWUvZmx1ZmY0Lm1lL2RvY3Mvc3R5bGUvaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6W119