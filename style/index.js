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
			"body",
			"margin-0",
			"overflow-hidden",
			"font-3",
			"body_2",
		],
		"align-left": [
			"align-left",
		],
		"markdown": [
			"markdown",
			"after",
		],
		"view-transition": [
			"view-transition",
		],
		"subview-transition": [
			"subview-transition",
		],
		"view-transition-delay-0": [
			"view-transition-delay-0",
		],
		"view-transition-delay-1": [
			"view-transition-delay-1",
		],
		"view-transition-delay-2": [
			"view-transition-delay-2",
		],
		"view-transition-delay-3": [
			"view-transition-delay-3",
		],
		"view-transition-delay-4": [
			"view-transition-delay-4",
		],
		"view-transition-delay-5": [
			"view-transition-delay-5",
		],
		"view-transition-delay-6": [
			"view-transition-delay-6",
		],
		"view-transition-delay-7": [
			"view-transition-delay-7",
		],
		"view-transition-delay-8": [
			"view-transition-delay-8",
		],
		"view-transition-delay-9": [
			"view-transition-delay-9",
		],
		"view-transition-delay-10": [
			"view-transition-delay-10",
		],
		"view-transition-delay-11": [
			"view-transition-delay-11",
		],
		"view-transition-delay-12": [
			"view-transition-delay-12",
		],
		"view-transition-delay-13": [
			"view-transition-delay-13",
		],
		"view-transition-delay-14": [
			"view-transition-delay-14",
		],
		"view-transition-delay-15": [
			"view-transition-delay-15",
		],
		"view-transition-delay-16": [
			"view-transition-delay-16",
		],
		"view-transition-delay-17": [
			"view-transition-delay-17",
		],
		"view-transition-delay-18": [
			"view-transition-delay-18",
		],
		"view-transition-delay-19": [
			"view-transition-delay-19",
		],
		"view-transition-delay-20": [
			"view-transition-delay-20",
		],
		"view-transition-delay-21": [
			"view-transition-delay-21",
		],
		"view-transition-delay-22": [
			"view-transition-delay-22",
		],
		"view-transition-delay-23": [
			"view-transition-delay-23",
		],
		"view-transition-delay-24": [
			"view-transition-delay-24",
		],
		"view-transition-delay-25": [
			"view-transition-delay-25",
		],
		"view-transition-delay-26": [
			"view-transition-delay-26",
		],
		"view-transition-delay-27": [
			"view-transition-delay-27",
		],
		"view-transition-delay-28": [
			"view-transition-delay-28",
		],
		"view-transition-delay-29": [
			"view-transition-delay-29",
		],
		"view-transition-delay-30": [
			"view-transition-delay-30",
		],
		"view-transition-delay-31": [
			"view-transition-delay-31",
		],
		"view-transition-delay-32": [
			"view-transition-delay-32",
		],
		"view-transition-delay-33": [
			"view-transition-delay-33",
		],
		"view-transition-delay-34": [
			"view-transition-delay-34",
		],
		"view-transition-delay-35": [
			"view-transition-delay-35",
		],
		"view-transition-delay-36": [
			"view-transition-delay-36",
		],
		"view-transition-delay-37": [
			"view-transition-delay-37",
		],
		"view-transition-delay-38": [
			"view-transition-delay-38",
		],
		"view-transition-delay-39": [
			"view-transition-delay-39",
		],
		"action-group": [
			"flex",
			"flex-column",
			"gap-0",
		],
		"break": [
			"block",
			"margin-top-1",
			"content",
		],
		"slot": [
			"contents",
		],
		"paragraph": [
			"block",
			"margin-bottom-3",
		],
		"placeholder": [
			"italic",
		],
		"dialog": [
			"borderless",
			"margin-0",
			"padding-0",
			"max-size-none",
			"background-none",
		],
		"dialog--open": [
			"block",
			"relative",
			"z-index-fg",
		],
		"dialog--fullscreen": [
			"size-100",
			"inset-0",
		],
		"dialog--not-modal": [
			"fixed",
			"inset-auto",
			"dialog--not-modal",
		],
		"dialog-block": [
			"dialog-block",
		],
		"dialog-block-wrapper": [
			"overflow-visible",
			"margin-auto",
			"dialog-block-wrapper",
			"transition-discrete",
			"dialog-block-wrapper__backdrop",
			"backdrop-blur__backdrop",
			"dialog-block-wrapper__backdrop_3",
		],
		"dialog-block-wrapper--closed": [
			"background-none__backdrop",
			"backdrop-filter-none__backdrop",
		],
		"dialog-block--closed": [
			"translate-down-5",
			"transparent",
		],
		"dialog-block--opening": [
			"translate-up-4",
			"transparent",
			"transition-none",
		],
		"link": [
			"weight-bold",
			"colour-blue",
			"link",
			"decoration-underline__hover_focus-visible-has-focus-visible",
			"colour-0__hover_focus-visible-has-focus-visible",
			"link__hover_focus-visible-has-focus-visible",
		],
		"link-external": [
			"after",
			"font-font-awesome__after",
			"vertical-align-super__after",
			"weight-bold__after",
			"link-external__after",
		],
		"button": [
			"borderless",
			"padding-2-3",
			"cursor-pointer",
			"no-select",
			"weight-bold",
			"border-radius-1",
			"font-family-inherit",
			"font-3",
			"box-shadow-1",
			"decoration-none",
			"inline-flex",
			"column-gap-2",
			"button",
			"button__hover_focus-visible-has-focus-visible",
			"translate-up-1__hover_focus-visible-has-focus-visible",
			"box-shadow-2__hover_focus-visible-has-focus-visible",
			"button__hover_focus-visible-has-focus-visible_3",
			"button__active",
			"translate-y-0__active",
			"box-shadow-inset-1__active",
			"button__active_3",
		],
		"button--webkit": [
			"button--webkit",
		],
		"button-type-icon": [
			"font-4",
			"background-none__2",
			"box-shadow-none",
			"box-shadow-none__hover_focus-visible-has-focus-visible",
		],
		"button-type-flush": [
			"box-shadow-none__not-hover-focus-visible-has-focus-visible-active",
			"button-type-flush__not-hover-focus-visible-has-focus-visible-active",
		],
		"button-type-inherit-size": [
			"font-inherit",
		],
		"button-type-primary": [
			"button-type-primary",
			"button-type-primary__hover_focus-visible-has-focus-visible",
			"button-type-primary__active",
		],
		"button-text": [
			"font-vertical-align",
		],
		"button-subtext": [
			"font-0",
			"weight-normal",
			"unmargin-top-1",
			"colour-4",
		],
		"button--has-subtext": [
			"inline-grid",
			"font-3",
			"button--has-subtext",
		],
		"button--disabled": [
			"button--disabled",
			"box-shadow-none",
			"opacity-30",
			"cursor-default",
			"pointer-events-none",
			"translate-y-0__hover_focus-visible-has-focus-visible_active",
			"box-shadow-none__hover_focus-visible-has-focus-visible_active",
		],
		"button--disabled--hover": [
			"button--disabled--hover",
		],
		"button--disabled--active": [
			"box-shadow-inset-1",
			"button--disabled--active",
		],
		"button-icon": [
			"flex",
			"relative",
			"font-font-awesome",
			"weight-bolder",
			"size-em",
			"z-index-fg",
			"row-1-2",
			"align-self-centre",
			"justify-self-centre",
			"align-items-centre",
			"justify-items-centre",
			"justify-content-centre",
			"align-content-centre",
			"button-icon",
		],
		"button-icon--has-subtext": [
			"unmargin-top-1__2",
		],
		"button-icon--type-icon": [
			"font-inherit",
			"margin-0__2",
		],
		"button-icon--no-icon": [
			"hidden",
		],
		"button-icon-plus": [
			"before",
			"button-icon-plus__before",
		],
		"button-icon-ellipsis-vertical": [
			"before",
			"button-icon-ellipsis-vertical__before",
			"justify-content-centre",
		],
		"button-icon-xmark": [
			"before",
			"button-icon-xmark__before",
		],
		"button-icon-bars": [
			"before",
			"button-icon-bars__before",
		],
		"button-icon-circle-user": [
			"before",
			"button-icon-circle-user__before",
		],
		"button-icon-bell": [
			"before",
			"button-icon-bell__before",
		],
		"button-icon-angles-left": [
			"before",
			"button-icon-angles-left__before",
		],
		"button-icon-angles-right": [
			"before",
			"button-icon-angles-right__before",
		],
		"button-icon-angle-left": [
			"before",
			"button-icon-angle-left__before",
		],
		"button-icon-angle-right": [
			"before",
			"button-icon-angle-right__before",
		],
		"button-icon-heart": [
			"before",
			"button-icon-heart__before",
		],
		"button-icon-check": [
			"before",
			"button-icon-check__before",
		],
		"button-icon-check-double": [
			"before",
			"button-icon-check-double__before",
		],
		"button-icon-arrow-left": [
			"before",
			"button-icon-arrow-left__before",
		],
		"button-icon-arrow-right": [
			"before",
			"button-icon-arrow-right__before",
		],
		"button-icon-arrow-up": [
			"before",
			"button-icon-arrow-up__before",
		],
		"button-icon-arrow-down": [
			"before",
			"button-icon-arrow-down__before",
		],
		"button-icon-bold": [
			"before",
			"button-icon-bold__before",
		],
		"button-icon-italic": [
			"before",
			"button-icon-italic__before",
		],
		"button-icon-underline": [
			"before",
			"button-icon-underline__before",
		],
		"button-icon-strikethrough": [
			"before",
			"button-icon-strikethrough__before",
		],
		"button-icon-subscript": [
			"before",
			"button-icon-subscript__before",
		],
		"button-icon-superscript": [
			"before",
			"button-icon-superscript__before",
		],
		"button-icon-quote-left": [
			"before",
			"button-icon-quote-left__before",
		],
		"button-icon-list-ul": [
			"before",
			"button-icon-list-ul__before",
		],
		"button-icon-list-ol": [
			"before",
			"button-icon-list-ol__before",
		],
		"button-icon-outdent": [
			"before",
			"button-icon-outdent__before",
		],
		"button-icon-paragraph": [
			"before",
			"button-icon-paragraph__before",
		],
		"button-icon-heading": [
			"before",
			"button-icon-heading__before",
		],
		"button-icon-code": [
			"before",
			"button-icon-code__before",
		],
		"button-icon-link": [
			"before",
			"button-icon-link__before",
		],
		"button-icon-align-left": [
			"before",
			"button-icon-align-left__before",
		],
		"button-icon-align-right": [
			"before",
			"button-icon-align-right__before",
		],
		"button-icon-align-center": [
			"before",
			"button-icon-align-center__before",
		],
		"button-icon-align-justify": [
			"before",
			"button-icon-align-justify__before",
		],
		"button-icon-asterisk": [
			"before",
			"button-icon-asterisk__before",
		],
		"button-icon-expand": [
			"before",
			"button-icon-expand__before",
		],
		"button-icon-compress": [
			"before",
			"button-icon-compress__before",
		],
		"button-icon-bug": [
			"before",
			"button-icon-bug__before",
		],
		"button-icon-clock": [
			"before",
			"button-icon-clock__before",
		],
		"button-icon-clock-rotate-left": [
			"before",
			"button-icon-clock-rotate-left__before",
		],
		"button-icon-calendar-plus": [
			"before",
			"button-icon-calendar-plus__before",
		],
		"button-icon-gear": [
			"before",
			"button-icon-gear__before",
		],
		"button-icon-id-card": [
			"before",
			"button-icon-id-card__before",
			"button-icon-id-card__before_2",
		],
		"button-icon-arrow-right-from-bracket": [
			"before",
			"button-icon-arrow-right-from-bracket__before",
		],
		"button-icon-ban": [
			"before",
			"button-icon-ban__before",
		],
		"button-icon-pencil": [
			"before",
			"button-icon-pencil__before",
		],
		"button-icon-trash": [
			"before",
			"button-icon-trash__before",
		],
		"button-icon-book": [
			"before",
			"button-icon-book__before",
		],
		"button-icon-circle-question": [
			"before",
			"button-icon-circle-question__before",
		],
		"button-icon-0": [
			"before",
			"button-icon-0__before",
		],
		"button-icon-1": [
			"before",
			"button-icon-1__before",
		],
		"button-icon-2": [
			"before",
			"button-icon-2__before",
		],
		"button-icon-3": [
			"before",
			"button-icon-3__before",
		],
		"button-icon-4": [
			"before",
			"button-icon-4__before",
		],
		"button-icon-5": [
			"before",
			"button-icon-5__before",
		],
		"button-icon-6": [
			"before",
			"button-icon-6__before",
		],
		"button-icon-7": [
			"before",
			"button-icon-7__before",
		],
		"button-icon-8": [
			"before",
			"button-icon-8__before",
		],
		"button-icon-9": [
			"before",
			"button-icon-9__before",
		],
		"button-icon-undo": [
			"before",
			"button-icon-undo__before",
			"block__before",
			"button-icon-undo__before_3",
		],
		"button-icon-redo": [
			"before",
			"button-icon-redo__before",
			"block__before",
			"button-icon-redo__before_3",
		],
		"button-icon-arrow-up-arrow-down": [
			"before",
			"button-icon-arrow-up-arrow-down__before",
			"block__before",
			"button-icon-arrow-up-arrow-down__before_3",
		],
		"button-icon-other-formatting": [
			"before",
			"button-icon-other-formatting__before",
		],
		"button-icon-circle-check": [
			"before-after",
			"relative",
			"button-icon-circle-check__before",
			"button-icon-circle-check__before_2",
			"absolute__after",
			"inset-0__after",
			"border-radius-100__after",
			"button-icon-circle-check__after",
		],
		"button-icon-circle": [
			"relative",
			"after",
			"absolute__after",
			"inset-0__after",
			"border-radius-100__after",
			"button-icon-circle__after",
		],
		"popover": [
			"absolute",
			"border-radius-2",
			"inset-border-1",
			"borderless",
			"backdrop-blur",
			"flex-column",
			"gap-2",
			"block-border-shadow",
			"border-box",
			"scheme-light-dark",
			"transparent",
			"translate-down-3",
			"margin-inline-0",
			"margin-block-2",
			"overflow-hidden",
			"popover",
			"transition-discrete__2",
			"flex__popover-open",
			"opaque__popover-open",
			"popover__popover-open",
			"translate-y-0__popover-open",
			"transparent__popover-open__start",
			"translate-up-2__popover-open__start",
		],
		"popover--normal-stacking": [
			"flex",
			"opaque",
			"popover--normal-stacking",
			"translate-y-0",
			"transparent__start",
			"translate-up-2__start",
		],
		"popover--normal-stacking--hidden": [
			"hidden",
			"transparent__2",
			"translate-down-3__2",
			"popover--normal-stacking--hidden",
		],
		"popover--type-flush": [
			"popover--type-flush",
			"margin-0__3",
			"padding-1-3",
			"margin-left-3",
			"border-left-2",
			"background-none__3",
			"box-shadow-none__2",
			"border-radius-0",
			"z-index-bg",
		],
		"actions-menu": [
		],
		"actions-menu-popover": [
			"before-after",
			"gap-0__2",
			"overflow-visible",
			"border-none",
			"padding-left-1",
			"actions-menu-popover",
			"scheme-dark",
			"actions-menu-popover_3",
			"absolute__before-after",
			"right-100__before-after",
			"border-left-2__before-after",
			"actions-menu-popover__before-after",
			"actions-menu-popover__before",
			"actions-menu-popover__after",
		],
		"actions-menu-popover-arrow": [
			"absolute",
			"top-50",
			"translate-up-50",
			"rotate-45",
			"border-2",
			"actions-menu-popover-arrow",
		],
		"progress-wheel": [
			"flex",
			"gap-1",
			"align-items-centre",
			"progress-wheel",
		],
		"progress-wheel-icon": [
			"block",
			"size-em",
			"before",
			"block__before",
			"border-2__before",
			"border-radius-100__before",
			"progress-wheel-icon__before",
		],
		"progress-wheel-icon--overflowing": [
			"before-after",
			"grid",
			"stack",
			"stack-self__before-after",
			"background-currentcolour__before-after",
			"height-em__before-after",
			"progress-wheel-icon--overflowing__before-after",
			"borderless__before",
			"border-radius-0__before",
			"rotate-45__before",
			"rotate-135__after",
		],
		"progress-wheel-label": [
			"font-2",
			"relative",
			"progress-wheel-label",
		],
		"input": [
		],
		"input-popover": [
			"scheme-dark",
			"input-popover",
		],
		"input-popover-hint-text": [
			"italic",
			"font-1",
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
		"text-input-block": [
		],
		"text-input-block-input": [
			"border-radius-0",
			"text-input-block-input",
		],
		"text-input-block-input--first": [
			"border-top-radius-2",
			"text-input-block-input--first",
		],
		"text-input-block-input--last": [
			"border-bottom-radius-2",
			"text-input-block-input--last",
		],
		"text-input-block-input-wrapper": [
			"relative",
			"block",
			"after",
			"block__after",
			"absolute__after",
			"bottom-0__after",
			"inset-inline-2__after",
			"border-bottom-1__after",
			"text-input-block-input-wrapper__after",
		],
		"text-input-block-input-wrapper--last": [
			"after",
			"hidden__after",
		],
		"text-area": [
			"stack-self",
			"wrap-anywhere",
			"white-space-pre-wrap",
		],
		"text-area-wrapper": [
			"grid",
			"stack",
		],
		"text-area-validity-pipe-input": [
			"stack-self",
			"transparent",
			"pointer-events-none",
		],
		"heading": [
			"relative",
			"margin-0",
			"weight-normal",
			"font-inherit",
			"text-shadow",
			"heading_markdown-heading",
			"outline-none__focus-visible-has-focus-visible",
			"box-shadow-border-outline__focus-visible-has-focus-visible",
			"border-radius-1__focus-visible-has-focus-visible",
			"before-after",
			"font-kanit",
			"absolute__before-after",
			"z-index-bg__before-after",
			"heading__before-after",
			"heading__before",
			"heading__after",
		],
		"markdown-heading": [
			"relative",
			"margin-0",
			"weight-normal",
			"font-inherit",
			"text-shadow",
			"heading_markdown-heading",
			"outline-none__focus-visible-has-focus-visible",
			"box-shadow-border-outline__focus-visible-has-focus-visible",
			"border-radius-1__focus-visible-has-focus-visible",
			"markdown-heading",
		],
		"heading-text": [
			"block",
			"padding-bottom-1",
			"heading-text",
		],
		"heading-1": [
			"font-7",
			"weight-bolder",
		],
		"heading-2": [
			"font-6",
			"weight-bolder",
		],
		"heading-3": [
			"font-5",
			"weight-bold",
		],
		"heading-4": [
			"font-4",
			"weight-bold",
		],
		"heading-5": [
			"font-3",
		],
		"heading-6": [
			"font-2",
		],
		"markdown-heading-1": [
			"weight-bolder",
			"markdown-heading-1",
		],
		"markdown-heading-2": [
			"weight-bolder",
			"markdown-heading-2",
		],
		"markdown-heading-3": [
			"weight-bolder",
			"markdown-heading-3",
		],
		"markdown-heading-4": [
			"weight-bolder",
			"markdown-heading-4",
		],
		"markdown-heading-5": [
			"weight-bolder",
			"markdown-heading-5",
		],
		"markdown-heading-6": [
			"weight-bolder",
			"markdown-heading-6",
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
		"label-text": [
		],
		"label-required": [
			"after",
			"label-required__after",
		],
		"label--invalid": [
			"label--invalid",
		],
		"label-info-button": [
			"label-info-button",
		],
		"label-info-button-icon": [
			"font-1",
		],
		"label-info-button--hidden": [
			"hidden__2",
		],
		"text-label": [
			"font-2",
		],
		"text-label-label": [
			"colour-6",
		],
		"text-label-punctuation": [
			"colour-6",
		],
		"text-label-content": [
		],
		"timestamp": [
			"italic",
			"colour-7",
		],
		"labelled-table": [
			"gap-3",
			"grid",
			"labelled-table_2",
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
			"span-2",
			"labelled-row--in-labelled-table",
		],
		"labelled-row-label": [
			"sticky",
			"top-0",
			"padding-2-0",
			"labelled-row-label",
		],
		"labelled-row-content": [
			"block",
			"relative",
			"width-100",
		],
		"labelled-text-input-block": [
			"relative",
			"row-gap-0",
		],
		"labelled-text-input-block-labels": [
			"contents",
			"labelled-text-input-block-labels",
		],
		"labelled-text-input-block-inputs": [
			"contents",
		],
		"labelled-text-input-block-label": [
			"column-1",
			"align-self-centre",
		],
		"labelled-text-input-block-input": [
			"column-2",
			"width-100",
		],
		"labelled-text-input-block-input-wrapper": [
			"width-100",
		],
		"action-row": [
			"flex",
			"width-100",
			"gap-3",
			"border-box",
			"action-row_2",
			"action-row",
		],
		"action-row-left": [
			"flex",
			"flex-grow",
			"gap-3",
			"align-items-centre",
			"action-row-left_action-row-middle_action-row-right",
			"justify-content-start",
		],
		"action-row-middle": [
			"flex",
			"flex-grow",
			"gap-3",
			"align-items-centre",
			"action-row-left_action-row-middle_action-row-right",
			"justify-content-centre",
		],
		"action-row-right": [
			"flex",
			"flex-grow",
			"gap-3",
			"align-items-centre",
			"action-row-left_action-row-middle_action-row-right",
			"justify-content-end",
		],
		"action-heading": [
		],
		"action-heading-heading": [
			"font-6__2",
		],
		"block": [
			"block",
			"relative",
			"border-radius-2",
			"scheme-light-dark",
			"border-box",
			"width-content",
			"block_3",
			"z-index-fg",
			"block_5",
			"block_2",
			"before",
			"block__before",
			"absolute__before",
			"inset-0__before",
			"backdrop-blur__before",
			"inset-border-1__before",
			"border-radius-2__before",
			"block-border-shadow__before",
			"block__before_3",
			"block__before_2",
		],
		"block-header": [
			"block-header_2",
			"grid",
			"border-bottom-1",
			"padding-block-2",
			"margin-bottom-4",
			"border-top-radius-2",
			"relative",
			"block-header_4",
			"block-header",
		],
		"block-title": [
			"z-index-fg",
			"column-1",
		],
		"block-actions": [
			"z-index-fg",
		],
		"block-actions-primary": [
			"flex",
			"align-items-centre",
			"justify-content-end",
			"column-2",
			"row-1",
			"block-actions-primary",
		],
		"block-actions-menu-button": [
			"block-actions-menu-button",
			"transparent__not-focus-visible-has-focus-visible",
			"block-actions-menu-button__focus-visible-has-focus-visible",
		],
		"block-description": [
			"column-1",
		],
		"block-content": [
			"relative",
			"z-index-fg",
		],
		"block-footer": [
			"block-footer_2",
			"padding-block-3",
			"margin-top-4",
			"relative",
			"border-top-1",
			"border-bottom-radius-2",
			"border-box",
			"block-footer_4",
			"background-unclip__2",
			"z-index-fg",
			"block-footer",
		],
		"block--type-flush": [
			"background-none__4",
			"border-bottom-1",
			"border-radius-0__2",
			"block--type-flush",
			"before",
			"box-shadow-none__before",
			"block--type-flush__last-child",
			"borderless__last-child",
		],
		"block--type-flush-header": [
			"background-none__4",
			"borderless__2",
			"margin-top-0",
			"padding-top-0",
			"margin-bottom-3__2",
		],
		"block--type-flush-footer": [
			"block--type-flush-footer",
			"margin-top-2",
			"padding-block-2__2",
			"border-radius-0__2",
			"box-shadow-bottom-inset-2",
			"block--type-flush-footer_3",
		],
		"block--link": [
			"decoration-none",
			"weight-inherit",
			"border-bottom-radius-2__last-child",
			"block--link__last-child",
			"after",
			"block__after",
			"absolute__after",
			"inset-0__after",
			"no-pointer-events__after",
			"border-radius-2__after",
			"block--link__after",
			"block--link__hover_focus-visible-has-focus-visible__after",
		],
		"block--link--type-flush": [
			"after__2",
			"border-radius-0__after",
		],
		"text-editor": [
			"relative",
			"grid",
			"width-100",
			"border-1",
			"border-radius-1",
			"cursor-text",
			"text-editor",
			"background-unclip__3",
			"text-editor_3",
			"text-editor__focus-visible-has-focus-visible_active",
		],
		"text-editor--minimal": [
			"text-editor--minimal",
		],
		"text-editor-validity-pipe-input": [
			"absolute",
			"inset-0",
			"transparent",
			"pointer-events-none",
		],
		"text-editor-toolbar": [
			"font-3",
			"flex",
			"sticky",
			"border-bottom-1",
			"cursor-default",
			"z-index-fg",
			"border-top-radius-1",
			"top-0",
			"text-editor-toolbar",
			"before",
			"block__before",
			"absolute__before",
			"inset-0__before",
			"backdrop-blur__before",
			"border-top-radius-1__before",
		],
		"text-editor-toolbar--fullscreen": [
			"text-editor-toolbar--fullscreen",
		],
		"text-editor-toolbar--minimal": [
			"hidden__2",
		],
		"text-editor-toolbar-left": [
			"block",
			"grow",
		],
		"text-editor-toolbar-right": [
			"block",
			"grow",
			"text-align-right",
		],
		"text-editor-toolbar-button-group": [
			"before",
			"inline-block__before",
			"relative__before",
			"border-left-1__before",
			"border-colour-3__before",
			"margin-inline-1__before",
			"vertical-align-middle__before",
			"opacity-50__before",
			"text-editor-toolbar-button-group__before",
			"text-editor-toolbar-button-group__first-child__before",
		],
		"text-editor-toolbar-button": [
			"box-shadow-none",
			"relative",
			"text-align-centre",
			"vertical-align-middle",
			"font-2",
			"text-editor-toolbar-button",
			"before",
			"block__before",
			"absolute__before",
			"text-align-centre__before",
			"width-100__before",
			"text-editor-toolbar-button__before",
			"text-editor-toolbar-button__hover_focus-visible-has-focus-visible_active",
		],
		"text-editor-toolbar-button--hidden": [
			"hidden",
		],
		"text-editor-toolbar-button--enabled": [
			"after",
			"block__after",
			"absolute__after",
			"border-radius-1__after",
			"background-4__after",
			"inset-block-1__after",
			"z-index-bg__after",
			"text-editor-toolbar-button--enabled__after",
		],
		"text-editor-toolbar-button--has-popover": [
			"before-after",
			"border-radius-0",
			"outline-none",
			"translate-y-0__hover_focus-visible-has-focus-visible",
			"z-index-fg__before",
			"block__after",
			"absolute__after",
			"border-top-radius-1__after",
			"backdrop-filter-none__after",
			"translate-none__after",
			"uninset-1__after",
			"top-0__after",
			"text-editor-toolbar-button--has-popover__after",
		],
		"text-editor-toolbar-button--has-popover-visible": [
			"after",
			"text-editor-toolbar-button--has-popover-visible__after",
			"untop-1__after",
			"backdrop-blur__after",
			"text-editor-toolbar-button--has-popover-visible__after_3",
		],
		"text-editor-toolbar-button--has-popover--within-popover": [
			"after",
			"text-editor-toolbar-button--has-popover--within-popover__after",
		],
		"text-editor-toolbar-strong": [
			"border-top-left-radius-1",
		],
		"text-editor-toolbar-hr": [
			"block",
			"font-font-awesome",
			"weight-bolder",
			"size-em",
			"before",
			"absolute__before",
			"text-editor-toolbar-hr__before",
		],
		"text-editor-toolbar-popover": [
			"padding-1",
			"flex-row",
			"border-radius-1",
			"border-top-radius-0",
			"gap-0",
			"text-editor-toolbar-popover",
		],
		"text-editor-toolbar-popover--left": [
			"unmargin-left-1",
		],
		"text-editor-toolbar-popover--right": [
			"unmargin-right-1",
		],
		"text-editor-toolbar-popover-sub": [
		],
		"text-editor-toolbar-popover-sub--left": [
			"border-top-right-radius-1",
		],
		"text-editor-toolbar-popover-sub--right": [
			"border-top-left-radius-1",
		],
		"text-editor-toolbar-popover-sub--centre": [
			"text-editor-toolbar-popover-sub--centre",
		],
		"text-editor-document-slot--fullscreen": [
			"block",
			"overflow-auto",
			"scrollbar-auto",
		],
		"text-editor-document": [
			"block",
			"no-outline",
			"overflow-auto-x",
			"padding-2-3",
			"scrollbar-none",
			"relative",
			"white-space-pre-wrap",
			"after",
			"hidden__after",
		],
		"text-editor-document--fullscreen": [
			"before-after",
			"overflow-visible",
			"text-editor-document--fullscreen",
			"block__before",
			"absolute__before",
			"height-100__before",
			"z-index-fg__before",
			"pointer-events-none__before",
			"text-editor-document--fullscreen__before",
			"block__after",
			"width-100__after",
			"text-editor-document--fullscreen__after",
		],
		"text-editor-document-scrollbar-proxy": [
			"block",
			"sticky",
			"bottom-0",
			"overflow-auto-x",
			"border-bottom-radius-1",
			"text-editor-document-scrollbar-proxy",
			"before",
			"block__before",
			"text-editor-document-scrollbar-proxy__before",
			"text-editor-document-scrollbar-proxy__hover",
		],
		"text-editor-document-scrollbar-proxy--fullscreen": [
			"hidden",
		],
		"text-editor-document-scrollbar-proxy--visible": [
			"backdrop-blur",
		],
		"text-editor--required": [
		],
		"text-editor--fullscreen": [
			"absolute",
			"inset-0",
			"outline-none",
			"borderless__2",
			"background-none__5",
			"z-index-fg",
			"text-editor--fullscreen",
			"before",
			"absolute__before",
			"inset-0__before",
			"background-2__before",
			"z-index-bg__before",
		],
		"ProseMirror-gapcursor": [
			"ProseMirror-gapcursor",
		],
		"ProseMirror-hideselection": [
			"ProseMirror-hideselection",
		],
		"ProseMirror-selectednode": [
			"ProseMirror-selectednode",
		],
		"form": [
		],
		"form-content": [
		],
		"form-footer": [
		],
		"paginator": [
			"relative__2",
			"width-100__2",
			"padding-bottom-0",
			"paginator",
		],
		"paginator--flush": [
			"scheme-dark",
			"before",
			"backdrop-filter-none__before",
		],
		"paginator-header": [
			"sticky",
			"margin-bottom-0",
			"z-index-fg-2",
			"paginator-header",
			"before",
			"absolute__before",
			"backdrop-blur__before",
			"z-index-bg__before__2",
			"bottom-0__before",
			"border-top-radius-2__before",
			"paginator-header__before",
		],
		"paginator-header--flush": [
			"border-radius-2",
			"inset-border-1",
			"margin-bottom-4__2",
			"block-border-shadow",
			"paginator-header--flush",
			"background-dark-3-a80",
			"before",
			"paginator-header--flush__before",
			"border-radius-2__before",
		],
		"paginator-footer": [
			"sticky",
			"padding-block-1",
			"padding-inline-3",
			"margin-block-0",
			"paginator-footer_2",
			"paginator-footer",
			"before",
			"absolute__before",
			"backdrop-blur__before",
			"z-index-bg__before",
			"top-0__before",
			"border-bottom-radius-2__before",
			"paginator-footer__before",
		],
		"paginator-footer-left": [
			"gap-0",
		],
		"paginator-footer-right": [
			"gap-0",
		],
		"paginator-footer--flush": [
			"relative__2",
			"margin-top-4__2",
			"background-none__5",
			"border-none",
		],
		"paginator-footer--hidden": [
			"hidden",
		],
		"paginator-button": [
			"paginator-button",
		],
		"paginator-button--disabled": [
			"opacity-30",
			"no-pointer-events",
		],
		"paginator-button--hidden": [
			"hidden",
		],
		"paginator-content": [
			"paginator-content",
			"padding-inline-5",
			"margin-bottom-0__2",
			"grid",
			"stack",
			"overflow-hidden",
		],
		"paginator-content--has-header": [
			"padding-top-4",
		],
		"paginator-content--or-else": [
			"margin-0__4",
			"padding-block-3__2",
		],
		"paginator-page": [
			"paginator-page",
			"flex-column",
			"paginator-page_3",
			"transition-discrete__3",
			"opaque",
			"stack-self",
			"translate-x-0",
			"paginator-page_5",
			"transparent__start",
			"paginator-page__start",
		],
		"paginator-page--initial-load": [
			"no-transition",
		],
		"paginator-page--flush": [
			"gap-3",
		],
		"paginator-page--hidden": [
			"hidden__3",
			"transparent__2",
			"paginator-page--hidden",
		],
		"paginator-page--bounce": [
			"flex__2",
			"opaque__2",
		],
		"paginator-error": [
			"grid",
			"justify-items-centre",
			"gap-3",
			"paginator-error",
		],
		"paginator-error-text": [
			"row-2",
		],
		"paginator-error-retry-button": [
			"width-fit",
			"height-fit",
			"row-3",
		],
		"toast-list": [
			"no-pointer-events",
			"fixed",
			"right-5",
			"bottom-4",
			"flex",
			"flex-column",
			"justify-content-end",
			"align-items-end",
			"gap-3",
			"toast-list",
		],
		"toast": [
			"absolute",
			"bottom-0",
			"right-0",
			"flex",
			"flex-column",
			"gap-1",
			"padding-3-4",
			"border-1",
			"box-shadow-1",
			"border-radius-2",
			"colour-0",
			"width-fit",
			"align-self-end",
			"pointer-events",
			"toast",
		],
		"toast--measuring": [
			"no-pointer-events",
			"transparent",
			"fixed",
			"bottom-0",
			"right-0",
		],
		"toast-wrapper": [
			"relative",
			"block",
			"height-0",
			"width-100",
			"toast-wrapper",
		],
		"toast--hide": [
			"toast--hide",
		],
		"toast-title": [
			"weight-bold",
		],
		"toast-content": [
			"font-1",
			"margin-bottom-1",
		],
		"toast-error-type": [
			"weight-bold",
		],
		"toast-type-info": [
		],
		"toast-type-success": [
			"toast-type-success",
		],
		"toast-type-warning": [
			"toast-type-warning",
		],
		"draggable": [
		],
		"draggable-dragging": [
		],
		"sortable": [
		],
		"sortable-item": [
		],
		"sortable-item-sorting": [
		],
		"sortable-slot": [
			"block",
		],
		"breadcrumbs": [
		],
		"breadcrumbs-meta": [
		],
		"breadcrumbs-title": [
		],
		"breadcrumbs-description": [
		],
		"breadcrumbs-actions": [
			"unmargin-left-3",
		],
		"breadcrumbs-back-button": [
		],
		"breadcrumbs-path": [
		],
		"breadcrumbs-path-separator": [
		],
		"breadcrumbs-path--hidden": [
			"hidden",
		],
		"radio-row": [
			"flex",
			"gap-2",
		],
		"radio-row-option": [
			"justify-content-centre",
			"flex-grow",
			"border-1",
			"font-inherit",
			"radio-row-option",
			"radio-row-option__not-hover-focus-visible-has-focus-visible",
			"radio-row-option__hover_focus-visible-has-focus-visible",
		],
		"radio-row-option--selected": [
			"colour-0__2",
			"opaque",
			"radio-row-option--selected",
		],
		"radio-row-option--hidden": [
			"hidden",
		],
		"tabinator": [
			"tabinator",
		],
		"tabinator-tab-list": [
			"flex__2",
			"flex-wrap",
			"justify-content-start",
			"padding-inline-0",
			"padding-top-0__2",
			"background-none__4",
			"gap-3",
			"scheme-dark",
		],
		"tabinator-tab": [
			"width-fit",
		],
		"tabinator-tab--active": [
			"tabinator-tab--active",
		],
		"tabinator-content": [
			"grid",
			"stack",
		],
		"tabinator-panel": [
			"tabinator-panel",
			"stack-self",
			"background-none__6",
			"opaque",
			"tabinator-panel_3",
			"transition-discrete__4",
			"translate-x-0",
			"tabinator-panel_5",
			"transparent__start",
			"tabinator-panel__start",
		],
		"tabinator-panel--hidden": [
			"hidden",
			"transparent__2",
			"no-pointer-events",
			"tabinator-panel--hidden",
		],
		"vanity-input": [
			"grid",
			"stack",
		],
		"vanity-input-input": [
			"stack-self",
			"padding-left-4",
		],
		"vanity-input-prefix": [
			"stack-self",
			"width-4",
			"grid",
			"align-content-centre",
			"justify-content-end",
			"padding-right-1",
			"relative",
			"margin-block-1",
			"border-box",
			"no-pointer-events",
			"opacity-50",
			"vanity-input-prefix",
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
			"border-box",
			"backdrop-blur",
			"masthead",
			"masthead_2",
		],
		"masthead-skip-nav": [
			"no-pointer-events",
			"transparent",
			"masthead-skip-nav",
			"z-index-fg",
			"masthead-skip-nav_3",
			"opaque__hover_focus-visible-has-focus-visible",
			"pointer-events__hover_focus-visible-has-focus-visible",
		],
		"masthead-left": [
			"flex",
			"padding-left-2",
			"masthead-left",
		],
		"masthead-left-hamburger": [
		],
		"masthead-left-hamburger-sidebar": [
			"masthead-left-hamburger-sidebar",
		],
		"masthead-left-hamburger-popover": [
			"hidden",
			"masthead-left-hamburger-popover",
		],
		"masthead-home": [
			"font-4__2",
			"size-fit",
			"flex__2",
			"gap-2",
			"padding-2-3",
			"background-none__4",
			"box-shadow-none__3",
			"box-shadow-none__hover_focus-visible-has-focus-visible__2",
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
			"justify-content-end",
			"masthead-user",
		],
		"masthead-user-action-login": [
			"padding-1-3",
			"height-fit",
			"align-self-centre",
		],
		"masthead-user-notifications": [
			"relative",
		],
		"masthead-user-notifications-badge": [
			"z-index-fg",
			"absolute",
			"bottom-1",
			"right-2",
			"font-0",
			"padding-1",
			"border-radius-1",
			"font-font-awesome",
			"masthead-user-notifications-badge",
		],
		"masthead-user-notifications-popover": [
			"border-box",
			"margin-left-2",
			"masthead-user-notifications-popover",
		],
		"masthead-user-notifications-list": [
			"scheme-light-dark__2",
			"masthead-user-notifications-list",
		],
		"masthead-user-notifications-list-header": [
			"background-none__6",
			"box-shadow-none__2",
			"borderless",
			"margin-bottom-0__2",
			"before",
			"background-none__before",
			"backdrop-filter-none__before",
		],
		"masthead-user-notifications-list-action": [
			"font-3__2",
			"unmargin-top-3",
			"unmargin-bottom-2",
		],
		"masthead-user-notifications-list-title": [
			"unmargin-top-1",
			"font-4__2",
		],
		"masthead-user-notifications-list-content": [
			"padding-top-0__2",
			"unmargin-top-1__3",
		],
		"masthead-user-notifications-list-footer": [
			"masthead-user-notifications-list-footer",
			"padding-inline-0",
			"padding-bottom-0__2",
			"unmargin-bottom-2__2",
			"unmargin-top-2",
			"before",
			"backdrop-filter-none__before",
		],
		"masthead-popover-link-button": [
			"text-align-left",
		],
		"masthead-popover-link-button-text": [
			"clamp-1",
			"masthead-popover-link-button-text",
		],
		"sidebar": [
			"padding-4-2",
			"relative",
			"height-100",
			"border-box",
			"transparent",
			"translate",
			"sidebar",
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
			"sidebar__focus-visible-has-focus-visible",
			"opaque__focus-visible-has-focus-visible",
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
		"author": [
		],
		"author-name": [
		],
		"author-vanity": [
		],
		"author-pronouns": [
		],
		"author-description": [
		],
		"author-support-link": [
			"block",
			"margin-top-4",
		],
		"work": [
			"relative",
		],
		"work-header": [
			"grid",
			"margin-bottom-0",
			"padding-bottom-0",
			"work-header",
		],
		"work-name": [
			"wrap-words",
		],
		"work-author": [
			"relative",
			"z-index-fg",
		],
		"work-author-list": [
			"work-author-list",
		],
		"work-author-list--flush": [
			"margin-bottom-0",
		],
		"work-tags": [
			"flex",
			"flex-wrap",
			"gap-2",
			"span-2",
			"row-3",
			"padding-top-3",
		],
		"work-tags--flush": [
			"padding-0__2",
			"padding-top-2",
			"padding-bottom-2",
		],
		"work-tags-custom": [
		],
		"work-tags-global": [
		],
		"work-description": [
			"block",
			"italic",
			"padding-top-3",
			"font-2",
		],
		"work-description--flush": [
			"padding-top-1",
		],
		"work-content": [
			"block",
		],
		"work-synopsis": [
			"block",
			"padding-top-2",
			"padding-bottom-1",
		],
		"work-timestamp": [
		],
		"work--private": [
			"before",
			"block__before",
			"absolute__before",
			"inset-0__before",
			"work--private__before",
		],
		"tag": [
			"font-1",
			"grid",
			"tag",
			"no-decoration",
			"padding-1-2",
			"border-1",
			"box-shadow-none",
			"tag_3",
			"colour-0__hover",
			"tag__hover",
		],
		"tag--dragging": [
			"colour-0",
			"tag--dragging",
		],
		"tag-category": [
			"font-0",
			"uppercase",
			"opacity-70",
			"tag-category",
			"column-1",
			"text-align-left",
		],
		"tag-name": [
			"unmargin-top-1",
			"column-1",
			"text-align-left",
		],
		"tag-global": [
		],
		"tag-custom": [
		],
		"tag-delete-button": [
			"before",
			"align-self-start__before",
			"column-2",
			"row-1-2",
			"padding-0__2",
			"background-none__2",
			"box-shadow-none",
			"font-0",
			"padding-right-2__2",
			"height-100",
			"unmargin-right-2",
			"colour-inherit",
			"tag-delete-button_2",
			"hidden__before",
		],
		"chapter": [
			"grid",
			"columns-subgrid",
			"padding-1-4",
			"span-3",
			"column-gap-3",
			"relative",
			"cursor-pointer",
			"decoration-none",
			"colour-inherit",
			"weight-inherit",
			"chapter_2",
			"background-4__hover_focus-visible-has-focus-visible",
			"chapter__hover_focus-visible-has-focus-visible",
			"chapter",
			"border-bottom-radius-2__last-child",
		],
		"chapter-list": [
			"chapter-list_2",
			"chapter-list",
		],
		"chapter-number": [
			"relative",
			"colour-6",
			"width-fit",
			"justify-self-end",
		],
		"chapter-name": [
			"relative",
			"wrap-words",
			"clamp-1",
		],
		"chapter-right": [
			"block",
			"relative",
			"text-align-right",
			"chapter-right",
		],
		"chapter-timestamp": [
			"font-2",
			"align-self-centre",
			"justify-self-end",
		],
		"chapter-actions-menu-button": [
			"unmargin-block-1",
			"unmargin-right-0",
			"margin-left-2__2",
			"padding-block-1",
			"padding-inline-1",
			"font-1",
			"translate-y-0",
			"chapter-actions-menu-button",
			"transparent__not-focus-visible-has-focus-visible",
			"unmargin-left-3__not-focus-visible-has-focus-visible",
			"chapter-actions-menu-button__not-focus-visible-has-focus-visible",
		],
		"chapter--private": [
			"before",
			"block__before",
			"absolute__before",
			"inset-0__before",
			"chapter--private__before",
		],
		"oauth-service": [
			"relative",
			"flex__2",
			"gap-3",
			"align-items-centre",
			"oauth-service",
			"height-lh",
			"oauth-service_3",
			"oauth-service__hover_focus-visible-has-focus-visible",
			"oauth-service__active",
		],
		"oauth-service--disabled": [
			"opaque",
			"pointer-events-all",
			"oauth-service--disabled__active",
		],
		"oauth-service-container": [
			"block",
		],
		"oauth-service-container--reauth-list": [
			"padding-0__2",
			"width-auto",
		],
		"oauth-service-list": [
			"flex",
			"flex-column",
			"gap-3",
		],
		"oauth-service-icon": [
			"size-constrain-em",
		],
		"oauth-service-name": [
			"font-vertical-align",
			"flex-grow",
		],
		"oauth-service-state": [
			"before-after",
			"block",
			"absolute",
			"inset-0",
			"rotate-45",
			"block__before-after",
			"absolute__before-after",
			"size-1__before-after",
			"opacity-0__before-after",
			"background-currentcolour__before-after",
			"oauth-service-state__before-after",
			"height-100__before__2",
			"top-0__before__2",
			"width-50__after",
			"left-0__after",
			"oauth-service-state__after",
		],
		"oauth-service-state-wrapper": [
			"relative",
			"block",
			"size-100",
			"oauth-service-state-wrapper",
		],
		"oauth-service-state-wrapper--focus": [
			"translate-left-1",
		],
		"oauth-service-state--authenticated": [
			"opacity-1__before-after",
		],
		"oauth-service-state--focus": [
			"after__2",
			"width-100__after__2",
			"oauth-service-state--focus__after",
		],
		"oauth-service-username": [
			"transparent",
		],
		"oauth-service-username--has-username": [
			"opacity-70",
		],
		"oauth-service--authenticated": [
		],
		"tags-editor": [
			"relative",
			"flex",
			"flex-column",
			"gap-3",
		],
		"tags-editor-current": [
			"flex",
			"flex-column",
			"gap-2",
		],
		"tags-editor-current-type": [
			"flex",
			"flex-wrap",
			"gap-2",
		],
		"tags-editor-current-global": [
		],
		"tags-editor-current-custom": [
		],
		"tags-editor-tag": [
		],
		"tags-editor-input": [
			"font-family-inherit",
			"font-inherit",
			"background-none",
			"border-none",
			"outline-none",
		],
		"tags-editor-input-wrapper": [
			"flex__2",
			"flex-column",
			"gap-3",
			"tags-editor-input-wrapper__focus-visible-has-focus-visible_active",
		],
		"tags-editor-suggestions": [
		],
		"tags-editor-suggestions-label": [
			"uppercase",
			"unmargin-bottom-2",
			"font-0",
			"bold",
			"colour-6",
			"tags-editor-suggestions-label",
		],
		"tags-editor-suggestions-type": [
			"flex",
			"flex-wrap",
			"gap-2",
			"align-items-centre",
		],
		"tags-editor-suggestions-type-label": [
			"font-1",
			"colour-4",
			"unmargin-top-1",
		],
		"tags-editor-suggestions-custom": [
		],
		"tags-editor-suggestions-category": [
		],
		"tags-editor-suggestions-global": [
		],
		"tags-editor-validity-pipe-input": [
			"absolute",
			"inset-0",
			"transparent",
			"pointer-events-none",
		],
		"comment": [
			"block__2",
			"relative",
		],
		"comment-list": [
			"width-100",
			"width-clamp-content",
			"scheme-light-dark",
			"padding-3-4",
			"border-radius-2__2",
			"unmargin-inline-4",
			"max-width-none",
			"comment-list_3",
			"comment-list",
			"comment-list_2",
		],
		"comment-content": [
		],
		"comment-header": [
			"unmargin-bottom-2",
		],
		"comment-header-author": [
		],
		"comment-header-timestamp": [
			"font-2",
			"margin-left-3",
			"style-normal",
		],
		"comment-header--editing": [
			"margin-bottom-2",
		],
		"comment-body": [
			"wrap-words",
			"after",
			"hidden__after",
		],
		"comment-footer": [
			"flex",
			"gap-3",
			"align-items-centre",
			"unmargin-top-3",
			"margin-bottom-2",
		],
		"comment-footer-action": [
			"padding-1-2",
			"font-2",
		],
		"comment-footer--editing": [
			"margin-top-2__2",
			"margin-bottom-0__3",
		],
		"comment-children": [
			"flex",
			"flex-column",
			"gap-2",
		],
		"comment-children--flush": [
			"margin-bottom-0",
		],
		"comment--is-thread": [
			"padding-left-3",
			"margin-left-1",
			"border-left-2",
			"border-bottom-left-radius-2",
			"comment--is-thread",
			"margin-bottom-2",
			"comment--is-thread__hover_focus-visible-has-focus-visible",
			"margin-bottom-3__last-child",
		],
		"reaction": [
			"flex",
			"gap-2",
		],
		"reaction-button": [
			"padding-0__2",
		],
		"reaction-button--reacted": [
		],
		"reaction-button-icon": [
			"weight-normal__2",
			"font-3__2",
		],
		"reaction-button-icon--reacted": [
			"weight-bolder__2",
		],
		"reaction-count": [
			"font-2",
		],
		"notification-list": [
		],
		"notification-list-header": [
		],
		"notification-list-title": [
		],
		"notification-list-content": [
		],
		"notification-list-footer": [
		],
		"notification-list-page": [
			"gap-3",
			"padding-block-2",
		],
		"notification": [
			"before-after",
			"relative",
			"font-1",
			"white-space-pre-wrap",
			"decoration-none",
			"colour-inherit",
			"weight-inherit",
			"notification",
			"absolute__after",
			"left-0__after",
			"unbottom-3__after",
			"height-1__after",
			"width-100__after",
			"border-top-1__after",
			"notification__after",
			"hidden__last-child__after",
			"block__before__2",
			"absolute__before",
			"top-0__before",
			"unbottom-1__before",
			"z-index-bg__before",
			"notification__before",
			"colour-0__hover_focus-visible-has-focus-visible__2",
			"background-6-a30__hover_focus-visible-has-focus-visible__before",
			"notification__hover_focus-visible-has-focus-visible__before",
		],
		"notification--read": [
			"opacity-60",
		],
		"notification-read-button": [
			"z-index-fg",
			"absolute",
			"inset-block-0",
			"size-auto",
			"grid",
			"stack",
			"align-items-centre",
			"colour-transparent",
			"notification-read-button",
			"colour-3__hover_focus-visible-has-focus-visible",
			"after",
			"block__after",
			"stack-self__after",
			"z-index-bg__after",
			"background-1-a30__after",
			"border-radius-1__after",
			"margin-top-1__after",
			"size-em__after",
		],
		"notification-read-button-icon": [
			"stack-self",
		],
		"notification-read-button--just-marked-unread": [
			"colour-transparent__2",
		],
		"notification-read-button--read": [
			"colour-6__2",
		],
		"notification-label": [
		],
		"notification-timestamp": [
			"nowrap",
		],
		"notification-comment": [
			"block",
			"font-2",
			"margin-0",
			"margin-top-2",
			"white-space-normal",
		],
		"mention": [
			"white-space-nowrap",
		],
		"mention-punctuation": [
			"after",
			"mention-punctuation__after",
		],
		"mention-author-name": [
			"white-space-normal",
		],
		"tag-block": [
			"tag-block",
			"before",
			"inset-border-2__before",
		],
		"tag-block-tag": [
			"width-fit",
			"height-fit",
			"colour-0__3",
			"padding-0__3",
			"border-radius-2",
			"border-none__2",
			"no-pointer-events",
			"tag-block-tag",
			"z-index-fg",
		],
		"tag-block-tag-category": [
			"font-3__2",
			"weight-normal",
			"unmargin-bottom-1",
			"font-kanit",
		],
		"tag-block-tag-name": [
			"font-6",
			"font-kanit",
			"unmargin-top-2",
		],
		"tag-block-header": [
			"tag-block-header",
		],
		"tag-block-info": [
			"grid",
			"tag-block-info",
			"gap-4",
		],
		"tag-block-description": [
			"unmargin-top-3",
			"italic",
			"align-self-centre",
		],
		"primary-nav": [
			"flex",
			"flex-column",
			"gap-4",
			"primary-nav",
		],
		"primary-nav-popover": [
			"primary-nav-popover",
			"border-box",
			"overflow-auto-y",
		],
		"primary-nav--sidebar": [
			"height-100",
		],
		"primary-nav-top": [
			"flex",
			"flex-column",
			"gap-4",
			"primary-nav-top_primary-nav-bottom",
			"justify-content-start",
			"grow",
		],
		"primary-nav-bottom": [
			"flex",
			"flex-column",
			"gap-4",
			"primary-nav-top_primary-nav-bottom",
		],
		"primary-nav-group": [
			"flex",
			"flex-column",
		],
		"primary-nav-group-heading": [
			"uppercase",
			"font-2__2",
			"colour-6",
			"margin-bottom-0",
			"margin-left-2",
			"padding-left-1",
			"primary-nav-group-heading",
		],
		"primary-nav-link": [
		],
		"primary-nav-link-icon": [
		],
		"primary-nav-link-text": [
			"wrap-words",
			"clamp-1",
		],
		"primary-nav-link--disabled": [
			"primary-nav-link--disabled",
		],
		"view": [
			"grid",
			"align-items-centre",
			"gap-4",
			"padding-4-0",
			"view_3",
			"view",
			"view_2",
		],
		"view-container": [
			"contents",
		],
		"view-container-ephemeral": [
			"flex-column",
			"right-0",
			"border-left-radius-2",
			"scheme-light-dark",
			"backdrop-blur",
			"view-container-ephemeral",
		],
		"view-container-ephemeral--open": [
			"flex",
		],
		"view-container-ephemeral-close": [
			"absolute",
			"right-0",
			"top-0",
		],
		"view--hidden": [
		],
		"view-breadcrumbs": [
			"contents",
		],
		"view-breadcrumbs-meta": [
			"column-1",
			"sticky",
			"top-4",
			"flex",
			"flex-column",
			"gap-2",
			"align-self-start",
			"align-items-end",
			"view-breadcrumbs-meta",
		],
		"view-breadcrumbs-info": [
			"width-fit",
			"after",
			"block__after",
			"width-4__after",
			"margin-top-2__after",
			"border-bottom-2__after",
		],
		"view-breadcrumbs-title": [
			"font-kanit",
			"font-4",
			"margin-0",
			"padding-0",
			"unmargin-bottom-2",
		],
		"view-breadcrumbs-description": [
			"margin-0",
			"italic",
			"font-2",
		],
		"view-breadcrumbs-back-button": [
			"size-fit",
		],
		"view-breadcrumbs-path": [
			"column-2",
		],
		"view-content": [
			"flex",
			"flex-column",
			"gap-4",
			"column-2",
			"align-self-start",
			"width-content",
			"view-content_2",
			"view-content",
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
		"account-view-form-create": [
		],
		"view-type-home": [
		],
		"view-type-author": [
		],
		"view-type-work": [
		],
		"view-type-work-chapter": [
		],
		"view-type-work-chapter-list": [
		],
		"view-type-work-chapter-list--moving-chapter": [
			"padding-block-3",
		],
		"view-type-work-chapter-list-chapter-moving": [
			"view-type-work-chapter-list-chapter-moving",
			"border-blue",
			"unmargin-inline-4",
			"unmargin-bottom-2__3",
			"border-radius-0__3",
			"background-blue-4-a20",
			"view-type-work-chapter-list-chapter-moving_3",
		],
		"view-type-work-chapter-slot": [
			"before-after",
			"absolute",
			"width-100",
			"translate-up-50",
			"z-index-fg",
			"box-shadow-none",
			"view-type-work-chapter-slot",
			"outline-none",
			"view-type-work-chapter-slot_3",
			"view-type-work-chapter-slot__before",
			"transparent__before",
			"block__after",
			"absolute__after__2",
			"top-50__after",
			"width-0__after",
			"left-50__after",
			"translate-left-50__after",
			"view-type-work-chapter-slot__after",
			"background-15__after",
			"border-block-1__after",
			"border-blue-3-a80__after",
			"view-type-work-chapter-slot__after_3",
			"transparent__after",
			"view-type-work-chapter-slot__after_5",
			"background-none__hover_focus-visible-has-focus-visible",
			"opaque__hover_focus-visible-has-focus-visible__after",
			"width-100__hover_focus-visible-has-focus-visible__after",
			"view-type-work-chapter-slot__hover_focus-visible-has-focus-visible__after",
		],
		"view-type-work-chapter-slot-wrapper": [
			"hidden",
			"relative",
			"height-0",
			"width-100",
			"span-3",
		],
		"view-type-work-chapter-slot-wrapper--has-moving-chapter": [
			"block__2",
		],
		"view-type-work-chapter-reordering-icon": [
			"pointer-events-none",
			"colour-blue__2",
			"absolute",
			"left-2",
			"top-50",
			"padding-0__2",
			"font-1",
			"translate-up-50",
		],
		"view-type-work-chapter-reordering-icon--slot": [
			"colour-9",
		],
		"view-type-work-chapter--moving": [
			"background-0-a10",
			"inset-border-1",
			"view-type-work-chapter--moving",
		],
		"view-type-work-chapter--moving-number": [
			"opacity-10",
		],
		"view-type-work-chapter--moving-name": [
			"opacity-10",
		],
		"view-type-work-chapter--moving-timestamp": [
			"opacity-10",
		],
		"view-type-work-chapter--has-moving-sibling": [
			"pointer-events-none",
		],
		"view-type-work-edit": [
		],
		"view-type-require-login": [
		],
		"view-type-tag": [
		],
		"view-type-chapter": [
		],
		"view-type-chapter-work": [
		],
		"view-type-chapter-block": [
			"scheme-light-dark__2",
			"padding-4-5",
			"border-radius-2__2",
			"unmargin-inline-5",
			"max-width-none",
			"backdrop-blur__2",
			"view-type-chapter-block_3",
			"view-type-chapter-block",
			"view-type-chapter-block_2",
		],
		"view-type-chapter-block-header": [
			"background-none__6",
			"border-none__2",
			"box-shadow-none__2",
			"relative__2",
			"padding-inline-0",
			"margin-bottom-3__3",
			"before",
			"background-none__before",
			"backdrop-filter-none__before",
		],
		"view-type-chapter-block-title": [
			"wrap-words",
		],
		"view-type-chapter-block-content": [
			"padding-0__2",
		],
		"view-type-chapter-block-notes": [
			"padding-3",
			"padding-top-0__3",
			"view-type-chapter-block-notes",
			"background-2",
		],
		"view-type-chapter-block-notes-before": [
			"margin-top-2",
		],
		"view-type-chapter-block-notes-after": [
			"margin-bottom-3",
		],
		"view-type-chapter-block-notes-label": [
			"block",
			"uppercase",
			"unmargin-bottom-2",
			"margin-top-2",
			"font-0",
			"bold",
			"colour-6",
			"view-type-chapter-block-notes-label",
		],
		"view-type-chapter-block-tags": [
			"block",
			"unmargin-top-3",
		],
		"view-type-chapter-block-tags-title": [
			"margin-bottom-2",
		],
		"view-type-chapter-block-body": [
			"padding-top-3",
			"padding-bottom-4",
			"view-type-chapter-block-body",
		],
		"view-type-chapter-block-paginator-actions": [
			"flex__2",
			"padding-inline-0",
			"scheme-light-dark",
			"box-shadow-none__3",
			"before",
			"backdrop-filter-none__before",
		],
		"view-type-chapter-edit": [
		],
		"view-type-new": [
		],
		"view-type-feed": [
		],
		"view-type-history": [
		],
		"history": [
			"gap-5",
		],
		"history-work": [
		],
		"history-chapter-block": [
			"grid",
			"padding-0__2",
			"padding-bottom-2",
			"margin-inline-3",
			"border-top-radius-2__2",
			"overflow-hidden",
			"history-chapter-block",
			"before",
			"inset-border-1__before__2",
			"border-bottom-radius-0__before",
			"border-top-radius-2__before__2",
		],
		"history-chapter": [
			"border-top-radius-2__first-child",
			"border-bottom-radius-0__last-child",
		],
		"view-type-notifications": [
		],
		"view-type-following": [
		],
		"view-type-ignoring": [
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
			"overflow-auto-y",
			"gutter-stable",
			"padding-left-4",
			"app-content_2",
			"app-content",
			"after",
			"block__after__2",
			"app-content__after_2",
			"app-content__after",
		],
		"app-content-related": [
			"app-content-related_2",
			"app-content-related",
		],
	};
})

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiIsImZpbGUiOiIvaG9tZS9ydW5uZXIvd29yay9mbHVmZjQubWUvZmx1ZmY0Lm1lL2RvY3Mvc3R5bGUvaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6W119