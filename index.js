"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
define("utility/Env", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Env {
        async load() {
            const origin = location.origin;
            const root = location.pathname.startsWith("/beta/") ? "/beta/" : "/";
            Object.assign(this, await fetch(origin + root + "env.json").then(response => response.json()));
            document.documentElement.classList.add(`environment-${this.ENVIRONMENT}`);
        }
    }
    exports.default = new Env;
});
define("utility/Type", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("endpoint/Endpoint", ["require", "exports", "utility/Env"], function (require, exports, Env_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Env_1 = __importDefault(Env_1);
    function Endpoint(route, method) {
        let headers;
        const endpoint = {
            header(header, value) {
                headers ??= {};
                headers[header] = value;
                return endpoint;
            },
            headers(h) {
                headers = { ...headers, ...h };
                return endpoint;
            },
            acceptJSON: () => endpoint.header("Accept", "application/json"),
            query: (async (query) => {
                const body = !query?.body ? undefined : JSON.stringify(query.body);
                const url = route.slice(1)
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    .replaceAll(/\{([^}]+)\}/g, (match, paramName) => query?.params?.[paramName]);
                const response = await fetch(`${Env_1.default.API_ORIGIN}${url}`, {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    method,
                    headers: {
                        "Content-Type": body ? "application/json" : undefined,
                        ...headers,
                    },
                    credentials: "include",
                    body,
                });
                let error;
                const code = response.status;
                if (code !== 200) {
                    error = Object.assign(new Error(response.statusText), { code });
                    delete error.stack;
                }
                const responseHeaders = { headers: response.headers };
                if (!response.body)
                    return Object.assign(error ?? {}, responseHeaders);
                const responseType = response.headers.get("Content-Type");
                if (responseType === "application/json") {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    const json = await response.json();
                    if (error)
                        return Object.assign(error, json, responseHeaders);
                    return Object.assign(json, responseHeaders);
                }
                throw new Error(`Response type ${responseType} is not supported`);
            }),
        };
        return endpoint;
    }
    exports.default = Endpoint;
});
define("endpoint/auth/EndpointAuthRemove", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_1 = __importDefault(Endpoint_1);
    exports.default = (0, Endpoint_1.default)("/auth/remove", "post");
});
define("endpoint/session/EndpointSessionGet", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_2 = __importDefault(Endpoint_2);
    exports.default = (0, Endpoint_2.default)("/session", "get")
        .acceptJSON();
});
define("endpoint/session/EndpointSessionReset", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_3 = __importDefault(Endpoint_3);
    exports.default = (0, Endpoint_3.default)("/session/reset", "post");
});
define("utility/maths/Vector2", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Vector2;
    (function (Vector2) {
        function ZERO() {
            return { x: 0, y: 0 };
        }
        Vector2.ZERO = ZERO;
        function distance(v1, v2) {
            return Math.sqrt((v2.x - v1.x) ** 2 + (v2.y - v1.y) ** 2);
        }
        Vector2.distance = distance;
        function distanceWithin(v1, v2, within) {
            return (v2.x - v1.x) ** 2 + (v2.y - v1.y) ** 2 < within ** 2;
        }
        Vector2.distanceWithin = distanceWithin;
    })(Vector2 || (Vector2 = {}));
    exports.default = Vector2;
});
define("ui/utility/Mouse", ["require", "exports", "utility/State"], function (require, exports, State_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    State_1 = __importDefault(State_1);
    var Mouse;
    (function (Mouse) {
        const pos = { x: 0, y: 0 };
        Mouse.state = (0, State_1.default)(pos);
        const handlers = new Set();
        function onMove(handler) {
            handlers.add(handler);
        }
        Mouse.onMove = onMove;
        function offMove(handler) {
            handlers.delete(handler);
        }
        Mouse.offMove = offMove;
        function listen() {
            document.addEventListener("mousemove", event => {
                if (pos.x === event.clientX && pos.y === event.clientY)
                    return;
                pos.x = event.clientX;
                pos.y = event.clientY;
                Mouse.state.emit();
                for (const handler of handlers)
                    handler(pos);
            });
        }
        Mouse.listen = listen;
    })(Mouse || (Mouse = {}));
    exports.default = Mouse;
});
define("ui/utility/Viewport", ["require", "exports", "utility/State"], function (require, exports, State_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    State_2 = __importDefault(State_2);
    var Viewport;
    (function (Viewport) {
        Viewport.size = State_2.default.JIT(() => ({ w: window.innerWidth, h: window.innerHeight }));
        function listen() {
            window.addEventListener("resize", Viewport.size.markDirty);
        }
        Viewport.listen = listen;
    })(Viewport || (Viewport = {}));
    exports.default = Viewport;
});
define("ui/utility/AnchorManipulator", ["require", "exports", "ui/utility/Mouse", "ui/utility/Viewport"], function (require, exports, Mouse_1, Viewport_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ANCHOR_LOCATION_ALIGNMENTS = exports.ANCHOR_SIDE_VERTICAL = exports.ANCHOR_SIDE_HORIZONTAL = exports.ANCHOR_TYPES = void 0;
    Mouse_1 = __importDefault(Mouse_1);
    Viewport_1 = __importDefault(Viewport_1);
    ////////////////////////////////////
    //#region Anchor Strings
    exports.ANCHOR_TYPES = ["off", "aligned"];
    exports.ANCHOR_SIDE_HORIZONTAL = ["left", "right"];
    exports.ANCHOR_SIDE_VERTICAL = ["top", "bottom"];
    const anchorStrings = new Set(exports.ANCHOR_TYPES
        .flatMap(type => [exports.ANCHOR_SIDE_HORIZONTAL, exports.ANCHOR_SIDE_VERTICAL]
        .flatMap(sides => sides
        .map(side => `${type} ${side}`)))
        .flatMap(type => [type, `sticky ${type}`]));
    anchorStrings.add("centre");
    anchorStrings.add("sticky centre");
    function isAnchorString(value) {
        if (anchorStrings.has(value)) {
            return true;
        }
        if (typeof value !== "string") {
            return false;
        }
        const lastSpace = value.lastIndexOf(" ");
        if (lastSpace === -1) {
            return false;
        }
        const simpleAnchorString = value.slice(0, lastSpace);
        if (!anchorStrings.has(simpleAnchorString)) {
            return false;
        }
        const offsetString = value.slice(lastSpace + 1);
        return !isNaN(+offsetString);
    }
    function parseAnchor(anchor) {
        const sticky = anchor.startsWith("sticky");
        if (sticky) {
            anchor = anchor.slice(7);
        }
        const simpleAnchor = anchor;
        if (simpleAnchor === "centre") {
            return { sticky, type: "centre", side: "centre", offset: 0 };
        }
        const [type, side, offset] = simpleAnchor.split(" ");
        return {
            sticky,
            type,
            side,
            offset: offset ? +offset : 0,
        };
    }
    exports.ANCHOR_LOCATION_ALIGNMENTS = ["left", "centre", "right"];
    function AnchorManipulator(host) {
        let locationPreference;
        let refCache;
        let location;
        let currentAlignment;
        let from;
        function onFromRemove() {
            from = undefined;
        }
        const subscribed = [];
        const addSubscription = (use) => use && subscribed.push(use);
        const result = {
            isMouse: () => !locationPreference?.length,
            from: component => {
                from?.event.unsubscribe("remove", onFromRemove);
                from = component;
                component.event.subscribe("remove", onFromRemove);
                return host;
            },
            reset: () => {
                locationPreference = undefined;
                result.markDirty();
                return host;
            },
            add: (...config) => {
                let [xAnchor, xRefSelector, yAnchor, yRefSelector] = config;
                if (isAnchorString(xRefSelector)) {
                    yRefSelector = yAnchor;
                    yAnchor = xRefSelector;
                    xRefSelector = "*";
                }
                yRefSelector ??= "*";
                locationPreference ??= [];
                locationPreference.push({
                    xAnchor: parseAnchor(xAnchor),
                    xRefSelector,
                    yAnchor: parseAnchor(yAnchor),
                    yRefSelector,
                });
                result.markDirty();
                return host;
            },
            markDirty: () => {
                location = undefined;
                return host;
            },
            get: () => {
                if (location)
                    return location;
                for (const unuse of subscribed)
                    unuse();
                const tooltipBox = host?.rect.value;
                if (tooltipBox && locationPreference && from) {
                    for (const preference of locationPreference) {
                        let alignment = "left";
                        const xConf = preference.xAnchor;
                        const xRef = resolveAnchorRef(preference.xRefSelector);
                        const xBox = xRef?.rect.value;
                        addSubscription(xRef?.rect.subscribe(host, result.markDirty));
                        const xCenter = (xBox?.left ?? 0) + (xBox?.width ?? Viewport_1.default.size.value.w) / 2;
                        const xRefX = (xConf.side === "right" ? xBox?.right : xConf.side === "left" ? xBox?.left : xCenter) ?? xCenter;
                        let x;
                        switch (xConf.type) {
                            case "aligned":
                                x = xConf.side === "right" ? xRefX - tooltipBox.width - xConf.offset : xRefX + xConf.offset;
                                alignment = xConf.side;
                                break;
                            case "off":
                                x = xConf.side === "right" ? xRefX + xConf.offset : xRefX - tooltipBox.width - xConf.offset;
                                // alignment is inverted side for "off"
                                alignment = xConf.side === "left" ? "right" : "left";
                                break;
                            case "centre":
                                x = xRefX - tooltipBox.width / 2;
                                alignment = "centre";
                                break;
                        }
                        if (!xConf.sticky && tooltipBox.width < Viewport_1.default.size.value.w) {
                            const isXOffScreen = x < 0 || x + tooltipBox.width > Viewport_1.default.size.value.w;
                            if (isXOffScreen) {
                                continue;
                            }
                        }
                        const yConf = preference.yAnchor;
                        const yRef = resolveAnchorRef(preference.yRefSelector);
                        const yBox = yRef?.rect.value;
                        addSubscription(yRef?.rect.subscribe(host, result.markDirty));
                        const yCenter = (yBox?.top ?? 0) + (yBox?.height ?? Viewport_1.default.size.value.h) / 2;
                        const yRefY = (yConf.side === "bottom" ? yBox?.bottom : yConf.side === "top" ? yBox?.top : yCenter) ?? yCenter;
                        let y;
                        switch (yConf.type) {
                            case "aligned":
                                y = yConf.side === "bottom" ? yRefY - tooltipBox.height - yConf.offset : yRefY + yConf.offset;
                                break;
                            case "off":
                                y = yConf.side === "bottom" ? yRefY + yConf.offset : yRefY - tooltipBox.height - yConf.offset;
                                break;
                            case "centre":
                                y = yRefY - tooltipBox.height / 2;
                                break;
                        }
                        if (!yConf.sticky && tooltipBox.height < Viewport_1.default.size.value.h) {
                            const isYOffScreen = y < 0
                                || y + tooltipBox.height > Viewport_1.default.size.value.h;
                            if (isYOffScreen) {
                                continue;
                            }
                        }
                        return location ??= { mouse: false, padX: xConf.type === "off", alignment, x, y };
                    }
                }
                return location ??= { mouse: true, padX: true, ...Mouse_1.default.state.value };
            },
            apply: () => {
                const location = result.get();
                let alignment = location.alignment ?? currentAlignment;
                if (location.mouse) {
                    const shouldFlip = currentAlignment === "centre" || (currentAlignment === "right" ? location.x < Viewport_1.default.size.value.w / 2 - 200 : location.x > Viewport_1.default.size.value.w / 2 + 200);
                    if (shouldFlip) {
                        alignment = currentAlignment === "left" ? "right" : "left";
                    }
                }
                if (currentAlignment !== alignment) {
                    currentAlignment = alignment;
                    // this.surface.classes.removeStartingWith("aligned-")
                    // this.surface.classes.add(`aligned-${this.currentAlignment}`)
                }
                // this.surface.classes.toggle(location.padX, "pad-x")
                host.element.style.left = `${location.x}px`;
                host.element.style.top = `${location.y}px`;
                host.rect.markDirty();
                return host;
            },
        };
        return result;
        function resolveAnchorRef(selector) {
            const refRef = refCache?.[selector];
            let ref;
            if (refRef) {
                ref = refRef.deref();
            }
            else {
                ref = from?.element.closest(selector)?.component;
                if (ref) {
                    refCache ??= {};
                    refCache[selector] = new WeakRef(ref);
                }
            }
            return ref;
        }
    }
    exports.default = AnchorManipulator;
});
//#endregion
////////////////////////////////////
define("ui/utility/TextManipulator", ["require", "exports", "lang/en-nz", "utility/State"], function (require, exports, en_nz_1, State_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.QuiltHelper = void 0;
    en_nz_1 = __importDefault(en_nz_1);
    State_3 = __importDefault(State_3);
    var QuiltHelper;
    (function (QuiltHelper) {
        function renderWeave(weave) {
            return weave.content.map(renderWeft);
        }
        QuiltHelper.renderWeave = renderWeave;
        // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
        function arg(arg) {
            if (typeof arg === "object" && arg && "map" in arg)
                arg = arg.value;
            if (typeof arg === "function")
                arg = arg(en_nz_1.default, QuiltHelper);
            if (typeof arg === "string" && arg in en_nz_1.default)
                arg = en_nz_1.default[arg]();
            return arg;
        }
        QuiltHelper.arg = arg;
        function isPlaintextWeft(weft) {
            return true
                && typeof weft.content === "string";
        }
        function renderWeft(weft) {
            if (isPlaintextWeft(weft))
                return document.createTextNode(weft.content);
            let element;
            const tag = weft.tag?.toLowerCase();
            if (tag) {
                if (tag.startsWith("link(")) {
                    const link = element = document.createElement("a");
                    const href = tag.slice(5, -1);
                    link.href = href;
                    link.addEventListener("click", event => {
                        event.preventDefault();
                        navigate.toRawURL(href);
                    });
                }
            }
            element ??= document.createElement("span");
            if (Array.isArray(weft.content))
                element.append(...weft.content.map(renderWeft));
            else
                element.textContent = `${weft.content ?? ""}`;
            return element;
        }
    })(QuiltHelper || (exports.QuiltHelper = QuiltHelper = {}));
    function TextManipulator(component) {
        let translationHandler;
        const result = {
            state: (0, State_3.default)(""),
            set(text) {
                component.element.textContent = text;
                result.state.value = text;
                return component;
            },
            use(handler) {
                translationHandler = handler;
                result.refresh();
                return component;
            },
            refresh() {
                if (!translationHandler)
                    return;
                const weave = typeof translationHandler === "string" ? en_nz_1.default[translationHandler]() : translationHandler(en_nz_1.default, QuiltHelper);
                component.element.replaceChildren(...QuiltHelper.renderWeave(weave));
                result.state.value = weave;
            },
        };
        return result;
    }
    exports.default = TextManipulator;
});
define("ui/utility/AttributeManipulator", ["require", "exports", "lang/en-nz", "ui/utility/TextManipulator"], function (require, exports, en_nz_2, TextManipulator_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    en_nz_2 = __importDefault(en_nz_2);
    function AttributeManipulator(component) {
        let translationHandlers;
        const result = {
            get(attribute) {
                return component.element.getAttribute(attribute) ?? undefined;
            },
            add(...attributes) {
                for (const attribute of attributes) {
                    delete translationHandlers?.[attribute];
                    component.element.setAttribute(attribute, "");
                }
                return component;
            },
            set(attribute, value) {
                delete translationHandlers?.[attribute];
                if (value === undefined)
                    component.element.removeAttribute(attribute);
                else
                    component.element.setAttribute(attribute, value);
                return component;
            },
            getUsing(attribute) {
                return translationHandlers?.[attribute];
            },
            use(attribute, handler) {
                translationHandlers ??= {};
                translationHandlers[attribute] = handler;
                result.refresh();
                return component;
            },
            refresh() {
                if (!translationHandlers)
                    return;
                for (const attribute in translationHandlers) {
                    const translationHandler = translationHandlers[attribute];
                    const weave = typeof translationHandler === "string" ? en_nz_2.default[translationHandler]() : translationHandler(en_nz_2.default, TextManipulator_1.QuiltHelper);
                    component.element.setAttribute(attribute, weave.toString());
                }
            },
            remove(...attributes) {
                for (const attribute of attributes) {
                    delete translationHandlers?.[attribute];
                    component.element.removeAttribute(attribute);
                }
                return component;
            },
            toggle(present, attribute, value = "") {
                return this[present ? "set" : "remove"](attribute, value);
            },
            copy(element) {
                if ("element" in element)
                    element = element.element;
                for (const attribute of element.attributes)
                    component.element.setAttribute(attribute.name, attribute.value);
                return component;
            },
        };
        return result;
    }
    exports.default = AttributeManipulator;
});
define("ui/utility/ClassManipulator", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function ClassManipulator(component) {
        return {
            add(...classes) {
                component.element.classList.add(...classes);
                return component;
            },
            remove(...classes) {
                component.element.classList.remove(...classes);
                return component;
            },
            toggle(present, ...classes) {
                return this[present ? "add" : "remove"](...classes);
            },
            copy(element) {
                if ("element" in element)
                    element = element.element;
                component.element.classList.add(...element.classList);
                return component;
            },
        };
    }
    exports.default = ClassManipulator;
});
define("utility/Define", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function Define(proto, key, implementation) {
        try {
            Object.defineProperty(proto, key, {
                configurable: true,
                writable: true,
                value: implementation,
            });
        }
        catch (err) {
        }
    }
    (function (Define) {
        function all(protos, key, implementation) {
            for (const proto of protos) {
                Define(proto, key, implementation);
            }
        }
        Define.all = all;
        function magic(obj, key, implementation) {
            try {
                Object.defineProperty(obj, key, {
                    configurable: true,
                    ...implementation,
                });
            }
            catch (err) {
            }
        }
        Define.magic = magic;
        function set(obj, key, value) {
            try {
                Object.defineProperty(obj, key, {
                    configurable: true,
                    value,
                });
            }
            catch (err) {
            }
            return value;
        }
        Define.set = set;
    })(Define || (Define = {}));
    exports.default = Define;
});
define("utility/Arrays", ["require", "exports", "utility/Define"], function (require, exports, Define_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Define_1 = __importDefault(Define_1);
    var Arrays;
    (function (Arrays) {
        Arrays.EMPTY = [];
        function resolve(or) {
            return Array.isArray(or) ? or : or === undefined ? [] : [or];
        }
        Arrays.resolve = resolve;
        function includes(array, value) {
            return Array.isArray(array) ? array.includes(value) : array === value;
        }
        Arrays.includes = includes;
        function slice(or) {
            return Array.isArray(or) ? or.slice() : or === undefined ? [] : [or];
        }
        Arrays.slice = slice;
        /**
         * Removes one instance of the given value from the given array.
         * @returns `true` if removed, `false` otherwise
         */
        function remove(array, ...values) {
            if (!array)
                return false;
            let removed = false;
            for (const value of values) {
                const index = array.indexOf(value);
                if (index === -1)
                    continue;
                array.splice(index, 1);
                removed = true;
            }
            return removed;
        }
        Arrays.remove = remove;
        /**
         * Adds the given value to the given array if not present.
         * @returns `true` if added, `false` otherwise
         */
        function add(array, value) {
            if (!array)
                return false;
            const index = array.indexOf(value);
            if (index !== -1)
                return false;
            array.push(value);
            return true;
        }
        Arrays.add = add;
        function tuple(...values) {
            return values;
        }
        Arrays.tuple = tuple;
        function range(start, end, step) {
            if (step === 0)
                throw new Error("Invalid step for range");
            const result = [];
            if (end === undefined)
                end = start, start = 0;
            step = end < start ? -1 : 1;
            for (let i = start; step > 0 ? i < end : i > end; i += step)
                result.push(i);
            return result;
        }
        Arrays.range = range;
        function filterNullish(value) {
            return value !== null && value !== undefined;
        }
        Arrays.filterNullish = filterNullish;
        function filterFalsy(value) {
            return !!value;
        }
        Arrays.filterFalsy = filterFalsy;
        function mergeSorted(...arrays) {
            return arrays.reduce((prev, curr) => mergeSorted2(prev, curr), []);
        }
        Arrays.mergeSorted = mergeSorted;
        function mergeSorted2(array1, array2) {
            const merged = [];
            let index1 = 0;
            let index2 = 0;
            while (index1 < array1.length || index2 < array2.length) {
                const v1 = index1 < array1.length ? array1[index1] : undefined;
                const v2 = index2 < array2.length ? array2[index2] : undefined;
                if (v1 === v2) {
                    merged.push(v1);
                    index1++;
                    index2++;
                    continue;
                }
                if (v1 === undefined && v2 !== undefined) {
                    merged.push(v2);
                    index2++;
                    continue;
                }
                if (v2 === undefined && v1 !== undefined) {
                    merged.push(v1);
                    index1++;
                    continue;
                }
                const indexOfPerson1InList2 = array2.indexOf(v1, index2);
                if (indexOfPerson1InList2 === -1) {
                    merged.push(v1);
                    index1++;
                }
                else {
                    merged.push(v2);
                    index2++;
                }
            }
            return merged;
        }
        function applyPrototypes() {
            (0, Define_1.default)(Array.prototype, "findLast", function (predicate) {
                if (this.length > 0)
                    for (let i = this.length - 1; i >= 0; i--)
                        if (predicate(this[i], i, this))
                            return this[i];
                return undefined;
            });
            (0, Define_1.default)(Array.prototype, "findLastIndex", function (predicate) {
                if (this.length > 0)
                    for (let i = this.length - 1; i >= 0; i--)
                        if (predicate(this[i], i, this))
                            return i;
                return -1;
            });
            const originalSort = Array.prototype.sort;
            (0, Define_1.default)(Array.prototype, "sort", function (...sorters) {
                if (this.length <= 1)
                    return this;
                if (!sorters.length)
                    return originalSort.call(this);
                return originalSort.call(this, (a, b) => {
                    for (const sorter of sorters) {
                        if (sorter.length === 1) {
                            const mapper = sorter;
                            const sortValue = mapper(b) - mapper(a);
                            if (sortValue)
                                return sortValue;
                        }
                        else {
                            const sortValue = sorter(a, b);
                            if (sortValue)
                                return sortValue;
                        }
                    }
                    return 0;
                });
            });
            (0, Define_1.default)(Array.prototype, "collect", function (collector, ...args) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                return collector?.(this, ...args);
            });
            (0, Define_1.default)(Array.prototype, "splat", function (collector, ...args) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                return collector?.(...this, ...args);
            });
            (0, Define_1.default)(Array.prototype, "toObject", function (mapper) {
                return Object.fromEntries(mapper ? this.map(mapper) : this);
            });
            (0, Define_1.default)(Array.prototype, "distinct", function (mapper) {
                const result = [];
                const encountered = mapper ? [] : result;
                for (const value of this) {
                    const encounterValue = mapper ? mapper(value) : value;
                    if (encountered.includes(encounterValue))
                        continue;
                    if (mapper)
                        encountered.push(encounterValue);
                    result.push(value);
                }
                return result;
            });
            (0, Define_1.default)(Array.prototype, "findMap", function (predicate, mapper) {
                for (let i = 0; i < this.length; i++)
                    if (predicate(this[i], i, this))
                        return mapper(this[i], i, this);
                return undefined;
            });
            (0, Define_1.default)(Array.prototype, "groupBy", function (grouper) {
                const result = {};
                for (let i = 0; i < this.length; i++)
                    (result[String(grouper(this[i], i, this))] ??= []).push(this[i]);
                return Object.entries(result);
            });
        }
        Arrays.applyPrototypes = applyPrototypes;
    })(Arrays || (Arrays = {}));
    exports.default = Arrays;
});
define("ui/utility/EventManipulator", ["require", "exports", "utility/Arrays"], function (require, exports, Arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Arrays_1 = __importDefault(Arrays_1);
    const SYMBOL_REGISTERED_FUNCTION = Symbol("REGISTERED_FUNCTION");
    function EventManipulator(component) {
        return {
            emit(event, ...params) {
                const detail = { result: [], params };
                const eventObject = new CustomEvent(event, { detail });
                component.element.dispatchEvent(eventObject);
                return detail.result;
            },
            subscribe(events, handler) {
                if (handler[SYMBOL_REGISTERED_FUNCTION]) {
                    console.error(`Can't register handler for event(s) ${Arrays_1.default.resolve(events).join(", ")}, already used for other events`, handler);
                    return component;
                }
                const realHandler = (event) => {
                    const customEvent = event instanceof CustomEvent ? event : undefined;
                    const eventDetail = customEvent?.detail;
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                    const result = handler(Object.assign(event, { component }), ...eventDetail?.params ?? []);
                    eventDetail?.result.push(result);
                };
                Object.assign(handler, { [SYMBOL_REGISTERED_FUNCTION]: realHandler });
                for (const event of Arrays_1.default.resolve(events))
                    component.element.addEventListener(event, realHandler);
                return component;
            },
            unsubscribe(events, handler) {
                const realHandler = handler[SYMBOL_REGISTERED_FUNCTION];
                if (!realHandler)
                    return component;
                delete handler[SYMBOL_REGISTERED_FUNCTION];
                for (const event of Arrays_1.default.resolve(events))
                    component.element.removeEventListener(event, realHandler);
                return component;
            },
        };
    }
    exports.default = EventManipulator;
});
define("ui/utility/FocusListener", ["require", "exports", "utility/State"], function (require, exports, State_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    State_4 = __importDefault(State_4);
    var FocusListener;
    (function (FocusListener) {
        let lastFocused;
        FocusListener.hasFocus = (0, State_4.default)(false);
        function focused() {
            return lastFocused;
        }
        FocusListener.focused = focused;
        function focusedComponent() {
            return lastFocused?.component;
        }
        FocusListener.focusedComponent = focusedComponent;
        // interface QueuedFocusChange {
        // 	type: "focus" | "blur"
        // 	element: HTMLElement
        // }
        // let updatingFocusState = false
        // let cursor = 0
        // const queue: QueuedFocusChange[] = []
        function focus(element) {
            // if (updatingFocusState || exhaustingQueue) {
            // 	queue.splice(cursor, 0, { type: "focus", element })
            // 	cursor++
            // 	return
            // }
            focusInternal(element);
        }
        FocusListener.focus = focus;
        function focusInternal(element) {
            if (document.querySelector(":focus-visible") === element)
                return;
            element.focus();
        }
        function blur(element) {
            // if (updatingFocusState || exhaustingQueue) {
            // 	queue.splice(cursor, 0, { type: "blur", element })
            // 	cursor++
            // 	return
            // }
            blurInternal(element);
        }
        FocusListener.blur = blur;
        function blurInternal(element) {
            if (document.querySelector(":focus-visible") !== element)
                return;
            element.blur();
        }
        function listen() {
            document.addEventListener("focusin", onFocusIn);
            document.addEventListener("focusout", onFocusOut);
        }
        FocusListener.listen = listen;
        function onFocusIn() {
            updateFocusState();
        }
        function onFocusOut(event) {
            if (event.relatedTarget === null)
                updateFocusState();
        }
        // let exhaustingQueue = false
        function updateFocusState() {
            if (document.activeElement && document.activeElement !== document.body && location.hash && document.activeElement.id !== location.hash.slice(1))
                history.pushState(undefined, "", " ");
            const focused = document.querySelector(":focus-visible") ?? undefined;
            if (focused === lastFocused)
                return;
            // updatingFocusState = true
            const lastFocusedComponent = lastFocused?.component;
            const focusedComponent = focused?.component;
            const oldAncestors = !lastFocusedComponent ? undefined : [...lastFocusedComponent.getAncestorComponents()];
            const newAncestors = !focusedComponent ? undefined : [...focusedComponent.getAncestorComponents()];
            const lastFocusedContainsFocused = lastFocused?.contains(focused ?? null);
            lastFocused = focused;
            FocusListener.hasFocus.value = !!focused;
            if (lastFocusedComponent) {
                lastFocusedComponent.focused.value = false;
                if (!lastFocusedContainsFocused)
                    lastFocusedComponent.hasFocused.value = false;
            }
            if (focusedComponent) {
                focusedComponent.focused.value = true;
                focusedComponent.hasFocused.value = true;
            }
            if (oldAncestors)
                for (const ancestor of oldAncestors)
                    if (!newAncestors?.includes(ancestor))
                        if (ancestor)
                            ancestor.hasFocused.value = false;
            if (newAncestors)
                for (const ancestor of newAncestors)
                    if (ancestor)
                        ancestor.hasFocused.value = true;
            // updatingFocusState = false
            // if (exhaustingQueue)
            // 	return
            // exhaustingQueue = true
            // for (cursor = 0; cursor < queue.length; cursor++) {
            // 	const change = queue[cursor]
            // 	if (change.type === "blur")
            // 		blurInternal(change.element)
            // 	else if (change.type === "focus")
            // 		focusInternal(change.element)
            // }
            // queue.splice(0, Infinity)
            // cursor = 0
            // exhaustingQueue = false
        }
    })(FocusListener || (FocusListener = {}));
    exports.default = FocusListener;
    Object.assign(window, { FocusListener });
});
define("ui/utility/StyleManipulator", ["require", "exports", "style"], function (require, exports, style_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    style_1 = __importDefault(style_1);
    function StyleManipulator(component) {
        const styles = new Set();
        const stateUnsubscribers = new WeakMap();
        const result = Object.assign(((...names) => {
            for (const name of names)
                styles.add(name);
            updateClasses();
            return component;
        }), {
            remove(...names) {
                for (const name of names)
                    styles.delete(name);
                updateClasses(names);
                return component;
            },
            toggle(enabled, ...names) {
                if (enabled)
                    for (const name of names)
                        styles.add(name);
                else
                    for (const name of names)
                        styles.delete(name);
                updateClasses(!enabled ? names : undefined);
                return component;
            },
            bind(state, ...names) {
                result.unbind(state);
                const unsubscribe = state.use(component, active => {
                    if (active)
                        for (const name of names)
                            styles.add(name);
                    else
                        for (const name of names)
                            styles.delete(name);
                    updateClasses(!active ? names : undefined);
                });
                stateUnsubscribers.set(state, [unsubscribe, names]);
                return component;
            },
            unbind(state) {
                const bound = state && stateUnsubscribers.get(state);
                if (!bound)
                    return component;
                const [unsubscribe, names] = bound;
                unsubscribe?.();
                stateUnsubscribers.delete(state);
                result.remove(...names);
                return component;
            },
            refresh: () => updateClasses(),
            setProperty(property, value) {
                component.element.style.setProperty(property, `${value}`);
                return component;
            },
            setVariable(variable, value) {
                component.element.style.setProperty(`--${variable}`, `${value}`);
                return component;
            },
            removeProperties(...properties) {
                for (const property of properties)
                    component.element.style.removeProperty(property);
                return component;
            },
        });
        return result;
        function updateClasses(deletedStyles) {
            const toAdd = [...styles].flatMap(component => style_1.default[component]);
            const toRemove = deletedStyles?.flatMap(component => style_1.default[component]).filter(cls => !toAdd.includes(cls));
            if (toRemove)
                component.element.classList.remove(...toRemove);
            component.element.classList.add(...toAdd);
            return component;
        }
    }
    exports.default = StyleManipulator;
});
define("utility/Errors", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Errors;
    (function (Errors) {
        Errors.Impossible = () => new Error("Something impossible appears to have happened, what are you?");
    })(Errors || (Errors = {}));
    exports.default = Errors;
});
define("ui/Component", ["require", "exports", "ui/utility/AnchorManipulator", "ui/utility/AttributeManipulator", "ui/utility/ClassManipulator", "ui/utility/EventManipulator", "ui/utility/FocusListener", "ui/utility/StyleManipulator", "ui/utility/TextManipulator", "ui/utility/Viewport", "utility/Define", "utility/Errors", "utility/State"], function (require, exports, AnchorManipulator_1, AttributeManipulator_1, ClassManipulator_1, EventManipulator_1, FocusListener_1, StyleManipulator_1, TextManipulator_2, Viewport_2, Define_2, Errors_1, State_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    AnchorManipulator_1 = __importDefault(AnchorManipulator_1);
    AttributeManipulator_1 = __importDefault(AttributeManipulator_1);
    ClassManipulator_1 = __importDefault(ClassManipulator_1);
    EventManipulator_1 = __importDefault(EventManipulator_1);
    FocusListener_1 = __importDefault(FocusListener_1);
    StyleManipulator_1 = __importDefault(StyleManipulator_1);
    TextManipulator_2 = __importDefault(TextManipulator_2);
    Viewport_2 = __importDefault(Viewport_2);
    Define_2 = __importDefault(Define_2);
    Errors_1 = __importDefault(Errors_1);
    State_5 = __importDefault(State_5);
    const SYMBOL_COMPONENT_BRAND = Symbol("COMPONENT_BRAND");
    const ELEMENT_TO_COMPONENT_MAP = new WeakMap();
    Define_2.default.magic(Element.prototype, "component", {
        get() {
            return ELEMENT_TO_COMPONENT_MAP.get(this);
        },
        set(component) {
            if (component) {
                ELEMENT_TO_COMPONENT_MAP.set(this, component);
            }
            else {
                ELEMENT_TO_COMPONENT_MAP.delete(this);
            }
        },
    });
    var Classes;
    (function (Classes) {
        Classes["ReceiveAncestorInsertEvents"] = "_receieve-ancestor-insert-events";
    })(Classes || (Classes = {}));
    const componentExtensionsRegistry = [];
    function Component(type = "span") {
        let unuseIdState;
        let unuseNameState;
        let unuseAriaLabelledByIdState;
        let unuseAriaControlsIdState;
        let owner;
        let component = {
            supers: [],
            isComponent: true,
            element: document.createElement(type),
            removed: (0, State_5.default)(false),
            rooted: (0, State_5.default)(false),
            setOwner: newOwner => {
                owner?.event.unsubscribe("remove", component.remove);
                owner = newOwner;
                owner.event.subscribe("remove", component.remove);
                return component;
            },
            replaceElement: (newElement) => {
                if (typeof newElement === "string")
                    newElement = document.createElement(newElement);
                const oldElement = component.element;
                newElement.replaceChildren(...component.element.children);
                if (component.element.parentNode)
                    component.element.replaceWith(newElement);
                component.element = newElement;
                type = component.element.tagName;
                ELEMENT_TO_COMPONENT_MAP.delete(oldElement);
                ELEMENT_TO_COMPONENT_MAP.set(newElement, component);
                component.attributes.copy(oldElement);
                component.style.refresh();
                return component;
            },
            is: (builder) => component.supers.includes(builder),
            and(builder, ...params) {
                component = builder.from(component, ...params);
                component.supers.push(builder);
                return component;
            },
            extend: extension => Object.assign(component, extension(component)),
            extendMagic: (property, magic) => {
                Define_2.default.magic(component, property, magic(component));
                return component;
            },
            extendJIT: (property, supplier) => {
                Define_2.default.magic(component, property, {
                    get: () => {
                        const value = supplier(component);
                        Define_2.default.set(component, property, value);
                        return value;
                    },
                });
                return component;
            },
            tweak: tweaker => {
                tweaker(component);
                return component;
            },
            get style() {
                return Define_2.default.set(component, "style", (0, StyleManipulator_1.default)(component));
            },
            get classes() {
                return Define_2.default.set(component, "classes", (0, ClassManipulator_1.default)(component));
            },
            get attributes() {
                return Define_2.default.set(component, "attributes", (0, AttributeManipulator_1.default)(component));
            },
            get event() {
                return Define_2.default.set(component, "event", (0, EventManipulator_1.default)(component));
            },
            get text() {
                return Define_2.default.set(component, "text", (0, TextManipulator_2.default)(component));
            },
            get anchor() {
                return Define_2.default.set(component, "anchor", (0, AnchorManipulator_1.default)(component));
            },
            get hovered() {
                return Define_2.default.set(component, "hovered", (0, State_5.default)(false));
            },
            get focused() {
                return Define_2.default.set(component, "focused", (0, State_5.default)(false));
            },
            get hasFocused() {
                return Define_2.default.set(component, "hasFocused", (0, State_5.default)(false));
            },
            get hoveredOrFocused() {
                return Define_2.default.set(component, "hoveredOrFocused", State_5.default.Generator(() => component.hovered.value || component.focused.value)
                    .observe(component.hovered, component.focused));
            },
            get active() {
                return Define_2.default.set(component, "active", (0, State_5.default)(false));
            },
            get id() {
                return Define_2.default.set(component, "id", (0, State_5.default)(undefined));
            },
            get name() {
                return Define_2.default.set(component, "name", (0, State_5.default)(undefined));
            },
            get rect() {
                const rectState = State_5.default.JIT(() => component.element.getBoundingClientRect());
                this.receiveAncestorInsertEvents();
                this.event.subscribe(["insert", "ancestorInsert"], rectState.markDirty);
                Viewport_2.default.size.subscribe(component, rectState.markDirty);
                return Define_2.default.set(component, "rect", rectState);
            },
            setId: id => {
                unuseIdState?.();
                unuseIdState = undefined;
                if (id && typeof id !== "string")
                    unuseIdState = id.use(component, setId);
                else
                    setId(id);
                return component;
                function setId(id) {
                    if (id) {
                        component.element.setAttribute("id", id);
                        component.id.value = id;
                    }
                    else {
                        component.element.removeAttribute("id");
                        component.id.value = undefined;
                    }
                }
            },
            setName: name => {
                unuseNameState?.();
                unuseNameState = undefined;
                if (name && typeof name !== "string")
                    unuseNameState = name.use(component, setName);
                else
                    setName(name);
                return component;
                function setName(name) {
                    if (name) {
                        component.element.setAttribute("name", name);
                        component.name.value = name;
                    }
                    else {
                        component.element.removeAttribute("name");
                        component.name.value = undefined;
                    }
                }
            },
            remove(internal = false) {
                component.removed.value = true;
                component.rooted.value = false;
                if (!internal)
                    for (const descendant of component.element.querySelectorAll("*"))
                        descendant.component?.remove(true);
                component.element.component = undefined;
                component.element.remove();
                component.event.emit("unroot");
                component.event.emit("remove");
                owner?.event.unsubscribe("remove", component.remove);
            },
            appendTo(destination) {
                Component.element(destination).append(component.element);
                updateRooted(component);
                emitInsert(component);
                return component;
            },
            prependTo(destination) {
                Component.element(destination).prepend(component.element);
                updateRooted(component);
                emitInsert(component);
                return component;
            },
            append(...contents) {
                const elements = contents.map(Component.element);
                component.element.append(...elements);
                for (const element of elements) {
                    const component = element.component;
                    emitInsert(component);
                    updateRooted(component);
                }
                return component;
            },
            prepend(...contents) {
                const elements = contents.map(Component.element);
                component.element.prepend(...elements);
                for (const element of elements) {
                    const component = element.component;
                    emitInsert(component);
                    updateRooted(component);
                }
                return component;
            },
            removeContents() {
                component.element.replaceChildren();
                return component;
            },
            *getAncestorComponents() {
                let cursor = component.element;
                while (cursor) {
                    cursor = cursor.parentElement;
                    const component = cursor?.component;
                    if (component)
                        yield component;
                }
            },
            receiveAncestorInsertEvents: () => {
                component.element.classList.add(Classes.ReceiveAncestorInsertEvents);
                return component;
            },
            ariaRole: (role) => {
                if (!role)
                    return component.attributes.remove("role");
                return component.attributes.set("role", role);
            },
            ariaLabel: (keyOrHandler) => {
                if (!keyOrHandler)
                    return component.attributes.remove("aria-label");
                return component.attributes.use("aria-label", keyOrHandler);
            },
            ariaLabelledBy: labelledBy => {
                unuseAriaLabelledByIdState?.();
                unuseAriaLabelledByIdState = labelledBy?.id.use(component, id => component.attributes.set("aria-labelledby", id));
                return component;
            },
            ariaHidden: () => component.attributes.set("aria-hidden", "true"),
            ariaChecked: (state) => {
                state.use(component, state => component.attributes.set("aria-checked", `${state}`));
                return component;
            },
            ariaControls: target => {
                unuseAriaControlsIdState?.();
                unuseAriaControlsIdState = target?.id.use(component, id => component.attributes.set("aria-controls", id));
                return component;
            },
            tabIndex: (index) => {
                if (index === undefined)
                    component.element.removeAttribute("tabindex");
                else if (index === "programmatic")
                    component.element.setAttribute("tabindex", "-1");
                else if (index === "auto")
                    component.element.setAttribute("tabindex", "0");
                else
                    component.element.setAttribute("tabindex", `${index}`);
                return component;
            },
            focus: () => {
                FocusListener_1.default.focus(component.element);
                return component;
            },
            blur: () => {
                FocusListener_1.default.blur(component.element);
                return component;
            },
        };
        for (const extension of componentExtensionsRegistry)
            extension(component);
        if (!Component.is(component))
            throw Errors_1.default.Impossible();
        component.element.component = component;
        return component;
    }
    function emitInsert(component) {
        if (!component)
            return;
        component.event.emit("insert");
        const descendantsListeningForEvent = component.element.getElementsByClassName(Classes.ReceiveAncestorInsertEvents);
        for (const descendant of descendantsListeningForEvent)
            descendant.component?.event.emit("ancestorInsert");
    }
    function updateRooted(component) {
        if (component) {
            const rooted = document.documentElement.contains(component.element);
            if (component.rooted.value === rooted)
                return;
            component.rooted.value = rooted;
            component.event.emit(rooted ? "root" : "unroot");
            for (const descendant of component.element.querySelectorAll("*")) {
                const component = descendant.component;
                if (component) {
                    component.rooted.value = rooted;
                    component.event.emit(rooted ? "root" : "unroot");
                }
            }
        }
    }
    (function (Component) {
        function is(value) {
            return typeof value === "object" && !!value?.isComponent;
        }
        Component.is = is;
        function element(from) {
            return is(from) ? from.element : from;
        }
        Component.element = element;
        const defaultBuilder = (type) => Component(type);
        function Builder(initialOrBuilder, builder) {
            const type = typeof initialOrBuilder === "string" ? initialOrBuilder : undefined;
            const initialBuilder = !builder || typeof initialOrBuilder === "string" ? defaultBuilder : initialOrBuilder;
            builder ??= initialOrBuilder;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            const realBuilder = (component = initialBuilder(type), ...params) => builder(component, ...params);
            const simpleBuilder = (...params) => {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                const component = realBuilder(undefined, ...params);
                if (component instanceof Promise)
                    return component.then(component => {
                        component.supers.push(simpleBuilder);
                        return component;
                    });
                component.supers.push(simpleBuilder);
                return component;
            };
            return Object.assign(simpleBuilder, {
                from: realBuilder,
            });
        }
        Component.Builder = Builder;
        function Extension(builder) {
            return {
                from: builder,
            };
        }
        Component.Extension = Extension;
        function extend(extension) {
            componentExtensionsRegistry.push(extension);
        }
        Component.extend = extend;
        /**
         * Returns the component for the given element, if it exists
         */
        function get(element) {
            if (!element || (typeof element !== "object" && typeof element !== "function"))
                return undefined;
            return ELEMENT_TO_COMPONENT_MAP.get(element);
        }
        Component.get = get;
    })(Component || (Component = {}));
    exports.default = Component;
});
define("utility/State", ["require", "exports", "utility/Define"], function (require, exports, Define_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Define_3 = __importDefault(Define_3);
    const SYMBOL_UNSUBSCRIBE = Symbol("UNSUBSCRIBE");
    const SYMBOL_VALUE = Symbol("VALUE");
    const SYMBOL_SUBSCRIBERS = Symbol("SUBSCRIBERS");
    function State(defaultValue, equals) {
        const result = {
            [SYMBOL_VALUE]: defaultValue,
            [SYMBOL_SUBSCRIBERS]: [],
            get value() {
                return result[SYMBOL_VALUE];
            },
            set value(value) {
                if (result[SYMBOL_VALUE] === value || equals?.(result[SYMBOL_VALUE], value))
                    return;
                result[SYMBOL_VALUE] = value;
                result.emit();
            },
            equals: value => result[SYMBOL_VALUE] === value || equals?.(result[SYMBOL_VALUE], value) || false,
            emit: () => {
                for (const subscriber of result[SYMBOL_SUBSCRIBERS])
                    subscriber(result[SYMBOL_VALUE]);
                return result;
            },
            use: (owner, subscriber) => {
                result.subscribe(owner, subscriber);
                subscriber(result[SYMBOL_VALUE], true);
                return () => result.unsubscribe(subscriber);
            },
            subscribe: (owner, subscriber) => {
                function onRemoved() {
                    owner.removed.unsubscribe(onRemoved);
                    result.unsubscribe(subscriber);
                    fn[SYMBOL_UNSUBSCRIBE]?.delete(onRemoved);
                }
                const fn = subscriber;
                fn[SYMBOL_UNSUBSCRIBE] ??= new Set();
                fn[SYMBOL_UNSUBSCRIBE].add(onRemoved);
                owner.removed.subscribeManual(onRemoved);
                result.subscribeManual(subscriber);
                return () => {
                    result.unsubscribe(subscriber);
                    owner.removed.unsubscribe(onRemoved);
                };
            },
            subscribeManual: subscriber => {
                result[SYMBOL_SUBSCRIBERS].push(subscriber);
                return () => result.unsubscribe(subscriber);
            },
            unsubscribe: subscriber => {
                result[SYMBOL_SUBSCRIBERS] = result[SYMBOL_SUBSCRIBERS].filter(s => s !== subscriber);
                return result;
            },
            map: mapper => State.Map(result, mapper),
        };
        return result;
    }
    (function (State) {
        function Generator(generate) {
            const result = State(generate());
            Define_3.default.magic(result, "value", {
                get: () => result[SYMBOL_VALUE],
            });
            result.refresh = () => {
                const value = generate();
                if (result.equals(value))
                    return result;
                result[SYMBOL_VALUE] = value;
                result.emit();
                return result;
            };
            result.observe = (...states) => {
                for (const state of states)
                    state.subscribeManual(result.refresh);
                return result;
            };
            result.unobserve = (...states) => {
                for (const state of states)
                    state.unsubscribe(result.refresh);
                return result;
            };
            return result;
        }
        State.Generator = Generator;
        function JIT(generate) {
            const result = State(undefined);
            let isCached = false;
            let cached;
            Define_3.default.magic(result, "value", {
                get: () => {
                    if (!isCached) {
                        isCached = true;
                        cached = generate();
                    }
                    return cached;
                },
            });
            result.emit = () => {
                for (const subscriber of result[SYMBOL_SUBSCRIBERS])
                    subscriber(undefined);
                return result;
            };
            result.markDirty = () => {
                isCached = false;
                cached = undefined;
                result.emit();
                return result;
            };
            result.observe = (...states) => {
                for (const state of states)
                    state.subscribeManual(result.markDirty);
                return result;
            };
            result.unobserve = (...states) => {
                for (const state of states)
                    state.unsubscribe(result.markDirty);
                return result;
            };
            return result;
        }
        State.JIT = JIT;
        function Truthy(state) {
            return Generator(() => !!state.value)
                .observe(state);
        }
        State.Truthy = Truthy;
        function Falsy(state) {
            return Generator(() => !!state.value)
                .observe(state);
        }
        State.Falsy = Falsy;
        function Some(...anyOfStates) {
            return Generator(() => anyOfStates.some(state => state.value))
                .observe(...anyOfStates);
        }
        State.Some = Some;
        function Every(...anyOfStates) {
            return Generator(() => anyOfStates.every(state => state.value))
                .observe(...anyOfStates);
        }
        State.Every = Every;
        function Map(input, outputGenerator) {
            return Generator(() => outputGenerator(input.value))
                .observe(input);
        }
        State.Map = Map;
    })(State || (State = {}));
    exports.default = State;
});
define("utility/Store", ["require", "exports", "utility/State"], function (require, exports, State_6) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    State_6 = __importDefault(State_6);
    // export type IStoreEvents =
    // 	& { [KEY in keyof ILocalStorage as `set${Capitalize<KEY>}`]: { value: ILocalStorage[KEY]; oldValue: ILocalStorage[KEY] } }
    // 	& { [KEY in keyof ILocalStorage as `delete${Capitalize<KEY>}`]: { oldValue: ILocalStorage[KEY] } }
    let storage;
    let statesProxy;
    let states;
    class Store {
        // public static readonly event = EventManager.make<IStoreEvents>()
        static get items() {
            return storage ??= new Proxy({}, {
                has(_, key) {
                    return Store.has(key);
                },
                get(_, key) {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                    return Store.get(key);
                },
                set(_, key, value) {
                    return Store.set(key, value);
                },
                deleteProperty(_, key) {
                    return Store.delete(key);
                },
            });
        }
        static get state() {
            const s = states ??= {};
            return statesProxy ??= new Proxy({}, {
                has(_, key) {
                    return Store.has(key);
                },
                get(_, key) {
                    return s[key] ??= (0, State_6.default)(Store.get(key));
                },
            });
        }
        static get full() {
            const result = {};
            for (const [key, value] of Object.entries(localStorage))
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
                result[key] = JSON.parse(value);
            return result;
        }
        static has(key) {
            return localStorage.getItem(key) !== null;
        }
        static get(key) {
            const value = localStorage.getItem(key);
            try {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                return value === null ? null : JSON.parse(value);
            }
            catch {
                localStorage.removeItem(key);
                return null;
            }
        }
        static set(key, value) {
            // const oldValue = Store.get(key)
            if (value === undefined)
                localStorage.removeItem(key);
            else
                localStorage.setItem(key, JSON.stringify(value));
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            // Store.event.emit(`set${key[0].toUpperCase()}${key.slice(1)}` as keyof IStoreEvents, { value, oldValue } as never)
            const state = states?.[key];
            if (state)
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                state.value = value;
            return true;
        }
        static delete(key) {
            // const oldValue = Store.get(key)
            localStorage.removeItem(key);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            // Store.event.emit(`delete${key[0].toUpperCase()}${key.slice(1)}` as keyof IStoreEvents, { oldValue } as never)
            const state = states?.[key];
            if (state)
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                state.value = undefined;
            return true;
        }
    }
    exports.default = Store;
    Object.assign(window, { Store });
});
define("utility/Popup", ["require", "exports", "utility/Store"], function (require, exports, Store_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = popup;
    Store_1 = __importDefault(Store_1);
    function popup(name, url, width = 600, height = 800) {
        const left = (window.innerWidth - width) / 2 + window.screenLeft;
        const top = (window.innerHeight - height) / 2 + window.screenTop;
        return new Promise((resolve, reject) => {
            delete Store_1.default.items.popupError;
            const options = "width=" + width + ",height=" + height + ",top=" + top + ",left=" + left;
            const oauthPopup = window.open(url, name, options);
            const interval = setInterval(() => {
                if (oauthPopup?.closed) {
                    clearInterval(interval);
                    const popupError = Store_1.default.items.popupError;
                    if (popupError)
                        return reject(Object.assign(new Error(popupError.message ?? "Internal Server Error"), { code: popupError.code }));
                    resolve();
                }
            }, 100);
        });
    }
});
define("model/Session", ["require", "exports", "endpoint/auth/EndpointAuthRemove", "endpoint/session/EndpointSessionGet", "endpoint/session/EndpointSessionReset", "utility/Popup", "utility/State", "utility/Store"], function (require, exports, EndpointAuthRemove_1, EndpointSessionGet_1, EndpointSessionReset_1, Popup_1, State_7, Store_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    EndpointAuthRemove_1 = __importDefault(EndpointAuthRemove_1);
    EndpointSessionGet_1 = __importDefault(EndpointSessionGet_1);
    EndpointSessionReset_1 = __importDefault(EndpointSessionReset_1);
    Popup_1 = __importDefault(Popup_1);
    State_7 = __importDefault(State_7);
    Store_2 = __importDefault(Store_2);
    var Session;
    (function (Session) {
        async function refresh() {
            const session = await EndpointSessionGet_1.default.query();
            const stateToken = session.headers.get("State-Token");
            if (stateToken)
                Store_2.default.items.stateToken = stateToken;
            Store_2.default.items.session = session?.data ?? undefined;
            updateState();
        }
        Session.refresh = refresh;
        async function reset() {
            await EndpointSessionReset_1.default.query();
            delete Store_2.default.items.session;
            updateState();
        }
        Session.reset = reset;
        function setAuthor(author) {
            const session = Store_2.default.items.session;
            if (!session)
                return void refresh();
            Store_2.default.items.session = {
                ...session,
                author: {
                    ...author,
                    authorisations: undefined,
                },
                authorisations: author.authorisations ?? session.authorisations,
            };
            updateState();
        }
        Session.setAuthor = setAuthor;
        function updateState() {
            Auth.state.value = Store_2.default.items.session?.author ? "logged-in" : Store_2.default.items.session?.authorisations?.length ? "has-authorisations" : "none";
            Auth.authorisations.value = Store_2.default.items.session?.authorisations ?? [];
            Auth.author.value = Store_2.default.items.session?.author ?? undefined;
        }
        function getStateToken() {
            return Store_2.default.items.stateToken;
        }
        Session.getStateToken = getStateToken;
        let Auth;
        (function (Auth) {
            Auth.state = (0, State_7.default)("none");
            Auth.authorisations = (0, State_7.default)([]);
            Auth.author = (0, State_7.default)(undefined, (a, b) => a?.vanity === b?.vanity);
            function getAll() {
                return Store_2.default.items.session?.authorisations ?? [];
            }
            Auth.getAll = getAll;
            function get(service) {
                return Store_2.default.items.session?.authorisations?.find(auth => auth.service === service);
            }
            Auth.get = get;
            async function unauth(authOrId) {
                const id = typeof authOrId === "string" ? authOrId : authOrId.id;
                await EndpointAuthRemove_1.default.query({ body: { id } });
                const session = Store_2.default.items.session;
                if (session?.authorisations) {
                    let authorisations = session.authorisations.filter(auth => auth.id !== id);
                    if (!authorisations.length)
                        authorisations = null;
                    Store_2.default.items.session = {
                        ...session,
                        authorisations,
                    };
                }
                updateState();
            }
            Auth.unauth = unauth;
            async function auth(service) {
                await (0, Popup_1.default)(`Login Using ${service.name}`, service.url_begin, 600, 900)
                    .then(() => true).catch(err => { console.warn(err); return false; });
                await Session.refresh();
            }
            Auth.auth = auth;
        })(Auth = Session.Auth || (Session.Auth = {}));
    })(Session || (Session = {}));
    Object.assign(window, { Session });
    exports.default = Session;
});
define("navigation/Route", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function Route(path, route) {
        const segments = (path.startsWith("/") ? path.slice(1) : path).split("/");
        const varGroups = [];
        let regexString = "^";
        for (const segment of segments) {
            regexString += "/+";
            if (segment[0] !== "$") {
                regexString += segment;
                continue;
            }
            if (segment[1] === "$") {
                varGroups.push(segment.slice(2));
                regexString += "(.*)";
                continue;
            }
            varGroups.push(segment.slice(1));
            regexString += "([^/]+)";
        }
        regexString += "$";
        const regex = new RegExp(regexString);
        const rawRoutePath = path;
        return {
            path,
            ...typeof route === "function" ? { handler: route } : route,
            match: path => {
                const match = path.match(regex);
                if (!match)
                    return undefined;
                const params = {};
                for (let i = 0; i < varGroups.length; i++) {
                    const groupName = varGroups[i];
                    const group = match[i + 1];
                    if (group === undefined) {
                        console.warn(`${rawRoutePath} matched, but $${groupName} was unset`);
                        return undefined;
                    }
                    params[groupName] = group;
                }
                return params;
            },
        };
    }
    exports.default = Route;
});
define("endpoint/author/EndpointAuthorDelete", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_4 = __importDefault(Endpoint_4);
    exports.default = (0, Endpoint_4.default)("/author/delete", "post");
});
define("ui/component/core/ActionRow", ["require", "exports", "ui/Component"], function (require, exports, Component_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Component_1 = __importDefault(Component_1);
    const ActionRow = Component_1.default.Builder((row) => {
        row.style("action-row");
        return row
            .extend(row => ({
            left: undefined,
            middle: undefined,
            right: undefined,
        }))
            .extendJIT("left", row => (0, Component_1.default)()
            .style("action-row-left")
            .appendTo(row))
            .extendJIT("middle", row => (0, Component_1.default)()
            .style("action-row-middle")
            .appendTo(row))
            .extendJIT("right", row => (0, Component_1.default)()
            .style("action-row-right")
            .appendTo(row));
    });
    exports.default = ActionRow;
});
define("ui/component/core/Button", ["require", "exports", "ui/Component"], function (require, exports, Component_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Component_2 = __importDefault(Component_2);
    const Button = Component_2.default.Builder("button", (button) => {
        const disabledReasons = new Set();
        return button
            .attributes.set("type", "button")
            .style("button")
            .extend(button => ({
            textWrapper: undefined,
            type: Object.assign((...types) => {
                for (const type of types)
                    button.style(`button-type-${type}`);
                return button;
            }, {
                remove(...types) {
                    for (const type of types)
                        button.style.remove(`button-type-${type}`);
                    return button;
                },
            }),
            setDisabled(disabled, reason) {
                if (disabled)
                    disabledReasons.add(reason);
                else
                    disabledReasons.delete(reason);
                button.style.toggle(!!disabledReasons.size, "button--disabled");
                return button;
            },
        }))
            .extendJIT("textWrapper", button => (0, Component_2.default)()
            .style("button-text")
            .appendTo(button));
    });
    exports.default = Button;
});
define("ui/component/core/Form", ["require", "exports", "ui/Component", "ui/component/core/ActionRow", "ui/component/core/Button"], function (require, exports, Component_3, ActionRow_1, Button_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Component_3 = __importDefault(Component_3);
    ActionRow_1 = __importDefault(ActionRow_1);
    Button_1 = __importDefault(Button_1);
    const Form = Component_3.default.Builder((form, label) => {
        form.replaceElement("form")
            .style("form")
            .ariaRole("form")
            .ariaLabelledBy(label);
        const content = (0, Component_3.default)()
            .style("form-content");
        const footer = (0, ActionRow_1.default)()
            .style("form-footer");
        return form
            .append(content, footer)
            .extend(() => ({
            content, footer,
            submit: undefined,
        }))
            .extendJIT("submit", () => (0, Button_1.default)()
            .style("form-submit")
            .attributes.set("type", "submit")
            .appendTo(footer.right));
    });
    exports.default = Form;
});
define("ui/component/core/Slot", ["require", "exports", "ui/Component"], function (require, exports, Component_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Component_4 = __importDefault(Component_4);
    const Slot = Component_4.default.Builder((slot) => {
        slot.style("slot");
        let cleanup;
        return slot.extend(slot => ({
            use: (state, initialiser) => {
                state.use(slot, value => {
                    cleanup?.();
                    slot.removeContents();
                    cleanup = initialiser(slot, value) ?? undefined;
                });
                return slot;
            },
        }));
    });
    exports.default = Slot;
});
define("endpoint/author/EndpointAuthorCreate", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_5 = __importDefault(Endpoint_5);
    exports.default = (0, Endpoint_5.default)("/author/create", "post")
        .acceptJSON();
});
define("endpoint/author/EndpointAuthorUpdate", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_6) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_6 = __importDefault(Endpoint_6);
    exports.default = (0, Endpoint_6.default)("/author/update", "post")
        .acceptJSON();
});
define("ui/component/core/Heading", ["require", "exports", "ui/Component"], function (require, exports, Component_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Component_5 = __importDefault(Component_5);
    const Heading = Component_5.default.Builder("h1", (component) => {
        component.style("heading");
        component.text.state.use(component, text => component.setId(text.toString().toLowerCase().replace(/\W+/g, "-")));
        component.tabIndex("programmatic");
        component.receiveAncestorInsertEvents();
        component.event.subscribe(["insert", "ancestorInsert"], updateHeadingLevel);
        component.rooted.subscribeManual(updateHeadingLevel);
        let initial = true;
        return component.extend(heading => ({
            updateLevel: () => {
                updateHeadingLevel();
                return heading;
            },
        }));
        function updateHeadingLevel() {
            const headingLevel = computeHeadingLevel(component.element);
            const isSameLevel = component.element.tagName === headingLevel.toUpperCase();
            if (isSameLevel && !initial)
                return;
            initial = false;
            const oldLevel = getHeadingLevel(component.element.tagName);
            if (oldLevel)
                component.style.remove(`heading-${oldLevel}`);
            const newLevel = getHeadingLevel(headingLevel);
            if (newLevel)
                component.style(`heading-${newLevel}`);
            if (isSameLevel)
                return;
            component.event.unsubscribe(["insert", "ancestorInsert"], updateHeadingLevel);
            component.replaceElement(headingLevel);
            component.event.subscribe(["insert", "ancestorInsert"], updateHeadingLevel);
        }
    });
    function getHeadingLevel(tagName) {
        return `${+tagName.slice(1) || ""}`;
    }
    function computeHeadingLevel(node) {
        let currentNode = node;
        let incrementHeading = false;
        while (currentNode) {
            const heading = getPreviousSiblingHeading(currentNode);
            if (heading) {
                const level = +heading.tagName.slice(1);
                if (!incrementHeading)
                    return `h${level}`;
                if (level >= 6)
                    return "span";
                return `h${level + 1}`;
            }
            currentNode = currentNode.parentNode ?? undefined;
            incrementHeading ||= true;
        }
        return "h1";
    }
    function getPreviousSiblingHeading(node) {
        let sibling = node;
        while (sibling) {
            sibling = sibling.previousSibling ?? undefined;
            if (sibling?.nodeType !== Node.ELEMENT_NODE)
                continue;
            const siblingElement = sibling;
            if (siblingElement.tagName[0] === "H" && siblingElement.tagName.length === 2 && !isNaN(+siblingElement.tagName[1]))
                return siblingElement;
        }
    }
    exports.default = Heading;
});
define("ui/component/core/Paragraph", ["require", "exports", "ui/Component"], function (require, exports, Component_6) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Component_6 = __importDefault(Component_6);
    const Paragraph = Component_6.default.Builder(component => component
        .style("paragraph"));
    exports.default = Paragraph;
});
define("ui/view/component/ViewTransition", ["require", "exports", "ui/Component", "utility/Arrays"], function (require, exports, Component_7, Arrays_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Component_7 = __importDefault(Component_7);
    Arrays_2 = __importDefault(Arrays_2);
    var ViewTransition;
    (function (ViewTransition) {
        const DATA_HAS_ID = "has-view-transition";
        const DATA_HAS_SUBVIEW_ID = "has-subview-transition";
        const DATA_ID = "view-transition-id";
        const VIEW_TRANSITION_CLASS_VIEW_PREFIX = "view-transition-";
        const VIEW_TRANSITION_CLASS_SUBVIEW = "subview-transition";
        const VIEW_TRANSITION_CLASS_COUNT = 40;
        const PADDING = 100;
        let id = 0;
        ViewTransition.Has = Component_7.default.Builder(component => {
            component.element.setAttribute(`data-${DATA_HAS_ID}`, "");
            component.and(ViewTransition.HasSubview);
            return component;
        });
        ViewTransition.HasSubview = Component_7.default.Builder(component => {
            component.element.setAttribute(`data-${DATA_HAS_SUBVIEW_ID}`, "");
            component.element.setAttribute(`data-${DATA_ID}`, `${id++}`);
            return component;
        });
        function perform(type, swap) {
            reapply(type);
            return document.startViewTransition(async () => {
                await swap();
                reapply(type);
            });
        }
        ViewTransition.perform = perform;
        function reapply(type) {
            let components = getComponents(type);
            for (const component of components) {
                for (const prefix of [VIEW_TRANSITION_CLASS_VIEW_PREFIX])
                    for (let i = 0; i < VIEW_TRANSITION_CLASS_COUNT; i++)
                        component.classes.remove(`${prefix}${i}`);
                component.classes.remove(VIEW_TRANSITION_CLASS_SUBVIEW);
                component.element.style.removeProperty("view-transition-name");
            }
            components = components.filter(isInView);
            let i = 0;
            if (type === "view")
                for (const component of components)
                    component.classes.add(`${VIEW_TRANSITION_CLASS_VIEW_PREFIX}${i++}`);
            else
                for (const component of components) {
                    component.classes.add(VIEW_TRANSITION_CLASS_SUBVIEW);
                    const id = +component.element.getAttribute(`data-${DATA_ID}`) || 0;
                    component.element.style.viewTransitionName = `${VIEW_TRANSITION_CLASS_SUBVIEW}-${id}`;
                }
        }
        ViewTransition.reapply = reapply;
        function isInView(component) {
            const rect = component.element.getBoundingClientRect();
            return true
                && rect.bottom > -PADDING && rect.top < window.innerHeight + PADDING
                && rect.right > -PADDING && rect.left < window.innerWidth + PADDING;
        }
        function getComponents(type) {
            return [...document.querySelectorAll(`[data-${type === "view" ? DATA_HAS_ID : DATA_HAS_SUBVIEW_ID}]`)]
                .map(e => e.component)
                .filter(Arrays_2.default.filterNullish);
        }
    })(ViewTransition || (ViewTransition = {}));
    exports.default = ViewTransition;
});
define("ui/component/core/Block", ["require", "exports", "ui/Component", "ui/component/core/Heading", "ui/component/core/Paragraph", "ui/view/component/ViewTransition"], function (require, exports, Component_8, Heading_1, Paragraph_1, ViewTransition_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Component_8 = __importDefault(Component_8);
    Heading_1 = __importDefault(Heading_1);
    Paragraph_1 = __importDefault(Paragraph_1);
    ViewTransition_1 = __importDefault(ViewTransition_1);
    const Block = Component_8.default.Builder((component) => {
        return component
            .and(ViewTransition_1.default.Has)
            .style("block")
            .extend(() => ({
            title: undefined,
            header: undefined,
            description: undefined,
        }))
            .extendJIT("header", block => (0, Component_8.default)().style("block-header").prependTo(block))
            .extendJIT("title", block => (0, Heading_1.default)().style("block-title").prependTo(block.header))
            .extendJIT("description", block => (0, Paragraph_1.default)().style("block-description").appendTo(block.header));
    });
    exports.default = Block;
});
define("ui/component/core/extension/Input", ["require", "exports", "ui/Component", "utility/State"], function (require, exports, Component_9, State_8) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Component_9 = __importDefault(Component_9);
    State_8 = __importDefault(State_8);
    const Input = Component_9.default.Extension((component) => {
        return component.extend(component => ({
            required: (0, State_8.default)(false),
            setRequired: (required = true) => {
                component.attributes.toggle(required, "required");
                component.required.value = required;
                return component;
            },
            setLabel: label => {
                component.setName(label?.for);
                component.setId(label?.for);
                label?.setInput(component);
                return component;
            },
        }));
    });
    exports.default = Input;
});
define("ui/component/core/Label", ["require", "exports", "ui/Component", "utility/State"], function (require, exports, Component_10, State_9) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AutoLabel = void 0;
    Component_10 = __importDefault(Component_10);
    State_9 = __importDefault(State_9);
    const Label = Component_10.default.Builder("label", (label) => {
        label.style("label");
        let requiredState;
        return label
            .extend(label => ({
            for: (0, State_9.default)(undefined),
            setFor: inputName => {
                label.attributes.set("for", inputName);
                label.for.value = inputName;
                return label;
            },
            setRequired: (required = true) => {
                label.style.unbind(requiredState);
                requiredState = undefined;
                if (typeof required === "boolean")
                    label.style.toggle("label-required");
                else
                    label.style.bind(requiredState = required, "label-required");
                return label;
            },
            setInput: input => {
                if (!label.is(exports.AutoLabel))
                    label.setFor(input?.name.value);
                label.setRequired(input?.required);
                return label;
            },
        }));
    });
    exports.default = Label;
    let globalI = 0;
    exports.AutoLabel = Component_10.default.Builder("label", (component) => {
        const label = component.and(Label);
        const i = globalI++;
        label.text.state.use(label, text => label.setFor(`${text.toString().toLowerCase().replace(/\W+/g, "-")}-${i}`));
        return label.extend(label => ({}));
    });
});
define("ui/component/core/LabelledRow", ["require", "exports", "ui/Component", "ui/component/core/Label", "ui/view/component/ViewTransition"], function (require, exports, Component_11, Label_1, ViewTransition_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Component_11 = __importDefault(Component_11);
    ViewTransition_2 = __importDefault(ViewTransition_2);
    const LabelledRow = Component_11.default.Builder((row) => {
        row.style("labelled-row");
        row.and(ViewTransition_2.default.HasSubview);
        let label = (0, Label_1.AutoLabel)().style("labelled-row-label").appendTo(row);
        let content = (0, Component_11.default)().style("labelled-row-content").appendTo(row);
        return row
            .extend(row => ({
            label, content,
        }))
            .extendMagic("label", row => ({
            get: () => label,
            set: newLabel => {
                if (label === newLabel)
                    return;
                label.element.replaceWith(newLabel.element);
                label = newLabel;
            },
        }))
            .extendMagic("content", row => ({
            get: () => content,
            set: newContent => {
                if (content === newContent)
                    return;
                content.element.replaceWith(newContent.element);
                content = newContent;
            },
        }));
    });
    exports.default = LabelledRow;
});
define("ui/component/core/LabelledTable", ["require", "exports", "ui/Component", "ui/component/core/LabelledRow"], function (require, exports, Component_12, LabelledRow_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Component_12 = __importDefault(Component_12);
    LabelledRow_1 = __importDefault(LabelledRow_1);
    const LabelledTable = Component_12.default.Builder((table) => {
        table.style("labelled-table");
        let labelInitialiser;
        let factory;
        return table.extend(table => ({
            label: initialiser => {
                labelInitialiser = initialiser;
                return factory ??= {
                    content: contentInitialiser => {
                        const row = (0, LabelledRow_1.default)()
                            .style("labelled-row--in-labelled-table")
                            .appendTo(table);
                        row.label = labelInitialiser(row.label, row);
                        row.content = contentInitialiser(row.content, row.label, row) ?? row.content;
                        labelInitialiser = undefined;
                        return table;
                    },
                };
            },
        }));
    });
    exports.default = LabelledTable;
});
define("ui/utility/StringApplicator", ["require", "exports", "lang/en-nz", "utility/State"], function (require, exports, en_nz_3, State_10) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    en_nz_3 = __importDefault(en_nz_3);
    State_10 = __importDefault(State_10);
    function StringApplicator(host, defaultValueOrApply, apply) {
        const defaultValue = !apply ? undefined : defaultValueOrApply;
        apply ??= defaultValueOrApply;
        let translationHandler;
        let unbind;
        const result = {
            state: (0, State_10.default)(defaultValue),
            set: value => {
                unbind?.();
                translationHandler = undefined;
                setInternal(value);
                return host;
            },
            use: translation => {
                unbind?.();
                if (typeof translation === "string") {
                    translationHandler = undefined;
                    setInternal(en_nz_3.default[translation]().toString());
                    return host;
                }
                translationHandler = translation;
                result.refresh();
                return host;
            },
            bind: state => {
                translationHandler = undefined;
                unbind?.();
                unbind = state?.use(host, setInternal);
                if (!state)
                    setInternal(defaultValue);
                return host;
            },
            unbind: () => {
                unbind?.();
                setInternal(defaultValue);
                return host;
            },
            refresh: () => {
                if (!translationHandler)
                    return;
                setInternal(translationHandler(en_nz_3.default).toString());
            },
        };
        return result;
        function setInternal(value) {
            if (result.state.value !== value) {
                result.state.value = value;
                apply(value);
            }
        }
    }
    exports.default = StringApplicator;
});
define("ui/component/core/TextInput", ["require", "exports", "ui/Component", "ui/component/core/extension/Input", "ui/utility/StringApplicator", "utility/State"], function (require, exports, Component_13, Input_1, StringApplicator_1, State_11) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Component_13 = __importDefault(Component_13);
    Input_1 = __importDefault(Input_1);
    StringApplicator_1 = __importDefault(StringApplicator_1);
    State_11 = __importDefault(State_11);
    const TextInput = Component_13.default.Builder("input", (component) => {
        let shouldIgnoreInputEvent = false;
        let filterFunction;
        const input = component
            .and(Input_1.default)
            .style("text-input")
            .attributes.set("type", "text")
            .extend(input => ({
            value: "",
            state: (0, State_11.default)(""),
            default: (0, StringApplicator_1.default)(input, value => {
                if (input.value === "") {
                    input.value = value ?? "";
                    input.state.value = value ?? "";
                }
            }),
            placeholder: (0, StringApplicator_1.default)(input, value => {
                input.attributes.set("placeholder", value);
            }),
            ignoreInputEvent: (ignore = true) => {
                shouldIgnoreInputEvent = ignore;
                return input;
            },
            filter: filter => {
                filterFunction = filter;
                return input;
            },
        }))
            .extendMagic("value", input => ({
            get: () => input.element.value || "",
            set: (value) => {
                input.element.value = value;
                input.state.value = value;
            },
        }));
        input.event.subscribe(["input", "change"], event => {
            const element = input.element.asType("input");
            if (filterFunction && element) {
                if (event.type === "change") {
                    input.value = filterFunction(input.value, "", true);
                }
                else {
                    let { selectionStart, selectionEnd, value } = element;
                    const hasSelection = selectionStart !== null || selectionEnd !== null;
                    selectionStart ??= value.length;
                    selectionEnd ??= value.length;
                    const beforeSelection = filterFunction(value.slice(0, selectionStart), "", false);
                    const selection = filterFunction(value.slice(selectionStart, selectionEnd), beforeSelection, false);
                    const afterSelection = filterFunction(value.slice(selectionEnd), selection || beforeSelection, false);
                    input.value = beforeSelection + selection + afterSelection;
                    if (hasSelection)
                        element.setSelectionRange(beforeSelection.length, beforeSelection.length + selection.length);
                }
            }
            if (shouldIgnoreInputEvent)
                return;
            input.state.value = input.value;
        });
        return input;
    });
    exports.default = TextInput;
});
define("ui/view/account/AccountViewForm", ["require", "exports", "endpoint/author/EndpointAuthorCreate", "endpoint/author/EndpointAuthorUpdate", "model/Session", "ui/Component", "ui/component/core/Block", "ui/component/core/Form", "ui/component/core/LabelledTable", "ui/component/core/TextInput"], function (require, exports, EndpointAuthorCreate_1, EndpointAuthorUpdate_1, Session_1, Component_14, Block_1, Form_1, LabelledTable_1, TextInput_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    EndpointAuthorCreate_1 = __importDefault(EndpointAuthorCreate_1);
    EndpointAuthorUpdate_1 = __importDefault(EndpointAuthorUpdate_1);
    Session_1 = __importDefault(Session_1);
    Component_14 = __importDefault(Component_14);
    Block_1 = __importDefault(Block_1);
    Form_1 = __importDefault(Form_1);
    LabelledTable_1 = __importDefault(LabelledTable_1);
    TextInput_1 = __importDefault(TextInput_1);
    exports.default = Component_14.default.Builder((component, type) => {
        const block = component.and(Block_1.default);
        const form = block.and(Form_1.default, block.title);
        form.title.text.use(`view/account/${type}/title`);
        if (type === "create")
            form.description.text.use("view/account/create/description");
        form.submit.textWrapper.text.use(`view/account/${type}/submit`);
        const table = (0, LabelledTable_1.default)().appendTo(form.content);
        const nameInput = (0, TextInput_1.default)()
            .setRequired()
            .default.bind(Session_1.default.Auth.author.map(author => author?.name));
        table.label(label => label.text.use("view/account/form/name/label"))
            .content((content, label) => content.append(nameInput.setLabel(label)));
        const vanityInput = (0, TextInput_1.default)()
            .placeholder.bind(nameInput.state
            .map(name => filterVanity(name)))
            .default.bind(Session_1.default.Auth.author.map(author => author?.vanity))
            .filter(filterVanity);
        table.label(label => label.text.use("view/account/form/vanity/label"))
            .content((content, label) => content.append(vanityInput.setLabel(label)));
        const descriptionInput = (0, TextInput_1.default)();
        table.label(label => label.text.use("view/account/form/description/label"))
            .content((content, label) => content.append(descriptionInput.setLabel(label)));
        form.event.subscribe("submit", async (event) => {
            event.preventDefault();
            const response = await (type === "create" ? EndpointAuthorCreate_1.default : EndpointAuthorUpdate_1.default).query({
                body: {
                    name: nameInput.value,
                    vanity: vanityInput.value,
                    description: descriptionInput.value,
                },
            });
            if (response instanceof Error) {
                console.error(response);
                return;
            }
            Session_1.default.setAuthor(response.data);
        });
        return form;
        function filterVanity(vanity, textBefore = "", isFullText = true) {
            vanity = vanity.replace(/[\W_]+/g, "-");
            if (isFullText)
                vanity = vanity.replace(/^-|-$/g, "");
            if (textBefore.endsWith("-") && vanity.startsWith("-"))
                return vanity.slice(1);
            return vanity;
        }
    });
});
define("endpoint/auth/EndpointAuthServices", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_7) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_7 = __importDefault(Endpoint_7);
    exports.default = (0, Endpoint_7.default)("/auth/services", "get");
});
define("ui/component/core/Checkbutton", ["require", "exports", "ui/Component", "ui/component/core/Button", "utility/State"], function (require, exports, Component_15, Button_2, State_12) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Component_15 = __importDefault(Component_15);
    Button_2 = __importDefault(Button_2);
    State_12 = __importDefault(State_12);
    const Checkbutton = Component_15.default.Builder("label", (component) => {
        const input = (0, Component_15.default)("input")
            .style("checkbutton-input")
            .attributes.set("type", "checkbox");
        const inputElement = input.element;
        const state = (0, State_12.default)(false);
        let unuse;
        const checkbutton = component
            .and(Button_2.default)
            .style("checkbutton")
            .tabIndex("auto")
            .ariaChecked(state)
            .ariaRole("checkbox")
            .append(input)
            .extend(() => ({
            checked: state,
            isChecked: () => inputElement.checked,
            setChecked: (checked) => {
                if (checked === inputElement.checked)
                    return checkbutton;
                if (unuse) {
                    checkbutton.event.emit("trySetChecked", checked);
                    return checkbutton;
                }
                inputElement.checked = checked;
                onChange();
                return checkbutton;
            },
            use: (sourceState) => {
                unuse = sourceState.use(checkbutton, checked => {
                    if (inputElement.checked === checked)
                        return;
                    inputElement.checked = checked;
                    onChange();
                });
                return checkbutton;
            },
            unuse: () => {
                unuse?.();
                unuse = undefined;
                return checkbutton;
            },
        }));
        input.event.subscribe("change", () => {
            if (unuse) {
                const checked = inputElement.checked;
                inputElement.checked = !checked; // undo because it's managed by a State<boolean>
                checkbutton.event.emit("trySetChecked", checked);
                return;
            }
            onChange();
        });
        function onChange() {
            state.value = inputElement.checked;
            checkbutton.style.toggle(inputElement.checked, "checkbutton--checked");
            checkbutton.event.emit("setChecked", inputElement.checked);
        }
        return checkbutton;
    });
    exports.default = Checkbutton;
});
define("ui/view/account/AccountViewOAuthService", ["require", "exports", "model/Session", "ui/Component", "ui/component/core/Checkbutton", "utility/State"], function (require, exports, Session_2, Component_16, Checkbutton_1, State_13) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Session_2 = __importDefault(Session_2);
    Component_16 = __importDefault(Component_16);
    Checkbutton_1 = __importDefault(Checkbutton_1);
    State_13 = __importDefault(State_13);
    exports.default = Component_16.default.Builder((component, service) => {
        const authedAtStart = !!Session_2.default.Auth.get(service.name);
        const authorisationState = State_13.default.Map(Session_2.default.Auth.authorisations, authorisations => authorisations.find(authorisation => authorisation.service === service.name));
        const isAuthed = State_13.default.Truthy(authorisationState);
        const button = component
            .and(Checkbutton_1.default)
            .setChecked(authedAtStart)
            .style("account-view-oauth-service")
            .ariaRole("button")
            .style.bind(isAuthed, "account-view-oauth-service--authenticated")
            .style.setVariable("colour", `#${service.colour.toString(16)}`)
            .append((0, Component_16.default)("img")
            .style("account-view-oauth-service-icon")
            .attributes.set("src", service.icon))
            .append((0, Component_16.default)()
            .style("account-view-oauth-service-name")
            .text.set(service.name));
        (0, Component_16.default)()
            .style("account-view-oauth-service-state")
            .style.bind(isAuthed, "account-view-oauth-service-state--authenticated")
            .style.bind(button.hoveredOrFocused, "account-view-oauth-service-state--focus")
            .appendTo((0, Component_16.default)()
            .style("account-view-oauth-service-state-wrapper")
            .style.bind(button.hoveredOrFocused, "account-view-oauth-service-state-wrapper--focus")
            .appendTo(button));
        const username = (0, Component_16.default)()
            .style("account-view-oauth-service-username")
            .style.bind(isAuthed, "account-view-oauth-service-username--has-username")
            .ariaHidden()
            .appendTo(button);
        authorisationState.use(button, authorisation => {
            button.ariaLabel(quilt => quilt[`view/account/auth/service/accessibility/${authorisation ? "disconnect" : "connect"}`](service.name, authorisation?.display_name));
            username.text.set(authorisation?.display_name ?? "");
        });
        button.event.subscribe("click", async (event) => {
            event.preventDefault();
            let auth = Session_2.default.Auth.get(service.name);
            if (auth)
                await Session_2.default.Auth.unauth(auth.id);
            else
                await Session_2.default.Auth.auth(service);
            auth = Session_2.default.Auth.get(service.name);
            event.component.setChecked(!!auth);
        });
        return button;
    });
});
define("utility/Objects", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Objects;
    (function (Objects) {
        Objects.EMPTY = {};
        function keys(object) {
            return Object.keys(object);
        }
        Objects.keys = keys;
        function values(object) {
            return Object.values(object);
        }
        Objects.values = values;
        function inherit(obj, inherits) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
            Object.setPrototypeOf(obj, inherits.prototype);
            return obj;
        }
        Objects.inherit = inherit;
        function map(object, mapper) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unnecessary-type-assertion
            return Object.fromEntries(Object.entries(object).map(mapper));
        }
        Objects.map = map;
        async function mapAsync(object, mapper) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            return Object.fromEntries(await Promise.all(Object.entries(object).map(mapper)));
        }
        Objects.mapAsync = mapAsync;
        function followPath(obj, keys) {
            for (const key of keys)
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                obj = obj?.[key];
            return obj;
        }
        Objects.followPath = followPath;
        function applyJIT(obj, key, compute) {
            const get = (() => {
                const promise = compute();
                delete obj[key];
                obj[key] = promise;
                if (promise instanceof Promise)
                    void promise.then(value => obj[key] = value);
                return promise;
            });
            get.compute = compute;
            Object.defineProperty(obj, key, {
                configurable: true,
                get,
            });
        }
        Objects.applyJIT = applyJIT;
        function copyJIT(target, from, key) {
            const descriptor = Object.getOwnPropertyDescriptor(from, key);
            if (!descriptor)
                return;
            if ("value" in descriptor) {
                target[key] = from[key];
                return;
            }
            const compute = descriptor.get?.compute;
            if (!compute)
                return;
            applyJIT(target, key, compute);
        }
        Objects.copyJIT = copyJIT;
    })(Objects || (Objects = {}));
    exports.default = Objects;
});
define("ui/view/account/AccountViewOAuthServices", ["require", "exports", "endpoint/auth/EndpointAuthServices", "ui/Component", "ui/component/core/Block", "ui/view/account/AccountViewOAuthService", "ui/view/component/ViewTransition", "utility/Objects"], function (require, exports, EndpointAuthServices_1, Component_17, Block_2, AccountViewOAuthService_1, ViewTransition_3, Objects_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    EndpointAuthServices_1 = __importDefault(EndpointAuthServices_1);
    Component_17 = __importDefault(Component_17);
    Block_2 = __importDefault(Block_2);
    AccountViewOAuthService_1 = __importDefault(AccountViewOAuthService_1);
    ViewTransition_3 = __importDefault(ViewTransition_3);
    Objects_1 = __importDefault(Objects_1);
    const AccountViewOAuthServices = Component_17.default.Builder(async (component, state) => {
        const block = component
            .and(Block_2.default)
            .style("account-view-oauth-service-container");
        block.header.and(ViewTransition_3.default.HasSubview);
        state.use(component, state => {
            block.title.text.use(`view/account/auth/${state}/title`);
            block.description.text.use(`view/account/auth/${state}/description`);
        });
        const list = (0, Component_17.default)()
            .style("account-view-oauth-service-list")
            .appendTo(block);
        const services = await EndpointAuthServices_1.default.query();
        if (services instanceof Error) {
            console.error(services);
            return block;
        }
        for (const service of Objects_1.default.values(services.data))
            (0, AccountViewOAuthService_1.default)(service)
                .appendTo(list);
        return block;
    });
    exports.default = AccountViewOAuthServices;
});
define("ui/view/View", ["require", "exports", "ui/Component"], function (require, exports, Component_18) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Component_18 = __importDefault(Component_18);
    const View = (id) => (0, Component_18.default)()
        .style("view", `view-type-${id}`)
        .extend(view => ({}));
    exports.default = View;
});
define("ui/view/ViewDefinition", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function ViewDefinition(definition) {
        const result = {
            ...definition,
            navigate: (app, params) => app.view.show(result, params),
        };
        return result;
    }
    exports.default = ViewDefinition;
});
define("ui/view/AccountView", ["require", "exports", "endpoint/author/EndpointAuthorDelete", "model/Session", "ui/component/core/ActionRow", "ui/component/core/Button", "ui/component/core/Slot", "ui/view/account/AccountViewForm", "ui/view/account/AccountViewOAuthServices", "ui/view/component/ViewTransition", "ui/view/View", "ui/view/ViewDefinition", "utility/State"], function (require, exports, EndpointAuthorDelete_1, Session_3, ActionRow_2, Button_3, Slot_1, AccountViewForm_1, AccountViewOAuthServices_1, ViewTransition_4, View_1, ViewDefinition_1, State_14) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    EndpointAuthorDelete_1 = __importDefault(EndpointAuthorDelete_1);
    Session_3 = __importDefault(Session_3);
    ActionRow_2 = __importDefault(ActionRow_2);
    Button_3 = __importDefault(Button_3);
    Slot_1 = __importDefault(Slot_1);
    AccountViewForm_1 = __importDefault(AccountViewForm_1);
    AccountViewOAuthServices_1 = __importDefault(AccountViewOAuthServices_1);
    ViewTransition_4 = __importDefault(ViewTransition_4);
    View_1 = __importDefault(View_1);
    ViewDefinition_1 = __importDefault(ViewDefinition_1);
    State_14 = __importDefault(State_14);
    exports.default = (0, ViewDefinition_1.default)({
        create: async () => {
            const view = (0, View_1.default)("account");
            const state = (0, State_14.default)(Session_3.default.Auth.state.value);
            (0, Slot_1.default)()
                .use(state, (slot, state) => { createForm(state)?.appendTo(slot); })
                .appendTo(view);
            const services = await (0, AccountViewOAuthServices_1.default)(state);
            services.appendTo(view);
            (0, Slot_1.default)()
                .use(state, (slot, state) => { createActionRow(state)?.appendTo(slot); })
                .appendTo(view);
            Session_3.default.Auth.state.subscribe(view, () => ViewTransition_4.default.perform("subview", updateAuthState));
            updateAuthState();
            return view;
            function updateAuthState(newState = Session_3.default.Auth.state.value) {
                state.value = newState;
            }
            function createForm(state) {
                switch (state) {
                    case "has-authorisations":
                        return (0, AccountViewForm_1.default)("create");
                    case "logged-in":
                        return (0, AccountViewForm_1.default)("update");
                }
            }
            function createActionRow(state) {
                switch (state) {
                    case "logged-in":
                        return (0, ActionRow_2.default)()
                            .tweak(row => row.right
                            .append((0, Button_3.default)()
                            .text.use("view/account/action/logout")
                            .event.subscribe("click", () => Session_3.default.reset()))
                            .append((0, Button_3.default)()
                            .text.use("view/account/action/delete")
                            .event.subscribe("click", async () => {
                            const response = await EndpointAuthorDelete_1.default.query();
                            if (response instanceof Error) {
                                console.error(response);
                                return;
                            }
                            return Session_3.default.reset();
                        })));
                }
            }
        },
    });
});
define("endpoint/author/EndpointAuthorGet", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_8) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_8 = __importDefault(Endpoint_8);
    exports.default = (0, Endpoint_8.default)("/author/{vanity}/get", "get")
        .acceptJSON();
});
define("ui/component/Author", ["require", "exports", "ui/Component", "ui/component/core/Block"], function (require, exports, Component_19, Block_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Component_19 = __importDefault(Component_19);
    Block_3 = __importDefault(Block_3);
    exports.default = Component_19.default.Builder((component, author) => {
        const block = component.and(Block_3.default);
        block.title.text.set(author.name);
        block.description.text.set(`@${author.vanity}`);
        return block;
    });
});
define("ui/view/AuthorView", ["require", "exports", "endpoint/author/EndpointAuthorGet", "ui/component/Author", "ui/view/View", "ui/view/ViewDefinition"], function (require, exports, EndpointAuthorGet_1, Author_1, View_2, ViewDefinition_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    EndpointAuthorGet_1 = __importDefault(EndpointAuthorGet_1);
    Author_1 = __importDefault(Author_1);
    View_2 = __importDefault(View_2);
    ViewDefinition_2 = __importDefault(ViewDefinition_2);
    exports.default = (0, ViewDefinition_2.default)({
        create: async (params) => {
            const view = (0, View_2.default)("author");
            const author = await EndpointAuthorGet_1.default.query({ params });
            if (author instanceof Error)
                throw author;
            (0, Author_1.default)(author.data)
                .appendTo(view);
            return view;
        },
    });
});
define("ui/view/debug/ButtonRegistry", ["require", "exports", "model/Session", "utility/Env"], function (require, exports, Session_4, Env_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BUTTON_REGISTRY = void 0;
    Session_4 = __importDefault(Session_4);
    Env_2 = __importDefault(Env_2);
    exports.BUTTON_REGISTRY = {
        createAuthor: {
            name: "Create Author",
            async execute(name, vanity) {
                const response = await fetch(`${Env_2.default.API_ORIGIN}author/create`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                    },
                    body: JSON.stringify({
                        name: name,
                        vanity: vanity,
                    }),
                }).then(response => response.json());
                console.log(response);
                await Session_4.default.refresh();
            },
        },
        updateAuthor: {
            name: "Update Author",
            async execute(name, description, vanity, support_link, support_message) {
                await fetch(`${Env_2.default.API_ORIGIN}author/update`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Accept": "application/json",
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        name: name,
                        description: description,
                        vanity: vanity,
                        support_link: support_link,
                        support_message: support_message,
                    }),
                });
            },
        },
        deleteAuthor: {
            name: "Delete Author",
            async execute() {
                await fetch(`${Env_2.default.API_ORIGIN}author/delete`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });
            },
        },
        viewAuthor: {
            name: "View Author",
            async execute(label, vanity) {
                const response = await fetch(`${Env_2.default.API_ORIGIN}author/${vanity}/get`, {
                    credentials: "include",
                }).then(response => response.json());
                console.log(label, response);
            },
        },
        clearSession: {
            name: "Clear Session",
            async execute() {
                await fetch(`${Env_2.default.API_ORIGIN}session/reset`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Accept": "application/json",
                        "Content-Type": "application/json",
                    },
                });
                await Session_4.default.refresh();
            },
        },
        createWork: {
            name: "Create Work",
            async execute(name, description, vanity, status, visibility, globalTags, customTags) {
                await fetch(`${Env_2.default.API_ORIGIN}work/create`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        name: name,
                        description: description,
                        vanity: vanity,
                        status: status,
                        visibility: visibility,
                        global_tags: globalTags,
                        custom_tags: customTags,
                    }),
                });
            },
        },
        updateWork: {
            name: "Update Work",
            async execute(author, url, name, description, vanity, status, visibility) {
                await fetch(`${Env_2.default.API_ORIGIN}work/${author}/${url}/update`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        name: name,
                        description: description,
                        vanity: vanity,
                        status: status,
                        visibility: visibility,
                    }),
                });
            },
        },
        deleteWork: {
            name: "Delete Work",
            async execute(author, url) {
                await fetch(`${Env_2.default.API_ORIGIN}work/${author}/${url}/delete`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });
            },
        },
        viewWork: {
            name: "View Work",
            async execute(label, author, url) {
                const response = await fetch(`${Env_2.default.API_ORIGIN}work/${author}/${url}/get`, {
                    credentials: "include",
                }).then(response => response.json());
                console.log(label, response);
            },
        },
        createChapter: {
            name: "Create Chapter",
            async execute(author, work_url, name, body, visibility) {
                const response = await fetch(`${Env_2.default.API_ORIGIN}work/${author}/${work_url}/chapter/create`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        name: name,
                        body: body,
                        visibility: visibility,
                    }),
                }).then(response => response.json());
                console.log(response);
            },
        },
        updateChapter: {
            name: "Update Chapter",
            async execute(author, work_url, index, name, body, visibility) {
                await fetch(`${Env_2.default.API_ORIGIN}work/${author}/${work_url}/chapter/${index}/update`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        name,
                        body,
                        visibility,
                    }),
                });
            },
        },
        deleteChapter: {
            name: "Delete Chapter",
            async execute(author, work_url, index) {
                await fetch(`${Env_2.default.API_ORIGIN}work/${author}/${work_url}/chapter/${index}/delete`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });
            },
        },
        viewChapter: {
            name: "View Chapter",
            async execute(label, author, work_url, index) {
                const response = await fetch(`${Env_2.default.API_ORIGIN}work/${author}/${work_url}/chapter/${index}/get`, {
                    credentials: "include",
                }).then(response => response.json());
                console.log(label, response);
            },
        },
        follow: {
            name: "Follow",
            async execute(type, vanity) {
                await fetch(`${Env_2.default.API_ORIGIN}follow/${type}/${vanity}`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });
            },
        },
        followWork: {
            name: "Follow",
            async execute(author_vanity, work_vanity) {
                await fetch(`${Env_2.default.API_ORIGIN}follow/work/${author_vanity}/${work_vanity}`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });
            },
        },
        unfollow: {
            name: "Unfollow",
            async execute(type, vanity) {
                await fetch(`${Env_2.default.API_ORIGIN}unfollow/${type}/${vanity}`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });
            },
        },
        unfollowWork: {
            name: "Unfollow",
            async execute(author_vanity, work_vanity) {
                await fetch(`${Env_2.default.API_ORIGIN}unfollow/work/${author_vanity}/${work_vanity}`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });
            },
        },
        getFollow: {
            name: "Get Follow",
            async execute(type, vanity) {
                const response = await fetch(`${Env_2.default.API_ORIGIN}follows/${type}/${vanity}`, {
                    credentials: "include",
                }).then(response => response.json());
                console.log(response);
            },
        },
        getFollowWork: {
            name: "Get Follow",
            async execute(author_vanity, work_vanity) {
                const response = await fetch(`${Env_2.default.API_ORIGIN}follows/work/${author_vanity}/${work_vanity}`, {
                    credentials: "include",
                }).then(response => response.json());
                console.log(response);
            },
        },
        getAllFollows: {
            name: "Get All Follows",
            async execute(type, page = 0) {
                const response = await fetch(`${Env_2.default.API_ORIGIN}following/${type}?page=${page}`, {
                    credentials: "include",
                }).then(response => response.json());
                console.log(response);
            },
        },
        getAllFollowsMerged: {
            name: "Get All Follows Merged",
            async execute(page = 0) {
                const response = await fetch(`${Env_2.default.API_ORIGIN}following?page=${page}`, {
                    credentials: "include",
                }).then(response => response.json());
                console.log(response);
            },
        },
        ignore: {
            name: "Ignore",
            async execute(type, vanity) {
                await fetch(`${Env_2.default.API_ORIGIN}ignore/${type}/${vanity}`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });
            },
        },
        ignoreWork: {
            name: "Ignore",
            async execute(author_vanity, work_vanity) {
                await fetch(`${Env_2.default.API_ORIGIN}ignore/work/${author_vanity}/${work_vanity}`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });
            },
        },
        unignore: {
            name: "Unignore",
            async execute(type, vanity) {
                await fetch(`${Env_2.default.API_ORIGIN}unignore/${type}/${vanity}`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });
            },
        },
        unignoreWork: {
            name: "Unignore",
            async execute(author_vanity, work_vanity) {
                await fetch(`${Env_2.default.API_ORIGIN}unignore/work/${author_vanity}/${work_vanity}`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });
            },
        },
        getIgnore: {
            name: "Get Ignore",
            async execute(type, vanity) {
                const response = await fetch(`${Env_2.default.API_ORIGIN}ignores/${type}/${vanity}`, {
                    credentials: "include",
                }).then(response => response.json());
                console.log(response);
            },
        },
        getIgnoreWork: {
            name: "Get Ignore",
            async execute(author_vanity, work_vanity) {
                const response = await fetch(`${Env_2.default.API_ORIGIN}ignores/work/${author_vanity}/${work_vanity}`, {
                    credentials: "include",
                }).then(response => response.json());
                console.log(response);
            },
        },
        getAllIgnores: {
            name: "Get All Ignores",
            async execute(type, page = 0) {
                const response = await fetch(`${Env_2.default.API_ORIGIN}ignoring/${type}?page=${page}`, {
                    credentials: "include",
                }).then(response => response.json());
                console.log(response);
            },
        },
        getAllIgnoresMerged: {
            name: "Get All Ignores Merged",
            async execute(page = 0) {
                const response = await fetch(`${Env_2.default.API_ORIGIN}ignoring?page=${page}`, {
                    credentials: "include",
                }).then(response => response.json());
                console.log(response);
            },
        },
        privilegeGetAllAuthor: {
            name: "Get All Author Privileges",
            async execute(label, vanity) {
                const response = await fetch(`${Env_2.default.API_ORIGIN}privilege/get/${vanity}`, {
                    credentials: "include",
                }).then(response => response.json());
                console.log(label, response);
            },
        },
        privilegeGrantAuthor: {
            name: "Grant Privileges to Author",
            async execute(vanity, ...privileges) {
                const response = await fetch(`${Env_2.default.API_ORIGIN}privilege/grant/author/${vanity}`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        privileges,
                    }),
                }).then(response => response.json());
                console.log("granted privileges", response);
            },
        },
        privilegeRevokeAuthor: {
            name: "Revoke Privileges from Author",
            async execute(vanity, ...privileges) {
                const response = await fetch(`${Env_2.default.API_ORIGIN}privilege/revoke/author/${vanity}`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        privileges,
                    }),
                }).then(response => response.json());
                console.log("revoked privileges", response);
            },
        },
        createRole: {
            name: "Create Role",
            async execute(roleName, visibilty, roleBelow) {
                const response = await fetch(`${Env_2.default.API_ORIGIN}role/create`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        name: roleName,
                        below: roleBelow,
                        description: "idk some test stuff",
                        visibilty: visibilty,
                    }),
                }).then(response => response.json());
                console.log("created role", response);
            },
        },
        deleteRole: {
            name: "Delete Role",
            async execute(vanity) {
                const response = await fetch(`${Env_2.default.API_ORIGIN}role/delete/${vanity}`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }).then(response => response.json());
                console.log("deleted role", response);
            },
        },
        editRole: {
            name: "Edit Role",
            async execute(vanity, name, description) {
                const response = await fetch(`${Env_2.default.API_ORIGIN}role/update/${vanity}`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        name: name,
                        description: description,
                    }),
                }).then(response => response.json());
                console.log("edited role", response);
            },
        },
        grantRoleToAuthor: {
            name: "Grant Role to Author",
            async execute(roleVanity, authorVanity) {
                const response = await fetch(`${Env_2.default.API_ORIGIN}role/grant/${roleVanity}/${authorVanity}`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }).then(response => response.json());
                console.log("granted role", response);
            },
        },
        revokeRoleFromAuthor: {
            name: "Revoke Role from Author",
            async execute(roleVanity, authorVanity) {
                const response = await fetch(`${Env_2.default.API_ORIGIN}role/revoke/${roleVanity}/${authorVanity}`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }).then(response => response.json());
                console.log("granted role", response);
            },
        },
        privilegeGrantRole: {
            name: "Grant Privileges to Role",
            async execute(vanity, ...privileges) {
                const response = await fetch(`${Env_2.default.API_ORIGIN}privilege/grant/role/${vanity}`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        privileges,
                    }),
                }).then(response => response.json());
                console.log("granted privileges to role", response);
            },
        },
        privilegeRevokeRole: {
            name: "Revoke Privileges from Role",
            async execute(vanity, ...privileges) {
                const response = await fetch(`${Env_2.default.API_ORIGIN}privilege/revoke/role/${vanity}`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        privileges,
                    }),
                }).then(response => response.json());
                console.log("revoked privileges from role", response);
            },
        },
        roleListAll: {
            name: "List all roles",
            async execute(label) {
                const response = await fetch(`${Env_2.default.API_ORIGIN}role/get`, {
                    credentials: "include",
                }).then(response => response.json());
                console.log(label, response);
            },
        },
        roleReorder: {
            name: "Reorder roles",
            async execute(...roles) {
                const response = await fetch(`${Env_2.default.API_ORIGIN}role/reorder`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        roles,
                    }),
                }).then(response => response.json());
                console.log("reordered roles", response);
            },
        },
        createCommentChapter: {
            name: "Create Comment Chapter",
            async execute(vanity, index, body, parent_id) {
                await fetch(`${Env_2.default.API_ORIGIN}work/${vanity}/chapter/${index}/comment/add`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        body,
                        parent_id,
                    }),
                });
            },
        },
        updateCommentChapter: {
            name: "Update Comment Chapter",
            async execute(id, comment_body) {
                await fetch(`${Env_2.default.API_ORIGIN}comment/update/chapter`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        comment_id: id,
                        body: comment_body,
                    }),
                });
            },
        },
        deleteCommentChapter: {
            name: "Delete Comment Chapter",
            async execute(id) {
                await fetch(`${Env_2.default.API_ORIGIN}comment/remove/chapter`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        comment_id: id,
                    }),
                });
            },
        },
        getComment: {
            name: "Get Comment",
            async execute(id, label) {
                const response = await fetch(`${Env_2.default.API_ORIGIN}comment/get`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        comment_id: id,
                    }),
                }).then(response => response.json());
                console.log(label, response);
            },
        },
        patreonGetTiers: {
            name: "Get Tiers",
            async execute(label) {
                const response = await fetch(`${Env_2.default.API_ORIGIN}patreon/campaign/tiers/get`, {
                    credentials: "include",
                }).then(response => response.json());
                console.log(label, response);
            },
        },
        patreonSetThresholds: {
            name: "Set Chapter Thresholds",
            async execute(author_vanity, work_vanity, visibility, chapters, tier_id) {
                const response = await fetch(`${Env_2.default.API_ORIGIN}patreon/campaign/tiers/set/${author_vanity}/${work_vanity}`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        visibility: visibility,
                        chapters: chapters,
                        tier_id: tier_id,
                    }),
                }).then(response => response.json());
                console.log(response);
            },
        },
        tagCreateCategory: {
            name: "Tag Create Category",
            async execute(categoryName, categoryDescription) {
                const response = await fetch(`${Env_2.default.API_ORIGIN}tag/create/category`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        name: categoryName,
                        description: categoryDescription,
                    }),
                }).then(response => response.json());
                console.log(response);
            },
        },
        tagCreateGlobal: {
            name: "Tag Create Global",
            async execute(tagName, tagDescription, tagCategory) {
                const response = await fetch(`${Env_2.default.API_ORIGIN}tag/create/global`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        name: tagName,
                        description: tagDescription,
                        category: tagCategory,
                    }),
                }).then(response => response.json());
                console.log(response);
            },
        },
        tagUpdateCategory: {
            name: "Tag Update Category",
            async execute(vanity, categoryName, categoryDescription) {
                const response = await fetch(`${Env_2.default.API_ORIGIN}tag/update/category/${vanity}`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        name: categoryName,
                        description: categoryDescription,
                    }),
                }).then(response => response.json());
                console.log(response);
            },
        },
        tagUpdateGlobal: {
            name: "Tag Update Global",
            async execute(vanity, tagName, tagDescription, tagCategory) {
                const response = await fetch(`${Env_2.default.API_ORIGIN}tag/update/global/${vanity}`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        name: tagName,
                        description: tagDescription,
                        category: tagCategory,
                    }),
                }).then(response => response.json());
                console.log(response);
            },
        },
        tagRemoveCategory: {
            name: "Tag Remove Category",
            async execute(vanity) {
                const response = await fetch(`${Env_2.default.API_ORIGIN}tag/remove/category/${vanity}`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }).then(response => response.json());
                console.log(response);
            },
        },
        tagRemoveGlobal: {
            name: "Tag Remove Global",
            async execute(vanity) {
                const response = await fetch(`${Env_2.default.API_ORIGIN}tag/remove/global/${vanity}`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }).then(response => response.json());
                console.log(response);
            },
        },
        tagGetAll: {
            name: "Tag Get All",
            async execute() {
                const response = await fetch(`${Env_2.default.API_ORIGIN}tag/get/global`, {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }).then(response => response.json());
                console.log(response);
            },
        },
    };
});
define("ui/view/DebugView", ["require", "exports", "endpoint/auth/EndpointAuthServices", "model/Session", "ui/Component", "ui/component/core/Button", "ui/view/debug/ButtonRegistry", "ui/view/View", "ui/view/ViewDefinition", "utility/Env", "utility/Objects", "utility/Popup"], function (require, exports, EndpointAuthServices_2, Session_5, Component_20, Button_4, ButtonRegistry_1, View_3, ViewDefinition_3, Env_3, Objects_2, Popup_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    EndpointAuthServices_2 = __importDefault(EndpointAuthServices_2);
    Session_5 = __importDefault(Session_5);
    Component_20 = __importDefault(Component_20);
    Button_4 = __importDefault(Button_4);
    View_3 = __importDefault(View_3);
    ViewDefinition_3 = __importDefault(ViewDefinition_3);
    Env_3 = __importDefault(Env_3);
    Objects_2 = __importDefault(Objects_2);
    Popup_2 = __importDefault(Popup_2);
    const Block = Component_20.default.Builder(component => component
        .style("debug-block"));
    exports.default = (0, ViewDefinition_3.default)({
        async create() {
            const view = (0, View_3.default)("debug");
            const createButton = (implementation, ...args) => {
                return (0, Button_4.default)()
                    .text.set(implementation.name)
                    .event.subscribe("click", async () => {
                    try {
                        await implementation.execute(...args);
                    }
                    catch (err) {
                        const error = err;
                        console.warn(`Button ${implementation.name} failed to execute:`, error);
                    }
                });
            };
            const oauthDiv = Block().appendTo(view);
            const OAuthServices = await EndpointAuthServices_2.default.query();
            for (const service of Objects_2.default.values(OAuthServices.data ?? {})) {
                if (!service)
                    continue;
                (0, Button_4.default)()
                    .text.set(`OAuth ${service.name}`)
                    .event.subscribe("click", async () => {
                    await (0, Popup_2.default)(`OAuth ${service.name}`, service.url_begin, 600, 900)
                        .then(() => true).catch(err => { console.warn(err); return false; });
                    await Session_5.default.refresh();
                })
                    .appendTo(oauthDiv);
                (0, Button_4.default)()
                    .text.set(`UnOAuth ${service.name}`)
                    .event.subscribe("click", async () => {
                    const id = Session_5.default.Auth.get(service.id)?.id;
                    if (id === undefined)
                        return;
                    await fetch(`${Env_3.default.API_ORIGIN}auth/remove`, {
                        method: "POST",
                        credentials: "include",
                        headers: {
                            "Accept": "application/json",
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ id }),
                    });
                })
                    .appendTo(oauthDiv);
            }
            // document.body.append(createButton(BUTTON_REGISTRY.createAuthor, "test author 1", "hi-im-an-author"));
            oauthDiv.append(createButton(ButtonRegistry_1.BUTTON_REGISTRY.clearSession));
            const profileButtons = Block().appendTo(view);
            profileButtons.append(createButton({
                name: "Create Profile 1",
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.createAuthor.execute("prolific author", "somanystories");
                    await ButtonRegistry_1.BUTTON_REGISTRY.createWork.execute("a debut work", "pretty decent", "debut", "Complete", "Public");
                    await ButtonRegistry_1.BUTTON_REGISTRY.createChapter.execute("somanystories", "debut", "chapter 1", "woo look it's prolific author's first story!", "Public");
                    await ButtonRegistry_1.BUTTON_REGISTRY.createWork.execute("sequel to debut", "wow they wrote a sequel", "sequel", "Ongoing", "Public");
                    await ButtonRegistry_1.BUTTON_REGISTRY.createChapter.execute("somanystories", "sequel", "the chapters", "pretend there's a story here", "Public");
                    await ButtonRegistry_1.BUTTON_REGISTRY.createWork.execute("work in progress", "private test", "wip", "Ongoing", "Private");
                    await ButtonRegistry_1.BUTTON_REGISTRY.createChapter.execute("somanystories", "wip", "draft", "it's a rough draft", "Private");
                },
            }));
            profileButtons.append(createButton({
                name: "View Profile 1",
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.viewAuthor.execute("author with many stories", "somanystories");
                },
            }));
            profileButtons.append(createButton({
                name: "Create Profile 2",
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.createAuthor.execute("single story author", "justonestory");
                    await ButtonRegistry_1.BUTTON_REGISTRY.createWork.execute("one big work", "it's long", "bigstory", "Ongoing", "Public");
                    await ButtonRegistry_1.BUTTON_REGISTRY.createChapter.execute("justonestory", "bigstory", "big story", "start of a long story", "Public");
                    await ButtonRegistry_1.BUTTON_REGISTRY.createChapter.execute("justonestory", "bigstory", "big story 2", "middle of a long story", "Public");
                    await ButtonRegistry_1.BUTTON_REGISTRY.createChapter.execute("justonestory", "bigstory", "big story 3", "aaaa", "Public");
                    await ButtonRegistry_1.BUTTON_REGISTRY.createChapter.execute("justonestory", "bigstory", "big story 4", "aaaaaaa", "Public");
                    await ButtonRegistry_1.BUTTON_REGISTRY.createChapter.execute("justonestory", "bigstory", "big story 5", "aaaaaaaaaaaaaaaaaaa", "Public");
                    await ButtonRegistry_1.BUTTON_REGISTRY.viewWork.execute("big story five chapters", "justonestory", "bigstory");
                    // await BUTTON_REGISTRY.follow.execute("work", "debut");
                },
            }));
            profileButtons.append(createButton({
                name: "View Profile 2",
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.viewAuthor.execute("justonestory author", "justonestory");
                },
            }));
            profileButtons.append(createButton({
                name: "Create Profile 3",
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.createAuthor.execute("prolific follower", "ifollowpeople");
                    await ButtonRegistry_1.BUTTON_REGISTRY.createWork.execute("invalid status", "a test", "uwu", "ShouldNotValidate", "ShouldNotBeValidated");
                    // await BUTTON_REGISTRY.follow.execute("author", "somanystories");
                    // await BUTTON_REGISTRY.follow.execute("author", "justonestory");
                    // await BUTTON_REGISTRY.follow.execute("work", "debut");
                    // await BUTTON_REGISTRY.follow.execute("work", "sequel");
                    // await BUTTON_REGISTRY.follow.execute("work", "wip");
                    // await BUTTON_REGISTRY.follow.execute("work", "bigstory");
                },
            }));
            profileButtons.append(createButton({
                name: "View Profile 3",
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.viewAuthor.execute("ifollowpeople author", "ifollowpeople");
                },
            }));
            const testButtons = Block().appendTo(view);
            testButtons.append(createButton({
                name: "Test New Following",
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.createAuthor.execute("new follows", "thefollower");
                    await ButtonRegistry_1.BUTTON_REGISTRY.createWork.execute("wow a work", "test pls ignore", "wowawork", "Ongoing", "Public");
                    await ButtonRegistry_1.BUTTON_REGISTRY.follow.execute("author", "thefollower");
                    await ButtonRegistry_1.BUTTON_REGISTRY.followWork.execute("thefollower", "wowawork");
                    await ButtonRegistry_1.BUTTON_REGISTRY.getFollow.execute("author", "thefollower");
                    await ButtonRegistry_1.BUTTON_REGISTRY.getAllFollows.execute("work");
                    await ButtonRegistry_1.BUTTON_REGISTRY.getAllFollowsMerged.execute();
                    await ButtonRegistry_1.BUTTON_REGISTRY.unignoreWork.execute("thefollower", "wowawork");
                    // await BUTTON_REGISTRY.unfollow.execute("work", "wowawork");
                    await ButtonRegistry_1.BUTTON_REGISTRY.getFollowWork.execute("thefollower", "wowawork");
                },
            }));
            // testButtons.append(createButton({
            // 	name: "Test Following Private Works",
            // 	async execute () {
            // 		await BUTTON_REGISTRY.createWork.execute("private from start", "aaaaaaa", "story1", "Ongoing", "Private");
            // 		await BUTTON_REGISTRY.createChapter.execute("aaaaa", "aaaaaaa", "story1", "Private");
            // 		await BUTTON_REGISTRY.follow.execute("work", "story1");
            // 		await BUTTON_REGISTRY.getFollow.execute("work", "story1");
            // 		await BUTTON_REGISTRY.getAllFollows.execute("work");
            // 		await BUTTON_REGISTRY.getAllFollowsMerged.execute();
            // 	},
            // }));
            // testButtons.append(createButton({
            // 	name: "Test Following Works Made Private",
            // 	async execute () {
            // 		await BUTTON_REGISTRY.createWork.execute("made private later", "bbbbbbbb", "story2", "Ongoing", "Public");
            // 		await BUTTON_REGISTRY.createChapter.execute("bbbbbb", "bbbbbbbb", "story2", "Public");
            // 		await BUTTON_REGISTRY.follow.execute("work", "story2");
            // 		await BUTTON_REGISTRY.getFollow.execute("work", "story2");
            // 		await BUTTON_REGISTRY.getAllFollows.execute("work");
            // 		await BUTTON_REGISTRY.getAllFollowsMerged.execute();
            // 		await BUTTON_REGISTRY.updateWork.execute("story2", undefined, undefined, undefined, undefined, "Private");
            // 		await BUTTON_REGISTRY.viewWork.execute("story2");
            // 		await BUTTON_REGISTRY.getFollow.execute("work", "story2");
            // 		await BUTTON_REGISTRY.getAllFollows.execute("work");
            // 		await BUTTON_REGISTRY.getAllFollowsMerged.execute();
            // 	},
            // }));
            testButtons.append(createButton({
                name: "Create 40 works",
                async execute() {
                    for (let i = 0; i < 30; i++) {
                        await ButtonRegistry_1.BUTTON_REGISTRY.createWork.execute(`test story ${i}`, "aaaaaaaaa", `teststory${i}`, "Ongoing", "Public");
                    }
                    for (let i = 0; i < 30; i++) {
                        await ButtonRegistry_1.BUTTON_REGISTRY.follow.execute("work", `teststory${i}`);
                    }
                },
            }));
            testButtons.append(createButton({
                name: "Follows testing",
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.getAllFollows.execute("work", 0);
                    await ButtonRegistry_1.BUTTON_REGISTRY.getAllFollows.execute("work", 1);
                    await ButtonRegistry_1.BUTTON_REGISTRY.getAllFollowsMerged.execute(0);
                    await ButtonRegistry_1.BUTTON_REGISTRY.getAllFollowsMerged.execute(1);
                },
            }));
            testButtons.append(createButton({
                name: "Spam Create Follow Work Test",
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.createAuthor.execute("spam create works", "manyworks");
                    for (let i = 0; i < 100; i++) {
                        await ButtonRegistry_1.BUTTON_REGISTRY.createWork.execute(`rapid story ${i}`, "aaaaaaaaa", `rapidstory${i}`, "Ongoing", "Public");
                        await ButtonRegistry_1.BUTTON_REGISTRY.follow.execute("work", `rapidstory${i}`);
                    }
                },
            }));
            testButtons.append(createButton({
                name: "Test Ignore Endpoints",
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.createAuthor.execute("ignoring myself", "ignorepls");
                    await ButtonRegistry_1.BUTTON_REGISTRY.createWork.execute("to ignore", "testing ignoring", "worktoignore", "Ongoing", "Public");
                    await ButtonRegistry_1.BUTTON_REGISTRY.ignore.execute("author", "ignorepls");
                    await ButtonRegistry_1.BUTTON_REGISTRY.ignore.execute("work", "worktoignore");
                    await ButtonRegistry_1.BUTTON_REGISTRY.getIgnore.execute("author", "ignorepls");
                    await ButtonRegistry_1.BUTTON_REGISTRY.getIgnore.execute("work", "worktoignore");
                    await ButtonRegistry_1.BUTTON_REGISTRY.getAllIgnores.execute("author");
                    await ButtonRegistry_1.BUTTON_REGISTRY.getAllIgnores.execute("work");
                    await ButtonRegistry_1.BUTTON_REGISTRY.getAllIgnoresMerged.execute();
                },
            }));
            const privRoleButtons = Block().appendTo(view);
            privRoleButtons.append(createButton({
                name: "privileges initial test",
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.privilegeGrantAuthor.execute("somanystories", "WorkViewPrivate", "PrivilegeViewAuthor");
                    await ButtonRegistry_1.BUTTON_REGISTRY.privilegeGetAllAuthor.execute("privileges of somanystories", "somanystories");
                    await ButtonRegistry_1.BUTTON_REGISTRY.privilegeRevokeAuthor.execute("somanystories", "WorkViewPrivate");
                    await ButtonRegistry_1.BUTTON_REGISTRY.privilegeGrantAuthor.execute("somanystories", "RevokePrivilege");
                    await ButtonRegistry_1.BUTTON_REGISTRY.privilegeRevokeAuthor.execute("somanystories", "WorkViewPrivate");
                    await ButtonRegistry_1.BUTTON_REGISTRY.privilegeGrantAuthor.execute("somanystories", "ThisPrivilegeDoesntExist");
                    await ButtonRegistry_1.BUTTON_REGISTRY.privilegeGetAllAuthor.execute("privileges of somanystories", "somanystories");
                },
            }));
            privRoleButtons.append(createButton({
                name: "grant privs for testing",
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.privilegeGrantAuthor.execute("somanystories", "PrivilegeRevoke", "RoleCreate", "RoleEdit", "RoleDelete", "RoleGrant", "RoleRevoke", "PrivilegeViewAuthor", "RoleViewAll");
                    await ButtonRegistry_1.BUTTON_REGISTRY.createRole.execute("TestingRevoke", "Visible");
                    await ButtonRegistry_1.BUTTON_REGISTRY.grantRoleToAuthor.execute("TestingRevoke", "somanystories");
                    await ButtonRegistry_1.BUTTON_REGISTRY.revokeRoleFromAuthor.execute("TestingRevoke", "somanystories");
                    await ButtonRegistry_1.BUTTON_REGISTRY.privilegeGrantRole.execute("TestingRevoke", "ViewAllRoles");
                    await ButtonRegistry_1.BUTTON_REGISTRY.privilegeRevokeRole.execute("TestingRevoke", "ViewAllRoles");
                    await ButtonRegistry_1.BUTTON_REGISTRY.deleteRole.execute("TestingRevoke");
                    await ButtonRegistry_1.BUTTON_REGISTRY.createRole.execute("SecondAuthorRole", "Visible");
                    await ButtonRegistry_1.BUTTON_REGISTRY.grantRoleToAuthor.execute("SecondAuthorRole", "justonestory");
                    await ButtonRegistry_1.BUTTON_REGISTRY.privilegeGrantRole.execute("SecondAuthorRole", "RoleEdit", "RoleDelete", "RoleCreate");
                    // await BUTTON_REGISTRY.privilegeGrantAuthor.execute("justonestory", "ViewPrivateStories");
                },
            }));
            privRoleButtons.append(createButton({
                name: "second author test stuff",
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.createRole.execute("DontWork", "Admin");
                    await ButtonRegistry_1.BUTTON_REGISTRY.createRole.execute("DoWork", "SecondAuthorRole");
                    await ButtonRegistry_1.BUTTON_REGISTRY.editRole.execute("Admin", "CantDoThis");
                    await ButtonRegistry_1.BUTTON_REGISTRY.deleteRole.execute("SecondAuthorRole");
                },
            }));
            privRoleButtons.append(createButton({
                name: "see highest level",
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.privilegeGrantAuthor.execute("somanystories", "RoleViewAll", "RoleGrant", "RoleCreate");
                    await ButtonRegistry_1.BUTTON_REGISTRY.createRole.execute("NotTopRole", "Admin");
                    await ButtonRegistry_1.BUTTON_REGISTRY.grantRoleToAuthor.execute("NotTopRole", "somanystories");
                    await ButtonRegistry_1.BUTTON_REGISTRY.roleListAll.execute("listing all roles");
                },
            }));
            privRoleButtons.append(createButton({
                name: "role reorder test",
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.privilegeGrantAuthor.execute("somanystories", "RoleViewAll", "RoleGrant", "RoleCreate");
                    await ButtonRegistry_1.BUTTON_REGISTRY.createRole.execute("Role1", "Visible", "Admin");
                    await ButtonRegistry_1.BUTTON_REGISTRY.createRole.execute("Role2", "Visible", "Admin");
                    await ButtonRegistry_1.BUTTON_REGISTRY.createRole.execute("Role3", "Hidden", "Admin");
                    await ButtonRegistry_1.BUTTON_REGISTRY.createRole.execute("Role4", "Hidden", "Admin");
                    await ButtonRegistry_1.BUTTON_REGISTRY.roleReorder.execute("Role1", "Role2", "Role3", "Role4");
                },
            }));
            const moreRoleButtons = Block().appendTo(view);
            moreRoleButtons.append(createButton({
                name: "admin list roles test (profile 1)",
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.privilegeGrantAuthor.execute("somanystories", "RoleGrant", "RoleCreate");
                    await ButtonRegistry_1.BUTTON_REGISTRY.createRole.execute("Role4", "Hidden", "Admin");
                    await ButtonRegistry_1.BUTTON_REGISTRY.createRole.execute("Role3", "Visible", "Admin");
                    await ButtonRegistry_1.BUTTON_REGISTRY.createRole.execute("Role2", "Hidden", "Admin");
                    await ButtonRegistry_1.BUTTON_REGISTRY.createRole.execute("Role1", "Visible", "Admin");
                    await ButtonRegistry_1.BUTTON_REGISTRY.grantRoleToAuthor.execute("Role2", "justonestory");
                    await ButtonRegistry_1.BUTTON_REGISTRY.roleListAll.execute("all roles admin");
                },
            }));
            moreRoleButtons.append(createButton({
                name: "user list roles test (profile 2)",
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.roleListAll.execute("all roles user");
                },
            }));
            moreRoleButtons.append(createButton({
                name: "Delete Author Test",
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.deleteAuthor.execute();
                },
            }));
            const commentsButton = Block().appendTo(view);
            commentsButton.append(createButton({
                name: "Author 2 lots of comments",
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.createCommentChapter.execute("bigstory", "1", "base comments 1");
                    await ButtonRegistry_1.BUTTON_REGISTRY.createCommentChapter.execute("bigstory", "2", "base comments 2");
                    await ButtonRegistry_1.BUTTON_REGISTRY.createCommentChapter.execute("bigstory", "3", "base comments 3");
                    await ButtonRegistry_1.BUTTON_REGISTRY.createCommentChapter.execute("bigstory", "4", "base comments 4");
                    await ButtonRegistry_1.BUTTON_REGISTRY.createCommentChapter.execute("bigstory", "5", "base comments 5");
                    await ButtonRegistry_1.BUTTON_REGISTRY.createCommentChapter.execute("bigstory", "1", "child comment", "6");
                    await ButtonRegistry_1.BUTTON_REGISTRY.createCommentChapter.execute("bigstory", "1", "child comment 2", "6");
                    await ButtonRegistry_1.BUTTON_REGISTRY.createCommentChapter.execute("bigstory", "1", "child comment 3", "11");
                    await ButtonRegistry_1.BUTTON_REGISTRY.createCommentChapter.execute("bigstory", "1", "child comment 4", "12");
                    await ButtonRegistry_1.BUTTON_REGISTRY.createCommentChapter.execute("bigstory", "1", "base comment index 1");
                    await ButtonRegistry_1.BUTTON_REGISTRY.createCommentChapter.execute("bigstory", "1", "child comment 6", "13");
                    await ButtonRegistry_1.BUTTON_REGISTRY.createCommentChapter.execute("bigstory", "1", "child comment 7", "11");
                    await ButtonRegistry_1.BUTTON_REGISTRY.createCommentChapter.execute("bigstory", "1", "base comment index 1 again");
                },
            }));
            commentsButton.append(createButton({
                name: "Author 1 single comment ping",
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.createCommentChapter.execute("debut", "1", "wow you write so many stories @somanystories how do you do it");
                    await ButtonRegistry_1.BUTTON_REGISTRY.createCommentChapter.execute("debut", "1", "@somanystories you're so @somanystories amazing");
                    await ButtonRegistry_1.BUTTON_REGISTRY.getComment.execute("4");
                    await ButtonRegistry_1.BUTTON_REGISTRY.getComment.execute("5");
                    await ButtonRegistry_1.BUTTON_REGISTRY.updateCommentChapter.execute("4", "okay done fawning over @somanystories now");
                    await ButtonRegistry_1.BUTTON_REGISTRY.getComment.execute("4");
                    await ButtonRegistry_1.BUTTON_REGISTRY.deleteCommentChapter.execute("5");
                    await ButtonRegistry_1.BUTTON_REGISTRY.getComment.execute("5");
                },
            }));
            commentsButton.append(createButton({
                name: "try to delete author 1's comment",
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.deleteCommentChapter.execute("4");
                    await ButtonRegistry_1.BUTTON_REGISTRY.getComment.execute("4");
                },
            }));
            const patreonButtons = Block().appendTo(view);
            (0, Button_4.default)()
                .text.set("Campaign Test")
                .event.subscribe("click", async () => {
                await (0, Popup_2.default)("Campaign OAuth", `${Env_3.default.API_ORIGIN}auth/patreon/campaign/begin`, 600, 900)
                    .then(() => true).catch(err => { console.warn(err); return false; });
                await Session_5.default.refresh();
            })
                .appendTo(patreonButtons);
            patreonButtons.append(createButton({
                name: "create patreon author",
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.createAuthor.execute("has a campaign", "patreonuser");
                    await ButtonRegistry_1.BUTTON_REGISTRY.createWork.execute("patreon only story", "test", "exclusive", "Ongoing", "Public");
                    await ButtonRegistry_1.BUTTON_REGISTRY.createChapter.execute("patreonuser", "exclusive", "chapter 1", "hewwo", "Private");
                    await ButtonRegistry_1.BUTTON_REGISTRY.createChapter.execute("patreonuser", "exclusive", "chapter 2", "hewwoo", "Private");
                    await ButtonRegistry_1.BUTTON_REGISTRY.createChapter.execute("patreonuser", "exclusive", "chapter 3", "hewwooo", "Private");
                    await ButtonRegistry_1.BUTTON_REGISTRY.createChapter.execute("patreonuser", "exclusive", "chapter 4", "hewwooo", "Private");
                    await ButtonRegistry_1.BUTTON_REGISTRY.createChapter.execute("patreonuser", "exclusive", "chapter 5", "hewwooo", "Private");
                },
            }));
            patreonButtons.append(createButton({
                name: "get patreon tiers",
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.patreonGetTiers.execute("patreon tiers");
                },
            }));
            patreonButtons.append(createButton({
                name: "set patreon chapters",
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.updateChapter.execute("patreonuser", "exclusive", 1, undefined, undefined, "Public");
                    await ButtonRegistry_1.BUTTON_REGISTRY.patreonSetThresholds.execute("patreonuser", "exclusive", "Public", ["2", "3"]);
                    await ButtonRegistry_1.BUTTON_REGISTRY.patreonSetThresholds.execute("patreonuser", "exclusive", "Patreon", ["4", "5"], "4392761");
                },
            }));
            (0, Button_4.default)()
                .text.set("Patron Test")
                .event.subscribe("click", async () => {
                await (0, Popup_2.default)("Patron OAuth", `${Env_3.default.API_ORIGIN}auth/patreon/patron/begin`, 600, 900)
                    .then(() => true).catch(err => { console.warn(err); return false; });
                await Session_5.default.refresh();
            })
                .appendTo(patreonButtons);
            patreonButtons.append(createButton({
                name: "get patreon-only chapters",
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.viewChapter.execute("public:", "patreonuser", "exclusive", "3");
                    await ButtonRegistry_1.BUTTON_REGISTRY.viewChapter.execute("patreon:", "patreonuser", "exclusive", "4");
                },
            }));
            patreonButtons.append(createButton({
                name: "update patreon-only chapters",
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.patreonSetThresholds.execute("patreonuser", "exclusive", "Public", ["4"]);
                },
            }));
            const tagButtons = Block().appendTo(view);
            tagButtons.append(createButton({
                name: "Create Tag Author",
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.createAuthor.execute("tagging test", "thetagger");
                    await ButtonRegistry_1.BUTTON_REGISTRY.privilegeGrantAuthor.execute("thetagger", "TagGlobalCreate", "TagGlobalDelete", "TagGlobalUpdate", "TagCategoryCreate", "TagCategoryUpdate", "TagCategoryDelete");
                },
            }));
            tagButtons.append(createButton({
                name: "Tag Create Test",
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.tagCreateCategory.execute("Category One", "the first test category");
                    await ButtonRegistry_1.BUTTON_REGISTRY.tagCreateCategory.execute("Category Two", "the second test category");
                    await ButtonRegistry_1.BUTTON_REGISTRY.tagCreateCategory.execute("Category Three", "the third test category");
                    await ButtonRegistry_1.BUTTON_REGISTRY.tagCreateGlobal.execute("Tag One", "test tag 1", "Category One");
                    await ButtonRegistry_1.BUTTON_REGISTRY.tagUpdateGlobal.execute("Tag One: Category One", "Tag One Updated", "test tag 1 updated", "Category Two");
                    await ButtonRegistry_1.BUTTON_REGISTRY.tagUpdateCategory.execute("Category One", "Category One Updated", "first test category updated");
                    await ButtonRegistry_1.BUTTON_REGISTRY.tagRemoveCategory.execute("Category One Updated");
                    await ButtonRegistry_1.BUTTON_REGISTRY.tagRemoveGlobal.execute("Tag One Updated: Category Two");
                    await ButtonRegistry_1.BUTTON_REGISTRY.tagCreateGlobal.execute("tag conflict", "conflicting", "Category Two");
                    await ButtonRegistry_1.BUTTON_REGISTRY.tagCreateGlobal.execute("tag conflict", "conflicting", "Category Three");
                    await ButtonRegistry_1.BUTTON_REGISTRY.tagUpdateGlobal.execute("tag conflict: Category Three", undefined, undefined, "Category Two");
                },
            }));
            tagButtons.append(createButton({
                name: "Work Tag Test",
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.tagCreateGlobal.execute("Tag Two", "test tag 2", "Category Two");
                    await ButtonRegistry_1.BUTTON_REGISTRY.tagCreateGlobal.execute("Tag Three", "test tag 2", "Category Two");
                    await ButtonRegistry_1.BUTTON_REGISTRY.tagCreateGlobal.execute("Tag Four", "test tag 2", "Category Two");
                    await ButtonRegistry_1.BUTTON_REGISTRY.createWork.execute("Tag Test Work", "test", "testwork", "Ongoing", "Public", ["Tag Two: Category Two", "Tag Three: Category Two"], ["custom tag 1", "custom tag 2"]);
                    await ButtonRegistry_1.BUTTON_REGISTRY.createWork.execute("Tag Test Work Two", "test2", "testworktwo", "Ongoing", "Public", ["Tag Two: Category Two", "Tag Three: Category Two"], ["custom tag 2", "custom tag 3"]);
                    await ButtonRegistry_1.BUTTON_REGISTRY.deleteWork.execute("thetagger", "testwork");
                },
            }));
            tagButtons.append(createButton({
                name: "manifest test",
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.tagGetAll.execute();
                },
            }));
            tagButtons.append(createButton({
                name: "manifest test 2",
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.tagCreateGlobal.execute("extra tag", "wow", "Category Three");
                    await ButtonRegistry_1.BUTTON_REGISTRY.tagGetAll.execute();
                },
            }));
            return view;
        },
    });
});
define("ui/component/core/TextEditor", ["require", "exports", "markdown-it", "prosemirror-commands", "prosemirror-dropcursor", "prosemirror-example-setup", "prosemirror-gapcursor", "prosemirror-history", "prosemirror-keymap", "prosemirror-markdown", "prosemirror-model", "prosemirror-state", "prosemirror-view", "ui/Component", "ui/component/core/Button", "ui/component/core/Checkbutton", "ui/component/core/extension/Input", "ui/component/core/Slot", "utility/Arrays", "utility/State", "w3c-keyname"], function (require, exports, markdown_it_1, prosemirror_commands_1, prosemirror_dropcursor_1, prosemirror_example_setup_1, prosemirror_gapcursor_1, prosemirror_history_1, prosemirror_keymap_1, prosemirror_markdown_1, prosemirror_model_1, prosemirror_state_1, prosemirror_view_1, Component_21, Button_5, Checkbutton_2, Input_2, Slot_2, Arrays_3, State_15, w3c_keyname_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    markdown_it_1 = __importDefault(markdown_it_1);
    Component_21 = __importDefault(Component_21);
    Button_5 = __importDefault(Button_5);
    Checkbutton_2 = __importDefault(Checkbutton_2);
    Input_2 = __importDefault(Input_2);
    Slot_2 = __importDefault(Slot_2);
    Arrays_3 = __importDefault(Arrays_3);
    State_15 = __importDefault(State_15);
    w3c_keyname_1 = __importDefault(w3c_keyname_1);
    const baseKeyName = w3c_keyname_1.default.keyName;
    w3c_keyname_1.default.keyName = (event) => {
        const keyboardEvent = event;
        if (keyboardEvent.code.startsWith("Numpad") && !keyboardEvent.shiftKey && (keyboardEvent.ctrlKey || keyboardEvent.altKey)) {
            Object.defineProperty(event, "shiftKey", { value: true });
            const str = keyboardEvent.code.slice(6);
            if (str === "Decimal")
                return ".";
            if (!isNaN(+str))
                return str;
        }
        return baseKeyName(event);
    };
    const schema = new prosemirror_model_1.Schema({
        nodes: {
            ...prosemirror_markdown_1.schema.spec.nodes.toObject(),
        },
        marks: {
            ...prosemirror_markdown_1.schema.spec.marks.toObject(),
            underline: {
                parseDOM: [
                    { tag: "u" },
                    { style: "text-decoration=underline", clearMark: m => m.type.name === "underline" },
                ],
                toDOM() { return ["u"]; },
            },
            strikethrough: {
                parseDOM: [
                    { tag: "s" },
                    { style: "text-decoration=line-through", clearMark: m => m.type.name === "strikethrough" },
                ],
                toDOM() { return ["s"]; },
            },
            subscript: {
                parseDOM: [
                    { tag: "sub" },
                ],
                toDOM() { return ["sub"]; },
            },
            superscript: {
                parseDOM: [
                    { tag: "sup" },
                ],
                toDOM() { return ["sup"]; },
            },
        },
    });
    const markdownSpec = {
        ...prosemirror_markdown_1.defaultMarkdownParser.tokens,
        underline: {
            mark: "underline",
        },
    };
    delete markdownSpec.image;
    const markdownParser = new prosemirror_markdown_1.MarkdownParser(schema, (0, markdown_it_1.default)("commonmark", { html: true }), markdownSpec);
    let globalid = 0;
    const TextEditor = Component_21.default.Builder((component) => {
        const id = globalid++;
        const isMarkdown = (0, State_15.default)(false);
        const content = (0, State_15.default)("");
        const state = (0, State_15.default)(undefined);
        ////////////////////////////////////
        //#region ToolbarButton
        const ToolbarButtonMark = Component_21.default.Builder((_, mark) => {
            const toggler = markToggler(mark);
            const markActive = state.map(state => isMarkActive(mark));
            return (0, Checkbutton_2.default)()
                .style("text-editor-toolbar-button")
                .style.bind(markActive, "text-editor-toolbar-button--enabled")
                .use(markActive)
                .event.subscribe("click", event => {
                event.preventDefault();
                toggler();
            });
        });
        const ToolbarButtonWrap = Component_21.default.Builder((_, node) => {
            const wrap = wrapper(node);
            return (0, Button_5.default)()
                .style("text-editor-toolbar-button")
                .event.subscribe("click", event => {
                event.preventDefault();
                wrap();
            });
        });
        const ToolbarButtonBlockType = Component_21.default.Builder((_, node) => {
            const toggle = blockTypeToggler(node);
            return (0, Button_5.default)()
                .style("text-editor-toolbar-button")
                .event.subscribe("click", event => {
                event.preventDefault();
                toggle();
            });
        });
        function isMarkActive(type) {
            if (!state.value)
                return false;
            const { from, $from, to, empty } = state.value.selection;
            if (empty)
                return !!type.isInSet(state.value.storedMarks || $from.marks());
            return state.value.doc.rangeHasMark(from, to, type);
        }
        function wrapCmd(cmd) {
            return () => {
                if (!state.value)
                    return;
                cmd(state.value, editor.mirror?.dispatch, editor.mirror);
                editor.document?.focus();
            };
        }
        function markToggler(type) {
            return wrapCmd((0, prosemirror_commands_1.toggleMark)(type));
        }
        function wrapper(node) {
            return wrapCmd((0, prosemirror_commands_1.wrapIn)(node));
        }
        function blockTypeToggler(node) {
            return wrapCmd((0, prosemirror_commands_1.setBlockType)(node));
        }
        //#endregion
        ////////////////////////////////////
        const toolbar = (0, Component_21.default)()
            .style("text-editor-toolbar")
            .ariaRole("toolbar")
            .append(ToolbarButtonMark(schema.marks.strong).style("text-editor-toolbar-bold"))
            .append(ToolbarButtonMark(schema.marks.em).style("text-editor-toolbar-italic"))
            .append(ToolbarButtonMark(schema.marks.underline).style("text-editor-toolbar-underline"))
            .append(ToolbarButtonMark(schema.marks.strikethrough).style("text-editor-toolbar-strikethrough"))
            .append(ToolbarButtonMark(schema.marks.subscript).style("text-editor-toolbar-subscript"))
            .append(ToolbarButtonMark(schema.marks.superscript).style("text-editor-toolbar-superscript"))
            .append(ToolbarButtonMark(schema.marks.code).style("text-editor-toolbar-code"))
            .append(ToolbarButtonWrap(schema.nodes.blockquote).style("text-editor-toolbar-blockquote"))
            .append(ToolbarButtonBlockType(schema.nodes.code_block).style("text-editor-toolbar-code"))
            .appendTo(component);
        let label;
        const unuseLabel = () => {
            label?.event.unsubscribe("remove", unuseLabel);
            label = undefined;
        };
        const editor = component
            .and(Input_2.default)
            .style("text-editor")
            .event.subscribe("click", (event) => {
            const target = Component_21.default.get(event.target);
            if (target !== toolbar && !target?.is(TextEditor))
                return;
            editor.document?.focus();
        })
            .extend(editor => ({
            toolbar,
            setRequired(required = true) {
                editor.style.toggle(required, "text-editor--required");
                editor.required.value = required;
                refresh();
                return editor;
            },
            setLabel(newLabel) {
                label = newLabel;
                label?.event.subscribe("remove", unuseLabel);
                refresh();
                return editor;
            },
        }));
        editor
            .append(toolbar)
            .append((0, Slot_2.default)()
            .use(isMarkdown, (slot, isMarkdown) => {
            if (isMarkdown) {
                state.value = undefined;
                return;
            }
            return createDefaultView(slot);
        }));
        return editor;
        function createDefaultView(slot) {
            const view = new prosemirror_view_1.EditorView(slot.element, {
                state: prosemirror_state_1.EditorState.create({
                    doc: markdownParser.parse(content.value),
                    plugins: [
                        (0, prosemirror_example_setup_1.buildInputRules)(schema),
                        (0, prosemirror_keymap_1.keymap)((0, prosemirror_example_setup_1.buildKeymap)(schema, {})),
                        (0, prosemirror_keymap_1.keymap)(prosemirror_commands_1.baseKeymap),
                        (0, prosemirror_keymap_1.keymap)({
                            "Mod-s": (0, prosemirror_commands_1.toggleMark)(schema.marks.strikethrough),
                            "Mod-S": (0, prosemirror_commands_1.toggleMark)(schema.marks.strikethrough),
                            "Mod-.": (0, prosemirror_commands_1.toggleMark)(schema.marks.superscript),
                            "Mod-,": (0, prosemirror_commands_1.toggleMark)(schema.marks.subscript),
                            "Alt-Ctrl-0": (0, prosemirror_commands_1.setBlockType)(schema.nodes.paragraph),
                            ...Arrays_3.default.range(1, 7)
                                .toObject(i => [`Alt-Ctrl-${i}`, (0, prosemirror_commands_1.setBlockType)(schema.nodes.heading, { level: i })]),
                        }),
                        (0, prosemirror_dropcursor_1.dropCursor)(),
                        (0, prosemirror_gapcursor_1.gapCursor)(),
                        (0, prosemirror_history_1.history)(),
                        new prosemirror_state_1.Plugin({
                            view() {
                                return {
                                    update(view, prevState) {
                                        state.value = view.state;
                                    },
                                };
                            },
                        }),
                    ],
                }),
            });
            editor.mirror = view;
            editor.document = (0, Component_21.default)()
                .and(Input_2.default)
                .replaceElement(editor.mirror.dom)
                .ariaRole("textbox")
                .style("text-editor-document")
                .setId(`text-editor-${id}`)
                .attributes.set("aria-multiline", "true");
            toolbar.ariaControls(editor.document);
            refresh();
            return () => {
                content.value = prosemirror_markdown_1.defaultMarkdownSerializer.serialize(view.state.doc);
                editor.mirror = undefined;
                editor.document = undefined;
                refresh();
                view.destroy();
            };
        }
        function refresh() {
            label?.setInput(editor.document);
            editor.document?.setName(label?.for);
            editor.document?.setId(label?.for);
            label?.setId(label.for.map(v => `${v}-label`));
            editor.document?.ariaLabelledBy(label);
            editor.document?.attributes.toggle(editor.required.value, "aria-required", "true");
        }
    });
    exports.default = TextEditor;
});
define("ui/view/HomeView", ["require", "exports", "ui/component/core/Block", "ui/component/core/Form", "ui/component/core/LabelledTable", "ui/component/core/TextEditor", "ui/view/View", "ui/view/ViewDefinition"], function (require, exports, Block_4, Form_2, LabelledTable_2, TextEditor_1, View_4, ViewDefinition_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Block_4 = __importDefault(Block_4);
    Form_2 = __importDefault(Form_2);
    LabelledTable_2 = __importDefault(LabelledTable_2);
    TextEditor_1 = __importDefault(TextEditor_1);
    View_4 = __importDefault(View_4);
    ViewDefinition_4 = __importDefault(ViewDefinition_4);
    exports.default = (0, ViewDefinition_4.default)({
        create: () => {
            const view = (0, View_4.default)("home");
            const block = (0, Block_4.default)().appendTo(view);
            const form = block.and(Form_2.default, block.title);
            const table = (0, LabelledTable_2.default)().appendTo(form.content);
            table.label(label => label.text.set("test editor"))
                .content((content, label, row) => {
                const editor = (0, TextEditor_1.default)()
                    .setLabel(label)
                    .appendTo(content);
                label.event.subscribe("click", () => editor.document?.focus());
            });
            return view;
        },
    });
});
define("navigation/Routes", ["require", "exports", "navigation/Route", "ui/view/AccountView", "ui/view/AuthorView", "ui/view/DebugView", "ui/view/HomeView"], function (require, exports, Route_1, AccountView_1, AuthorView_1, DebugView_1, HomeView_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Route_1 = __importDefault(Route_1);
    AccountView_1 = __importDefault(AccountView_1);
    AuthorView_1 = __importDefault(AuthorView_1);
    DebugView_1 = __importDefault(DebugView_1);
    HomeView_1 = __importDefault(HomeView_1);
    const Routes = [
        (0, Route_1.default)("/", HomeView_1.default.navigate),
        (0, Route_1.default)("/account", AccountView_1.default.navigate),
        (0, Route_1.default)("/debug", DebugView_1.default.navigate),
        (0, Route_1.default)("/author/$vanity", AuthorView_1.default.navigate),
    ];
    exports.default = Routes;
});
define("ui/view/ErrorView", ["require", "exports", "lang/en-nz", "ui/component/core/Heading", "ui/component/core/Paragraph", "ui/view/View", "ui/view/ViewDefinition"], function (require, exports, en_nz_4, Heading_2, Paragraph_2, View_5, ViewDefinition_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    en_nz_4 = __importDefault(en_nz_4);
    Heading_2 = __importDefault(Heading_2);
    Paragraph_2 = __importDefault(Paragraph_2);
    View_5 = __importDefault(View_5);
    ViewDefinition_5 = __importDefault(ViewDefinition_5);
    exports.default = (0, ViewDefinition_5.default)({
        create: (params) => {
            const view = (0, View_5.default)("error");
            (0, Heading_2.default)()
                .text.use(quilt => quilt["view/error/title"]({ CODE: params.code }))
                .appendTo(view);
            const key = `view/error/description-${params.code}`;
            if (key in en_nz_4.default)
                (0, Paragraph_2.default)()
                    .text.use(key)
                    .appendTo(view);
            return view;
        },
    });
});
define("navigation/Navigate", ["require", "exports", "navigation/Routes", "ui/view/ErrorView", "utility/Env"], function (require, exports, Routes_1, ErrorView_1, Env_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Routes_1 = __importDefault(Routes_1);
    ErrorView_1 = __importDefault(ErrorView_1);
    Env_4 = __importDefault(Env_4);
    function Navigator(app) {
        let lastURL;
        const navigate = {
            fromURL: async () => {
                if (location.href === lastURL?.href)
                    return;
                let errored = false;
                if (location.pathname !== lastURL?.pathname) {
                    const url = location.pathname;
                    let handled = false;
                    for (const route of Routes_1.default) {
                        const params = route.match(url);
                        if (!params)
                            continue;
                        await route.handler(app, params);
                        handled = true;
                        break;
                    }
                    if (!handled) {
                        errored = true;
                        await app.view.show(ErrorView_1.default, { code: 404 });
                    }
                }
                if (location.hash && !errored) {
                    const id = location.hash.slice(1);
                    const element = document.getElementById(id);
                    if (!element) {
                        console.error(`No element by ID: "${id}"`);
                        location.hash = "";
                        return;
                    }
                    element.scrollIntoView();
                    element.focus();
                }
                lastURL = new URL(location.href);
            },
            toURL: async (url) => {
                if (url !== location.pathname)
                    history.pushState({}, "", `${Env_4.default.URL_ORIGIN}${url.slice(1)}`);
                return navigate.fromURL();
            },
            toRawURL: (url) => {
                if (url.startsWith("http")) {
                    location.href = url;
                    return true;
                }
                if (url.startsWith("/")) {
                    void navigate.toURL(url);
                    return true;
                }
                if (url.startsWith("#")) {
                    const id = url.slice(1);
                    const element = document.getElementById(id);
                    if (!element) {
                        console.error(`No element by ID: "${id}"`);
                        return false;
                    }
                    location.hash = url;
                    return true;
                }
                console.error(`Unsupported raw URL to navigate to: "${url}"`);
                return false;
            },
        };
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        window.addEventListener("popstate", navigate.fromURL);
        Object.assign(window, { navigate });
        return navigate;
    }
    exports.default = Navigator;
});
define("ui/component/core/Link", ["require", "exports", "ui/Component", "utility/Env"], function (require, exports, Component_22, Env_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Component_22 = __importDefault(Component_22);
    Env_5 = __importDefault(Env_5);
    const Link = Component_22.default.Builder("a", (component, route) => {
        component.style("link");
        component.attributes.set("href", `${Env_5.default.URL_ORIGIN}${route.slice(1)}`);
        component.event.subscribe("click", event => {
            event.preventDefault();
            void navigate.toURL(route);
        });
        return component;
    });
    exports.default = Link;
});
define("utility/Async", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Async;
    (function (Async) {
        async function sleep(ms, signal) {
            // let stack = new Error().stack;
            // stack = stack?.slice(stack.indexOf("\n") + 1);
            // stack = stack?.slice(stack.indexOf("\n") + 1);
            // stack = stack?.slice(0, stack.indexOf("\n"));
            // console.log("sleep", stack);
            if (!signal) {
                return new Promise(resolve => {
                    window.setTimeout(() => resolve(undefined), ms);
                });
            }
            if (signal.aborted) {
                return true;
            }
            return new Promise(resolve => {
                // eslint-disable-next-line prefer-const
                let timeoutId;
                const onAbort = () => {
                    window.clearTimeout(timeoutId);
                    resolve(true);
                };
                timeoutId = window.setTimeout(() => {
                    signal.removeEventListener("abort", onAbort);
                    resolve(false);
                }, ms);
                signal.addEventListener("abort", onAbort, { once: true });
            });
        }
        Async.sleep = sleep;
        function debounce(...args) {
            let ms;
            let callback;
            if (typeof args[0] === "function") {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                [callback, ...args] = args;
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                return debounceByPromise(callback, ...args);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                [ms, callback, ...args] = args;
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                return debounceByTime(ms, callback, ...args);
            }
        }
        Async.debounce = debounce;
        const debouncedByTime = new WeakMap();
        function debounceByTime(ms, callback, ...args) {
            let info = debouncedByTime.get(callback);
            if (info && Date.now() - info.last < ms) {
                const callbackRef = new WeakRef(callback);
                callback = undefined;
                const newAbortController = new AbortController();
                info.queued = sleep(Date.now() - info.last + ms, newAbortController.signal).then(aborted => {
                    if (aborted) {
                        return info?.queued;
                    }
                    delete info.queued;
                    delete info.abortController;
                    info.last = Date.now();
                    return callbackRef.deref()?.(...args);
                });
                info.abortController?.abort();
                info.abortController = newAbortController;
                return info.queued;
            }
            if (!info) {
                debouncedByTime.set(callback, info = { last: 0 });
            }
            info.last = Date.now();
            return callback(...args);
        }
        const debouncedByPromise = new WeakMap();
        function debounceByPromise(callback, ...args) {
            const debounceInfo = debouncedByPromise.get(callback);
            if (debounceInfo?.nextQueued) {
                return debounceInfo.promise;
            }
            const callbackRef = new WeakRef(callback);
            callback = undefined;
            const realCallback = () => {
                try {
                    const callback = callbackRef.deref();
                    if (!callback) {
                        return;
                    }
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    const result = callback(...args);
                    const promise = Promise.resolve(result);
                    debouncedByPromise.set(callback, {
                        promise,
                        nextQueued: false,
                    });
                    callback = undefined;
                    promise.catch(reason => {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                        window.dispatchEvent(new PromiseRejectionEvent("unhandledrejection", { promise, reason }));
                    });
                    return promise;
                }
                catch (error) {
                    window.dispatchEvent(new ErrorEvent("error", { error }));
                    return;
                }
            };
            if (debounceInfo) {
                debounceInfo.nextQueued = true;
                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                return debounceInfo.promise.catch(realCallback).then(realCallback);
            }
            else {
                return realCallback();
            }
        }
        function schedule(...args) {
            let ms = 0;
            let callback;
            let debounceMs = false;
            let signal;
            if (typeof args[0] === "function") {
                // (cb, ...args)
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                [callback, ...args] = args;
            }
            else if (typeof args[1] === "function") {
                // (ms, cb, ...args)
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                [ms, callback, ...args] = args;
            }
            else if (typeof args[2] === "function") {
                // (ms, debounce | signal, cb, ...args)
                if (typeof args[1] === "object") {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    [ms, signal, callback, ...args] = args;
                }
                else {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    [ms, debounceMs, callback, ...args] = args;
                }
            }
            else {
                // (ms, debounce, signal, cb, ...args)
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                [ms, debounceMs, signal, callback, ...args] = args;
            }
            if (debounceMs === true) {
                debounceMs = ms;
            }
            const cancelCallbacks = [];
            // eslint-disable-next-line prefer-const
            let timeoutId;
            const result = {
                cancelled: false,
                completed: false,
                cancel: () => {
                    if (result.cancelled || result.completed) {
                        return;
                    }
                    signal?.removeEventListener("abort", result.cancel);
                    result.cancelled = true;
                    window.clearTimeout(timeoutId);
                    for (const callback of cancelCallbacks) {
                        try {
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument
                            const result = callback(...args);
                            const promise = Promise.resolve(result);
                            promise.catch(reason => {
                                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                                window.dispatchEvent(new PromiseRejectionEvent("unhandledrejection", { promise, reason }));
                            });
                        }
                        catch (error) {
                            window.dispatchEvent(new ErrorEvent("error", { error }));
                        }
                    }
                    cancelCallbacks.length = 0;
                    args.length = 0;
                },
                onCancel: callback => {
                    if (result.completed) {
                        return result;
                    }
                    if (result.cancelled) {
                        try {
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument
                            const result = callback(...args);
                            const promise = Promise.resolve(result);
                            promise.catch(reason => {
                                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                                window.dispatchEvent(new PromiseRejectionEvent("unhandledrejection", { promise, reason }));
                            });
                        }
                        catch (error) {
                            window.dispatchEvent(new ErrorEvent("error", { error }));
                        }
                    }
                    else {
                        cancelCallbacks.push(callback);
                    }
                    return result;
                },
            };
            signal?.addEventListener("abort", result.cancel, { once: true });
            timeoutId = window.setTimeout(() => {
                if (result.cancelled) {
                    return;
                }
                signal?.removeEventListener("abort", result.cancel);
                result.completed = true;
                cancelCallbacks.length = 0;
                try {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument
                    const result = debounceMs ? debounce(debounceMs, callback, ...args) : callback(...args);
                    const promise = Promise.resolve(result);
                    promise.catch(reason => {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                        window.dispatchEvent(new PromiseRejectionEvent("unhandledrejection", { promise, reason }));
                    });
                }
                catch (error) {
                    window.dispatchEvent(new ErrorEvent("error", { error }));
                }
            }, ms);
            return result;
        }
        Async.schedule = schedule;
        /**
         * Create an AbortSignal that will be emitted after `ms`.
         * @param ms The time until the signal will be emitted.
         * @param controller An optional existing `AbortController`.
         * @param message An optional custom timeout message.
         */
        function timeout(ms, controller = new AbortController(), message = `Timed out after ${ms} ms`) {
            schedule(ms, () => controller.abort(message));
            return controller.signal;
        }
        Async.timeout = timeout;
    })(Async || (Async = {}));
    exports.default = Async;
});
define("utility/Strings", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Strings;
    (function (Strings) {
        function includesAt(string, substring, index) {
            if (index < 0)
                index = string.length + index;
            if (index + substring.length > string.length)
                return false;
            for (let i = 0; i < substring.length; i++)
                if (string[i + index] !== substring[i])
                    return false;
            return true;
        }
        Strings.includesAt = includesAt;
        function sliceTo(string, substring, startAt) {
            const index = string.indexOf(substring, startAt);
            if (index === -1)
                return string;
            return string.slice(0, index);
        }
        Strings.sliceTo = sliceTo;
        function sliceAfter(string, substring, startAt) {
            const index = string.indexOf(substring, startAt);
            if (index === -1)
                return string;
            return string.slice(index + substring.length);
        }
        Strings.sliceAfter = sliceAfter;
        function trimTextMatchingFromStart(string, substring, startAt) {
            if (string.length < substring.length)
                return string;
            const index = string.indexOf(substring, startAt);
            if (index !== 0)
                return string;
            return string.slice(index + substring.length);
        }
        Strings.trimTextMatchingFromStart = trimTextMatchingFromStart;
        function trimTextMatchingFromEnd(string, substring, startAt) {
            if (string.length < substring.length)
                return string;
            const index = string.lastIndexOf(substring, startAt);
            if (index !== string.length - substring.length)
                return string;
            return string.slice(0, index);
        }
        Strings.trimTextMatchingFromEnd = trimTextMatchingFromEnd;
        function extractFromQuotes(string) {
            let substring = (string ?? "").trim();
            if (substring[0] === '"')
                substring = substring.slice(1);
            if (substring[substring.length - 1] === '"')
                substring = substring.slice(0, -1);
            return substring.trim();
        }
        Strings.extractFromQuotes = extractFromQuotes;
        function extractFromSquareBrackets(string) {
            let substring = (string ?? "");
            if (substring[0] === "[")
                substring = substring.slice(1).trimStart();
            if (substring[substring.length - 1] === "]")
                substring = substring.slice(0, -1).trimEnd();
            return substring;
        }
        Strings.extractFromSquareBrackets = extractFromSquareBrackets;
        function mergeRegularExpressions(flags, ...expressions) {
            let exprString = "";
            for (const expr of expressions)
                exprString += "|" + expr.source;
            return new RegExp(exprString.slice(1), flags);
        }
        Strings.mergeRegularExpressions = mergeRegularExpressions;
        function count(string, substring, stopAtCount = Infinity) {
            let count = 0;
            let lastIndex = -1;
            while (count < stopAtCount) {
                const index = string.indexOf(substring, lastIndex + 1);
                if (index === -1)
                    return count;
                count++;
                lastIndex = index;
            }
            return count;
        }
        Strings.count = count;
        function includesOnce(string, substring) {
            return count(string, substring, 2) === 1;
        }
        Strings.includesOnce = includesOnce;
        function getVariations(name) {
            const variations = [name];
            variations.push(name + "d", name + "ed");
            if (name.endsWith("d"))
                variations.push(...getVariations(name.slice(0, -1)));
            if (name.endsWith("ed"))
                variations.push(...getVariations(name.slice(0, -2)));
            if (name.endsWith("ing")) {
                variations.push(name.slice(0, -3));
                if (name[name.length - 4] === name[name.length - 5])
                    variations.push(name.slice(0, -4));
            }
            else {
                variations.push(name + "ing", name + name[name.length - 1] + "ing");
                if (name.endsWith("y"))
                    variations.push(name.slice(0, -1) + "ing");
            }
            if (name.endsWith("ion")) {
                variations.push(...getVariations(name.slice(0, -3)));
                if (name[name.length - 4] === name[name.length - 5])
                    variations.push(name.slice(0, -4));
            }
            else
                variations.push(name + "ion");
            if (name.endsWith("er"))
                variations.push(name.slice(0, -1), name.slice(0, -2));
            else {
                variations.push(name + "r", name + "er");
                if (name.endsWith("y"))
                    variations.push(name.slice(0, -1) + "ier");
            }
            if (name.endsWith("ier"))
                variations.push(name.slice(0, -3) + "y");
            variations.push(name + "s", name + "es");
            if (name.endsWith("s"))
                variations.push(name.slice(0, -1));
            else {
                if (name.endsWith("y"))
                    variations.push(name.slice(0, -1) + "ies");
            }
            return variations;
        }
        Strings.getVariations = getVariations;
        const REGEX_APOSTROPHE = /'/g;
        const REGEX_NON_WORD_MULTI = /\W+/g;
        function getWords(text) {
            return text.toLowerCase()
                .replace(REGEX_APOSTROPHE, "")
                .split(REGEX_NON_WORD_MULTI)
                .filter(Boolean);
        }
        Strings.getWords = getWords;
        function fuzzyMatches(a, b, options) {
            options ??= {};
            options.missingWordsThreshold ??= 0.4;
            options.maxMissingWordsForFuzzy = 4;
            const wordsA = getWords(a).map(getVariations);
            const wordsB = getWords(b).map(getVariations);
            let matches = 0;
            let misses = 0;
            let ia = 0;
            let ib = 0;
            NextMain: while (true) {
                const va = wordsA[ia];
                const vb = wordsB[ib];
                if (!va && !vb)
                    break;
                if (!va || !vb) {
                    ia++;
                    ib++;
                    misses++;
                    continue;
                }
                let loopMisses = 0;
                for (let ia2 = ia; ia2 < wordsA.length && loopMisses <= options.maxMissingWordsForFuzzy; ia2++) {
                    const va = wordsA[ia2];
                    if (va.some(va => vb.includes(va))) {
                        ia = ia2 + 1;
                        ib++;
                        matches++;
                        misses += loopMisses;
                        continue NextMain;
                    }
                    loopMisses++;
                }
                loopMisses = 0;
                for (let ib2 = ib; ib2 < wordsB.length && loopMisses <= options.maxMissingWordsForFuzzy; ib2++) {
                    const vb = wordsB[ib2];
                    if (vb.some(vb => va.includes(vb))) {
                        ia++;
                        ib = ib2 + 1;
                        matches++;
                        misses += loopMisses;
                        continue NextMain;
                    }
                    loopMisses++;
                }
                misses++;
                ia++;
                ib++;
            }
            return matches / (matches + misses) >= options.missingWordsThreshold;
        }
        Strings.fuzzyMatches = fuzzyMatches;
        const REGEX_NON_WORD_MULTI_PREV = /(?<=\W+)/g;
        function toTitleCase(text) {
            return text.split(REGEX_NON_WORD_MULTI_PREV)
                .map(word => word[0].toUpperCase() + word.slice(1))
                .join("");
        }
        Strings.toTitleCase = toTitleCase;
    })(Strings || (Strings = {}));
    exports.default = Strings;
});
define("utility/Time", ["require", "exports", "utility/Strings"], function (require, exports, Strings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Strings_1 = __importDefault(Strings_1);
    var Time;
    (function (Time) {
        function floor(interval) {
            return Math.floor(Date.now() / interval) * interval;
        }
        Time.floor = floor;
        function ms(ms) { return ms; }
        Time.ms = ms;
        function seconds(seconds) { return seconds * 1000; }
        Time.seconds = seconds;
        function minutes(minutes) { return minutes * 1000 * 60; }
        Time.minutes = minutes;
        function hours(hours) { return hours * 1000 * 60 * 60; }
        Time.hours = hours;
        function days(days) { return days * 1000 * 60 * 60 * 24; }
        Time.days = days;
        function weeks(weeks) { return weeks * 1000 * 60 * 60 * 24 * 7; }
        Time.weeks = weeks;
        function months(months) { return Math.floor(months * 1000 * 60 * 60 * 24 * (365.2422 / 12)); }
        Time.months = months;
        function years(years) { return Math.floor(years * 1000 * 60 * 60 * 24 * 365.2422); }
        Time.years = years;
        function decades(decades) { return Math.floor(decades * 1000 * 60 * 60 * 24 * 365.2422 * 10); }
        Time.decades = decades;
        function centuries(centuries) { return Math.floor(centuries * 1000 * 60 * 60 * 24 * 365.2422 * 10 * 10); }
        Time.centuries = centuries;
        function millenia(millenia) { return Math.floor(millenia * 1000 * 60 * 60 * 24 * 365.2422 * 10 * 10 * 10); }
        Time.millenia = millenia;
        function relative(ms, options = { style: "short" }) {
            ms -= Date.now();
            const locale = navigator.language || "en-NZ";
            if (!locale.startsWith("en"))
                return relativeIntl(ms, locale, options);
            if (Math.abs(ms) < seconds(1))
                return "now";
            const ago = ms < 0;
            if (ago)
                ms = Math.abs(ms);
            let limit = options.components ?? Infinity;
            let value = ms;
            let result = ms > 0 && options.label !== false ? "in " : "";
            value = Math.floor(ms / years(1));
            ms -= value * years(1);
            if (value && limit-- > 0)
                result += `${value} year${value === 1 ? "" : "s"}${limit > 0 ? ", " : ""}`;
            value = Math.floor(ms / months(1));
            ms -= value * months(1);
            if (value && limit-- > 0)
                result += `${value} month${value === 1 ? "" : "s"}${limit > 0 ? ", " : ""}`;
            value = Math.floor(ms / weeks(1));
            ms -= value * weeks(1);
            if (value && limit-- > 0)
                result += `${value} week${value === 1 ? "" : "s"}${limit > 0 ? ", " : ""}`;
            value = Math.floor(ms / days(1));
            ms -= value * days(1);
            if (value && limit-- > 0)
                result += `${value} day${value === 1 ? "" : "s"}${limit > 0 ? ", " : ""}`;
            value = Math.floor(ms / hours(1));
            ms -= value * hours(1);
            if (value && limit-- > 0)
                result += `${value} hour${value === 1 ? "" : "s"}${limit > 0 ? ", " : ""}`;
            value = Math.floor(ms / minutes(1));
            ms -= value * minutes(1);
            if (value && limit-- > 0)
                result += `${value} minute${value === 1 ? "" : "s"}${limit > 0 ? ", " : ""}`;
            value = Math.floor(ms / seconds(1));
            if (value && limit-- > 0)
                result += `${value} second${value === 1 ? "" : "s"}`;
            result = Strings_1.default.trimTextMatchingFromEnd(result, ", ");
            return `${result}${ago && options.label !== false ? " ago" : ""}`;
        }
        Time.relative = relative;
        function relativeIntl(ms, locale, options) {
            const rtf = new Intl.RelativeTimeFormat(locale, options);
            let value = ms;
            value = Math.floor(ms / years(1));
            if (value)
                return rtf.format(value, "year");
            value = Math.floor(ms / months(1));
            if (value)
                return rtf.format(value, "month");
            value = Math.floor(ms / weeks(1));
            if (value)
                return rtf.format(value, "week");
            value = Math.floor(ms / days(1));
            if (value)
                return rtf.format(value, "day");
            value = Math.floor(ms / hours(1));
            if (value)
                return rtf.format(value, "hour");
            value = Math.floor(ms / minutes(1));
            if (value)
                return rtf.format(value, "minute");
            value = Math.floor(ms / seconds(1));
            return rtf.format(value, "second");
        }
        function absolute(ms, options = { dateStyle: "full", timeStyle: "medium" }) {
            const locale = navigator.language || "en-NZ";
            const rtf = new Intl.DateTimeFormat(locale, options);
            return rtf.format(ms);
        }
        Time.absolute = absolute;
    })(Time || (Time = {}));
    Object.assign(window, { Time });
    exports.default = Time;
});
define("utility/Task", ["require", "exports", "utility/Async", "utility/Time"], function (require, exports, Async_1, Time_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Async_1 = __importDefault(Async_1);
    Time_1 = __importDefault(Time_1);
    const DEFAULT_INTERVAL = Time_1.default.seconds(1) / 144;
    class Task {
        interval;
        static async yield(instantIfUnsupported = false) {
            if (typeof scheduler !== "undefined" && typeof scheduler.yield === "function")
                return scheduler.yield();
            if (!instantIfUnsupported)
                await Async_1.default.sleep(1);
        }
        static post(callback, priority) {
            if (typeof scheduler === "undefined" || typeof scheduler.postTask !== "function")
                return callback();
            return scheduler.postTask(callback, { priority });
        }
        lastYieldEnd = Date.now();
        constructor(interval = DEFAULT_INTERVAL) {
            this.interval = interval;
        }
        reset() {
            this.lastYieldEnd = Date.now();
        }
        async yield(instantIfUnsupported = false) {
            if (Date.now() - this.lastYieldEnd > this.interval) {
                await Task.yield(instantIfUnsupported);
                this.lastYieldEnd = Date.now();
            }
        }
    }
    exports.default = Task;
});
define("ui/component/core/Popover", ["require", "exports", "ui/Component", "ui/utility/Mouse", "utility/Task"], function (require, exports, Component_23, Mouse_2, Task_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Component_23 = __importDefault(Component_23);
    Mouse_2 = __importDefault(Mouse_2);
    Task_1 = __importDefault(Task_1);
    const FOCUS_TRAP = (0, Component_23.default)()
        .tabIndex("auto")
        .ariaHidden()
        .style.setProperty("display", "none")
        .prependTo(document.body);
    Component_23.default.extend(component => {
        component.extend(component => ({
            popover: (event, initialiser) => {
                let isShown = false;
                const popover = Popover()
                    .anchor.from(component)
                    .setOwner(component)
                    .tweak(initialiser)
                    .event.subscribe("toggle", e => {
                    const event = e;
                    if (event.newState === "closed") {
                        isShown = false;
                        clickState = false;
                        Mouse_2.default.offMove(updatePopoverState);
                    }
                })
                    .appendTo(document.body);
                if (event === "hover")
                    component.hoveredOrFocused.subscribe(component, updatePopoverState);
                const ariaLabel = component.attributes.getUsing("aria-label") ?? popover.attributes.get("aria-label");
                const ariaRole = popover.attributes.getUsing("role") ?? popover.attributes.get("role");
                component.ariaLabel((quilt, { arg }) => quilt["component/popover/button"](arg(ariaLabel), arg(ariaRole)));
                popover.ariaLabel((quilt, { arg }) => quilt["component/popover"](arg(ariaLabel)));
                let clickState = false;
                component.event.subscribe("click", () => {
                    // always subscribe click because we need to handle it for keyboard navigation
                    if (!component.focused.value && event !== "click")
                        return;
                    clickState = true;
                    popover.show();
                    popover.focus();
                });
                popover.hasFocused.subscribe(component, hasFocused => {
                    if (hasFocused)
                        return;
                    clickState = false;
                    popover.hide();
                    component.focus();
                });
                return component;
                async function updatePopoverState() {
                    const shouldShow = false
                        || component.hoveredOrFocused.value
                        || (isShown && popover.rect.value.expand(100).intersects(Mouse_2.default.state.value))
                        || clickState;
                    if (isShown === shouldShow)
                        return;
                    if (component.hoveredOrFocused.value && !isShown)
                        Mouse_2.default.onMove(updatePopoverState);
                    if (!shouldShow)
                        Mouse_2.default.offMove(updatePopoverState);
                    if (!shouldShow)
                        FOCUS_TRAP.style.setProperty("display", "none");
                    isShown = shouldShow;
                    popover.toggle(shouldShow);
                    if (!shouldShow)
                        return;
                    FOCUS_TRAP.style.setProperty("display", "inline");
                    popover.style.removeProperties("left", "top");
                    await Task_1.default.yield();
                    popover.anchor.apply();
                }
            },
        }));
    });
    const Popover = Component_23.default.Builder((popover) => {
        let unbind;
        return popover
            .style("popover")
            .tabIndex("programmatic")
            .attributes.add("popover")
            .extend(popover => ({
            show: () => {
                unbind?.();
                popover.element.togglePopover(true);
                return popover;
            },
            hide: () => {
                unbind?.();
                popover.element.togglePopover(false);
                return popover;
            },
            toggle: shown => {
                unbind?.();
                popover.element.togglePopover(shown);
                return popover;
            },
            bind: state => {
                unbind?.();
                unbind = state.use(popover, shown => popover.element.togglePopover(shown));
                return popover;
            },
            unbind: () => {
                unbind?.();
                return popover;
            },
        }));
    });
    exports.default = Popover;
});
define("ui/component/masthead/Flag", ["require", "exports", "ui/Component", "utility/Arrays"], function (require, exports, Component_24, Arrays_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Component_24 = __importDefault(Component_24);
    Arrays_4 = __importDefault(Arrays_4);
    const Flag = Component_24.default.Builder((component) => {
        const stripes = Arrays_4.default.range(5)
            .map(i => (0, Component_24.default)()
            .style("flag-stripe", `flag-stripe-${FLAG_STRIPE_COLOURS[i]}`, `flag-stripe-${i + 1}`));
        let endWhen = Infinity;
        const activeReasons = new Set();
        function add(reason) {
            if (!activeReasons.size) {
                endWhen = Infinity;
                for (const stripe of stripes) {
                    stripe.style.remove("flag-stripe--animate-end-0", "flag-stripe--animate-end-1");
                    stripe.style("flag-stripe--animate");
                }
            }
            activeReasons.add(reason);
        }
        function remove(reason) {
            activeReasons.delete(reason);
        }
        function toggle(reason, enabled) {
            if (enabled)
                add(reason);
            else
                remove(reason);
        }
        component.hoveredOrFocused.subscribe(component, enabled => toggle("focus", enabled));
        for (const stripe of stripes) {
            const first = stripe === stripes[0];
            let iteration = 0;
            stripe.event.subscribe("animationstart", () => iteration = 0);
            stripe.event.subscribe("animationiteration", () => {
                iteration++;
                if (first && !activeReasons.size)
                    endWhen = iteration;
                if (iteration >= endWhen) {
                    stripe.style.remove("flag-stripe--animate");
                    stripe.style(`flag-stripe--animate-end-${(iteration % 2)}`);
                }
            });
        }
        return component
            .style("flag")
            .append(...stripes)
            .extend(flag => ({
            wave: toggle,
        }));
    });
    exports.default = Flag;
    const FLAG_STRIPE_COLOURS = [
        "blue",
        "pink",
        "white",
        "pink",
        "blue",
    ];
});
define("ui/component/PrimaryNav", ["require", "exports", "ui/Component"], function (require, exports, Component_25) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Component_25 = __importDefault(Component_25);
    exports.default = Component_25.default.Builder(nav => {
        // Heading()
        // 	.text.set("hi")
        // 	.appendTo(nav)
        return nav;
    });
});
define("ui/component/Sidebar", ["require", "exports", "ui/Component", "utility/Store"], function (require, exports, Component_26, Store_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Component_26 = __importDefault(Component_26);
    Store_3 = __importDefault(Store_3);
    const Sidebar = Component_26.default.Builder("nav", (sidebar) => {
        sidebar.style("sidebar")
            .ariaLabel("masthead/primary-nav/alt");
        updateSidebarVisibility();
        return sidebar.extend(sidebar => ({
            toggle: () => {
                Store_3.default.items.sidebar = !Store_3.default.items.sidebar;
                updateSidebarVisibility();
                return sidebar;
            },
        }));
        function updateSidebarVisibility() {
            sidebar.style.toggle(!!Store_3.default.items.sidebar, "sidebar--visible");
        }
    });
    exports.default = Sidebar;
});
define("ui/ViewContainer", ["require", "exports", "ui/Component", "ui/view/component/ViewTransition", "ui/view/ErrorView"], function (require, exports, Component_27, ViewTransition_5, ErrorView_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Component_27 = __importDefault(Component_27);
    ViewTransition_5 = __importDefault(ViewTransition_5);
    ErrorView_2 = __importDefault(ErrorView_2);
    const ViewContainer = () => (0, Component_27.default)()
        .style("view-container")
        .tabIndex("programmatic")
        .ariaRole("main")
        .ariaLabel("view/container/alt")
        .extend(container => ({
        view: undefined,
        show: async (definition, params) => {
            let view;
            if (container.view) {
                const transition = ViewTransition_5.default.perform("view", swap);
                await transition.updateCallbackDone;
            }
            else {
                await swap();
            }
            return view;
            async function swap() {
                container.view?.remove();
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                const shownView = await Promise.resolve(definition.create(params)).catch((error) => ErrorView_2.default.create({ code: error.code ?? 500, error }));
                shownView.appendTo(container);
                container.view = shownView;
            }
        },
    }));
    exports.default = ViewContainer;
});
define("ui/component/Masthead", ["require", "exports", "model/Session", "ui/Component", "ui/component/core/Button", "ui/component/core/Heading", "ui/component/core/Link", "ui/component/core/Slot", "ui/component/masthead/Flag", "ui/component/PrimaryNav", "ui/component/Sidebar", "ui/utility/Viewport", "utility/Env", "utility/Task"], function (require, exports, Session_6, Component_28, Button_6, Heading_3, Link_1, Slot_3, Flag_1, PrimaryNav_1, Sidebar_1, Viewport_3, Env_6, Task_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Session_6 = __importDefault(Session_6);
    Component_28 = __importDefault(Component_28);
    Button_6 = __importDefault(Button_6);
    Heading_3 = __importDefault(Heading_3);
    Link_1 = __importDefault(Link_1);
    Slot_3 = __importDefault(Slot_3);
    Flag_1 = __importDefault(Flag_1);
    PrimaryNav_1 = __importDefault(PrimaryNav_1);
    Sidebar_1 = __importDefault(Sidebar_1);
    Viewport_3 = __importDefault(Viewport_3);
    Env_6 = __importDefault(Env_6);
    Task_2 = __importDefault(Task_2);
    const Masthead = Component_28.default.Builder("header", (masthead, view) => {
        masthead.style("masthead");
        const sidebar = (0, Sidebar_1.default)();
        const nav = (0, PrimaryNav_1.default)();
        (0, Button_6.default)()
            .style("masthead-skip-nav")
            .text.use("masthead/skip-navigation")
            .event.subscribe("click", view.focus)
            .appendTo(masthead);
        let popover;
        const left = (0, Component_28.default)()
            .append((0, Component_28.default)()
            .and(Button_6.default)
            .style("masthead-left-hamburger", "masthead-left-hamburger-sidebar")
            .ariaHidden()
            .event.subscribe("click", sidebar.toggle))
            .append((0, Button_6.default)()
            .style("masthead-left-hamburger", "masthead-left-hamburger-popover")
            .ariaLabel("masthead/primary-nav/alt")
            .popover("hover", p => popover = p
            .anchor.add("aligned left", "off bottom")
            .ariaRole("navigation")))
            .style("masthead-left")
            .appendTo(masthead);
        sidebar.style.bind(masthead.hasFocused, "sidebar--visible-due-to-keyboard-navigation");
        Viewport_3.default.size.use(masthead, async () => {
            await Task_2.default.yield();
            nav.appendTo(sidebar.element.clientWidth ? sidebar : popover);
        });
        const flag = (0, Flag_1.default)()
            .style("masthead-home-logo");
        const homeLink = (0, Link_1.default)("/")
            .ariaLabel("fluff4me/alt")
            .append((0, Heading_3.default)()
            .and(Button_6.default)
            .style("masthead-home")
            .append(flag)
            .append((0, Component_28.default)("img")
            .style("masthead-home-logo-wordmark")
            .attributes.set("src", `${Env_6.default.URL_ORIGIN}image/logo-wordmark.svg`)))
            .appendTo(left);
        flag.style.bind(homeLink.hoveredOrFocused, "flag--focused");
        flag.style.bind(homeLink.active, "flag--active");
        homeLink.hoveredOrFocused.subscribe(masthead, focus => flag.wave("home link focus", focus));
        (0, Component_28.default)()
            .style("masthead-search")
            .appendTo(masthead);
        (0, Component_28.default)()
            .style("masthead-user")
            .append((0, Button_6.default)()
            .style("masthead-user-notifications")
            .ariaLabel("masthead/user/notifications/alt"))
            .append((0, Button_6.default)()
            .style("masthead-user-profile")
            .ariaLabel("masthead/user/profile/alt")
            .popover("hover", popover => popover
            .anchor.add("aligned right", "off bottom")
            .ariaRole("navigation")
            .append((0, Slot_3.default)()
            .use(Session_6.default.Auth.author, (slot, author) => {
            if (!author) {
                (0, Button_6.default)()
                    .type("flush")
                    .text.use("masthead/user/profile/popover/login")
                    .event.subscribe("click", () => navigate.toURL("/account"))
                    .appendTo(slot);
                return;
            }
            (0, Button_6.default)()
                .type("flush")
                .text.use("masthead/user/profile/popover/profile")
                .event.subscribe("click", () => navigate.toURL(`/author/${author.vanity}`))
                .appendTo(slot);
            (0, Button_6.default)()
                .type("flush")
                .text.use("masthead/user/profile/popover/account")
                .event.subscribe("click", () => navigate.toURL("/account"))
                .appendTo(slot);
        }))))
            .appendTo(masthead);
        return masthead.extend(masthead => ({
            sidebar,
        }));
    });
    exports.default = Masthead;
});
define("utility/EventManager", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EventManager = void 0;
    class EventManager {
        static global = EventManager.make();
        static make() {
            return new EventManager({});
        }
        static emit(target, event, init) {
            if (init instanceof Event)
                event = init;
            if (typeof event === "string")
                event = new Event(event, { cancelable: true });
            if (typeof init === "function")
                init?.(event);
            else if (init && event !== init)
                Object.assign(event, init);
            target?.dispatchEvent(event);
            return event;
        }
        host;
        _target;
        get target() {
            return this._target instanceof WeakRef ? this._target.deref() : this._target;
        }
        constructor(host, target = new EventTarget()) {
            this.host = new WeakRef(host);
            this._target = target;
        }
        subscribe(type, listener) {
            if (!Array.isArray(type))
                type = [type];
            for (const t of type)
                this.target?.addEventListener(t, listener);
            return this.host.deref();
        }
        subscriptions = {};
        subscribeOnce(types, listener) {
            if (!Array.isArray(types))
                types = [types];
            if (this.target) {
                const target = this.target;
                const subscriptions = this.subscriptions;
                function realListener(event) {
                    listener.call(this, event);
                    for (const type of types) {
                        subscriptions[type]?.delete(listener);
                        target?.removeEventListener(type, realListener);
                    }
                }
                for (const type of types) {
                    subscriptions[type] ??= new WeakMap();
                    subscriptions[type].set(listener, realListener);
                    this.target?.addEventListener(type, realListener);
                }
            }
            return this.host.deref();
        }
        unsubscribe(types, listener) {
            if (!Array.isArray(types))
                types = [types];
            for (const type of types) {
                this.target?.removeEventListener(type, listener);
                const realListener = this.subscriptions[type]?.get(listener);
                if (realListener) {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                    this.target?.removeEventListener(type, realListener);
                    this.subscriptions[type].delete(listener);
                }
            }
            return this.host.deref();
        }
        async waitFor(types) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return new Promise(resolve => this.subscribeOnce(types, resolve));
        }
        until(promise, initialiser) {
            if (typeof promise !== "object")
                promise = this.waitFor(promise);
            const manager = {
                subscribe: (type, listener) => {
                    this.subscribe(type, listener);
                    void (promise).then(() => this.unsubscribe(type, listener));
                    return manager;
                },
                subscribeOnce: (type, listener) => {
                    this.subscribeOnce(type, listener);
                    void (promise).then(() => this.unsubscribe(type, listener));
                    return manager;
                },
            };
            initialiser?.(manager);
            return this.host.deref();
        }
        emit(event, init) {
            event = EventManager.emit(this.target, event, init);
            // const pipeTargets = this.pipeTargets.get(event.type)
            // if (pipeTargets) {
            // 	for (let i = 0; i < pipeTargets.length; i++) {
            // 		const pipeTarget = pipeTargets[i].deref()
            // 		if (pipeTarget)
            // 			pipeTarget.dispatchEvent(event)
            // 		else
            // 			pipeTargets.splice(i--, 1)
            // 	}
            // 	if (!pipeTargets.length)
            // 		this.pipeTargets.delete(event.type)
            // }
            return this.host.deref();
        }
    }
    exports.EventManager = EventManager;
});
define("ui/UiEventBus", ["require", "exports", "utility/EventManager"], function (require, exports, EventManager_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const UiEventBus = EventManager_1.EventManager.make();
    let lastUsed = 0;
    const state = {};
    const mouseKeyMap = {
        [0]: "MouseLeft",
        [1]: "MouseMiddle",
        [2]: "MouseRight",
        [3]: "Mouse3",
        [4]: "Mouse4",
        [5]: "Mouse5",
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        [`${undefined}`]: "Mouse?",
    };
    function emitKeyEvent(e) {
        const target = e.target;
        const input = target.closest("input[type=text], textarea, [contenteditable]");
        let usedByInput = !!input;
        const eventKey = e.key ?? mouseKeyMap[e.button];
        const eventType = e.type === "mousedown" ? "keydown" : e.type === "mouseup" ? "keyup" : e.type;
        if (eventType === "keydown")
            state[eventKey] = Date.now();
        let cancelInput = false;
        const event = {
            key: eventKey,
            ctrl: e.ctrlKey,
            shift: e.shiftKey,
            alt: e.altKey,
            used: usedByInput,
            input,
            use: (key, ...modifiers) => {
                if (event.used)
                    return false;
                const matches = event.matches(key, ...modifiers);
                if (matches)
                    event.used = true;
                return matches;
            },
            useOverInput: (key, ...modifiers) => {
                if (event.used && !usedByInput)
                    return false;
                const matches = event.matches(key, ...modifiers);
                if (matches) {
                    event.used = true;
                    usedByInput = false;
                }
                return matches;
            },
            matches: (key, ...modifiers) => {
                if (eventKey !== key)
                    return false;
                if (!modifiers.every(modifier => event[modifier]))
                    return false;
                return true;
            },
            cancelInput: () => cancelInput = true,
            hovering: (selector) => {
                const hovered = [...document.querySelectorAll(":hover")];
                return selector ? hovered[hovered.length - 1]?.closest(selector) ?? undefined : hovered[hovered.length - 1];
            },
        };
        if (eventType === "keyup") {
            event.usedAnotherKeyDuring = lastUsed > (state[eventKey] ?? 0);
            delete state[eventKey];
        }
        UiEventBus.emit(eventType, event);
        if ((event.used && !usedByInput) || (usedByInput && cancelInput)) {
            e.preventDefault();
            lastUsed = Date.now();
        }
        if (usedByInput) {
            if (e.type === "keydown" && eventKey === "Enter" && !event.shift && !event.alt) {
                const form = target.closest("form");
                if (form && (target.tagName.toLowerCase() === "input" || target.closest("[contenteditable]")) && !event.ctrl) {
                    e.preventDefault();
                }
                else {
                    form?.requestSubmit();
                }
            }
        }
    }
    document.addEventListener("keydown", emitKeyEvent);
    document.addEventListener("keyup", emitKeyEvent);
    document.addEventListener("mousedown", emitKeyEvent);
    document.addEventListener("mouseup", emitKeyEvent);
    document.addEventListener("click", emitKeyEvent);
    Object.defineProperty(MouseEvent.prototype, "used", {
        get() {
            return this._used ?? false;
        },
    });
    Object.defineProperty(MouseEvent.prototype, "use", {
        value: function (key, ...modifiers) {
            if (this._used)
                return false;
            const matches = this.matches(key, ...modifiers);
            if (matches) {
                this._used = true;
                // allow click & contextmenu handlers to be considered "used" for IKeyUpEvents
                lastUsed = Date.now();
            }
            return matches;
        },
    });
    Object.defineProperty(MouseEvent.prototype, "matches", {
        value: function (key, ...modifiers) {
            if (mouseKeyMap[this.button] !== key)
                return false;
            if (!modifiers.every(modifier => this[`${modifier}Key`]))
                return false;
            return true;
        },
    });
    exports.default = UiEventBus;
});
define("ui/utility/HoverListener", ["require", "exports", "ui/utility/Mouse"], function (require, exports, Mouse_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Mouse_3 = __importDefault(Mouse_3);
    var HoverListener;
    (function (HoverListener) {
        let lastHovered = [];
        function allHovered() {
            return lastHovered;
        }
        HoverListener.allHovered = allHovered;
        function hovered() {
            return lastHovered.at(-1);
        }
        HoverListener.hovered = hovered;
        function* allHoveredComponents() {
            for (const element of lastHovered) {
                const component = element.component;
                if (component)
                    yield component;
            }
        }
        HoverListener.allHoveredComponents = allHoveredComponents;
        function hoveredComponent() {
            return lastHovered.at(-1)?.component;
        }
        HoverListener.hoveredComponent = hoveredComponent;
        function listen() {
            Mouse_3.default.onMove(() => {
                const allHovered = document.querySelectorAll(":hover");
                const hovered = allHovered[allHovered.length - 1];
                if (hovered === lastHovered[lastHovered.length - 1])
                    return;
                const newHovered = [...allHovered];
                for (const element of lastHovered)
                    if (element.component && !newHovered.includes(element))
                        element.component.hovered.value = false;
                for (const element of newHovered)
                    if (element.component && !lastHovered.includes(element))
                        element.component.hovered.value = true;
                lastHovered = newHovered;
            });
        }
        HoverListener.listen = listen;
    })(HoverListener || (HoverListener = {}));
    exports.default = HoverListener;
    Object.assign(window, { HoverListener });
});
define("App", ["require", "exports", "lang/en-nz", "model/Session", "navigation/Navigate", "style", "ui/Component", "ui/component/Masthead", "ui/UiEventBus", "ui/utility/FocusListener", "ui/utility/HoverListener", "ui/utility/Mouse", "ui/utility/Viewport", "ui/ViewContainer", "utility/Async", "utility/Env", "utility/Store", "utility/Time"], function (require, exports, en_nz_5, Session_7, Navigate_1, style_2, Component_29, Masthead_1, UiEventBus_1, FocusListener_2, HoverListener_1, Mouse_4, Viewport_4, ViewContainer_1, Async_2, Env_7, Store_4, Time_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    en_nz_5 = __importDefault(en_nz_5);
    Session_7 = __importDefault(Session_7);
    Navigate_1 = __importDefault(Navigate_1);
    style_2 = __importDefault(style_2);
    Component_29 = __importDefault(Component_29);
    Masthead_1 = __importDefault(Masthead_1);
    UiEventBus_1 = __importDefault(UiEventBus_1);
    FocusListener_2 = __importDefault(FocusListener_2);
    HoverListener_1 = __importDefault(HoverListener_1);
    Mouse_4 = __importDefault(Mouse_4);
    Viewport_4 = __importDefault(Viewport_4);
    ViewContainer_1 = __importDefault(ViewContainer_1);
    Async_2 = __importDefault(Async_2);
    Env_7 = __importDefault(Env_7);
    Store_4 = __importDefault(Store_4);
    Time_2 = __importDefault(Time_2);
    async function App() {
        if (location.pathname.startsWith("/auth/")) {
            if (location.pathname.endsWith("/error")) {
                const params = new URLSearchParams(location.search);
                // eslint-disable-next-line no-debugger
                debugger;
                Store_4.default.items.popupError = {
                    code: +(params.get("code") ?? "500"),
                    message: params.get("message") ?? "Internal Server Error",
                };
            }
            window.close();
        }
        await screen?.orientation?.lock?.("portrait-primary").catch(() => { });
        UiEventBus_1.default.subscribe("keydown", event => {
            if (event.use("F6"))
                for (const stylesheet of document.querySelectorAll("link[rel=stylesheet]")) {
                    const href = stylesheet.getAttribute("href");
                    const newHref = `${href.slice(0, Math.max(0, href.indexOf("?")) || Infinity)}?${Math.random().toString().slice(2)}`;
                    stylesheet.setAttribute("href", newHref);
                }
            if (event.use("F4"))
                document.documentElement.classList.add("persist-tooltips");
        });
        UiEventBus_1.default.subscribe("keyup", event => {
            if (event.use("F4"))
                document.documentElement.classList.remove("persist-tooltips");
        });
        await Env_7.default.load();
        // const path = URL.path ?? URL.hash;
        // if (path === AuthView.id) {
        // 	URL.hash = null;
        // 	URL.path = null;
        // }
        // ViewManager.showByHash(URL.path ?? URL.hash);
        await Promise.race([
            Session_7.default.refresh(),
            Async_2.default.sleep(Time_2.default.seconds(2)),
        ]);
        HoverListener_1.default.listen();
        FocusListener_2.default.listen();
        Mouse_4.default.listen();
        Viewport_4.default.listen();
        document.title = en_nz_5.default["fluff4me/title"]().toString();
        document.body.classList.add(...style_2.default.body);
        const view = (0, ViewContainer_1.default)();
        const masthead = (0, Masthead_1.default)(view);
        const related = (0, Component_29.default)()
            .style("app-content-related");
        const content = (0, Component_29.default)()
            .style("app-content")
            .append(view, related);
        const app = (0, Component_29.default)()
            .style("app")
            .append(masthead, masthead.sidebar, content)
            .extend(app => ({
            navigate: (0, Navigate_1.default)(app),
            view,
        }))
            .appendTo(document.body);
        await app.navigate.fromURL();
        Object.assign(window, { app });
        return app;
    }
    exports.default = App;
});
define("Constants", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.APP_NAME = void 0;
    exports.APP_NAME = "fluff4.me / Queer Webnovels";
});
define("utility/DOMRect", ["require", "exports", "utility/Define"], function (require, exports, Define_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = default_1;
    Define_4 = __importDefault(Define_4);
    function default_1() {
        Define_4.default.magic(DOMRect.prototype, "centreX", {
            get() {
                return this.left + this.width / 2;
            },
        });
        Define_4.default.magic(DOMRect.prototype, "centreY", {
            get() {
                return this.top + this.height / 2;
            },
        });
        (0, Define_4.default)(DOMRect.prototype, "expand", function (amount) {
            return new DOMRect(this.x - amount, this.y - amount, this.width + amount * 2, this.height + amount * 2);
        });
        (0, Define_4.default)(DOMRect.prototype, "contract", function (amount) {
            return new DOMRect(Math.min(this.x + amount, this.centreX), Math.min(this.y - amount, this.centreY), Math.max(0, this.width - amount * 2), Math.max(0, this.height - amount * 2));
        });
        (0, Define_4.default)(DOMRect.prototype, "intersects", function (target) {
            if ("width" in target)
                return true
                    && this.left >= target.right
                    && this.right <= target.left
                    && this.top >= target.bottom
                    && this.bottom <= target.top;
            return true
                && this.left <= target.x && this.right >= target.x
                && this.top <= target.y && this.bottom >= target.y;
        });
    }
});
define("utility/Elements", ["require", "exports", "utility/Define"], function (require, exports, Define_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Define_5 = __importDefault(Define_5);
    var Elements;
    (function (Elements) {
        function applyPrototypes() {
            Define_5.default.set(Element.prototype, "asType", function (tagName) {
                return this.tagName.toLowerCase() === tagName ? this : undefined;
            });
        }
        Elements.applyPrototypes = applyPrototypes;
    })(Elements || (Elements = {}));
    exports.default = Elements;
});
define("index", ["require", "exports", "App", "utility/Arrays", "utility/DOMRect", "utility/Elements"], function (require, exports, App_1, Arrays_5, DOMRect_1, Elements_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    App_1 = __importDefault(App_1);
    Arrays_5 = __importDefault(Arrays_5);
    DOMRect_1 = __importDefault(DOMRect_1);
    Elements_1 = __importDefault(Elements_1);
    // view transition api fallback
    const noopViewTransition = {
        finished: Promise.resolve(undefined),
        ready: Promise.resolve(undefined),
        updateCallbackDone: Promise.resolve(undefined),
        skipTransition: () => { },
    };
    document.startViewTransition ??= cb => {
        cb?.();
        return noopViewTransition;
    };
    (0, DOMRect_1.default)();
    Arrays_5.default.applyPrototypes();
    Elements_1.default.applyPrototypes();
    void (0, App_1.default)();
});
define("endpoint/Endpoint2", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Endpoint {
        path;
        builder;
        constructor(path, builder) {
            this.path = path;
            this.builder = builder;
        }
        async query(...args) {
            const path = this.resolvePath(...args);
            let headers;
            return this.fetch(path, ...args)
                .then(response => {
                headers = response.headers;
                return response.text();
            })
                .then(text => {
                if (path.endsWith(".json")) {
                    // text = text
                    // 	.replace(/\s*\/\/[^\n"]*(?=\n)/g, "")
                    // 	.replace(/(?<=\n)\s*\/\/[^\n]*(?=\n)/g, "")
                    // 	.replace(/,(?=[^}\]"\d\w_-]*?[}\]])/gs, "");
                    let parsed;
                    try {
                        parsed = JSON.parse(text);
                    }
                    catch (err) {
                        console.warn(text);
                        throw err;
                    }
                    const result = this.process(parsed);
                    Object.defineProperty(result, "_headers", {
                        enumerable: false,
                        get: () => headers,
                    });
                    return result;
                }
                throw new Error("Unknown file type");
            });
        }
        process(received) {
            return received;
        }
        async fetch(path, ...args) {
            path ??= this.resolvePath(...args);
            const request = {
                ...this.getDefaultRequest(...args),
                ...await this.builder?.(...args) ?? {},
            };
            let body;
            if (typeof request.body === "object") {
                if (request.headers?.["Content-Type"] === "application/x-www-form-urlencoded")
                    body = new URLSearchParams(Object.entries(request.body)).toString();
                else if (request.headers?.["Content-Type"] === undefined || request.headers?.["Content-Type"] === "application/json") {
                    request.headers ??= {};
                    request.headers["Content-Type"] = "application/json";
                    body = JSON.stringify(request.body);
                }
            }
            let search = "";
            if (request.search) {
                search = "?";
                if (typeof request.search === "object")
                    search += new URLSearchParams(Object.entries(request.search)).toString();
                else
                    search += request.search;
            }
            return fetch(`${path}${search}`, {
                ...request,
                body,
                headers: Object.fromEntries(Object.entries(await this.getHeaders(request?.headers)).filter(([key, value]) => typeof value === "string")),
            });
        }
        resolvePath(...args) {
            return typeof this.path === "string" ? this.path : this.path(...args);
        }
        getDefaultRequest(...args) {
            return {};
        }
        // eslint-disable-next-line @typescript-eslint/require-await
        async getHeaders(headers) {
            return { ...headers };
        }
    }
    exports.default = Endpoint;
});
//#region Not currently used
// interface AnchorNameManipulator<HOST> {
// 	(name: string): HOST
// 	remove (name: string): HOST
// }
// interface AnchorComponentExtensions {
// 	anchorName: AnchorNameManipulator<this>
// }
// declare module "ui/Component" {
// 	interface ComponentExtensions extends AnchorComponentExtensions { }
// }
// Component.extend<AnchorComponentExtensions>(component => {
// 	let anchorNames: string[] | undefined
// 	return {
// 		anchorName: Object.assign(
// 			(name: string) => {
// 				anchorNames ??= []
// 				if (!name.startsWith("--"))
// 					name = `--${name}`
// 				anchorNames.push(name)
// 				component.style.setProperty("anchor-name", anchorNames.join(","))
// 				return component
// 			},
// 			{
// 				remove: (name: string) => {
// 					const index = anchorNames?.indexOf(name) ?? -1
// 					if (index === -1)
// 						return component
// 					anchorNames!.splice(index, 1)
// 					if (!anchorNames!.length)
// 						component.style.removeProperties("anchor-name")
// 					else
// 						component.style.setProperty("anchor-name", anchorNames!.join(","))
// 					return component
// 				},
// 			},
// 		),
// 	}
// })
// namespace Anchor {
// 	const INDICES: Record<string, number> = {}
// 	export function name (type: string) {
// 		const id = INDICES[type] ?? 0
// 		INDICES[type] = id + 1
// 		return `--${type}-${id}`
// 	}
// }
// export default Anchor
define("ui/utility/ActiveListener", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ActiveListener;
    (function (ActiveListener) {
        let lastActive = [];
        function allActive() {
            return lastActive;
        }
        ActiveListener.allActive = allActive;
        function active() {
            return lastActive.at(-1);
        }
        ActiveListener.active = active;
        function* allActiveComponents() {
            for (const element of lastActive) {
                const component = element.component;
                if (component)
                    yield component;
            }
        }
        ActiveListener.allActiveComponents = allActiveComponents;
        function activeComponent() {
            return lastActive.at(-1)?.component;
        }
        ActiveListener.activeComponent = activeComponent;
        function listen() {
            document.addEventListener("mousedown", updateActive);
            document.addEventListener("mouseup", updateActive);
            function updateActive() {
                const allActive = document.querySelectorAll(":active");
                const active = allActive[allActive.length - 1];
                if (active === lastActive[lastActive.length - 1])
                    return;
                const newActive = [...allActive];
                for (const element of lastActive)
                    if (element.component && !newActive.includes(element))
                        element.component.active.value = false;
                for (const element of newActive)
                    if (element.component && !lastActive.includes(element))
                        element.component.active.value = true;
                lastActive = newActive;
            }
        }
        ActiveListener.listen = listen;
    })(ActiveListener || (ActiveListener = {}));
    exports.default = ActiveListener;
    Object.assign(window, { ActiveListener });
});
define("utility/Debug", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Debug = void 0;
    var Debug;
    (function (Debug) {
        Debug.placeholder = false;
    })(Debug || (exports.Debug = Debug = {}));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    window.Debug = Debug;
});
define("utility/Functions", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Functions;
    (function (Functions) {
        function resolve(fn, ...args) {
            return typeof fn === "function" ? fn(...args) : fn;
        }
        Functions.resolve = resolve;
    })(Functions || (Functions = {}));
    exports.default = Functions;
});
define("utility/Tuples", ["require", "exports", "utility/Arrays"], function (require, exports, Arrays_6) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Arrays_6 = __importDefault(Arrays_6);
    var Tuples;
    (function (Tuples) {
        function make(...values) {
            return values;
        }
        Tuples.make = make;
        const nullishFilters = Object.fromEntries(Arrays_6.default.range(6)
            .map(index => make(index, (value) => value[index] !== undefined && value[index] !== null)));
        function filterNullish(index) {
            return nullishFilters[index];
        }
        Tuples.filterNullish = filterNullish;
        const falsyFilters = Object.fromEntries(Arrays_6.default.range(6)
            .map(index => make(index, (value) => value[index])));
        function filterFalsy(index) {
            return falsyFilters[index];
        }
        Tuples.filterFalsy = filterFalsy;
        function getter(index) {
            return tuple => tuple[index];
        }
        Tuples.getter = getter;
        function filter(index, predicate) {
            return (tuple, i) => predicate(tuple[index], i);
        }
        Tuples.filter = filter;
    })(Tuples || (Tuples = {}));
    exports.default = Tuples;
});
define("utility/decorator/Bound", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Bound = Bound;
    exports.Final = Final;
    function Bound(target, key, descriptor) {
        return Bounder(target, key, descriptor);
    }
    function Final(target, key, descriptor) {
        return Bounder(target, key, descriptor);
    }
    function Bounder(target, key, descriptor) {
        return {
            configurable: false,
            enumerable: descriptor.enumerable,
            get() {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, no-prototype-builtins
                if (!this || this === target.prototype || this.hasOwnProperty(key) || typeof descriptor.value !== "function") {
                    return descriptor.value;
                }
                const value = descriptor.value.bind(this);
                Object.defineProperty(this, key, {
                    configurable: false,
                    enumerable: descriptor.enumerable,
                    value,
                });
                return value;
            },
        };
    }
    exports.default = Bound;
});
define("utility/maths/Maths", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Maths;
    (function (Maths) {
        function sum(...nums) {
            let result = 0;
            for (const num of nums)
                result += num;
            return result;
        }
        Maths.sum = sum;
        function average(...nums) {
            let result = 0;
            for (const num of nums)
                result += num;
            return result / nums.length;
        }
        Maths.average = average;
        function bits(number) {
            const result = new BitsSet();
            for (let i = 52; i >= 0; i--) {
                const v = 1 << i;
                if (number & v)
                    result.add(v);
            }
            return result;
        }
        Maths.bits = bits;
        class BitsSet extends Set {
            everyIn(type) {
                const t = type ?? 0;
                for (const bit of this)
                    if (!(t & bit))
                        return false;
                return true;
            }
            someIn(type) {
                const t = type ?? 0;
                for (const bit of this)
                    if (t & bit)
                        return true;
                return false;
            }
            every(predicate) {
                for (const bit of this)
                    if (!predicate(bit))
                        return false;
                return true;
            }
            some(predicate) {
                for (const bit of this)
                    if (predicate(bit))
                        return true;
                return false;
            }
        }
        Maths.BitsSet = BitsSet;
        function bitsn(flag) {
            const result = new BitsSetN();
            for (let i = 52n; i >= 0n; i--) {
                const v = 1n << i;
                if (flag & v)
                    result.add(v);
            }
            return result;
        }
        Maths.bitsn = bitsn;
        class BitsSetN extends Set {
            everyIn(type) {
                const t = type ?? 0n;
                for (const bit of this)
                    if (!(t & bit))
                        return false;
                return true;
            }
            someIn(type) {
                const t = type ?? 0n;
                for (const bit of this)
                    if (t & bit)
                        return true;
                return false;
            }
            every(predicate) {
                for (const bit of this)
                    if (!predicate(bit))
                        return false;
                return true;
            }
            some(predicate) {
                for (const bit of this)
                    if (predicate(bit))
                        return true;
                return false;
            }
        }
        Maths.BitsSetN = BitsSetN;
        function lerp(from, to, t) {
            return (1 - t) * from + t * to;
        }
        Maths.lerp = lerp;
    })(Maths || (Maths = {}));
    exports.default = Maths;
});
