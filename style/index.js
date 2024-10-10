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
		"paragraph": [
			"block",
			"margin-bottom-3",
		],
		"block": [
			"padding-4",
			"margin-4",
			"border-radius-2",
			"inset-border-1",
			"block_2",
		],
		"block-header": [
			"block",
			"border-bottom-1",
			"unmargin-4",
			"padding-inline-4",
			"padding-block-2",
			"margin-bottom-4",
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
		"button--disabled": [
		],
		"checkbutton": [
		],
		"checkbutton-input": [
			"hidden",
		],
		"checkbutton--checked": [
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
			"height-5",
			"grid",
			"align-content-centre",
			"masthead",
		],
		"masthead-home": [
			"before-after",
			"font-5",
			"size-fit",
			"flex",
			"gap-2",
			"padding-2-3",
			"background-none",
			"box-shadow-none",
			"box-shadow-none__hover-any_focus-any",
			"masthead-home__before-after",
		],
		"masthead-home-logo": [
		],
		"masthead-home-logo-wordmark": [
			"no-pointer-events",
			"height-em",
		],
		"masthead-search": [
		],
		"masthead-user": [
			"flex",
			"align-content-centre",
			"padding-right-2",
			"margin-right-1",
		],
		"masthead-user-notifications": [
			"background-none",
			"box-shadow-none",
			"padding-2-3",
			"font-4",
			"box-shadow-none__hover-any_focus-any__2",
			"before",
			"masthead-user-notifications__before",
		],
		"masthead-user-profile": [
			"background-none",
			"box-shadow-none",
			"padding-2-3",
			"font-4",
			"box-shadow-none__hover-any_focus-any__3",
			"before",
			"masthead-user-profile__before",
		],
		"sidebar": [
			"sidebar",
			"padding-4",
			"margin-right-4",
			"relative",
			"height-100",
			"box-sizing-border-box",
			"after",
			"block__after",
			"absolute__after",
			"left-100__after",
			"top-5__after",
			"bottom-5__after",
			"border-left-1__after",
			"border-color-4__after",
			"box-shadow-right-inset-1__after",
			"width-1__after",
			"gradient-mask__after",
			"sidebar__after",
		],
		"view": [
		],
		"view-container": [
		],
		"view--hidden": [
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
			"account-view-oauth-service-container",
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
			"relative",
			"block",
			"size-100",
			"account-view-oauth-service-state",
			"block__before-after",
			"absolute__before-after__2",
			"width-1__before-after",
			"opacity-0__before-after",
			"height-50__before-after",
			"background-currentcolour__before-after",
			"account-view-oauth-service-state__before-after",
			"account-view-oauth-service-state__before",
			"rotate-45__before",
			"rotate-135__after",
			"account-view-oauth-service-state__after",
		],
		"account-view-oauth-service-state--authenticated": [
			"before-after",
			"opacity-1__before-after",
		],
		"account-view-oauth-service-state--focus": [
			"before-after",
			"account-view-oauth-service-state--focus__before-after",
			"account-view-oauth-service-state--focus__after",
		],
		"account-view-oauth-service--authenticated": [
		],
		"app": [
			"fixed",
			"height-100",
			"width-100",
			"grid",
			"app",
		],
	};
})

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiIsImZpbGUiOiIvaG9tZS9ydW5uZXIvd29yay9mbHVmZjQubWUvZmx1ZmY0Lm1lL2RvY3Mvc3R5bGUvaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6W119