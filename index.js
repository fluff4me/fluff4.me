"use strict";
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
define("utility/endpoint/Endpoint", ["require", "exports", "utility/Env"], function (require, exports, Env_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
            async query(query) {
                const body = !query?.body ? undefined : JSON.stringify(query.body);
                const response = await fetch(`${Env_1.default.API_ORIGIN}${route.slice(1)}`, {
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
            },
        };
        return endpoint;
    }
    exports.default = Endpoint;
});
define("utility/endpoint/auth/EndpointAuthRemove", ["require", "exports", "utility/endpoint/Endpoint"], function (require, exports, Endpoint_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = (0, Endpoint_1.default)("/auth/remove", "post");
});
define("utility/endpoint/session/EndpointSessionGet", ["require", "exports", "utility/endpoint/Endpoint"], function (require, exports, Endpoint_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = (0, Endpoint_2.default)("/session", "get")
        .headers({ "Accept": "application/json" });
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
                    void promise.then(() => this.unsubscribe(type, listener));
                    return manager;
                },
                subscribeOnce: (type, listener) => {
                    this.subscribeOnce(type, listener);
                    void promise.then(() => this.unsubscribe(type, listener));
                    return manager;
                },
            };
            initialiser?.(manager);
            return this.host.deref();
        }
        pipeTargets = new Map();
        emit(event, init) {
            event = EventManager.emit(this.target, event, init);
            const pipeTargets = this.pipeTargets.get(event.type);
            if (pipeTargets) {
                for (let i = 0; i < pipeTargets.length; i++) {
                    const pipeTarget = pipeTargets[i].deref();
                    if (pipeTarget)
                        pipeTarget.dispatchEvent(event);
                    else
                        pipeTargets.splice(i--, 1);
                }
                if (!pipeTargets.length)
                    this.pipeTargets.delete(event.type);
            }
            return this.host.deref();
        }
        pipes = new Map();
        pipe(type, on) {
            const typeName = type;
            on.insertPipe(typeName, this._target instanceof WeakRef ? this._target : new WeakRef(this._target));
            let pipes = this.pipes.get(typeName);
            if (!pipes) {
                pipes = [];
                this.pipes.set(typeName, pipes);
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            pipes.push(new WeakRef(on));
            return this;
        }
        insertPipe(type, target) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            let pipeTargets = this.pipeTargets.get(type);
            if (!pipeTargets) {
                pipeTargets = [];
                this.pipeTargets.set(type, pipeTargets);
            }
            pipeTargets.push(target);
            const pipes = this.pipes.get(type);
            if (pipes) {
                for (let i = 0; i < pipes.length; i++) {
                    const pipe = pipes[i].deref();
                    if (pipe)
                        pipe.insertPipe(type, target);
                    else
                        pipes.splice(i--, 1);
                }
                if (!pipes.length)
                    this.pipes.delete(type);
            }
        }
    }
    exports.EventManager = EventManager;
});
define("utility/Store", ["require", "exports", "utility/EventManager"], function (require, exports, EventManager_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let storage;
    class Store {
        static event = EventManager_1.EventManager.make();
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
            const oldValue = Store.get(key);
            if (value === undefined)
                localStorage.removeItem(key);
            else
                localStorage.setItem(key, JSON.stringify(value));
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            Store.event.emit(`set${key[0].toUpperCase()}${key.slice(1)}`, { value, oldValue });
            return true;
        }
        static delete(key) {
            const oldValue = Store.get(key);
            localStorage.removeItem(key);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            Store.event.emit(`delete${key[0].toUpperCase()}${key.slice(1)}`, { oldValue });
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
define("model/Session", ["require", "exports", "utility/endpoint/auth/EndpointAuthRemove", "utility/endpoint/session/EndpointSessionGet", "utility/Popup", "utility/Store"], function (require, exports, EndpointAuthRemove_1, EndpointSessionGet_1, Popup_1, Store_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Session;
    (function (Session) {
        async function refresh() {
            const session = await EndpointSessionGet_1.default.query();
            const stateToken = session.headers.get("State-Token");
            if (stateToken)
                Store_2.default.items.stateToken = stateToken;
            Store_2.default.items.sessionAuthServices = session?.data?.authorisations ?? undefined;
        }
        Session.refresh = refresh;
        function getStateToken() {
            return Store_2.default.items.stateToken;
        }
        Session.getStateToken = getStateToken;
        let Auth;
        (function (Auth) {
            function getAll() {
                return Store_2.default.items.sessionAuthServices ?? [];
            }
            Auth.getAll = getAll;
            function get(service) {
                return Store_2.default.items.sessionAuthServices?.find(auth => auth.service === service);
            }
            Auth.get = get;
            async function unauth(authOrId) {
                const id = typeof authOrId === "string" ? authOrId : authOrId.id;
                await EndpointAuthRemove_1.default.query({ body: { id } });
                Store_2.default.items.sessionAuthServices = Store_2.default.items.sessionAuthServices?.filter(auth => auth.id !== id);
                if (!Store_2.default.items.sessionAuthServices?.length)
                    delete Store_2.default.items.sessionAuthServices;
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
define("ui/utility/TextManipulator", ["require", "exports", "lang/en-nz"], function (require, exports, en_nz_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.QuiltHelper = void 0;
    var QuiltHelper;
    (function (QuiltHelper) {
        function renderWeave(weave) {
            return weave.content.map(renderWeft);
        }
        QuiltHelper.renderWeave = renderWeave;
        function isPlaintextWeft(weft) {
            return true
                && typeof weft.content === "string";
        }
        function renderWeft(weft) {
            if (isPlaintextWeft(weft))
                return document.createTextNode(weft.content);
            const component = document.createElement("span");
            if (Array.isArray(weft.content))
                component.append(...weft.content.map(renderWeft));
            else
                component.textContent = `${weft.content}`;
            return component;
        }
    })(QuiltHelper || (exports.QuiltHelper = QuiltHelper = {}));
    function TextManipulator(component) {
        let translationHandler;
        const result = {
            set(text) {
                component.element.textContent = text;
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
                const weave = typeof translationHandler === "string" ? en_nz_1.default[translationHandler]() : translationHandler(en_nz_1.default);
                component.element.replaceChildren(...QuiltHelper.renderWeave(weave));
            },
        };
        return result;
    }
    exports.default = TextManipulator;
});
define("ui/utility/AttributeManipulator", ["require", "exports", "lang/en-nz"], function (require, exports, en_nz_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function AttributeManipulator(component) {
        let translationHandlers;
        const result = {
            add(...attributes) {
                for (const attribute of attributes)
                    component.element.setAttribute(attribute, "");
                return component;
            },
            set(attribute, value) {
                component.element.setAttribute(attribute, value);
                return component;
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
                    const weave = typeof translationHandler === "string" ? en_nz_2.default[translationHandler]() : translationHandler(en_nz_2.default);
                    component.element.setAttribute(attribute, weave.toString());
                }
            },
            remove(...attributes) {
                for (const attribute of attributes)
                    component.element.removeAttribute(attribute);
                return component;
            },
            toggle(present, attribute, value) {
                return this[present ? "set" : "remove"](attribute, value);
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
                component.element.classList.add(...classes);
                return component;
            },
            toggle(present, ...classes) {
                return this[present ? "add" : "remove"](...classes);
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
define("utility/Type", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("ui/utility/EventManipulator", ["require", "exports", "utility/Arrays"], function (require, exports, Arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
define("utility/State", ["require", "exports", "utility/Define"], function (require, exports, Define_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const SYMBOL_UNSUBSCRIBE = Symbol("UNSUBSCRIBE");
    const SYMBOL_VALUE = Symbol("VALUE");
    function State(defaultValue) {
        let subscribers = [];
        const result = {
            [SYMBOL_VALUE]: defaultValue,
            listening: false,
            get value() {
                return result[SYMBOL_VALUE];
            },
            set value(value) {
                if (result[SYMBOL_VALUE] === value)
                    return;
                result[SYMBOL_VALUE] = value;
                result.emit();
            },
            emit: () => {
                for (const subscriber of subscribers)
                    subscriber(result[SYMBOL_VALUE]);
                return result;
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
                return result;
            },
            subscribeManual: subscriber => {
                subscribers.push(subscriber);
                result.listening = true;
                return result;
            },
            unsubscribe: subscriber => {
                subscribers = subscribers.filter(s => s !== subscriber);
                result.listening = !subscribers.length;
                return result;
            },
        };
        return result;
    }
    (function (State) {
        function Generator(generate) {
            const result = State(generate());
            Define_2.default.magic(result, "value", {
                get: () => result[SYMBOL_VALUE],
            });
            result.observe = (...states) => {
                for (const state of states)
                    state.subscribeManual(() => {
                        const value = generate();
                        if (result[SYMBOL_VALUE] === value)
                            return;
                        result[SYMBOL_VALUE] = value;
                        result.emit();
                    });
                return result;
            };
            return result;
        }
        State.Generator = Generator;
    })(State || (State = {}));
    exports.default = State;
});
define("ui/utility/StyleManipulator", ["require", "exports", "style"], function (require, exports, style_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function StyleManipulator(component) {
        const styles = new Set();
        return Object.assign(((...names) => {
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
                state.subscribe(component, active => {
                    if (active)
                        for (const name of names)
                            styles.add(name);
                    else
                        for (const name of names)
                            styles.delete(name);
                    updateClasses(!active ? names : undefined);
                });
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
        function updateClasses(deletedStyles) {
            const toAdd = [...styles].flatMap(component => style_1.default[component]);
            const toRemove = deletedStyles?.flatMap(component => style_1.default[component]).filter(cls => !toAdd.includes(cls));
            if (toRemove)
                component.element.classList.remove(...toRemove);
            component.element.classList.add(...toAdd);
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
define("ui/Component", ["require", "exports", "ui/utility/AttributeManipulator", "ui/utility/ClassManipulator", "ui/utility/EventManipulator", "ui/utility/StyleManipulator", "ui/utility/TextManipulator", "utility/Define", "utility/Errors", "utility/State"], function (require, exports, AttributeManipulator_1, ClassManipulator_1, EventManipulator_1, StyleManipulator_1, TextManipulator_1, Define_3, Errors_1, State_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ELEMENT_TO_COMPONENT_MAP = new WeakMap();
    Define_3.default.magic(Element.prototype, "component", {
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
    function Component(type = "span") {
        let component = {
            isComponent: true,
            element: document.createElement(type),
            removed: (0, State_1.default)(false),
            rooted: (0, State_1.default)(false),
            replaceElement: (newElement) => {
                if (typeof newElement === "string")
                    newElement = document.createElement(newElement);
                const oldElement = component.element;
                if (component.element.parentNode)
                    component.element.replaceWith(newElement);
                component.element = newElement;
                type = component.element.tagName;
                component.style.refresh();
                if (oldElement.classList.contains(Classes.ReceiveAncestorInsertEvents))
                    newElement.classList.add(Classes.ReceiveAncestorInsertEvents);
                return component;
            },
            and(builder, ...params) {
                component = builder.from(component, ...params);
                return component;
            },
            extend: extension => Object.assign(component, extension(component)),
            extendMagic: (property, magic) => {
                Define_3.default.magic(component, property, magic(component));
                return component;
            },
            get style() {
                return Define_3.default.set(component, "style", (0, StyleManipulator_1.default)(component));
            },
            get classes() {
                return Define_3.default.set(component, "classes", (0, ClassManipulator_1.default)(component));
            },
            get attributes() {
                return Define_3.default.set(component, "attributes", (0, AttributeManipulator_1.default)(component));
            },
            get event() {
                return Define_3.default.set(component, "event", (0, EventManipulator_1.default)(component));
            },
            get text() {
                return Define_3.default.set(component, "text", (0, TextManipulator_1.default)(component));
            },
            get hovered() {
                return Define_3.default.set(component, "hovered", (0, State_1.default)(false));
            },
            get focused() {
                return Define_3.default.set(component, "focused", (0, State_1.default)(false));
            },
            get hoveredOrFocused() {
                return Define_3.default.set(component, "hoveredOrFocused", State_1.default.Generator(() => component.hovered.value || component.focused.value)
                    .observe(component.hovered, component.focused));
            },
            get active() {
                return Define_3.default.set(component, "active", (0, State_1.default)(false));
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
            receiveAncestorInsertEvents: () => {
                component.element.classList.add(Classes.ReceiveAncestorInsertEvents);
                return component;
            },
            ariaLabel: (keyOrHandler) => component.attributes.use("aria-label", keyOrHandler),
        };
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
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            const simpleBuilder = (...params) => realBuilder(undefined, ...params);
            return Object.assign(simpleBuilder, {
                from: realBuilder,
            });
        }
        Component.Builder = Builder;
    })(Component || (Component = {}));
    exports.default = Component;
});
define("ui/component/Form", ["require", "exports", "ui/Component"], function (require, exports, Component_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FormClasses = void 0;
    var FormClasses;
    (function (FormClasses) {
        FormClasses["Main"] = "form";
        FormClasses["Header"] = "form-header";
        FormClasses["Content"] = "form-content";
        FormClasses["Footer"] = "form-footer";
    })(FormClasses || (exports.FormClasses = FormClasses = {}));
    const Form = Component_1.default.Builder((container) => {
        const header = (0, Component_1.default)()
            .classes.add(FormClasses.Header);
        const content = (0, Component_1.default)()
            .classes.add(FormClasses.Content);
        const footer = (0, Component_1.default)()
            .classes.add(FormClasses.Footer);
        return container
            .classes.add(FormClasses.Main)
            .append(header, content, footer)
            .extend(() => ({ header, content, footer }));
    });
    exports.default = Form;
});
define("ui/component/Heading", ["require", "exports", "ui/Component"], function (require, exports, Component_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const Heading = Component_2.default.Builder("h1", (component) => {
        component.style("heading");
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
define("ui/component/Paragraph", ["require", "exports", "ui/Component"], function (require, exports, Component_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const Paragraph = Component_3.default.Builder(component => component
        .style("paragraph"));
    exports.default = Paragraph;
});
define("ui/component/Block", ["require", "exports", "ui/Component", "ui/component/Heading", "ui/component/Paragraph", "utility/Define"], function (require, exports, Component_4, Heading_1, Paragraph_1, Define_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const Block = Component_4.default.Builder((component) => {
        return component
            .style("block")
            .extend(() => ({
            title: undefined,
            header: undefined,
            description: undefined,
        }))
            .extendMagic("header", block => ({
            get: () => {
                const header = (0, Component_4.default)().style("block-header").prependTo(block);
                Define_4.default.set(block, "header", header);
                return header;
            },
        }))
            .extendMagic("title", block => ({
            get: () => {
                const title = (0, Heading_1.default)().style("block-title").prependTo(block.header);
                Define_4.default.set(block, "title", title);
                return title;
            },
        }))
            .extendMagic("description", block => ({
            get: () => {
                const description = (0, Paragraph_1.default)().style("block-description").appendTo(block.header);
                Define_4.default.set(block, "description", description);
                return description;
            },
        }));
    });
    exports.default = Block;
});
define("ui/component/Button", ["require", "exports", "ui/Component"], function (require, exports, Component_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const Button = Component_5.default.Builder("button", (component) => {
        const disabledReasons = new Set();
        return component
            .style("button")
            .extend(button => ({
            setDisabled(disabled, reason) {
                if (disabled)
                    disabledReasons.add(reason);
                else
                    disabledReasons.delete(reason);
                button.style.toggle(!!disabledReasons.size, "button--disabled");
                return button;
            },
        }));
    });
    exports.default = Button;
});
define("ui/component/Checkbutton", ["require", "exports", "ui/Component", "ui/component/Button"], function (require, exports, Component_6, Button_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const Checkbutton = Component_6.default.Builder("label", (component) => {
        const input = (0, Component_6.default)("input")
            .style("checkbutton-input")
            .attributes.set("type", "checkbox");
        const inputElement = input.element;
        const checkbutton = component
            .and(Button_1.default)
            .style("checkbutton")
            .attributes.set("tabindex", "0")
            .append(input)
            .extend(checkbutton => ({
            isChecked: () => inputElement.checked,
            setChecked: (checked) => {
                inputElement.checked = checked;
                onChange();
                return checkbutton;
            },
        }))
            .event.subscribe("click", event => {
            event.preventDefault();
        });
        input.event.subscribe("change", onChange);
        function onChange() {
            checkbutton.style.toggle(inputElement.checked, "checkbutton--checked");
            checkbutton.event.emit("setChecked", inputElement.checked);
        }
        return checkbutton;
    });
    exports.default = Checkbutton;
});
define("ui/view/account/AccountViewOAuthService", ["require", "exports", "model/Session", "ui/Component", "ui/component/Checkbutton"], function (require, exports, Session_1, Component_7, Checkbutton_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = Component_7.default.Builder((component, service) => {
        const authedAtStart = !!Session_1.default.Auth.get(service.name);
        const button = component
            .and(Checkbutton_1.default)
            .setChecked(authedAtStart)
            .style("account-view-oauth-service")
            .style.toggle(authedAtStart, "account-view-oauth-service--authenticated")
            .style.setVariable("colour", `#${service.colour.toString(16)}`)
            .append((0, Component_7.default)("img")
            .style("account-view-oauth-service-icon")
            .attributes.set("src", service.icon))
            .append((0, Component_7.default)()
            .style("account-view-oauth-service-name")
            .text.set(service.name))
            .append();
        const state = (0, Component_7.default)()
            .style("account-view-oauth-service-state")
            .style.toggle(authedAtStart, "account-view-oauth-service-state--authenticated")
            .style.bind(button.hoveredOrFocused, "account-view-oauth-service-state--focus")
            .appendTo(button);
        button.event.subscribe("setChecked", (event, checked) => {
            event.component.style.toggle(checked, "account-view-oauth-service--authenticated");
            state.style.toggle(checked, "account-view-oauth-service-state--authenticated");
        });
        button.event.subscribe("click", async (event) => {
            let auth = Session_1.default.Auth.get(service.name);
            if (auth)
                await Session_1.default.Auth.unauth(auth.id);
            else
                await Session_1.default.Auth.auth(service);
            auth = Session_1.default.Auth.get(service.name);
            event.component.setChecked(!!auth);
        });
        return button;
    });
});
define("utility/endpoint/auth/EndpointAuthServices", ["require", "exports", "utility/endpoint/Endpoint"], function (require, exports, Endpoint_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = (0, Endpoint_3.default)("/auth/services", "get");
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
define("ui/view/account/AccountViewOAuthServices", ["require", "exports", "ui/Component", "ui/component/Block", "ui/view/account/AccountViewOAuthService", "utility/endpoint/auth/EndpointAuthServices", "utility/Objects"], function (require, exports, Component_8, Block_1, AccountViewOAuthService_1, EndpointAuthServices_1, Objects_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = Component_8.default.Builder(async (component) => {
        const block = component
            .and(Block_1.default)
            .style("account-view-oauth-service-container");
        block.title.text.use("view/account/auth/title");
        block.description.text.use("view/account/auth/description");
        const list = (0, Component_8.default)()
            .style("account-view-oauth-service-list")
            .appendTo(block);
        const services = await EndpointAuthServices_1.default.query();
        if (services instanceof Error) {
            console.error(services);
            return block;
        }
        console.log(services.data);
        for (const service of Objects_1.default.values(services.data))
            (0, AccountViewOAuthService_1.default)(service)
                .appendTo(list);
        return block;
    });
});
define("ui/view/View", ["require", "exports", "ui/Component"], function (require, exports, Component_9) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const View = (id) => (0, Component_9.default)()
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
define("ui/view/AccountView", ["require", "exports", "ui/component/Form", "ui/view/account/AccountViewOAuthServices", "ui/view/View", "ui/view/ViewDefinition"], function (require, exports, Form_1, AccountViewOAuthServices_1, View_1, ViewDefinition_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = (0, ViewDefinition_1.default)({
        create: async () => {
            const view = (0, View_1.default)("account");
            const services = await (0, AccountViewOAuthServices_1.default)();
            services.appendTo(view);
            const form = (0, Form_1.default)()
                .appendTo(view);
            form.header;
            return view;
        },
    });
});
define("ui/view/debug/ButtonRegistry", ["require", "exports", "model/Session", "utility/Env"], function (require, exports, Session_2, Env_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BUTTON_REGISTRY = void 0;
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
                await Session_2.default.refresh();
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
                await Session_2.default.refresh();
            },
        },
        createWork: {
            name: "Create Work",
            async execute(name, description, vanity, status, visibility) {
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
    };
});
define("ui/view/DebugView", ["require", "exports", "model/Session", "ui/Component", "ui/component/Button", "ui/view/debug/ButtonRegistry", "ui/view/View", "ui/view/ViewDefinition", "utility/endpoint/auth/EndpointAuthServices", "utility/Env", "utility/Objects", "utility/Popup"], function (require, exports, Session_3, Component_10, Button_2, ButtonRegistry_1, View_2, ViewDefinition_2, EndpointAuthServices_2, Env_3, Objects_2, Popup_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const Block = Component_10.default.Builder(component => component
        .style("debug-block"));
    exports.default = (0, ViewDefinition_2.default)({
        async create() {
            const view = (0, View_2.default)("debug");
            const createButton = (implementation, ...args) => {
                return (0, Button_2.default)()
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
                (0, Button_2.default)()
                    .text.set(`OAuth ${service.name}`)
                    .event.subscribe("click", async () => {
                    await (0, Popup_2.default)(`OAuth ${service.name}`, service.url_begin, 600, 900)
                        .then(() => true).catch(err => { console.warn(err); return false; });
                    await Session_3.default.refresh();
                })
                    .appendTo(oauthDiv);
                (0, Button_2.default)()
                    .text.set(`UnOAuth ${service.name}`)
                    .event.subscribe("click", async () => {
                    const id = Session_3.default.Auth.get(service.id)?.id;
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
            (0, Button_2.default)()
                .text.set("Campaign Test")
                .event.subscribe("click", async () => {
                await (0, Popup_2.default)("Campaign OAuth", `${Env_3.default.API_ORIGIN}auth/patreon/campaign/begin`, 600, 900)
                    .then(() => true).catch(err => { console.warn(err); return false; });
                await Session_3.default.refresh();
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
            (0, Button_2.default)()
                .text.set("Patron Test")
                .event.subscribe("click", async () => {
                await (0, Popup_2.default)("Patron OAuth", `${Env_3.default.API_ORIGIN}auth/patreon/patron/begin`, 600, 900)
                    .then(() => true).catch(err => { console.warn(err); return false; });
                await Session_3.default.refresh();
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
            return view;
        },
    });
});
define("navigation/Routes", ["require", "exports", "navigation/Route", "ui/view/AccountView", "ui/view/DebugView"], function (require, exports, Route_1, AccountView_1, DebugView_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const Routes = [
        (0, Route_1.default)("/", AccountView_1.default.navigate),
        (0, Route_1.default)("/debug", DebugView_1.default.navigate),
    ];
    exports.default = Routes;
});
define("ui/view/ErrorView", ["require", "exports", "lang/en-nz", "ui/component/Heading", "ui/component/Paragraph", "ui/view/View", "ui/view/ViewDefinition"], function (require, exports, en_nz_3, Heading_2, Paragraph_2, View_3, ViewDefinition_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = (0, ViewDefinition_3.default)({
        create: (params) => {
            const view = (0, View_3.default)("error");
            (0, Heading_2.default)()
                .text.use(quilt => quilt["view/error/title"]({ CODE: params.code }))
                .appendTo(view);
            const key = `view/error/description-${params.code}`;
            if (key in en_nz_3.default)
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
    function Navigator(app) {
        const navigate = {
            fromURL: async () => {
                const url = document.location.pathname;
                for (const route of Routes_1.default) {
                    const params = route.match(url);
                    if (!params)
                        continue;
                    await route.handler(app, params);
                    return;
                }
                await app.view.show(ErrorView_1.default, { code: 404 });
            },
            toURL: async (url) => {
                if (url !== document.location.pathname)
                    history.pushState({}, "", `${Env_4.default.URL_ORIGIN}${url.slice(1)}`);
                return navigate.fromURL();
            },
        };
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        window.addEventListener("popstate", navigate.fromURL);
        return navigate;
    }
    exports.default = Navigator;
});
define("ui/component/Link", ["require", "exports", "ui/Component", "utility/Env"], function (require, exports, Component_11, Env_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let navigate;
    const Link = Object.assign(Component_11.default.Builder("a", (component, route) => {
        component.style("link");
        component.attributes.set("href", `${Env_5.default.URL_ORIGIN}${route.slice(1)}`);
        component.event.subscribe("click", event => {
            event.preventDefault();
            void navigate.toURL(route);
        });
        return component;
    }), {
        setNavigator(_navigate) {
            navigate = _navigate;
        },
    });
    exports.default = Link;
});
define("ui/component/masthead/Flag", ["require", "exports", "ui/Component", "utility/Arrays"], function (require, exports, Component_12, Arrays_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const Flag = Component_12.default.Builder((component) => {
        const stripes = Arrays_2.default.range(5)
            .map(i => (0, Component_12.default)()
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
define("ui/component/Masthead", ["require", "exports", "ui/Component", "ui/component/Button", "ui/component/Heading", "ui/component/Link", "ui/component/masthead/Flag", "utility/Env"], function (require, exports, Component_13, Button_3, Heading_3, Link_1, Flag_1, Env_6) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const Masthead = Component_13.default.Builder("nav", masthead => {
        masthead.style("masthead");
        const flag = (0, Flag_1.default)()
            .style("masthead-home-logo");
        const homeLink = (0, Link_1.default)("/")
            .ariaLabel("fluff4me/alt")
            .append((0, Heading_3.default)()
            .and(Button_3.default)
            .style("masthead-home")
            .append(flag)
            .append((0, Component_13.default)("img")
            .style("masthead-home-logo-wordmark")
            .attributes.set("src", `${Env_6.default.URL_ORIGIN}image/logo-wordmark.svg`)))
            .appendTo(masthead);
        flag.style.bind(homeLink.hoveredOrFocused, "flag--focused");
        flag.style.bind(homeLink.active, "flag--active");
        homeLink.hoveredOrFocused.subscribe(masthead, focus => flag.wave("home link focus", focus));
        (0, Component_13.default)()
            .style("masthead-search")
            .appendTo(masthead);
        (0, Component_13.default)()
            .style("masthead-user")
            .append((0, Button_3.default)()
            .style("masthead-user-notifications")
            .ariaLabel("masthead/user/notifications/alt"))
            .append((0, Button_3.default)()
            .style("masthead-user-profile")
            .ariaLabel("masthead/user/profile/alt"))
            .appendTo(masthead);
        return masthead.extend(masthead => ({}));
    });
    exports.default = Masthead;
});
define("ui/component/Sidebar", ["require", "exports", "ui/Component"], function (require, exports, Component_14) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const Sidebar = Component_14.default.Builder("aside", (component) => {
        component.style("sidebar");
        return component.extend(sidebar => ({}));
    });
    exports.default = Sidebar;
});
define("ui/UiEventBus", ["require", "exports", "utility/EventManager"], function (require, exports, EventManager_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const UiEventBus = EventManager_2.EventManager.make();
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
        const input = e.target.closest("input[type=text], textarea, [contenteditable]");
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
define("ui/utility/FocusListener", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var FocusListener;
    (function (FocusListener) {
        let lastFocused;
        function focused() {
            return lastFocused;
        }
        FocusListener.focused = focused;
        function focusedComponent() {
            return lastFocused?.component;
        }
        FocusListener.focusedComponent = focusedComponent;
        function listen() {
            document.addEventListener("focusin", updateFocusState);
            document.addEventListener("focusout", updateFocusState);
        }
        FocusListener.listen = listen;
        function updateFocusState() {
            const focused = document.querySelector(":focus-visible") ?? undefined;
            if (focused === lastFocused)
                return;
            if (lastFocused?.component?.focused.listening)
                lastFocused.component.focused.value = false;
            if (focused?.component?.focused.listening)
                focused.component.focused.value = true;
            lastFocused = focused;
        }
    })(FocusListener || (FocusListener = {}));
    exports.default = FocusListener;
    Object.assign(window, { FocusListener });
});
define("ui/utility/HoverListener", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
            document.addEventListener("mousemove", () => {
                const allHovered = document.querySelectorAll(":hover");
                const hovered = allHovered[allHovered.length - 1];
                if (hovered === lastHovered[lastHovered.length - 1])
                    return;
                const newHovered = [...allHovered];
                for (const element of lastHovered)
                    if (element.component?.hovered.listening && !newHovered.includes(element))
                        element.component.hovered.value = false;
                for (const element of newHovered)
                    if (element.component?.hovered.listening && !lastHovered.includes(element))
                        element.component.hovered.value = true;
                lastHovered = newHovered;
            });
        }
        HoverListener.listen = listen;
    })(HoverListener || (HoverListener = {}));
    exports.default = HoverListener;
    Object.assign(window, { HoverListener });
});
define("ui/ViewContainer", ["require", "exports", "ui/Component"], function (require, exports, Component_15) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ViewContainer = () => (0, Component_15.default)()
        .style("view-container")
        .extend(container => ({
        view: undefined,
        show: async (definition, params) => {
            let view;
            if (container.view) {
                const transition = document.startViewTransition(swap);
                await transition.updateCallbackDone;
            }
            else {
                await swap();
            }
            return view;
            async function swap() {
                container.view?.remove();
                view = await definition.create(params);
                view.appendTo(container);
                container.view = view;
            }
        },
    }));
    exports.default = ViewContainer;
});
define("App", ["require", "exports", "model/Session", "navigation/Navigate", "style", "ui/Component", "ui/component/Link", "ui/component/Masthead", "ui/component/Sidebar", "ui/UiEventBus", "ui/utility/FocusListener", "ui/utility/HoverListener", "ui/ViewContainer", "utility/Env", "utility/Store"], function (require, exports, Session_4, Navigate_1, style_2, Component_16, Link_2, Masthead_1, Sidebar_1, UiEventBus_1, FocusListener_1, HoverListener_1, ViewContainer_1, Env_7, Store_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    async function App() {
        if (location.pathname.startsWith("/auth/")) {
            if (location.pathname.endsWith("/error")) {
                const params = new URLSearchParams(location.search);
                // eslint-disable-next-line no-debugger
                debugger;
                Store_3.default.items.popupError = {
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
        await Session_4.default.refresh();
        HoverListener_1.default.listen();
        FocusListener_1.default.listen();
        document.body.classList.add(...style_2.default.body);
        const masthead = (0, Masthead_1.default)();
        const sidebar = (0, Sidebar_1.default)();
        const view = (0, ViewContainer_1.default)();
        const app = (0, Component_16.default)()
            .style("app")
            .append(masthead, sidebar, view)
            .extend(app => ({
            masthead, sidebar, view,
            navigate: (0, Navigate_1.default)(app),
        }))
            .appendTo(document.body);
        Link_2.default.setNavigator(app.navigate);
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
define("utility/DOMRect", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = default_1;
    function default_1() {
        Object.defineProperty(DOMRect.prototype, "centerX", {
            get() {
                return this.left + this.width / 2;
            },
        });
        Object.defineProperty(DOMRect.prototype, "centerY", {
            get() {
                return this.top + this.height / 2;
            },
        });
    }
});
define("index", ["require", "exports", "App", "utility/Arrays", "utility/DOMRect"], function (require, exports, App_1, Arrays_3, DOMRect_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
    Arrays_3.default.applyPrototypes();
    void (0, App_1.default)();
});
define("ui/Classes", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Classes;
    (function (Classes) {
    })(Classes || (Classes = {}));
    exports.default = Classes;
});
// import { APP_NAME } from "Constants";
// import Async from "utility/Async";
// import { EventManager } from "utility/EventManager";
// import Strings from "utility/Strings";
// import URL from "utility/URL";
// declare global {
// 	const viewManager: typeof ViewManager;
// }
// const registry = Object.fromEntries([
// ].map((view) => [view.id, view as View.Handler<readonly Model<any, any>[]>] as const));
// View.event.subscribe("show", ({ view }) => ViewManager.show(view));
// View.event.subscribe("hide", () => ViewManager.hide());
// URL.event.subscribe("navigate", () => {
// 	ViewManager.showByHash(URL.path ?? URL.hash);
// });
// export interface IViewManagerEvents {
// 	hide: { view: View.WrapperComponent };
// 	show: { view: View.WrapperComponent };
// 	initialise: { view: View.WrapperComponent };
// }
// export default class ViewManager {
// 	public static readonly event = EventManager.make<IViewManagerEvents>();
// 	public static get registry () {
// 		return registry;
// 	}
// 	public static readonly actionRegistry: Record<string, () => any> = {};
// 	public static view?: View.WrapperComponent;
// 	public static getDefaultView () {
// 		return HomeView;
// 	}
// 	public static hasView () {
// 		return !!this.view;
// 	}
// 	public static showDefaultView () {
// 		this.getDefaultView().show();
// 	}
// 	public static showByHash (hash: string | null): void {
// 		if (hash === this.view?.hash)
// 			return;
// 		if (hash === null)
// 			return this.showDefaultView();
// 		const view = registry[hash] ?? registry[Strings.sliceTo(hash, "/")];
// 		if (view?.redirectOnLoad === true || hash === "")
// 			return this.showDefaultView();
// 		else if (view?.redirectOnLoad)
// 			return this.showByHash(view.redirectOnLoad);
// 		if (!view) {
// 			if (this.actionRegistry[hash])
// 				this.actionRegistry[hash]();
// 			else if (location.hash !== `#${hash}`)
// 				console.warn(`Tried to navigate to an unknown view '${hash}'`);
// 			ErrorView.show(404);
// 			return;
// 		}
// 		const args: any[] = [];
// 		if (view !== registry[hash])
// 			args.push(Strings.sliceAfter(hash, "/"));
// 		view.show(...args as []);
// 	}
// 	public static show (view: View.WrapperComponent) {
// 		if (this.view === view)
// 			return;
// 		const oldView = this.view;
// 		if (oldView) {
// 			oldView.event.emit("hide");
// 			this.event.emit("hide", { view: oldView });
// 			oldView.classes.add(View.Classes.Hidden);
// 			void Async.sleep(1000).then(() => oldView.remove());
// 		}
// 		this.view = view;
// 		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
// 		(window as any).view = view;
// 		view.appendTo(document.body);
// 		view.event.until("hide", manager => manager
// 			.subscribe("updateTitle", () => this.updateDocumentTitle(view))
// 			.subscribe("updateHash", () => this.updateHash(view))
// 			.subscribe("back", () => this.hide())
// 			.subscribe("initialise", () => this.event.emit("initialise", { view })));
// 		this.updateDocumentTitle(view);
// 		this.updateHash(view);
// 		this.event.emit("show", { view });
// 	}
// 	private static updateHash (view: View.WrapperComponent) {
// 		if (view.definition.noHashChange)
// 			return;
// 		if (URL.path !== view.hash)
// 			URL.path = view.hash;
// 		if (URL.hash === URL.path)
// 			URL.hash = null;
// 	}
// 	public static hide () {
// 		history.back();
// 	}
// 	private static updateDocumentTitle (view: View.WrapperComponent) {
// 		let name = view.definition.name;
// 		if (typeof name === "function")
// 			name = name(...view._args.slice(1) as []);
// 		document.title = name ? `${name} // ${APP_NAME}` : APP_NAME;
// 	}
// 	public static registerHashAction (hash: string, action: () => any) {
// 		this.actionRegistry[hash] = action;
// 		return this;
// 	}
// }
// window.addEventListener("popstate", event => {
// 	ViewManager.showByHash(URL.path ?? URL.hash);
// 	if (!ViewManager.hasView())
// 		ViewManager.showDefaultView();
// });
// // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
// (window as any).viewManager = ViewManager;
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
                    if (element.component?.active.listening && !newActive.includes(element))
                        element.component.active.value = false;
                for (const element of newActive)
                    if (element.component?.active.listening && !lastActive.includes(element))
                        element.component.active.value = true;
                lastActive = newActive;
            }
        }
        ActiveListener.listen = listen;
    })(ActiveListener || (ActiveListener = {}));
    exports.default = ActiveListener;
    Object.assign(window, { ActiveListener });
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
                const newAbortController = new AbortController();
                info.queued = sleep(Date.now() - info.last + ms, newAbortController.signal).then(aborted => {
                    if (aborted) {
                        return info?.queued;
                    }
                    delete info.queued;
                    delete info.abortController;
                    info.last = Date.now();
                    return callback(...args);
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
            const realCallback = () => {
                try {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    const result = callback(...args);
                    const promise = Promise.resolve(result);
                    debouncedByPromise.set(callback, {
                        promise,
                        nextQueued: false,
                    });
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
define("utility/Database", ["require", "exports", "utility/Arrays", "utility/EventManager", "utility/Objects", "utility/Store"], function (require, exports, Arrays_4, EventManager_3, Objects_3, Store_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Version;
    (function (Version) {
        function encode(...[major, minor]) {
            return (Math.min(major, 2 ** 16) << 16) | Math.min(minor, 2 ** 16);
        }
        Version.encode = encode;
        function decode(encoded) {
            return [encoded >> 16, encoded & 0b1111_1111_1111_1111];
        }
        Version.decode = decode;
    })(Version || (Version = {}));
    class Database {
        schema;
        event = new EventManager_3.EventManager(this);
        database;
        async getDatabase() {
            if (this.database)
                return this.database;
            return this.open();
        }
        constructor(schema) {
            this.schema = schema;
        }
        async get(store, key, index) {
            return this.transaction([store], "readonly", transaction => transaction.get(store, key, index));
        }
        async all(store, rangeOrKey, index) {
            return this.transaction([store], "readonly", transaction => transaction.all(store, rangeOrKey, index));
        }
        async set(store, key, value) {
            return this.transaction([store], transaction => transaction.set(store, key, value));
        }
        async delete(store, key) {
            return this.transaction([store], transaction => transaction.delete(store, key));
        }
        async keys(store) {
            return this.transaction([store], "readonly", transaction => transaction.keys(store));
        }
        async count(store) {
            return this.transaction([store], "readonly", transaction => transaction.count(store));
        }
        async clear(store) {
            return this.transaction([store], transaction => transaction.clear(store));
        }
        async transaction(over, modeOrTransaction, transaction) {
            if (typeof modeOrTransaction !== "string") {
                transaction = modeOrTransaction;
                modeOrTransaction = "readwrite";
            }
            const database = await this.getDatabase();
            const instance = new Database.Transaction(database.transaction(over, modeOrTransaction));
            const result = await transaction(instance);
            await instance.commit();
            return result;
        }
        stagedTransaction(over, mode = "readwrite") {
            return new Database.StagedTransaction(this, over, mode);
        }
        async upgrade(upgrade) {
            await this.close();
            const [, databaseVersionMinor] = (await this.getVersion()) ?? [];
            await this.open((databaseVersionMinor ?? 0) + 1, upgrade);
        }
        async stores() {
            const database = await this.getDatabase();
            return database.objectStoreNames;
        }
        async hasStore(...stores) {
            const database = await this.getDatabase();
            return stores.every(store => database.objectStoreNames.contains(store));
        }
        async createStore(store, options, init) {
            if (await this.hasStore(store))
                return;
            await this.upgrade(async (upgrade) => {
                await init?.(upgrade.createObjectStore(store, options));
            });
        }
        async dispose() {
            await this.close();
            return new Promise((resolve, reject) => {
                const request = indexedDB.deleteDatabase(this.schema.id);
                request.addEventListener("success", () => resolve());
                request.addEventListener("blocked", () => reject(new Error(`Cannot delete database '${this.schema.id}', blocked`)));
                request.addEventListener("error", () => reject(new Error(`Cannot delete database '${this.schema.id}', error: ${request.error?.message ?? "Unknown error"}`)));
            });
        }
        getVersion() {
            // const databaseInfo = (await indexedDB.databases()).find(({ name }) => name === this.schema.id);
            const databaseInfo = Store_4.default.items.databases?.find(({ name }) => name === this.schema.id);
            return databaseInfo?.version ? Version.decode(databaseInfo.version) : undefined;
        }
        async open(versionMinor, upgrade) {
            if (!this.schema.versions.length)
                throw new Error(`No versions in schema for database '${this.schema.id}'`);
            // eslint-disable-next-line @typescript-eslint/no-misused-promises,  no-async-promise-executor
            const databasePromise = new Promise(async (resolve, reject) => {
                const [, databaseVersionMinor] = (await this.getVersion()) ?? [];
                const newVersion = Version.encode(this.schema.versions.length, versionMinor ?? databaseVersionMinor ?? 0);
                const request = indexedDB.open(this.schema.id, newVersion);
                request.addEventListener("blocked", () => {
                    console.log("blocked");
                });
                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                request.addEventListener("upgradeneeded", async (event) => {
                    const transaction = request.transaction;
                    if (!transaction)
                        return;
                    const database = request.result;
                    const [versionMajor] = Version.decode(event.newVersion ?? newVersion);
                    const [oldVersionMajor] = Version.decode(event.oldVersion);
                    for (let i = oldVersionMajor; i < versionMajor; i++)
                        await this.schema.versions[i](database, transaction);
                    await upgrade?.(database, transaction);
                    const databases = Store_4.default.items.databases ?? [];
                    const databaseInfo = databases.find(({ name }) => name === this.schema.id);
                    if (databaseInfo)
                        databaseInfo.version = newVersion;
                    else
                        databases.push({ name: this.schema.id, version: newVersion });
                    Store_4.default.items.databases = databases;
                });
                request.addEventListener("error", () => {
                    console.log("aaaaaaaaaaaaaaaaaaaa");
                    if (request.error?.message.includes("version")) {
                        console.info(`Database '${this.schema.id}' is from the future and must be disposed`);
                        delete this.database;
                        void this.dispose().then(() => {
                            resolve(this.open(versionMinor, upgrade));
                        });
                        return;
                    }
                    reject(new Error(`Cannot create database '${this.schema.id}', error: ${request.error?.message ?? "Unknown error"}`));
                });
                request.addEventListener("success", () => resolve(request.result));
            });
            this.database = databasePromise;
            const database = await databasePromise;
            database.addEventListener("close", () => {
                delete this.database;
                this.event.emit("close");
            });
            this.database = database;
            this.event.emit("open");
            return database;
        }
        async close() {
            if (!this.database)
                return;
            const database = this.database;
            delete this.database;
            (await database).close();
        }
    }
    (function (Database) {
        function schema(id, ...versions) {
            return {
                _schema: null,
                id,
                versions,
            };
        }
        Database.schema = schema;
        class Transaction {
            transaction;
            event = new EventManager_3.EventManager(this);
            complete = false;
            errored = false;
            constructor(transaction) {
                this.transaction = transaction;
                this.transaction.addEventListener("complete", () => {
                    this.complete = true;
                    this.event.emit("complete");
                });
                this.transaction.addEventListener("error", () => {
                    this.errored = true;
                    this.event.emit("error", { error: this.transaction.error });
                });
            }
            async get(name, key, index) {
                return this.do(() => {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                    let store = this.transaction.objectStore(name);
                    if (index !== undefined)
                        store = store.index(index);
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                    return store.get(key);
                });
            }
            async all(name, rangeOrKey, index) {
                if (Array.isArray(rangeOrKey)) {
                    return new Promise((resolve, reject) => {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                        let store = this.transaction.objectStore(name);
                        if (index !== undefined)
                            store = store.index(index);
                        const result = [];
                        const request = store.openCursor();
                        request.addEventListener("error", () => reject(request.error));
                        request.addEventListener("success", event => {
                            const cursor = request.result;
                            if (!cursor)
                                return resolve(result);
                            if (rangeOrKey.includes(cursor.key) || (!isNaN(+cursor.key) && rangeOrKey.includes(+cursor.key)))
                                result.push(cursor.value);
                            cursor.continue();
                        });
                    });
                }
                return this.do(() => {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                    let store = this.transaction.objectStore(name);
                    if (index !== undefined)
                        store = store.index(index);
                    if (typeof rangeOrKey === "string")
                        return store.getAll(rangeOrKey);
                    return store.getAll(rangeOrKey);
                });
            }
            async primaryKeys(name, rangeOrKey, index) {
                return this.do(() => {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                    let store = this.transaction.objectStore(name);
                    if (index !== undefined)
                        store = store.index(index);
                    return store.getAllKeys(rangeOrKey);
                });
            }
            async indexKeys(name, index, mapper) {
                return new Promise((resolve, reject) => {
                    const store = this.transaction.objectStore(name).index(index);
                    const regexDot = /\./g;
                    const keyPath = Arrays_4.default.resolve(store.keyPath)
                        .flatMap(key => key.split(regexDot));
                    const result = new Map();
                    const request = store.openCursor();
                    request.addEventListener("error", () => reject(request.error));
                    request.addEventListener("success", event => {
                        const cursor = request.result;
                        if (!cursor)
                            return resolve([...result.values()]);
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                        const key = Objects_3.default.followPath(cursor.value, keyPath);
                        if ((typeof key === "string" || typeof key === "number") && !result.has(key))
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                            result.set(key, !mapper ? key : mapper(key, cursor.value));
                        cursor.continue();
                    });
                });
            }
            async set(name, key, value) {
                return this.do(() => this.transaction.objectStore(name)
                    .put(value, key))
                    .then(() => { });
            }
            async delete(name, key) {
                return this.do(() => this.transaction.objectStore(name)
                    .delete(key));
            }
            async keys(name) {
                return this.do(() => this.transaction.objectStore(name)
                    .getAllKeys());
            }
            async count(name) {
                return this.do(() => this.transaction.objectStore(name)
                    .count());
            }
            async clear(name) {
                return this.do(() => this.transaction.objectStore(name)
                    .clear());
            }
            async do(operation) {
                if (this.errored || this.complete)
                    throw new Error("Transaction is complete or has errored, no further operations are allowed");
                return new Promise((resolve, reject) => {
                    const request = operation();
                    request.addEventListener("error", () => reject(request.error));
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                    request.addEventListener("success", () => resolve(request.result));
                });
            }
            async commit() {
                if (this.complete || this.errored)
                    return;
                this.complete = true;
                this.transaction.commit();
                return this.event.waitFor("complete");
            }
        }
        Database.Transaction = Transaction;
        class StagedTransaction {
            database;
            over;
            mode;
            constructor(database, over, mode) {
                this.database = database;
                this.over = over;
                this.mode = mode;
            }
            pending = [];
            activeTransaction;
            queue(staged) {
                const resultPromise = new Promise(resolve => {
                    if (typeof staged === "function")
                        this.pending.push(async (transaction) => resolve(await staged(transaction, ...[])));
                    else {
                        staged.resolve = resolve;
                        this.pending.push(staged);
                    }
                });
                void this.tryExhaustQueue();
                return resultPromise;
            }
            async tryExhaustQueue() {
                if (this.activeTransaction)
                    return this.activeTransaction;
                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                this.activeTransaction = (async () => {
                    while (this.pending.length) {
                        const transactions = this.pending.splice(0, Infinity);
                        console.debug(`Found ${transactions.length} staged transactions over:`, ...this.over);
                        const start = performance.now();
                        await this.database.transaction(this.over, this.mode, async (transaction) => {
                            const transactionsByType = {};
                            for (const staged of transactions) {
                                if (typeof staged === "function") {
                                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                                    await staged(transaction);
                                    continue;
                                }
                                transactionsByType[staged.id] ??= [];
                                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                                transactionsByType[staged.id].push(staged);
                            }
                            for (const transactions of Object.values(transactionsByType)) {
                                const data = transactions.flatMap(staged => staged.data);
                                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                                const results = await transactions[0].function(transaction, ...data);
                                if (results.length !== data.length)
                                    throw new Error(`Invalid number of results for ${transactions[0].id} over ${this.over.join(", ")}`);
                                for (let i = 0; i < results.length; i++) {
                                    transactions[i].resolve(results[i]);
                                }
                            }
                        });
                        console.debug(`Completed ${transactions.length} staged transactions in ${performance.now() - start}ms over:`, ...this.over);
                    }
                })();
                await this.activeTransaction;
                delete this.activeTransaction;
            }
            await() {
                return this.tryExhaustQueue();
            }
            async transaction(initialiser) {
                return this.queue(transaction => initialiser(transaction));
            }
            async get(store, key, index) {
                return this.queue(transaction => transaction.get(store, key, index));
                // return this.queue({
                // 	id: `get:${String(store)}:${index ?? "/"}`,
                // 	data: [key],
                // 	function: async (transaction, ...data) =>
                // 		data.length === 1 ? [await transaction.get(store, key, index)]
                // 			: transaction.all(store, data, index),
                // });
            }
            async all(store, range, index) {
                return this.queue(transaction => transaction.all(store, range, index));
            }
            async primaryKeys(store, range, index) {
                return this.queue(transaction => transaction.primaryKeys(store, range, index));
            }
            async indexKeys(store, index, mapper) {
                return this.queue(transaction => transaction.indexKeys(store, index, mapper));
            }
            async set(store, key, value) {
                if (this.mode === "readonly")
                    throw new Error("Cannot modify store in readonly mode");
                return this.queue(transaction => transaction.set(store, key, value));
            }
            async delete(store, key) {
                if (this.mode === "readonly")
                    throw new Error("Cannot modify store in readonly mode");
                return this.queue(transaction => transaction.delete(store, key));
            }
            async keys(store) {
                return this.queue(transaction => transaction.keys(store));
            }
            async count(store) {
                return this.queue(transaction => transaction.count(store));
            }
            async clear(store) {
                if (this.mode === "readonly")
                    throw new Error("Cannot modify store in readonly mode");
                return this.queue(transaction => transaction.clear(store));
            }
        }
        Database.StagedTransaction = StagedTransaction;
    })(Database || (Database = {}));
    exports.default = Database;
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
define("utility/Tuples", ["require", "exports", "utility/Arrays"], function (require, exports, Arrays_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Tuples;
    (function (Tuples) {
        function make(...values) {
            return values;
        }
        Tuples.make = make;
        const nullishFilters = Object.fromEntries(Arrays_5.default.range(6)
            .map(index => make(index, (value) => value[index] !== undefined && value[index] !== null)));
        function filterNullish(index) {
            return nullishFilters[index];
        }
        Tuples.filterNullish = filterNullish;
        const falsyFilters = Object.fromEntries(Arrays_5.default.range(6)
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
define("utility/URL", ["require", "exports", "utility/EventManager"], function (require, exports, EventManager_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let params;
    let query;
    function updateURL() {
        let queryString = query.toString();
        if (queryString)
            queryString = `?${queryString}`;
        history.replaceState(null, "", `${location.origin}${location.pathname}${queryString}${location.hash}`);
    }
    let poppingState = false;
    EventManager_4.EventManager.global.subscribe("popstate", () => {
        poppingState = true;
        URL.event.emit("navigate");
        poppingState = false;
    });
    class URL {
        static event = EventManager_4.EventManager.make();
        static get hash() {
            return location.hash.slice(1);
        }
        static set hash(value) {
            if (!poppingState)
                history.pushState(null, "", `${location.origin}${location.pathname}${location.search}${value ? `#${value}` : ""}`);
        }
        static get path() {
            const path = location.pathname.slice(location.pathname.startsWith("/beta/") ? 6 : 1);
            return !path || path === "/" ? null : path;
        }
        static set path(value) {
            if (value && location.pathname.startsWith("/beta/"))
                value = `/beta/${value}`;
            if (value && !value?.startsWith("/"))
                value = `/${value}`;
            if (!poppingState)
                history.pushState(null, "", `${location.origin}${value ?? "/"}${location.search}`);
        }
        static get params() {
            return params ??= new Proxy(query ??= new URLSearchParams(location.search), {
                has(params, key) {
                    return params.has(key);
                },
                get(params, key) {
                    return params.get(key);
                },
                set(params, key, value) {
                    params.set(key, value);
                    updateURL();
                    return true;
                },
                deleteProperty(params, key) {
                    params.delete(key);
                    updateURL();
                    return true;
                },
            });
        }
    }
    exports.default = URL;
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
define("utility/endpoint/Endpoint2", ["require", "exports"], function (require, exports) {
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
define("utility/maths/Vector2", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IVector2 = void 0;
    var IVector2;
    (function (IVector2) {
        function ZERO() {
            return { x: 0, y: 0 };
        }
        IVector2.ZERO = ZERO;
        function distance(v1, v2) {
            return Math.sqrt((v2.x - v1.x) ** 2 + (v2.y - v1.y) ** 2);
        }
        IVector2.distance = distance;
        function distanceWithin(v1, v2, within) {
            return (v2.x - v1.x) ** 2 + (v2.y - v1.y) ** 2 < within ** 2;
        }
        IVector2.distanceWithin = distanceWithin;
    })(IVector2 || (exports.IVector2 = IVector2 = {}));
});
