var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
define("utility/Env", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Env {
        #loaded = false;
        #onLoad = [];
        get isDev() {
            return this.ENVIRONMENT === 'dev';
        }
        async load() {
            const origin = location.origin;
            const root = location.pathname.startsWith('/beta/') ? '/beta/' : '/';
            Object.assign(this, await fetch(origin + root + 'env.json').then(response => response.json()));
            document.documentElement.classList.add(`environment-${this.ENVIRONMENT}`);
            this.#loaded = true;
            for (const handler of this.#onLoad)
                handler();
            this.#onLoad.length = 0;
        }
        onLoad(environment, handler) {
            if (typeof environment === 'function') {
                handler = environment;
                environment = undefined;
            }
            else if (environment) {
                const originalHandler = handler;
                handler = () => this.ENVIRONMENT === environment && originalHandler?.();
            }
            if (this.#loaded)
                handler?.();
            else if (handler)
                this.#onLoad.push(handler);
        }
    }
    exports.default = new Env();
});
define("utility/Type", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Type;
    (function (Type) {
        function as(type, value) {
            return typeof value === type ? value : undefined;
        }
        Type.as = as;
    })(Type || (Type = {}));
    exports.default = Type;
});
define("utility/Objects", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.mutable = mutable;
    function mutable(object) {
        return object;
    }
    var Objects;
    (function (Objects) {
        Objects.EMPTY = {};
        function keys(object) {
            return Object.keys(object);
        }
        Objects.keys = keys;
        function values(object) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return Object.values(object);
        }
        Objects.values = values;
        function inherit(obj, inherits) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
            Object.setPrototypeOf(obj, inherits.prototype);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return obj;
        }
        Objects.inherit = inherit;
        function filterNullish(object) {
            return filter(object, p => p[1] !== null && p[1] !== undefined);
        }
        Objects.filterNullish = filterNullish;
        function filter(object, filter) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            return Object.fromEntries(Object.entries(object).filter(filter));
        }
        Objects.filter = filter;
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
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
                obj = obj?.[key];
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
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
            if ('value' in descriptor) {
                target[key] = from[key];
                return;
            }
            const compute = descriptor.get?.compute;
            if (!compute)
                return;
            applyJIT(target, key, compute);
        }
        Objects.copyJIT = copyJIT;
        Objects.assign = function (target, ...sources) {
            for (const source of sources) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                for (const key of Object.keys(source)) {
                    const descriptor = Object.getOwnPropertyDescriptor(target, key);
                    if (!descriptor || descriptor.writable) {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
                        target[key] = source[key];
                    }
                }
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return target;
        };
        function merge(a, b) {
            if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null || Array.isArray(a) || Array.isArray(b))
                return (b === undefined ? a : b);
            const result = {};
            for (const key of new Set([...Object.keys(a), ...Object.keys(b)]))
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
                result[key] = merge(a[key], b[key]);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return result;
        }
        Objects.merge = merge;
    })(Objects || (Objects = {}));
    exports.default = Objects;
});
define("utility/string/Strings", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Strings;
    (function (Strings) {
        /**
         * Generates a unique string valid for an ID on an element, in the format `_<base 36 timestamp><base 36 random number>`
         * For example: `_m6rpr4mo02bw589br2ze`
         */
        function uid() {
            return `_${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
        }
        Strings.uid = uid;
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
        function splitOnce(string, separator) {
            const index = string.indexOf(separator);
            if (index === -1)
                return [string];
            return [string.slice(0, index), string.slice(index + separator.length)];
        }
        Strings.splitOnce = splitOnce;
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
            let substring = (string ?? '').trim();
            if (substring[0] === '"')
                substring = substring.slice(1);
            if (substring[substring.length - 1] === '"')
                substring = substring.slice(0, -1);
            return substring.trim();
        }
        Strings.extractFromQuotes = extractFromQuotes;
        function extractFromSquareBrackets(string) {
            let substring = (string ?? '');
            if (substring[0] === '[')
                substring = substring.slice(1).trimStart();
            if (substring[substring.length - 1] === ']')
                substring = substring.slice(0, -1).trimEnd();
            return substring;
        }
        Strings.extractFromSquareBrackets = extractFromSquareBrackets;
        function mergeRegularExpressions(flags, ...expressions) {
            let exprString = '';
            for (const expr of expressions)
                exprString += '|' + expr.source;
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
            variations.push(name + 'd', name + 'ed');
            if (name.endsWith('d'))
                variations.push(...getVariations(name.slice(0, -1)));
            if (name.endsWith('ed'))
                variations.push(...getVariations(name.slice(0, -2)));
            if (name.endsWith('ing')) {
                variations.push(name.slice(0, -3));
                if (name[name.length - 4] === name[name.length - 5])
                    variations.push(name.slice(0, -4));
            }
            else {
                variations.push(name + 'ing', name + name[name.length - 1] + 'ing');
                if (name.endsWith('y'))
                    variations.push(name.slice(0, -1) + 'ing');
            }
            if (name.endsWith('ion')) {
                variations.push(...getVariations(name.slice(0, -3)));
                if (name[name.length - 4] === name[name.length - 5])
                    variations.push(name.slice(0, -4));
            }
            else
                variations.push(name + 'ion');
            if (name.endsWith('er'))
                variations.push(name.slice(0, -1), name.slice(0, -2));
            else {
                variations.push(name + 'r', name + 'er');
                if (name.endsWith('y'))
                    variations.push(name.slice(0, -1) + 'ier');
            }
            if (name.endsWith('ier'))
                variations.push(name.slice(0, -3) + 'y');
            variations.push(name + 's', name + 'es');
            if (name.endsWith('s'))
                variations.push(name.slice(0, -1));
            else {
                if (name.endsWith('y'))
                    variations.push(name.slice(0, -1) + 'ies');
            }
            return variations;
        }
        Strings.getVariations = getVariations;
        function shiftLine(lines, count = 1) {
            for (let i = 0; i < count; i++) {
                const index = lines.indexOf('\n');
                if (index === -1)
                    return lines;
                lines = lines.slice(index + 1);
            }
            return lines;
        }
        Strings.shiftLine = shiftLine;
        const REGEX_APOSTROPHE = /'/g;
        const REGEX_NON_WORD_MULTI = /\W+/g;
        function getWords(text) {
            return text.toLowerCase()
                .replace(REGEX_APOSTROPHE, '')
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
                .join('');
        }
        Strings.toTitleCase = toTitleCase;
    })(Strings || (Strings = {}));
    exports.default = Strings;
});
define("utility/Time", ["require", "exports", "utility/string/Strings"], function (require, exports, Strings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Strings_1 = __importDefault(Strings_1);
    var Time;
    (function (Time) {
        function floor(interval) {
            return Math.floor(Date.now() / interval) * interval;
        }
        Time.floor = floor;
        Time.frame = seconds(1) / 144;
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
        function relative(unixTimeMs, options = {}) {
            let ms = unixTimeMs - Date.now();
            const locale = navigator.language || 'en-NZ';
            if (!locale.startsWith('en'))
                return relativeIntl(ms, locale, options);
            if (Math.abs(ms) < seconds(1))
                return 'now';
            const ago = ms < 0;
            if (ago)
                ms = Math.abs(ms);
            let limit = options.components ?? Infinity;
            let value = ms;
            let result = !ago && options.label !== false ? 'in ' : '';
            value = Math.floor(ms / years(1));
            ms -= value * years(1);
            if (value && limit-- > 0)
                result += `${value} year${value === 1 ? '' : 's'}${limit > 0 ? ', ' : ''}`;
            value = Math.floor(ms / months(1));
            ms -= value * months(1);
            if (value && limit-- > 0)
                result += `${value} month${value === 1 ? '' : 's'}${limit > 0 ? ', ' : ''}`;
            value = Math.floor(ms / weeks(1));
            ms -= value * weeks(1);
            if (value && limit-- > 0)
                result += `${value} week${value === 1 ? '' : 's'}${limit > 0 ? ', ' : ''}`;
            value = Math.floor(ms / days(1));
            ms -= value * days(1);
            if (value && limit-- > 0)
                result += `${value} day${value === 1 ? '' : 's'}${limit > 0 ? ', ' : ''}`;
            value = Math.floor(ms / hours(1));
            ms -= value * hours(1);
            if (value && limit-- > 0)
                result += `${value} hour${value === 1 ? '' : 's'}${limit > 0 ? ', ' : ''}`;
            value = Math.floor(ms / minutes(1));
            ms -= value * minutes(1);
            if (value && limit-- > 0)
                result += `${value} minute${value === 1 ? '' : 's'}${limit > 0 ? ', ' : ''}`;
            value = Math.floor(ms / seconds(1));
            if (value && limit-- > 0 && (!options.secondsExclusive || !result.includes(',')))
                result += `${value} second${value === 1 ? '' : 's'}`;
            result = Strings_1.default.trimTextMatchingFromEnd(result, ', ');
            return `${result}${ago && options.label !== false ? ' ago' : ''}`;
        }
        Time.relative = relative;
        function relativeIntl(ms, locale, options) {
            const rtf = new Intl.RelativeTimeFormat(locale, options);
            let value = ms;
            value = Math.floor(ms / years(1));
            if (value)
                return rtf.format(value, 'year');
            value = Math.floor(ms / months(1));
            if (value)
                return rtf.format(value, 'month');
            value = Math.floor(ms / weeks(1));
            if (value)
                return rtf.format(value, 'week');
            value = Math.floor(ms / days(1));
            if (value)
                return rtf.format(value, 'day');
            value = Math.floor(ms / hours(1));
            if (value)
                return rtf.format(value, 'hour');
            value = Math.floor(ms / minutes(1));
            if (value)
                return rtf.format(value, 'minute');
            value = Math.floor(ms / seconds(1));
            return rtf.format(value, 'second');
        }
        function absolute(ms, options = { dateStyle: 'full', timeStyle: 'medium' }) {
            const locale = navigator.language || 'en-NZ';
            const rtf = new Intl.DateTimeFormat(locale, options);
            return rtf.format(ms);
        }
        Time.absolute = absolute;
    })(Time || (Time = {}));
    Object.assign(window, { Time });
    exports.default = Time;
});
define("endpoint/Endpoint", ["require", "exports", "utility/Env", "utility/Objects", "utility/Time"], function (require, exports, Env_1, Objects_1, Time_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Env_1 = __importDefault(Env_1);
    Objects_1 = __importDefault(Objects_1);
    Time_1 = __importDefault(Time_1);
    function Endpoint(route, method, headers) {
        let pageSize;
        const endpoint = {
            route,
            header(header, value) {
                headers ??= {};
                headers[header] = value;
                return endpoint;
            },
            headers(h) {
                headers = { ...headers, ...h };
                return endpoint;
            },
            removeHeader(header) {
                delete headers?.[header];
                return endpoint;
            },
            getPageSize: () => pageSize,
            setPageSize: (size) => {
                pageSize = size;
                return endpoint;
            },
            noResponse: () => endpoint.removeHeader('Accept'),
            query: query,
            prep: (...parameters) => {
                const endpoint = Endpoint(route, method, headers);
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                return Object.assign(endpoint, {
                    query: (...p2) => {
                        const newParameters = [];
                        const length = Math.max(parameters.length, p2.length);
                        for (let i = 0; i < length; i++)
                            newParameters.push(Objects_1.default.merge(parameters[i], p2[i]));
                        const ownPageSize = pageSize;
                        pageSize = endpoint.getPageSize();
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                        const result = query(...newParameters);
                        pageSize = ownPageSize;
                        return result;
                    },
                });
            },
        };
        return endpoint;
        async function query(data, search) {
            const body = !data?.body ? undefined : JSON.stringify(data.body);
            const url = route.slice(1)
                .replaceAll(/\{([^}]+)\}/g, (match, paramName) => 
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            encodeURIComponent(String(data?.params?.[paramName] ?? '')));
            const params = Object.entries(search ?? {})
                .map(([param, value]) => [param, typeof value === 'string' ? value : JSON.stringify(value)])
                .collect(searchEntries => new URLSearchParams(searchEntries));
            if (pageSize)
                params.set('page_size', `${pageSize}`);
            const qs = params.size ? '?' + params.toString() : '';
            let error;
            const response = await fetch(`${Env_1.default.API_ORIGIN}${url}${qs}`, {
                method,
                headers: {
                    'Content-Type': body ? 'application/json' : undefined,
                    'Accept': 'application/json',
                    ...headers,
                },
                credentials: 'include',
                body,
                signal: AbortSignal.timeout(Time_1.default.seconds(5)),
            }).catch((e) => {
                if (e.name === 'AbortError') {
                    error = Object.assign(new Error('Request timed out'), {
                        code: 408,
                        data: null,
                        headers: new Headers(),
                    });
                    return;
                }
                if (e.name === 'TypeError' && /invalid URL|Failed to construct/.test(e.message))
                    throw e;
                if (e.name === 'TypeError' || e.name === 'NetworkError') {
                    error = Object.assign(new Error('Network connection failed'), {
                        code: 503,
                        data: null,
                        headers: new Headers(),
                    });
                    return;
                }
                if (!error)
                    throw e;
            });
            if (error || !response) // will always mean the same thing, but ts doesn't know that
                return error;
            const code = response.status;
            if (code !== 200) {
                error = Object.assign(new Error(response.statusText), { code, retry: () => query(data) });
                delete error.stack;
            }
            const responseHeaders = { headers: response.headers };
            if (!response.body)
                return Object.assign(error ?? {}, responseHeaders);
            const responseType = response.headers.get('Content-Type');
            if (responseType === 'application/json') {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                const json = await response.json().catch(e => {
                    const e2 = e instanceof Error ? e : new Error('Failed to parse JSON');
                    Object.defineProperty(e2, 'code', { value: code, configurable: true, writable: true });
                    Object.defineProperty(e2, 'retry', { value: () => query(data), configurable: true });
                    error ??= e2;
                    delete error.stack;
                });
                if (error)
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                    return Object.assign(error, json, responseHeaders);
                const paginated = json;
                if (paginated.has_more) {
                    Object.assign(json, {
                        next: () => query(data, {
                            ...search,
                            ...[...params].toObject(),
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                            page: +(params.get('page') ?? search?.page ?? json.page ?? 0) + 1,
                        }),
                        getPage: (page) => query(data, { ...search, page }),
                    });
                }
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                return Object.assign(json, responseHeaders);
            }
            throw new Error(`Response type ${responseType} is not supported`);
        }
    }
    exports.default = Endpoint;
});
define("endpoint/manifest/EndpointFormInputLengths", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_1 = __importDefault(Endpoint_1);
    exports.default = (0, Endpoint_1.default)('/manifest/form/lengths', 'get');
});
define("endpoint/auth/EndpointAuthDelete", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_2 = __importDefault(Endpoint_2);
    exports.default = (0, Endpoint_2.default)('/auth/delete', 'post')
        .noResponse();
});
define("endpoint/session/EndpointSessionGet", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_3 = __importDefault(Endpoint_3);
    exports.default = (0, Endpoint_3.default)('/session', 'get');
});
define("endpoint/session/EndpointSessionReset", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_4 = __importDefault(Endpoint_4);
    exports.default = (0, Endpoint_4.default)('/session/reset', 'post')
        .noResponse();
});
define("ui/component/core/ext/ComponentInsertionTransaction", ["require", "exports", "utility/State"], function (require, exports, State_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    State_1 = __importDefault(State_1);
    function ComponentInsertionTransaction(component, onEnd) {
        let unuseComponentRemove = component?.removed.useManual(removed => removed && onComponentRemove());
        const closed = (0, State_1.default)(false);
        let removed = false;
        const result = {
            isInsertionDestination: true,
            closed,
            get size() {
                return component?.element.children.length ?? 0;
            },
            append(...contents) {
                if (closed.value)
                    return result;
                component?.append(...contents);
                return result;
            },
            prepend(...contents) {
                if (closed.value)
                    return result;
                component?.prepend(...contents);
                return result;
            },
            insert(direction, sibling, ...contents) {
                if (closed.value)
                    return result;
                component?.insert(direction, sibling, ...contents);
                return result;
            },
            abort() {
                if (closed.value)
                    return;
                close();
            },
            close() {
                if (closed.value)
                    return;
                if (!removed)
                    onEnd?.(result);
                close();
            },
        };
        return result;
        function close() {
            closed.value = true;
            unuseComponentRemove?.();
            unuseComponentRemove = undefined;
            component = undefined;
        }
        function onComponentRemove() {
            unuseComponentRemove?.();
            unuseComponentRemove = undefined;
            removed = true;
            result.close();
        }
    }
    exports.default = ComponentInsertionTransaction;
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
        catch { }
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
            catch { }
        }
        Define.magic = magic;
        function set(obj, key, value) {
            try {
                Object.defineProperty(obj, key, {
                    configurable: true,
                    writable: true,
                    value,
                });
            }
            catch { }
            return value;
        }
        Define.set = set;
    })(Define || (Define = {}));
    exports.default = Define;
});
define("utility/Arrays", ["require", "exports", "utility/Define"], function (require, exports, Define_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NonNullish = NonNullish;
    exports.Truthy = Truthy;
    Define_1 = __importDefault(Define_1);
    function NonNullish(value) {
        return value !== null && value !== undefined;
    }
    function Truthy(value) {
        return !!value;
    }
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
         * Remove all instances of the given value from the given array.
         * @returns `true` if anything removed, `false` otherwise
         */
        function removeAll(array, ...values) {
            if (!array)
                return false;
            let removed = false;
            let insertIndex = 0;
            for (let i = 0; i < array.length; i++) {
                if (values.includes(array[i])) {
                    removed = true;
                    // do not increment insertion index so subsequent values will be swapped over the removed one
                    continue;
                }
                if (insertIndex !== i)
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    array[insertIndex] = array[i];
                insertIndex++;
            }
            array.length = insertIndex; // trim
            return removed;
        }
        Arrays.removeAll = removeAll;
        /**
         * Removes all values matching the given predicate from the array.
         * @returns `true` if removed, `false` otherwise
         */
        function removeWhere(array, predicate) {
            if (!array)
                return false;
            let removed = false;
            let insertIndex = 0;
            for (let i = 0; i < array.length; i++) {
                if (predicate(array[i], i, array)) {
                    removed = true;
                    // do not increment insertion index so subsequent values will be swapped over the removed one
                    continue;
                }
                if (insertIndex !== i)
                    array[insertIndex] = array[i];
                insertIndex++;
            }
            array.length = insertIndex; // trim
            return removed;
        }
        Arrays.removeWhere = removeWhere;
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
                throw new Error('Invalid step for range');
            const result = [];
            if (end === undefined)
                end = start, start = 0;
            step = end < start ? -1 : 1;
            for (let i = start; step > 0 ? i < end : i > end; i += step)
                result.push(i);
            return result;
        }
        Arrays.range = range;
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
            (0, Define_1.default)(Array.prototype, 'findLast', function (predicate) {
                if (this.length > 0)
                    for (let i = this.length - 1; i >= 0; i--)
                        if (predicate(this[i], i, this))
                            return this[i];
                return undefined;
            });
            (0, Define_1.default)(Array.prototype, 'findLastIndex', function (predicate) {
                if (this.length > 0)
                    for (let i = this.length - 1; i >= 0; i--)
                        if (predicate(this[i], i, this))
                            return i;
                return -1;
            });
            const originalSort = Array.prototype.sort;
            (0, Define_1.default)(Array.prototype, 'sort', function (...sorters) {
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
            (0, Define_1.default)(Array.prototype, 'collect', function (collector, ...args) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                return collector?.(this, ...args);
            });
            (0, Define_1.default)(Array.prototype, 'splat', function (collector, ...args) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                return collector?.(...this, ...args);
            });
            (0, Define_1.default)(Array.prototype, 'toObject', function (mapper) {
                return Object.fromEntries(mapper ? this.map(mapper) : this);
            });
            (0, Define_1.default)(Array.prototype, 'toMap', function (mapper) {
                return new Map(mapper ? this.map(mapper) : this);
            });
            (0, Define_1.default)(Array.prototype, 'distinct', function (mapper) {
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
            (0, Define_1.default)(Array.prototype, 'distinctInPlace', function (mapper) {
                const encountered = [];
                let insertionPosition = 0;
                for (const value of this) {
                    const encounterValue = mapper ? mapper(value) : value;
                    if (encountered.includes(encounterValue))
                        continue;
                    encountered.push(encounterValue);
                    this[insertionPosition++] = value;
                }
                this.length = insertionPosition;
                return this;
            });
            (0, Define_1.default)(Array.prototype, 'findMap', function (predicate, mapper) {
                for (let i = 0; i < this.length; i++)
                    if (predicate(this[i], i, this))
                        return mapper(this[i], i, this);
                return undefined;
            });
            (0, Define_1.default)(Array.prototype, 'groupBy', function (grouper) {
                const result = {};
                for (let i = 0; i < this.length; i++)
                    (result[String(grouper(this[i], i, this))] ??= []).push(this[i]);
                return Object.entries(result);
            });
            (0, Define_1.default)(Array.prototype, 'filterInPlace', function (filter) {
                Arrays.removeWhere(this, (value, index, arr) => !filter(value, index, arr));
                return this;
            });
            (0, Define_1.default)(Array.prototype, 'mapInPlace', function (mapper) {
                return this.splice(0, Infinity, ...this.map(mapper));
            });
        }
        Arrays.applyPrototypes = applyPrototypes;
    })(Arrays || (Arrays = {}));
    exports.default = Arrays;
});
define("utility/Functions", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Functions;
    (function (Functions) {
        Functions.NO_OP = () => { };
        function resolve(fn, ...args) {
            return typeof fn === 'function' ? fn(...args) : fn;
        }
        Functions.resolve = resolve;
    })(Functions || (Functions = {}));
    exports.default = Functions;
});
define("utility/State", ["require", "exports", "utility/Arrays", "utility/Define", "utility/Functions"], function (require, exports, Arrays_1, Define_2, Functions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Define_2 = __importDefault(Define_2);
    Functions_1 = __importDefault(Functions_1);
    const SYMBOL_UNSUBSCRIBE = Symbol('UNSUBSCRIBE');
    const SYMBOL_VALUE = Symbol('VALUE');
    const SYMBOL_SUBSCRIBERS = Symbol('SUBSCRIBERS');
    function State(defaultValue, equals) {
        let unuseBoundState;
        const result = {
            isState: true,
            setId(id) {
                result.id = id;
                return result;
            },
            [SYMBOL_VALUE]: defaultValue,
            [SYMBOL_SUBSCRIBERS]: [],
            get value() {
                return result[SYMBOL_VALUE];
            },
            set value(value) {
                unuseBoundState?.();
                setValue(value);
            },
            setValue(value) {
                unuseBoundState?.();
                setValue(value);
                return result;
            },
            equals: value => equals === false ? false
                : result[SYMBOL_VALUE] === value || equals?.(result[SYMBOL_VALUE], value) || false,
            emit: oldValue => {
                if (result.id !== undefined)
                    console.log('emit', result.id);
                for (const subscriber of result[SYMBOL_SUBSCRIBERS].slice())
                    subscriber(result[SYMBOL_VALUE], oldValue);
                return result;
            },
            bind(owner, state) {
                if (state.id)
                    console.log('bind', state.id);
                unuseBoundState?.();
                unuseBoundState = state.use(owner, setValue);
                return unuseBoundState;
            },
            bindManual(state) {
                if (state.id)
                    console.log('bind', state.id);
                unuseBoundState?.();
                unuseBoundState = state.useManual(setValue);
                return unuseBoundState;
            },
            use: (owner, subscriber) => {
                result.subscribe(owner, subscriber);
                subscriber(result[SYMBOL_VALUE], undefined);
                return () => result.unsubscribe(subscriber);
            },
            useManual: subscriber => {
                result.subscribeManual(subscriber);
                subscriber(result[SYMBOL_VALUE], undefined);
                return () => result.unsubscribe(subscriber);
            },
            subscribe: (owner, subscriber) => {
                const ownerClosedState = State.Owner.getOwnershipState(owner);
                if (!ownerClosedState || ownerClosedState.value)
                    return Functions_1.default.NO_OP;
                function cleanup() {
                    ownerClosedState.unsubscribe(cleanup);
                    result.unsubscribe(subscriber);
                    fn[SYMBOL_UNSUBSCRIBE]?.delete(cleanup);
                }
                State.OwnerMetadata.setHasSubscriptions(owner);
                const fn = subscriber;
                fn[SYMBOL_UNSUBSCRIBE] ??= new Set();
                fn[SYMBOL_UNSUBSCRIBE].add(cleanup);
                ownerClosedState.subscribeManual(cleanup);
                result.subscribeManual(subscriber);
                return cleanup;
            },
            subscribeManual: subscriber => {
                result[SYMBOL_SUBSCRIBERS].push(subscriber);
                return () => result.unsubscribe(subscriber);
            },
            unsubscribe: subscriber => {
                result[SYMBOL_SUBSCRIBERS].filterInPlace(s => s !== subscriber);
                return result;
            },
            await(owner, values, then) {
                result.subscribe(owner, function awaitValue(newValue) {
                    if (newValue !== values && (!Array.isArray(values) || !values.includes(newValue)))
                        return;
                    result.unsubscribe(awaitValue);
                    then(newValue);
                });
                return result;
            },
            awaitManual(values, then) {
                result.subscribeManual(function awaitValue(newValue) {
                    if (newValue !== values && (!Array.isArray(values) || !values.includes(newValue)))
                        return;
                    result.unsubscribe(awaitValue);
                    then(newValue);
                });
                return result;
            },
            map: (owner, mapper, equals) => State.Map(owner, [result], mapper, equals),
            mapManual: (mapper, equals) => State.MapManual([result], mapper, equals),
            get nonNullish() {
                return Define_2.default.set(result, 'nonNullish', State
                    .Generator(() => result.value !== undefined && result.value !== null)
                    .observeManual(result));
            },
            get truthy() {
                return Define_2.default.set(result, 'truthy', State
                    .Generator(() => !!result.value)
                    .observeManual(result));
            },
            get not() {
                return getNot();
            },
            get falsy() {
                return getNot();
            },
        };
        result.asMutable = result;
        return result;
        function setValue(value) {
            if (equals !== false && (result[SYMBOL_VALUE] === value || equals?.(result[SYMBOL_VALUE], value)))
                return;
            const oldValue = result[SYMBOL_VALUE];
            result[SYMBOL_VALUE] = value;
            result.emit(oldValue);
        }
        function getNot() {
            const not = State
                .Generator(() => !result.value)
                .observeManual(result);
            Define_2.default.set(result, 'not', not);
            Define_2.default.set(result, 'falsy', not);
            return not;
        }
    }
    (function (State) {
        let Owner;
        (function (Owner) {
            function getOwnershipState(ownerIn) {
                const owner = ownerIn;
                return owner.removed ?? owner.closed;
            }
            Owner.getOwnershipState = getOwnershipState;
            let ownerConstructor;
            function setConstructor(constructor) {
                ownerConstructor = constructor;
            }
            Owner.setConstructor = setConstructor;
            function create() {
                return ownerConstructor();
            }
            Owner.create = create;
        })(Owner = State.Owner || (State.Owner = {}));
        function is(value) {
            return typeof value === 'object' && value?.isState === true;
        }
        State.is = is;
        function get(value) {
            return is(value) ? value : State(value);
        }
        State.get = get;
        function value(state) {
            return is(state) ? state.value : state;
        }
        State.value = value;
        const SYMBOL_HAS_SUBSCRIPTIONS = Symbol('HAS_SUBSCRIPTIONS');
        let OwnerMetadata;
        (function (OwnerMetadata) {
            function setHasSubscriptions(owner) {
                owner[SYMBOL_HAS_SUBSCRIPTIONS] = true;
            }
            OwnerMetadata.setHasSubscriptions = setHasSubscriptions;
            function hasSubscriptions(owner) {
                return owner[SYMBOL_HAS_SUBSCRIPTIONS] === true;
            }
            OwnerMetadata.hasSubscriptions = hasSubscriptions;
        })(OwnerMetadata = State.OwnerMetadata || (State.OwnerMetadata = {}));
        function Generator(generate, equals) {
            const result = State(undefined, equals);
            delete result.asMutable;
            Define_2.default.magic(result, 'value', {
                get: () => result[SYMBOL_VALUE],
            });
            let initial = true;
            let unuseInternalState;
            result.refresh = () => {
                unuseInternalState?.();
                unuseInternalState = undefined;
                const value = generate();
                if (State.is(value)) {
                    unuseInternalState = value.useManual(value => {
                        if (result.equals(value))
                            return result;
                        const oldValue = result[SYMBOL_VALUE];
                        result[SYMBOL_VALUE] = value;
                        result.emit(oldValue);
                    });
                    return result;
                }
                if (result.equals(value) && !initial)
                    return result;
                initial = false;
                const oldValue = result[SYMBOL_VALUE];
                result[SYMBOL_VALUE] = value;
                result.emit(oldValue);
                return result;
            };
            result.refresh();
            result.observe = (owner, ...states) => {
                const ownerClosedState = Owner.getOwnershipState(owner);
                if (!ownerClosedState || ownerClosedState.value)
                    return result;
                OwnerMetadata.setHasSubscriptions(owner);
                for (const state of states)
                    state?.subscribeManual(result.refresh);
                let unuseOwnerRemove = ownerClosedState.subscribeManual(removed => removed && onRemove());
                return result;
                function onRemove() {
                    unuseOwnerRemove?.();
                    unuseOwnerRemove = undefined;
                    for (const state of states)
                        state?.unsubscribe(result.refresh);
                }
            };
            result.observeManual = (...states) => {
                for (const state of states)
                    state?.subscribeManual(result.refresh);
                return result;
            };
            result.unobserve = (...states) => {
                for (const state of states)
                    state?.unsubscribe(result.refresh);
                return result;
            };
            return result;
        }
        State.Generator = Generator;
        function JIT(generate) {
            const result = State(undefined);
            delete result.asMutable;
            let isCached = false;
            let cached;
            let unuseInternalState;
            let owner;
            Define_2.default.magic(result, 'value', {
                get: () => {
                    if (!isCached) {
                        unuseInternalState?.();
                        unuseInternalState = undefined;
                        owner?.remove();
                        owner = undefined;
                        isCached = true;
                        owner = Owner.create();
                        const result = generate(owner);
                        if (State.is(result))
                            unuseInternalState = result.useManual(value => cached = value);
                        else
                            cached = result;
                    }
                    return cached;
                },
            });
            const get = () => result.value;
            result.emit = () => {
                for (const subscriber of result[SYMBOL_SUBSCRIBERS].slice())
                    subscriber(get, cached);
                return result;
            };
            result.use = (owner, subscriber) => {
                result.subscribe(owner, subscriber);
                subscriber(get, undefined);
                return () => result.unsubscribe(subscriber);
            };
            result.useManual = subscriber => {
                result.subscribeManual(subscriber);
                subscriber(get, undefined);
                return () => result.unsubscribe(subscriber);
            };
            result.markDirty = () => {
                unuseInternalState?.();
                unuseInternalState = undefined;
                owner?.remove();
                owner = undefined;
                const oldValue = cached;
                isCached = false;
                cached = undefined;
                result.emit(oldValue);
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
        function Truthy(owner, state) {
            return Generator(() => !!state.value)
                .observe(owner, state);
        }
        State.Truthy = Truthy;
        function NonNullish(owner, state) {
            return Generator(() => state.value !== undefined && state.value !== null)
                .observe(owner, state);
        }
        State.NonNullish = NonNullish;
        function Falsy(owner, state) {
            return Generator(() => !!state.value)
                .observe(owner, state);
        }
        State.Falsy = Falsy;
        function Some(owner, ...anyOfStates) {
            return Generator(() => anyOfStates.some(state => state.value))
                .observe(owner, ...anyOfStates);
        }
        State.Some = Some;
        function Every(owner, ...anyOfStates) {
            return Generator(() => anyOfStates.every(state => state.value))
                .observe(owner, ...anyOfStates);
        }
        State.Every = Every;
        function Map(owner, inputs, outputGenerator, equals) {
            return Generator(() => outputGenerator(...inputs.map(input => input?.value)), equals)
                .observe(owner, ...inputs.filter(Arrays_1.NonNullish));
        }
        State.Map = Map;
        function MapManual(inputs, outputGenerator, equals) {
            return Generator(() => outputGenerator(...inputs.map(input => input?.value)), equals)
                .observeManual(...inputs.filter(Arrays_1.NonNullish));
        }
        State.MapManual = MapManual;
        function Use(owner, input) {
            return Generator(() => Object.entries(input).toObject(([key, state]) => [key, state?.value]))
                .observe(owner, ...Object.values(input).filter(Arrays_1.NonNullish));
        }
        State.Use = Use;
        function UseManual(input) {
            return Generator(() => Object.entries(input).toObject(([key, state]) => [key, state?.value]))
                .observeManual(...Object.values(input).filter(Arrays_1.NonNullish));
        }
        State.UseManual = UseManual;
    })(State || (State = {}));
    exports.default = State;
});
define("ui/utility/BrowserListener", ["require", "exports", "utility/State"], function (require, exports, State_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    State_2 = __importDefault(State_2);
    var BrowserListener;
    (function (BrowserListener) {
        BrowserListener.isWebkit = (0, State_2.default)(/AppleWebKit/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent));
    })(BrowserListener || (BrowserListener = {}));
    exports.default = BrowserListener;
});
define("ui/utility/FontsListener", ["require", "exports", "utility/State"], function (require, exports, State_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    State_3 = __importDefault(State_3);
    var FontsListener;
    (function (FontsListener) {
        FontsListener.loaded = (0, State_3.default)(false);
        async function listen() {
            await document.fonts.ready;
            FontsListener.loaded.asMutable?.setValue(true);
        }
        FontsListener.listen = listen;
    })(FontsListener || (FontsListener = {}));
    exports.default = FontsListener;
});
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../tasks/server/messages/MessageTypeRegistry.d.ts" />
define("utility/DevServer", ["require", "exports", "utility/Env"], function (require, exports, Env_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Env_2 = __importDefault(Env_2);
    const handlerRegistry = {};
    let socket = undefined;
    const DevServer = {
        connect() {
            if (socket)
                return;
            if (Env_2.default.ENVIRONMENT !== 'dev')
                return;
            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${wsProtocol}//${window.location.host}`;
            socket = new WebSocket(wsUrl);
            socket.addEventListener('message', event => {
                try {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                    const message = JSON.parse(event.data);
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    const { type, data } = typeof message === 'object' && message !== null ? message : {};
                    const handlers = handlerRegistry[type];
                    if (!handlers?.length) {
                        console.warn('No handler for devserver message type:', type);
                        return;
                    }
                    for (const handler of handlers)
                        handler(type, data);
                }
                catch {
                    console.warn('Unsupported devserver message:', event.data);
                }
            });
        },
        onMessage(type, handler) {
            handlerRegistry[type] ??= [];
            handlerRegistry[type].push(handler);
        },
        close() {
            socket?.close();
            socket = undefined;
        },
    };
    exports.default = DevServer;
});
define("utility/Script", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Script;
    (function (Script) {
        function allowModuleRedefinition(...paths) {
            for (const path of paths)
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                window.allowRedefine(path);
        }
        Script.allowModuleRedefinition = allowModuleRedefinition;
        async function reload(path) {
            document.querySelector(`script[src^="${path}"]`)?.remove();
            const script = document.createElement('script');
            script.src = `${path}?${Date.now()}`;
            return new Promise((resolve, reject) => {
                script.onload = () => resolve();
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }
        Script.reload = reload;
    })(Script || (Script = {}));
    exports.default = Script;
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
                    signal.removeEventListener('abort', onAbort);
                    resolve(false);
                }, ms);
                signal.addEventListener('abort', onAbort, { once: true });
            });
        }
        Async.sleep = sleep;
        function debounce(...args) {
            let ms;
            let callback;
            if (typeof args[0] === 'function') {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                [callback, ...args] = args;
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                return debounceByPromise(callback, ...args);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                [ms, callback, ...args] = args;
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return
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
                    const result = callback(...args);
                    const promise = Promise.resolve(result);
                    debouncedByPromise.set(callback, {
                        promise,
                        nextQueued: false,
                    });
                    callback = undefined;
                    promise.catch(reason => {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                        window.dispatchEvent(new PromiseRejectionEvent('unhandledrejection', { promise, reason }));
                    });
                    return promise;
                }
                catch (error) {
                    window.dispatchEvent(new ErrorEvent('error', { error }));
                    return;
                }
            };
            if (debounceInfo) {
                debounceInfo.nextQueued = true;
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
            if (typeof args[0] === 'function') {
                // (cb, ...args)
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                [callback, ...args] = args;
            }
            else if (typeof args[1] === 'function') {
                // (ms, cb, ...args)
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                [ms, callback, ...args] = args;
            }
            else if (typeof args[2] === 'function') {
                // (ms, debounce | signal, cb, ...args)
                if (typeof args[1] === 'object') {
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
                    signal?.removeEventListener('abort', result.cancel);
                    result.cancelled = true;
                    window.clearTimeout(timeoutId);
                    for (const callback of cancelCallbacks) {
                        try {
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment
                            const result = callback(...args);
                            const promise = Promise.resolve(result);
                            promise.catch(reason => {
                                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                                window.dispatchEvent(new PromiseRejectionEvent('unhandledrejection', { promise, reason }));
                            });
                        }
                        catch (error) {
                            window.dispatchEvent(new ErrorEvent('error', { error }));
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
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                            const result = callback(...args);
                            const promise = Promise.resolve(result);
                            promise.catch(reason => {
                                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                                window.dispatchEvent(new PromiseRejectionEvent('unhandledrejection', { promise, reason }));
                            });
                        }
                        catch (error) {
                            window.dispatchEvent(new ErrorEvent('error', { error }));
                        }
                    }
                    else {
                        cancelCallbacks.push(callback);
                    }
                    return result;
                },
            };
            signal?.addEventListener('abort', result.cancel, { once: true });
            timeoutId = window.setTimeout(() => {
                if (result.cancelled) {
                    return;
                }
                signal?.removeEventListener('abort', result.cancel);
                result.completed = true;
                cancelCallbacks.length = 0;
                try {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment
                    const result = debounceMs ? debounce(debounceMs, callback, ...args) : callback(...args);
                    const promise = Promise.resolve(result);
                    promise.catch(reason => {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                        window.dispatchEvent(new PromiseRejectionEvent('unhandledrejection', { promise, reason }));
                    });
                }
                catch (error) {
                    window.dispatchEvent(new ErrorEvent('error', { error }));
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
define("utility/Task", ["require", "exports", "utility/Async", "utility/Time"], function (require, exports, Async_1, Time_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Async_1 = __importDefault(Async_1);
    Time_2 = __importDefault(Time_2);
    const DEFAULT_INTERVAL = Time_2.default.seconds(1) / 144;
    class Task {
        interval;
        static async yield(instantIfUnsupported = false) {
            if (typeof scheduler !== 'undefined' && typeof scheduler.yield === 'function')
                return scheduler.yield();
            if (!instantIfUnsupported)
                await Async_1.default.sleep(1);
        }
        static post(callback, priority) {
            if (typeof scheduler === 'undefined' || typeof scheduler.postTask !== 'function')
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
define("utility/Style", ["require", "exports", "utility/State", "utility/Task"], function (require, exports, State_4, Task_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    State_4 = __importDefault(State_4);
    Task_1 = __importDefault(Task_1);
    var Style;
    (function (Style) {
        Style.properties = State_4.default.JIT(() => window.getComputedStyle(document.documentElement));
        const measured = {};
        function measure(property) {
            if (measured[property])
                return measured[property];
            return Style.properties.mapManual(properties => {
                const value = properties.getPropertyValue(property);
                const element = document.createElement('div');
                element.style.width = value;
                element.style.pointerEvents = 'none';
                element.style.opacity = '0';
                document.body.appendChild(element);
                const state = measured[property] = (0, State_4.default)(0);
                void Task_1.default.yield().then(() => {
                    state.value = element.clientWidth;
                    element.remove();
                });
                return measured[property];
            });
        }
        Style.measure = measure;
        async function reload(path) {
            const oldStyle = document.querySelector(`link[rel=stylesheet][href^="${path}"]`);
            const style = document.createElement('link');
            style.rel = 'stylesheet';
            style.href = `${path}?${Date.now()}`;
            return new Promise((resolve, reject) => {
                style.onload = () => resolve();
                style.onerror = reject;
                document.head.appendChild(style);
            }).finally(() => oldStyle?.remove());
        }
        Style.reload = reload;
    })(Style || (Style = {}));
    exports.default = Style;
});
define("ui/utility/StyleManipulator", ["require", "exports", "style", "utility/DevServer", "utility/Env", "utility/Script", "utility/State", "utility/Style"], function (require, exports, style_1, DevServer_1, Env_3, Script_1, State_5, Style_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    style_1 = __importDefault(style_1);
    DevServer_1 = __importDefault(DevServer_1);
    Env_3 = __importDefault(Env_3);
    Script_1 = __importDefault(Script_1);
    State_5 = __importDefault(State_5);
    Style_1 = __importDefault(Style_1);
    const style = (0, State_5.default)(style_1.default);
    DevServer_1.default.onMessage('updateStyle', async () => {
        Script_1.default.allowModuleRedefinition('style');
        void Style_1.default.reload(`${Env_3.default.URL_ORIGIN}style/index.css`);
        await Script_1.default.reload(`${Env_3.default.URL_ORIGIN}style/index.js`);
        style.value = await new Promise((resolve_1, reject_1) => { require(['style'], resolve_1, reject_1); }).then(__importStar).then(module => module.default);
        writeChiridata();
    });
    Env_3.default.onLoad('dev', () => {
        Object.assign(window, { writeChiridata });
        writeChiridata();
    });
    function writeChiridata() {
        for (const attribute of [...document.documentElement.attributes])
            if (attribute.name.startsWith('chiridata:'))
                document.documentElement.removeAttribute(attribute.name);
        for (const component in style.value) {
            const classes = style.value[component];
            if (classes.length)
                document.documentElement.setAttribute(`chiridata:${component}`, JSON.stringify(classes));
        }
    }
    function StyleManipulator(component) {
        const styles = new Set();
        const currentClasses = [];
        const stateUnsubscribers = new WeakMap();
        const unbindPropertyState = {};
        if (Env_3.default.isDev)
            style.subscribe(component, () => updateClasses());
        const result = Object.assign(((...names) => {
            for (const name of names)
                styles.add(name);
            updateClasses();
            return component;
        }), {
            get: () => [...styles].sort(),
            remove(...names) {
                for (const name of names)
                    styles.delete(name);
                updateClasses();
                return component;
            },
            toggle(enabled, ...names) {
                if (enabled)
                    for (const name of names)
                        styles.add(name);
                else
                    for (const name of names)
                        styles.delete(name);
                updateClasses();
                return component;
            },
            bind(state, ...names) {
                if (!State_5.default.is(state))
                    return result.toggle(state, ...names);
                result.unbind(state);
                const unsubscribe = state.use(component, active => {
                    if (active)
                        for (const name of names)
                            styles.add(name);
                    else
                        for (const name of names)
                            styles.delete(name);
                    updateClasses();
                });
                stateUnsubscribers.set(state, [unsubscribe, names]);
                return component;
            },
            bindFrom(state) {
                result.unbind(state);
                const currentNames = [];
                const unsubscribe = state.use(component, (names, oldNames) => {
                    for (const oldName of oldNames ?? [])
                        styles.delete(oldName);
                    for (const name of names)
                        styles.add(name);
                    currentNames.splice(0, Infinity, ...names);
                    updateClasses();
                });
                stateUnsubscribers.set(state, [unsubscribe, currentNames]);
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
            hasProperty(property) {
                return component.element.style.getPropertyValue(property) !== '';
            },
            setProperty(property, value) {
                unbindPropertyState[property]?.();
                setProperty(property, value);
                return component;
            },
            toggleProperty(enabled, property, value) {
                enabled ??= !result.hasProperty(property);
                if (enabled === true)
                    return result.setProperty(property, enabled ? value : undefined);
                else
                    return result.removeProperties(property);
            },
            setVariable(variable, value) {
                return result.setProperty(`--${variable}`, value);
            },
            bindProperty(property, state) {
                unbindPropertyState[property]?.();
                if (State_5.default.is(state))
                    unbindPropertyState[property] = state.use(component, value => setProperty(property, value));
                else {
                    setProperty(property, state);
                    unbindPropertyState[property] = undefined;
                }
                return component;
            },
            bindVariable(variable, state) {
                return result.bindProperty(`--${variable}`, state);
            },
            removeProperties(...properties) {
                for (const property of properties)
                    component.element.style.removeProperty(property);
                return component;
            },
            removeVariables(...variables) {
                for (const variable of variables)
                    component.element.style.removeProperty(`--${variable}`);
                return component;
            },
        });
        return result;
        function updateClasses() {
            const stylesArray = [...styles];
            if (!component.attributes.has('component'))
                component.attributes.insertBefore('class', 'component');
            component.attributes.set('component', stylesArray.join(' '));
            const toAdd = stylesArray.flatMap(component => style.value[component]);
            const toRemove = currentClasses.filter(cls => !toAdd.includes(cls));
            if (toRemove)
                component.element.classList.remove(...toRemove);
            component.element.classList.add(...toAdd);
            currentClasses.push(...toAdd);
            return component;
        }
        function setProperty(property, value) {
            if (value === undefined || value === null)
                component.element.style.removeProperty(property);
            else
                component.element.style.setProperty(property, `${value}`);
        }
    }
    exports.default = StyleManipulator;
});
define("navigation/Route", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function Route(path, route) {
        const segments = (path.startsWith('/') ? path.slice(1) : path).split('/');
        const varGroups = [];
        let regexString = '^';
        for (const segment of segments) {
            regexString += '/+';
            if (segment[0] !== '$') {
                regexString += segment;
                continue;
            }
            if (segment[1] === '$') {
                varGroups.push(segment.slice(2));
                regexString += '(.*)';
                continue;
            }
            varGroups.push(segment.slice(1));
            regexString += '([^/]+)';
        }
        regexString += '$';
        const regex = new RegExp(regexString);
        const rawRoutePath = path;
        return {
            path,
            ...typeof route === 'function' ? { handler: route } : route,
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
define("endpoint/author/EndpointAuthorDelete", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_5 = __importDefault(Endpoint_5);
    exports.default = (0, Endpoint_5.default)('/author/delete', 'post')
        .noResponse();
});
define("ui/component/core/ActionRow", ["require", "exports", "ui/Component"], function (require, exports, Component_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Component_1 = __importDefault(Component_1);
    const ActionRow = Component_1.default.Builder((row) => {
        row.style('action-row');
        let hasRight = false;
        return row
            .extend(row => ({
            left: undefined,
            middle: undefined,
            right: undefined,
        }))
            .extendJIT('left', row => (0, Component_1.default)()
            .style('action-row-left')
            .prependTo(row))
            .extendJIT('middle', row => {
            const middle = (0, Component_1.default)()
                .style('action-row-middle');
            return hasRight
                ? middle.insertTo(row, 'before', row.right)
                : middle.appendTo(row);
        })
            .extendJIT('right', row => {
            hasRight = true;
            return (0, Component_1.default)()
                .style('action-row-right')
                .appendTo(row);
        });
    });
    exports.default = ActionRow;
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
            if (typeof event === 'string')
                event = new Event(event, { cancelable: true });
            if (typeof init === 'function')
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
            if (typeof promise !== 'object')
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
define("ui/InputBus", ["require", "exports", "ui/Component", "utility/EventManager"], function (require, exports, Component_2, EventManager_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HandlesKeyboardEvents = void 0;
    Component_2 = __importDefault(Component_2);
    var Classes;
    (function (Classes) {
        Classes["ReceiveFocusedClickEvents"] = "_receieve-focused-click-events";
    })(Classes || (Classes = {}));
    Component_2.default.extend(component => {
        component.extend(component => ({
            receiveFocusedClickEvents: () => component.classes.add(Classes.ReceiveFocusedClickEvents),
        }));
    });
    exports.HandlesKeyboardEvents = Component_2.default.Extension(component => component);
    const MOUSE_KEYNAME_MAP = {
        [0]: 'MouseLeft',
        [1]: 'MouseMiddle',
        [2]: 'MouseRight',
        [3]: 'Mouse3',
        [4]: 'Mouse4',
        [5]: 'Mouse5',
        [`${undefined}`]: 'Mouse?',
    };
    let lastUsed = 0;
    const inputDownTime = {};
    const InputBus = Object.assign(EventManager_1.EventManager.make(), {
        getPressStart: (name) => inputDownTime[name],
        getPressDuration: (name) => inputDownTime[name] === undefined ? undefined : Date.now() - inputDownTime[name],
        isDown: (name) => !!inputDownTime[name],
        isUp: (name) => !inputDownTime[name],
    });
    function emitKeyEvent(e) {
        const target = e.target;
        const input = target.closest('input[type=text], textarea, [contenteditable]');
        let usedByInput = !!input;
        const isClick = true
            && !usedByInput
            && e.type === 'keydown'
            && (e.key === 'Enter' || e.key === ' ')
            && !e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey
            && target.classList.contains(Classes.ReceiveFocusedClickEvents);
        if (isClick) {
            const result = target.component?.event.emit('click');
            if (result?.stoppedPropagation === true)
                e.stopPropagation();
            else if (result?.stoppedPropagation === 'immediate')
                e.stopImmediatePropagation();
            if (result?.defaultPrevented) {
                e.preventDefault();
                return;
            }
        }
        const eventKey = e.key ?? MOUSE_KEYNAME_MAP[e.button];
        const eventType = e.type === 'mousedown' ? 'keydown' : e.type === 'mouseup' ? 'keyup' : e.type;
        if (eventType === 'keydown')
            inputDownTime[eventKey] = Date.now();
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
            hovering: selector => {
                const hovered = [...document.querySelectorAll(':hover')];
                return selector ? hovered[hovered.length - 1]?.closest(selector) ?? undefined : hovered[hovered.length - 1];
            },
        };
        if (eventType === 'keyup') {
            event.usedAnotherKeyDuring = lastUsed > (inputDownTime[eventKey] ?? 0);
            delete inputDownTime[eventKey];
        }
        InputBus.emit(eventType === 'keydown' ? 'down' : 'up', event);
        if ((event.used && !usedByInput) || (usedByInput && cancelInput)) {
            e.preventDefault();
            lastUsed = Date.now();
        }
        if (usedByInput) {
            if (e.type === 'keydown' && eventKey === 'Enter' && !event.shift && !event.alt) {
                const form = target.closest('form');
                if (form && (target.tagName.toLowerCase() === 'input' || target.closest('[contenteditable]')) && !event.ctrl) {
                    if (!Component_2.default.closest(exports.HandlesKeyboardEvents, target))
                        e.preventDefault();
                }
                else {
                    form?.requestSubmit();
                }
            }
        }
    }
    document.addEventListener('keydown', emitKeyEvent, { capture: true });
    document.addEventListener('keyup', emitKeyEvent, { capture: true });
    document.addEventListener('mousedown', emitKeyEvent);
    document.addEventListener('mouseup', emitKeyEvent);
    document.addEventListener('click', emitKeyEvent);
    Object.defineProperty(MouseEvent.prototype, 'used', {
        get() {
            return this._used ?? false;
        },
    });
    Object.defineProperty(MouseEvent.prototype, 'use', {
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
    Object.defineProperty(MouseEvent.prototype, 'matches', {
        value: function (key, ...modifiers) {
            if (MOUSE_KEYNAME_MAP[this.button] !== key)
                return false;
            if (!modifiers.every(modifier => this[`${modifier}Key`]))
                return false;
            return true;
        },
    });
    exports.default = InputBus;
});
define("ui/utility/FocusListener", ["require", "exports", "utility/State"], function (require, exports, State_6) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    State_6 = __importDefault(State_6);
    var FocusListener;
    (function (FocusListener) {
        FocusListener.hasFocus = (0, State_6.default)(false);
        FocusListener.focused = (0, State_6.default)(undefined);
        FocusListener.focusedLast = (0, State_6.default)(undefined);
        function focusedComponent() {
            return FocusListener.focused.value?.component;
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
            if (document.querySelector(':focus-visible') === element)
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
            if (document.querySelector(':focus-visible') !== element)
                return;
            element.blur();
        }
        function listen() {
            document.addEventListener('focusin', onFocusIn);
            document.addEventListener('focusout', onFocusOut);
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
                history.pushState(undefined, '', ' ');
            const newFocused = document.querySelector(':focus-visible') ?? undefined;
            if (newFocused === FocusListener.focused.value)
                return;
            // updatingFocusState = true
            const lastLastFocusedComponent = FocusListener.focusedLast.value?.component;
            if (lastLastFocusedComponent) {
                lastLastFocusedComponent.hadFocusedLast.asMutable?.setValue(false);
                for (const ancestor of lastLastFocusedComponent.getAncestorComponents())
                    ancestor.hadFocusedLast.asMutable?.setValue(false);
            }
            const lastFocusedComponent = FocusListener.focused.value?.component;
            const focusedComponent = newFocused?.component;
            const oldAncestors = !lastFocusedComponent ? undefined : [...lastFocusedComponent.getAncestorComponents()];
            const newAncestors = !focusedComponent ? undefined : [...focusedComponent.getAncestorComponents()];
            const lastFocusedContainsFocused = FocusListener.focused.value?.contains(newFocused ?? null);
            FocusListener.focusedLast.value = FocusListener.focused.value;
            FocusListener.focused.value = newFocused;
            FocusListener.hasFocus.value = !!newFocused;
            if (lastFocusedComponent) {
                if (!lastFocusedContainsFocused) {
                    if (!focusedComponent)
                        // setting "had focused" must happen before clearing "has focused"
                        // just in case anything is listening for hasFocused || hadFocusedLast
                        lastFocusedComponent.hadFocusedLast.asMutable?.setValue(true);
                    lastFocusedComponent.hasFocused.asMutable?.setValue(false);
                }
                lastFocusedComponent.focused.asMutable?.setValue(false);
            }
            if (focusedComponent) {
                focusedComponent.focused.asMutable?.setValue(true);
                focusedComponent.hasFocused.asMutable?.setValue(true);
            }
            if (oldAncestors)
                for (const ancestor of oldAncestors)
                    if (!newAncestors?.includes(ancestor))
                        if (ancestor) {
                            if (!focusedComponent)
                                // setting "had focused" must happen before clearing "has focused"
                                // just in case anything is listening for hasFocused || hadFocusedLast
                                ancestor.hadFocusedLast.asMutable?.setValue(true);
                            ancestor.hasFocused.asMutable?.setValue(false);
                        }
            if (newAncestors)
                for (const ancestor of newAncestors)
                    if (ancestor)
                        ancestor.hasFocused.asMutable?.setValue(true);
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
define("utility/maths/Vector2", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function Vector2(x = 0, y) {
        if (y === undefined)
            y = x;
        return { x, y };
    }
    (function (Vector2) {
        ////////////////////////////////////
        //#region Constructors
        Vector2.ZERO = { x: 0, y: 0 };
        Vector2.ONE = { x: 1, y: 1 };
        function mutable(x = 0, y) {
            if (y === undefined)
                y = x;
            return { x, y };
        }
        Vector2.mutable = mutable;
        function fromClient(clientSource) {
            return { x: clientSource.clientX, y: clientSource.clientY };
        }
        Vector2.fromClient = fromClient;
        //#endregion
        ////////////////////////////////////
        function equals(v1, v2) {
            return v1.x === v2.x && v1.y === v2.y;
        }
        Vector2.equals = equals;
        function distance(v1, v2) {
            return Math.sqrt((v2.x - v1.x) ** 2 + (v2.y - v1.y) ** 2);
        }
        Vector2.distance = distance;
        function distanceWithin(within, v1, v2) {
            return (v2.x - v1.x) ** 2 + (v2.y - v1.y) ** 2 < within ** 2;
        }
        Vector2.distanceWithin = distanceWithin;
        function add(v1, v2) {
            return { x: v1.x + v2.x, y: v1.y + v2.y };
        }
        Vector2.add = add;
        function addInPlace(v1, v2) {
            v1.x += v2.x;
            v1.y += v2.y;
            return v1;
        }
        Vector2.addInPlace = addInPlace;
        function subtract(v1, v2) {
            return { x: v1.x - v2.x, y: v1.y - v2.y };
        }
        Vector2.subtract = subtract;
        function subtractInPlace(v1, v2) {
            v1.x -= v2.x;
            v1.y -= v2.y;
            return v1;
        }
        Vector2.subtractInPlace = subtractInPlace;
        function multiply(v, scalar) {
            return { x: v.x * scalar, y: v.y * scalar };
        }
        Vector2.multiply = multiply;
        function multiplyInPlace(v, scalar) {
            v.x *= scalar;
            v.y *= scalar;
            return v;
        }
        Vector2.multiplyInPlace = multiplyInPlace;
        function divide(v, scalar) {
            return { x: v.x / scalar, y: v.y / scalar };
        }
        Vector2.divide = divide;
        function divideInPlace(v, scalar) {
            v.x /= scalar;
            v.y /= scalar;
            return v;
        }
        Vector2.divideInPlace = divideInPlace;
        function modTruncate(v, scalar) {
            return { x: v.x % scalar, y: v.y % scalar };
        }
        Vector2.modTruncate = modTruncate;
        function modTruncateInPlace(v, scalar) {
            v.x %= scalar;
            v.y %= scalar;
            return v;
        }
        Vector2.modTruncateInPlace = modTruncateInPlace;
        function modFloor(v, scalar) {
            return {
                x: (v.x % scalar + scalar) % scalar,
                y: (v.y % scalar + scalar) % scalar,
            };
        }
        Vector2.modFloor = modFloor;
        function modFloorInPlace(v, scalar) {
            v.x = (v.x % scalar + scalar) % scalar;
            v.y = (v.y % scalar + scalar) % scalar;
            return v;
        }
        Vector2.modFloorInPlace = modFloorInPlace;
        function dot(v1, v2) {
            return v1.x * v2.x + v1.y * v2.y;
        }
        Vector2.dot = dot;
        /** IE, distance from 0,0 */
        function magnitude(v) {
            return Math.sqrt(v.x ** 2 + v.y ** 2);
        }
        Vector2.magnitude = magnitude;
        function normalise(v) {
            const magnitude = Vector2.magnitude(v);
            return Vector2.divide(v, magnitude);
        }
        Vector2.normalise = normalise;
        function normaliseInPlace(v) {
            const magnitude = Vector2.magnitude(v);
            return Vector2.divideInPlace(v, magnitude);
        }
        Vector2.normaliseInPlace = normaliseInPlace;
        function angle(v1, v2) {
            const dot = Vector2.dot(v1, v2);
            const lengths = Vector2.magnitude(v1) * Vector2.magnitude(v2);
            const cosTheta = Math.max(-1, Math.min(1, dot / lengths));
            return Math.acos(cosTheta);
        }
        Vector2.angle = angle;
        function rotate(v, angle) {
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            return {
                x: v.x * cos - v.y * sin,
                y: v.x * sin + v.y * cos,
            };
        }
        Vector2.rotate = rotate;
        function rotateInPlace(v, angle) {
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const x = v.x;
            v.x = x * cos - v.y * sin;
            v.y = x * sin + v.y * cos;
            return v;
        }
        Vector2.rotateInPlace = rotateInPlace;
        function lerp(v1, v2, t) {
            return {
                x: v1.x + (v2.x - v1.x) * t,
                y: v1.y + (v2.y - v1.y) * t,
            };
        }
        Vector2.lerp = lerp;
        function clamp(v, min, max) {
            return {
                x: Math.min(Math.max(v.x, min.x), max.x),
                y: Math.min(Math.max(v.y, min.y), max.y),
            };
        }
        Vector2.clamp = clamp;
        function clampInPlace(v, min, max) {
            v.x = Math.min(Math.max(v.x, min.x), max.x);
            v.y = Math.min(Math.max(v.y, min.y), max.y);
            return v;
        }
        Vector2.clampInPlace = clampInPlace;
    })(Vector2 || (Vector2 = {}));
    exports.default = Vector2;
});
define("ui/utility/Mouse", ["require", "exports", "utility/State"], function (require, exports, State_7) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    State_7 = __importDefault(State_7);
    var Mouse;
    (function (Mouse) {
        const pos = { x: 0, y: 0 };
        Mouse.state = (0, State_7.default)(pos);
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
            document.addEventListener('mousemove', event => {
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
define("ui/utility/HoverListener", ["require", "exports", "ui/utility/Mouse"], function (require, exports, Mouse_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Mouse_1 = __importDefault(Mouse_1);
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
            Mouse_1.default.onMove(() => {
                const allHovered = document.querySelectorAll(':hover');
                const hovered = allHovered[allHovered.length - 1];
                if (hovered === lastHovered[lastHovered.length - 1])
                    return;
                const newHovered = [...allHovered];
                for (const element of lastHovered)
                    if (element.component && !newHovered.includes(element))
                        element.component.hovered.asMutable?.setValue(false);
                for (const element of newHovered)
                    if (element.component && !lastHovered.includes(element))
                        element.component.hovered.asMutable?.setValue(true);
                lastHovered = newHovered;
            });
        }
        HoverListener.listen = listen;
    })(HoverListener || (HoverListener = {}));
    exports.default = HoverListener;
    Object.assign(window, { HoverListener });
});
define("ui/utility/TypeManipulator", ["require", "exports", "utility/State"], function (require, exports, State_8) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    State_8 = __importDefault(State_8);
    const TypeManipulator = Object.assign(function (host, onAdd, onRemove) {
        const state = (0, State_8.default)(new Set());
        return Object.assign(add, {
            state,
            remove,
            toggle(has, ...types) {
                if (has)
                    return add(...types);
                else
                    return remove(...types);
            },
        });
        function add(...types) {
            const typesSize = state.value.size;
            const newTypes = types.filter(type => !state.value.has(type));
            for (const type of newTypes)
                state.value.add(type);
            onAdd(newTypes);
            if (state.value.size !== typesSize)
                state.emit();
            return host;
        }
        function remove(...types) {
            const typesSize = state.value.size;
            const oldTypes = types.filter(type => state.value.has(type));
            for (const type of oldTypes)
                state.value.delete(type);
            onRemove(oldTypes);
            if (state.value.size !== typesSize)
                state.emit();
            return host;
        }
    }, {
        Style: (host, toComponentName) => TypeManipulator(host, types => {
            for (const type of types)
                host.style(toComponentName(type));
        }, types => {
            for (const type of types)
                host.style.remove(toComponentName(type));
        }),
    });
    exports.default = TypeManipulator;
});
define("ui/utility/Viewport", ["require", "exports", "utility/State", "utility/Style"], function (require, exports, State_9, Style_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    State_9 = __importDefault(State_9);
    Style_2 = __importDefault(Style_2);
    var Viewport;
    (function (Viewport) {
        Viewport.size = State_9.default.JIT(() => ({ w: window.innerWidth, h: window.innerHeight }));
        Viewport.mobile = State_9.default.JIT(owner => {
            const result = State_9.default.Use(owner, {
                contentWidth: Style_2.default.measure('--content-width'),
                viewport: Viewport.size,
            }).map(owner, ({ contentWidth, viewport }) => viewport.w < contentWidth);
            result.subscribe(owner, Viewport.mobile.markDirty);
            return result;
        });
        Viewport.tablet = State_9.default.JIT(owner => {
            const result = State_9.default.Use(owner, {
                tabletWidth: Style_2.default.measure('--tablet-width'),
                viewport: Viewport.size,
            }).map(owner, ({ tabletWidth, viewport }) => viewport.w < tabletWidth);
            result.subscribe(owner, Viewport.tablet.markDirty);
            return result;
        });
        function listen() {
            window.addEventListener('resize', Viewport.size.markDirty);
        }
        Viewport.listen = listen;
    })(Viewport || (Viewport = {}));
    exports.default = Viewport;
});
define("ui/component/core/Popover", ["require", "exports", "ui/Component", "ui/InputBus", "ui/utility/FocusListener", "ui/utility/HoverListener", "ui/utility/Mouse", "ui/utility/TypeManipulator", "ui/utility/Viewport", "utility/Objects", "utility/State", "utility/Task"], function (require, exports, Component_3, InputBus_1, FocusListener_1, HoverListener_1, Mouse_2, TypeManipulator_1, Viewport_1, Objects_2, State_10, Task_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Component_3 = __importDefault(Component_3);
    InputBus_1 = __importDefault(InputBus_1);
    FocusListener_1 = __importDefault(FocusListener_1);
    HoverListener_1 = __importDefault(HoverListener_1);
    Mouse_2 = __importDefault(Mouse_2);
    TypeManipulator_1 = __importDefault(TypeManipulator_1);
    Viewport_1 = __importDefault(Viewport_1);
    State_10 = __importDefault(State_10);
    Task_2 = __importDefault(Task_2);
    var FocusTrap;
    (function (FocusTrap) {
        let component;
        function get() {
            return component ??= (0, Component_3.default)()
                .tabIndex('auto')
                .ariaHidden()
                .style.setProperty('display', 'none')
                .prependTo(document.body);
        }
        function show() {
            get().style.setProperty('display', 'inline');
        }
        FocusTrap.show = show;
        function hide() {
            get().style.setProperty('display', 'none');
        }
        FocusTrap.hide = hide;
    })(FocusTrap || (FocusTrap = {}));
    Component_3.default.extend(component => {
        component.extend((component) => ({
            clearPopover: () => component
                .attributes.set('data-clear-popover', 'true'),
            setPopover: (popoverEvent, initialiser) => {
                if (component.popover)
                    component.popover.remove();
                let isShown = false;
                const popover = Popover()
                    .anchor.from(component)
                    .setOwner(component)
                    .setCloseDueToMouseInputFilter(event => {
                    const hovered = HoverListener_1.default.hovered() ?? null;
                    if (component.element.contains(hovered))
                        return false;
                    return true;
                })
                    .tweak(initialiser, component)
                    .event.subscribe('toggle', e => {
                    const event = e;
                    if (event.newState === 'closed') {
                        isShown = false;
                        component.clickState = false;
                        Mouse_2.default.offMove(updatePopoverState);
                    }
                })
                    .appendTo(document.body);
                if (popoverEvent === 'hover' && !component.popover)
                    component.hoveredOrFocused.subscribe(component, updatePopoverState);
                const ariaLabel = component.attributes.getUsing('aria-label') ?? popover.attributes.get('aria-label');
                const ariaRole = popover.attributes.getUsing('role') ?? popover.attributes.get('role');
                component.ariaLabel.use((quilt, { arg }) => quilt['component/popover/button'](arg(ariaLabel), arg(ariaRole)));
                popover.ariaLabel.use((quilt, { arg }) => quilt['component/popover'](arg(ariaLabel)));
                navigate.event.subscribe('Navigate', forceClose);
                popover.removed.awaitManual(true, () => navigate.event.unsubscribe('Navigate', forceClose));
                function forceClose() {
                    component.clickState = false;
                    popover.hide();
                }
                component.clickState = false;
                if (!component.popover) {
                    component.event.subscribe('click', async (event) => {
                        component.clickState = !component.clickState;
                        event.stopPropagation();
                        event.preventDefault();
                        if (component.clickState)
                            await showPopoverClick();
                        else
                            popover.hide();
                    });
                    component.receiveAncestorInsertEvents();
                    component.event.subscribe(['insert', 'ancestorInsert'], updatePopoverParent);
                }
                popover.popoverHasFocus.subscribe(component, hasFocused => {
                    if (hasFocused)
                        return;
                    component.clickState = false;
                    component.popover?.hide();
                    component.focus();
                });
                return component.extend(component => ({
                    popover,
                    popoverDescendants: [],
                    tweakPopover: initialiser => {
                        initialiser(component.popover, component);
                        return component;
                    },
                    showPopover: () => {
                        void showPopoverClick();
                        return component;
                    },
                    togglePopover: () => {
                        if (popover.visible.value)
                            popover.hide();
                        else
                            void showPopoverClick();
                        return component;
                    },
                }));
                async function showPopoverClick() {
                    component.popover?.show();
                    component.popover?.focus();
                    component.popover?.style.removeProperties('left', 'top');
                    await Task_2.default.yield();
                    component.popover?.anchor.apply();
                }
                function updatePopoverParent() {
                    if (!component.popover)
                        return;
                    const oldParent = component.popover.popoverParent.value;
                    component.popover.popoverParent.asMutable?.setValue(component.closest(Popover));
                    if (oldParent && oldParent !== component.popover.popoverParent.value)
                        oldParent.popoverChildren.asMutable?.setValue(oldParent.popoverChildren.value.filter(c => c !== component.popover));
                    if (component.popover.popoverParent.value && component.popover.popoverParent.value !== oldParent)
                        component.popover.popoverParent.value.popoverChildren.asMutable?.setValue([...component.popover.popoverParent.value.popoverChildren.value, component.popover]);
                }
                async function updatePopoverState() {
                    if (!component.popover)
                        return;
                    const shouldShow = false
                        || component.hoveredOrFocused.value
                        || (true
                            && isShown
                            && (false
                                || (component.popover.isMouseWithin(true) && !shouldClearPopover())
                                || InputBus_1.default.isDown('F4')))
                        || !!component.clickState;
                    if (isShown === shouldShow)
                        return;
                    if (component.hoveredOrFocused.value && !isShown)
                        Mouse_2.default.onMove(updatePopoverState);
                    if (!shouldShow)
                        Mouse_2.default.offMove(updatePopoverState);
                    if (!shouldShow)
                        FocusTrap.hide();
                    isShown = shouldShow;
                    component.popover.toggle(shouldShow);
                    if (!shouldShow)
                        return;
                    FocusTrap.show();
                    component.popover.style.removeProperties('left', 'top');
                    await Task_2.default.yield();
                    component.popover.anchor.apply();
                }
                function shouldClearPopover() {
                    if (!component.popover)
                        return false;
                    const hovered = HoverListener_1.default.hovered() ?? null;
                    if (component.element.contains(hovered) || component.popover.element.contains(hovered))
                        return false;
                    const clearsPopover = hovered?.closest('[data-clear-popover]');
                    if (!clearsPopover)
                        return false;
                    const clearsPopoverContainsHost = clearsPopover.contains(component.element);
                    if (clearsPopoverContainsHost)
                        return false;
                    const clearsPopoverWithinPopover = clearsPopover.component?.closest(Popover);
                    if (component.popover.containsPopoverDescendant(clearsPopoverWithinPopover))
                        return false;
                    return true;
                }
            },
        }));
    });
    const Popover = Component_3.default.Builder((component) => {
        let mousePadding;
        let unbind;
        const visible = (0, State_10.default)(false);
        let shouldCloseOnInput = true;
        let inputFilter;
        let normalStacking = false;
        const popover = component
            .style('popover')
            .tabIndex('programmatic')
            .attributes.set('popover', 'manual')
            .extend(popover => ({
            lastStateChangeTime: 0,
            visible,
            type: TypeManipulator_1.default.Style(popover, type => `popover--type-${type}`),
            popoverChildren: (0, State_10.default)([]),
            popoverParent: (0, State_10.default)(undefined),
            popoverHasFocus: FocusListener_1.default.focused.map(popover, focused => visible.value && containsPopoverDescendant(focused)),
            setCloseOnInput(closeOnInput = true) {
                shouldCloseOnInput = closeOnInput;
                return popover;
            },
            setCloseDueToMouseInputFilter(filter) {
                inputFilter = filter;
                return popover;
            },
            setMousePadding: padding => {
                mousePadding = padding;
                return popover;
            },
            setNormalStacking() {
                Viewport_1.default.tablet.use(popover, isTablet => {
                    const tablet = isTablet();
                    popover.style.toggle(!tablet, 'popover--normal-stacking');
                    popover.attributes.toggle(tablet, 'popover', 'manual');
                    normalStacking = !tablet;
                    togglePopover(visible.value);
                });
                return popover;
            },
            isMouseWithin: (checkDescendants = false) => {
                if (popover.rect.value.expand(mousePadding ?? 100).intersects(Mouse_2.default.state.value))
                    return true;
                if (checkDescendants)
                    for (const child of popover.popoverChildren.value)
                        if (child.isMouseWithin(true))
                            return true;
                return false;
            },
            containsPopoverDescendant,
            show: () => {
                unbind?.();
                togglePopover(true);
                popover.visible.asMutable?.setValue(true);
                return popover;
            },
            hide: () => {
                unbind?.();
                togglePopover(false);
                popover.visible.asMutable?.setValue(false);
                return popover;
            },
            toggle: shown => {
                unbind?.();
                togglePopover(shown);
                popover.visible.asMutable?.setValue(shown ?? !popover.visible.value);
                return popover;
            },
            bind: state => {
                unbind?.();
                unbind = state.use(popover, shown => {
                    togglePopover(shown);
                    popover.visible.asMutable?.setValue(shown);
                });
                return popover;
            },
            unbind: () => {
                unbind?.();
                return popover;
            },
        }));
        popover.event.subscribe('toggle', event => {
            popover.visible.asMutable?.setValue(event.newState === 'open');
        });
        popover.onRooted(() => {
            InputBus_1.default.subscribe('down', onInputDown);
            popover.removed.awaitManual(true, () => InputBus_1.default.unsubscribe('down', onInputDown));
        });
        return popover;
        function togglePopover(shown) {
            if (!popover.hasContent())
                shown = false;
            if (normalStacking && !Viewport_1.default.tablet.value)
                popover.style.toggle(!shown, 'popover--normal-stacking--hidden');
            else if (popover.rooted.value)
                popover
                    .style.remove('popover--normal-stacking--hidden')
                    .attributes.set('popover', 'manual')
                    .element.togglePopover(shown);
            (0, Objects_2.mutable)(popover).lastStateChangeTime = Date.now();
        }
        function onInputDown(event) {
            if (!popover.visible.value || !shouldCloseOnInput)
                return;
            if (!event.key.startsWith('Mouse') || popover.containsPopoverDescendant(HoverListener_1.default.hovered()))
                return;
            if (inputFilter && !inputFilter(event))
                return;
            if (popover.rooted.value)
                popover
                    .attributes.set('popover', 'manual')
                    .element.togglePopover(false);
            popover.visible.asMutable?.setValue(false);
            (0, Objects_2.mutable)(popover).lastStateChangeTime = Date.now();
        }
        function containsPopoverDescendant(descendant) {
            if (!descendant)
                return false;
            const node = Component_3.default.is(descendant) ? descendant.element : descendant;
            if (popover.element.contains(node))
                return true;
            for (const child of popover.popoverChildren.value)
                if (child === descendant)
                    return true;
                else if (child.containsPopoverDescendant(descendant))
                    return true;
            return false;
        }
    });
    exports.default = Popover;
});
define("utility/AbortPromise", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class AbortPromise extends Promise {
        #controller;
        /**
         * Note that `signal` is not handled for you.
         * If you need to resolve or reject on abort, you will need to add an abort listener.
         */
        constructor(executor) {
            const controller = new AbortController();
            super((resolve, reject) => executor(resolve, reject, controller.signal));
            this.#controller = controller;
            this.abort = this.abort.bind(this);
        }
        /**
         * Sends an abort signal to the promise handler
         */
        abort() {
            if (this.#controller?.signal.aborted)
                return;
            this.#controller?.abort();
        }
    }
    (function (AbortPromise) {
        function asyncFunction(asyncFunction) {
            return (...args) => new AbortPromise((resolve, reject, signal) => void asyncFunction(signal, ...args).then(resolve, reject));
        }
        AbortPromise.asyncFunction = asyncFunction;
    })(AbortPromise || (AbortPromise = {}));
    exports.default = AbortPromise;
});
define("ui/component/core/Slot", ["require", "exports", "ui/Component", "ui/component/core/ext/ComponentInsertionTransaction", "utility/AbortPromise", "utility/State"], function (require, exports, Component_4, ComponentInsertionTransaction_1, AbortPromise_1, State_11) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Component_4 = __importStar(Component_4);
    ComponentInsertionTransaction_1 = __importDefault(ComponentInsertionTransaction_1);
    AbortPromise_1 = __importDefault(AbortPromise_1);
    State_11 = __importDefault(State_11);
    Component_4.default.extend(component => {
        component.extend(component => ({
            hasContent() {
                const walker = document.createTreeWalker(component.element, NodeFilter.SHOW_TEXT);
                while (walker.nextNode())
                    if (walker.currentNode.textContent?.trim())
                        return true;
                for (const child of component.getDescendants())
                    if (!child.is(Slot))
                        return true;
                return false;
            },
        }));
    });
    const Slot = Object.assign(Component_4.default.Builder((slot) => {
        slot.style('slot');
        let unuse;
        let cleanup;
        let abort;
        let abortTransaction;
        const elses = (0, State_11.default)({ elseIfs: [] });
        let unuseElses;
        return slot
            .extend(slot => ({
            use: (state, initialiser) => {
                state = State_11.default.get(state);
                unuse?.();
                unuse = undefined;
                abort?.();
                abort = undefined;
                abortTransaction?.();
                abortTransaction = undefined;
                unuse = state.use(slot, value => {
                    abort?.();
                    abort = undefined;
                    cleanup?.();
                    cleanup = undefined;
                    abortTransaction?.();
                    abortTransaction = undefined;
                    const component = (0, Component_4.default)();
                    const transaction = (0, ComponentInsertionTransaction_1.default)(component, () => {
                        slot.removeContents();
                        slot.append(...component.element.children);
                    });
                    Object.assign(transaction, { closed: component.removed });
                    abortTransaction = transaction.abort;
                    handleSlotInitialiserReturn(transaction, initialiser(transaction, value));
                });
                return slot;
            },
            if: (state, initialiser) => {
                unuse?.();
                unuse = undefined;
                abort?.();
                abort = undefined;
                abortTransaction?.();
                abortTransaction = undefined;
                state.use(slot, value => {
                    abort?.();
                    abort = undefined;
                    cleanup?.();
                    cleanup = undefined;
                    abortTransaction?.();
                    abortTransaction = undefined;
                    unuseElses?.();
                    unuseElses = undefined;
                    if (!value) {
                        let unuseElsesList;
                        const unuseElsesContainer = elses.useManual(elses => {
                            unuseElsesList = State_11.default.MapManual(elses.elseIfs.map(({ state }) => state), (...elses) => elses.indexOf(true))
                                .useManual(elseToUse => {
                                const initialiser = elseToUse === -1 ? elses.else : elses.elseIfs[elseToUse].initialiser;
                                if (!initialiser) {
                                    slot.removeContents();
                                    return;
                                }
                                handleSlotInitialiser(initialiser);
                            });
                        });
                        unuseElses = () => {
                            unuseElsesList?.();
                            unuseElsesContainer();
                        };
                        return;
                    }
                    handleSlotInitialiser(initialiser);
                });
                return slot;
            },
            elseIf(state, initialiser) {
                elses.value.elseIfs.push({ state, initialiser });
                elses.emit();
                return slot;
            },
            else(initialiser) {
                elses.value.else = initialiser;
                elses.emit();
                return slot;
            },
        }))
            .tweak(slot => slot.removed.awaitManual(true, () => cleanup?.()));
        function handleSlotInitialiser(initialiser) {
            const component = (0, Component_4.default)();
            const transaction = (0, ComponentInsertionTransaction_1.default)(component, () => {
                slot.removeContents();
                slot.append(...component.element.children);
            });
            Object.assign(transaction, { closed: component.removed });
            abortTransaction = transaction.abort;
            handleSlotInitialiserReturn(transaction, initialiser(transaction));
        }
        function handleSlotInitialiserReturn(transaction, result) {
            if (!(result instanceof AbortPromise_1.default))
                return handleSlotInitialiserReturnNonPromise(transaction, result || undefined);
            abort = result.abort;
            result.then(result => handleSlotInitialiserReturnNonPromise(transaction, result || undefined))
                .catch(err => console.error('Slot initialiser promise rejection:', err));
        }
        function handleSlotInitialiserReturnNonPromise(transaction, result) {
            result ||= undefined;
            if (result === slot)
                result = undefined;
            transaction.close();
            abortTransaction = undefined;
            if (Component_4.default.is(result)) {
                result.appendTo(slot);
                cleanup = undefined;
                return;
            }
            if (Component_4.ComponentInsertionDestination.is(result)) {
                cleanup = undefined;
                return;
            }
            cleanup = result;
        }
    }), {
        using: (value, initialiser) => Slot().use(State_11.default.get(value), initialiser),
    });
    exports.default = Slot;
});
define("ui/component/core/ext/CanHasActionsMenu", ["require", "exports", "ui/Component", "ui/component/core/Button", "ui/component/core/Popover", "ui/component/core/Slot", "ui/utility/Viewport", "utility/Objects"], function (require, exports, Component_5, Button_1, Popover_1, Slot_1, Viewport_2, Objects_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Component_5 = __importDefault(Component_5);
    Button_1 = __importDefault(Button_1);
    Popover_1 = __importDefault(Popover_1);
    Slot_1 = __importDefault(Slot_1);
    Viewport_2 = __importDefault(Viewport_2);
    const ActionsMenu = Component_5.default.Builder((component) => {
        if (!component.is(Popover_1.default))
            throw new Error('ActionsMenu must be a Popover');
        const anchorTweakers = new Set();
        const actionsWrappers = {};
        return component.extend(component => ({
            actionsWrappers,
            anchorTweakers,
            appendAction: makeActionInserter(wrapper => wrapper.appendTo(component)),
            prependAction: makeActionInserter(wrapper => wrapper.prependTo(component)),
            insertAction: makeActionInserter((wrapper, direction, sibling) => wrapper.insertTo(component, direction, actionsWrappers[sibling])),
            subscribeReanchor(tweaker) {
                anchorTweakers.add(tweaker);
                return component;
            },
            unsubscribeReanchor(tweaker) {
                anchorTweakers.delete(tweaker);
                return component;
            },
        }));
        function makeActionInserter(insert) {
            return function (...all) {
                const [id] = all;
                const [stateOrInitialiser, initialiser] = all.slice(-2);
                const params = all.slice(1, -2);
                const slot = (0, Slot_1.default)().tweak(insert, ...params);
                actionsWrappers[id] = slot;
                if (typeof stateOrInitialiser === 'function') {
                    slot.tweak(stateOrInitialiser);
                    return component;
                }
                slot.use(stateOrInitialiser, initialiser);
                return component;
            };
        }
    });
    const CanHasActionsMenu = Component_5.default.Extension((component, popoverInitialiser) => {
        let hasActionsMenu = false;
        let actionsMenuButtonInserter;
        return component
            .extend(component => ({
            actionsMenu: undefined,
            setActionsMenu(initialiser) {
                hasActionsMenu = true;
                if (actionsMenuButtonInserter)
                    addActionsMenuButton(component);
                component.clearPopover().setPopover('hover', (popover, button) => {
                    const actionsMenu = (0, Objects_3.mutable)(component).actionsMenu = popover
                        .and(ActionsMenu)
                        .style('actions-menu-popover')
                        .append((0, Slot_1.default)().style.remove('slot').style('actions-menu-popover-arrow'))
                        .tweak(popoverInitialiser, button)
                        .tweak(initialiser, button);
                    Viewport_2.default.tablet.use(actionsMenu, isTablet => {
                        const tablet = isTablet();
                        actionsMenu.anchor.reset();
                        if (tablet)
                            actionsMenu
                                .type.remove('flush')
                                .anchor.add('aligned right', 'off bottom')
                                .anchor.add('aligned right', 'off top')
                                .anchor.orElseHide();
                        else
                            actionsMenu
                                .type('flush')
                                .anchor.add('off right', 'centre')
                                .anchor.orElseHide();
                        const { anchorTweakers } = actionsMenu;
                        for (const tweaker of anchorTweakers)
                            tweaker(actionsMenu, tablet);
                    });
                });
                return component;
            },
            setActionsMenuButton(inserter) {
                actionsMenuButtonInserter = inserter ?? true;
                if (hasActionsMenu)
                    addActionsMenuButton(component);
                return component;
            },
            tweakActions(tweaker) {
                component.actionsMenu.tweak(tweaker, component);
                return component;
            },
            tweakActionsAnchor(tweaker) {
                component.actionsMenu.subscribeReanchor(tweaker);
                return component;
            },
            untweakActionsAnchor(tweaker) {
                component.actionsMenu.unsubscribeReanchor(tweaker);
                return component;
            },
        }));
        function addActionsMenuButton(component) {
            const button = (0, Button_1.default)()
                .setIcon('ellipsis-vertical')
                .type('icon')
                .event.subscribe('click', event => {
                event.preventDefault();
                event.stopImmediatePropagation();
                if (Viewport_2.default.tablet.value)
                    component.togglePopover();
                else
                    component.showPopover();
            });
            if (typeof actionsMenuButtonInserter === 'function')
                actionsMenuButtonInserter(button);
            else
                button.appendTo(component);
        }
    });
    exports.default = CanHasActionsMenu;
});
define("utility/string/MarkdownItHTML", ["require", "exports", "entities"], function (require, exports, entities_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    entities_1 = __importDefault(entities_1);
    const html = Object.assign(((md, options) => {
        const state = {
            block: undefined,
            inline: undefined,
            i: 0,
            l: 0,
            e: 0,
            src: '',
            silent: false,
            options: {
                ...html.defaultOptions,
                ...options,
            },
        };
        md.block.ruler.at('html_block', (block, startLine, endLine, silent) => {
            state.block = block;
            state.src = state.block.src;
            state.l = startLine;
            state.i = state.block.bMarks[state.l] + state.block.tShift[state.l];
            state.e = state.src.length;
            state.silent = silent;
            const result = html.consumeBlock(state);
            state.block = undefined;
            return result;
        }, { alt: ['paragraph'] });
        md.inline.ruler.at('html_inline', (inline, silent) => {
            state.inline = inline;
            state.e = inline.posMax;
            state.i = inline.pos;
            state.src = inline.src;
            state.silent = silent;
            const result = html.consumeInline(state);
            state.inline = undefined;
            return result;
        });
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
        md.renderer.rules.html_inline = (tokens, idx) => tokens[idx].content || tokens[idx].raw;
    }), {
        regexCSSProperty: /^[-a-zA-Z_][a-zA-Z0-9_-]*$/,
        defaultOptions: {
            voidElements: [
                // custom
                'mention',
                // default
                'area',
                'base',
                'br',
                'col',
                'embed',
                'hr',
                'img',
                'input',
                'link',
                'meta',
                'source',
                'track',
                'wbr',
            ],
            allowedTags: [
                // custom
                'mention',
                // headings
                'hgroup',
                'h1',
                'h2',
                'h3',
                'h4',
                'h5',
                'h6',
                // layout
                'div',
                'p',
                'br',
                'wbr',
                'hr',
                'details',
                'summary',
                'label',
                // lists
                'ol',
                'ul',
                'li',
                // tables
                'table',
                'tr',
                'th',
                'td',
                'caption',
                'thead',
                'tbody',
                'tfoot',
                // text
                'span',
                // text style
                'i',
                'b',
                'u',
                's',
                'strike',
                'sup',
                'sub',
                'em',
                'mark',
                'small',
                'strong',
                // quoting/referencing
                'q',
                'cite',
                'blockquote',
                // links
                'a',
                // definitions
                'abbr',
                'dfn',
                'dd',
                'dt',
                'dl',
                // code
                'code',
                'samp',
                'kbd',
                // images
                'img',
                'figure',
                'figcaption',
                'area',
                'map',
            ],
            allTagsAllowedAttributes: [
                'title',
                'name',
                'style',
                'aria-label',
                'aria-labelledby',
                'aria-describedby',
                'aria-hidden',
            ],
            allTagsAllowedAttributeValues: {},
            perTagAllowedAttributes: {
                // custom
                mention: ['vanity'],
                // default
                a: ['href'],
                img: ['src', 'alt', 'usemap', 'width', 'height'],
                area: ['shape', 'coords'],
                details: ['open'],
                ol: ['type', 'start', 'reversed'],
                li: ['value'],
                th: ['colspan', 'rowspan', 'headers', 'scope', 'abbr'],
                td: ['colspan', 'rowspan', 'headers'],
                q: ['cite'],
            },
            perTagAllowedAttributeValues: {
                a: { href: /^https?:/ },
                img: { src: /^https?:/ },
                area: { href: /^https?:/ },
                q: { cite: /^https?:/ },
                blockquote: { cite: /^https?:/ },
            },
            allTagsAllowedStyleProperties: [
                'color',
                'text-align',
                'font-family',
                'font-style',
                'font-weight',
                'text-decoration',
                'text-transform',
                'line-height',
                'letter-spacing',
                'word-spacing',
                'vertical-align',
                'background-color',
                'opacity',
                'margin',
                'padding',
                'width',
                'height',
                'vertical-align',
                'box-shadow',
                'border-width',
                'border-style',
                'border-color',
                'border-radius',
                'text-indent',
                'display',
                'position',
            ],
            allTagsAllowedStylePropertyValues: {
                position: ['relative', 'absolute', 'sticky'],
            },
            perTagAllowedStyleProperties: {},
            perTagAllowedStylePropertyValues: {},
        },
        Options(options) {
            const factory = Object.assign({ ...structuredClone(html.defaultOptions), ...options }, {
                disallowTags(...tags) {
                    const disallowed = tags.map(tag => tag.toLowerCase());
                    factory.allowedTags = factory.allowedTags.filter(tag => !disallowed.includes(tag));
                    return factory;
                },
                allowTags(...tags) {
                    factory.allowedTags = [...new Set([...factory.allowedTags, ...tags.map(tag => tag.toLowerCase())])];
                    return factory;
                },
                disallowAttributes(...attributes) {
                    const disallowed = attributes.map(attr => attr.toLowerCase());
                    factory.allTagsAllowedAttributes = factory.allTagsAllowedAttributes.filter(attr => !disallowed.includes(attr));
                    for (const [tag, allowedAttributes] of Object.entries(factory.perTagAllowedAttributes))
                        factory.perTagAllowedAttributes[tag] = allowedAttributes.filter(attr => !disallowed.includes(attr));
                    return factory;
                },
                allowAttributes(...attributes) {
                    factory.allTagsAllowedAttributes = [...new Set([...factory.allTagsAllowedAttributes, ...attributes.map(attr => attr.toLowerCase())])];
                    return factory;
                },
            });
            return factory;
        },
        use(md, options) {
            return md.use(html, options);
        },
        consumeBlock(state) {
            if (!state.block)
                return false;
            html.consumeInlineWhitespace(state);
            if (state.silent)
                return html.consumeTerminator(state);
            const result = html.consumeTagsLine(state);
            if (!result)
                return false;
            state.l++;
            state.block.line = state.l;
            const indent = html.consumeInlineWhitespace(state) || 0;
            if (indent >= state.block.blkIndent + 4)
                state.block.blkIndent = indent - 4; // allow for indented code blocks within html block
            else
                state.block.blkIndent = indent;
            return true;
        },
        consumeInline(state) {
            if (!state.inline || state.src[state.i] !== '<')
                return false;
            const tag = html.consumeTag(state);
            if (!tag)
                return false;
            state.inline.pos = state.i;
            return true;
        },
        consumeTerminator(state) {
            const noSetBlockIndent = new Error().stack?.split('\n')?.at(4)?.includes('Array.lheading');
            const indent = html.consumeInlineWhitespace(state) || 0;
            if (!html.consumeTagsLine(state))
                return false;
            if (!noSetBlockIndent && state.block)
                state.block.blkIndent = indent;
            return true;
        },
        consumeTagsLine(state) {
            let consumed = false;
            const tokens = [];
            let token;
            while ((token = html.consumeTag(state))) {
                if (typeof token === 'object')
                    tokens.push(token);
                consumed = true;
                html.consumeInlineWhitespace(state);
            }
            if (!consumed)
                return undefined;
            if (state.i < state.src.length && !html.consumeNewline(state)) {
                // a line of tags MUST end in a newline — if this doesn't, remove all the tokens we added and don't match
                if (tokens.length)
                    state.block?.tokens.splice(0, Infinity, ...state.block.tokens
                        .filter(token => !tokens.includes(token)));
                return undefined;
            }
            return {
                tokens,
            };
        },
        consumeNewline(state) {
            if (state.inline)
                return false;
            if (state.src[state.i] === '\n') {
                state.i++;
                return true;
            }
            if (state.src[state.i] !== '\r')
                return false;
            state.i++;
            if (state.src[state.i] === '\n')
                state.i++;
            return true;
        },
        consumeWhitespace(state) {
            if (state.inline)
                return !!html.consumeInlineWhitespace(state);
            const start = state.i;
            if (state.i >= state.e)
                return false;
            for (state.i; state.i < state.e; state.i++) {
                if (!html.isWhitespace(state))
                    break;
                if (html.consumeNewline(state)) {
                    state.l++;
                    state.i--;
                }
            }
            return state.i > start;
        },
        consumeInlineWhitespace(state) {
            if (state.i >= state.e)
                return undefined;
            let indent = 0;
            for (state.i; state.i < state.e; state.i++) {
                if (state.src[state.i] === ' ')
                    indent++;
                else if (state.src[state.i] === '\t')
                    indent += 4;
                else
                    break;
            }
            return indent || undefined;
        },
        consumeTag(state) {
            if (state.src[state.i] !== '<')
                return undefined;
            state.i++;
            return html.consumeOpenTag(state) ?? html.consumeCloseTag(state);
        },
        consumeOpenTag(state) {
            const start = state.i;
            const tagNameRaw = html.consumeTagName(state);
            if (!tagNameRaw)
                return undefined;
            const tagName = tagNameRaw.toLowerCase();
            const o = state.options;
            if (!o.allowedTags.includes(tagNameRaw)) {
                state.i = start;
                return undefined;
            }
            const attributes = [];
            let style;
            while (html.consumeWhitespace(state)) {
                const attribute = html.consumeAttribute(state);
                if (!attribute)
                    break;
                let [name, value] = attribute;
                name = name.toLowerCase();
                if (!o.allTagsAllowedAttributes.includes(name) && !o.perTagAllowedAttributes[tagName]?.includes(name))
                    continue;
                value = entities_1.default.decodeHTML5Strict(value);
                if (name !== 'style') {
                    const allowedValues = o.perTagAllowedAttributeValues[tagName]?.[name] ?? o.allTagsAllowedAttributeValues[name];
                    if (allowedValues !== undefined && !html.matchesAllowedValues(value, allowedValues))
                        continue;
                    attributes.push(attribute);
                    continue;
                }
                style = html.parseStyleAttributeValue(value);
                let styleValue = '';
                for (let [property, value] of style) {
                    property = property.toLowerCase();
                    if (!o.allTagsAllowedStyleProperties.includes(property) && !o.perTagAllowedStyleProperties[tagName]?.includes(property))
                        continue;
                    const importantToken = '!important';
                    const important = value.slice(-importantToken.length).toLowerCase() === importantToken;
                    if (important)
                        value = value.slice(0, -importantToken.length).trim();
                    const allowedValues = o.perTagAllowedStylePropertyValues[tagName]?.[property] ?? o.allTagsAllowedStylePropertyValues[property];
                    if (allowedValues !== undefined && !html.matchesAllowedValues(value, allowedValues))
                        continue;
                    styleValue += `${property}:${value}${important ? importantToken : ''};`;
                }
                if (styleValue.length)
                    attributes.push(['style', styleValue.slice(0, -1)]);
            }
            if (state.src[state.i] === '/')
                state.i++;
            if (state.src[state.i] !== '>') {
                state.i = start;
                return undefined;
            }
            state.i++;
            const nesting = state.options.voidElements.includes(tagName) ? 0 : 1;
            if (state.silent)
                return true;
            let type = `html_${state.block ? 'block' : 'inline'}${nesting ? '_open' : ''}`;
            if (tagName === 'br')
                type = 'softbreak';
            const mdState = state.block ?? state.inline;
            const token = mdState.push(type, tagName, nesting);
            Object.assign(token, {
                style,
                raw: state.src.slice(start - 1, state.i),
            });
            for (const attribute of attributes)
                token.attrPush(attribute);
            return token;
        },
        consumeCloseTag(state) {
            const start = state.i;
            if (state.src[state.i] !== '/')
                return undefined;
            state.i++;
            const tagNameRaw = html.consumeTagName(state);
            if (!tagNameRaw)
                return undefined;
            if (state.src[state.i] !== '>') {
                state.i = start;
                return undefined;
            }
            state.i++;
            const tagName = tagNameRaw.toLowerCase();
            if (!state.options.allowedTags.includes(tagName)) {
                state.i = start;
                return undefined;
            }
            if (state.silent || state.options.voidElements.includes(tagName))
                return true;
            const type = `html_${state.block ? 'block' : 'inline'}_close`;
            const mdState = state.block ?? state.inline;
            const token = mdState.push(type, tagName, -1);
            Object.assign(token, { raw: state.src.slice(start - 1, state.i) });
            if (state.inline && !state.inline.delimiters)
                state.inline.delimiters = [];
            return token;
        },
        consumeTagName(state) {
            const start = state.i;
            if (state.i >= state.e)
                return undefined;
            if (!html.isAlpha(state))
                return undefined;
            for (state.i++; state.i < state.e; state.i++)
                if (!html.isAlphaNumeric(state))
                    break;
            return state.src.slice(start, state.i);
        },
        consumeAttribute(state) {
            const start = state.i;
            const name = html.consumeAttributeName(state);
            if (!name)
                return undefined;
            const valueStart = state.i;
            html.consumeWhitespace(state);
            if (state.src[state.i] !== '=') {
                state.i = valueStart;
                return [name, ''];
            }
            state.i++;
            html.consumeWhitespace(state);
            const value = html.consumeAttributeValue(state);
            if (!value) {
                state.i = start;
                return undefined;
            }
            return [name, value];
        },
        consumeAttributeName(state) {
            const start = state.i;
            if (state.i >= state.e)
                return undefined;
            for (state.i; state.i < state.e; state.i++) {
                const charCode = state.src.charCodeAt(state.i);
                const isInvalidChar = false
                    || charCode === 0x0020 // SPACE
                    || charCode === 0x0022 // "
                    || charCode === 0x0027 // '
                    || charCode === 0x003E // >
                    || charCode === 0x002F // /
                    || charCode === 0x003D // =
                    || html.isNonCharacter(state, charCode)
                    || html.isControl(state, charCode);
                if (isInvalidChar)
                    break;
            }
            return state.i > start ? state.src.slice(start, state.i) : undefined;
        },
        consumeAttributeValue(state) {
            return false
                || html.consumeUnquotedAttributeValue(state)
                || html.consumeQuotedAttributeValue(state)
                || undefined;
        },
        consumeUnquotedAttributeValue(state) {
            let result = '';
            while (state.i < state.e) {
                const charCode = state.src.charCodeAt(state.i);
                // Check for invalid characters in unquoted attribute values
                const isInvalidChar = false
                    || charCode === 0x0022 // "
                    || charCode === 0x0027 // '
                    || charCode === 0x003D // =
                    || charCode === 0x003C // <
                    || charCode === 0x003E // >
                    || charCode === 0x0060 // `
                    || html.isWhitespace(state, charCode); // ASCII whitespace
                if (isInvalidChar)
                    break;
                if (charCode !== 0x0026) { // not &
                    result += state.src[state.i];
                    state.i++;
                    continue;
                }
                const charRef = html.consumeCharacterReference(state);
                if (!charRef) {
                    result += '&amp;';
                    state.i++;
                    continue;
                }
                result += charRef;
                // `i` is already at the next pos
            }
            return result || undefined;
        },
        consumeQuotedAttributeValue(state) {
            const start = state.i;
            const quoteChar = state.src[state.i];
            if (quoteChar !== '\'' && quoteChar !== '"')
                return undefined;
            state.i++;
            let result = '';
            while (state.i < state.e) {
                const charCode = state.src.charCodeAt(state.i);
                if (state.src[state.i] === quoteChar) {
                    state.i++;
                    return result;
                }
                if (charCode !== 0x0026) { // not &
                    const charStart = state.i;
                    if (html.consumeNewline(state)) {
                        state.l++;
                        result += state.src.slice(charStart, state.i);
                        continue;
                    }
                    const isNewlineInInlineMode = state.inline && html.isWhitespace(state) && state.src[state.i] !== ' ' && state.src[state.i] !== '\t';
                    if (isNewlineInInlineMode) {
                        state.i = start;
                        return undefined;
                    }
                    result += state.src[state.i];
                    state.i++;
                    continue;
                }
                const charRef = html.consumeCharacterReference(state);
                if (!charRef) {
                    result += '&amp;';
                    state.i++;
                    continue;
                }
                result += charRef;
                // `i` is already at the next pos
            }
            // no closing quote before the end of `src`
            state.i = start;
            return undefined;
        },
        consumeCharacterReference(state) {
            const start = state.i;
            if (state.src[state.i] !== '&')
                return undefined;
            state.i++;
            const isValid = html.consumeNumericCharacterReference(state) || html.consumeNamedCharacterReference(state);
            if (!isValid) {
                state.i = start;
                return undefined;
            }
            return state.src.slice(start, state.i);
        },
        consumeNamedCharacterReference(state) {
            const nameStart = state.i;
            for (state.i; state.i < state.e; state.i++)
                if (!html.isAlpha(state))
                    break;
            if (state.i === nameStart || state.src[state.i] !== ';')
                return false;
            state.i++;
            return true;
        },
        consumeNumericCharacterReference(state) {
            if (state.src[state.i] !== '#')
                return false;
            state.i++;
            const isHex = state.src[state.i] === 'x' || state.src[state.i] === 'X';
            if (isHex)
                state.i++;
            const digitsStart = state.i;
            for (state.i; state.i < state.e; state.i++)
                if (isHex ? !html.isHexadecimal(state) : !html.isNumeric(state))
                    break;
            if (state.i === digitsStart || state.src[state.i] !== ';')
                return false;
            const codePoint = parseInt(state.src.slice(digitsStart, state.i), isHex ? 16 : 10);
            if (codePoint === 0x000D || html.isNonCharacter(state, codePoint) || (html.isControl(state, codePoint) && !html.isWhitespace(state, codePoint)))
                return false;
            state.i++;
            return true;
        },
        parseStyleAttributeValue: ((style) => {
            if (style === undefined || style === null)
                return undefined;
            const styles = new Map();
            let key = '';
            let value = '';
            let inValue = false;
            let isEscaped = false;
            let isQuoted = false;
            let isComment = false;
            let quoteChar = '';
            let parenCount = 0;
            for (let i = 0; i < style.length; i++) {
                const char = style[i];
                if (isComment) {
                    if (char !== '*' && style[i + 1] !== '/')
                        continue;
                    isComment = false;
                    i++;
                    continue;
                }
                if (char === '\\') {
                    isEscaped = true;
                    continue;
                }
                if (isEscaped) {
                    value += char;
                    isEscaped = false;
                    continue;
                }
                if (!isComment && char === '/' && style[i + 1] === '*') {
                    isComment = true;
                    i++;
                    continue;
                }
                if (isQuoted) {
                    if (char === quoteChar) {
                        isQuoted = false;
                        value += char;
                        continue;
                    }
                }
                else {
                    if (char === '"' || char === '\'') {
                        isQuoted = true;
                        quoteChar = char;
                        value += char;
                        continue;
                    }
                }
                if (char === '(' && !isQuoted) {
                    parenCount++;
                    value += char;
                    continue;
                }
                if (char === ')' && !isQuoted) {
                    parenCount--;
                    value += char;
                    continue;
                }
                if (char === ':' && !isQuoted && parenCount === 0) {
                    inValue = true;
                    continue;
                }
                if (char === ';' && !isQuoted && parenCount === 0) {
                    if (key && value) {
                        key = key.trim();
                        if (!html.regexCSSProperty.test(key))
                            console.warn(`Invalid CSS property "${key}"`);
                        else
                            styles.set(key, value.trim());
                        key = '';
                        value = '';
                    }
                    inValue = false;
                    continue;
                }
                if (inValue) {
                    value += char;
                }
                else {
                    key += char;
                }
            }
            if (key && value) {
                key = key.trim();
                if (!html.regexCSSProperty.test(key))
                    console.warn(`Invalid CSS property "${key}"`);
                else
                    styles.set(key, value.trim());
            }
            return styles;
        }),
        isAlpha(state, charCode = state.src.charCodeAt(state.i)) {
            return (charCode >= 65 && charCode <= 90) || (charCode >= 97 && charCode <= 122); // A-Z, a-z
        },
        isNumeric(state, charCode = state.src.charCodeAt(state.i)) {
            return charCode >= 48 && charCode <= 57;
        },
        isHexadecimal(state, charCode = state.src.charCodeAt(state.i)) {
            return (charCode >= 65 && charCode <= 70) || (charCode >= 97 && charCode <= 102) || html.isNumeric(state, charCode);
        },
        isAlphaNumeric(state, charCode = state.src.charCodeAt(state.i)) {
            return html.isAlpha(state, charCode) || html.isNumeric(state, charCode);
        },
        isNonCharacter(state, charCode = state.src.charCodeAt(state.i)) {
            return false
                || (charCode >= 0xFDD0 && charCode <= 0xFDEF)
                || charCode === 0xFFFE || charCode === 0xFFFF
                || charCode === 0x1FFFE || charCode === 0x1FFFF
                || charCode === 0x2FFFE || charCode === 0x2FFFF
                || charCode === 0x3FFFE || charCode === 0x3FFFF
                || charCode === 0x4FFFE || charCode === 0x4FFFF
                || charCode === 0x5FFFE || charCode === 0x5FFFF
                || charCode === 0x6FFFE || charCode === 0x6FFFF
                || charCode === 0x7FFFE || charCode === 0x7FFFF
                || charCode === 0x8FFFE || charCode === 0x8FFFF
                || charCode === 0x9FFFE || charCode === 0x9FFFF
                || charCode === 0xAFFFE || charCode === 0xAFFFF
                || charCode === 0xBFFFE || charCode === 0xBFFFF
                || charCode === 0xCFFFE || charCode === 0xCFFFF
                || charCode === 0xDFFFE || charCode === 0xDFFFF
                || charCode === 0xEFFFE || charCode === 0xEFFFF
                || charCode === 0xFFFFE || charCode === 0xFFFFF
                || charCode === 0x10FFFE || charCode === 0x10FFFF;
        },
        isControl(state, charCode = state.src.charCodeAt(state.i)) {
            return false
                || (charCode >= 0x0000 && charCode <= 0x001F)
                || (charCode >= 0x007F && charCode <= 0x009F);
        },
        isWhitespace(state, charCode = state.src.charCodeAt(state.i)) {
            return false
                || charCode === 0x0009 // TAB
                || charCode === 0x000A // LF
                || charCode === 0x000C // FF
                || charCode === 0x000D // CR
                || charCode === 0x0020; // SPACE
        },
        matchesAllowedValues(value, allowed) {
            if (Array.isArray(allowed))
                return allowed.some(allowed => html.matchesAllowedValues(value, allowed));
            if (typeof allowed === 'string')
                return value === allowed;
            if (typeof allowed === 'function')
                return allowed(value);
            return allowed.test(value);
        },
    });
    const MarkdownItHTML = html;
    exports.default = MarkdownItHTML;
});
define("utility/string/Markdown", ["require", "exports", "markdown-it", "utility/string/MarkdownItHTML"], function (require, exports, markdown_it_1, MarkdownItHTML_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    markdown_it_1 = __importDefault(markdown_it_1);
    MarkdownItHTML_1 = __importDefault(MarkdownItHTML_1);
    exports.default = Object.assign(createMarkdownInstance(), {
        clone: createMarkdownInstance,
    });
    function createMarkdownInstance() {
        const Markdown = new markdown_it_1.default('commonmark', { html: true, breaks: true });
        MarkdownItHTML_1.default.use(Markdown, MarkdownItHTML_1.default.Options()
            .disallowTags('img', 'figure', 'figcaption', 'map', 'area'));
        Markdown.inline.ruler.enable('strikethrough');
        Markdown.inline.ruler2.enable('strikethrough');
        ////////////////////////////////////
        //#region Underline Parse
        // Based on https://github.com/Markdown-it/Markdown-it/blob/0fe7ccb4b7f30236fb05f623be6924961d296d3d/lib/rules_inline/strikethrough.mjs
        Markdown.inline.ruler.before('emphasis', 'underline', function underline_tokenize(state, silent) {
            const start = state.pos;
            const marker = state.src.charCodeAt(start);
            if (silent || marker !== 0x5F /* _ */)
                return false;
            const scanned = state.scanDelims(state.pos, true);
            let len = scanned.length;
            if (len < 2)
                return false;
            const ch = String.fromCharCode(marker);
            let token;
            if (len % 2) {
                token = state.push('text', '', 0);
                token.content = ch;
                len--;
            }
            for (let i = 0; i < len; i += 2) {
                token = state.push('text', '', 0);
                token.content = ch + ch;
                state.delimiters.push({
                    marker,
                    length: 0, // disable "rule of 3" length checks meant for emphasis
                    token: state.tokens.length - 1,
                    end: -1,
                    open: scanned.can_open,
                    close: scanned.can_close,
                });
            }
            state.pos += scanned.length;
            return true;
        });
        Markdown.inline.ruler2.before('emphasis', 'underline', function underline_postProcess(state) {
            const tokens_meta = state.tokens_meta;
            const max = state.tokens_meta.length;
            postProcess(state, state.delimiters);
            for (let curr = 0; curr < max; curr++) {
                const delimiters = tokens_meta[curr]?.delimiters;
                if (delimiters)
                    postProcess(state, delimiters);
            }
            state.delimiters = state.delimiters.filter(delim => delim.marker !== 0x5F /* _ */);
            return true;
            function postProcess(state, delimiters) {
                let token;
                const loneMarkers = [];
                const max = delimiters.length;
                for (let i = 0; i < max; i++) {
                    const startDelim = delimiters[i];
                    if (startDelim.marker !== 0x5F /* _ */)
                        continue;
                    if (startDelim.end === -1)
                        continue;
                    const endDelim = delimiters[startDelim.end];
                    token = state.tokens[startDelim.token];
                    token.type = 'u_open';
                    token.tag = 'u';
                    token.nesting = 1;
                    token.markup = '__';
                    token.content = '';
                    token = state.tokens[endDelim.token];
                    token.type = 'u_close';
                    token.tag = 'u';
                    token.nesting = -1;
                    token.markup = '__';
                    token.content = '';
                    if (state.tokens[endDelim.token - 1].type === 'text'
                        && state.tokens[endDelim.token - 1].content === '_') {
                        loneMarkers.push(endDelim.token - 1);
                    }
                }
                // If a marker sequence has an odd number of characters, it's splitted
                // like this: `_____` -> `_` + `__` + `__`, leaving one marker at the
                // start of the sequence.
                //
                // So, we have to move all those markers after subsequent u_close tags.
                //
                while (loneMarkers.length) {
                    const i = loneMarkers.pop() ?? 0;
                    let j = i + 1;
                    while (j < state.tokens.length && state.tokens[j].type === 'u_close') {
                        j++;
                    }
                    j--;
                    if (i !== j) {
                        token = state.tokens[j];
                        state.tokens[j] = state.tokens[i];
                        state.tokens[i] = token;
                    }
                }
            }
        });
        //#endregion
        ////////////////////////////////////
        return Markdown;
    }
});
define("ui/utility/MarkdownContent", ["require", "exports", "ui/Component", "utility/string/Markdown"], function (require, exports, Component_6, Markdown_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Component_6 = __importDefault(Component_6);
    Markdown_1 = __importDefault(Markdown_1);
    const handlers = [];
    const ELEMENT_TYPES_TO_SIMPLIFY_INTO_SPAN = Object.entries({
        SPAN: [
            'DIV',
            'P',
            'UL', 'OL', 'LI',
        ],
        STRONG: [
            'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
        ],
        EM: [
            'BLOCKQUOTE',
        ],
        CODE: [
            'PRE',
        ],
    })
        .flatMap(([toTag, fromTags]) => fromTags
        .map(fromTag => [fromTag, toTag]))
        .toObject();
    const ELEMENT_TYPES_TO_SIMPLIFY_BY_REMOVAL = new Set([
        'IMG',
        'HR',
        'BR',
        'TABLE',
    ]);
    const MENTION_OPEN_TAG_REGEX = /(?<=<mention[^>]*>)/g;
    Component_6.default.extend(component => component.extend(component => ({
        setMarkdownContent(markdown, maxLength) {
            if (!markdown) {
                component.element.innerHTML = '';
                return component;
            }
            if (typeof markdown === 'string')
                markdown = { body: markdown };
            component.classes.add('markdown');
            const rendered = Markdown_1.default.render(markdown.body);
            component.element.innerHTML = rendered
                .replace(MENTION_OPEN_TAG_REGEX, '</mention>');
            if (maxLength)
                simplifyTree(component.element, maxLength);
            const queuedChanges = [];
            const walker = document.createTreeWalker(component.element, NodeFilter.SHOW_ELEMENT);
            while (walker.nextNode())
                for (const handler of handlers) {
                    const change = handler(walker.currentNode, markdown);
                    if (change)
                        queuedChanges.push(change);
                }
            for (const change of queuedChanges)
                change();
            if (component.element.lastElementChild?.tagName.length === 2 && component.element.lastElementChild.tagName[0] === 'H')
                (0, Component_6.default)('p').appendTo(component);
            return component;
        },
    })));
    function simplifyTree(root, maxLength) {
        let length = 0;
        let clipped = false;
        const nodesToRemove = [];
        const elementsToReplace = [];
        let walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
            const node = walker.currentNode;
            const tagName = node.tagName;
            if (ELEMENT_TYPES_TO_SIMPLIFY_BY_REMOVAL.has(tagName)) {
                nodesToRemove.push(node);
                continue;
            }
            if (length >= maxLength) {
                nodesToRemove.push(node);
                clipped = true;
                continue;
            }
            if (node.nodeType === Node.TEXT_NODE) {
                const nodeLength = node.textContent?.length ?? 0;
                length += nodeLength;
                const clipLength = Math.max(0, length - maxLength);
                if (clipLength) {
                    clipped = true;
                    node.textContent = node.textContent?.slice(0, nodeLength - clipLength) ?? null;
                    length = maxLength;
                }
            }
            const replacementTagName = ELEMENT_TYPES_TO_SIMPLIFY_INTO_SPAN[tagName];
            if (replacementTagName)
                elementsToReplace.push(node);
        }
        for (let i = nodesToRemove.length - 1; i >= 0; i--)
            nodesToRemove[i].parentNode?.removeChild(nodesToRemove[i]);
        for (let i = elementsToReplace.length - 1; i >= 0; i--) {
            const element = elementsToReplace[i];
            const replacementTagName = ELEMENT_TYPES_TO_SIMPLIFY_INTO_SPAN[element.tagName];
            const replacementTag = document.createElement(replacementTagName);
            replacementTag.replaceChildren(...element.childNodes);
            element.replaceWith(replacementTag);
        }
        const elementsToStrip = [];
        walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
        while (walker.nextNode()) {
            const element = walker.currentNode;
            if (element.tagName === 'SPAN')
                continue;
            if (element.parentElement?.closest(element.tagName))
                elementsToStrip.push(element);
        }
        for (let i = elementsToStrip.length - 1; i >= 0; i--)
            elementsToStrip[i].replaceWith(...elementsToStrip[i].childNodes);
        if (clipped)
            root.append('…');
    }
    var MarkdownContent;
    (function (MarkdownContent) {
        function handle(handler) {
            handlers.push(handler);
        }
        MarkdownContent.handle = handle;
    })(MarkdownContent || (MarkdownContent = {}));
    exports.default = MarkdownContent;
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
        function unlerp(from, to, value) {
            const reverse = from > to;
            if (reverse) {
                const temp = to;
                to = from;
                from = temp;
            }
            const result = value <= from ? 0
                : value >= to ? 1
                    : (value - from) / (to - from);
            return reverse ? 1 - result : result;
        }
        Maths.unlerp = unlerp;
        function parseIntOrUndefined(value) {
            const result = parseFloat(value);
            return isNaN(result) || !Number.isInteger(result) ? undefined : result;
        }
        Maths.parseIntOrUndefined = parseIntOrUndefined;
        function clamp1(value) {
            return value < 0 ? 0 : value > 1 ? 1 : value;
        }
        Maths.clamp1 = clamp1;
    })(Maths || (Maths = {}));
    exports.default = Maths;
});
define("ui/component/core/Heading", ["require", "exports", "ui/Component", "ui/utility/MarkdownContent", "ui/utility/TextManipulator", "utility/Define", "utility/maths/Maths", "utility/State"], function (require, exports, Component_7, MarkdownContent_1, TextManipulator_1, Define_3, Maths_1, State_12) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HeadingClasses = void 0;
    Component_7 = __importDefault(Component_7);
    MarkdownContent_1 = __importDefault(MarkdownContent_1);
    TextManipulator_1 = __importDefault(TextManipulator_1);
    Define_3 = __importDefault(Define_3);
    Maths_1 = __importDefault(Maths_1);
    State_12 = __importDefault(State_12);
    var HeadingClasses;
    (function (HeadingClasses) {
        HeadingClasses["_ContainsHeading"] = "_contains-heading";
    })(HeadingClasses || (exports.HeadingClasses = HeadingClasses = {}));
    Component_7.default.extend(component => component.extend(component => ({
        containsHeading: () => component.classes.has(HeadingClasses._ContainsHeading),
        setContainsHeading() {
            component.classes.add(HeadingClasses._ContainsHeading);
            return component;
        },
    })));
    const Heading = Component_7.default.Builder('h1', (component) => {
        component.style('heading');
        const textWrapper = (0, Component_7.default)()
            .style('heading-text')
            .appendTo(component);
        Define_3.default.set(component, 'text', (0, TextManipulator_1.default)(component, textWrapper));
        let initial = true;
        let aestheticLevel;
        let aestheticStyle;
        const resizeRange = (0, State_12.default)(undefined);
        State_12.default.Map(component, [component.text.state, resizeRange], (...args) => args)
            .use(component, ([text, resizeRange]) => {
            component.setId(text?.toString().toLowerCase().replace(/\W+/g, '-'));
            if (!resizeRange)
                return;
            const length = text?.length ?? 0;
            const t = 1 - Maths_1.default.clamp1(Maths_1.default.unlerp(resizeRange.minLength, resizeRange.maxLength, length));
            textWrapper.style.setProperty('--font-size-multiplier', `${t}`);
        });
        component.tabIndex('programmatic');
        component.receiveAncestorInsertEvents();
        component.event.subscribe(['insert', 'ancestorInsert'], updateHeadingLevel);
        component.rooted.subscribeManual(updateHeadingLevel);
        return component.extend(heading => ({
            setAestheticLevel(level) {
                const style = aestheticStyle ?? 'heading';
                const oldLevel = getHeadingLevel(component.element);
                if (style !== false && isStyledHeadingLevel(oldLevel))
                    component.style.remove(`${style}-${oldLevel}`);
                if (style !== false && aestheticLevel)
                    component.style.remove(`${style}-${aestheticLevel}`);
                aestheticLevel = level;
                if (style !== false && isStyledHeadingLevel(aestheticLevel))
                    component.style(`${style}-${aestheticLevel}`);
                return heading;
            },
            setAestheticStyle(style) {
                const level = aestheticLevel ?? getHeadingLevel(component.element);
                if (aestheticStyle !== false && isStyledHeadingLevel(level))
                    component.style.remove(`${aestheticStyle ?? 'heading'}`, `${aestheticStyle ?? 'heading'}-${level}`);
                aestheticStyle = style;
                if (style !== false && isStyledHeadingLevel(level))
                    component.style(`${style ?? 'heading'}`, `${style ?? 'heading'}-${level}`);
                return heading;
            },
            updateLevel: () => {
                updateHeadingLevel();
                return heading;
            },
            setResizeRange(minLength, maxLength) {
                resizeRange.value = minLength === undefined || maxLength === undefined ? undefined : { minLength, maxLength };
                return heading;
            },
            clearResizeRange() {
                resizeRange.value = undefined;
                return heading;
            },
        }));
        function updateHeadingLevel() {
            const newLevel = computeHeadingLevel(component.element);
            const oldLevel = getHeadingLevel(component.element);
            const isSameLevel = newLevel === oldLevel;
            if (isSameLevel && !initial)
                return;
            const style = aestheticStyle ?? 'heading';
            initial = false;
            if (style !== false && isStyledHeadingLevel(oldLevel))
                component.style.remove(`${style}-${oldLevel}`);
            const isStyledLevel = isStyledHeadingLevel(newLevel);
            if (style !== false && !aestheticLevel && isStyledLevel)
                component.style(`${style}-${newLevel}`);
            if (style !== false && aestheticLevel)
                component.style(`${style}-${aestheticLevel}`);
            if (isSameLevel)
                return;
            component.event.unsubscribe(['insert', 'ancestorInsert'], updateHeadingLevel);
            component.replaceElement(isStyledLevel ? `h${newLevel}` : 'span');
            component.attributes.toggle(!isStyledLevel, 'role', 'heading');
            component.attributes.toggle(!isStyledLevel && typeof newLevel === 'number', 'aria-level', `${newLevel}`);
            component.event.subscribe(['insert', 'ancestorInsert'], updateHeadingLevel);
        }
    });
    function computeHeadingLevel(node) {
        let currentNode = node;
        let incrementHeading = false;
        while (currentNode) {
            if (currentNode.nodeType === Node.ELEMENT_NODE && currentNode.tagName === 'NAV')
                return 2;
            const heading = getPreviousSiblingHeading(currentNode);
            if (heading) {
                const level = getHeadingLevel(heading);
                if (!incrementHeading && level !== 1)
                    return level;
                if (level === undefined || level > 6)
                    return level;
                return level + 1;
            }
            currentNode = currentNode.parentNode ?? undefined;
            incrementHeading ||= true;
        }
        return 1;
    }
    function getPreviousSiblingHeading(node) {
        let sibling = node;
        while (sibling) {
            sibling = sibling.previousSibling ?? undefined;
            if (sibling?.nodeType !== Node.ELEMENT_NODE)
                continue;
            const siblingElement = sibling;
            if (isHeadingElement(siblingElement))
                return siblingElement;
            if (siblingElement.getAttribute('role') === 'heading')
                return siblingElement;
            if (siblingElement.tagName === 'HGROUP') {
                const [heading] = siblingElement.querySelectorAll('h1, h2, h3, h4, h5, h6, [role=\'heading\']');
                if (heading)
                    return heading;
            }
            if (siblingElement.component?.containsHeading()) {
                const [heading] = siblingElement.querySelectorAll('h1, h2, h3, h4, h5, h6, [role=\'heading\']');
                if (heading)
                    return heading;
            }
        }
    }
    function isHeadingElement(value) {
        if (!value || typeof value !== 'object' || !('tagName' in value))
            return false;
        const element = value;
        return element.tagName[0] === 'H' && element.tagName.length === 2 && !isNaN(+element.tagName[1]);
    }
    function getHeadingLevel(element) {
        return +element.tagName.slice(1) || +element.getAttribute('aria-level') || undefined;
    }
    function isStyledHeadingLevel(level) {
        return typeof level === 'number' && level >= 1 && level <= 6;
    }
    //#endregion
    ////////////////////////////////////
    MarkdownContent_1.default.handle(element => {
        if (!isHeadingElement(element))
            return undefined;
        return () => {
            const level = getHeadingLevel(element);
            const heading = Heading().setAestheticStyle('markdown-heading');
            Component_7.default.removeContents(heading.element);
            heading.element.replaceChildren(...element.childNodes);
            element.replaceWith(heading.element);
            heading.emitInsert();
            if (isStyledHeadingLevel(level))
                heading.setAestheticLevel(level);
        };
    });
    exports.default = Heading;
});
define("ui/utility/EventManipulator", ["require", "exports", "utility/Arrays"], function (require, exports, Arrays_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Arrays_2 = __importDefault(Arrays_2);
    const SYMBOL_REGISTERED_FUNCTION = Symbol('REGISTERED_FUNCTION');
    function isComponent(host) {
        return typeof host === 'object' && host !== null && 'isComponent' in host;
    }
    function EventManipulator(host) {
        const elementHost = isComponent(host)
            ? host
            : { element: document.createElement('span') };
        return {
            emit(event, ...params) {
                const detail = { result: [], params };
                let stoppedPropagation = false;
                let preventedDefault = false;
                const eventObject = Object.assign(new CustomEvent(event, { detail }), {
                    preventDefault() {
                        Event.prototype.preventDefault.call(this);
                        preventedDefault ||= true;
                    },
                    stopPropagation() {
                        stoppedPropagation ||= true;
                    },
                    stopImmediatePropagation() {
                        stoppedPropagation = 'immediate';
                    },
                });
                elementHost.element.dispatchEvent(eventObject);
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                return Object.assign(detail.result, { defaultPrevented: eventObject.defaultPrevented || preventedDefault, stoppedPropagation });
            },
            bubble(event, ...params) {
                const detail = { result: [], params };
                let stoppedPropagation = false;
                let preventedDefault = false;
                const eventObject = Object.assign(new CustomEvent(event, { detail, bubbles: true }), {
                    preventDefault() {
                        Event.prototype.preventDefault.call(this);
                        preventedDefault ||= true;
                    },
                    stopPropagation() {
                        stoppedPropagation ||= true;
                    },
                    stopImmediatePropagation() {
                        stoppedPropagation = 'immediate';
                    },
                });
                elementHost.element.dispatchEvent(eventObject);
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                return Object.assign(detail.result, { defaultPrevented: eventObject.defaultPrevented || preventedDefault, stoppedPropagation });
            },
            subscribe(events, handler) {
                return subscribe(handler, events);
            },
            subscribePassive(events, handler) {
                return subscribe(handler, events, { passive: true });
            },
            unsubscribe(events, handler) {
                const realHandler = handler[SYMBOL_REGISTERED_FUNCTION];
                if (!realHandler)
                    return host;
                delete handler[SYMBOL_REGISTERED_FUNCTION];
                for (const event of Arrays_2.default.resolve(events))
                    elementHost.element.removeEventListener(event, realHandler);
                return host;
            },
        };
        function subscribe(handler, events, options) {
            if (handler[SYMBOL_REGISTERED_FUNCTION]) {
                console.error(`Can't register handler for event(s) ${Arrays_2.default.resolve(events).join(', ')}, already used for other events`, handler);
                return host;
            }
            const realHandler = (event) => {
                const customEvent = event instanceof CustomEvent ? event : undefined;
                const eventDetail = customEvent?.detail;
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
                const result = handler(Object.assign(event, { host }), ...eventDetail?.params ?? []);
                eventDetail?.result.push(result);
            };
            Object.assign(handler, { [SYMBOL_REGISTERED_FUNCTION]: realHandler });
            for (const event of Arrays_2.default.resolve(events))
                elementHost.element.addEventListener(event, realHandler, options);
            return host;
        }
    }
    exports.default = EventManipulator;
});
define("ui/component/core/Link", ["require", "exports", "navigation/RoutePath", "ui/Component", "ui/utility/MarkdownContent", "utility/Env", "utility/State"], function (require, exports, RoutePath_1, Component_8, MarkdownContent_2, Env_4, State_13) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Component_8 = __importDefault(Component_8);
    MarkdownContent_2 = __importDefault(MarkdownContent_2);
    Env_4 = __importDefault(Env_4);
    State_13 = __importDefault(State_13);
    const Link = Component_8.default.Builder('a', (component, route) => {
        component.style('link');
        const canNavigate = (0, State_13.default)(true);
        const link = component.extend(link => ({
            canNavigate,
            setNavigationDisabled(disabled = true) {
                canNavigate.value = !disabled;
                return link;
            },
        }));
        if (route !== undefined) {
            link.attributes.set('href', `${Env_4.default.URL_ORIGIN}${route.slice(1)}`);
            link.event.subscribe('click', event => {
                event.preventDefault();
                // const closestButtonOrLink = (event.target as Partial<HTMLElement>).component?.closest([Button, Link])
                // if (closestButtonOrLink !== component)
                // 	return
                if (!canNavigate.value)
                    return;
                event.stopImmediatePropagation();
                void navigate.toURL(route);
                link.event.emit('Navigate');
            });
        }
        return link;
    });
    MarkdownContent_2.default.handle((element, context) => {
        if (element.tagName !== 'A')
            return;
        let href = element.getAttribute('href');
        if (href?.startsWith(Env_4.default.URL_ORIGIN))
            href = href.slice(Env_4.default.URL_ORIGIN.length - 1);
        if (!RoutePath_1.RoutePath.is(href))
            return;
        return () => {
            const link = Link(href).text.set(element.textContent ?? '');
            element.replaceWith(link.element);
        };
    });
    exports.default = Link;
});
define("ui/component/core/Paragraph", ["require", "exports", "ui/Component"], function (require, exports, Component_9) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Component_9 = __importDefault(Component_9);
    const Paragraph = Component_9.default.Builder(component => component
        .style('paragraph'));
    exports.default = Paragraph;
});
define("ui/component/core/Block", ["require", "exports", "ui/Component", "ui/component/core/ActionRow", "ui/component/core/ext/CanHasActionsMenu", "ui/component/core/Heading", "ui/component/core/Link", "ui/component/core/Paragraph", "ui/utility/TypeManipulator", "utility/State"], function (require, exports, Component_10, ActionRow_1, CanHasActionsMenu_1, Heading_1, Link_1, Paragraph_1, TypeManipulator_2, State_14) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BlockClasses = void 0;
    Component_10 = __importDefault(Component_10);
    ActionRow_1 = __importDefault(ActionRow_1);
    CanHasActionsMenu_1 = __importDefault(CanHasActionsMenu_1);
    Heading_1 = __importDefault(Heading_1);
    Link_1 = __importDefault(Link_1);
    Paragraph_1 = __importDefault(Paragraph_1);
    TypeManipulator_2 = __importDefault(TypeManipulator_2);
    State_14 = __importDefault(State_14);
    var BlockClasses;
    (function (BlockClasses) {
        BlockClasses["Main"] = "_block";
        BlockClasses["Header"] = "_block-header";
    })(BlockClasses || (exports.BlockClasses = BlockClasses = {}));
    const Block = Component_10.default.Builder((component) => {
        let header;
        let footer;
        const isLink = component.supers.mapManual(() => component.is(Link_1.default));
        const block = component
            .classes.add(BlockClasses.Main)
            .viewTransition('block')
            .style('block')
            .style.bind(isLink, 'block--link')
            .extend(block => ({
            title: undefined,
            header: undefined,
            description: undefined,
            primaryActions: undefined,
            content: (0, Component_10.default)().style('block-content').appendTo(component),
            footer: undefined,
            type: (0, TypeManipulator_2.default)(block, newTypes => {
                for (const type of newTypes) {
                    block.style(`block--type-${type}`);
                    header?.style(`block--type-${type}-header`);
                    footer?.style(`block--type-${type}-footer`);
                }
            }, oldTypes => {
                for (const type of oldTypes) {
                    block.style.remove(`block--type-${type}`);
                    header?.style.remove(`block--type-${type}-header`);
                    footer?.style.remove(`block--type-${type}-footer`);
                }
            }),
        }))
            .tweak(block => block
            .style.bindFrom(State_14.default.MapManual([isLink, block.type.state], (link, types) => [...types].map((t) => `block${link ? '--link' : ''}--type-${t}`))))
            .extendJIT('header', block => header = (0, Component_10.default)('hgroup')
            .style('block-header')
            .style.bindFrom(block.type.state.mapManual(types => [...types].map(t => `block--type-${t}-header`)))
            .classes.add(BlockClasses.Header)
            .prependTo(block))
            .extendJIT('title', block => (0, Heading_1.default)().style('block-title').prependTo(block.header))
            .extendJIT('primaryActions', block => (0, Component_10.default)().style('block-actions-primary').appendTo(block.header))
            .extendJIT('description', block => (0, Paragraph_1.default)().style('block-description').appendTo(block.header))
            .extendJIT('footer', block => footer = (0, ActionRow_1.default)()
            .style('block-footer')
            .style.bindFrom(block.type.state.mapManual(types => [...types].map(t => `block--type-${t}-footer`)))
            .appendTo(block));
        return block
            .and(CanHasActionsMenu_1.default, actionsMenu => actionsMenu
            .subscribeReanchor((actionsMenu, isTablet) => {
            if (isTablet)
                return;
            actionsMenu.anchor.reset()
                .anchor.add('off right', 'centre', `>> .${BlockClasses.Header}`)
                .anchor.orElseHide();
        }))
            .setActionsMenuButton(button => button
            .style('block-actions-menu-button')
            .appendTo(block.primaryActions));
    });
    exports.default = Block;
});
define("ui/component/core/Dialog", ["require", "exports", "ui/Component", "utility/State"], function (require, exports, Component_11, State_15) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Component_11 = __importDefault(Component_11);
    State_15 = __importDefault(State_15);
    const Dialog = Component_11.default.Builder(() => {
        const opened = (0, State_15.default)(false);
        const willOpen = (0, State_15.default)(false);
        const willClose = (0, State_15.default)(false);
        let modal = true;
        let unbind;
        const dialog = (0, Component_11.default)('dialog')
            .style('dialog')
            .style.bind(opened, 'dialog--open')
            .extend(dialog => ({
            opened,
            willClose,
            willOpen,
            setNotModal: (notModal = true) => {
                modal = !notModal;
                dialog.style.toggle(notModal, 'dialog--not-modal');
                return dialog;
            },
            setFullscreen: (fullscreen = true) => dialog.style.toggle(fullscreen, 'dialog--fullscreen'),
            open: () => {
                willOpen.value = true;
                if (!dialog.willOpen.value)
                    return dialog;
                unbind?.();
                dialog.element[modal ? 'showModal' : 'show']();
                opened.value = true;
                willOpen.value = false;
                return dialog;
            },
            close: () => {
                willClose.value = true;
                if (!dialog.willClose.value)
                    return dialog;
                unbind?.();
                dialog.element.close();
                opened.value = false;
                willClose.value = false;
                return dialog;
            },
            toggle: (open = !dialog.opened.value) => {
                const willChangeStateName = open ? 'willOpen' : 'willClose';
                dialog[willChangeStateName].asMutable?.setValue(true);
                if (!dialog[willChangeStateName].value)
                    return dialog;
                unbind?.();
                if (open)
                    dialog.element[modal ? 'showModal' : 'show']();
                else
                    dialog.element.close();
                opened.value = open ?? !opened.value;
                dialog[willChangeStateName].asMutable?.setValue(false);
                return dialog;
            },
            bind: state => {
                unbind?.();
                unbind = state.use(dialog, open => {
                    const willChangeStateName = open ? 'willOpen' : 'willClose';
                    dialog[willChangeStateName].asMutable?.setValue(true);
                    if (open)
                        dialog.element[modal ? 'showModal' : 'show']();
                    else
                        dialog.element.close();
                    opened.value = open;
                    dialog[willChangeStateName].asMutable?.setValue(false);
                });
                return dialog;
            },
            unbind: () => {
                unbind?.();
                return dialog;
            },
        }));
        return dialog;
    });
    exports.default = Dialog;
});
define("ui/component/core/BlockDialog", ["require", "exports", "ui/Component", "ui/component/core/Block", "ui/component/core/Dialog", "utility/Task"], function (require, exports, Component_12, Block_1, Dialog_1, Task_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Component_12 = __importDefault(Component_12);
    Block_1 = __importDefault(Block_1);
    Dialog_1 = __importDefault(Dialog_1);
    Task_3 = __importDefault(Task_3);
    const BlockDialog = Component_12.default.Builder((component) => {
        const dialog = component.and(Dialog_1.default).and(Block_1.default)
            .viewTransition(false)
            .style.remove('block');
        dialog
            .style('dialog-block-wrapper')
            .style.bind(dialog.opened.not, 'dialog-block-wrapper--closed');
        const block = (0, Block_1.default)()
            .style('dialog-block')
            .style.bind(dialog.opened.not, 'dialog-block--closed')
            .appendTo(dialog);
        dialog
            .extend(dialog => ({
            type: block.type,
            content: block.content,
            setActionsMenu: block.setActionsMenu,
            setActionsMenuButton: block.setActionsMenuButton,
        }))
            .extendJIT('header', () => block.header)
            .extendJIT('title', () => block.title)
            .extendJIT('primaryActions', () => block.primaryActions)
            .extendJIT('description', () => block.description)
            .extendJIT('footer', () => block.footer);
        const superOpen = dialog.open;
        return dialog.extend(dialog => ({
            open() {
                superOpen();
                block.style('dialog-block--opening');
                void Task_3.default.yield().then(() => block.style.remove('dialog-block--opening'));
                return dialog;
            },
        }));
    });
    exports.default = BlockDialog;
});
define("endpoint/auth/EndpointAuthServices", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_6) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_6 = __importDefault(Endpoint_6);
    exports.default = (0, Endpoint_6.default)('/auth/services', 'get');
});
define("ui/component/core/Placeholder", ["require", "exports", "ui/Component"], function (require, exports, Component_13) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Component_13 = __importDefault(Component_13);
    const Placeholder = Component_13.default.Builder((component) => {
        return component.style('placeholder').extend(placeholder => ({}));
    });
    exports.default = Placeholder;
});
define("ui/component/core/Checkbutton", ["require", "exports", "ui/Component", "ui/component/core/Button", "utility/State"], function (require, exports, Component_14, Button_2, State_16) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Component_14 = __importDefault(Component_14);
    Button_2 = __importDefault(Button_2);
    State_16 = __importDefault(State_16);
    const Checkbutton = Component_14.default.Builder('label', (component) => {
        const input = (0, Component_14.default)('input')
            .style('checkbutton-input')
            .attributes.set('type', 'checkbox');
        const inputElement = input.element;
        const state = (0, State_16.default)(false);
        let unuse;
        const checkbutton = component
            .and(Button_2.default)
            .style('checkbutton')
            .tabIndex('auto')
            .ariaChecked(state)
            .ariaRole('checkbox')
            .append(input)
            .extend(() => ({
            input,
            checked: state,
            isChecked: () => inputElement.checked,
            setChecked: (checked) => {
                if (checked === inputElement.checked)
                    return checkbutton;
                if (unuse) {
                    checkbutton.event.emit('trySetChecked', checked);
                    return checkbutton;
                }
                inputElement.checked = checked;
                onChange();
                return checkbutton;
            },
            use: sourceState => {
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
        input.event.subscribe('change', () => {
            if (unuse) {
                const checked = inputElement.checked;
                inputElement.checked = !checked; // undo because it's managed by a State.Mutable<boolean>
                checkbutton.event.emit('trySetChecked', checked);
                return;
            }
            onChange();
        });
        function onChange() {
            state.value = inputElement.checked;
            checkbutton.style.toggle(inputElement.checked, 'checkbutton--checked');
            checkbutton.event.emit('setChecked', inputElement.checked);
        }
        return checkbutton;
    });
    exports.default = Checkbutton;
});
define("ui/component/OAuthService", ["require", "exports", "model/Session", "ui/Component", "ui/component/core/Checkbutton", "utility/State"], function (require, exports, Session_1, Component_15, Checkbutton_1, State_17) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Session_1 = __importDefault(Session_1);
    Component_15 = __importDefault(Component_15);
    Checkbutton_1 = __importDefault(Checkbutton_1);
    State_17 = __importDefault(State_17);
    const OAuthService = Component_15.default.Builder((component, service, reauthDangerToken) => {
        const authedAtStart = !!Session_1.default.Auth.get(service.name);
        const authorisationState = Session_1.default.Auth.authorisations.map(component, authorisations => authorisations.find(authorisation => authorisation.service === service.name));
        const isAuthed = State_17.default.Truthy(component, authorisationState);
        const button = component
            .and(Checkbutton_1.default)
            .setChecked(authedAtStart)
            .style('oauth-service')
            .ariaRole('button')
            .attributes.remove('aria-checked')
            .style.bind(isAuthed, 'oauth-service--authenticated')
            .style.setVariable('colour', `#${service.colour.toString(16)}`)
            .append((0, Component_15.default)('img')
            .style('oauth-service-icon')
            .attributes.set('src', service.icon))
            .append((0, Component_15.default)()
            .style('oauth-service-name')
            .text.set(service.name))
            .extend(button => ({}));
        button.style.bind(button.disabled, 'button--disabled', 'oauth-service--disabled');
        if (!reauthDangerToken)
            (0, Component_15.default)()
                .style('oauth-service-state')
                .style.bind(isAuthed, 'oauth-service-state--authenticated')
                .style.bind(State_17.default.Map(button, [button.hoveredOrFocused, button.disabled], (focus, disabled) => focus && !disabled), 'oauth-service-state--focus')
                .appendTo((0, Component_15.default)()
                .style('oauth-service-state-wrapper')
                .style.bind(button.hoveredOrFocused, 'oauth-service-state-wrapper--focus')
                .appendTo(button));
        const username = (0, Component_15.default)()
            .style('oauth-service-username')
            .style.bind(isAuthed, 'oauth-service-username--has-username')
            .ariaHidden()
            .appendTo(button);
        authorisationState.use(button, authorisation => {
            button.ariaLabel.use(quilt => quilt[`view/account/auth/service/accessibility/${authorisation ? 'disconnect' : 'connect'}`](service.name, authorisation?.display_name));
            username.text.set(authorisation?.display_name ?? '');
        });
        button.onRooted(() => {
            button.event.subscribe('click', async (event) => {
                if (button.disabled.value)
                    return;
                event.preventDefault();
                if (reauthDangerToken) {
                    if (!Session_1.default.Auth.canRequestDangerToken())
                        return;
                    const granted = await Session_1.default.Auth.requestDangerToken(reauthDangerToken, service);
                    if (granted)
                        button.event.bubble('DangerTokenGranted', reauthDangerToken);
                    else
                        ;
                    // TODO show notification
                    return;
                }
                let auth = Session_1.default.Auth.get(service.name);
                if (auth)
                    await Session_1.default.Auth.unauth(auth.id);
                else
                    await Session_1.default.Auth.auth(service);
                auth = Session_1.default.Auth.get(service.name);
                event.host.setChecked(!!auth);
            });
        });
        return button;
    });
    exports.default = OAuthService;
});
define("ui/component/OAuthServices", ["require", "exports", "endpoint/auth/EndpointAuthServices", "model/Session", "ui/Component", "ui/component/core/Block", "ui/component/core/Placeholder", "ui/component/core/Slot", "ui/component/OAuthService", "utility/Objects", "utility/State"], function (require, exports, EndpointAuthServices_1, Session_2, Component_16, Block_2, Placeholder_1, Slot_2, OAuthService_1, Objects_4, State_18) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    EndpointAuthServices_1 = __importDefault(EndpointAuthServices_1);
    Session_2 = __importDefault(Session_2);
    Component_16 = __importDefault(Component_16);
    Block_2 = __importDefault(Block_2);
    Placeholder_1 = __importDefault(Placeholder_1);
    Slot_2 = __importDefault(Slot_2);
    OAuthService_1 = __importDefault(OAuthService_1);
    Objects_4 = __importDefault(Objects_4);
    State_18 = __importDefault(State_18);
    const OAuthServices = Component_16.default.Builder(async (component, state, reauthDangerToken) => {
        const block = component
            .and(Block_2.default)
            .viewTransition('oauth-services')
            .style('oauth-service-container')
            .style.toggle(!!reauthDangerToken, 'oauth-service-container--reauth-list')
            .extend(block => ({}));
        if (reauthDangerToken) {
            block.type('flush');
        }
        else {
            state.use(component, state => {
                block.title.text.use(`view/account/auth/${state}/title`);
                block.description.text.use(`view/account/auth/${state}/description`);
            });
        }
        const list = (0, Component_16.default)()
            .style('oauth-service-list')
            .appendTo(block.content);
        const services = await EndpointAuthServices_1.default.query();
        if (toast.handleError(services)) {
            console.error(services);
            return block;
        }
        (0, Slot_2.default)()
            .use(Session_2.default.has, (slot, session) => {
            if (!session)
                return (0, Component_16.default)()
                    .and(Placeholder_1.default)
                    .text.use('view/account/auth/none/needs-session')
                    .appendTo(slot);
            for (const service of Objects_4.default.values(services.data))
                if (!service.disabled)
                    if (!reauthDangerToken || Session_2.default.Auth.isAuthed(service))
                        (0, OAuthService_1.default)(service, reauthDangerToken)
                            .bindDisabled(State_18.default
                            .Use(component, { authorisations: Session_2.default.Auth.authorisations, author: Session_2.default.Auth.author })
                            .map(component, ({ authorisations, author }) => true
                            && !reauthDangerToken
                            && !!author
                            && authorisations.length === 1
                            && authorisations[0].service === service.name), 'singly-authed-service')
                            // .event.subscribe("dangerTokenGranted", event => block.event.emit("dangerTokenGranted"))
                            .appendTo(slot);
        })
            .appendTo(list);
        return block;
    });
    exports.default = OAuthServices;
});
define("ui/component/core/ConfirmDialog", ["require", "exports", "model/Session", "ui/Component", "ui/component/core/BlockDialog", "ui/component/core/Button", "ui/component/core/Paragraph", "ui/component/OAuthServices", "ui/utility/StringApplicator", "utility/State"], function (require, exports, Session_3, Component_17, BlockDialog_1, Button_3, Paragraph_2, OAuthServices_1, StringApplicator_1, State_19) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Session_3 = __importDefault(Session_3);
    Component_17 = __importDefault(Component_17);
    BlockDialog_1 = __importDefault(BlockDialog_1);
    Button_3 = __importDefault(Button_3);
    Paragraph_2 = __importDefault(Paragraph_2);
    OAuthServices_1 = __importDefault(OAuthServices_1);
    State_19 = __importDefault(State_19);
    const ConfirmDialog = Object.assign(Component_17.default.Builder(async (component, definition) => {
        const dialog = component.and(BlockDialog_1.default);
        const state = (0, State_19.default)(undefined);
        dialog.title.text.use(definition?.titleTranslation ?? 'shared/prompt/confirm');
        if (definition?.bodyTranslation)
            (0, Component_17.default)()
                .setMarkdownContent({ body: StringApplicator_1.QuiltHelper.toString(definition.bodyTranslation) })
                .appendTo(dialog.content);
        const cancelButton = (0, Button_3.default)()
            .text.use(definition?.cancelButtonTranslation ?? 'shared/action/cancel')
            .appendTo(dialog.footer.right);
        const confirmButton = (0, Button_3.default)()
            .type('primary')
            .text.use(definition?.confirmButtonTranslation ?? 'shared/action/confirm')
            .appendTo(dialog.footer.right);
        if (definition?.dangerToken) {
            confirmButton.setDisabled(true, 'danger-token');
            (0, Paragraph_2.default)()
                .text.use('shared/prompt/reauth')
                .appendTo(dialog.content);
            const authServices = await (0, OAuthServices_1.default)(Session_3.default.Auth.state, definition.dangerToken);
            authServices
                .event.subscribe('DangerTokenGranted', () => confirmButton.setDisabled(false, 'danger-token'))
                .appendTo(dialog.content);
        }
        return dialog
            .extend(dialog => ({
            state,
            cancelButton,
            confirmButton,
            await(owner) {
                state.value = undefined;
                dialog.open();
                return new Promise(resolve => owner
                    ? dialog.state.await(owner, [true, false], resolve)
                    : dialog.state.awaitManual([true, false], resolve));
            },
            cancel() {
                state.value = false;
                dialog.close();
            },
            confirm() {
                state.value = true;
                dialog.close();
            },
        }))
            .onRooted(dialog => {
            dialog.cancelButton.event.subscribe('click', dialog.cancel);
            dialog.confirmButton.event.subscribe('click', dialog.confirm);
        });
    }), {
        prompt: async (owner, definition) => (await ConfirmDialog(definition))
            .appendTo(document.body)
            .event.subscribe('close', event => event.host.event.subscribe('transitionend', event => event.host.remove()))
            .await(owner),
    });
    exports.default = ConfirmDialog;
});
define("ui/component/core/Form", ["require", "exports", "ui/Component", "ui/component/core/ActionRow", "ui/component/core/Block", "ui/component/core/Button", "utility/State"], function (require, exports, Component_18, ActionRow_2, Block_3, Button_4, State_20) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Component_18 = __importDefault(Component_18);
    ActionRow_2 = __importDefault(ActionRow_2);
    Block_3 = __importDefault(Block_3);
    Button_4 = __importDefault(Button_4);
    State_20 = __importDefault(State_20);
    const Form = Component_18.default.Builder((component, label) => {
        const form = (component.replaceElement('form')
            .style('form')
            .ariaRole('form')
            .ariaLabelledBy(label));
        form.receiveDescendantInsertEvents();
        const valid = State_20.default.Generator(() => (form.element).checkValidity());
        form.event.subscribe(['input', 'change', 'descendantInsert'], () => valid.refresh());
        const content = (form.is(Block_3.default) ? form.content : (0, Component_18.default)())
            .style('form-content');
        const footer = (form.is(Block_3.default) ? form.footer : (0, ActionRow_2.default)())
            .style('form-footer');
        let submitButtonWrapper;
        return form
            .append(content, footer)
            .extend(() => ({
            content, footer,
            submit: undefined,
        }))
            .extendJIT('submit', () => (0, Button_4.default)()
            .type('primary')
            .attributes.set('type', 'submit')
            .bindDisabled(valid.not, 'invalid')
            .appendTo(submitButtonWrapper ??= (0, Component_18.default)()
            .event.subscribe('click', () => {
            if (!form.element.checkValidity())
                form.element.reportValidity();
        })
            .appendTo(footer.right))
            .tweak(submitButton => submitButton
            .style.bind(State_20.default.Every(form, submitButtonWrapper.hovered, submitButton.disabled), 'button--disabled--hover')
            .style.bind(State_20.default.Every(form, submitButtonWrapper.active, submitButton.disabled), 'button--disabled--active')));
    });
    exports.default = Form;
});
define("endpoint/author/EndpointAuthorCreate", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_7) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_7 = __importDefault(Endpoint_7);
    exports.default = (0, Endpoint_7.default)('/author/create', 'post');
});
define("endpoint/author/EndpointAuthorUpdate", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_8) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_8 = __importDefault(Endpoint_8);
    exports.default = (0, Endpoint_8.default)('/author/update', 'post');
});
define("ui/component/core/LabelledRow", ["require", "exports", "ui/Component", "ui/component/core/Label"], function (require, exports, Component_19, Label_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Component_19 = __importDefault(Component_19);
    const LabelledRow = Component_19.default.Builder((row) => {
        row.style('labelled-row');
        let label = (0, Label_1.AutoLabel)().style('labelled-row-label').appendTo(row);
        let content = (0, Component_19.default)().style('labelled-row-content').appendTo(row);
        return row
            .extend(row => ({
            label, content,
        }))
            .extendMagic('label', row => ({
            get: () => label,
            set: newLabel => {
                if (label === newLabel)
                    return;
                Component_19.default.removeContents(label.element);
                label.element.replaceWith(newLabel.element);
                label = newLabel;
            },
        }))
            .extendMagic('content', row => ({
            get: () => content,
            set: newContent => {
                if (content === newContent)
                    return;
                Component_19.default.removeContents(content.element);
                content.element.replaceWith(newContent.element);
                content = newContent;
            },
        }));
    });
    exports.default = LabelledRow;
});
define("ui/component/core/LabelledTable", ["require", "exports", "ui/Component", "ui/component/core/LabelledRow"], function (require, exports, Component_20, LabelledRow_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Component_20 = __importDefault(Component_20);
    LabelledRow_1 = __importDefault(LabelledRow_1);
    const LabelledTable = Component_20.default.Builder((table) => {
        table.style('labelled-table');
        let labelInitialiser;
        let factory;
        return table.extend(table => ({
            label: initialiser => {
                labelInitialiser = initialiser;
                return factory ??= {
                    content: contentInitialiser => {
                        const row = (0, LabelledRow_1.default)()
                            .style('labelled-row--in-labelled-table')
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
define("ui/component/core/ProgressWheel", ["require", "exports", "lang/en-nz", "ui/Component", "ui/component/core/Slot", "utility/State"], function (require, exports, en_nz_1, Component_21, Slot_3, State_21) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    en_nz_1 = __importDefault(en_nz_1);
    Component_21 = __importDefault(Component_21);
    Slot_3 = __importDefault(Slot_3);
    State_21 = __importDefault(State_21);
    const ProgressWheelBuilder = Component_21.default.Builder((component) => {
        return component
            .style('progress-wheel')
            .extend(wheel => ({
            set(definition) {
                wheel.removeContents();
                (0, Component_21.default)()
                    .style('progress-wheel-icon')
                    .tweak(definition.initialiseIcon)
                    .appendTo(wheel);
                const label = (0, Component_21.default)()
                    .style('progress-wheel-label')
                    .tweak(definition.initialiseLabel)
                    .appendTo(wheel);
                label.text.bind(definition.label);
                wheel.style.bindVariable('progress', definition.progress);
                return wheel;
            },
        }));
    });
    const ProgressWheel = Object.assign(ProgressWheelBuilder, {
        Length(length, maxLength) {
            const unusedPercent = State_21.default.MapManual([length, maxLength], (length, maxLength) => length === undefined || !maxLength ? undefined : 1 - length / maxLength);
            const unusedChars = State_21.default.MapManual([length, maxLength], (length, maxLength) => length === undefined || !maxLength ? undefined : maxLength - length);
            return Slot_3.default.using(State_21.default.UseManual({ unusedPercent, unusedChars }), (slot, { unusedPercent, unusedChars }) => unusedPercent === undefined || unusedChars === undefined ? undefined
                : ProgressWheelBuilder()
                    .set({
                    progress: unusedPercent,
                    label: en_nz_1.default['shared/form/progress-wheel/remaining/label'](unusedChars),
                    initialiseIcon: icon => icon
                        .style.bind(unusedPercent < 0, 'progress-wheel-icon--overflowing'),
                }));
        },
        Progress(progress) {
            return ProgressWheelBuilder()
                .set({
                progress,
                label: progress.mapManual(p => en_nz_1.default['shared/form/progress-wheel/progress/label']((p ?? 0) * 100)),
            });
        },
    });
    exports.default = ProgressWheel;
});
define("ui/utility/AnchorManipulator", ["require", "exports", "ui/utility/Mouse", "ui/utility/Viewport", "utility/State", "utility/Time"], function (require, exports, Mouse_3, Viewport_3, State_22, Time_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AllowXOffscreen = exports.AllowYOffscreen = exports.ANCHOR_LOCATION_ALIGNMENTS = exports.ANCHOR_SIDE_VERTICAL = exports.ANCHOR_SIDE_HORIZONTAL = exports.ANCHOR_TYPES = void 0;
    Mouse_3 = __importDefault(Mouse_3);
    Viewport_3 = __importDefault(Viewport_3);
    State_22 = __importDefault(State_22);
    Time_3 = __importDefault(Time_3);
    ////////////////////////////////////
    //#region Anchor Strings
    exports.ANCHOR_TYPES = ['off', 'aligned'];
    exports.ANCHOR_SIDE_HORIZONTAL = ['left', 'right'];
    exports.ANCHOR_SIDE_VERTICAL = ['top', 'bottom'];
    const anchorStrings = new Set(exports.ANCHOR_TYPES
        .flatMap(type => [exports.ANCHOR_SIDE_HORIZONTAL, exports.ANCHOR_SIDE_VERTICAL]
        .flatMap(sides => sides
        .map(side => `${type} ${side}`)))
        .flatMap(type => [type, `sticky ${type}`]));
    anchorStrings.add('centre');
    anchorStrings.add('sticky centre');
    function isAnchorString(value) {
        if (anchorStrings.has(value)) {
            return true;
        }
        if (typeof value !== 'string') {
            return false;
        }
        const lastSpace = value.lastIndexOf(' ');
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
        const sticky = anchor.startsWith('sticky');
        if (sticky) {
            anchor = anchor.slice(7);
        }
        const simpleAnchor = anchor;
        if (simpleAnchor === 'centre') {
            return { sticky, type: 'centre', side: 'centre', offset: 0 };
        }
        const [type, side, offset] = simpleAnchor.split(' ');
        return {
            sticky,
            type,
            side,
            offset: offset ? +offset : 0,
        };
    }
    exports.ANCHOR_LOCATION_ALIGNMENTS = ['left', 'centre', 'right'];
    //#endregion
    ////////////////////////////////////
    ////////////////////////////////////
    //#region Implementation
    exports.AllowYOffscreen = { allowYOffscreen: true };
    exports.AllowXOffscreen = { allowXOffscreen: true };
    function AnchorManipulator(host) {
        let locationPreference;
        let refCache;
        const location = (0, State_22.default)(undefined);
        let currentAlignment;
        let from;
        let lastRender = 0;
        let rerenderTimeout;
        const subscribed = [];
        const addSubscription = (use) => use && subscribed.push(use);
        let unuseFrom;
        const result = {
            state: location,
            isMouse: () => !locationPreference?.length,
            from: component => {
                unuseFrom?.();
                from = component;
                unuseFrom = from?.removed.useManual(removed => {
                    if (removed) {
                        from = undefined;
                        unuseFrom?.();
                        unuseFrom = undefined;
                    }
                });
                return host;
            },
            reset: () => {
                locationPreference = undefined;
                result.markDirty();
                return host;
            },
            add: (...config) => {
                const options = typeof config[config.length - 1] === 'string' ? undefined
                    : config.pop();
                let [xAnchor, xRefSelector, yAnchor, yRefSelector] = config;
                if (isAnchorString(xRefSelector)) {
                    yRefSelector = yAnchor;
                    yAnchor = xRefSelector;
                    xRefSelector = '*';
                }
                yRefSelector ??= '*';
                locationPreference ??= [];
                locationPreference.push({
                    xAnchor: parseAnchor(xAnchor),
                    xRefSelector,
                    yAnchor: parseAnchor(yAnchor),
                    yRefSelector,
                    options,
                });
                result.markDirty();
                return host;
            },
            orElseHide: () => {
                locationPreference?.push(false);
                return host;
            },
            markDirty: () => {
                location.value = undefined;
                if (lastRender) {
                    const timeSinceLastRender = Date.now() - lastRender;
                    if (timeSinceLastRender > Time_3.default.frame)
                        result.apply();
                    else if (rerenderTimeout === undefined)
                        rerenderTimeout = window.setTimeout(result.apply, Time_3.default.frame - timeSinceLastRender);
                }
                return host;
            },
            get: () => {
                if (location.value)
                    return location.value;
                for (const unuse of subscribed)
                    unuse();
                const anchoredBox = host?.rect.value;
                if (!anchoredBox.width || !anchoredBox.height) {
                    location.value = undefined;
                    return { x: 0, y: 0, mouse: false };
                }
                if (anchoredBox && locationPreference && from) {
                    for (const preference of locationPreference) {
                        if (!preference)
                            return location.value ??= { mouse: false, x: -10000, y: -10000, padX: false };
                        let alignment = 'left';
                        const xConf = preference.xAnchor;
                        const xRef = resolveAnchorRef(preference.xRefSelector);
                        const xBox = xRef?.rect.value;
                        addSubscription(xRef?.rect.subscribe(host, result.markDirty));
                        const xCenter = (xBox?.left ?? 0) + (xBox?.width ?? Viewport_3.default.size.value.w) / 2;
                        const xRefX = (xConf.side === 'right' ? xBox?.right : xConf.side === 'left' ? xBox?.left : xCenter) ?? xCenter;
                        let x;
                        switch (xConf.type) {
                            case 'aligned':
                                x = xConf.side === 'right' ? xRefX - anchoredBox.width - xConf.offset : xRefX + xConf.offset;
                                alignment = xConf.side;
                                break;
                            case 'off':
                                x = xConf.side === 'right' ? xRefX + xConf.offset : xRefX - anchoredBox.width - xConf.offset;
                                // alignment is inverted side for "off"
                                alignment = xConf.side === 'left' ? 'right' : 'left';
                                break;
                            case 'centre':
                                x = xRefX - anchoredBox.width / 2;
                                alignment = 'centre';
                                break;
                        }
                        if (preference.options?.xValid?.(x, xBox, anchoredBox) === false) {
                            continue;
                        }
                        if (!xConf.sticky && anchoredBox.width < Viewport_3.default.size.value.w && !preference.options?.allowXOffscreen) {
                            const isXOffScreen = x < 0 || x + anchoredBox.width > Viewport_3.default.size.value.w;
                            if (isXOffScreen) {
                                continue;
                            }
                        }
                        const yConf = preference.yAnchor;
                        const yRef = resolveAnchorRef(preference.yRefSelector);
                        const yBox = yRef?.rect.value;
                        addSubscription(yRef?.rect.subscribe(host, result.markDirty));
                        const yCenter = (yBox?.top ?? 0) + (yBox?.height ?? Viewport_3.default.size.value.h) / 2;
                        const yRefY = (yConf.side === 'bottom' ? yBox?.bottom : yConf.side === 'top' ? yBox?.top : yCenter) ?? yCenter;
                        let y;
                        switch (yConf.type) {
                            case 'aligned':
                                y = yConf.side === 'bottom' ? yRefY - anchoredBox.height - yConf.offset : yRefY + yConf.offset;
                                break;
                            case 'off':
                                y = yConf.side === 'bottom' ? yRefY + yConf.offset : yRefY - anchoredBox.height - yConf.offset;
                                break;
                            case 'centre':
                                y = yRefY - anchoredBox.height / 2;
                                break;
                        }
                        if (preference.options?.yValid?.(y, yBox, anchoredBox) === false) {
                            continue;
                        }
                        if (!yConf.sticky && anchoredBox.height < Viewport_3.default.size.value.h && !preference.options?.allowYOffscreen) {
                            const isYOffScreen = y < 0
                                || y + anchoredBox.height > Viewport_3.default.size.value.h;
                            if (isYOffScreen) {
                                continue;
                            }
                        }
                        return location.value ??= { mouse: false, padX: xConf.type === 'off', alignment, x, y, yRefBox: yBox, xRefBox: xBox };
                    }
                }
                return location.value ??= { mouse: true, padX: true, ...Mouse_3.default.state.value };
            },
            apply: () => {
                const location = result.get();
                let alignment = location.alignment ?? currentAlignment;
                if (location.mouse) {
                    const shouldFlip = currentAlignment === 'centre' || (currentAlignment === 'right' ? location.x < Viewport_3.default.size.value.w / 2 - 200 : location.x > Viewport_3.default.size.value.w / 2 + 200);
                    if (shouldFlip) {
                        alignment = currentAlignment === 'left' ? 'right' : 'left';
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
                rerenderTimeout = undefined;
                lastRender = Date.now();
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
                ref = selector.startsWith('>>')
                    ? from?.element.querySelector(selector.slice(2))?.component
                    : from?.element.closest(selector)?.component;
                if (ref) {
                    if (getComputedStyle(ref.element).display === 'contents') {
                        const children = ref.element.children;
                        if (!children.length)
                            console.warn('Anchor ref has display: contents and no children');
                        else {
                            ref = children[0].component ?? ref;
                            if (children.length > 1)
                                console.warn('Anchor ref has display: contents and multiple children');
                        }
                    }
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
define("ui/component/core/ext/Input", ["require", "exports", "ui/Component", "ui/component/core/Block", "ui/component/core/Popover", "ui/component/core/ProgressWheel", "ui/component/core/Slot", "ui/utility/AnchorManipulator", "ui/utility/StringApplicator", "ui/utility/Viewport", "utility/State"], function (require, exports, Component_22, Block_4, Popover_2, ProgressWheel_1, Slot_4, AnchorManipulator_1, StringApplicator_2, Viewport_4, State_23) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Component_22 = __importDefault(Component_22);
    Popover_2 = __importDefault(Popover_2);
    ProgressWheel_1 = __importDefault(ProgressWheel_1);
    Slot_4 = __importDefault(Slot_4);
    StringApplicator_2 = __importDefault(StringApplicator_2);
    Viewport_4 = __importDefault(Viewport_4);
    State_23 = __importDefault(State_23);
    function createHintText(hint) {
        return (0, Component_22.default)()
            .style('input-popover-hint-text')
            .text.bind(hint);
    }
    const Input = Object.assign(Component_22.default.Extension((component) => {
        const hintText = (0, State_23.default)(undefined);
        const maxLength = (0, State_23.default)(undefined);
        const length = (0, State_23.default)(undefined);
        const invalid = (0, State_23.default)('');
        const popoverOverride = (0, State_23.default)(false);
        const hasPopover = State_23.default.MapManual([hintText, maxLength, popoverOverride], (hintText, maxLength, override) => override || !!hintText || !!maxLength);
        let popover;
        hasPopover.subscribeManual(hasPopover => {
            if (!hasPopover) {
                popover?.remove();
                popover = undefined;
                return;
            }
            if (component.removed.value)
                return;
            popover = (0, Popover_2.default)()
                .setNormalStacking()
                .style('input-popover')
                .setOwner(component)
                .tweak(popover => {
                if (popoverOverride.value)
                    return;
                Slot_4.default.using(hintText, (slot, hintText) => !hintText ? undefined : createHintText(hintText))
                    .appendTo(popover);
                ProgressWheel_1.default.Length(length, maxLength)
                    .appendTo(popover);
            })
                .tweak(popoverInitialiser, component)
                .appendTo(document.body);
            Viewport_4.default.tablet.use(popover, isTablet => {
                const tablet = isTablet();
                popover?.type.toggle(!tablet, 'flush');
                if (tablet) {
                    popover?.anchor.reset()
                        .anchor.from(component)
                        .anchor.add('aligned left', 'aligned top')
                        .anchor.add('aligned left', 'aligned bottom')
                        .setCloseOnInput(true);
                }
                else {
                    popover?.anchor.reset()
                        .anchor.from(component)
                        .anchor.add('off right', `.${Block_4.BlockClasses.Main}`, 'aligned top', {
                        ...AnchorManipulator_1.AllowYOffscreen,
                        yValid(y, hostBox, popoverBox) {
                            // only align top if the popover box is taller than the host box
                            return popoverBox.height > (hostBox?.height ?? 0);
                        },
                    })
                        .anchor.add('off right', `.${Block_4.BlockClasses.Main}`, 'centre', AnchorManipulator_1.AllowYOffscreen)
                        .setCloseOnInput(false);
                }
            });
        });
        let customPopoverVisibilityHandling = false;
        component.hasFocused.subscribeManual(hasFocused => {
            if (customPopoverVisibilityHandling)
                return;
            if (Viewport_4.default.tablet.value)
                return;
            popover?.toggle(hasFocused).anchor.apply();
        });
        const customInvalidMessage = (0, State_23.default)(undefined);
        let validityPipeComponent;
        customInvalidMessage.subscribe(component, invalidMessage => {
            const validity = typeof invalidMessage === 'object' ? invalidMessage.toString() : invalidMessage;
            const input = validityPipeComponent?.element ?? component.element;
            input.setCustomValidity?.(validity ?? '');
        });
        component.event.subscribe(['input', 'change'], refreshValidity);
        let popoverInitialiser;
        const input = component.extend(component => ({
            required: (0, State_23.default)(false),
            hint: (0, StringApplicator_2.default)(component, value => hintText.value = value),
            maxLength,
            length,
            invalid,
            hasPopover,
            disableDefaultHintPopoverVisibilityHandling() {
                customPopoverVisibilityHandling = true;
                return component;
            },
            getPopover: () => popover,
            setMaxLength(newLength) {
                maxLength.value = newLength;
                return component;
            },
            setRequired: (required = true) => {
                component.attributes.toggle(required, 'required');
                component.required.asMutable?.setValue(required);
                return component;
            },
            setLabel: label => {
                component.setName(label?.for);
                component.setId(label?.for);
                label?.setInput(component);
                return component;
            },
            tweakPopover(initialiser) {
                popoverInitialiser = initialiser;
                return component;
            },
            setCustomHintPopover(initialiser) {
                popoverInitialiser = initialiser;
                popoverOverride.value = true;
                return component;
            },
            pipeValidity(to) {
                validityPipeComponent = to;
                return component;
            },
            setCustomInvalidMessage(message) {
                customInvalidMessage.value = message;
                refreshValidity();
                return component;
            },
            refreshValidity,
        }));
        return input;
        function refreshValidity() {
            invalid.value = _
                ?? customInvalidMessage.value?.toString()
                ?? component.element.validationMessage
                ?? '';
            return input;
        }
    }), {
        createHintText,
    });
    exports.default = Input;
});
define("ui/component/core/TextInput", ["require", "exports", "lang/en-nz", "ui/Component", "ui/component/core/ext/Input", "ui/utility/StringApplicator", "utility/State"], function (require, exports, en_nz_2, Component_23, Input_1, StringApplicator_3, State_24) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FilterFunction = FilterFunction;
    en_nz_2 = __importDefault(en_nz_2);
    Component_23 = __importDefault(Component_23);
    Input_1 = __importDefault(Input_1);
    StringApplicator_3 = __importDefault(StringApplicator_3);
    State_24 = __importDefault(State_24);
    function FilterFunction(fn) {
        return ((before, selected, after) => selected === undefined
            ? fn('', before, '').join('')
            : fn(before, selected, after));
    }
    const TextInput = Component_23.default.Builder('input', (component) => {
        let shouldIgnoreInputEvent = false;
        let filterFunction;
        const state = (0, State_24.default)('');
        const input = component
            .and(Input_1.default)
            .style('text-input')
            .attributes.set('type', 'text')
            .extend(input => ({
            value: '',
            state,
            default: (0, StringApplicator_3.default)(input, value => {
                if (input.value === '') {
                    input.value = value ?? '';
                    state.value = value ?? '';
                    input.length.asMutable?.setValue(value?.length ?? 0);
                }
            }),
            placeholder: (0, StringApplicator_3.default)(input, value => {
                input.attributes.set('placeholder', value);
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
            .extendMagic('value', input => ({
            get: () => input.element.value || '',
            set: (value) => {
                const element = input.element;
                element.value = value;
                applyFilter('change');
                state.value = element.value;
                input.length.asMutable?.setValue(element.value.length);
            },
        }));
        input.length.asMutable?.setValue(0);
        input.event.subscribe(['input', 'change'], event => {
            applyFilter(event.type);
            if (shouldIgnoreInputEvent)
                return;
            state.value = input.value;
            input.length.asMutable?.setValue(input.value.length);
            let invalid;
            if ((input.length.value ?? 0) > (input.maxLength.value ?? Infinity))
                invalid = en_nz_2.default['shared/form/invalid/too-long']();
            input.setCustomInvalidMessage(invalid);
        });
        return input;
        function applyFilter(type) {
            const element = input.element.asType('input');
            if (filterFunction && element) {
                if (type === 'change') {
                    element.value = filterFunction('', input.value, '').join('');
                }
                else {
                    let { selectionStart, selectionEnd, value } = element;
                    const hasSelection = selectionStart !== null || selectionEnd !== null;
                    selectionStart ??= value.length;
                    selectionEnd ??= value.length;
                    const [beforeSelection, selection, afterSelection] = filterFunction(value.slice(0, selectionStart), value.slice(selectionStart, selectionEnd), value.slice(selectionEnd));
                    element.value = beforeSelection + selection + afterSelection;
                    if (hasSelection)
                        element.setSelectionRange(beforeSelection.length, beforeSelection.length + selection.length);
                }
            }
        }
    });
    exports.default = TextInput;
});
define("ui/component/core/TextInputBlock", ["require", "exports", "ui/Component", "ui/component/core/TextInput"], function (require, exports, Component_24, TextInput_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Component_24 = __importDefault(Component_24);
    TextInput_1 = __importDefault(TextInput_1);
    const TextInputBlock = Component_24.default.Builder((component) => {
        const inputs = [];
        const block = component
            .style('text-input-block')
            .extend(block => ({
            inputs,
            addInput: (initialiser) => {
                const input = (0, TextInput_1.default)()
                    .style('text-input-block-input')
                    .tweak(initialiser)
                    .tweak(input => input.removed.awaitManual(true, () => {
                    inputs.filterInPlace(i => i !== input);
                    const firstInput = inputs.at(0);
                    firstInput?.style('text-input-block-input--first');
                    firstInput?.previousSibling?.remove(); // remove previous divider if it exists
                    inputs.at(-1)?.style('text-input-block-input--last');
                    inputs.at(-1)?.parent?.style('text-input-block-input-wrapper--last');
                }))
                    .appendTo((0, Component_24.default)()
                    .style('text-input-block-input-wrapper')
                    .appendTo(block));
                if (!inputs.length)
                    input.style('text-input-block-input--first');
                inputs.at(-1)?.style.remove('text-input-block-input--last');
                inputs.at(-1)?.parent?.style.remove('text-input-block-input-wrapper--last');
                inputs.push(input);
                input.style('text-input-block-input--last');
                input.parent?.style('text-input-block-input-wrapper--last');
                return block;
            },
        }));
        return block;
    });
    exports.default = TextInputBlock;
});
define("ui/component/core/LabelledTextInputBlock", ["require", "exports", "ui/Component", "ui/component/core/Label", "ui/component/core/TextInputBlock"], function (require, exports, Component_25, Label_2, TextInputBlock_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Component_25 = __importDefault(Component_25);
    TextInputBlock_1 = __importDefault(TextInputBlock_1);
    const LabelledTextInputBlock = Component_25.default.Builder((block) => {
        block.style('labelled-text-input-block', 'labelled-row')
            .ariaRole('group');
        const labels = (0, Component_25.default)()
            .style('labelled-text-input-block-labels')
            .appendTo(block);
        const inputs = (0, TextInputBlock_1.default)()
            .style('labelled-text-input-block-inputs')
            .appendTo(block);
        let labelInitialiser;
        let factory;
        return block.extend(block => ({
            labels,
            inputs,
            label: initialiser => {
                labelInitialiser = initialiser;
                return factory ??= {
                    input: inputInitialiser => {
                        const rowNumber = inputs.inputs.length + 1;
                        const label = (0, Label_2.AutoLabel)()
                            .style('labelled-text-input-block-label')
                            .style.setProperty('grid-row', `${rowNumber}`)
                            .appendTo(labels);
                        labelInitialiser(label);
                        let input;
                        inputs.addInput(i => input = i
                            .style('labelled-text-input-block-input')
                            .style.setProperty('grid-row', `${rowNumber}`)
                            .tweak(input => inputInitialiser(input.setLabel(label), label)));
                        input.parent?.style('labelled-text-input-block-input-wrapper');
                        labelInitialiser = undefined;
                        return block;
                    },
                };
            },
        }));
    });
    exports.default = LabelledTextInputBlock;
});
define("ui/Announcer", ["require", "exports", "ui/Component"], function (require, exports, Component_26) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Component_26 = __importDefault(Component_26);
    var Announcer;
    (function (Announcer) {
        let assertive;
        function getAssertive() {
            return assertive ??= (0, Component_26.default)()
                .attributes.set('aria-live', 'assertive')
                .style.setProperty('opacity', '0')
                .style.setProperty('user-select', 'none')
                .style.setProperty('pointer-events', 'none')
                .style.setProperty('position', 'fixed')
                .appendTo(document.body);
        }
        let polite;
        function getPolite() {
            return polite ??= (0, Component_26.default)()
                .attributes.set('aria-live', 'polite')
                .style.setProperty('opacity', '0')
                .style.setProperty('user-select', 'none')
                .style.setProperty('pointer-events', 'none')
                .style.setProperty('position', 'fixed')
                .appendTo(document.body);
        }
        function interrupt(id, announcer) {
            announceInternal(getAssertive(), id, announcer);
        }
        Announcer.interrupt = interrupt;
        function announce(id, announcer) {
            announceInternal(getPolite(), id, announcer);
        }
        Announcer.announce = announce;
        function announceInternal(within, id, announcer) {
            const components = [];
            announcer(keyOrHandler => {
                components.push((0, Component_26.default)('p')
                    .attributes.set('data-id', id)
                    .text.use(keyOrHandler));
            });
            const current = getAnnouncementElements(within, id);
            if (current.length) {
                const currentText = current.map(el => el.textContent).join('\n');
                const newText = components.map(component => component.element.textContent).join('\n');
                if (newText === currentText)
                    return;
                for (const element of current)
                    element.remove();
            }
            for (const component of components)
                component.appendTo(within);
        }
        function getAnnouncementElements(within, id) {
            return [
                ...within.element.querySelectorAll(`[data-id="${id}"]`),
            ];
        }
    })(Announcer || (Announcer = {}));
    exports.default = Announcer;
});
define("ui/component/core/RadioButton", ["require", "exports", "ui/Component", "ui/component/core/Checkbutton"], function (require, exports, Component_27, Checkbutton_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Component_27 = __importDefault(Component_27);
    Checkbutton_2 = __importDefault(Checkbutton_2);
    const RadioButton = Component_27.default.Builder(() => {
        const radio = (0, Checkbutton_2.default)();
        radio.ariaRole('radio');
        radio.input.attributes.set('type', 'radio');
        return radio.extend(radio => ({}));
    });
    exports.default = RadioButton;
});
define("ui/view/shared/ext/ViewTransition", ["require", "exports", "ui/Component", "utility/Arrays"], function (require, exports, Component_28, Arrays_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Component_28 = __importDefault(Component_28);
    var ViewTransition;
    (function (ViewTransition) {
        const DATA_VIEW_TRANSITION_NAME = 'data-view-transition-name';
        const DATA_SUBVIEW_TRANSITION_NAME = 'data-subview-transition-name';
        const DATA_ID = 'data-view-transition-id';
        const VIEW_TRANSITION_CLASS_VIEW = 'view-transition';
        const VIEW_TRANSITION_CLASS_SUBVIEW = 'subview-transition';
        const VIEW_TRANSITION_CLASS_DELAY = 'view-transition-delay';
        const PADDING = 100;
        Component_28.default.extend(component => component.extend(component => ({
            viewTransition(name) {
                if (name) {
                    name = name.replace(/[^a-z0-9-]+/g, '-').toLowerCase();
                    component.attributes.set(DATA_VIEW_TRANSITION_NAME, name);
                    component.attributes.compute(DATA_ID, () => `${id++}`);
                }
                else {
                    component.attributes.remove(DATA_VIEW_TRANSITION_NAME);
                    component.attributes.remove(DATA_ID);
                }
                return component;
            },
            subviewTransition(name) {
                if (name) {
                    name = name.replace(/[^a-z0-9-]+/g, '-').toLowerCase();
                    component.attributes.set(DATA_SUBVIEW_TRANSITION_NAME, name);
                    component.attributes.compute(DATA_ID, () => `${id++}`);
                }
                else {
                    component.attributes.remove(DATA_SUBVIEW_TRANSITION_NAME);
                    component.attributes.remove(DATA_ID);
                }
                return component;
            },
        })));
        let id = 0;
        let i = 0;
        let queuedUnapply;
        function perform(type, name, swap) {
            queuedUnapply = undefined;
            if (typeof name === 'function') {
                swap = name;
                name = undefined;
            }
            reapply(type, name);
            async function doSwap() {
                await swap();
                reapply(type, name);
            }
            const transition = document.startViewTransition(doSwap);
            const id = queuedUnapply = i++;
            transition.finished
                .catch(async (err) => {
                if (!String(err).includes('AbortError'))
                    return;
                await doSwap();
            })
                .finally(() => {
                if (queuedUnapply !== id)
                    // another view transition started, no unapply
                    return;
                unapply(type);
            });
            return {
                finished: transition.finished.catch(() => { }),
                ready: transition.ready.catch(() => { }),
                updateCallbackDone: transition.updateCallbackDone.catch(() => { }),
                skipTransition: () => transition.skipTransition(),
            };
        }
        ViewTransition.perform = perform;
        function reapply(type, name) {
            const components = getComponents(type, name).filter(isInView);
            let i = 0;
            if (type === 'view')
                for (const component of components) {
                    component.classes.add(VIEW_TRANSITION_CLASS_VIEW);
                    const name = component.attributes.get(DATA_VIEW_TRANSITION_NAME);
                    component.style.setVariable('view-transition-delay', `${VIEW_TRANSITION_CLASS_DELAY}-${i}`);
                    component.style.setProperty('view-transition-name', `${VIEW_TRANSITION_CLASS_VIEW}-${name}-${i++}`);
                }
            else
                for (const component of components) {
                    component.classes.add(VIEW_TRANSITION_CLASS_SUBVIEW);
                    const name = component.attributes.get(DATA_SUBVIEW_TRANSITION_NAME);
                    const id = +component.attributes.get(DATA_ID) || 0;
                    component.style.setProperty('view-transition-name', `${VIEW_TRANSITION_CLASS_SUBVIEW}-${name}-${id}`);
                    component.style.setVariable('view-transition-delay', `${VIEW_TRANSITION_CLASS_DELAY}-${i++}`);
                }
        }
        ViewTransition.reapply = reapply;
        function unapply(type) {
            for (const component of getComponents(type)) {
                component.classes.remove(VIEW_TRANSITION_CLASS_VIEW);
                component.classes.remove(VIEW_TRANSITION_CLASS_SUBVIEW);
                component.style.removeProperties('view-transition-name');
                component.style.removeVariables('view-transition-delay');
            }
        }
        ViewTransition.unapply = unapply;
        function isInView(component) {
            const rect = component.element.getBoundingClientRect();
            return true
                && rect.bottom > -PADDING && rect.top < window.innerHeight + PADDING
                && rect.right > -PADDING && rect.left < window.innerWidth + PADDING;
        }
        function getComponents(type, name) {
            return [...document.querySelectorAll(`[${type === 'view' ? DATA_VIEW_TRANSITION_NAME : DATA_SUBVIEW_TRANSITION_NAME}${name ? `="${name}"` : ''}]`)]
                .map(e => e.component)
                .filter(Arrays_3.NonNullish);
        }
    })(ViewTransition || (ViewTransition = {}));
    exports.default = ViewTransition;
});
define("utility/Store", ["require", "exports", "utility/State"], function (require, exports, State_25) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    State_25 = __importDefault(State_25);
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
                    return s[key] ??= (0, State_25.default)(Store.get(key));
                },
            });
        }
        static get full() {
            const result = {};
            for (const [key, value] of Object.entries(localStorage))
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
                result[key] = JSON.parse(value);
            return result;
        }
        static has(key) {
            return localStorage.getItem(key) !== null;
        }
        static get(key) {
            const value = localStorage.getItem(key);
            try {
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
            // Store.event.emit(`set${key[0].toUpperCase()}${key.slice(1)}` as keyof IStoreEvents, { value, oldValue } as never)
            const state = states?.[key];
            if (state)
                state.value = value;
            return true;
        }
        static delete(key) {
            // const oldValue = Store.get(key)
            localStorage.removeItem(key);
            // Store.event.emit(`delete${key[0].toUpperCase()}${key.slice(1)}` as keyof IStoreEvents, { oldValue } as never)
            const state = states?.[key];
            if (state)
                state.value = undefined;
            return true;
        }
    }
    exports.default = Store;
    Object.assign(window, { Store });
});
define("ui/component/core/TextEditor", ["require", "exports", "lang/en-nz", "model/Session", "prosemirror-commands", "prosemirror-dropcursor", "prosemirror-example-setup", "prosemirror-gapcursor", "prosemirror-history", "prosemirror-inputrules", "prosemirror-keymap", "prosemirror-markdown", "prosemirror-model", "prosemirror-schema-list", "prosemirror-state", "prosemirror-transform", "prosemirror-view", "ui/Announcer", "ui/Component", "ui/component/core/Button", "ui/component/core/Checkbutton", "ui/component/core/Dialog", "ui/component/core/ext/Input", "ui/component/core/Popover", "ui/component/core/RadioButton", "ui/component/core/Slot", "ui/InputBus", "ui/utility/StringApplicator", "ui/utility/Viewport", "ui/view/shared/ext/ViewTransition", "utility/Arrays", "utility/Define", "utility/Env", "utility/Objects", "utility/State", "utility/Store", "utility/string/Markdown", "utility/Time", "w3c-keyname"], function (require, exports, en_nz_3, Session_4, prosemirror_commands_1, prosemirror_dropcursor_1, prosemirror_example_setup_1, prosemirror_gapcursor_1, prosemirror_history_1, prosemirror_inputrules_1, prosemirror_keymap_1, prosemirror_markdown_1, prosemirror_model_1, prosemirror_schema_list_1, prosemirror_state_1, prosemirror_transform_1, prosemirror_view_1, Announcer_1, Component_29, Button_5, Checkbutton_3, Dialog_2, Input_2, Popover_3, RadioButton_1, Slot_5, InputBus_2, StringApplicator_4, Viewport_5, ViewTransition_1, Arrays_4, Define_4, Env_5, Objects_5, State_26, Store_1, Markdown_2, Time_4, w3c_keyname_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    en_nz_3 = __importDefault(en_nz_3);
    Session_4 = __importDefault(Session_4);
    Announcer_1 = __importDefault(Announcer_1);
    Component_29 = __importDefault(Component_29);
    Button_5 = __importDefault(Button_5);
    Checkbutton_3 = __importDefault(Checkbutton_3);
    Dialog_2 = __importDefault(Dialog_2);
    Input_2 = __importDefault(Input_2);
    Popover_3 = __importDefault(Popover_3);
    RadioButton_1 = __importDefault(RadioButton_1);
    Slot_5 = __importDefault(Slot_5);
    StringApplicator_4 = __importDefault(StringApplicator_4);
    Viewport_5 = __importDefault(Viewport_5);
    ViewTransition_1 = __importDefault(ViewTransition_1);
    Arrays_4 = __importDefault(Arrays_4);
    Define_4 = __importDefault(Define_4);
    Env_5 = __importDefault(Env_5);
    Objects_5 = __importDefault(Objects_5);
    State_26 = __importDefault(State_26);
    Store_1 = __importDefault(Store_1);
    Markdown_2 = __importDefault(Markdown_2);
    Time_4 = __importDefault(Time_4);
    w3c_keyname_1 = __importDefault(w3c_keyname_1);
    function vars(...params) { }
    function types() { }
    ////////////////////////////////////
    //#region Module Augmentation
    const baseKeyName = w3c_keyname_1.default.keyName;
    w3c_keyname_1.default.keyName = (event) => {
        const keyboardEvent = event;
        if (keyboardEvent.code.startsWith('Numpad') && !keyboardEvent.shiftKey && (keyboardEvent.ctrlKey || keyboardEvent.altKey)) {
            Object.defineProperty(event, 'shiftKey', { value: true });
            const str = keyboardEvent.code.slice(6);
            if (str === 'Decimal')
                return '.';
            if (!isNaN(+str))
                return str;
        }
        return baseKeyName(event);
    };
    (0, Define_4.default)(prosemirror_model_1.ResolvedPos.prototype, 'closest', function (node, attrsOrStartingAtDepth, startingAtDepth) {
        if (typeof attrsOrStartingAtDepth === 'number') {
            startingAtDepth = attrsOrStartingAtDepth;
            attrsOrStartingAtDepth = undefined;
        }
        const attrs = attrsOrStartingAtDepth;
        startingAtDepth ??= this.depth;
        for (let depth = startingAtDepth; depth >= 0; depth--) {
            const current = this.node(depth);
            if (current.type === node && (!attrs || current.hasAttrs(attrs)))
                return current;
        }
        return undefined;
    });
    (0, Define_4.default)(prosemirror_model_1.Node.prototype, 'matches', function (type, attrs) {
        if (type !== undefined && this.type !== type)
            return false;
        return attrs === undefined || this.hasAttrs(attrs);
    });
    (0, Define_4.default)(prosemirror_model_1.Node.prototype, 'hasAttrs', function (attrs) {
        for (const [attr, val] of Object.entries(attrs))
            if (this.attrs[attr] !== val)
                return false;
        return true;
    });
    (0, Define_4.default)(prosemirror_model_1.Node.prototype, 'pos', function (document) {
        if (document === this)
            return 0;
        let result;
        document.descendants((node, pos) => {
            if (result !== undefined)
                return false;
            if (node === this) {
                result = pos;
                return false;
            }
        });
        return result;
    });
    (0, Define_4.default)(prosemirror_model_1.Node.prototype, 'parent', function (document) {
        if (document === this)
            return undefined;
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const searchNode = this;
        return searchChildren(document);
        function searchChildren(parent) {
            let result;
            parent.forEach(child => {
                result ??= (child === searchNode ? parent : undefined)
                    ?? searchChildren(child);
            });
            return result;
        }
    });
    (0, Define_4.default)(prosemirror_model_1.Node.prototype, 'depth', function (document) {
        if (document === this)
            return 0;
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const searchNode = this;
        return searchChildren(document, 1);
        function searchChildren(parent, depth) {
            let result;
            parent.forEach(child => {
                result ??= (child === searchNode ? depth : undefined)
                    ?? searchChildren(child, depth + 1);
            });
            return result;
        }
    });
    (0, Define_4.default)(prosemirror_model_1.Fragment.prototype, 'pos', function (document) {
        let result;
        document.descendants((node, pos) => {
            if (result !== undefined)
                return false;
            if (node.content === this) {
                result = pos + 1;
                return false;
            }
        });
        return result;
    });
    (0, Define_4.default)(prosemirror_model_1.Fragment.prototype, 'range', function (document) {
        const pos = this.pos(document);
        if (!pos)
            return undefined;
        const $from = document.resolve(pos);
        const $to = document.resolve(pos + this.size);
        return new prosemirror_model_1.NodeRange($from, $to, Math.min($from.depth, $to.depth));
    });
    (0, Define_4.default)(prosemirror_model_1.Fragment.prototype, 'parent', function (document) {
        if (document.content === this)
            return document;
        let result;
        document.descendants((node, pos) => {
            if (result !== undefined)
                return false;
            if (node.content === this) {
                result = node;
                return false;
            }
        });
        return result;
    });
    (0, Define_4.default)(prosemirror_transform_1.Transform.prototype, 'stripNodeType', function (from, type) {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const tr = this;
        let range = from instanceof prosemirror_model_1.Fragment ? from.range(tr.doc) : from;
        if (!range)
            return this;
        while (stripRange())
            ;
        return this;
        function stripRange() {
            let stripped = false;
            range.parent.forEach((node, pos, index) => {
                if (stripped)
                    return;
                if (index >= range.startIndex && index < range.endIndex) {
                    if (node.type === type) {
                        stripNode(node);
                        stripped = true;
                        return;
                    }
                    if (stripDescendants(node)) {
                        stripped = true;
                        return;
                    }
                }
            });
            return stripped;
        }
        function stripDescendants(node) {
            let stripped = false;
            node.descendants((node, pos) => {
                if (stripped)
                    return;
                if (node.type === type) {
                    stripNode(node);
                    stripped = true;
                    return;
                }
            });
            return stripped;
        }
        function stripNode(node) {
            const nodePos = node.pos(tr.doc);
            if (nodePos === undefined)
                throw new Error('Unable to continue stripping, no pos');
            const liftRange = node.content.range(tr.doc);
            if (!liftRange)
                throw new Error('Unable to continue stripping, unable to resolve node range');
            const depth = (0, prosemirror_transform_1.liftTarget)(liftRange);
            if (depth !== null)
                tr.lift(liftRange, depth);
            if (range) {
                let start = range.$from.pos;
                start = start <= nodePos ? start : start - 1;
                let end = range.$to.pos;
                end = end < nodePos + node.nodeSize ? end - 1 : end - 2;
                const newRange = tr.doc.resolve(start).blockRange(tr.doc.resolve(end));
                if (!newRange)
                    throw new Error('Unable to continue stripping, unable to resolve new range');
                range = newRange;
            }
        }
    });
    //#endregion
    types();
    Session_4.default.setClearedWithSessionChange('textEditorDrafts');
    //#endregion
    vars(w3c_keyname_1.default.keyName);
    types();
    types();
    const schema = new prosemirror_model_1.Schema({
        nodes: Objects_5.default.filterNullish({
            ...prosemirror_markdown_1.schema.spec.nodes.toObject(),
            image: undefined,
            heading: {
                ...prosemirror_markdown_1.schema.spec.nodes.get('heading'),
                content: 'text*',
                toDOM(node) {
                    const heading = (0, Component_29.default)(`h${node.attrs.level}`);
                    heading.style('markdown-heading', `markdown-heading-${node.attrs.level}`);
                    return {
                        dom: heading.element,
                        contentDOM: heading.element,
                    };
                },
            },
            text_align: {
                attrs: { align: { default: 'left', validate: (value) => value === 'left' || value === 'center' || value === 'right' } },
                content: 'block+',
                group: 'block',
                defining: true,
                parseDOM: [
                    { tag: 'center', getAttrs: () => ({ align: 'center' }) },
                    {
                        tag: '*',
                        getAttrs: (element) => {
                            const textAlign = element.style.getPropertyValue('text-align');
                            if (!textAlign)
                                return false;
                            return {
                                align: textAlign === 'justify' || textAlign === 'start' ? 'left'
                                    : textAlign === 'end' ? 'right'
                                        : textAlign,
                            };
                        },
                        priority: 51,
                    },
                ],
                toDOM: (node) => ['div', Objects_5.default.filterNullish({
                        class: node.attrs.align === 'left' ? 'align-left' : undefined,
                        style: `text-align:${node.attrs.align}`,
                    }), 0],
            },
        }),
        marks: {
            ...prosemirror_markdown_1.schema.spec.marks.toObject(),
            underline: {
                parseDOM: [
                    { tag: 'u' },
                    { style: 'text-decoration=underline', clearMark: m => m.type.name === 'underline' },
                ],
                toDOM() { return ['u']; },
            },
            strikethrough: {
                parseDOM: [
                    { tag: 's' },
                    { style: 'text-decoration=line-through', clearMark: m => m.type.name === 'strikethrough' },
                ],
                // toDOM () { return ["s"] },
                toDOM() {
                    const span = document.createElement('span');
                    span.style.setProperty('text-decoration', 'line-through');
                    return span;
                },
            },
            subscript: {
                parseDOM: [
                    { tag: 'sub' },
                ],
                toDOM() { return ['sub']; },
            },
            superscript: {
                parseDOM: [
                    { tag: 'sup' },
                ],
                toDOM() { return ['sup']; },
            },
            mention: {
                attrs: { vanity: { validate: value => typeof value === 'string' && value.length > 0 } },
                parseDOM: [{
                        tag: 'a',
                        getAttrs: (element) => {
                            const vanity = element.getAttribute('vanity');
                            if (!vanity)
                                return false;
                            return { vanity };
                        },
                        priority: 51,
                    }],
                toDOM(mark) {
                    const link = document.createElement('a');
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                    link.setAttribute('vanity', mark.attrs.vanity);
                    link.href = `${Env_5.default.URL_ORIGIN}author/${mark.attrs.vanity}`;
                    link.textContent = `@${mark.attrs.vanity}`;
                    return link;
                },
            },
        },
    });
    //#endregion
    vars(schema);
    types();
    ////////////////////////////////////
    ////////////////////////////////////
    //#region Markdown
    const markdown = Markdown_2.default.clone();
    const REGEX_ATTRIBUTE = (() => {
        const attr_name = '[a-zA-Z_:][a-zA-Z0-9:._-]*';
        const unquoted = '[^"\'=<>`\\x00-\\x20]+';
        const single_quoted = '\'[^\']*\'';
        const double_quoted = '"[^"]*"';
        const attr_value = `(?:${unquoted}|${single_quoted}|${double_quoted})`;
        const attribute = `(${attr_name})(?:\\s*=\\s*(${attr_value}))(?= |$)`;
        return new RegExp(attribute, 'g');
    })();
    const REGEX_CSS_PROPERTY = /^[-a-zA-Z_][a-zA-Z0-9_-]*$/;
    const markdownHTMLNodeRegistry = {
        text_align: {
            getAttrs: token => {
                const align = token.style?.get('text-align');
                if (!['left', 'center', 'right'].includes(align))
                    return undefined;
                return { align };
            },
        },
    };
    const markdownHTMLMarkRegistry = {
        mention: {
            getAttrs: token => {
                const vanity = token.attrGet('vanity');
                if (!vanity)
                    return undefined;
                return { vanity };
            },
            getChildren: token => {
                const vanity = token.attrGet('vanity');
                if (!vanity)
                    return [];
                const TokenClass = token.constructor;
                const textToken = new TokenClass();
                textToken.content = `@${vanity}`;
                textToken.type = 'text';
                return [textToken];
            },
        },
        link: {
            getAttrs: token => {
                if (token.tag !== 'a')
                    return undefined;
                const href = token.attrGet('href');
                if (!href)
                    return undefined;
                return { href };
            },
        },
    };
    const originalParse = markdown.parse;
    markdown.parse = (src, env) => {
        const rawTokens = originalParse.call(markdown, src, env);
        for (const token of rawTokens)
            if (token.type === 'inline' && token.children)
                token.children = textifyRemainingInlineHTML(parseTokens(token.children));
        return parseTokens(rawTokens);
        function parseTokens(rawTokens) {
            if (!rawTokens.length)
                return rawTokens;
            const tokens = [];
            // the `level` of the parent `_open` token
            let level = 0;
            const Token = rawTokens[0].constructor;
            for (let token of rawTokens) {
                const isVoidToken = token.type === 'html_inline' || token.type === 'html_block';
                if (!isVoidToken && token.type !== 'html_block_open' && token.type !== 'html_block_close' && token.type !== 'html_inline_open' && token.type !== 'html_inline_close') {
                    tokens.push(token);
                    continue;
                }
                if (!isVoidToken && token.nesting < 0) {
                    const opening = tokens.findLast(token => token.level === level);
                    if (!opening) {
                        console.warn('Invalid HTML in markdown:', token.raw);
                        continue;
                    }
                    token.type = `${opening.type.slice(0, -5)}_close`;
                    tokens.push(token);
                    level = token.level;
                    continue;
                }
                for (const [nodeType, spec] of Object.entries(markdownHTMLNodeRegistry)) {
                    const attrs = spec.getAttrs(token);
                    if (attrs) {
                        token.type = nodeType;
                        if (attrs !== true)
                            token.nodeAttrs = attrs;
                        const children = spec.getChildren?.(token);
                        if (children)
                            token.children = children;
                        break;
                    }
                }
                for (const [markType, spec] of Object.entries(markdownHTMLMarkRegistry)) {
                    const attrs = spec.getAttrs(token);
                    if (attrs) {
                        const markToken = token;
                        // marks in html_blocks can't be used directly, they must be wrapped in a paragraph block in an 'inline' token
                        if (token.type === 'html_block') {
                            token = new Token();
                            token.type = 'inline';
                            token.level = 1;
                            token.nesting = 0;
                            token.tag = '';
                            token.block = true;
                            token.children = [markToken];
                        }
                        markToken.type = markType;
                        if (attrs !== true)
                            markToken.nodeAttrs = attrs;
                        const children = spec.getChildren?.(markToken);
                        if (children)
                            markToken.children = children;
                        if (token.type === 'inline')
                            token.children = parseTokens(token.children);
                        break;
                    }
                }
                if (!isVoidToken) {
                    token.type = token.type.endsWith('_open') ? token.type : `${token.type}_open`;
                    level = token.level;
                }
                if (token.type === 'inline') {
                    const paragraphOpen = new Token();
                    paragraphOpen.type = 'paragraph_open';
                    paragraphOpen.nesting = 1;
                    const paragraphClose = new Token();
                    paragraphClose.type = 'paragraph_close';
                    paragraphClose.nesting = -1;
                    tokens.push(paragraphOpen, token, paragraphClose);
                    continue;
                }
                tokens.push(token);
            }
            return tokens.flatMap(child => {
                const children = child.children;
                if (!children?.length || child.type === 'inline')
                    return child;
                const endToken = new Token();
                endToken.type = `${child.type}_close`;
                child.type = `${child.type}_open`;
                child.children = null;
                return [
                    child,
                    ...children,
                    endToken,
                ];
            });
        }
        function textifyRemainingInlineHTML(rawTokens) {
            for (const token of rawTokens) {
                if (!token.type.startsWith('html_inline'))
                    continue;
                token.type = 'text';
                token.content = token.raw ?? '';
            }
            return rawTokens;
        }
    };
    const markdownParser = new prosemirror_markdown_1.MarkdownParser(schema, markdown, Objects_5.default.filterNullish({
        ...prosemirror_markdown_1.defaultMarkdownParser.tokens,
        image: undefined,
        u: {
            mark: 'underline',
        },
        s: {
            mark: 'strikethrough',
        },
        ...Object.entries(markdownHTMLNodeRegistry)
            .toObject(([tokenType, spec]) => [tokenType, {
                block: tokenType,
                getAttrs: token => token.nodeAttrs ?? Object.fromEntries(token.attrs ?? []),
            }]),
        ...Object.entries(markdownHTMLMarkRegistry)
            .toObject(([tokenType, spec]) => [tokenType, {
                mark: tokenType,
                getAttrs: token => token.nodeAttrs ?? Object.fromEntries(token.attrs ?? []),
            }]),
    }));
    const markdownSerializer = new prosemirror_markdown_1.MarkdownSerializer({
        ...prosemirror_markdown_1.defaultMarkdownSerializer.nodes,
        text_align: (state, node, parent, index) => {
            state.write(`<div style="text-align:${node.attrs.align}">\n`);
            state.renderContent(node);
            state.write('</div>');
            state.closeBlock(node);
        },
    }, {
        ...prosemirror_markdown_1.defaultMarkdownSerializer.marks,
        strikethrough: {
            open: '~~',
            close: '~~',
            expelEnclosingWhitespace: true,
        },
        underline: {
            open: '__',
            close: '__',
            expelEnclosingWhitespace: true,
        },
        mention: {
            open: (state, mark, parent, index) => {
                return `<mention vanity="${mark.attrs.vanity}">`;
            },
            close: (state, mark, parent, index) => {
                const realState = state;
                const openTag = `<mention vanity="${mark.attrs.vanity}">`;
                const indexOfOpen = realState.out.lastIndexOf(openTag);
                if (indexOfOpen === -1)
                    return '';
                realState.out = realState.out.slice(0, indexOfOpen + openTag.length);
                return '';
            },
        },
    });
    function parseStyleAttributeValue(style) {
        if (style === undefined || style === null)
            return undefined;
        const styles = new Map();
        let key = '';
        let value = '';
        let inValue = false;
        let isEscaped = false;
        let isQuoted = false;
        let quoteChar = '';
        let parenCount = 0;
        for (let i = 0; i < style.length; i++) {
            const char = style[i];
            if (char === '\\') {
                isEscaped = true;
                continue;
            }
            if (isEscaped) {
                value += char;
                isEscaped = false;
                continue;
            }
            if ((char === '"' || char === '\'') && !isQuoted) {
                isQuoted = true;
                quoteChar = char;
                continue;
            }
            if (char === quoteChar && isQuoted) {
                isQuoted = false;
                continue;
            }
            if (char === '(' && !isQuoted) {
                parenCount++;
                value += char;
                continue;
            }
            if (char === ')' && !isQuoted) {
                parenCount--;
                value += char;
                continue;
            }
            if (char === ':' && !isQuoted && parenCount === 0) {
                inValue = true;
                continue;
            }
            if (char === ';' && !isQuoted && parenCount === 0) {
                if (key && value) {
                    key = key.trim();
                    if (!REGEX_CSS_PROPERTY.test(key))
                        console.warn(`Invalid CSS property "${key}"`);
                    else
                        styles.set(key, value.trim());
                    key = '';
                    value = '';
                }
                inValue = false;
                continue;
            }
            if (inValue) {
                value += char;
            }
            else {
                key += char;
            }
        }
        if (key && value) {
            key = key.trim();
            if (!REGEX_CSS_PROPERTY.test(key))
                console.warn(`Invalid CSS property "${key}"`);
            else
                styles.set(key, value.trim());
        }
        return styles;
    }
    //#endregion
    vars(REGEX_ATTRIBUTE, REGEX_CSS_PROPERTY, markdownParser, markdownSerializer, parseStyleAttributeValue);
    ////////////////////////////////////
    const BLOCK_TYPES = [
        'paragraph',
        'code_block',
    ];
    let globalid = 0;
    const TextEditor = Component_29.default.Builder((component) => {
        const id = globalid++;
        const isMarkdown = (0, State_26.default)(false);
        const content = (0, State_26.default)('');
        const isFullscreen = (0, State_26.default)(false);
        const minimal = (0, State_26.default)(false);
        const isMinimal = State_26.default.MapManual([minimal, content], (minimal, content) => minimal && !content.trim());
        // eslint-disable-next-line prefer-const
        let editor;
        const state = (0, State_26.default)(undefined);
        ////////////////////////////////////
        //#region Announcements
        state.subscribe(component, () => {
            if (!editor.mirror?.hasFocus() || !editor.mirror.state.selection.empty)
                return;
            const pos = editor.mirror.state.selection.from + 1;
            const $pos = editor.mirror.state.doc.resolve(pos > editor.mirror.state.doc.content.size ? pos - 1 : pos);
            Announcer_1.default.interrupt('text-editor/format/inline', announce => {
                const markTypes = Object.keys(schema.marks);
                let hadActive = false;
                for (const type of markTypes) {
                    if (!isMarkActive(schema.marks[type], $pos))
                        continue;
                    hadActive = true;
                    announce(`component/text-editor/formatting/${type}`);
                }
                if (!hadActive)
                    announce('component/text-editor/formatting/none');
            });
        });
        ////////////////////////////////////
        //#region Types
        const ToolbarButtonTypeMark = Component_29.default.Extension((component, type) => {
            const mark = schema.marks[type];
            return component
                .ariaLabel.use(`component/text-editor/toolbar/button/${type}`)
                .extend(() => ({ mark }));
        });
        const ToolbarButtonTypeNode = Component_29.default.Extension((component, type) => {
            const node = schema.nodes[type.replaceAll('-', '_')];
            return component
                .ariaLabel.use(`component/text-editor/toolbar/button/${type}`)
                .extend(() => ({ node }));
        });
        const ToolbarButtonTypeOther = Component_29.default.Extension((component, type) => {
            return component
                .ariaLabel.use(`component/text-editor/toolbar/button/${type}`);
        });
        //#endregion
        vars(ToolbarButtonTypeMark, ToolbarButtonTypeNode, ToolbarButtonTypeOther);
        ////////////////////////////////////
        ////////////////////////////////////
        //#region Components
        const ToolbarButtonGroup = Component_29.default.Builder(component => component
            .ariaRole('group')
            .style('text-editor-toolbar-button-group'));
        const ToolbarButton = Component_29.default.Builder((_, handler) => {
            return (0, Button_5.default)()
                .style('text-editor-toolbar-button')
                .clearPopover()
                .receiveFocusedClickEvents()
                .event.subscribe('click', event => {
                event.preventDefault();
                handler(event.host);
            });
        });
        const ToolbarCheckbutton = Component_29.default.Builder((_, state, toggler) => {
            return (0, Checkbutton_3.default)()
                .style('text-editor-toolbar-button')
                .style.bind(state, 'text-editor-toolbar-button--enabled')
                .use(state)
                .clearPopover()
                .receiveFocusedClickEvents()
                .event.subscribe('click', event => {
                event.preventDefault();
                toggler(event.host);
            });
        });
        const ToolbarRadioButton = Component_29.default.Builder((_, name, state, toggler) => {
            return (0, RadioButton_1.default)()
                .style('text-editor-toolbar-button')
                .setName(name)
                .style.bind(state, 'text-editor-toolbar-button--enabled')
                .use(state)
                .clearPopover()
                .receiveFocusedClickEvents()
                .event.subscribe('click', event => {
                event.preventDefault();
                toggler(event.host);
            });
        });
        const ToolbarButtonPopover = Component_29.default.Builder((_, align) => {
            return (0, Button_5.default)()
                .style('text-editor-toolbar-button', 'text-editor-toolbar-button--has-popover')
                .clearPopover()
                .setPopover('hover', (popover, button) => {
                popover
                    .style('text-editor-toolbar-popover')
                    .style.bind(popover.popoverParent.nonNullish, 'text-editor-toolbar-popover-sub', `text-editor-toolbar-popover-sub--${align}`)
                    .anchor.add(align === 'centre' ? align : `aligned ${align}`, 'off bottom')
                    .style.toggle(align === 'left', 'text-editor-toolbar-popover--left')
                    .style.toggle(align === 'right', 'text-editor-toolbar-popover--right')
                    .setMousePadding(20);
                button.style.bind(popover.visible, 'text-editor-toolbar-button--has-popover-visible');
            })
                .receiveAncestorInsertEvents()
                .event.subscribe(['insert', 'ancestorInsert'], event => event.host.style.toggle(!!event.host.closest(Popover_3.default), 'text-editor-toolbar-button--has-popover--within-popover'));
        });
        //#endregion
        vars(ToolbarButtonGroup, ToolbarButton, ToolbarCheckbutton, ToolbarRadioButton, ToolbarButtonPopover);
        ////////////////////////////////////
        ////////////////////////////////////
        //#region Specifics
        const ToolbarButtonMark = Component_29.default.Builder((_, type) => {
            const mark = schema.marks[type];
            const toggler = markToggler(mark);
            const markActive = state.map(component, state => isMarkActive(mark));
            return ToolbarCheckbutton(markActive, toggler)
                .and(ToolbarButtonTypeMark, type);
        });
        const ToolbarButtonAlign = Component_29.default.Builder((_, align) => {
            const toggler = wrapper(schema.nodes.text_align, { align: align === 'centre' ? 'center' : align });
            const alignActive = state.map(component, state => isAlignActive(align));
            return ToolbarRadioButton(`text-editor-${id}-text-align`, alignActive, toggler)
                .and(ToolbarButtonTypeOther, `align-${align}`);
        });
        const ToolbarButtonBlockType = Component_29.default.Builder((_, type) => {
            const node = schema.nodes[type.replaceAll('-', '_')];
            const toggle = blockTypeToggler(node);
            const typeActive = state.map(component, state => isTypeActive(node));
            return ToolbarRadioButton(`text-editor-${id}-block-type`, typeActive, toggle)
                .and(ToolbarButtonTypeNode, type);
        });
        const ToolbarButtonHeading = Component_29.default.Builder((_, level) => {
            const node = schema.nodes.heading;
            const toggle = blockTypeToggler(node, { level });
            const typeActive = state.map(component, state => isTypeActive(node, { level }));
            return ToolbarRadioButton(`text-editor-${id}-block-type`, typeActive, toggle)
                .setIcon(`${level}`);
        });
        const ToolbarButtonWrap = Component_29.default.Builder((_, type) => ToolbarButton(wrapper(schema.nodes[type.replaceAll('-', '_')]))
            .and(ToolbarButtonTypeNode, type));
        const ToolbarButtonList = Component_29.default.Builder((_, type) => ToolbarButton(listWrapper(schema.nodes[type.replaceAll('-', '_')]))
            .and(ToolbarButtonTypeNode, type));
        //#endregion
        vars(ToolbarButtonMark, ToolbarButtonAlign, ToolbarButtonBlockType, ToolbarButtonHeading, ToolbarButtonWrap, ToolbarButtonList);
        types();
        ////////////////////////////////////
        ////////////////////////////////////
        //#region Commands
        let inTransaction = false;
        function wrapCmd(cmd) {
            return (component) => {
                if (!state.value)
                    return;
                inTransaction = true;
                cmd(state.value, editor.mirror?.dispatch, editor.mirror);
                inTransaction = false;
                if (!component.hasFocused.value)
                    editor.document?.focus();
            };
        }
        function markToggler(type) {
            return wrapCmd((0, prosemirror_commands_1.toggleMark)(type));
        }
        function wrapper(node, attrs) {
            if (node === schema.nodes.text_align)
                return wrapCmd((state, dispatch) => {
                    const { $from, $to } = state.selection;
                    let range = $from.blockRange($to);
                    if (range) {
                        const textAlignBlock = $from.closest(schema.nodes.text_align, range.depth);
                        if (textAlignBlock && !range.startIndex && range.endIndex === textAlignBlock.childCount) {
                            const pos = textAlignBlock.pos(state.doc);
                            if (pos === undefined)
                                return false;
                            if (dispatch)
                                dispatch(state.tr
                                    .setNodeMarkup(pos, undefined, attrs)
                                    .stripNodeType(textAlignBlock.content, schema.nodes.text_align)
                                    .scrollIntoView());
                            return true;
                        }
                    }
                    const wrapping = range && (0, prosemirror_transform_1.findWrapping)(range, node, attrs);
                    if (!wrapping)
                        return false;
                    if (dispatch) {
                        const tr = state.tr;
                        tr.wrap(range, wrapping);
                        range = tr.doc.resolve($from.pos + 1).blockRange(tr.doc.resolve($to.pos + 1));
                        if (!range)
                            throw new Error('Unable to strip nodes, unable to resolve new range');
                        tr.stripNodeType(range, schema.nodes.text_align);
                        tr.scrollIntoView();
                        dispatch(tr);
                    }
                    return true;
                });
            return wrapCmd((0, prosemirror_commands_1.wrapIn)(node, attrs));
        }
        function blockTypeToggler(node, attrs) {
            return wrapCmd((0, prosemirror_commands_1.setBlockType)(node, attrs));
        }
        function listWrapper(node, attrs) {
            return wrapCmd((0, prosemirror_schema_list_1.wrapInList)(node, attrs));
        }
        //#endregion
        vars(wrapCmd, markToggler, wrapper, blockTypeToggler, listWrapper);
        ////////////////////////////////////
        //#endregion
        vars(ToolbarButtonTypeMark, ToolbarButtonTypeNode, ToolbarButtonTypeOther);
        vars(ToolbarButtonGroup, ToolbarButton, ToolbarCheckbutton, ToolbarRadioButton, ToolbarButtonPopover);
        vars(ToolbarButtonMark, ToolbarButtonAlign, ToolbarButtonBlockType, ToolbarButtonHeading, ToolbarButtonWrap, ToolbarButtonList);
        types();
        ////////////////////////////////////
        const toolbar = (0, Component_29.default)()
            .style('text-editor-toolbar')
            .style.bind(isFullscreen, 'text-editor-toolbar--fullscreen')
            .style.bind(isMinimal, 'text-editor-toolbar--minimal')
            .ariaRole('toolbar')
            .append((0, Component_29.default)()
            .style('text-editor-toolbar-left')
            .append(ToolbarButtonGroup()
            .ariaLabel.use('component/text-editor/toolbar/group/inline')
            .append(ToolbarButtonMark('strong').setIcon('bold'))
            .append(ToolbarButtonMark('em').setIcon('italic'))
            .append(ToolbarButtonPopover('left')
            .and(ToolbarButtonTypeOther, 'other-formatting')
            .setIcon('other-formatting')
            .tweakPopover(popover => popover
            .append(ToolbarButtonMark('underline').setIcon('underline'))
            .append(ToolbarButtonMark('strikethrough').setIcon('strikethrough'))
            .append(ToolbarButtonMark('subscript').setIcon('subscript'))
            .append(ToolbarButtonMark('superscript').setIcon('superscript'))
            .append(ToolbarButtonMark('code').setIcon('code')))))
            .append(ToolbarButtonGroup()
            .ariaLabel.use('component/text-editor/toolbar/group/block')
            .append(ToolbarButtonPopover('centre')
            .tweakPopover(popover => popover
            .ariaRole('radiogroup')
            .append(ToolbarButtonAlign('left').setIcon('align-left'))
            .append(ToolbarButtonAlign('centre').setIcon('align-center'))
            .append(ToolbarButtonAlign('right').setIcon('align-right')))
            .tweak(button => {
            state.use(button, () => {
                const align = !editor?.mirror?.hasFocus() && !inTransaction ? 'left' : getAlign() ?? 'mixed';
                button.ariaLabel.set(en_nz_3.default['component/text-editor/toolbar/button/align'](en_nz_3.default[`component/text-editor/toolbar/button/align/currently/${align}`]()).toString());
                button.setIcon(align === 'mixed' ? 'asterisk' : `align-${align === 'centre' ? 'center' : align}`);
            });
        })))
            .append(ToolbarButtonGroup()
            .ariaRole()
            .append(ToolbarButtonPopover('centre')
            .tweakPopover(popover => popover
            .ariaRole('radiogroup')
            .append(ToolbarButtonBlockType('paragraph').setIcon('paragraph'))
            .append(ToolbarButtonPopover('centre')
            .setIcon('heading')
            .tweakPopover(popover => popover
            .append(ToolbarButtonHeading(1))
            .append(ToolbarButtonHeading(2))
            .append(ToolbarButtonHeading(3))
            .append(ToolbarButtonHeading(4))
            .append(ToolbarButtonHeading(5))
            .append(ToolbarButtonHeading(6))))
            .append(ToolbarButtonBlockType('code-block').setIcon('code')))
            .tweak(button => {
            state.use(button, () => {
                const blockType = !editor?.mirror?.hasFocus() && !inTransaction ? 'paragraph' : getBlockType() ?? 'mixed';
                button.ariaLabel.set(en_nz_3.default['component/text-editor/toolbar/button/block-type'](en_nz_3.default[`component/text-editor/toolbar/button/block-type/currently/${blockType}`]()).toString());
                button.setIcon(false
                    || (blockType === 'paragraph' && 'paragraph')
                    || (blockType === 'code-block' && 'code')
                    || 'asterisk');
            });
        })))
            .append(ToolbarButtonGroup()
            .ariaLabel.use('component/text-editor/toolbar/group/wrapper')
            .append(ToolbarButton(wrapCmd(prosemirror_commands_1.lift)).and(ToolbarButtonTypeOther, 'lift')
            .setIcon('outdent')
            .style.bind(state.map(component, value => !value || !(0, prosemirror_commands_1.lift)(value)), 'text-editor-toolbar-button--hidden'))
            .append(ToolbarButtonWrap('blockquote').setIcon('quote-left'))
            .append(ToolbarButtonList('bullet-list').setIcon('list-ul'))
            .append(ToolbarButtonList('ordered-list').setIcon('list-ol')))
            .append(ToolbarButtonGroup()
            .ariaLabel.use('component/text-editor/toolbar/group/insert')
            .append(ToolbarButton(wrapCmd((state, dispatch) => {
            dispatch?.(state.tr.replaceSelectionWith(schema.nodes.horizontal_rule.create()));
            return true;
        }))
            .and(ToolbarButtonTypeOther, 'hr')
            .style('text-editor-toolbar-hr'))))
            .append((0, Component_29.default)()
            .style('text-editor-toolbar-right')
            .append(ToolbarButtonGroup()
            .ariaLabel.use('component/text-editor/toolbar/group/actions')
            .append(ToolbarButton(wrapCmd(prosemirror_history_1.undo)).and(ToolbarButtonTypeOther, 'undo').setIcon('undo'))
            .append(ToolbarButton(wrapCmd(prosemirror_history_1.redo)).and(ToolbarButtonTypeOther, 'redo').setIcon('redo'))
            .append(ToolbarButton(toggleFullscreen)
            .bindIcon(isFullscreen.map(component, (fullscreen) => fullscreen ? 'compress' : 'expand'))
            .ariaLabel.bind(isFullscreen.map(component, fullscreen => en_nz_3.default[`component/text-editor/toolbar/button/${fullscreen ? 'unfullscreen' : 'fullscreen'}`]().toString())))));
        //#endregion
        vars(toolbar);
        ////////////////////////////////////
        ////////////////////////////////////
        //#region Main UI
        let label;
        let unsubscribeLabelFor;
        let unuseLabelRemoved;
        const stopUsingLabel = () => {
            label = undefined;
            unuseLabelRemoved?.();
            unuseLabelRemoved = undefined;
            unsubscribeLabelFor?.();
            unsubscribeLabelFor = undefined;
        };
        const hiddenInput = (0, Component_29.default)('input')
            .style('text-editor-validity-pipe-input')
            .tabIndex('programmatic')
            .attributes.set('type', 'text')
            .setName(`text-editor-validity-pipe-input-${Math.random().toString(36).slice(2)}`);
        const viewTransitionName = 'text-editor';
        const actualEditor = (0, Component_29.default)()
            .subviewTransition(viewTransitionName)
            .style('text-editor')
            .style.bind(isFullscreen, 'text-editor--fullscreen')
            .event.subscribe('click', event => {
            const target = Component_29.default.get(event.target);
            if (target !== toolbar && !target?.is(TextEditor))
                return;
            editor.document?.focus();
        })
            .append(hiddenInput)
            .append(toolbar);
        editor = component
            .and(Slot_5.default)
            .and(Input_2.default)
            .and(InputBus_2.HandlesKeyboardEvents)
            .style.bind(isMinimal, 'text-editor--minimal')
            .append(actualEditor)
            .pipeValidity(hiddenInput)
            .extend(editor => ({
            content,
            default: (0, StringApplicator_4.default)(editor, value => loadFromMarkdown(value)),
            toolbar,
            setRequired(required = true) {
                editor.style.toggle(required, 'text-editor--required');
                editor.required.asMutable?.setValue(required);
                refresh();
                return editor;
            },
            setLabel(newLabel) {
                stopUsingLabel();
                label = newLabel;
                refresh();
                unuseLabelRemoved = label?.removed.use(editor, removed => removed && stopUsingLabel());
                // the moment a name is assigned to the editor, attempt to replace the doc with a local draft (if it exists)
                unsubscribeLabelFor = label?.for.use(editor, loadLocal);
                return editor;
            },
            useMarkdown: () => {
                clearLocal();
                return !state.value ? '' : markdownSerializer.serialize(state.value?.doc);
            },
            setMinimalByDefault(value = true) {
                minimal.value = value;
                return editor;
            },
        }));
        const documentSlot = (0, Slot_5.default)();
        documentSlot
            .style.bind(isFullscreen, 'text-editor-document-slot--fullscreen')
            .use(isMarkdown, (slot, isMarkdown) => {
            if (isMarkdown) {
                state.value = undefined;
                return;
            }
            return createDefaultView((0, Slot_5.default)().appendTo(slot));
        })
            .appendTo(actualEditor);
        const contentWidth = State_26.default.Generator(() => `${editor.document?.element.scrollWidth ?? 0}px`)
            .observe(component, state, Viewport_5.default.size);
        const scrollbarProxy = (0, Component_29.default)()
            .style('text-editor-document-scrollbar-proxy')
            .style.bind(isFullscreen, 'text-editor-document-scrollbar-proxy--fullscreen')
            .style.bind(contentWidth.map(component, () => (editor.document?.element.scrollWidth ?? 0) > (editor.document?.rect.value.width ?? 0)), 'text-editor-document-scrollbar-proxy--visible')
            .style.bindVariable('content-width', contentWidth)
            .event.subscribe('scroll', () => editor.document?.element.scrollTo({ left: scrollbarProxy.element.scrollLeft, behavior: 'instant' }))
            .appendTo(actualEditor);
        const fullscreenContentWidth = State_26.default.Generator(() => `${documentSlot.element.scrollWidth ?? 0}px`)
            .observe(component, state, Viewport_5.default.size);
        documentSlot.style.bindVariable('content-width', fullscreenContentWidth);
        state.use(editor, state => {
            saveLocal(undefined, state?.doc);
            toolbar.rect.markDirty();
        });
        const fullscreenDialog = (0, Dialog_2.default)()
            .and(Slot_5.default)
            .style.remove('slot')
            .setFullscreen()
            .setOwner(editor)
            .bind(isFullscreen)
            .appendTo(document.body);
        editor.length.use(editor, (length = 0) => {
            let invalid;
            if (length > (editor.maxLength.value ?? Infinity))
                invalid = en_nz_3.default['shared/form/invalid/too-long']();
            editor.setCustomInvalidMessage(invalid);
            editor.document?.setCustomInvalidMessage(invalid);
            hiddenInput.event.bubble('change');
        });
        //#endregion
        vars(editor, actualEditor, documentSlot, scrollbarProxy, fullscreenDialog);
        ////////////////////////////////////
        return editor;
        function markInputRule(spec) {
            return new prosemirror_inputrules_1.InputRule(spec.regex, (state, match, start, end) => {
                const attrs = spec.getAttrs instanceof Function ? spec.getAttrs(match) : spec.getAttrs;
                const content = spec.getContent instanceof Function ? spec.getContent(match) : spec.getContent ?? '';
                const tr = state.tr;
                tr.replaceWith(start, end, typeof content === 'string' ? schema.text(content) : content);
                const mark = spec.type.create(attrs);
                tr.addMark(tr.mapping.map(start), tr.mapping.map(end), mark);
                tr.removeStoredMark(mark);
                spec.regex.lastIndex = 0;
                return tr;
            });
        }
        function createDefaultView(slot) {
            const view = new prosemirror_view_1.EditorView(slot.element, {
                transformPastedHTML(html, view) {
                    return html
                        .replaceAll(/(?<=<\/\s*p\s*>\s*)<\s*br\s*\/?\s*>(?=\s*<\s*p\b)/g, '<p></p>')
                        .replaceAll(/<\s*br\s*class="Apple-interchange-newline"\s*\/?\s*>/g, '');
                },
                state: prosemirror_state_1.EditorState.create({
                    doc: markdownParser.parse(content.value),
                    plugins: [
                        (0, prosemirror_example_setup_1.buildInputRules)(schema),
                        (0, prosemirror_inputrules_1.inputRules)({
                            rules: [
                                markInputRule({
                                    regex: /\*\*((?:(?!\*\*).)+)\*\*$/g,
                                    type: schema.marks.strong,
                                    getContent: match => match[1],
                                }),
                                markInputRule({
                                    regex: /__((?:(?!__).)+)__$/g,
                                    type: schema.marks.underline,
                                    getContent: match => match[1],
                                }),
                                markInputRule({
                                    regex: /\/\/((?:(?!\/\/).)+)\/\/$/g,
                                    type: schema.marks.em,
                                    getContent: match => match[1],
                                }),
                                markInputRule({
                                    regex: /~~((?:(?!~~).)+)~~$/g,
                                    type: schema.marks.strikethrough,
                                    getContent: match => match[1],
                                }),
                                markInputRule({
                                    regex: /`([^`]+?)`$/g,
                                    type: schema.marks.code,
                                    getContent: match => match[1],
                                }),
                                markInputRule({
                                    regex: /\[(.+?)\]\(([^ ]+?)(?:[  ](?:\((.+?)\)|["'“”‘’](.+?)["'“”‘’]))?\)$/g,
                                    type: schema.marks.link,
                                    getAttrs: ([match, text, href, title1, title2]) => ({ href, title: title1 || title2 || undefined }),
                                    getContent: match => match[1],
                                }),
                                markInputRule({
                                    regex: /@([a-zA-Z0-9-]+)$/g,
                                    type: schema.marks.mention,
                                    getAttrs: match => ({ vanity: match[1] }),
                                    getContent: match => `@${match[1]}`,
                                }),
                            ],
                        }),
                        (0, prosemirror_keymap_1.keymap)((0, prosemirror_example_setup_1.buildKeymap)(schema, {})),
                        (0, prosemirror_keymap_1.keymap)(prosemirror_commands_1.baseKeymap),
                        (0, prosemirror_keymap_1.keymap)({
                            'Mod-s': (0, prosemirror_commands_1.toggleMark)(schema.marks.strikethrough),
                            'Mod-S': (0, prosemirror_commands_1.toggleMark)(schema.marks.strikethrough),
                            'Mod-.': (0, prosemirror_commands_1.toggleMark)(schema.marks.superscript),
                            'Mod-,': (0, prosemirror_commands_1.toggleMark)(schema.marks.subscript),
                            'Alt-Ctrl-0': (0, prosemirror_commands_1.setBlockType)(schema.nodes.paragraph),
                            ...Arrays_4.default.range(1, 7)
                                .toObject(i => [`Alt-Ctrl-${i}`, (0, prosemirror_commands_1.setBlockType)(schema.nodes.heading, { level: i })]),
                        }),
                        (0, prosemirror_dropcursor_1.dropCursor)(),
                        (0, prosemirror_gapcursor_1.gapCursor)(),
                        (0, prosemirror_history_1.history)(),
                        new prosemirror_state_1.Plugin({
                            appendTransaction(transactions, oldState, newState) {
                                const mentionPositions = [];
                                let needsUpdate = false;
                                newState.doc.descendants((node, pos) => {
                                    const mark = node.marks.find(mark => mark.type === schema.marks.mention);
                                    if (!mark)
                                        return;
                                    let endPos = pos + node.nodeSize;
                                    let nextChild;
                                    while ((nextChild = newState.doc.nodeAt(endPos))) {
                                        if (!nextChild.marks.find(mark => mark.type === schema.marks.mention && mark.attrs.vanity === mark.attrs.vanity))
                                            break;
                                        endPos += nextChild.nodeSize;
                                    }
                                    let vanity = newState.doc.textBetween(pos, endPos);
                                    if (!vanity.startsWith('@'))
                                        return false;
                                    vanity = vanity.slice(1);
                                    let textAfter;
                                    [, vanity, textAfter] = vanity.match(/^([a-zA-Z0-9-]+)(.*)$/) ?? [];
                                    if (!vanity)
                                        return false;
                                    endPos -= textAfter.length;
                                    if (mark.attrs.vanity !== vanity) {
                                        mentionPositions.push({ start: pos, end: endPos, vanity, textAfter });
                                        needsUpdate = true;
                                    }
                                    return false;
                                });
                                if (!needsUpdate)
                                    return null;
                                const tr = newState.tr;
                                for (const { start, end, vanity, textAfter } of mentionPositions.reverse()) {
                                    const mark = schema.marks.mention.create({ vanity });
                                    tr.removeMark(start, end + textAfter.length, schema.marks.mention);
                                    tr.insertText(textAfter, end);
                                    tr.replaceWith(start, end + textAfter.length, schema.text(`@${vanity}`));
                                    tr.addMark(tr.mapping.map(start), tr.mapping.map(end), mark);
                                }
                                return tr;
                            },
                            view() {
                                return {
                                    update(view, prevState) {
                                        state.value = view.state;
                                        if (state.value === prevState)
                                            state.emit();
                                    },
                                };
                            },
                        }),
                    ],
                }),
            });
            editor.mirror = view;
            editor.document = (0, Component_29.default)()
                .and(Input_2.default)
                .replaceElement(editor.mirror.dom)
                .ariaRole('textbox')
                .classes.add('markdown')
                .style('text-editor-document')
                .style.bind(isFullscreen, 'text-editor-document--fullscreen')
                .setId(`text-editor-${id}`)
                .attributes.set('aria-multiline', 'true')
                .event.subscribe('scroll', () => scrollbarProxy.element.scrollTo({ left: editor.document?.element.scrollLeft ?? 0, behavior: 'instant' }));
            toolbar.ariaControls(editor.document);
            refresh();
            return () => {
                content.value = markdownSerializer.serialize(view.state.doc);
                editor.mirror = undefined;
                editor.document = undefined;
                refresh();
                view.destroy();
            };
        }
        //#endregion
        ////////////////////////////////////
        ////////////////////////////////////
        //#region Events/Actions
        function refresh() {
            label?.setInput(editor.document);
            editor.document?.setName(label?.for);
            editor.document?.setId(label?.for);
            label?.setId(label.for.map(component, v => `${v}-label`));
            toolbar.ariaLabelledBy(label);
            editor.document?.ariaLabelledBy(label);
            editor.document?.attributes.toggle(editor.required.value, 'aria-required', 'true');
        }
        function toggleFullscreen() {
            ViewTransition_1.default.perform('subview', viewTransitionName, () => {
                isFullscreen.value = !isFullscreen.value;
                actualEditor.appendTo(isFullscreen.value ? fullscreenDialog : editor);
                actualEditor.rect.markDirty();
            });
        }
        function clearLocal(name = editor.document?.name.value) {
            if (!name)
                return;
            Store_1.default.items.textEditorDrafts = Store_1.default.items.textEditorDrafts?.filter(draft => draft.name !== name);
        }
        function loadFromMarkdown(markdown = '') {
            // hack to fix it not redrawing when calling updateState now?
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            (editor.mirror?.docView).dirty = 2; // CONTENT_DIRTY
            editor.mirror?.updateState(prosemirror_state_1.EditorState.create({
                plugins: editor.mirror.state.plugins.slice(),
                doc: markdownParser.parse(markdown),
            }));
        }
        function loadLocal(name = editor.document?.name.value) {
            if (!name)
                return;
            const draft = Store_1.default.items.textEditorDrafts?.find(draft => draft.name === name);
            if (!draft)
                return;
            loadFromMarkdown(draft.body);
        }
        function saveLocal(name = editor.document?.name.value, doc) {
            const body = !doc ? '' : markdownSerializer.serialize(doc);
            content.value = body;
            editor.length.asMutable?.setValue(body.length);
            if (!name)
                return;
            if (body === editor.default.state.value)
                return clearLocal();
            Store_1.default.items.textEditorDrafts = [
                ...!body ? [] : [{ name, body, created: Date.now() }],
                ...(Store_1.default.items.textEditorDrafts ?? [])
                    .filter(draft => true
                    && draft.name !== name // keep old drafts that don't share names with the new draft
                    && Date.now() - draft.created < Time_4.default.days(1) // keep old drafts only if they were made in the last day
                    && true),
            ]
                // disallow more than 4 drafts due to localstorage limitations with using localStorage
                // this won't be necessary when drafts are stored in indexeddb
                .slice(0, 4);
        }
        //#endregion
        ////////////////////////////////////
        ////////////////////////////////////
        //#region State
        function isMarkActive(type, pos) {
            if (!state.value)
                return false;
            const selection = state.value.selection;
            pos ??= !selection.empty ? undefined : selection.$from;
            if (pos)
                return !!type.isInSet(state.value.storedMarks || pos.marks());
            return state.value.doc.rangeHasMark(selection.from, selection.to, type);
        }
        function isTypeActive(type, attrs, pos) {
            if (!state.value)
                return false;
            const selection = state.value.selection;
            pos ??= !selection.empty ? undefined : selection.$from;
            if (pos)
                return !!pos.closest(type, attrs);
            let found = false;
            state.value.doc.nodesBetween(selection.from, selection.to, node => {
                found ||= node.matches(type, attrs);
            });
            return found;
        }
        function getBlockType(pos) {
            if (!state.value)
                return undefined;
            const selection = state.value.selection;
            pos ??= !selection.empty ? undefined : selection.$from;
            if (pos) {
                for (const blockType of BLOCK_TYPES)
                    if (isTypeActive(schema.nodes[blockType], pos))
                        return blockType.replaceAll('_', '-');
                return 'paragraph';
            }
            const types = new Set();
            state.value.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
                if (node.type !== schema.nodes.text)
                    return;
                const $pos = state.value?.doc.resolve(pos);
                if (!$pos)
                    return;
                for (const blockType of BLOCK_TYPES)
                    if (isTypeActive(schema.nodes[blockType], $pos)) {
                        types.add(blockType.replaceAll('_', '-'));
                        return;
                    }
            });
            if (!types.size)
                return getBlockType(selection.$from);
            if (types.size > 1)
                return undefined;
            const [type] = types;
            return type;
        }
        function isAlignActive(align, pos) {
            if (!state.value)
                return false;
            align = align === 'centre' ? 'center' : align;
            const selection = state.value.selection;
            pos ??= !selection.empty ? undefined : selection.$from;
            if (pos)
                return (pos.closest(schema.nodes.text_align)?.attrs.align ?? 'left') === align;
            let found = false;
            state.value.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
                const resolved = state.value?.doc.resolve(pos);
                found ||= !resolved ? align === 'left' : isAlignActive(align, resolved);
            });
            return found;
        }
        function getAlign(pos) {
            if (!state.value)
                return undefined;
            const selection = state.value.selection;
            pos ??= !selection.empty ? undefined : selection.$from;
            if (pos) {
                const align = (pos.closest(schema.nodes.text_align)?.attrs.align ?? 'left');
                return align === 'center' ? 'centre' : align;
            }
            const aligns = new Set();
            state.value.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
                if (node.type === schema.nodes.text) {
                    const $pos = state.value?.doc.resolve(pos);
                    if ($pos)
                        aligns.add(getAlign($pos));
                }
            });
            if (!aligns.size)
                return getAlign(selection.$from);
            if (aligns.size > 1)
                return undefined;
            const [align] = aligns;
            return align;
        }
        //#endregion
        ////////////////////////////////////
    });
    exports.default = TextEditor;
});
define("ui/component/core/toast/ToastList", ["require", "exports", "model/Session", "ui/Component", "ui/component/core/toast/Toast", "utility/Async", "utility/Task", "utility/Time"], function (require, exports, Session_5, Component_30, Toast_1, Async_2, Task_4, Time_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Session_5 = __importDefault(Session_5);
    Component_30 = __importDefault(Component_30);
    Async_2 = __importDefault(Async_2);
    Task_4 = __importDefault(Task_4);
    Time_5 = __importDefault(Time_5);
    const ToastComponent = Component_30.default.Builder((component) => {
        const title = (0, Component_30.default)()
            .style('toast-title')
            .appendTo(component);
        return component
            .style('toast')
            .extend(toast => ({
            title,
            content: undefined,
            type: Object.assign((...types) => {
                for (const type of types)
                    toast.style(`toast-type-${type}`);
                return toast;
            }, {
                remove(...types) {
                    for (const type of types)
                        toast.style.remove(`toast-type-${type}`);
                    return toast;
                },
            }),
        }))
            .extendJIT('content', toast => (0, Component_30.default)()
            .style('toast-content')
            .appendTo(toast));
    }).setName('Toast');
    const ToastList = Component_30.default.Builder((component) => {
        const toasts = component
            .style('toast-list')
            .extend(toasts => ({
            info: add.bind(null, 'info'),
            success: add.bind(null, 'success'),
            warning: add.bind(null, 'warning'),
            handleError(response, translation = 'shared/toast/error-occurred') {
                if (response instanceof Error) {
                    const errorResponse = response;
                    if (errorResponse.code === 401 && (errorResponse.detail === 'Invalid session token' || errorResponse.detail === 'This endpoint requires a session')) {
                        void Session_5.default.refresh();
                        return true;
                    }
                    toasts.warning(Toast_1.TOAST_ERROR, translation, response);
                    return true;
                }
                return false;
            },
        }));
        Object.assign(window, { toast: toasts });
        return toasts;
        function add(type, toast, ...params) {
            const component = ToastComponent()
                .type(type)
                .style('toast--measuring')
                .tweak(toast.initialise, ...params);
            void lifecycle(toast, component);
            return component;
        }
        async function lifecycle(toast, component) {
            const wrapper = (0, Component_30.default)().style('toast-wrapper').appendTo(toasts);
            component.style('toast--measuring').appendTo(wrapper);
            await Task_4.default.yield();
            const rect = component.rect.value;
            component.style.remove('toast--measuring');
            wrapper.style.setProperty('height', `${rect.height}px`);
            await Async_2.default.sleep(toast.duration);
            component.style('toast--hide');
            wrapper.style.removeProperties('height');
            await Promise.race([
                new Promise(resolve => component.event.subscribe('animationend', resolve)),
                Async_2.default.sleep(Time_5.default.seconds(1)),
            ]);
            wrapper.remove();
        }
    });
    //#endregion
    ////////////////////////////////////
    exports.default = ToastList;
});
define("ui/component/core/toast/Toast", ["require", "exports", "ui/Component"], function (require, exports, Component_31) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TOAST_ERROR = exports.TOAST_SUCCESS = void 0;
    Component_31 = __importDefault(Component_31);
    function Toast(toast) {
        return toast;
    }
    exports.default = Toast;
    exports.TOAST_SUCCESS = Toast({
        duration: 2000,
        initialise(toast, translation) {
            toast.title.text.use(translation);
        },
    });
    function isErrorResponse(error) {
        return error.headers !== undefined;
    }
    exports.TOAST_ERROR = Toast({
        duration: 5000,
        initialise(toast, translation, error) {
            console.error(error);
            toast.title.text.use(translation);
            if (!isErrorResponse(error) || !error.detail)
                toast.content.text.set(error.message);
            else
                toast.content
                    .append((0, Component_31.default)()
                    .style('toast-error-type')
                    .text.set(error.message))
                    .text.append(': ')
                    .text.append(error.detail);
        },
    });
});
define("ui/component/VanityInput", ["require", "exports", "ui/Component", "ui/component/core/ext/Input", "ui/component/core/TextInput"], function (require, exports, Component_32, Input_3, TextInput_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FilterVanity = void 0;
    Component_32 = __importDefault(Component_32);
    Input_3 = __importDefault(Input_3);
    TextInput_2 = __importStar(TextInput_2);
    const VanityInput = Component_32.default.Builder((component) => {
        const input = (0, TextInput_2.default)()
            .style('vanity-input-input')
            .filter(exports.FilterVanity)
            .appendTo(component);
        return component.and(Input_3.default)
            .style('vanity-input')
            .append((0, Component_32.default)()
            .style('vanity-input-prefix')
            .text.set('@'))
            .extend(component => ({
            // vanity input
            input,
            // input
            required: input.required,
            hint: input.hint.rehost(component),
            maxLength: input.maxLength,
            length: input.length,
            invalid: input.invalid,
            hasPopover: input.hasPopover,
            getPopover() {
                return input.getPopover();
            },
            disableDefaultHintPopoverVisibilityHandling() {
                input.disableDefaultHintPopoverVisibilityHandling();
                return component;
            },
            setMaxLength(maxLength) {
                input.setMaxLength(maxLength);
                return component;
            },
            setRequired(required) {
                input.setRequired(required);
                return component;
            },
            setLabel(label) {
                input.setLabel(label);
                return component;
            },
            tweakPopover(initialiser) {
                input.tweakPopover(initialiser);
                return component;
            },
            setCustomHintPopover(initialiser) {
                input.setCustomHintPopover(initialiser);
                return component;
            },
            pipeValidity(to) {
                input.pipeValidity(to);
                return component;
            },
            setCustomInvalidMessage(message) {
                input.setCustomInvalidMessage(message);
                return component;
            },
            refreshValidity() {
                input.refreshValidity();
                return component;
            },
            // text input
            state: input.state,
            value: undefined,
            default: input.default.rehost(component),
            placeholder: input.placeholder.rehost(component),
            ignoreInputEvent(ignore = true) {
                input.ignoreInputEvent(ignore);
                return component;
            },
            filter(filter) {
                input.filter(filter);
                return component;
            },
        }))
            .extendMagic('value', component => ({
            get() { return input.value; },
            set(value) { input.value = value; },
        }));
    });
    exports.default = VanityInput;
    exports.FilterVanity = (0, TextInput_2.FilterFunction)((before, selection, after) => {
        before = filterVanitySegment(before);
        selection = filterVanitySegment(selection);
        after = filterVanitySegment(after);
        if (!before && !after)
            selection = selection.replace(/^-|-$/g, '');
        else {
            if (before.startsWith('-'))
                before = before.slice(1);
            if (before.endsWith('-') && selection.startsWith('-'))
                selection = selection.slice(1);
            if (after.endsWith('-'))
                after = after.slice(0, -1);
            if (selection.endsWith('-') && after.startsWith('-'))
                after = after.slice(1);
        }
        return [before, selection, after];
    });
    function filterVanitySegment(segment) {
        return segment.replace(/[\W_-]+/g, '-');
    }
});
define("ui/view/account/AccountViewForm", ["require", "exports", "endpoint/author/EndpointAuthorCreate", "endpoint/author/EndpointAuthorUpdate", "lang/en-nz", "model/FormInputLengths", "model/Session", "ui/Component", "ui/component/core/Block", "ui/component/core/Form", "ui/component/core/LabelledTable", "ui/component/core/LabelledTextInputBlock", "ui/component/core/TextEditor", "ui/component/core/TextInput", "ui/component/core/toast/Toast", "ui/component/VanityInput"], function (require, exports, EndpointAuthorCreate_1, EndpointAuthorUpdate_1, en_nz_4, FormInputLengths_1, Session_6, Component_33, Block_5, Form_1, LabelledTable_1, LabelledTextInputBlock_1, TextEditor_1, TextInput_3, Toast_2, VanityInput_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    EndpointAuthorCreate_1 = __importDefault(EndpointAuthorCreate_1);
    EndpointAuthorUpdate_1 = __importDefault(EndpointAuthorUpdate_1);
    en_nz_4 = __importDefault(en_nz_4);
    FormInputLengths_1 = __importDefault(FormInputLengths_1);
    Session_6 = __importDefault(Session_6);
    Component_33 = __importDefault(Component_33);
    Block_5 = __importDefault(Block_5);
    Form_1 = __importDefault(Form_1);
    LabelledTable_1 = __importDefault(LabelledTable_1);
    LabelledTextInputBlock_1 = __importDefault(LabelledTextInputBlock_1);
    TextEditor_1 = __importDefault(TextEditor_1);
    TextInput_3 = __importDefault(TextInput_3);
    VanityInput_1 = __importStar(VanityInput_1);
    exports.default = Component_33.default.Builder((component, type) => {
        const block = component.and(Block_5.default);
        const form = block.and(Form_1.default, block.title);
        form.viewTransition('account-form');
        form.title.text.use(`view/account/${type}/title`);
        form.setName(en_nz_4.default[`view/account/${type}/title`]().toString());
        if (type === 'create')
            form.description.text.use('view/account/create/description');
        form.submit.textWrapper.text.use(`view/account/${type}/submit`);
        const table = (0, LabelledTable_1.default)().appendTo(form.content);
        const nameInput = (0, TextInput_3.default)()
            .setRequired()
            .default.bind(Session_6.default.Auth.author.map(component, author => author?.name))
            .hint.use('view/account/name/hint')
            .setMaxLength(FormInputLengths_1.default.value?.author.name);
        table.label(label => label.text.use('view/account/name/label'))
            .content((content, label) => content.append(nameInput.setLabel(label)));
        const vanityInput = (0, VanityInput_1.default)()
            .placeholder.bind(nameInput.state
            .map(component, name => (0, VanityInput_1.FilterVanity)(name)))
            .default.bind(Session_6.default.Auth.author.map(component, author => author?.vanity))
            .hint.use('view/account/vanity/hint')
            .setMaxLength(FormInputLengths_1.default.value?.author.vanity);
        table.label(label => label.text.use('view/account/vanity/label'))
            .content((content, label) => content.append(vanityInput.setLabel(label)));
        const pronounsInput = (0, TextInput_3.default)()
            .default.bind(Session_6.default.Auth.author.map(component, author => author?.pronouns))
            .hint.use('view/account/pronouns/hint')
            .setMaxLength(FormInputLengths_1.default.value?.author.pronouns);
        table.label(label => label.text.use('view/account/pronouns/label'))
            .content((content, label) => content.append(pronounsInput.setLabel(label)));
        const descriptionInput = (0, TextEditor_1.default)()
            .default.bind(Session_6.default.Auth.author.map(component, author => author?.description.body))
            .hint.use('view/account/description/hint')
            .setMaxLength(FormInputLengths_1.default.value?.author.description);
        table.label(label => label.text.use('view/account/description/label'))
            .content((content, label) => content.append(descriptionInput.setLabel(label)));
        let supportLinkInput;
        let supportMessageInput;
        (0, LabelledTextInputBlock_1.default)()
            .style('labelled-row--in-labelled-table')
            .ariaLabel.use('view/account/support-link/label')
            .label(label => label.text.use('view/account/support-link/label'))
            .input(input => supportLinkInput = input
            .default.bind(Session_6.default.Auth.author.map(component, author => author?.support_link))
            .hint.use('view/account/support-link/hint')
            .setMaxLength(FormInputLengths_1.default.value?.author.support_link))
            .label(label => label.text.use('view/account/support-message/label'))
            .input(input => supportMessageInput = input
            .default.bind(Session_6.default.Auth.author.map(component, author => author?.support_message))
            .hint.use('view/account/support-message/hint')
            .setMaxLength(FormInputLengths_1.default.value?.author.support_message))
            .appendTo(table);
        form.event.subscribe('submit', async (event) => {
            event.preventDefault();
            const response = await (type === 'create' ? EndpointAuthorCreate_1.default : EndpointAuthorUpdate_1.default).query({
                body: {
                    name: nameInput.value,
                    vanity: vanityInput.value,
                    description: descriptionInput.useMarkdown(),
                    pronouns: pronounsInput.value,
                    support_link: supportLinkInput.value,
                    support_message: supportMessageInput.value,
                },
            });
            if (toast.handleError(response, 'view/account/toast/failed-to-save'))
                return;
            toast.success(Toast_2.TOAST_SUCCESS, 'view/account/toast/saved');
            Session_6.default.setAuthor(response.data);
        });
        return form;
    });
});
define("ui/component/core/Breadcrumbs", ["require", "exports", "ui/Component", "ui/component/core/Button", "ui/component/core/Heading", "ui/component/core/Link"], function (require, exports, Component_34, Button_6, Heading_2, Link_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Component_34 = __importDefault(Component_34);
    Button_6 = __importDefault(Button_6);
    Heading_2 = __importDefault(Heading_2);
    Link_2 = __importDefault(Link_2);
    const Breadcrumbs = Component_34.default.Builder((component) => {
        const pathComponent = (0, Component_34.default)()
            .style('breadcrumbs-path', 'breadcrumbs-path--hidden')
            .viewTransition('breadcrumbs-path');
        const breadcrumbs = component.style('breadcrumbs')
            .append(pathComponent)
            .extend(breadcrumbs => ({
            meta: undefined,
            info: undefined,
            title: undefined,
            description: undefined,
            actions: undefined,
            path: pathComponent,
            setPath(...path) {
                pathComponent.removeContents()
                    .style.toggle(!path.length, 'breadcrumbs-path--hidden')
                    .append(...path.flatMap(([route, translation], i) => [
                    i && (0, Component_34.default)()
                        .style('breadcrumbs-path-separator'),
                    (0, Link_2.default)(route)
                        .and(Button_6.default)
                        .type('flush')
                        .text.use(translation),
                ]));
                return breadcrumbs;
            },
            setBackButton(route, initialiser) {
                breadcrumbs.backButton?.remove();
                if (!route)
                    return breadcrumbs;
                breadcrumbs.backButton = (0, Link_2.default)(route)
                    .and(Button_6.default)
                    .type('flush')
                    .style('breadcrumbs-back-button')
                    .setIcon('arrow-left')
                    .text.use('shared/action/return')
                    .tweak(initialiser)
                    .appendTo(breadcrumbs.meta);
                return breadcrumbs;
            },
        }))
            .extendJIT('meta', breadcrumbs => (0, Component_34.default)()
            .viewTransition('breadcrumbs-meta')
            .prependTo(breadcrumbs))
            .extendJIT('info', breadcrumbs => (0, Component_34.default)()
            .prependTo(breadcrumbs.meta))
            .extendJIT('title', breadcrumbs => (0, Heading_2.default)()
            .style('breadcrumbs-title')
            .setAestheticStyle(false)
            .prependTo(breadcrumbs.info))
            .extendJIT('description', breadcrumbs => (0, Component_34.default)()
            .style('breadcrumbs-description')
            .appendTo(breadcrumbs.info))
            .extendJIT('actions', breadcrumbs => (0, Component_34.default)()
            .style('breadcrumbs-actions')
            .appendTo(breadcrumbs.meta));
        return breadcrumbs;
    });
    exports.default = Breadcrumbs;
});
define("ui/view/shared/component/View", ["require", "exports", "ui/Component", "ui/component/core/Breadcrumbs"], function (require, exports, Component_35, Breadcrumbs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Component_35 = __importDefault(Component_35);
    Breadcrumbs_1 = __importDefault(Breadcrumbs_1);
    const View = Component_35.default.Builder((_, id) => {
        const content = (0, Component_35.default)().style('view-content');
        return (0, Component_35.default)()
            .style('view', `view-type-${id}`)
            .attributes.set('data-view', id)
            .append(content)
            .extend(view => ({
            viewId: id,
            hash: '',
            breadcrumbs: undefined,
            content,
        }))
            .extendJIT('hash', view => `${view.viewId}${view.params ? `_${JSON.stringify(view.params)}` : ''}`
            .replaceAll(/\W+/g, '-'))
            .extendJIT('breadcrumbs', view => (0, Breadcrumbs_1.default)()
            .style('view-breadcrumbs')
            .tweak(breadcrumbs => {
            breadcrumbs.path.style('view-breadcrumbs-path');
            const originalAddBackButton = breadcrumbs.setBackButton;
            breadcrumbs.backButton?.style('view-breadcrumbs-back-button');
            breadcrumbs.setBackButton = (...args) => {
                originalAddBackButton(...args);
                breadcrumbs.backButton?.style('view-breadcrumbs-back-button');
                return breadcrumbs;
            };
            breadcrumbs.tweakJIT('meta', meta => meta.style('view-breadcrumbs-meta'));
            breadcrumbs.tweakJIT('info', info => info.style('view-breadcrumbs-info'));
            breadcrumbs.tweakJIT('title', title => title.style('view-breadcrumbs-title'));
            breadcrumbs.tweakJIT('description', description => description.style('view-breadcrumbs-description'));
        })
            .prependTo(view));
    });
    exports.default = View;
});
define("ui/view/shared/component/ViewDefinition", ["require", "exports"], function (require, exports) {
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
define("ui/view/AccountView", ["require", "exports", "endpoint/author/EndpointAuthorDelete", "model/Session", "ui/component/core/ActionRow", "ui/component/core/Button", "ui/component/core/ConfirmDialog", "ui/component/core/Slot", "ui/component/OAuthServices", "ui/view/account/AccountViewForm", "ui/view/shared/component/View", "ui/view/shared/component/ViewDefinition", "ui/view/shared/ext/ViewTransition", "utility/State"], function (require, exports, EndpointAuthorDelete_1, Session_7, ActionRow_3, Button_7, ConfirmDialog_1, Slot_6, OAuthServices_2, AccountViewForm_1, View_1, ViewDefinition_1, ViewTransition_2, State_27) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    EndpointAuthorDelete_1 = __importDefault(EndpointAuthorDelete_1);
    Session_7 = __importDefault(Session_7);
    ActionRow_3 = __importDefault(ActionRow_3);
    Button_7 = __importDefault(Button_7);
    ConfirmDialog_1 = __importDefault(ConfirmDialog_1);
    Slot_6 = __importDefault(Slot_6);
    OAuthServices_2 = __importDefault(OAuthServices_2);
    AccountViewForm_1 = __importDefault(AccountViewForm_1);
    View_1 = __importDefault(View_1);
    ViewDefinition_1 = __importDefault(ViewDefinition_1);
    ViewTransition_2 = __importDefault(ViewTransition_2);
    State_27 = __importDefault(State_27);
    exports.default = (0, ViewDefinition_1.default)({
        async load() {
            const state = (0, State_27.default)(Session_7.default.Auth.state.value);
            const services = await (0, OAuthServices_2.default)(state);
            return { state, services };
        },
        create(_, { state, services }) {
            const id = 'account';
            const view = (0, View_1.default)(id);
            Session_7.default.Auth.author.use(view, author => view.breadcrumbs.setBackButton(!author?.vanity ? undefined : `/author/${author.vanity}`, button => button.subText.set(author?.name)));
            (0, Slot_6.default)()
                .use(state, () => createForm()?.subviewTransition(id))
                .appendTo(view.content);
            services.header.subviewTransition(id);
            services.appendTo(view.content);
            (0, Slot_6.default)()
                .use(state, () => createActionRow()?.subviewTransition(id))
                .appendTo(view.content);
            Session_7.default.Auth.state.subscribe(view, () => ViewTransition_2.default.perform('subview', id, updateAuthState));
            updateAuthState();
            return view;
            function updateAuthState(newState = Session_7.default.Auth.state.value) {
                state.value = newState;
            }
            function createForm() {
                switch (state.value) {
                    case 'has-authorisations':
                        return (0, AccountViewForm_1.default)('create');
                    case 'logged-in':
                        return (0, AccountViewForm_1.default)('update');
                }
            }
            function createActionRow() {
                switch (state.value) {
                    case 'logged-in':
                        return (0, ActionRow_3.default)()
                            .viewTransition('account-action-row')
                            .tweak(row => row.right
                            .append((0, Button_7.default)()
                            .text.use('view/account/action/logout')
                            .event.subscribe('click', () => Session_7.default.reset()))
                            .append((0, Button_7.default)()
                            .text.use('view/account/action/delete')
                            .event.subscribe('click', async () => {
                            const result = await ConfirmDialog_1.default.prompt(view, { dangerToken: 'delete-account' });
                            if (!result)
                                return;
                            const response = await EndpointAuthorDelete_1.default.query();
                            if (toast.handleError(response))
                                return;
                            return Session_7.default.reset();
                        })));
                }
            }
        },
    });
});
define("endpoint/author/EndpointAuthorGet", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_9) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_9 = __importDefault(Endpoint_9);
    exports.default = (0, Endpoint_9.default)('/author/{vanity}/get', 'get');
});
define("endpoint/work/EndpointWorkGetAllAuthor", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_10) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_10 = __importDefault(Endpoint_10);
    exports.default = (0, Endpoint_10.default)('/works/{author}', 'get');
});
define("model/PagedData", ["require", "exports", "ui/utility/EventManipulator", "utility/Objects", "utility/State"], function (require, exports, EventManipulator_1, Objects_6, State_28) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    EventManipulator_1 = __importDefault(EventManipulator_1);
    State_28 = __importDefault(State_28);
    const PagedData = Object.assign(function (definition) {
        const pageCount = (0, State_28.default)(undefined);
        const pages = (0, State_28.default)([], false); // .setId('PagedData pages')
        const result = {
            pageCount,
            event: undefined,
            get pages() {
                return pages.value.filter((page) => !(page instanceof Promise));
            },
            rawPages: pages,
            get(page) {
                if (pages.value[page] instanceof Promise)
                    return pages.value[page];
                const existing = pages.value[page]?.value;
                if (existing === undefined || existing === false) {
                    pages.value[page] = Promise.resolve(definition.get(page))
                        .then(data => {
                        if (!State_28.default.is(pages.value[page])) { // if it's already a State, it's been updated before this, don't overwrite
                            let newState;
                            if (State_28.default.is(data)) {
                                newState = (0, State_28.default)(null, false); // .setId(`PagedData page ${page} get 1`)
                                newState.bindManual(data);
                            }
                            else
                                newState = (0, State_28.default)(data, false); // .setId(`PagedData page ${page} get 2`)
                            pages.value[page] = newState;
                            pages.emit();
                        }
                        return pages.value[page];
                    });
                    pages.emit();
                }
                return pages.value[page];
            },
            set(page, data, isLastPage) {
                if (State_28.default.is(pages.value[page]))
                    pages.value[page].value = data;
                else
                    pages.value[page] = (0, State_28.default)(data, false); // .setId(`PagedData page ${page} set`)
                if (isLastPage)
                    pages.value.length = pageCount.value = page + 1;
                else if (pageCount.value !== undefined && page >= pageCount.value)
                    pageCount.value = undefined;
                pages.emit();
            },
            unset(startPage, endPageInclusive = startPage) {
                for (let i = startPage; i <= endPageInclusive; i++)
                    // eslint-disable-next-line @typescript-eslint/no-array-delete
                    delete pages.value[i];
                pages.emit();
                result.event.emit('UnsetPages', startPage, endPageInclusive);
            },
            delete(page) {
                void pages.value.splice(page, 1);
                pages.emit();
                result.event.emit('DeletePage', page);
            },
            setPageCount(count) {
                pageCount.value = count === true ? undefined : count;
            },
            clear() {
                pages.value = [];
                pageCount.value = undefined;
            },
        };
        (0, Objects_6.mutable)(result).event = (0, EventManipulator_1.default)(result);
        return result;
    }, {
        fromEndpoint,
    });
    function fromEndpoint(endpoint, orElse, dismantler) {
        const e = endpoint;
        const aux = {};
        const result = PagedData({
            async get(page) {
                const response = await e.query(undefined, { page });
                if (response.code === 404)
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                    return orElse ? orElse(page) : null;
                if (toast.handleError(response))
                    return false;
                if (dismantler) {
                    const { content, auxiliary } = dismantler(response.data);
                    for (const [key, value] of Object.entries(auxiliary)) {
                        if (value === content)
                            continue;
                        const state = aux[key] ??= (0, State_28.default)([]);
                        const mutableContent = content;
                        mutableContent[key] ??= state;
                        result[key] ??= state;
                        Object.assign(result, { aux });
                        if (Array.isArray(value))
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                            state.value.push(...value);
                        else
                            state.value.push(value);
                        state.emit();
                    }
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                    return content;
                }
                if (!Array.isArray(response.data) || response.data.length)
                    return response.data;
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                return orElse ? orElse(page) : null;
            },
        });
        return result;
    }
    exports.default = PagedData;
});
define("model/PagedListData", ["require", "exports", "model/PagedData", "utility/State"], function (require, exports, PagedData_1, State_29) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    PagedData_1 = __importDefault(PagedData_1);
    State_29 = __importDefault(State_29);
    const PagedListData = Object.assign(function (pageSize, definition) {
        const list = (0, PagedData_1.default)(definition);
        return Object.assign(list, {
            pageSize,
            ////////////////////////////////////
            //#region View Resizing
            resized(resizePageSize) {
                const newList = PagedListData(resizePageSize, {
                    get: getPage,
                });
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                const aux = list.aux;
                if (aux) {
                    const mutableAux = newList;
                    for (const [key, value] of Object.entries(aux))
                        mutableAux[key] = value;
                }
                list.rawPages.subscribeManual(() => {
                    // go through current pages and update each from the source list
                    const pages = newList.rawPages.value;
                    for (let i = 0; i < pages.length; i++) {
                        const page = pages[i];
                        if (State_29.default.is(page)) {
                            const pageState = page;
                            const value = getPage(i);
                            if (value instanceof Promise)
                                void value.then(setPageValue);
                            else
                                setPageValue(value);
                            function setPageValue(value) {
                                if (State_29.default.is(value))
                                    pageState.bindManual(value);
                                else
                                    pageState.value = value;
                                newList.rawPages.emit();
                            }
                            continue;
                        }
                        const value = getPage(i);
                        if (value instanceof Promise)
                            pages[i] = value.then(setPage);
                        else
                            pages[i] = setPage(value);
                        newList.rawPages.emit();
                        function setPage(value) {
                            const state = pages[i] = (0, State_29.default)(null, false); // .setId('PagedListData subscribeManual setPage')
                            if (State_29.default.is(value))
                                state.bindManual(value);
                            else
                                state.value = value;
                            newList.rawPages.emit();
                            return state;
                        }
                    }
                });
                const mutableNewList = newList;
                delete mutableNewList.resized;
                return newList;
                function getPage(page) {
                    const start = page * resizePageSize;
                    const end = (page + 1) * resizePageSize;
                    const startPageInSource = Math.floor(start / pageSize);
                    const endPageInSource = Math.ceil(end / pageSize);
                    const startIndexInFirstSourcePage = start % pageSize;
                    const endIndexInLastSourcePage = (end % pageSize) || pageSize;
                    const rawPages = list.rawPages.value.slice();
                    for (let i = startPageInSource; i < endPageInSource; i++) {
                        const rawPage = rawPages[i];
                        if (i >= startPageInSource && i < endPageInSource && (!rawPage || (State_29.default.is(rawPage) && rawPage.value === false))) {
                            rawPages[i] = list.get(i);
                        }
                    }
                    const sourcePages = rawPages.slice(startPageInSource, endPageInSource);
                    if (sourcePages.some(page => page instanceof Promise))
                        return Promise.all(sourcePages).then(sourcePages => resolveData(sourcePages, startIndexInFirstSourcePage, endIndexInLastSourcePage));
                    return resolveData(sourcePages, startIndexInFirstSourcePage, endIndexInLastSourcePage);
                }
                function resolveData(sourcePages, startIndex, endIndex) {
                    const data = [];
                    for (let i = 0; i < sourcePages.length; i++) {
                        const sourcePage = sourcePages[i];
                        if (sourcePage?.value === false)
                            return false;
                        if (!sourcePage?.value)
                            continue;
                        if (i === 0 && i === sourcePages.length - 1)
                            data.push(...sourcePage.value.slice(startIndex, endIndex));
                        else if (i === 0)
                            data.push(...sourcePage.value.slice(startIndex));
                        else if (i === sourcePages.length - 1)
                            data.push(...sourcePage.value.slice(0, endIndex));
                        else
                            data.push(...sourcePage.value);
                    }
                    return State_29.default.Generator(() => data, false).observeManual(...sourcePages); // .setId('PagedListData resolveData')
                }
            },
            //#endregion
            ////////////////////////////////////
        });
    }, {
        fromEndpoint,
    });
    function fromEndpoint(pageSize, endpoint, dismantler) {
        const e = endpoint;
        const aux = {};
        const result = PagedListData(pageSize, {
            async get(page) {
                const response = await e.query(undefined, { page });
                if (response.code === 404)
                    return null;
                if (toast.handleError(response))
                    return false;
                if (dismantler) {
                    const { content, auxiliary } = dismantler(response.data);
                    for (const [key, value] of Object.entries(auxiliary)) {
                        if (value === content)
                            continue;
                        const state = aux[key] ??= (0, State_29.default)([]);
                        const mutableContent = content;
                        mutableContent[key] ??= state;
                        result[key] ??= state;
                        Object.assign(result, { aux });
                        if (Array.isArray(value))
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                            state.value.push(...value);
                        else
                            state.value.push(value);
                        state.emit();
                    }
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                    return content;
                }
                if (!Array.isArray(response.data) || response.data.length)
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                    return response.data;
                return null;
            },
        });
        return result;
    }
    exports.default = PagedListData;
});
define("endpoint/follow/EndpointFollowAdd", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_11) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_11 = __importDefault(Endpoint_11);
    exports.default = {
        Author: (0, Endpoint_11.default)('/follow/author/{vanity}', 'post'),
        Work: (0, Endpoint_11.default)('/follow/work/{vanity}', 'post'),
        Tag: (0, Endpoint_11.default)('/follow/tag/{vanity}', 'post'),
        Category: (0, Endpoint_11.default)('/follow/category/{vanity}', 'post'),
    };
});
define("endpoint/follow/EndpointFollowAddWork", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_12) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_12 = __importDefault(Endpoint_12);
    exports.default = (0, Endpoint_12.default)('/follow/work/{author}/{vanity}', 'post');
});
define("endpoint/follow/EndpointFollowGetManifest", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_13) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_13 = __importDefault(Endpoint_13);
    exports.default = (0, Endpoint_13.default)('/following', 'get');
});
define("endpoint/follow/EndpointFollowRemove", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_14) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_14 = __importDefault(Endpoint_14);
    exports.default = {
        Author: (0, Endpoint_14.default)('/unfollow/author/{vanity}', 'post'),
        Work: (0, Endpoint_14.default)('/unfollow/work/{vanity}', 'post'),
        Tag: (0, Endpoint_14.default)('/unfollow/tag/{vanity}', 'post'),
        Category: (0, Endpoint_14.default)('/unfollow/category/{vanity}', 'post'),
    };
});
define("endpoint/follow/EndpointFollowRemoveWork", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_15) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_15 = __importDefault(Endpoint_15);
    exports.default = (0, Endpoint_15.default)('/unfollow/work/{author}/{vanity}', 'post');
});
define("endpoint/follow/EndpointIgnoreAdd", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_16) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_16 = __importDefault(Endpoint_16);
    exports.default = {
        Author: (0, Endpoint_16.default)('/ignore/author/{vanity}', 'post'),
        Work: (0, Endpoint_16.default)('/ignore/work/{vanity}', 'post'),
        Tag: (0, Endpoint_16.default)('/ignore/tag/{vanity}', 'post'),
        Category: (0, Endpoint_16.default)('/ignore/category/{vanity}', 'post'),
    };
});
define("endpoint/follow/EndpointIgnoreAddWork", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_17) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_17 = __importDefault(Endpoint_17);
    exports.default = (0, Endpoint_17.default)('/ignore/work/{author}/{vanity}', 'post');
});
define("endpoint/follow/EndpointIgnoreRemove", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_18) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_18 = __importDefault(Endpoint_18);
    exports.default = {
        Author: (0, Endpoint_18.default)('/unignore/author/{vanity}', 'post'),
        Work: (0, Endpoint_18.default)('/unignore/work/{vanity}', 'post'),
        Tag: (0, Endpoint_18.default)('/unignore/tag/{vanity}', 'post'),
        Category: (0, Endpoint_18.default)('/unignore/category/{vanity}', 'post'),
    };
});
define("endpoint/follow/EndpointIgnoreRemoveWork", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_19) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_19 = __importDefault(Endpoint_19);
    exports.default = (0, Endpoint_19.default)('/unignore/work/{author}/{vanity}', 'post');
});
define("endpoint/work/EndpointWorkDelete", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_20) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_20 = __importDefault(Endpoint_20);
    exports.default = (0, Endpoint_20.default)('/work/{author}/{vanity}/delete', 'post');
});
define("model/Works", ["require", "exports", "endpoint/work/EndpointWorkDelete", "ui/component/core/ConfirmDialog"], function (require, exports, EndpointWorkDelete_1, ConfirmDialog_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    EndpointWorkDelete_1 = __importDefault(EndpointWorkDelete_1);
    ConfirmDialog_2 = __importDefault(ConfirmDialog_2);
    var Works;
    (function (Works) {
        function resolve(reference, works) {
            return !reference ? undefined : works.find(work => work.author === reference.author && work.vanity === reference.vanity);
        }
        Works.resolve = resolve;
        function equals(a, b) {
            return !!a && !!b && a.author === b.author && a.vanity === b.vanity;
        }
        Works.equals = equals;
        function reference(work) {
            return work ? { author: work.author, vanity: work.vanity } : null;
        }
        Works.reference = reference;
    })(Works || (Works = {}));
    exports.default = Object.assign(Works, {
        async delete(work, owner) {
            if (!work)
                return true;
            const result = await ConfirmDialog_2.default.prompt(owner ?? null, { dangerToken: 'delete-work' });
            if (!result)
                return false;
            const response = await EndpointWorkDelete_1.default.query({ params: work });
            if (toast.handleError(response))
                return false;
            if (navigate.isURL(`/work/${work.author}/${work.vanity}/**`))
                void navigate.toURL(`/author/${work.author}`);
            return true;
        },
    });
});
define("model/Follows", ["require", "exports", "endpoint/follow/EndpointFollowAdd", "endpoint/follow/EndpointFollowAddWork", "endpoint/follow/EndpointFollowGetManifest", "endpoint/follow/EndpointFollowRemove", "endpoint/follow/EndpointFollowRemoveWork", "endpoint/follow/EndpointIgnoreAdd", "endpoint/follow/EndpointIgnoreAddWork", "endpoint/follow/EndpointIgnoreRemove", "endpoint/follow/EndpointIgnoreRemoveWork", "model/Manifest", "model/Works", "utility/Time"], function (require, exports, EndpointFollowAdd_1, EndpointFollowAddWork_1, EndpointFollowGetManifest_1, EndpointFollowRemove_1, EndpointFollowRemoveWork_1, EndpointIgnoreAdd_1, EndpointIgnoreAddWork_1, EndpointIgnoreRemove_1, EndpointIgnoreRemoveWork_1, Manifest_1, Works_1, Time_6) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    EndpointFollowAdd_1 = __importDefault(EndpointFollowAdd_1);
    EndpointFollowAddWork_1 = __importDefault(EndpointFollowAddWork_1);
    EndpointFollowGetManifest_1 = __importDefault(EndpointFollowGetManifest_1);
    EndpointFollowRemove_1 = __importDefault(EndpointFollowRemove_1);
    EndpointFollowRemoveWork_1 = __importDefault(EndpointFollowRemoveWork_1);
    EndpointIgnoreAdd_1 = __importDefault(EndpointIgnoreAdd_1);
    EndpointIgnoreAddWork_1 = __importDefault(EndpointIgnoreAddWork_1);
    EndpointIgnoreRemove_1 = __importDefault(EndpointIgnoreRemove_1);
    EndpointIgnoreRemoveWork_1 = __importDefault(EndpointIgnoreRemoveWork_1);
    Manifest_1 = __importDefault(Manifest_1);
    Works_1 = __importDefault(Works_1);
    Time_6 = __importDefault(Time_6);
    const manifest = (0, Manifest_1.default)({
        valid: Time_6.default.minutes(5),
        refresh: true,
        cacheId: 'follows',
        requiresAuthor: true,
        get() {
            return EndpointFollowGetManifest_1.default.query();
        },
        orElse() {
            const empy = [];
            return {
                following: new Proxy({}, {
                    get(target, p, receiver) {
                        return empy;
                    },
                }),
                ignoring: new Proxy({}, {
                    get(target, p, receiver) {
                        return empy;
                    },
                }),
            };
        },
    });
    const Util = {
        getTotalFollowing() {
            return 0
                + (manifest.value?.following.author.length ?? 0)
                + (manifest.value?.following.work.length ?? 0)
                + (manifest.value?.following.tag.length ?? 0)
                + (manifest.value?.following.category.length ?? 0);
        },
        getTotalIgnoring() {
            return 0
                + (manifest.value?.ignoring.author.length ?? 0)
                + (manifest.value?.ignoring.work.length ?? 0)
                + (manifest.value?.ignoring.tag.length ?? 0)
                + (manifest.value?.ignoring.category.length ?? 0);
        },
        ////////////////////////////////////
        //#region Authors
        followingAuthor(vanity) {
            return manifest.value?.following.author.some(follow => follow.author === vanity);
        },
        ignoringAuthor(vanity) {
            return manifest.value?.ignoring.author.some(ignore => ignore.author === vanity);
        },
        async toggleFollowingAuthor(vanity) {
            if (Util.followingAuthor(vanity))
                await Util.unfollowAuthor(vanity);
            else
                await Util.followAuthor(vanity);
        },
        async followAuthor(vanity) {
            if (!manifest.value) {
                console.warn('Cannot modify follows state, not loaded yet');
                return;
            }
            if (Util.followingAuthor(vanity))
                return; // already following
            const response = await EndpointFollowAdd_1.default.Author.query({ params: { vanity } });
            if (toast.handleError(response))
                return;
            manifest.value.ignoring.author.filterInPlace(ignore => ignore.author !== vanity);
            manifest.value.following.author.push({
                author: vanity,
                updated: new Date().toISOString(),
            });
            manifest.emit();
        },
        async unfollowAuthor(vanity) {
            if (!manifest.value) {
                console.warn('Cannot modify follows state, not loaded yet');
                return;
            }
            if (!Util.followingAuthor(vanity))
                return; // not following
            const response = await EndpointFollowRemove_1.default.Author.query({ params: { vanity } });
            if (toast.handleError(response))
                return;
            manifest.value.following.author.filterInPlace(follow => follow.author !== vanity);
            manifest.emit();
        },
        async toggleIgnoringAuthor(vanity) {
            if (Util.ignoringAuthor(vanity))
                await Util.unignoreAuthor(vanity);
            else
                await Util.ignoreAuthor(vanity);
        },
        async ignoreAuthor(vanity) {
            if (!manifest.value) {
                console.warn('Cannot modify ignores state, not loaded yet');
                return;
            }
            if (Util.ignoringAuthor(vanity))
                return; // already following
            const response = await EndpointIgnoreAdd_1.default.Author.query({ params: { vanity } });
            if (toast.handleError(response))
                return;
            manifest.value.following.author.filterInPlace(ignore => ignore.author !== vanity);
            manifest.value.ignoring.author.push({
                author: vanity,
                updated: new Date().toISOString(),
            });
            manifest.emit();
        },
        async unignoreAuthor(vanity) {
            if (!manifest.value) {
                console.warn('Cannot modify ignores state, not loaded yet');
                return;
            }
            if (!Util.ignoringAuthor(vanity))
                return; // not ignoring
            const response = await EndpointIgnoreRemove_1.default.Author.query({ params: { vanity } });
            if (toast.handleError(response))
                return;
            manifest.value.ignoring.author.filterInPlace(follow => follow.author !== vanity);
            manifest.emit();
        },
        //#endregion
        ////////////////////////////////////
        ////////////////////////////////////
        //#region Works
        followingWork(work) {
            return manifest.value?.following.work.some(follow => Works_1.default.equals(follow.work, work));
        },
        ignoringWork(work) {
            return manifest.value?.ignoring.work.some(ignore => Works_1.default.equals(ignore.work, work));
        },
        async toggleFollowingWork(work) {
            if (Util.followingWork(work))
                await Util.unfollowWork(work);
            else
                await Util.followWork(work);
        },
        async followWork(work) {
            if (!manifest.value) {
                console.warn('Cannot modify follows state, not loaded yet');
                return;
            }
            if (Util.followingWork(work))
                return; // already following
            const response = await EndpointFollowAddWork_1.default.query({ params: { author: work.author, vanity: work.vanity } });
            if (toast.handleError(response))
                return;
            manifest.value.ignoring.work.filterInPlace(w => !Works_1.default.equals(w.work, work));
            manifest.value.following.work.push({
                work: Works_1.default.reference(work),
                updated: new Date().toISOString(),
            });
            manifest.emit();
        },
        async unfollowWork(work) {
            if (!manifest.value) {
                console.warn('Cannot modify follows state, not loaded yet');
                return;
            }
            if (!Util.followingWork(work))
                return; // not following
            const response = await EndpointFollowRemoveWork_1.default.query({ params: { author: work.author, vanity: work.vanity } });
            if (toast.handleError(response))
                return;
            manifest.value.following.work.filterInPlace(w => !Works_1.default.equals(w.work, work));
            manifest.emit();
        },
        async toggleIgnoringWork(work) {
            if (Util.ignoringWork(work))
                await Util.unignoreWork(work);
            else
                await Util.ignoreWork(work);
        },
        async ignoreWork(work) {
            if (!manifest.value) {
                console.warn('Cannot modify ignores state, not loaded yet');
                return;
            }
            if (Util.ignoringWork(work))
                return; // already following
            const response = await EndpointIgnoreAddWork_1.default.query({ params: { author: work.author, vanity: work.vanity } });
            if (toast.handleError(response))
                return;
            manifest.value.following.work.filterInPlace(w => !Works_1.default.equals(w.work, work));
            manifest.value.ignoring.work.push({
                work: Works_1.default.reference(work),
                updated: new Date().toISOString(),
            });
            manifest.emit();
        },
        async unignoreWork(work) {
            if (!manifest.value) {
                console.warn('Cannot modify ignores state, not loaded yet');
                return;
            }
            if (!Util.ignoringWork(work))
                return; // not ignoring
            const response = await EndpointIgnoreRemoveWork_1.default.query({ params: { author: work.author, vanity: work.vanity } });
            if (toast.handleError(response))
                return;
            manifest.value.ignoring.work.filterInPlace(w => !Works_1.default.equals(w.work, work));
            manifest.emit();
        },
        //#endregion
        ////////////////////////////////////
        ////////////////////////////////////
        //#region Tags
        followingTag(tag) {
            return manifest.value?.following.tag.some(follow => follow.tag === tag);
        },
        ignoringTag(tag) {
            return manifest.value?.ignoring.tag.some(ignore => ignore.tag === tag);
        },
        async toggleFollowingTag(tag) {
            if (Util.followingTag(tag))
                await Util.unfollowTag(tag);
            else
                await Util.followTag(tag);
        },
        async followTag(tag) {
            if (!manifest.value) {
                console.warn('Cannot modify follows state, not loaded yet');
                return;
            }
            if (Util.followingTag(tag))
                return; // already following
            const response = await EndpointFollowAdd_1.default.Tag.query({ params: { vanity: tag } });
            if (toast.handleError(response))
                return;
            manifest.value.ignoring.tag.filterInPlace(ignore => ignore.tag !== tag);
            manifest.value.following.tag.push({
                tag,
                updated: new Date().toISOString(),
            });
            manifest.emit();
        },
        async unfollowTag(tag) {
            if (!manifest.value) {
                console.warn('Cannot modify follows state, not loaded yet');
                return;
            }
            if (!Util.followingTag(tag))
                return; // not following
            const response = await EndpointFollowRemove_1.default.Tag.query({ params: { vanity: tag } });
            if (toast.handleError(response))
                return;
            manifest.value.following.tag.filterInPlace(follow => follow.tag !== tag);
            manifest.emit();
        },
        async toggleIgnoringTag(tag) {
            if (Util.ignoringTag(tag))
                await Util.unignoreTag(tag);
            else
                await Util.ignoreTag(tag);
        },
        async ignoreTag(tag) {
            if (!manifest.value) {
                console.warn('Cannot modify ignores state, not loaded yet');
                return;
            }
            if (Util.ignoringTag(tag))
                return; // already following
            const response = await EndpointIgnoreAdd_1.default.Tag.query({ params: { vanity: tag } });
            if (toast.handleError(response))
                return;
            manifest.value.following.tag.filterInPlace(ignore => ignore.tag !== tag);
            manifest.value.ignoring.tag.push({
                tag,
                updated: new Date().toISOString(),
            });
            manifest.emit();
        },
        async unignoreTag(tag) {
            if (!manifest.value) {
                console.warn('Cannot modify ignores state, not loaded yet');
                return;
            }
            if (!Util.ignoringTag(tag))
                return; // not ignoring
            const response = await EndpointIgnoreRemove_1.default.Tag.query({ params: { vanity: tag } });
            if (toast.handleError(response))
                return;
            manifest.value.ignoring.tag.filterInPlace(follow => follow.tag !== tag);
            manifest.emit();
        },
        //#endregion
        ////////////////////////////////////
        ////////////////////////////////////
        //#region Categories
        followingCategory(category) {
            return manifest.value?.following.category.some(follow => follow.tag_category === category);
        },
        ignoringCategory(category) {
            return manifest.value?.ignoring.tag.some(ignore => ignore.tag_category === category);
        },
        async toggleFollowingCategory(category) {
            if (Util.followingCategory(category))
                await Util.unfollowCategory(category);
            else
                await Util.followCategory(category);
        },
        async followCategory(category) {
            if (!manifest.value) {
                console.warn('Cannot modify follows state, not loaded yet');
                return;
            }
            if (Util.followingCategory(category))
                return; // already following
            const response = await EndpointFollowAdd_1.default.Category.query({ params: { vanity: category } });
            if (toast.handleError(response))
                return;
            manifest.value.ignoring.category.filterInPlace(ignore => ignore.tag_category !== category);
            manifest.value.following.category.push({
                tag_category: category,
                updated: new Date().toISOString(),
            });
            manifest.emit();
        },
        async unfollowCategory(category) {
            if (!manifest.value) {
                console.warn('Cannot modify follows state, not loaded yet');
                return;
            }
            if (!Util.followingCategory(category))
                return; // not following
            const response = await EndpointFollowRemove_1.default.Category.query({ params: { vanity: category } });
            if (toast.handleError(response))
                return;
            manifest.value.following.category.filterInPlace(follow => follow.tag_category !== category);
            manifest.emit();
        },
        async toggleIgnoringCategory(category) {
            if (Util.ignoringCategory(category))
                await Util.unignoreCategory(category);
            else
                await Util.ignoreCategory(category);
        },
        async ignoreCategory(category) {
            if (!manifest.value) {
                console.warn('Cannot modify ignores state, not loaded yet');
                return;
            }
            if (Util.ignoringCategory(category))
                return; // already following
            const response = await EndpointIgnoreAdd_1.default.Category.query({ params: { vanity: category } });
            if (toast.handleError(response))
                return;
            manifest.value.following.category.filterInPlace(ignore => ignore.tag_category !== category);
            manifest.value.ignoring.category.push({
                tag_category: category,
                updated: new Date().toISOString(),
            });
            manifest.emit();
        },
        async unignoreCategory(category) {
            if (!manifest.value) {
                console.warn('Cannot modify ignores state, not loaded yet');
                return;
            }
            if (!Util.ignoringCategory(category))
                return; // not ignoring
            const response = await EndpointIgnoreRemove_1.default.Category.query({ params: { vanity: category } });
            if (toast.handleError(response))
                return;
            manifest.value.ignoring.category.filterInPlace(follow => follow.tag_category !== category);
            manifest.emit();
        },
        //#endregion
        ////////////////////////////////////
    };
    exports.default = Object.assign(manifest, Util);
});
define("ui/component/core/ExternalLink", ["require", "exports", "navigation/RoutePath", "ui/Component", "ui/utility/MarkdownContent", "utility/Env"], function (require, exports, RoutePath_2, Component_36, MarkdownContent_3, Env_6) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Component_36 = __importDefault(Component_36);
    MarkdownContent_3 = __importDefault(MarkdownContent_3);
    Env_6 = __importDefault(Env_6);
    const ExternalLink = Component_36.default.Builder('a', (component, href) => {
        component.style('link', 'link-external');
        if (href !== undefined)
            component.attributes.set('href', href);
        return component;
    });
    MarkdownContent_3.default.handle((element, context) => {
        if (element.tagName !== 'A')
            return;
        let href = element.getAttribute('href');
        if (href?.startsWith(Env_6.default.URL_ORIGIN))
            href = href.slice(Env_6.default.URL_ORIGIN.length - 1);
        if (!href || RoutePath_2.RoutePath.is(href))
            return;
        return () => {
            const link = ExternalLink(href).text.set(element.textContent ?? '');
            element.replaceWith(link.element);
        };
    });
    exports.default = ExternalLink;
});
define("ui/component/Author", ["require", "exports", "lang/en-nz", "model/Follows", "model/Session", "ui/Component", "ui/component/core/Block", "ui/component/core/Button", "ui/component/core/ExternalLink", "ui/component/core/Placeholder", "ui/component/core/Slot"], function (require, exports, en_nz_5, Follows_1, Session_8, Component_37, Block_6, Button_8, ExternalLink_1, Placeholder_2, Slot_7) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    en_nz_5 = __importDefault(en_nz_5);
    Follows_1 = __importDefault(Follows_1);
    Session_8 = __importDefault(Session_8);
    Component_37 = __importDefault(Component_37);
    Block_6 = __importDefault(Block_6);
    Button_8 = __importDefault(Button_8);
    ExternalLink_1 = __importDefault(ExternalLink_1);
    Placeholder_2 = __importDefault(Placeholder_2);
    Slot_7 = __importDefault(Slot_7);
    exports.default = Component_37.default.Builder((component, author) => {
        component
            .viewTransition('author')
            .style('author');
        const block = component.and(Block_6.default);
        block.title
            .style('author-name')
            .text.set(author.name);
        block.description
            .append((0, Component_37.default)()
            .style('author-vanity')
            .text.set(`@${author.vanity}`))
            .append(author.pronouns && (0, Slot_7.default)()
            .text.append(' · ')
            .append((0, Component_37.default)()
            .style('author-pronouns')
            .text.set(author.pronouns)));
        if (author.description)
            (0, Component_37.default)()
                .style('author-description')
                .append((0, Slot_7.default)().tweak(slot => {
                const body = author.description.body;
                if (body)
                    slot.setMarkdownContent(author.description);
                else
                    slot.and(Placeholder_2.default).text.use('author/description/empty');
            }))
                .appendTo(block.content);
        if (author.support_link)
            (0, ExternalLink_1.default)(author.support_link)
                .style('author-support-link')
                .text.set(author.support_message || en_nz_5.default['author/support-message/placeholder']())
                .appendTo(block.content);
        block.setActionsMenu(popover => {
            Session_8.default.Auth.author.use(popover, self => {
                if (self?.vanity === author.vanity) {
                    (0, Button_8.default)()
                        .type('flush')
                        .setIcon('pencil')
                        .text.use('author/action/label/edit')
                        .event.subscribe('click', () => navigate.toURL('/account'))
                        .appendTo(popover);
                }
                else if (Session_8.default.Auth.loggedIn.value) {
                    (0, Button_8.default)()
                        .type('flush')
                        .bindIcon(Follows_1.default.map(popover, () => Follows_1.default.followingAuthor(author.vanity)
                        ? 'circle-check'
                        : 'circle'))
                        .text.bind(Follows_1.default.map(popover, () => Follows_1.default.followingAuthor(author.vanity)
                        ? en_nz_5.default['author/action/label/unfollow']()
                        : en_nz_5.default['author/action/label/follow']()))
                        .event.subscribe('click', () => Follows_1.default.toggleFollowingAuthor(author.vanity))
                        .appendTo(popover);
                    (0, Button_8.default)()
                        .type('flush')
                        .bindIcon(Follows_1.default.map(popover, () => Follows_1.default.ignoringAuthor(author.vanity)
                        ? 'ban'
                        : 'circle'))
                        .text.bind(Follows_1.default.map(popover, () => Follows_1.default.ignoringAuthor(author.vanity)
                        ? en_nz_5.default['author/action/label/unignore']()
                        : en_nz_5.default['author/action/label/ignore']()))
                        .event.subscribe('click', () => Follows_1.default.toggleIgnoringAuthor(author.vanity))
                        .appendTo(popover);
                }
            });
        });
        return block;
    });
});
define("ui/component/core/Paginator", ["require", "exports", "ui/Component", "ui/component/core/Block", "ui/component/core/Button", "ui/component/core/Popover", "ui/component/core/Slot", "utility/Async", "utility/State", "utility/Style"], function (require, exports, Component_38, Block_7, Button_9, Popover_4, Slot_8, Async_3, State_30, Style_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Component_38 = __importDefault(Component_38);
    Block_7 = __importDefault(Block_7);
    Button_9 = __importDefault(Button_9);
    Popover_4 = __importDefault(Popover_4);
    Slot_8 = __importDefault(Slot_8);
    Async_3 = __importDefault(Async_3);
    State_30 = __importDefault(State_30);
    Style_3 = __importDefault(Style_3);
    const Paginator = Component_38.default.Builder((component) => {
        const block = component.and(Block_7.default);
        const isFlush = block.type.state.mapManual(type => type.has('flush'));
        const mastheadHeight = Style_3.default.measure('--masthead-height');
        const space4 = Style_3.default.measure('--space-4');
        void mastheadHeight.value;
        void space4.value; // trigger init
        block.style.bind(isFlush, 'paginator--flush');
        block.tweakJIT('header', header => {
            header.style('paginator-header')
                .style.bind(isFlush, 'paginator-header--flush')
                .style.bind(component.getStateForClosest(Popover_4.default).truthy, 'paginator-header--within-popover');
            block.content.style('paginator-content--has-header');
        });
        const content = block.content
            .style('paginator-content')
            .style.bind(isFlush, 'paginator-content--flush');
        block.footer
            .style('paginator-footer')
            .style.bind(isFlush, 'paginator-footer--flush');
        const scrollAnchorBottom = (0, Component_38.default)()
            .style('paginator-after-anchor')
            .appendTo(block);
        block.footer.left.style('paginator-footer-left');
        block.footer.right.style('paginator-footer-right');
        const cursor = (0, State_30.default)(0);
        const allData = (0, State_30.default)(undefined, false);
        const pageCount = allData.mapManual(data => data?.pageCount);
        const hasNoPageCount = pageCount.mapManual(count => count === undefined);
        const isMultiPage = pageCount.mapManual(count => count === undefined || count > 1);
        const currentData = (0, State_30.default)(false, false);
        let settingId = Symbol();
        State_30.default.Use(component, { cursor, allData }).use(component, async ({ cursor, allData }) => {
            if (!allData)
                return currentData.value = false;
            const ownId = settingId = Symbol();
            const value = await allData?.get(cursor);
            if (settingId !== ownId)
                return;
            currentData.bind(component, value);
        });
        const isFirstPage = cursor.mapManual(cursor => cursor <= 0);
        const isLastPage = State_30.default.Map(component, [cursor, pageCount], (cursor, pageCount) => cursor + 1 >= (pageCount ?? Infinity));
        // first
        (0, Button_9.default)()
            .setIcon('angles-left')
            .type('icon')
            .style('paginator-button')
            .style.bind(isFirstPage, 'paginator-button--disabled')
            .event.subscribe('click', () => cursor.value = 0)
            .appendTo(block.footer.left);
        // prev
        (0, Button_9.default)()
            .setIcon('angle-left')
            .type('icon')
            .style('paginator-button')
            .style.bind(isFirstPage, 'paginator-button--disabled')
            .event.subscribe('click', () => cursor.value = Math.max(cursor.value - 1, 0))
            .appendTo(block.footer.left);
        // next
        (0, Button_9.default)()
            .setIcon('angle-right')
            .type('icon')
            .style('paginator-button')
            .style.bind(isLastPage, 'paginator-button--disabled')
            .event.subscribe('click', () => cursor.value = Math.min(cursor.value + 1, pageCount.value === undefined ? Infinity : pageCount.value - 1))
            .appendTo(block.footer.right);
        // last
        (0, Button_9.default)()
            .setIcon('angles-right')
            .type('icon')
            .style('paginator-button')
            .style.bind(isLastPage, 'paginator-button--disabled')
            .style.bind(hasNoPageCount, 'paginator-button--hidden')
            .event.subscribe('click', () => cursor.value = !pageCount.value ? cursor.value : pageCount.value - 1)
            .appendTo(block.footer.right);
        let initialiser;
        let orElseInitialiser;
        let scrollOption;
        const paginator = block
            .viewTransition('paginator')
            .style('paginator')
            .extend(component => ({
            page: cursor,
            data: currentData,
            scrollAnchorBottom,
            set(data, initialiserIn) {
                initialiser = initialiserIn;
                allData.value = data;
                const emitCursorUpdate = () => cursor.emit();
                data.event.subscribe('DeletePage', emitCursorUpdate);
                component.removed.awaitManual(true, () => data.event.unsubscribe('DeletePage', emitCursorUpdate));
                return this;
            },
            orElse(initialiser) {
                orElseInitialiser = initialiser;
                return this;
            },
            setScroll(scroll = true) {
                scrollOption = scroll;
                return this;
            },
        }));
        paginator.footer.style.bind(isMultiPage.not, 'paginator-footer--hidden');
        let bouncedFrom;
        let scrollAnchorBottomPreviousRect;
        let scrollAnchorTopPreviousRect;
        let previousScrollRect;
        let removeLastScrollIntoViewHandler;
        let unuseCursor;
        (0, Slot_8.default)()
            .use(allData, (slot, data) => {
            const wrapper = (0, Slot_8.default)().appendTo(slot);
            const pages = [];
            const handleDelete = (event, pageNumber) => {
                const page = pages[pageNumber];
                page?.style.remove('paginator-page--initial-load', 'paginator-page--bounce')
                    .style('paginator-page--hidden')
                    .style.setVariable('page-direction', 0);
                pages.splice(pageNumber, 1);
            };
            data?.event.subscribe('DeletePage', handleDelete);
            slot.closed.awaitManual(true, () => data?.event.unsubscribe('DeletePage', handleDelete));
            const handleUnset = (event, startNumber, endNumberInclusive) => {
                for (let pageNumber = startNumber; pageNumber <= endNumberInclusive; pageNumber++) {
                    pages[pageNumber]?.remove();
                    // eslint-disable-next-line @typescript-eslint/no-array-delete
                    delete pages[pageNumber];
                }
            };
            data?.event.subscribe('UnsetPages', handleUnset);
            slot.closed.awaitManual(true, () => data?.event.unsubscribe('UnsetPages', handleUnset));
            unuseCursor?.();
            unuseCursor = cursor.use(slot, async (pageNumber, previousPageNumber) => {
                previousScrollRect = new DOMRect(0, window.scrollY, window.innerWidth, document.documentElement.scrollHeight);
                scrollAnchorTopPreviousRect = paginator.element.getBoundingClientRect();
                scrollAnchorBottomPreviousRect = scrollAnchorBottom.element.getBoundingClientRect();
                removeLastScrollIntoViewHandler?.();
                removeLastScrollIntoViewHandler = undefined;
                const isInitialPage = !pages.length;
                const newPage = pages[pageNumber] ??= (await Page(pageNumber))?.appendTo(wrapper);
                const direction = Math.sign(pageNumber - (previousPageNumber ?? pageNumber));
                const previousPage = previousPageNumber === undefined ? undefined : pages[previousPageNumber];
                previousPage
                    ?.style.remove('paginator-page--initial-load', 'paginator-page--bounce')
                    .style('paginator-page--hidden')
                    .style.setVariable('page-direction', direction);
                newPage
                    ?.style.toggle(isInitialPage, 'paginator-page--initial-load')
                    .style.setVariable('page-direction', direction);
                if (!data || !newPage)
                    return;
                const hasContent = newPage.content.value === false || hasResults(newPage.content.value);
                if (hasContent) {
                    newPage.style.remove('paginator-page--hidden');
                    const newScrollHeight = document.documentElement.scrollHeight;
                    if (newScrollHeight > previousScrollRect.height)
                        scrollIntoView(direction);
                    else {
                        const doScrollIntoView = () => scrollIntoView(direction);
                        previousPage?.element.addEventListener('transitionend', doScrollIntoView, { once: true });
                        removeLastScrollIntoViewHandler = () => {
                            previousPage?.element.removeEventListener('transitionend', doScrollIntoView);
                            removeLastScrollIntoViewHandler = undefined;
                        };
                    }
                    return;
                }
                if (previousPageNumber !== undefined) {
                    if (bouncedFrom === previousPageNumber)
                        return;
                    // empty, play bounce animation
                    pages[previousPageNumber]?.style('paginator-page--bounce');
                    await Async_3.default.sleep(200);
                    bouncedFrom = pageNumber;
                    cursor.value = previousPageNumber;
                }
                else {
                    const isTotallyEmpty = false
                        || data.pageCount.value === 0
                        || data.pages.every(page => false
                            || page.value === false
                            || page.value === null
                            || (Array.isArray(page.value) && !page.value.length));
                    if (isTotallyEmpty) {
                        orElseInitialiser?.(newPage, paginator);
                        newPage.style.remove('paginator-page--hidden');
                        return;
                    }
                }
            });
            async function Page(pageNumber) {
                const page = (0, Slot_8.default)()
                    .style('paginator-page', 'paginator-page--hidden')
                    .style.bind(isFlush, 'paginator-page--flush');
                if (!data)
                    return undefined;
                const pageContent = await data.get(pageNumber);
                pageContent.use(slot, async (content) => {
                    page.removeContents();
                    const hasContent = hasResults(content);
                    if (hasContent) {
                        initialiser?.(page, content, pageNumber, data, paginator);
                        return;
                    }
                    // no content — either errored or empty
                    if (content === false) {
                        // errored, show retry dialog, when dialog 
                        await new Promise(resolve => {
                            RetryDialog(resolve).appendTo(page);
                            block.header.element.scrollIntoView();
                        });
                        return await data.get(pageNumber);
                    }
                });
                return Object.assign(page, { content: pageContent });
            }
            function scrollIntoView(direction) {
                if (!direction || scrollOption === false)
                    return;
                const scrollTarget = direction > 0 ? block.element : scrollAnchorBottom.element;
                if (!scrollTarget)
                    return;
                if (typeof scrollOption === 'function') {
                    scrollOption(scrollTarget, direction > 0 ? 'forward' : 'backward', {
                        scrollRect: new DOMRect(0, window.scrollY, window.innerWidth, document.documentElement.scrollHeight),
                        scrollAnchorTopRect: block.element.getBoundingClientRect(),
                        scrollAnchorBottomRect: scrollAnchorBottom.element.getBoundingClientRect(),
                        previousScrollRect: previousScrollRect,
                        scrollAnchorTopPreviousRect,
                        scrollAnchorBottomPreviousRect,
                    });
                    return;
                }
                const target = scrollTarget.getBoundingClientRect().top + window.scrollY - mastheadHeight.value - space4.value;
                window.scrollTo({ top: target, behavior: 'smooth' });
            }
        })
            .appendTo(content);
        return paginator;
        function RetryDialog(retry) {
            return (0, Component_38.default)()
                .style('paginator-error')
                .append((0, Component_38.default)()
                .style('paginator-error-text')
                .text.use('component/paginator/error'))
                .append((0, Button_9.default)()
                .type('primary')
                .style('paginator-error-retry-button')
                .text.use('component/paginator/error/retry')
                .event.subscribe('click', () => retry()));
        }
    });
    function hasResults(result) {
        if (result === null || result === undefined)
            return false;
        if (typeof result !== 'object')
            return true;
        if (Array.isArray(result))
            return result.length > 0;
        for (const sub of Object.values(result))
            if (hasResults(sub))
                return true;
        return false;
    }
    exports.default = Paginator;
});
define("ui/component/core/TextLabel", ["require", "exports", "ui/Component"], function (require, exports, Component_39) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Component_39 = __importDefault(Component_39);
    const TextLabel = Component_39.default.Builder((component) => {
        component.style("text-label");
        const label = (0, Component_39.default)()
            .style("text-label-label");
        const punctuation = (0, Component_39.default)()
            .style("text-label-punctuation")
            .text.set(": ");
        const content = (0, Component_39.default)()
            .style("text-label-content");
        return component
            .append(label, punctuation, content)
            .extend(() => ({
            label, content,
        }));
    });
    exports.default = TextLabel;
});
define("ui/component/core/Timestamp", ["require", "exports", "ui/Component", "utility/State", "utility/Time"], function (require, exports, Component_40, State_31, Time_7) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Component_40 = __importDefault(Component_40);
    State_31 = __importDefault(State_31);
    Time_7 = __importDefault(Time_7);
    const Timestamp = Component_40.default.Builder((component, time) => {
        let translation;
        const state = (0, State_31.default)(new Date(time ?? Date.now()));
        state.use(component, update);
        return component
            .style('timestamp')
            .extend(component => ({
            time: state,
            setTranslation(newTranslation) {
                translation = newTranslation;
                return component;
            },
        }))
            .onRooted(component => {
            update();
            const interval = setInterval(update, Time_7.default.seconds(1));
            component.removed.awaitManual(true, () => clearInterval(interval));
        });
        function update() {
            const timeString = Time_7.default.relative(state.value.getTime(), { components: 2, secondsExclusive: true });
            component.text.set(translation?.(timeString) ?? timeString);
        }
    });
    exports.default = Timestamp;
});
define("endpoint/tag/EndpointTagManifest", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_21) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_21 = __importDefault(Endpoint_21);
    exports.default = (0, Endpoint_21.default)('/manifest/tags', 'get');
});
define("model/Tags", ["require", "exports", "endpoint/tag/EndpointTagManifest", "model/Manifest", "utility/Time"], function (require, exports, EndpointTagManifest_1, Manifest_2, Time_8) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.resolve = resolve;
    EndpointTagManifest_1 = __importDefault(EndpointTagManifest_1);
    Manifest_2 = __importDefault(Manifest_2);
    Time_8 = __importDefault(Time_8);
    const Tags = Object.assign((0, Manifest_2.default)({
        valid: Time_8.default.minutes(5),
        async get() {
            const response = await EndpointTagManifest_1.default.query();
            if (!response.data)
                return response;
            const rawManifest = response.data;
            for (const rawCategory of Object.values(rawManifest.categories)) {
                const category = rawCategory;
                category.nameLowercase = category.name.toLowerCase();
                category.wordsLowercase = category.nameLowercase.split(' ');
            }
            for (const rawTag of Object.values(rawManifest.tags)) {
                const tag = rawTag;
                tag.nameLowercase = tag.name.toLowerCase();
                tag.wordsLowercase = tag.nameLowercase.split(' ');
                tag.categoryLowercase = tag.category.toLowerCase();
                tag.categoryWordsLowercase = tag.categoryLowercase.split(' ');
            }
            return response;
        },
    }), {
        resolve,
        toId,
    });
    exports.default = Tags;
    function toId(category, name) {
        return typeof category === 'string'
            ? `${category}: ${name}`
            : `${category.category}: ${category.name}`;
    }
    async function resolve(tags, name) {
        if (!tags?.length)
            return [];
        if (Array.isArray(tags))
            return resolveInternal(tags);
        const tag = name ? `${tags}: ${name}` : tags;
        const [result] = await resolveInternal([tag]);
        return result;
    }
    async function resolveInternal(tags) {
        const result = [];
        let manifest = await Tags.getManifest();
        resolveTags();
        if (result.length !== tags.length && !Tags.isFresh()) {
            manifest = await Tags.getManifest(true);
            resolveTags();
        }
        return result;
        function resolveTags() {
            result.splice(0, Infinity);
            for (const tagString of tags) {
                const tag = manifest.tags[tagString];
                if (!tag)
                    continue;
                result.push(tag);
            }
        }
    }
});
define("ui/component/core/ext/Draggable", ["require", "exports", "ui/Component", "utility/maths/Vector2", "utility/State"], function (require, exports, Component_41, Vector2_1, State_32) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Component_41 = __importDefault(Component_41);
    Vector2_1 = __importDefault(Vector2_1);
    State_32 = __importDefault(State_32);
    var DragState;
    (function (DragState) {
        DragState[DragState["None"] = 0] = "None";
        DragState[DragState["Starting"] = 1] = "Starting";
        DragState[DragState["Delayed"] = 2] = "Delayed";
        DragState[DragState["Dragging"] = 3] = "Dragging";
    })(DragState || (DragState = {}));
    const isDraggingAnyDraggable = (0, State_32.default)(false);
    const Draggable = Object.assign(Component_41.default.Extension((component, definition = {}) => {
        component.style('draggable');
        const state = (0, State_32.default)(DragState.None);
        const overrideStickyDistance = (0, State_32.default)(undefined);
        const overrideDelay = (0, State_32.default)(undefined);
        const stickyDistance = State_32.default.MapManual([overrideStickyDistance, definition.stickyDistance], (override, base) => override ?? base ?? 0);
        const delay = State_32.default.MapManual([overrideDelay, definition.delay], (override, base) => override ?? base ?? 0);
        let mouseStartPosition;
        // let startTime: number | undefined
        let delayTimeout;
        component.onRemoveManual(stopDragging);
        component.event.subscribe(['mousedown', 'touchstart'], dragStart);
        const draggable = component.extend(component => ({
            state,
            dragging: state.mapManual(value => value === DragState.Dragging),
            setStickyDistance(value) {
                overrideStickyDistance.value = value;
                return component;
            },
            setDelay(value) {
                overrideDelay.value = value;
                return component;
            },
            stopDragging,
        }));
        return draggable;
        function dragStart(event) {
            const position = getMousePosition(event);
            if (!position)
                return;
            event.preventDefault();
            isDraggingAnyDraggable.value = true;
            mouseStartPosition = position;
            state.value = DragState.Starting;
            // startTime = Date.now()
            if (event.type === 'touchstart') {
                window.addEventListener('touchmove', dragMove, { passive: true });
                window.addEventListener('touchend', dragEnd, { passive: true });
            }
            else {
                window.addEventListener('mousemove', dragMove, { passive: true });
                window.addEventListener('mouseup', dragEnd, { passive: true });
            }
            if (delay) {
                state.value = DragState.Delayed;
                delayTimeout = window.setTimeout(() => {
                    if (state.value === DragState.Delayed) {
                        state.value = definition.stickyDistance?.value ? DragState.Starting : DragState.Dragging;
                        if (!definition.stickyDistance?.value) {
                            const result = definition.onMoveStart?.(draggable, position);
                            if (result === false) {
                                dragEnd();
                                return;
                            }
                            draggable.style('draggable-dragging');
                        }
                        dragMove(event);
                    }
                }, delay.value);
            }
        }
        function dragMove(event) {
            if (state.value === DragState.Delayed)
                return;
            const position = getMousePosition(event);
            if (!position)
                return;
            const offset = Vector2_1.default.subtract(position, mouseStartPosition);
            const stickyDistanceValue = stickyDistance.value;
            if (state.value === DragState.Starting && (stickyDistanceValue < 5 || !Vector2_1.default.distanceWithin(stickyDistanceValue, offset, Vector2_1.default.ZERO))) {
                const result = definition.onMoveStart?.(draggable, position);
                if (result === false) {
                    dragEnd();
                    return;
                }
                state.value = DragState.Dragging;
                draggable.style('draggable-dragging');
            }
            if (state.value !== DragState.Dragging)
                return;
            const result = definition.onMove?.(draggable, offset, position);
            if (result === false) {
                dragEnd();
                return;
            }
            return offset;
        }
        function dragEnd(event) {
            removeListeners();
            if (state.value === DragState.Dragging && event) {
                const position = getMousePosition(event);
                const offset = position ? dragMove(event) : undefined;
                definition.onMoveEnd?.(draggable, offset ?? Vector2_1.default.ZERO, position ?? mouseStartPosition);
            }
            stopDragging();
        }
        function removeListeners() {
            window.clearTimeout(delayTimeout);
            window.removeEventListener('touchmove', dragMove);
            window.removeEventListener('mousemove', dragMove);
            window.removeEventListener('touchend', dragEnd);
            window.removeEventListener('mouseup', dragEnd);
        }
        function stopDragging() {
            removeListeners();
            isDraggingAnyDraggable.value = false;
            state.value = DragState.None;
            mouseStartPosition = undefined;
            // startTime = undefined
            draggable.style.remove('draggable-dragging');
            return draggable;
        }
        function getMousePosition(event) {
            const touch = event.touches?.[0];
            if (event.button !== 0 && !touch) {
                return undefined;
            }
            return Vector2_1.default.fromClient(touch ?? event);
        }
    }), {
        isDragging: isDraggingAnyDraggable,
    });
    exports.default = Draggable;
});
define("ui/component/Tag", ["require", "exports", "ui/Component", "ui/component/core/Button", "ui/component/core/ext/Draggable", "ui/component/core/Link"], function (require, exports, Component_42, Button_10, Draggable_1, Link_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Component_42 = __importDefault(Component_42);
    Button_10 = __importDefault(Button_10);
    Draggable_1 = __importDefault(Draggable_1);
    Link_3 = __importDefault(Link_3);
    const toURLRegex = /\W+/g;
    const toURL = (name) => name.replaceAll(toURLRegex, '-').toLowerCase();
    const Tag = Object.assign(Component_42.default.Builder('a', (component, tag) => {
        if (component.tagName === 'A')
            component.and(Link_3.default, typeof tag === 'string' ? undefined /* `/tag/${tag}` */ : `/tag/${toURL(tag.category)}/${toURL(tag.name)}`);
        component
            .and(Button_10.default)
            .style('tag')
            .style.toggle(typeof tag === 'string', 'tag-custom')
            .style.toggle(typeof tag !== 'string', 'tag-global');
        const categoryWrapper = typeof tag === 'string'
            ? undefined
            : (0, Component_42.default)()
                .style('tag-category')
                .text.set(tag.category)
                .appendTo(component);
        const nameWrapper = (0, Component_42.default)()
            .style('tag-name')
            .text.set(typeof tag === 'string' ? tag : tag.name)
            .appendTo(component);
        const unuseSupers = component.supers.useManual(() => {
            if (!component.is(Draggable_1.default))
                return;
            unuseSupers();
            component.style.bind(component.dragging, 'tag--dragging');
        });
        return component.extend(component => ({
            tag,
            categoryWrapper,
            nameWrapper,
            addDeleteButton(handler) {
                (0, Button_10.default)()
                    .style('tag-delete-button')
                    .setIcon('xmark')
                    .event.subscribe('click', handler)
                    .appendTo(component);
                return component;
            },
        }));
    }), {
        Category: Component_42.default
            .Builder('button', (component, category) => component.and(Tag, { category: category.name, name: '...', description: { body: category.description } }))
            .setName('TagCategory'),
    });
    exports.default = Tag;
});
define("ui/component/core/ext/Sortable", ["require", "exports", "ui/Component", "ui/component/core/ext/Draggable", "utility/Arrays", "utility/maths/Vector2", "utility/State"], function (require, exports, Component_43, Draggable_2, Arrays_5, Vector2_2, State_33) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SortableDefinition = SortableDefinition;
    Component_43 = __importDefault(Component_43);
    Draggable_2 = __importDefault(Draggable_2);
    Vector2_2 = __importDefault(Vector2_2);
    State_33 = __importDefault(State_33);
    function SortableDefinition(definition) {
        return definition;
    }
    const isSortingAnySortable = (0, State_33.default)(false);
    const Sortable = Object.assign(Component_43.default.Extension((component, definition) => {
        const sorting = (0, State_33.default)(false);
        const sortDelay = (0, State_33.default)(definition.sortDelay ?? 0);
        const stickyDistance = (0, State_33.default)(definition.stickyDistance ?? 0);
        const order = (0, State_33.default)([]);
        let sortingDraggable;
        let slot;
        const draggableDefinition = {
            stickyDistance, delay: sortDelay,
            onMoveStart, onMove, onMoveEnd,
        };
        for (const child of component.getChildren())
            child
                .and(Draggable_2.default, draggableDefinition)
                .style('sortable-item');
        updateOrder();
        component.event.subscribe('childrenInsert', (event, nodes) => {
            for (const node of nodes)
                if (node !== slot?.element)
                    node.component
                        ?.and(Draggable_2.default, draggableDefinition)
                        .style('sortable-item');
            updateOrder();
        });
        const sortable = component.extend(component => ({
            sorting,
            order,
            setSortDelay(delay) {
                sortDelay.value = delay ?? definition.sortDelay ?? 0;
                return component;
            },
            setStickyDistance(distance) {
                stickyDistance.value = distance ?? definition.stickyDistance ?? 0;
                return component;
            },
            cancel: () => {
                reset(false);
                return component;
            },
        }));
        if (definition.onOrderChange)
            order.subscribeManual(definition.onOrderChange);
        return sortable;
        function getDraggables() {
            return [...component.getChildren()]
                .map(child => child.as(Draggable_2.default))
                .filter(Arrays_5.NonNullish);
        }
        function updateOrder() {
            order.value = getDraggables()
                .map(definition.getID)
                .filter(Arrays_5.NonNullish);
        }
        function reset(shouldCommit = true) {
            if (!sorting.value)
                return;
            sorting.value = false;
            isSortingAnySortable.value = false;
            const draggable = sortingDraggable;
            sortingDraggable = undefined;
            draggable?.style.remove('sortable-item-sorting')
                .style.removeProperties('position', 'left', 'top');
            draggable?.stopDragging();
            slot?.remove();
            slot = undefined;
            if (shouldCommit)
                updateOrder();
        }
        function onMoveStart(draggable, position) {
            const id = definition.getID(draggable);
            if (id === undefined) {
                console.warn('Failed to begin sorting, draggable without ID');
                return false;
            }
            draggable.style('sortable-item-sorting')
                .style.setProperty('position', 'fixed')
                .style.setProperty('z-index', 999999999);
            sortingDraggable = draggable;
            isSortingAnySortable.value = true;
            onMove(draggable, Vector2_2.default.ZERO, position);
            sorting.value = true;
        }
        function onMove(draggable, offset, position) {
            const rect = draggable.rect.value;
            draggable.style.setProperty('left', `${position.x - rect.width / 2}px`);
            draggable.style.setProperty('top', `${position.y - rect.height / 2}px`);
            sort(draggable, position);
        }
        function onMoveEnd(draggable, offset, position) {
            draggable.insertTo(sortable, 'after', slot);
            reset();
        }
        function sort(draggable, position) {
            slot ??= (0, Component_43.default)()
                .style('sortable-slot')
                .tweak(slot => {
                const rect = draggable.rect.value;
                slot.style.setProperty('width', `${rect.width}px`);
                slot.style.setProperty('height', `${rect.height}px`);
            });
            const rect = sortable.rect.value;
            const draggables = getDraggables().filter(d => d !== draggable);
            const positionInSortable = Vector2_2.default.subtract(position, rect.position);
            const previousItem = findPreviousItem(draggable, positionInSortable, draggables);
            const toMarkDirty = new Set(slot.getNextSiblings());
            if (!previousItem)
                slot.prependTo(sortable);
            else
                slot.insertTo(sortable, 'after', previousItem);
            for (const sibling of slot.getNextSiblings())
                toMarkDirty.add(sibling);
            for (const sibling of toMarkDirty)
                sibling.rect.markDirty();
        }
        function findPreviousItem(sorting, position, draggables) {
            const { left: thisLeft, top: thisTop } = sortable.rect.value;
            let lastTop;
            for (let i = 0; i < draggables.length; i++) {
                const child = draggables[i];
                if (child === sorting) {
                    continue;
                }
                let { left, top, width, height } = child.rect.value;
                // adjust child position by the position of the host in the document
                left -= thisLeft - width / 2;
                top -= thisTop;
                // if this is the first item
                if (i === (draggables[0] === sorting ? 1 : 0)) {
                    if (position.y < top) {
                        // if we're higher than the first item, sort to the start
                        return undefined;
                    }
                    if (position.x < left && position.y < top + height) {
                        // if we're left of the first item, and we're not below the first item, sort to the start
                        return undefined;
                    }
                }
                // if we're on a different row
                if (lastTop !== undefined && lastTop !== top) {
                    // if the new row's top is past the hovered position's y, sort to the end of the previous row
                    if (position.y < top) {
                        return draggables[i - 1];
                    }
                    // if the position is within this row vertically, but before any item, sort at the start of this row
                    if (position.y >= top && position.y < top + height && position.x < left) {
                        return draggables[i - 1];
                    }
                }
                lastTop = top;
                // if we're hovering inside an item's box
                if (position.x >= left && position.x < left + width && position.y >= top && position.y < top + height) {
                    return child;
                }
            }
            // we weren't inside anything, and we didn't get put at the start, so we must be after everything instead
            return draggables.at(-1);
        }
    }), {
        isSorting: isSortingAnySortable,
    });
    exports.default = Sortable;
});
define("ui/utility/Applicator", ["require", "exports", "utility/State"], function (require, exports, State_34) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    State_34 = __importDefault(State_34);
    function Applicator(host, defaultValueOrApply, apply) {
        const defaultValue = !apply ? undefined : defaultValueOrApply;
        apply ??= defaultValueOrApply;
        let unbind;
        const result = makeApplicator(host);
        return result;
        function makeApplicator(host) {
            return {
                state: (0, State_34.default)(defaultValue),
                set: value => {
                    unbind?.();
                    setInternal(value);
                    return host;
                },
                bind: state => {
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
                rehost: makeApplicator,
            };
        }
        function setInternal(value) {
            if (result.state.value !== value) {
                result.state.value = value;
                apply(value);
            }
        }
    }
    exports.default = Applicator;
});
define("utility/Mouse", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Mouse;
    (function (Mouse) {
        function extractArgs(args) {
            if (typeof args[0] === 'number')
                return args.reverse();
            else
                return args;
        }
        Mouse.asLeft = as.bind(null, 0);
        Mouse.asMiddle = as.bind(null, 1);
        Mouse.asRight = as.bind(null, 2);
        function as(...args) {
            const [event, button] = extractArgs(args);
            if (event.type !== 'click' && event.type !== 'mousedown' && event.type !== 'mouseup')
                return undefined;
            const mouseEvent = event;
            return mouseEvent.button === button ? mouseEvent : undefined;
        }
        Mouse.as = as;
        Mouse.isLeft = is.bind(null, 0);
        Mouse.isMiddle = is.bind(null, 1);
        Mouse.isRight = is.bind(null, 2);
        function is(...args) {
            const [event, button] = extractArgs(args);
            if (event.type !== 'click' && event.type !== 'mousedown' && event.type !== 'mouseup')
                return false;
            const mouseEvent = event;
            return mouseEvent.button === button;
        }
        Mouse.is = is;
        Mouse.handleLeft = handle.bind(null, 0);
        Mouse.handleMiddle = handle.bind(null, 1);
        Mouse.handleRight = handle.bind(null, 2);
        function handle(...args) {
            const [event, button] = extractArgs(args);
            if (!is(event, button))
                return false;
            event.preventDefault();
            return true;
        }
        Mouse.handle = handle;
    })(Mouse || (Mouse = {}));
    exports.default = Mouse;
});
define("ui/component/TagsEditor", ["require", "exports", "lang/en-nz", "model/Tags", "ui/Component", "ui/component/core/Block", "ui/component/core/ext/Input", "ui/component/core/ext/Sortable", "ui/component/core/ProgressWheel", "ui/component/core/Slot", "ui/component/core/TextInput", "ui/component/Tag", "ui/utility/AnchorManipulator", "ui/utility/Applicator", "utility/AbortPromise", "utility/Mouse", "utility/State", "utility/string/Strings"], function (require, exports, en_nz_6, Tags_1, Component_44, Block_8, Input_4, Sortable_1, ProgressWheel_2, Slot_9, TextInput_4, Tag_1, AnchorManipulator_2, Applicator_1, AbortPromise_2, Mouse_4, State_35, Strings_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    en_nz_6 = __importDefault(en_nz_6);
    Tags_1 = __importDefault(Tags_1);
    Component_44 = __importDefault(Component_44);
    Input_4 = __importDefault(Input_4);
    Sortable_1 = __importStar(Sortable_1);
    ProgressWheel_2 = __importDefault(ProgressWheel_2);
    Slot_9 = __importDefault(Slot_9);
    TextInput_4 = __importStar(TextInput_4);
    Tag_1 = __importDefault(Tag_1);
    Applicator_1 = __importDefault(Applicator_1);
    AbortPromise_2 = __importDefault(AbortPromise_2);
    Mouse_4 = __importDefault(Mouse_4);
    State_35 = __importDefault(State_35);
    Strings_2 = __importDefault(Strings_2);
    const TagsEditor = Component_44.default.Builder((component) => {
        const tagsState = (0, State_35.default)({ global_tags: [], custom_tags: [] });
        ////////////////////////////////////
        //#region Current
        const tagsContainer = (0, Slot_9.default)()
            .style('tags-editor-current')
            .use(tagsState, AbortPromise_2.default.asyncFunction(async (signal, slot, tags) => {
            const globalTags = await Tags_1.default.resolve(tags.global_tags);
            if (signal.aborted)
                return;
            if (globalTags.length)
                (0, Component_44.default)()
                    .and(Sortable_1.default, (0, Sortable_1.SortableDefinition)({
                    stickyDistance: 10,
                    getID: component => getTagID(component.as(Tag_1.default)?.tag),
                    onOrderChange: order => tagsState.value.global_tags.splice(0, Infinity, ...order),
                }))
                    .style('tags-editor-current-type', 'tags-editor-current-global')
                    .append(...globalTags.map(tag => (0, Tag_1.default)(tag)
                    .setNavigationDisabled(true)
                    .event.subscribe('auxclick', event => event.preventDefault())
                    .event.subscribe('mouseup', event => Mouse_4.default.handleMiddle(event) && removeTag(tag))
                    .addDeleteButton(() => removeTag(tag))))
                    .appendTo(slot);
            if (tags.custom_tags.length)
                (0, Component_44.default)()
                    .and(Sortable_1.default, (0, Sortable_1.SortableDefinition)({
                    stickyDistance: 10,
                    getID: component => getTagID(component.as(Tag_1.default)?.tag),
                    onOrderChange: order => tagsState.value.custom_tags.splice(0, Infinity, ...order),
                }))
                    .style('tags-editor-current-type', 'tags-editor-current-custom')
                    .append(...tags.custom_tags.map(tag => (0, Tag_1.default)(tag)
                    .setNavigationDisabled(true)
                    .event.subscribe('auxclick', event => event.preventDefault())
                    .event.subscribe('mouseup', event => Mouse_4.default.handleMiddle(event) && removeTag(tag))
                    .addDeleteButton(() => removeTag(tag))))
                    .appendTo(slot);
            const hasTags = !!globalTags.length || !!tags.custom_tags.length;
            tagsContainer.style.toggle(hasTags, 'tags-editor-current');
        }));
        function getTagID(tag) {
            return !tag ? '' : typeof tag === 'string' ? tag : `${tag.category}: ${tag.name}`;
        }
        //#endregion
        ////////////////////////////////////
        const inputWrapper = (0, Component_44.default)()
            .style('text-input', 'tags-editor-input-wrapper')
            .event.subscribe('click', () => input.focus());
        const input = (0, TextInput_4.default)()
            .style('tags-editor-input')
            .style.remove('text-input')
            .placeholder.use('shared/form/tags/placeholder')
            .filter(TagsFilter)
            .appendTo(inputWrapper);
        ////////////////////////////////////
        //#region Suggestions
        const hasOrHadFocus = State_35.default.Some(component, component.hasFocused, component.hadFocusedLast);
        const suggestions = (0, Slot_9.default)()
            .style('tags-editor-suggestions')
            .use(State_35.default.UseManual({
            tags: tagsState,
            filter: input.state,
            focus: hasOrHadFocus,
        }), AbortPromise_2.default.asyncFunction(async (signal, slot, { tags, filter, focus }) => {
            if (!filter && !focus)
                return;
            const manifest = await Tags_1.default.getManifest();
            if (signal.aborted)
                return;
            let [category, name] = Strings_2.default.splitOnce(filter, ':');
            if (name === undefined)
                name = category, category = '';
            category = category.trim(), name = name.trim();
            const categorySuggestions = category ? []
                : Object.values(manifest.categories)
                    .filter(category => category.nameLowercase.startsWith(name))
                    // only include categories that have tags that haven't been added yet
                    .filter(category => Object.entries(manifest.tags)
                    .some(([tagId, tag]) => tag.category === category.name && !tags.global_tags.some(added => tagId === added)))
                    .sort(category => -Object.values(manifest.tags).filter(tag => tag.category === category.name).length, (a, b) => a.name.localeCompare(b.name))
                    .map(category => Tag_1.default.Category(category)
                    .event.subscribe('click', () => input.value = `${category.name}: `));
            if (categorySuggestions.length)
                (0, Component_44.default)()
                    .style('tags-editor-suggestions-type')
                    .append(...categorySuggestions)
                    .appendTo(slot);
            const tagSuggestions = category
                ? Object.entries(manifest.tags)
                    .filter(([, tag]) => tag.categoryLowercase.startsWith(category) && tag.nameLowercase.startsWith(name))
                : name
                    ? Object.entries(manifest.tags)
                        .filter(([, tag]) => tag.wordsLowercase.some(word => word.startsWith(name)))
                    : [];
            tagSuggestions.filterInPlace(([tagId]) => !tags.global_tags.some(added => added === tagId));
            if (tagSuggestions.length)
                (0, Component_44.default)()
                    .style('tags-editor-suggestions-type')
                    .append(...tagSuggestions.map(([, tag]) => (0, Tag_1.default)(tag)
                    .setNavigationDisabled(true)
                    .event.subscribe('click', () => {
                    tags.global_tags.push(`${tag.category}: ${tag.name}`);
                    tagsState.emit();
                    input.value = '';
                })))
                    .appendTo(slot);
            const customTagSuggestions = select(() => {
                if (!name)
                    return [];
                if (!category)
                    return [(0, Tag_1.default)(name)];
                return [(0, Tag_1.default)(`${name} ${category}`), (0, Tag_1.default)(`${category} ${name}`)];
            });
            if (customTagSuggestions.length)
                (0, Component_44.default)()
                    .style('tags-editor-suggestions-type')
                    .append((0, Component_44.default)()
                    .style('tags-editor-suggestions-type-label')
                    .text.use('shared/form/tags/suggestion/add-as-custom'))
                    .append(...customTagSuggestions.map(tag => tag
                    .setNavigationDisabled(true)
                    .event.subscribe('click', () => {
                    tags.custom_tags.push(tag.tag);
                    tagsState.emit();
                    input.value = '';
                })))
                    .appendTo(slot);
            if (slot.size)
                (0, Component_44.default)()
                    .style('tags-editor-suggestions-label')
                    .text.use('shared/form/tags/suggestion/label')
                    .prependTo(slot);
            editor.rect.markDirty();
        }))
            .appendTo(inputWrapper);
        //#endregion
        ////////////////////////////////////
        const hiddenInput = (0, Component_44.default)('input')
            .style('tags-editor-validity-pipe-input')
            .tabIndex('programmatic')
            .attributes.set('type', 'text')
            .setName(`tags-editor-validity-pipe-input-${Math.random().toString(36).slice(2)}`);
        const maxLengthGlobal = (0, State_35.default)(undefined);
        const maxLengthCustom = (0, State_35.default)(undefined);
        const editor = component
            .and(Input_4.default)
            .style('tags-editor')
            .append(tagsContainer)
            .append(inputWrapper)
            .append(hiddenInput)
            .pipeValidity(hiddenInput)
            .extend(editor => ({
            state: tagsState,
            get tags() {
                return tagsState.value;
            },
            default: (0, Applicator_1.default)(editor, value => tagsState.value = {
                global_tags: value?.global_tags?.slice() ?? [],
                custom_tags: value?.custom_tags?.slice() ?? [],
            }),
            maxLengthGlobal, maxLengthCustom,
            lengthGlobal: tagsState.mapManual(tags => tags.global_tags.length),
            lengthCustom: tagsState.mapManual(tags => tags.custom_tags.length),
            setMaxLengthGlobal(maxLength) {
                maxLengthGlobal.value = maxLength;
                return editor;
            },
            setMaxLengthCustom(maxLength) {
                maxLengthCustom.value = maxLength;
                return editor;
            },
        }));
        editor.disableDefaultHintPopoverVisibilityHandling();
        hasOrHadFocus.subscribeManual(focus => editor.getPopover()?.toggle(focus).anchor.apply());
        editor.setCustomHintPopover(popover => popover
            .append(Input_4.default.createHintText(en_nz_6.default['shared/form/tags/hint/main']()), Input_4.default.createHintText(en_nz_6.default['shared/form/tags/hint/global']()), ProgressWheel_2.default.Length(editor.lengthGlobal, editor.maxLengthGlobal), Input_4.default.createHintText(en_nz_6.default['shared/form/tags/hint/custom']()), ProgressWheel_2.default.Length(editor.lengthCustom, editor.maxLengthCustom))
            .anchor.reset()
            .anchor.from(input)
            .anchor.add('off right', `.${Block_8.BlockClasses.Main}`, 'centre', AnchorManipulator_2.AllowYOffscreen));
        tagsState.use(editor, tags => {
            let invalid;
            if (tags.global_tags.length > (editor.maxLengthGlobal.value ?? Infinity))
                invalid = en_nz_6.default['shared/form/invalid/tags/too-many-global']();
            else if (tags.custom_tags.length > (editor.maxLengthCustom.value ?? Infinity))
                invalid = en_nz_6.default['shared/form/invalid/tags/too-many-custom']();
            editor.setCustomInvalidMessage(invalid);
        });
        input.event.subscribe('keydown', event => {
            if (event.key === 'Enter') {
                event.preventDefault();
                suggestions.getFirstDescendant(Tag_1.default)?.element.click();
            }
        });
        return editor;
        function removeTag(tag) {
            const tagString = typeof tag === 'string' ? tag : `${tag.category}: ${tag.name}`;
            if (typeof tag === 'string')
                tagsState.value.custom_tags.filterInPlace(tag => tag !== tagString);
            else
                tagsState.value.global_tags.filterInPlace(tag => tag !== tagString);
            tagsState.emit();
        }
    });
    ////////////////////////////////////
    //#region Input Filter
    const TagsFilter = (0, TextInput_4.FilterFunction)((before, selected, after) => {
        before = filterSegment(before);
        selected = filterSegment(selected);
        after = filterSegment(after);
        if (before.includes(':')) {
            selected = selected.replaceAll(':', ' ');
            after = after.replaceAll(':', ' ');
        }
        else if (selected.includes(':')) {
            after = after.replaceAll(':', ' ');
        }
        const shouldTrimBeforeEnd = true
            && before.endsWith(' ')
            && (false
                || selected.startsWith(' ') || selected.startsWith(':')
                || (!selected && (after.startsWith(' ') || after.startsWith(':'))));
        if (shouldTrimBeforeEnd)
            before = before.trimEnd();
        if (selected.endsWith(' ') && (after.startsWith(' ') || after.startsWith(':')))
            selected = selected.trimEnd();
        before = before.trimStart();
        after = after.trimEnd();
        if (!before)
            selected = selected.trimStart();
        if (!after)
            selected = selected.trimEnd();
        return [before, selected, after];
    });
    function filterSegment(text) {
        return text.toLowerCase()
            .replace(/[^\w/!?&$'.,: -]/g, ' ')
            .replace(/(?<=:.*?):/g, ' ')
            .replace(/ {2,}/g, ' ')
            .replace(' :', ':');
    }
    //#endregion
    ////////////////////////////////////
    exports.default = TagsEditor;
});
define("ui/component/Tags", ["require", "exports", "model/Tags", "ui/Component", "ui/component/core/Slot", "ui/component/Tag", "utility/AbortPromise", "utility/State"], function (require, exports, Tags_2, Component_45, Slot_10, Tag_2, AbortPromise_3, State_36) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Tags_2 = __importDefault(Tags_2);
    Component_45 = __importDefault(Component_45);
    Slot_10 = __importDefault(Slot_10);
    Tag_2 = __importDefault(Tag_2);
    AbortPromise_3 = __importDefault(AbortPromise_3);
    State_36 = __importDefault(State_36);
    const Tags = Component_45.default.Builder((component) => {
        const state = (0, State_36.default)(undefined);
        let definition;
        (0, Slot_10.default)()
            .use(state.map(component, state => state?.global_tags), AbortPromise_3.default.asyncFunction(async (signal, slot, tagStrings) => {
            const tags = await Tags_2.default.resolve(tagStrings);
            return tags?.length && (0, Component_45.default)()
                .style('work-tags', 'work-tags-global')
                .tweak(definition?.initialiseGlobalTags, tags)
                .append(...tags.map(tag => (0, Tag_2.default)(tag)));
        }))
            .appendTo(component);
        (0, Slot_10.default)()
            .use(state.map(component, state => state?.custom_tags), (slot, customTags) => customTags?.length && (0, Component_45.default)()
            .style('work-tags', 'work-tags-custom')
            .tweak(definition?.initialiseCustomTags, customTags)
            .append(...customTags.map(tag => (0, Tag_2.default)(tag))))
            .appendTo(component);
        return component.extend(tags => ({
            set(newState, newDefinition) {
                state.value = newState;
                definition = newDefinition;
                return tags;
            },
        }));
    });
    exports.default = Tags;
});
define("ui/component/Work", ["require", "exports", "lang/en-nz", "model/Follows", "model/FormInputLengths", "model/Session", "model/Works", "ui/Component", "ui/component/core/Block", "ui/component/core/Button", "ui/component/core/Link", "ui/component/core/Slot", "ui/component/core/TextLabel", "ui/component/core/Timestamp", "ui/component/Tags"], function (require, exports, en_nz_7, Follows_2, FormInputLengths_2, Session_9, Works_2, Component_46, Block_9, Button_11, Link_4, Slot_11, TextLabel_1, Timestamp_1, Tags_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    en_nz_7 = __importDefault(en_nz_7);
    Follows_2 = __importDefault(Follows_2);
    FormInputLengths_2 = __importDefault(FormInputLengths_2);
    Session_9 = __importDefault(Session_9);
    Works_2 = __importDefault(Works_2);
    Component_46 = __importDefault(Component_46);
    Block_9 = __importDefault(Block_9);
    Button_11 = __importDefault(Button_11);
    Link_4 = __importDefault(Link_4);
    Slot_11 = __importDefault(Slot_11);
    TextLabel_1 = __importDefault(TextLabel_1);
    Timestamp_1 = __importDefault(Timestamp_1);
    Tags_3 = __importDefault(Tags_3);
    const Work = Component_46.default.Builder((component, work, author, notFullOverride) => {
        author = author ?? work.synopsis?.mentions[0];
        component
            .viewTransition('work')
            .style('work')
            .style.toggle(work.visibility === 'Private' || !work.chapter_count_public, 'work--private');
        const block = component.and(Block_9.default);
        const isFlush = block.type.state.mapManual(types => types.has('flush'));
        block.header.style('work-header');
        block.title
            .style('work-name')
            .text.set(work.name)
            .setResizeRange(32, Math.min(FormInputLengths_2.default.value?.work.name ?? Infinity, 128));
        if (author)
            block.description
                .style('work-author-list')
                .style.bind(isFlush, 'work-author-list--flush')
                .append((0, Link_4.default)(`/author/${author.vanity}`)
                .style('work-author')
                .text.set(author.name));
        block.content.style('work-content');
        (0, Slot_11.default)()
            .use(isFlush, (slot, isFlush) => {
            const actuallyIsFlush = isFlush;
            isFlush ||= notFullOverride ?? false;
            const shouldShowDescription = isFlush || (work.synopsis?.body && work.description);
            if (shouldShowDescription)
                (0, Component_46.default)()
                    .style('work-description')
                    .style.toggle(actuallyIsFlush, 'work-description--flush')
                    .style.toggle(!work.description, 'placeholder')
                    .tweak(component => {
                    if (work.description)
                        component.text.set(work.description);
                    else
                        component.text.use('work/description/empty');
                })
                    .appendTo(slot);
            if (!isFlush)
                (0, Component_46.default)()
                    .style('work-synopsis')
                    .style.toggle(!work.synopsis?.body && !work.description, 'placeholder')
                    .append((0, Slot_11.default)().tweak(slot => {
                    const synopsis = work.synopsis ?? work.description;
                    if (typeof synopsis === 'string')
                        slot.text.set(synopsis);
                    else if (!synopsis.body)
                        slot.text.use('work/description/empty');
                    else
                        slot.setMarkdownContent(synopsis);
                }))
                    .appendTo(slot);
        })
            .appendTo(block.content);
        (0, Tags_3.default)()
            .set(work, {
            initialiseGlobalTags: component => component
                .style.bind(isFlush, 'work-tags--flush'),
            initialiseCustomTags: component => component
                .style.bind(isFlush, 'work-tags--flush'),
        })
            .appendTo(block.content);
        (0, TextLabel_1.default)()
            .tweak(textLabel => textLabel.label.text.use('work/chapters/label'))
            .tweak(textLabel => textLabel.content.text.set(`${work.chapter_count_public}`))
            .appendTo(block.footer.left);
        if (work.visibility === 'Private')
            block.footer.right.append((0, Component_46.default)().style('timestamp', 'work-timestamp').text.use('work/state/private'));
        else if (!work.chapter_count_public)
            block.footer.right.append((0, Component_46.default)().style('timestamp', 'work-timestamp').text.use('work/state/private-no-chapters'));
        else if (work.time_last_update)
            block.footer.right.append((0, Timestamp_1.default)(work.time_last_update).style('work-timestamp'));
        block.setActionsMenu((popover, button) => {
            if (author && author.vanity === Session_9.default.Auth.author.value?.vanity) {
                (0, Button_11.default)()
                    .type('flush')
                    .setIcon('pencil')
                    .text.use('work/action/label/edit')
                    .event.subscribe('click', () => navigate.toURL(`/work/${author.vanity}/${work.vanity}/edit`))
                    .appendTo(popover);
                (0, Button_11.default)()
                    .type('flush')
                    .setIcon('plus')
                    .text.use('work/action/label/new-chapter')
                    .event.subscribe('click', () => navigate.toURL(`/work/${author.vanity}/${work.vanity}/chapter/new`))
                    .appendTo(popover);
                (0, Button_11.default)()
                    .type('flush')
                    .setIcon('trash')
                    .text.use('work/action/label/delete')
                    .event.subscribe('click', () => Works_2.default.delete(work, popover))
                    .appendTo(popover);
            }
            else if (Session_9.default.Auth.loggedIn.value) {
                (0, Button_11.default)()
                    .type('flush')
                    .bindIcon(Follows_2.default.map(popover, () => Follows_2.default.followingWork(work)
                    ? 'circle-check'
                    : 'circle'))
                    .text.bind(Follows_2.default.map(popover, () => Follows_2.default.followingWork(work)
                    ? en_nz_7.default['work/action/label/unfollow']()
                    : en_nz_7.default['work/action/label/follow']()))
                    .event.subscribe('click', () => Follows_2.default.toggleFollowingWork(work))
                    .appendTo(popover);
                (0, Button_11.default)()
                    .type('flush')
                    .bindIcon(Follows_2.default.map(popover, () => Follows_2.default.ignoringWork(work)
                    ? 'ban'
                    : 'circle'))
                    .text.bind(Follows_2.default.map(popover, () => Follows_2.default.ignoringWork(work)
                    ? en_nz_7.default['work/action/label/unignore']()
                    : en_nz_7.default['work/action/label/ignore']()))
                    .event.subscribe('click', () => Follows_2.default.toggleIgnoringWork(work))
                    .appendTo(popover);
            }
        });
        return block.extend(component => ({ work }));
    });
    exports.default = Work;
});
define("ui/view/AuthorView", ["require", "exports", "endpoint/author/EndpointAuthorGet", "endpoint/work/EndpointWorkGetAllAuthor", "model/PagedListData", "model/Session", "ui/Component", "ui/component/Author", "ui/component/core/Button", "ui/component/core/Link", "ui/component/core/Paginator", "ui/component/core/Slot", "ui/component/Work", "ui/view/shared/component/View", "ui/view/shared/component/ViewDefinition"], function (require, exports, EndpointAuthorGet_1, EndpointWorkGetAllAuthor_1, PagedListData_1, Session_10, Component_47, Author_1, Button_12, Link_5, Paginator_1, Slot_12, Work_1, View_2, ViewDefinition_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    EndpointAuthorGet_1 = __importDefault(EndpointAuthorGet_1);
    EndpointWorkGetAllAuthor_1 = __importDefault(EndpointWorkGetAllAuthor_1);
    PagedListData_1 = __importDefault(PagedListData_1);
    Session_10 = __importDefault(Session_10);
    Component_47 = __importDefault(Component_47);
    Author_1 = __importDefault(Author_1);
    Button_12 = __importDefault(Button_12);
    Link_5 = __importDefault(Link_5);
    Paginator_1 = __importDefault(Paginator_1);
    Slot_12 = __importDefault(Slot_12);
    Work_1 = __importDefault(Work_1);
    View_2 = __importDefault(View_2);
    ViewDefinition_2 = __importDefault(ViewDefinition_2);
    exports.default = (0, ViewDefinition_2.default)({
        async load(params) {
            const response = await EndpointAuthorGet_1.default.query({ params });
            if (response instanceof Error)
                throw response;
            const author = response.data;
            return { author };
        },
        create(params, { author }) {
            const view = (0, View_2.default)('author');
            (0, Author_1.default)(author)
                .viewTransition('author-view-author')
                .setContainsHeading()
                .appendTo(view.content);
            const works = PagedListData_1.default.fromEndpoint(25, EndpointWorkGetAllAuthor_1.default.prep({
                params: {
                    author: params.vanity,
                },
            }));
            (0, Paginator_1.default)()
                .viewTransition('author-view-works')
                .tweak(p => p.title.text.use('view/author/works/title'))
                .setActionsMenu(popover => popover
                .append((0, Slot_12.default)()
                .if(Session_10.default.Auth.author.map(popover, author => author?.vanity === params.vanity), () => (0, Button_12.default)()
                .type('flush')
                .setIcon('plus')
                .text.use('view/author/works/action/label/new')
                .event.subscribe('click', () => navigate.toURL('/work/new')))))
                .set(works, (slot, works) => slot.append(...works.map(workData => (0, Link_5.default)(`/work/${author.vanity}/${workData.vanity}`)
                .and(Work_1.default, workData, author)
                .viewTransition(false)
                .type('flush')
                .appendTo(slot))))
                .orElse(slot => (0, Component_47.default)()
                .style('placeholder')
                .text.use('view/author/works/content/empty')
                .appendTo(slot))
                .appendTo(view.content);
            return view;
        },
    });
});
define("endpoint/chapter/EndpointChapterDelete", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_22) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_22 = __importDefault(Endpoint_22);
    exports.default = (0, Endpoint_22.default)('/work/{author}/{work}/chapter/{url}/delete', 'post');
});
define("endpoint/chapter/EndpointChapterGet", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_23) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_23 = __importDefault(Endpoint_23);
    exports.default = (0, Endpoint_23.default)('/work/{author}/{work}/chapter/{url}/get', 'get');
});
define("endpoint/chapter/EndpointChapterGetPaged", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_24) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_24 = __importDefault(Endpoint_24);
    exports.default = (0, Endpoint_24.default)('/work/{author}/{work}/chapters/paged', 'get');
});
define("endpoint/work/EndpointWorkGet", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_25) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_25 = __importDefault(Endpoint_25);
    exports.default = (0, Endpoint_25.default)('/work/{author}/{vanity}/get', 'get');
});
define("model/Chapters", ["require", "exports", "endpoint/chapter/EndpointChapterDelete", "ui/component/core/ConfirmDialog"], function (require, exports, EndpointChapterDelete_1, ConfirmDialog_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    EndpointChapterDelete_1 = __importDefault(EndpointChapterDelete_1);
    ConfirmDialog_3 = __importDefault(ConfirmDialog_3);
    var Chapters;
    (function (Chapters) {
        function resolve(reference, chapters) {
            return !reference ? undefined : chapters.find(chapter => chapter.author === reference.author && chapter.work === reference.work && chapter.url === reference.url);
        }
        Chapters.resolve = resolve;
        function work(reference) {
            return !reference ? undefined : { author: reference.author, vanity: reference.work };
        }
        Chapters.work = work;
        function reference(reference) {
            return !reference ? undefined : { author: reference.author, work: reference.work, url: reference.url };
        }
        Chapters.reference = reference;
    })(Chapters || (Chapters = {}));
    exports.default = Object.assign(Chapters, {
        async delete(chapter, owner) {
            if (!chapter)
                return true;
            const result = await ConfirmDialog_3.default.prompt(owner ?? null, { dangerToken: 'delete-chapter' });
            if (!result)
                return false;
            const response = await EndpointChapterDelete_1.default.query({ params: chapter });
            if (toast.handleError(response))
                return false;
            if (navigate.isURL(`/work/${chapter.author}/${chapter.work}/chapter/${chapter.url}/**`))
                void navigate.toURL(`/work/${chapter.author}/${chapter.work}`);
            return true;
        },
    });
});
define("ui/component/core/InfoDialog", ["require", "exports", "ui/Component", "ui/component/core/BlockDialog", "ui/component/core/Button", "ui/utility/StringApplicator", "utility/State"], function (require, exports, Component_48, BlockDialog_2, Button_13, StringApplicator_5, State_37) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Component_48 = __importDefault(Component_48);
    BlockDialog_2 = __importDefault(BlockDialog_2);
    Button_13 = __importDefault(Button_13);
    State_37 = __importDefault(State_37);
    const InfoDialog = Object.assign(Component_48.default.Builder((component, definition) => {
        const dialog = component.and(BlockDialog_2.default);
        const state = (0, State_37.default)(undefined);
        dialog.title.text.use(definition?.titleTranslation);
        if (definition?.bodyTranslation)
            (0, Component_48.default)()
                .setMarkdownContent({ body: StringApplicator_5.QuiltHelper.toString(definition.bodyTranslation) })
                .appendTo(dialog.content);
        const continueButton = (0, Button_13.default)()
            .type('primary')
            .text.use(definition?.continueButtonTranslation ?? 'shared/action/continue')
            .appendTo(dialog.footer.right);
        return dialog
            .extend(dialog => ({
            state,
            continueButton,
            await(owner) {
                state.value = undefined;
                dialog.open();
                return new Promise(resolve => owner
                    ? dialog.state.await(owner, [true, false], resolve)
                    : dialog.state.awaitManual([true, false], resolve));
            },
            continue() {
                state.value = true;
                dialog.close();
            },
        }))
            .onRooted(dialog => {
            dialog.continueButton.event.subscribe('click', dialog.continue);
        });
    }), {
        prompt: async (owner, definition) => InfoDialog(definition)
            .appendTo(document.body)
            .event.subscribe('close', event => event.host.event.subscribe('transitionend', event => event.host.remove()))
            .await(owner),
    });
    exports.default = InfoDialog;
});
define("endpoint/chapter/EndpointChapterCreate", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_26) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_26 = __importDefault(Endpoint_26);
    exports.default = (0, Endpoint_26.default)('/work/{author}/{vanity}/chapter/create', 'post');
});
define("endpoint/chapter/EndpointChapterUpdate", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_27) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_27 = __importDefault(Endpoint_27);
    exports.default = (0, Endpoint_27.default)('/work/{author}/{work}/chapter/{url}/update', 'post');
});
define("ui/component/core/RadioRow", ["require", "exports", "ui/Component", "ui/component/core/ext/Input", "ui/component/core/RadioButton", "ui/utility/Applicator", "utility/State"], function (require, exports, Component_49, Input_5, RadioButton_2, Applicator_2, State_38) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Component_49 = __importDefault(Component_49);
    Input_5 = __importDefault(Input_5);
    RadioButton_2 = __importDefault(RadioButton_2);
    Applicator_2 = __importDefault(Applicator_2);
    State_38 = __importDefault(State_38);
    const RadioRow = Component_49.default.Builder((component) => {
        const selection = (0, State_38.default)(undefined);
        const options = {};
        const row = component.and(Input_5.default)
            .style('radio-row')
            .ariaRole('group')
            .extend(row => ({
            selection,
            default: (0, Applicator_2.default)(row, (id) => selection.value = id),
            add(id, initialiser) {
                const button = options[id] = (0, RadioButton_2.default)()
                    .style('radio-row-option')
                    .type('flush')
                    .tweak(initialiser, id)
                    .setId(id)
                    .use(selection.map(row, selected => selected === id))
                    .receiveFocusedClickEvents()
                    .event.subscribe('click', event => {
                    selection.value = id;
                    event.preventDefault();
                    event.stopImmediatePropagation();
                })
                    .appendTo(row);
                button.style.bind(button.checked, 'radio-row-option--selected');
                button.bindDisabled(button.checked, 'selection');
                return row;
            },
        }))
            .extend(row => ({
            setLabel(label) {
                for (const option of Object.values(options))
                    option.setName(label?.for);
                label?.setInput(row);
                return row;
            },
        }));
        return row;
    });
    exports.default = RadioRow;
});
define("ui/view/chapter/ChapterEditForm", ["require", "exports", "endpoint/chapter/EndpointChapterCreate", "endpoint/chapter/EndpointChapterUpdate", "lang/en-nz", "model/FormInputLengths", "model/Session", "ui/Component", "ui/component/core/Block", "ui/component/core/Form", "ui/component/core/LabelledTable", "ui/component/core/RadioRow", "ui/component/core/TextEditor", "ui/component/core/TextInput", "ui/component/core/toast/Toast", "ui/component/TagsEditor", "utility/Objects"], function (require, exports, EndpointChapterCreate_1, EndpointChapterUpdate_1, en_nz_8, FormInputLengths_3, Session_11, Component_50, Block_10, Form_2, LabelledTable_2, RadioRow_1, TextEditor_2, TextInput_5, Toast_3, TagsEditor_1, Objects_7) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    EndpointChapterCreate_1 = __importDefault(EndpointChapterCreate_1);
    EndpointChapterUpdate_1 = __importDefault(EndpointChapterUpdate_1);
    en_nz_8 = __importDefault(en_nz_8);
    FormInputLengths_3 = __importDefault(FormInputLengths_3);
    Session_11 = __importDefault(Session_11);
    Component_50 = __importDefault(Component_50);
    Block_10 = __importDefault(Block_10);
    Form_2 = __importDefault(Form_2);
    LabelledTable_2 = __importDefault(LabelledTable_2);
    RadioRow_1 = __importDefault(RadioRow_1);
    TextEditor_2 = __importDefault(TextEditor_2);
    TextInput_5 = __importDefault(TextInput_5);
    TagsEditor_1 = __importDefault(TagsEditor_1);
    Objects_7 = __importDefault(Objects_7);
    exports.default = Component_50.default.Builder((component, state, workParams) => {
        const block = component.and(Block_10.default);
        const form = block.and(Form_2.default, block.title);
        form.viewTransition('chapter-edit-form');
        const type = state.value ? 'update' : 'create';
        form.title.text.use(`view/chapter-edit/${type}/title`);
        form.setName(en_nz_8.default[`view/chapter-edit/${type}/title`]().toString());
        // if (params.type === "create")
        // 	form.description.text.use("view/work-edit/create/description")
        form.submit.textWrapper.text.use(`view/chapter-edit/${type}/submit`);
        const table = (0, LabelledTable_2.default)().appendTo(form.content);
        const nameInput = (0, TextInput_5.default)()
            .setRequired()
            .default.bind(state.map(component, work => work?.name))
            .hint.use('view/chapter-edit/shared/form/name/hint')
            .setMaxLength(FormInputLengths_3.default.value?.chapter.name);
        table.label(label => label.text.use('view/chapter-edit/shared/form/name/label'))
            .content((content, label) => content.append(nameInput.setLabel(label)));
        const tagsEditor = (0, TagsEditor_1.default)()
            .default.bind(state)
            .setMaxLengthGlobal(FormInputLengths_3.default.value?.work_tags.global)
            .setMaxLengthCustom(FormInputLengths_3.default.value?.work_tags.custom);
        table.label(label => label.text.use('view/chapter-edit/shared/form/tags/label'))
            .content((content, label) => content.append(tagsEditor.setLabel(label)));
        const notesBeforeInput = (0, TextEditor_2.default)()
            .default.bind(state.map(component, chapter => chapter?.notes_before ?? undefined))
            .hint.use('view/chapter-edit/shared/form/notes/hint')
            .setMaxLength(FormInputLengths_3.default.value?.chapter.notes)
            .setMinimalByDefault();
        table.label(label => label.text.use('view/chapter-edit/shared/form/notes/label'))
            .content((content, label) => content.append(notesBeforeInput.setLabel(label)));
        const bodyInput = (0, TextEditor_2.default)()
            .default.bind(state.map(component, chapter => chapter?.body ?? undefined))
            .hint.use('view/chapter-edit/shared/form/body/hint');
        table.label(label => label.text.use('view/chapter-edit/shared/form/body/label'))
            .content((content, label) => content.append(bodyInput.setLabel(label)));
        const notesAfterInput = (0, TextEditor_2.default)()
            .default.bind(state.map(component, chapter => chapter?.notes_after ?? undefined))
            .hint.use('view/chapter-edit/shared/form/notes/hint')
            .setMaxLength(FormInputLengths_3.default.value?.chapter.notes)
            .setMinimalByDefault();
        table.label(label => label.text.use('view/chapter-edit/shared/form/notes/label'))
            .content((content, label) => content.append(notesAfterInput.setLabel(label)));
        const VisibilityRadioInitialiser = (radio, id) => radio
            .text.use(`view/chapter-edit/shared/form/visibility/${id.toLowerCase()}`);
        const visibility = (0, RadioRow_1.default)()
            .hint.use('view/work-edit/shared/form/visibility/hint')
            .add('Public', VisibilityRadioInitialiser)
            .add('Patreon', (radio, id) => radio.tweak(VisibilityRadioInitialiser, id).style('radio-row-option--hidden'))
            .add('Private', VisibilityRadioInitialiser)
            .default.bind(state.map(component, chapter => chapter?.visibility ?? 'Private'));
        table.label(label => label.text.use('view/work-edit/shared/form/visibility/label'))
            .content((content, label) => content.append(visibility.setLabel(label)));
        form.event.subscribe('submit', async (event) => {
            event.preventDefault();
            await save();
        });
        return form.extend(component => ({
            hasUnsavedChanges,
            save,
        }));
        function getFormData() {
            return {
                name: nameInput.value,
                ...tagsEditor.state.value,
                body: bodyInput.useMarkdown(),
                notes_before: notesBeforeInput.useMarkdown(),
                notes_after: notesAfterInput.useMarkdown(),
                visibility: visibility.selection.value ?? 'Private',
            };
        }
        function hasUnsavedChanges() {
            if (!state.value)
                return true;
            const data = getFormData();
            const basicFields = Objects_7.default.keys(getFormData()).filter(key => key !== 'custom_tags' && key !== 'global_tags');
            for (const field of basicFields) {
                let dataValue = data[field];
                let stateValue = state.value[field];
                if (dataValue === '')
                    stateValue ??= '';
                if (stateValue === '')
                    dataValue ??= '';
                if (dataValue !== stateValue)
                    return true;
            }
            if ((data.custom_tags?.length ?? 0) !== (state.value.custom_tags?.length ?? 0))
                return true;
            if (data.custom_tags?.some(tag => !state.value?.custom_tags?.includes(tag)))
                return true;
            if ((data.global_tags?.length ?? 0) !== (state.value.global_tags?.length ?? 0))
                return true;
            if (data.global_tags?.some(tag => !state.value?.global_tags?.includes(tag)))
                return true;
            return false;
        }
        async function save() {
            const response = await (() => {
                switch (type) {
                    case 'create':
                        return EndpointChapterCreate_1.default.query({
                            params: workParams,
                            body: getFormData(),
                        });
                    case 'update': {
                        if (!state.value)
                            return;
                        const authorVanity = Session_11.default.Auth.author.value?.vanity;
                        if (!authorVanity)
                            return new Error('Cannot update a work when not signed in');
                        return EndpointChapterUpdate_1.default.query({
                            params: {
                                author: workParams.author,
                                work: workParams.vanity,
                                url: state.value.url,
                            },
                            body: getFormData(),
                        });
                    }
                }
            })();
            if (toast.handleError(response, 'view/chapter-edit/shared/toast/failed-to-save'))
                return;
            toast.success(Toast_3.TOAST_SUCCESS, 'view/chapter-edit/shared/toast/saved');
            state.value = response?.data;
        }
    });
});
define("ui/view/shared/component/PaginatedView", ["require", "exports", "ui/Component", "ui/component/core/Paginator", "ui/view/shared/component/View"], function (require, exports, Component_51, Paginator_2, View_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Component_51 = __importDefault(Component_51);
    Paginator_2 = __importDefault(Paginator_2);
    View_3 = __importDefault(View_3);
    const PaginatedView = Component_51.default.Builder((_, id) => {
        let paginator;
        const urls = [];
        return (0, View_3.default)(id)
            .extend(view => ({
            setURL,
            paginator: () => {
                paginator ??= (0, Paginator_2.default)().extend(paginator => ({ setURL }));
                paginator.page.subscribeManual(page => {
                    const route = urls[page];
                    if (route)
                        navigate.setURL(route);
                });
                return paginator;
            },
        }));
        function setURL(route) {
            navigate.setURL(route);
            const page = paginator?.page.value;
            if (page !== undefined)
                urls[page] = route;
        }
    });
    exports.default = PaginatedView;
});
define("ui/view/ChapterEditView", ["require", "exports", "endpoint/chapter/EndpointChapterDelete", "endpoint/chapter/EndpointChapterGet", "endpoint/chapter/EndpointChapterGetPaged", "endpoint/work/EndpointWorkGet", "model/Chapters", "model/PagedData", "ui/Component", "ui/component/core/Button", "ui/component/core/InfoDialog", "ui/component/core/Link", "ui/component/Work", "ui/view/chapter/ChapterEditForm", "ui/view/shared/component/PaginatedView", "ui/view/shared/component/ViewDefinition", "utility/State", "utility/Type"], function (require, exports, EndpointChapterDelete_2, EndpointChapterGet_1, EndpointChapterGetPaged_1, EndpointWorkGet_1, Chapters_1, PagedData_2, Component_52, Button_14, InfoDialog_1, Link_6, Work_2, ChapterEditForm_1, PaginatedView_1, ViewDefinition_3, State_39, Type_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    EndpointChapterDelete_2 = __importDefault(EndpointChapterDelete_2);
    EndpointChapterGet_1 = __importDefault(EndpointChapterGet_1);
    EndpointChapterGetPaged_1 = __importDefault(EndpointChapterGetPaged_1);
    EndpointWorkGet_1 = __importDefault(EndpointWorkGet_1);
    Chapters_1 = __importDefault(Chapters_1);
    PagedData_2 = __importDefault(PagedData_2);
    Component_52 = __importDefault(Component_52);
    Button_14 = __importDefault(Button_14);
    InfoDialog_1 = __importDefault(InfoDialog_1);
    Link_6 = __importDefault(Link_6);
    Work_2 = __importDefault(Work_2);
    ChapterEditForm_1 = __importDefault(ChapterEditForm_1);
    PaginatedView_1 = __importDefault(PaginatedView_1);
    ViewDefinition_3 = __importDefault(ViewDefinition_3);
    State_39 = __importDefault(State_39);
    Type_1 = __importDefault(Type_1);
    const NEW_CHAPTER = Symbol('NEW_CHAPTER');
    exports.default = (0, ViewDefinition_3.default)({
        requiresLogin: true,
        async load(params) {
            const initialChapterResponse = !params.url ? undefined : await EndpointChapterGet_1.default.query({ params: params });
            if (initialChapterResponse instanceof Error)
                throw initialChapterResponse;
            const workResponse = await EndpointWorkGet_1.default.query({ params: Chapters_1.default.work(params) });
            if (workResponse instanceof Error)
                throw workResponse;
            const owner = (0, Component_52.default)();
            if (!params.url)
                await InfoDialog_1.default.prompt(owner, {
                    titleTranslation: 'shared/prompt/beta-restrictions/title',
                    bodyTranslation: 'shared/prompt/beta-restrictions/description',
                });
            owner.remove();
            return { initialChapterResponse, work: workResponse.data };
        },
        create(params, { initialChapterResponse, work }) {
            const id = 'chapter-edit';
            const view = (0, PaginatedView_1.default)(id);
            const author = work.synopsis?.mentions.find(author => author.vanity === params.author);
            delete work.synopsis;
            delete work.custom_tags;
            (0, Link_6.default)(`/work/${author?.vanity}/${work.vanity}`)
                .and(Work_2.default, work, author)
                .viewTransition('chapter-view-work')
                .style('view-type-chapter-work')
                .setContainsHeading()
                .appendTo(view.content);
            const chapterCount = (0, State_39.default)((Type_1.default.as('number', initialChapterResponse?.page_count) ?? work.chapter_count ?? 0) + 1);
            const chapters = PagedData_2.default.fromEndpoint(EndpointChapterGetPaged_1.default.prep({ params }), page => page === chapterCount.value - 1 ? NEW_CHAPTER : null);
            if (initialChapterResponse)
                chapters.set(initialChapterResponse.page, initialChapterResponse.data, !initialChapterResponse.has_more);
            chapters.pageCount.use(view, count => {
                if (count !== undefined)
                    chapters.setPageCount(true);
            });
            const paginator = view.paginator()
                .type('flush')
                .setScroll((target, direction, context) => {
                if (!context.previousScrollRect)
                    return;
                const scrollHeight = context.scrollRect.height;
                const previousScrollHeight = context.previousScrollRect.height;
                const scrollY = Math.max(context.scrollRect.top, context.previousScrollRect.top);
                window.scrollTo({ top: scrollY + (scrollHeight - previousScrollHeight), behavior: 'instant' });
            })
                .tweak(p => p.page.value = initialChapterResponse?.page ?? chapterCount.value - 1)
                .set(chapters, (slot, pageData, page, source, paginator) => {
                paginator.setURL(pageData === NEW_CHAPTER
                    ? `/work/${params.author}/${params.work}/chapter/new`
                    : `/work/${params.author}/${params.work}/chapter/${pageData.url}/edit`);
                const state = (0, State_39.default)(pageData === NEW_CHAPTER ? undefined : pageData);
                state.subscribe(slot, chapter => {
                    source.set(page, chapter ?? NEW_CHAPTER);
                    if (chapter && page === chapterCount.value - 1)
                        chapterCount.value++;
                });
                const form = (0, ChapterEditForm_1.default)(state, Chapters_1.default.work(params))
                    .subviewTransition(id)
                    .appendTo(slot);
                paginator.page.use(slot, (newPage, oldPage) => {
                    if (pageData !== NEW_CHAPTER && oldPage === page && newPage !== oldPage && form.hasUnsavedChanges())
                        void form.save();
                });
                if (state.value)
                    (0, Button_14.default)()
                        .setIcon('trash')
                        .text.use('view/chapter-edit/update/action/delete')
                        .event.subscribe('click', async () => {
                        const chapter = state.value;
                        if (!chapter)
                            return;
                        const response = await EndpointChapterDelete_2.default.query({ params: chapter });
                        if (toast.handleError(response))
                            return;
                        chapters.delete(page);
                        chapters.unset(page, chapterCount.value);
                        chapterCount.value--;
                        if (page >= chapterCount.value - 2)
                            await navigate.toURL(`/work/${chapter.author}/${chapter.work}`);
                        else
                            paginator.page.emit(page - 1);
                    })
                        .appendTo(form.footer.left);
            })
                .appendTo(view.content);
            (0, Button_14.default)()
                .setIcon('angles-right')
                .type('icon')
                .style('paginator-button')
                .event.subscribe('click', () => paginator.page.value = chapterCount.value - 1)
                .appendTo(paginator.footer.right);
            paginator.data.use(view, chapter => view.breadcrumbs.setBackButton(chapter === NEW_CHAPTER
                ? `/work/${params.author}/${params.work}`
                : `/work/${params.author}/${params.work}/chapter/${chapter.url}`, button => button.subText.set(chapter === NEW_CHAPTER
                ? work.name
                : chapter?.name)));
            // const state = State<Chapter | undefined>(chapter)
            // const stateInternal = State<Chapter | undefined>(chapter)
            // stateInternal.subscribe(view, chapter =>
            // 	ViewTransition.perform('subview', id, () => state.value = chapter))
            return view;
        },
    });
});
define("endpoint/history/EndpointHistoryAddChapter", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_28) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_28 = __importDefault(Endpoint_28);
    exports.default = (0, Endpoint_28.default)('/history/add/{author}/{work}/chapter/{url}', 'post');
});
define("endpoint/reaction/EndpointReactChapter", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_29) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_29 = __importDefault(Endpoint_29);
    exports.default = (0, Endpoint_29.default)('/work/{author}/{work}/chapter/{url}/react/{type}', 'post');
});
define("endpoint/reaction/EndpointUnreactChapter", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_30) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_30 = __importDefault(Endpoint_30);
    exports.default = (0, Endpoint_30.default)('/work/{author}/{work}/chapter/{url}/unreact', 'post');
});
define("model/TextBody", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var TextBody;
    (function (TextBody) {
        function resolve(body, authors) {
            return body === null || body === undefined ? undefined : {
                body: typeof body === 'string' ? body : body.body,
                mentions: [
                    ...(typeof body === 'string' ? undefined : body.mentions) ?? [],
                    ...authors ?? [],
                ].distinct(author => author.vanity),
            };
        }
        TextBody.resolve = resolve;
    })(TextBody || (TextBody = {}));
    exports.default = TextBody;
});
define("ui/component/Chapter", ["require", "exports", "model/Chapters", "model/Session", "ui/Component", "ui/component/core/Button", "ui/component/core/ext/CanHasActionsMenu", "ui/component/core/Link", "ui/component/core/Timestamp", "utility/maths/Maths", "utility/State"], function (require, exports, Chapters_2, Session_12, Component_53, Button_15, CanHasActionsMenu_2, Link_7, Timestamp_2, Maths_2, State_40) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Chapters_2 = __importDefault(Chapters_2);
    Session_12 = __importDefault(Session_12);
    Component_53 = __importDefault(Component_53);
    Button_15 = __importDefault(Button_15);
    CanHasActionsMenu_2 = __importDefault(CanHasActionsMenu_2);
    Link_7 = __importDefault(Link_7);
    Timestamp_2 = __importDefault(Timestamp_2);
    Maths_2 = __importDefault(Maths_2);
    State_40 = __importDefault(State_40);
    function initActions(actions, chapter, work, author) {
        return actions
            .appendAction('edit', Session_12.default.Auth.author, (slot, self) => true
            && author
            && author.vanity === self?.vanity
            && (0, Button_15.default)()
                .type('flush')
                .setIcon('pencil')
                .text.use('chapter/action/label/edit')
                .event.subscribe('click', () => navigate.toURL(`/work/${author.vanity}/${work.vanity}/chapter/${State_40.default.value(chapter).url}/edit`)))
            .appendAction('delete', Session_12.default.Auth.author, (slot, self) => true
            && author
            && author.vanity === self?.vanity
            && (0, Button_15.default)()
                .type('flush')
                .setIcon('trash')
                .text.use('chapter/action/label/delete')
                .event.subscribe('click', () => Chapters_2.default.delete(State_40.default.value(chapter))));
    }
    const Chapter = Object.assign(Component_53.default.Builder((component, chapter, work, author) => {
        component = (0, Link_7.default)(`/work/${author.vanity}/${work.vanity}/chapter/${chapter.url}`)
            .style('chapter')
            .style.toggle(chapter.visibility === 'Private', 'chapter--private');
        const chapterNumber = Maths_2.default.parseIntOrUndefined(chapter.url);
        const number = (0, Component_53.default)()
            .style('chapter-number')
            .text.set(chapterNumber ? `${chapterNumber.toLocaleString()}` : '')
            .appendTo(component);
        const chapterName = (0, Component_53.default)()
            .style('chapter-name')
            .text.set(chapter.name)
            .appendTo(component);
        const right = (0, Component_53.default)()
            .style('chapter-right')
            .appendTo(component);
        let timestamp;
        if (chapter.visibility === 'Private')
            timestamp = (0, Component_53.default)()
                .style('timestamp', 'chapter-timestamp')
                .text.use('chapter/state/private')
                .appendTo(right);
        else
            timestamp = !chapter.time_last_update ? undefined
                : (0, Timestamp_2.default)(chapter.time_last_update)
                    .style('chapter-timestamp')
                    .appendTo(right);
        return component
            .and(CanHasActionsMenu_2.default)
            .setActionsMenuButton(button => button
            .type('inherit-size')
            .style('chapter-actions-menu-button')
            .appendTo(right))
            .setActionsMenu((popover, button) => initActions(popover, chapter, work, author))
            .extend(component => ({
            chapter,
            number,
            chapterName,
            timestamp,
        }));
    }), {
        initActions,
    });
    exports.default = Chapter;
});
define("endpoint/comment/EndpointCommentGetAllUnder", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_31) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_31 = __importDefault(Endpoint_31);
    exports.default = (0, Endpoint_31.default)('/comments/{under}', 'get');
});
define("endpoint/comment/EndpointCommentAdd", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_32) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_32 = __importDefault(Endpoint_32);
    exports.default = (0, Endpoint_32.default)('/comment/add/{under}', 'post');
});
define("endpoint/comment/EndpointCommentDelete", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_33) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_33 = __importDefault(Endpoint_33);
    exports.default = (0, Endpoint_33.default)('/comment/{id}/delete', 'post');
});
define("endpoint/comment/EndpointCommentUpdate", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_34) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_34 = __importDefault(Endpoint_34);
    exports.default = (0, Endpoint_34.default)('/comment/{id}/update', 'post');
});
define("endpoint/reaction/EndpointReactComment", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_35) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_35 = __importDefault(Endpoint_35);
    exports.default = (0, Endpoint_35.default)('/comment/{comment_id}/react/{type}', 'post');
});
define("endpoint/reaction/EndpointUnreactComment", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_36) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_36 = __importDefault(Endpoint_36);
    exports.default = (0, Endpoint_36.default)('/comment/{comment_id}/unreact', 'post');
});
define("ui/component/Reaction", ["require", "exports", "ui/Component", "ui/component/core/Button", "utility/State"], function (require, exports, Component_54, Button_16, State_41) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Component_54 = __importDefault(Component_54);
    Button_16 = __importDefault(Button_16);
    State_41 = __importDefault(State_41);
    const REACTION_MAP = {
        love: 'heart',
    };
    const Reaction = Component_54.default.Builder((component, type, reactionsIn = (0, State_41.default)(0), reactedIn = (0, State_41.default)(false)) => {
        const reactions = State_41.default.get(reactionsIn);
        const reacted = State_41.default.get(reactedIn);
        return component
            .style('reaction')
            .append((0, Button_16.default)()
            .setIcon(REACTION_MAP[type])
            .type('icon')
            .style('reaction-button')
            .style.bind(reacted, 'reaction-button--reacted')
            .tweak(button => button.icon
            .style('reaction-button-icon')
            .style.bind(reacted, 'reaction-button-icon--reacted')))
            .append((0, Component_54.default)()
            .style('reaction-count')
            .text.bind(reactions.map(component, reactions => reactions ? `${reactions}` : '')))
            .extend(component => ({
            reactions,
            reacted,
        }));
    });
    exports.default = Reaction;
});
define("ui/component/Comment", ["require", "exports", "endpoint/comment/EndpointCommentAdd", "endpoint/comment/EndpointCommentDelete", "endpoint/comment/EndpointCommentUpdate", "endpoint/reaction/EndpointReactComment", "endpoint/reaction/EndpointUnreactComment", "lang/en-nz", "model/FormInputLengths", "model/Session", "ui/Component", "ui/component/core/ActionRow", "ui/component/core/Button", "ui/component/core/Link", "ui/component/core/Slot", "ui/component/core/TextEditor", "ui/component/core/Timestamp", "ui/component/Reaction"], function (require, exports, EndpointCommentAdd_1, EndpointCommentDelete_1, EndpointCommentUpdate_1, EndpointReactComment_1, EndpointUnreactComment_1, en_nz_9, FormInputLengths_4, Session_13, Component_55, ActionRow_4, Button_17, Link_8, Slot_13, TextEditor_3, Timestamp_3, Reaction_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    EndpointCommentAdd_1 = __importDefault(EndpointCommentAdd_1);
    EndpointCommentDelete_1 = __importDefault(EndpointCommentDelete_1);
    EndpointCommentUpdate_1 = __importDefault(EndpointCommentUpdate_1);
    EndpointReactComment_1 = __importDefault(EndpointReactComment_1);
    EndpointUnreactComment_1 = __importDefault(EndpointUnreactComment_1);
    en_nz_9 = __importDefault(en_nz_9);
    FormInputLengths_4 = __importDefault(FormInputLengths_4);
    Session_13 = __importDefault(Session_13);
    Component_55 = __importDefault(Component_55);
    ActionRow_4 = __importDefault(ActionRow_4);
    Button_17 = __importDefault(Button_17);
    Link_8 = __importDefault(Link_8);
    Slot_13 = __importDefault(Slot_13);
    TextEditor_3 = __importDefault(TextEditor_3);
    Timestamp_3 = __importDefault(Timestamp_3);
    Reaction_1 = __importDefault(Reaction_1);
    const Comment = Component_55.default.Builder((component, source, commentData, meta) => {
        const comment = component.and(Slot_13.default)
            .style('comment')
            .extend(comment => ({}));
        const comments = source.comments.map(comment, comments => comments.filter(comment => comment === commentData || comment.parent_id === commentData.comment_id));
        comment.use(comments, (slot, commentsData) => {
            const isThread = false
                // has siblings & is not a top level comment
                || (!meta?.noSiblings && !!meta?.hasParent)
                // has a parent that is a top level comment
                || !!(meta?.hasParent && !meta.hasGrandparent);
            comment.style.toggle(isThread, 'comment--is-thread');
            const content = (0, Component_55.default)()
                .style('comment-content')
                .style.setProperty('z-index', `${100 - (meta?.depth ?? 0)}`)
                .appendTo(slot);
            if (commentData && !meta?.isRootComment) {
                const header = (0, Component_55.default)('header')
                    .style('comment-header')
                    .style.toggle(!!commentData.edit, 'comment-header--editing')
                    .appendTo(content);
                const author = source.authors.value.find(author => author.vanity === commentData.author);
                (0, Link_8.default)(!author?.vanity ? undefined : `/author/${author.vanity}`)
                    .style('comment-header-author')
                    .text.set(author?.name ?? en_nz_9.default['comment/deleted/author']().toString())
                    .appendTo(header);
                const time = commentData.edited_time ?? commentData.created_time;
                if (time)
                    (0, Timestamp_3.default)(time)
                        .style('comment-header-timestamp')
                        .setTranslation(!commentData.edited_time ? undefined : en_nz_9.default['comment/timestamp/edited'])
                        .appendTo(header);
                if (commentData.edit) {
                    ////////////////////////////////////
                    //#region Text Editor Body
                    const textEditor = (0, TextEditor_3.default)()
                        .default.set(commentData.body?.body ?? '')
                        .setMaxLength(FormInputLengths_4.default.value?.comment.body)
                        .hint.use('comment/hint')
                        .appendTo(content);
                    textEditor.content.use(header, markdown => commentData.body = { body: markdown });
                    const footer = (0, Component_55.default)('footer').and(ActionRow_4.default)
                        .style('comment-footer', 'comment-footer--editing')
                        .appendTo(content);
                    if (commentData.comment_id)
                        (0, Button_17.default)()
                            .style('comment-footer-action')
                            .text.use('comment/action/delete')
                            .event.subscribe('click', async () => {
                            const response = await EndpointCommentDelete_1.default.query({ params: { id: commentData.comment_id } });
                            if (toast.handleError(response))
                                return;
                            source.comments.value.filterInPlace(comment => comment !== commentData);
                            source.comments.emit();
                        })
                            .appendTo(footer.right);
                    (0, Button_17.default)()
                        .style('comment-footer-action')
                        .text.use('comment/action/cancel')
                        .event.subscribe('click', () => {
                        if (commentData.created_time)
                            delete commentData.edit;
                        else
                            source.comments.value.filterInPlace(comment => comment !== commentData);
                        source.comments.emit();
                    })
                        .appendTo(footer.right);
                    (0, Button_17.default)()
                        .style('comment-footer-action')
                        .type('primary')
                        .text.use('comment/action/save')
                        .bindDisabled(textEditor.invalid)
                        .event.subscribe('click', async () => {
                        if (!commentData.parent_id)
                            return;
                        const response = commentData.comment_id
                            ? await EndpointCommentUpdate_1.default.query({
                                params: { id: commentData.comment_id },
                                body: { body: textEditor.useMarkdown() },
                            })
                            : await EndpointCommentAdd_1.default.query({
                                params: { under: commentData.parent_id },
                                body: { body: textEditor.useMarkdown() },
                            });
                        if (toast.handleError(response))
                            return;
                        const newComment = response.data;
                        source.comments.value.filterInPlace(comment => comment !== commentData);
                        source.comments.value.push(newComment);
                        source.comments.emit();
                    })
                        .appendTo(footer.right);
                    //#endregion
                    ////////////////////////////////////
                }
                else {
                    ////////////////////////////////////
                    //#region Real Comment Body
                    (0, Component_55.default)()
                        .style('comment-body')
                        .setMarkdownContent(commentData.body?.body ? commentData.body
                        : en_nz_9.default['comment/deleted/body']().toString())
                        .appendTo(content);
                    (0, Slot_13.default)()
                        .use(Session_13.default.Auth.author, (slot, author) => {
                        if (!author)
                            return;
                        const footer = (0, Component_55.default)('footer')
                            .style('comment-footer')
                            .appendTo(content);
                        (0, Reaction_1.default)('love', commentData.reactions ?? 0, !!commentData.reacted)
                            .event.subscribe('click', async () => {
                            if (commentData.reacted) {
                                const response = await EndpointUnreactComment_1.default.query({ params: { comment_id: commentData.comment_id } });
                                if (toast.handleError(response))
                                    return;
                                delete commentData.reacted;
                                commentData.reactions ??= 0;
                                commentData.reactions--;
                                if (commentData.reactions < 0)
                                    delete commentData.reactions;
                            }
                            else {
                                const response = await EndpointReactComment_1.default.query({ params: { comment_id: commentData.comment_id, type: 'love' } });
                                if (toast.handleError(response))
                                    return;
                                commentData.reacted = true;
                                commentData.reactions ??= 0;
                                commentData.reactions++;
                            }
                            comments.emit();
                        })
                            .appendTo(footer);
                        (0, Button_17.default)()
                            .style('comment-footer-action')
                            .type('flush')
                            .text.use('comment/action/reply')
                            .event.subscribe('click', () => {
                            source.comments.value.unshift({ edit: true, parent_id: commentData.comment_id, author: author.vanity });
                            comments.refresh();
                        })
                            .appendTo(footer);
                        if (commentData.author === author.vanity)
                            (0, Button_17.default)()
                                .style('comment-footer-action')
                                .type('flush')
                                .text.use('comment/action/edit')
                                .event.subscribe('click', () => {
                                commentData.edit = true;
                                comments.refresh();
                            })
                                .appendTo(footer);
                    })
                        .appendTo(slot);
                    //#endregion
                    ////////////////////////////////////
                }
            }
            if (!commentData.comment_id || commentsData.length <= 1)
                return;
            const hasChildren = commentsData.length > 2;
            const shouldBeFlush = false
                || !!meta?.isRootComment
                // this is part of a thread, so flatten it
                || (meta?.noSiblings && !hasChildren)
                // border is handled by child comments rather than being on the wrapper
                || (commentsData.length > 3);
            const childrenWrapper = (0, Component_55.default)()
                .style('comment-children')
                .style.toggle(shouldBeFlush, 'comment-children--flush')
                .appendTo(slot);
            const timeValue = (c) => !c.created_time ? Infinity : new Date(c.created_time).getTime();
            for (const comment of commentsData.sort((a, b) => timeValue(b) - timeValue(a))) {
                if (comment === commentData)
                    continue;
                const noSiblings = commentsData.length <= 2 ? true : undefined;
                Comment(source, comment, { noSiblings, hasParent: !meta?.isRootComment ? true : undefined, hasGrandparent: meta?.hasParent, depth: (meta?.depth ?? 0) + 1 })
                    .appendTo(childrenWrapper);
            }
        });
        return comment;
    });
    exports.default = Comment;
});
define("ui/component/Comments", ["require", "exports", "endpoint/comment/EndpointCommentGetAllUnder", "model/Session", "ui/Component", "ui/component/Comment", "ui/component/core/Block", "ui/component/core/Button", "ui/component/core/Slot", "utility/AbortPromise", "utility/State"], function (require, exports, EndpointCommentGetAllUnder_1, Session_14, Component_56, Comment_1, Block_11, Button_18, Slot_14, AbortPromise_4, State_42) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    EndpointCommentGetAllUnder_1 = __importDefault(EndpointCommentGetAllUnder_1);
    Session_14 = __importDefault(Session_14);
    Component_56 = __importDefault(Component_56);
    Comment_1 = __importDefault(Comment_1);
    Block_11 = __importDefault(Block_11);
    Button_18 = __importDefault(Button_18);
    Slot_14 = __importDefault(Slot_14);
    AbortPromise_4 = __importDefault(AbortPromise_4);
    State_42 = __importDefault(State_42);
    const Comments = Component_56.default.Builder((rawComponent, under, isRootComment) => {
        const block = rawComponent
            .and(Block_11.default)
            .type('flush')
            .style('comment-list')
            .viewTransition('comments')
            .extend(component => ({}));
        (0, Slot_14.default)()
            .use(Session_14.default.Auth.author, AbortPromise_4.default.asyncFunction(async (signal, slot, author) => {
            const comment = { comment_id: under };
            const comments = (0, State_42.default)([comment]);
            const authors = (0, State_42.default)(!author ? [] : [author]);
            if (author)
                comments.use(block, commentsData => {
                    if (!commentsData[0].edit) {
                        commentsData.unshift({ edit: true, parent_id: under, author: author.vanity });
                        comments.emit();
                    }
                });
            const query = (0, State_42.default)(undefined);
            query.value = EndpointCommentGetAllUnder_1.default.prep({ params: { under } }).query;
            (0, Comment_1.default)({ comments, authors }, comment, { isRootComment, noSiblings: true })
                .appendTo(block.content);
            await loadMore();
            if (signal.aborted)
                return;
            (0, Slot_14.default)()
                .if(query.truthy, () => (0, Button_18.default)()
                .event.subscribe('click', loadMore)
                .text.set('load more'))
                .appendTo(slot);
            async function loadMore() {
                if (!query.value)
                    return;
                const result = await query.value?.();
                if (toast.handleError(result))
                    throw result;
                authors.value.push(...result.data.authors);
                authors.emit();
                comments.value.push(...result.data.comments);
                comments.emit();
                query.value = result.next;
            }
        }))
            .appendTo(block.content);
        return block;
    });
    exports.default = Comments;
});
define("ui/view/ChapterView", ["require", "exports", "endpoint/chapter/EndpointChapterGet", "endpoint/chapter/EndpointChapterGetPaged", "endpoint/history/EndpointHistoryAddChapter", "endpoint/reaction/EndpointReactChapter", "endpoint/reaction/EndpointUnreactChapter", "endpoint/work/EndpointWorkGet", "lang/en-nz", "model/Chapters", "model/PagedData", "model/Session", "model/TextBody", "ui/Component", "ui/component/Chapter", "ui/component/Comments", "ui/component/core/Button", "ui/component/core/Link", "ui/component/core/Slot", "ui/component/Reaction", "ui/component/Tags", "ui/component/Work", "ui/view/shared/component/PaginatedView", "ui/view/shared/component/ViewDefinition", "utility/maths/Maths", "utility/State"], function (require, exports, EndpointChapterGet_2, EndpointChapterGetPaged_2, EndpointHistoryAddChapter_1, EndpointReactChapter_1, EndpointUnreactChapter_1, EndpointWorkGet_2, en_nz_10, Chapters_3, PagedData_3, Session_15, TextBody_1, Component_57, Chapter_1, Comments_1, Button_19, Link_9, Slot_15, Reaction_2, Tags_4, Work_3, PaginatedView_2, ViewDefinition_4, Maths_3, State_43) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    EndpointChapterGet_2 = __importDefault(EndpointChapterGet_2);
    EndpointChapterGetPaged_2 = __importDefault(EndpointChapterGetPaged_2);
    EndpointHistoryAddChapter_1 = __importDefault(EndpointHistoryAddChapter_1);
    EndpointReactChapter_1 = __importDefault(EndpointReactChapter_1);
    EndpointUnreactChapter_1 = __importDefault(EndpointUnreactChapter_1);
    EndpointWorkGet_2 = __importDefault(EndpointWorkGet_2);
    en_nz_10 = __importDefault(en_nz_10);
    Chapters_3 = __importDefault(Chapters_3);
    PagedData_3 = __importDefault(PagedData_3);
    Session_15 = __importDefault(Session_15);
    TextBody_1 = __importDefault(TextBody_1);
    Component_57 = __importDefault(Component_57);
    Chapter_1 = __importDefault(Chapter_1);
    Comments_1 = __importDefault(Comments_1);
    Button_19 = __importDefault(Button_19);
    Link_9 = __importDefault(Link_9);
    Slot_15 = __importDefault(Slot_15);
    Reaction_2 = __importDefault(Reaction_2);
    Tags_4 = __importDefault(Tags_4);
    Work_3 = __importDefault(Work_3);
    PaginatedView_2 = __importDefault(PaginatedView_2);
    ViewDefinition_4 = __importDefault(ViewDefinition_4);
    Maths_3 = __importDefault(Maths_3);
    State_43 = __importDefault(State_43);
    exports.default = (0, ViewDefinition_4.default)({
        async load(params) {
            const response = await EndpointWorkGet_2.default.query({ params: Chapters_3.default.work(params) });
            if (response instanceof Error)
                throw response;
            const initialChapterResponse = await EndpointChapterGet_2.default.query({ params });
            if (initialChapterResponse instanceof Error)
                throw initialChapterResponse;
            return { workData: response.data, initialChapterResponse };
        },
        create(params, { workData, initialChapterResponse }) {
            const view = (0, PaginatedView_2.default)('chapter');
            const author = workData.synopsis?.mentions.find(author => author.vanity === params.author);
            delete workData.synopsis;
            delete workData.custom_tags;
            (0, Link_9.default)(`/work/${author?.vanity}/${workData.vanity}`)
                .and(Work_3.default, workData, author)
                .viewTransition('chapter-view-work')
                .style('view-type-chapter-work')
                .setContainsHeading()
                .appendTo(view.content);
            const chapterState = (0, State_43.default)(initialChapterResponse.data);
            const chapters = PagedData_3.default.fromEndpoint(EndpointChapterGetPaged_2.default.prep({ params }));
            chapters.set(initialChapterResponse.page, initialChapterResponse.data, !initialChapterResponse.has_more);
            chapters.setPageCount(initialChapterResponse.page_count);
            const paginator = view.paginator()
                .viewTransition('chapter-view-chapter')
                .style('view-type-chapter-block')
                .type('flush')
                .tweak(p => p.title
                .style('view-type-chapter-block-title')
                .text.bind(chapterState.mapManual(chapter => en_nz_10.default['view/chapter/title'](Maths_3.default.parseIntOrUndefined(chapter.url), chapter.name))))
                .appendTo(view.content)
                .tweak(p => p.page.value = initialChapterResponse.page)
                .set(chapters, (slot, chapter, page, chapters, paginator) => {
                paginator.setURL(`/work/${params.author}/${params.work}/chapter/${chapter.url}`);
                if (Session_15.default.Auth.loggedIn.value)
                    void EndpointHistoryAddChapter_1.default.query({ params: chapter });
                if (chapter.notes_before || chapter.global_tags?.length || chapter.custom_tags?.length)
                    (0, Component_57.default)()
                        .style('view-type-chapter-block-notes', 'view-type-chapter-block-notes-before')
                        .setMarkdownContent(TextBody_1.default.resolve(chapter.notes_before, chapter.mentions))
                        .prepend(chapter.notes_before && (0, Component_57.default)()
                        .style('view-type-chapter-block-notes-label')
                        .text.use('chapter/notes/label'))
                        .append((chapter.global_tags?.length || chapter.custom_tags?.length) && (0, Component_57.default)()
                        .style('view-type-chapter-block-notes-label', 'view-type-chapter-block-tags-title')
                        .text.use('chapter/tags/label'))
                        .append((0, Tags_4.default)()
                        .set(chapter)
                        .style('view-type-chapter-block-tags'))
                        .appendTo(slot);
                (0, Component_57.default)()
                    .style('view-type-chapter-block-body')
                    .setMarkdownContent(chapter.body ?? '')
                    .appendTo(slot);
                if (chapter.notes_after)
                    (0, Component_57.default)()
                        .style('view-type-chapter-block-notes', 'view-type-chapter-block-notes-after')
                        .setMarkdownContent(TextBody_1.default.resolve(chapter.notes_after, chapter.mentions))
                        .prepend(chapter.notes_after && (0, Component_57.default)()
                        .style('view-type-chapter-block-notes-label')
                        .text.use('chapter/notes/label'))
                        .appendTo(slot);
            });
            paginator.header.style('view-type-chapter-block-header');
            paginator.content.style('view-type-chapter-block-content');
            paginator.footer.style('view-type-chapter-block-paginator-actions');
            paginator.setActionsMenu(popover => Chapter_1.default.initActions(popover, chapterState, workData, author));
            (0, Link_9.default)(`/work/${params.author}/${params.work}`)
                .and(Button_19.default)
                .type('flush')
                .text.use('chapter/action/index')
                .appendTo(paginator.footer.middle);
            const reactions = chapterState.mapManual(chapter => chapter.reactions ?? 0);
            const reacted = chapterState.mapManual(chapter => !!chapter.reacted);
            (0, Reaction_2.default)('love', reactions, reacted)
                .event.subscribe('click', async () => {
                if (!author?.vanity)
                    return;
                const params = { ...Chapters_3.default.reference(chapterState.value), type: 'love' };
                if (reacted.value) {
                    const response = await EndpointUnreactChapter_1.default.query({ params });
                    if (toast.handleError(response))
                        return;
                    delete chapterState.value.reacted;
                    if (chapterState.value.reactions)
                        chapterState.value.reactions--;
                    chapterState.emit();
                }
                else {
                    const response = await EndpointReactChapter_1.default.query({ params });
                    if (toast.handleError(response))
                        return;
                    chapterState.value.reacted = true;
                    chapterState.value.reactions ??= 0;
                    chapterState.value.reactions++;
                    chapterState.emit();
                }
            })
                .appendTo(paginator.footer.middle);
            paginator.data.use(paginator, chapter => chapterState.value = chapter);
            (0, Slot_15.default)()
                .use(paginator.data, (slot, chapter) => {
                if (!chapter.root_comment)
                    return;
                return (0, Comments_1.default)(chapter.root_comment, true);
            })
                .appendTo(view.content);
            return view;
        },
    });
});
define("ui/view/debug/ButtonRegistry", ["require", "exports", "model/Session", "utility/Env"], function (require, exports, Session_16, Env_7) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BUTTON_REGISTRY = void 0;
    Session_16 = __importDefault(Session_16);
    Env_7 = __importDefault(Env_7);
    exports.BUTTON_REGISTRY = {
        createAuthor: {
            name: 'Create Author',
            async execute(name, vanity, description, pronouns) {
                const response = await fetch(`${Env_7.default.API_ORIGIN}author/create`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify({
                        name: name,
                        vanity: vanity,
                        description: description,
                        pronouns: pronouns,
                    }),
                }).then(response => response.json());
                console.log(response);
                await Session_16.default.refresh();
            },
        },
        updateAuthor: {
            name: 'Update Author',
            async execute(name, description, vanity, support_link, support_message) {
                await fetch(`${Env_7.default.API_ORIGIN}author/update`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
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
            name: 'Delete Author',
            async execute() {
                await fetch(`${Env_7.default.API_ORIGIN}author/delete`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
            },
        },
        viewAuthor: {
            name: 'View Author',
            async execute(label, vanity) {
                const response = await fetch(`${Env_7.default.API_ORIGIN}author/${vanity}/get`, {
                    credentials: 'include',
                }).then(response => response.json());
                console.log(label, response);
            },
        },
        clearSession: {
            name: 'Clear Session',
            async execute() {
                await fetch(`${Env_7.default.API_ORIGIN}session/reset`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                });
                await Session_16.default.refresh();
            },
        },
        createWork: {
            name: 'Create Work',
            async execute(name, synopsis, description, vanity, status, visibility, globalTags, customTags) {
                const response = await fetch(`${Env_7.default.API_ORIGIN}work/create`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: name,
                        synopsis: synopsis,
                        description: description,
                        vanity: vanity,
                        status: status,
                        visibility: visibility,
                        global_tags: globalTags,
                        custom_tags: customTags,
                    }),
                }).then(response => response.json());
                console.log(response);
            },
        },
        updateWork: {
            name: 'Update Work',
            async execute(author, url, name, description, vanity, status, visibility) {
                await fetch(`${Env_7.default.API_ORIGIN}work/${author}/${url}/update`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
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
            name: 'Delete Work',
            async execute(author, url) {
                await fetch(`${Env_7.default.API_ORIGIN}work/${author}/${url}/delete`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
            },
        },
        viewWork: {
            name: 'View Work',
            async execute(label, author, url) {
                const response = await fetch(`${Env_7.default.API_ORIGIN}work/${author}/${url}/get`, {
                    credentials: 'include',
                }).then(response => response.json());
                console.log(label, response);
            },
        },
        getAllWorksByAuthor: {
            name: 'View All Works By Author',
            async execute(label, author) {
                const response = await fetch(`${Env_7.default.API_ORIGIN}works/${author}`, {
                    credentials: 'include',
                }).then(response => response.json());
                console.log(label, response);
            },
        },
        createChapter: {
            name: 'Create Chapter',
            async execute(author, work_url, name, body, visibility, is_numbered, notesBefore, notesAfter, globalTags, customTags) {
                const response = await fetch(`${Env_7.default.API_ORIGIN}work/${author}/${work_url}/chapter/create`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: name,
                        body: body,
                        visibility: visibility,
                        is_numbered: is_numbered,
                        notes_before: notesBefore,
                        notes_after: notesAfter,
                        global_tags: globalTags,
                        custom_tags: customTags,
                    }),
                }).then(response => response.json());
                console.log(response);
            },
        },
        updateChapter: {
            name: 'Update Chapter',
            async execute(author, work_url, index, name, body, visibility, is_numbered, notesBefore, notesAfter, globalTags, customTags) {
                const response = await fetch(`${Env_7.default.API_ORIGIN}work/${author}/${work_url}/chapter/${index}/update`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name,
                        body,
                        visibility,
                        is_numbered,
                        notes_before: notesBefore,
                        notes_after: notesAfter,
                        global_tags: globalTags,
                        custom_tags: customTags,
                    }),
                }).then(response => response.json());
                console.log(response);
            },
        },
        deleteChapter: {
            name: 'Delete Chapter',
            async execute(author, work_url, index) {
                await fetch(`${Env_7.default.API_ORIGIN}work/${author}/${work_url}/chapter/${index}/delete`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
            },
        },
        viewChapter: {
            name: 'View Chapter',
            async execute(label, author, work_url, index) {
                const response = await fetch(`${Env_7.default.API_ORIGIN}work/${author}/${work_url}/chapter/${index}/get`, {
                    credentials: 'include',
                }).then(response => response.json());
                console.log(label, response);
            },
        },
        viewChapterPaginated: {
            name: 'View Chapter Paginated',
            async execute(label, author, work_url, index) {
                const response = await fetch(`${Env_7.default.API_ORIGIN}work/${author}/${work_url}/chapters/individual?page=${index}`, {
                    credentials: 'include',
                }).then(response => response.json());
                console.log(label, response);
            },
        },
        getAllChapters: {
            name: 'Get All Chapters',
            async execute(author, vanity, page = 0) {
                const response = await fetch(`${Env_7.default.API_ORIGIN}work/${author}/${vanity}/chapters/list?page=${page}`, {
                    credentials: 'include',
                }).then(response => response.json());
                console.log(response);
            },
        },
        follow: {
            name: 'Follow',
            async execute(type, vanity) {
                await fetch(`${Env_7.default.API_ORIGIN}follow/${type}/${vanity}`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
            },
        },
        followWork: {
            name: 'Follow',
            async execute(author_vanity, work_vanity) {
                await fetch(`${Env_7.default.API_ORIGIN}follow/work/${author_vanity}/${work_vanity}`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
            },
        },
        unfollow: {
            name: 'Unfollow',
            async execute(type, vanity) {
                await fetch(`${Env_7.default.API_ORIGIN}unfollow/${type}/${vanity}`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
            },
        },
        unfollowWork: {
            name: 'Unfollow',
            async execute(author_vanity, work_vanity) {
                await fetch(`${Env_7.default.API_ORIGIN}unfollow/work/${author_vanity}/${work_vanity}`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
            },
        },
        getFollow: {
            name: 'Get Follow',
            async execute(type, vanity) {
                const response = await fetch(`${Env_7.default.API_ORIGIN}follows/${type}/${vanity}`, {
                    credentials: 'include',
                }).then(response => response.json());
                console.log(response);
            },
        },
        getFollowWork: {
            name: 'Get Follow',
            async execute(author_vanity, work_vanity) {
                const response = await fetch(`${Env_7.default.API_ORIGIN}follows/work/${author_vanity}/${work_vanity}`, {
                    credentials: 'include',
                }).then(response => response.json());
                console.log(response);
            },
        },
        getAllFollows: {
            name: 'Get All Follows',
            async execute(type, page = 0) {
                const response = await fetch(`${Env_7.default.API_ORIGIN}following/${type}?page=${page}`, {
                    credentials: 'include',
                }).then(response => response.json());
                console.log(response);
            },
        },
        getAllFollowsMerged: {
            name: 'Get All Follows Merged',
            async execute(page = 0) {
                const response = await fetch(`${Env_7.default.API_ORIGIN}following?page=${page}`, {
                    credentials: 'include',
                }).then(response => response.json());
                console.log(response);
            },
        },
        ignore: {
            name: 'Ignore',
            async execute(type, vanity) {
                await fetch(`${Env_7.default.API_ORIGIN}ignore/${type}/${vanity}`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
            },
        },
        ignoreWork: {
            name: 'Ignore',
            async execute(author_vanity, work_vanity) {
                await fetch(`${Env_7.default.API_ORIGIN}ignore/work/${author_vanity}/${work_vanity}`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
            },
        },
        unignore: {
            name: 'Unignore',
            async execute(type, vanity) {
                await fetch(`${Env_7.default.API_ORIGIN}unignore/${type}/${vanity}`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
            },
        },
        unignoreWork: {
            name: 'Unignore',
            async execute(author_vanity, work_vanity) {
                await fetch(`${Env_7.default.API_ORIGIN}unignore/work/${author_vanity}/${work_vanity}`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
            },
        },
        getIgnore: {
            name: 'Get Ignore',
            async execute(type, vanity) {
                const response = await fetch(`${Env_7.default.API_ORIGIN}ignores/${type}/${vanity}`, {
                    credentials: 'include',
                }).then(response => response.json());
                console.log(response);
            },
        },
        getIgnoreWork: {
            name: 'Get Ignore',
            async execute(author_vanity, work_vanity) {
                const response = await fetch(`${Env_7.default.API_ORIGIN}ignores/work/${author_vanity}/${work_vanity}`, {
                    credentials: 'include',
                }).then(response => response.json());
                console.log(response);
            },
        },
        getAllIgnores: {
            name: 'Get All Ignores',
            async execute(type, page = 0) {
                const response = await fetch(`${Env_7.default.API_ORIGIN}ignoring/${type}?page=${page}`, {
                    credentials: 'include',
                }).then(response => response.json());
                console.log(response);
            },
        },
        getAllIgnoresMerged: {
            name: 'Get All Ignores Merged',
            async execute(page = 0) {
                const response = await fetch(`${Env_7.default.API_ORIGIN}ignoring?page=${page}`, {
                    credentials: 'include',
                }).then(response => response.json());
                console.log(response);
            },
        },
        privilegeGetAllAuthor: {
            name: 'Get All Author Privileges',
            async execute(label, vanity) {
                const response = await fetch(`${Env_7.default.API_ORIGIN}privilege/get/${vanity}`, {
                    credentials: 'include',
                }).then(response => response.json());
                console.log(label, response);
            },
        },
        privilegeGrantAuthor: {
            name: 'Grant Privileges to Author',
            async execute(vanity, ...privileges) {
                const response = await fetch(`${Env_7.default.API_ORIGIN}privilege/grant/author/${vanity}`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        privileges,
                    }),
                }).then(response => response.json());
                console.log('granted privileges', response);
            },
        },
        privilegeRevokeAuthor: {
            name: 'Revoke Privileges from Author',
            async execute(vanity, ...privileges) {
                const response = await fetch(`${Env_7.default.API_ORIGIN}privilege/revoke/author/${vanity}`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        privileges,
                    }),
                }).then(response => response.json());
                console.log('revoked privileges', response);
            },
        },
        createRole: {
            name: 'Create Role',
            async execute(roleName, visibilty, roleBelow) {
                const response = await fetch(`${Env_7.default.API_ORIGIN}role/create`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: roleName,
                        below: roleBelow,
                        description: 'idk some test stuff',
                        visibilty: visibilty,
                    }),
                }).then(response => response.json());
                console.log('created role', response);
            },
        },
        deleteRole: {
            name: 'Delete Role',
            async execute(vanity) {
                const response = await fetch(`${Env_7.default.API_ORIGIN}role/delete/${vanity}`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }).then(response => response.json());
                console.log('deleted role', response);
            },
        },
        editRole: {
            name: 'Edit Role',
            async execute(vanity, name, description) {
                const response = await fetch(`${Env_7.default.API_ORIGIN}role/update/${vanity}`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: name,
                        description: description,
                    }),
                }).then(response => response.json());
                console.log('edited role', response);
            },
        },
        grantRoleToAuthor: {
            name: 'Grant Role to Author',
            async execute(roleVanity, authorVanity) {
                const response = await fetch(`${Env_7.default.API_ORIGIN}role/grant/${roleVanity}/${authorVanity}`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }).then(response => response.json());
                console.log('granted role', response);
            },
        },
        revokeRoleFromAuthor: {
            name: 'Revoke Role from Author',
            async execute(roleVanity, authorVanity) {
                const response = await fetch(`${Env_7.default.API_ORIGIN}role/revoke/${roleVanity}/${authorVanity}`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }).then(response => response.json());
                console.log('granted role', response);
            },
        },
        privilegeGrantRole: {
            name: 'Grant Privileges to Role',
            async execute(vanity, ...privileges) {
                const response = await fetch(`${Env_7.default.API_ORIGIN}privilege/grant/role/${vanity}`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        privileges,
                    }),
                }).then(response => response.json());
                console.log('granted privileges to role', response);
            },
        },
        privilegeRevokeRole: {
            name: 'Revoke Privileges from Role',
            async execute(vanity, ...privileges) {
                const response = await fetch(`${Env_7.default.API_ORIGIN}privilege/revoke/role/${vanity}`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        privileges,
                    }),
                }).then(response => response.json());
                console.log('revoked privileges from role', response);
            },
        },
        roleListAll: {
            name: 'List all roles',
            async execute(label) {
                const response = await fetch(`${Env_7.default.API_ORIGIN}role/get`, {
                    credentials: 'include',
                }).then(response => response.json());
                console.log(label, response);
            },
        },
        roleReorder: {
            name: 'Reorder roles',
            async execute(...roles) {
                const response = await fetch(`${Env_7.default.API_ORIGIN}role/reorder`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        roles,
                    }),
                }).then(response => response.json());
                console.log('reordered roles', response);
            },
        },
        createCommentChapter: {
            name: 'Create Comment Chapter',
            async execute(author, vanity, index, body, parent_id) {
                const response = await fetch(`${Env_7.default.API_ORIGIN}work/${author}/${vanity}/chapter/${index}/comment/add`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        body,
                        parent_id,
                    }),
                }).then(response => response.json());
                console.log(response);
            },
        },
        updateCommentChapter: {
            name: 'Update Comment Chapter',
            async execute(id, comment_body) {
                const response = await fetch(`${Env_7.default.API_ORIGIN}comment/update/chapter`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        comment_id: id,
                        body: comment_body,
                    }),
                }).then(response => response.json());
                console.log(response);
            },
        },
        deleteCommentChapter: {
            name: 'Delete Comment Chapter',
            async execute(id) {
                await fetch(`${Env_7.default.API_ORIGIN}comment/remove/chapter`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        comment_id: id,
                    }),
                });
            },
        },
        getComment: {
            name: 'Get Comment',
            async execute(id, label) {
                const response = await fetch(`${Env_7.default.API_ORIGIN}comment/get`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        comment_id: id,
                    }),
                }).then(response => response.json());
                console.log(label, response);
            },
        },
        getAllComments: {
            name: 'Get All Comments',
            async execute(author, vanity, index) {
                const response = await fetch(`${Env_7.default.API_ORIGIN}work/${author}/${vanity}/chapter/${index}/comments`, {
                    credentials: 'include',
                }).then(response => response.json());
                console.log(response);
            },
        },
        patreonGetTiers: {
            name: 'Get Tiers',
            async execute(label) {
                const response = await fetch(`${Env_7.default.API_ORIGIN}patreon/campaign/tiers/get`, {
                    credentials: 'include',
                }).then(response => response.json());
                console.log(label, response);
            },
        },
        patreonSetThresholds: {
            name: 'Set Chapter Thresholds',
            async execute(author_vanity, work_vanity, visibility, chapters, tier_id) {
                const response = await fetch(`${Env_7.default.API_ORIGIN}patreon/campaign/tiers/set/${author_vanity}/${work_vanity}`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
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
            name: 'Tag Create Category',
            async execute(categoryName, categoryDescription) {
                const response = await fetch(`${Env_7.default.API_ORIGIN}tag/create/category`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
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
            name: 'Tag Create Global',
            async execute(tagName, tagDescription, tagCategory) {
                const response = await fetch(`${Env_7.default.API_ORIGIN}tag/create/global`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
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
        tagPromoteCustom: {
            name: 'Tag Promote Custom',
            async execute(tagName, newDescription, newCategory) {
                const response = await fetch(`${Env_7.default.API_ORIGIN}tag/promote/${tagName}`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        description: newDescription,
                        category: newCategory,
                    }),
                }).then(response => response.json());
                console.log(response);
            },
        },
        tagDemoteGlobal: {
            name: 'Tag Demote Global',
            async execute(tagName) {
                const response = await fetch(`${Env_7.default.API_ORIGIN}tag/demote/${tagName}`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }).then(response => response.json());
                console.log(response);
            },
        },
        tagUpdateCategory: {
            name: 'Tag Update Category',
            async execute(vanity, categoryName, categoryDescription) {
                const response = await fetch(`${Env_7.default.API_ORIGIN}tag/update/category/${vanity}`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
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
            name: 'Tag Update Global',
            async execute(vanity, tagName, tagDescription, tagCategory) {
                const response = await fetch(`${Env_7.default.API_ORIGIN}tag/update/global/${vanity}`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
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
            name: 'Tag Remove Category',
            async execute(vanity) {
                const response = await fetch(`${Env_7.default.API_ORIGIN}tag/remove/category/${vanity}`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }).then(response => response.json());
                console.log(response);
            },
        },
        tagRemoveGlobal: {
            name: 'Tag Remove Global',
            async execute(vanity) {
                const response = await fetch(`${Env_7.default.API_ORIGIN}tag/remove/global/${vanity}`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }).then(response => response.json());
                console.log(response);
            },
        },
        tagGetManifest: {
            name: 'Tag Get Manifest',
            async execute() {
                const response = await fetch(`${Env_7.default.API_ORIGIN}manifest/tags`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }).then(response => response.json());
                console.log(response);
            },
        },
        manifestFormLengthGet: {
            name: 'Form Length Manifest',
            async execute() {
                const response = await fetch(`${Env_7.default.API_ORIGIN}manifest/form/lengths`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }).then(response => response.json());
                console.log(response);
            },
        },
        notificationsGet: {
            name: 'Get Notifications',
            async execute() {
                const response = await fetch(`${Env_7.default.API_ORIGIN}notifications/get/all`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }).then(response => response.json());
                console.log(response);
            },
        },
        notificationsGetUnread: {
            name: 'Get Unread Notifications',
            async execute() {
                const response = await fetch(`${Env_7.default.API_ORIGIN}notifications/get/unread`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }).then(response => response.json());
                console.log(response);
            },
        },
        notificationsMark: {
            name: 'Mark Notifications Read/Unread',
            async execute(state, notifications) {
                await fetch(`${Env_7.default.API_ORIGIN}notifications/mark/${state}`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        notification_ids: notifications,
                    }),
                });
            },
        },
        seedBulk: {
            name: 'Seed Bulk',
            async execute() {
                await fetch(`${Env_7.default.API_ORIGIN}seed/bulk`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
            },
        },
        feedGet: {
            name: 'Get Feed',
            async execute() {
                const response = await fetch(`${Env_7.default.API_ORIGIN}feed/get`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }).then(response => response.json());
                console.log(response);
            },
        },
    };
});
define("utility/Popup", ["require", "exports", "utility/Store"], function (require, exports, Store_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = popup;
    Store_2 = __importDefault(Store_2);
    function popup(name, url, width = 600, height = 800) {
        const left = (window.innerWidth - width) / 2 + window.screenLeft;
        const top = (window.innerHeight - height) / 2 + window.screenTop;
        return new Promise((resolve, reject) => {
            delete Store_2.default.items.popupError;
            const options = 'width=' + width + ',height=' + height + ',top=' + top + ',left=' + left;
            const oauthPopup = window.open(url, name, options);
            const interval = setInterval(() => {
                if (oauthPopup?.closed) {
                    clearInterval(interval);
                    const popupError = Store_2.default.items.popupError;
                    if (popupError)
                        return reject(Object.assign(new Error(popupError.message ?? 'Internal Server Error'), { code: popupError.code }));
                    resolve();
                }
            }, 100);
        });
    }
});
define("ui/view/DebugView", ["require", "exports", "endpoint/auth/EndpointAuthServices", "model/Session", "ui/Component", "ui/component/core/Button", "ui/view/debug/ButtonRegistry", "ui/view/shared/component/View", "ui/view/shared/component/ViewDefinition", "utility/Env", "utility/Objects", "utility/Popup"], function (require, exports, EndpointAuthServices_2, Session_17, Component_58, Button_20, ButtonRegistry_1, View_4, ViewDefinition_5, Env_8, Objects_8, Popup_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    EndpointAuthServices_2 = __importDefault(EndpointAuthServices_2);
    Session_17 = __importDefault(Session_17);
    Component_58 = __importDefault(Component_58);
    Button_20 = __importDefault(Button_20);
    View_4 = __importDefault(View_4);
    ViewDefinition_5 = __importDefault(ViewDefinition_5);
    Env_8 = __importDefault(Env_8);
    Objects_8 = __importDefault(Objects_8);
    Popup_1 = __importDefault(Popup_1);
    const Block = Component_58.default.Builder(component => component
        .style('debug-block'));
    exports.default = (0, ViewDefinition_5.default)({
        async create() {
            const view = (0, View_4.default)('debug');
            const createButton = (implementation, ...args) => {
                return (0, Button_20.default)()
                    .text.set(implementation.name)
                    .event.subscribe('click', async () => {
                    try {
                        await implementation.execute(...args);
                    }
                    catch (err) {
                        const error = err;
                        console.warn(`Button ${implementation.name} failed to execute:`, error);
                    }
                });
            };
            const oauthDiv = Block().appendTo(view.content);
            const OAuthServices = await EndpointAuthServices_2.default.query();
            for (const service of Objects_8.default.values(OAuthServices.data ?? {})) {
                if (!service)
                    continue;
                (0, Button_20.default)()
                    .text.set(`OAuth ${service.name}`)
                    .event.subscribe('click', async () => {
                    await (0, Popup_1.default)(`OAuth ${service.name}`, service.url_begin, 600, 900)
                        .then(() => true).catch(err => { console.warn(err); return false; });
                    await Session_17.default.refresh();
                })
                    .appendTo(oauthDiv);
                (0, Button_20.default)()
                    .text.set(`UnOAuth ${service.name}`)
                    .event.subscribe('click', async () => {
                    const id = Session_17.default.Auth.get(service.id)?.id;
                    if (id === undefined)
                        return;
                    await fetch(`${Env_8.default.API_ORIGIN}auth/remove`, {
                        method: 'POST',
                        credentials: 'include',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ id }),
                    });
                })
                    .appendTo(oauthDiv);
            }
            // document.body.append(createButton(BUTTON_REGISTRY.createAuthor, "test author 1", "hi-im-an-author"));
            oauthDiv.append(createButton(ButtonRegistry_1.BUTTON_REGISTRY.clearSession));
            const profileButtons = Block().appendTo(view.content);
            profileButtons.append(createButton({
                name: 'Seed Bulk Data',
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.seedBulk.execute();
                },
            }));
            profileButtons.append(createButton({
                name: 'Create Profile 1',
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.createAuthor.execute('prolific author', 'somanystories', 'wow a description that mentions <mention vanity="somanystories">', 'she/her pronies m8');
                    await ButtonRegistry_1.BUTTON_REGISTRY.createWork.execute('a debut work', 'pretty decent by <mention vanity="somanystories">', 'short description', 'debut', 'Complete', 'Public');
                    await ButtonRegistry_1.BUTTON_REGISTRY.createChapter.execute('somanystories', 'debut', 'chapter 1', 'woo look it\'s prolific author\'s first story!', 'Public');
                    await ButtonRegistry_1.BUTTON_REGISTRY.createWork.execute('sequel to debut', 'wow they wrote a sequel', 'sequel short description', 'sequel', 'Ongoing', 'Public');
                    await ButtonRegistry_1.BUTTON_REGISTRY.createChapter.execute('somanystories', 'sequel', 'the chapters', 'pretend there\'s a story here', 'Public');
                    await ButtonRegistry_1.BUTTON_REGISTRY.createWork.execute('work in progress', 'test', 'short description test', 'wip', 'Ongoing', 'Private');
                    await ButtonRegistry_1.BUTTON_REGISTRY.createChapter.execute('somanystories', 'wip', 'draft', 'it\'s a rough draft', 'Private');
                    await ButtonRegistry_1.BUTTON_REGISTRY.viewWork.execute('work', 'somanystories', 'debut');
                    await ButtonRegistry_1.BUTTON_REGISTRY.viewWork.execute('work', 'somanystories', 'sequel');
                    await ButtonRegistry_1.BUTTON_REGISTRY.viewWork.execute('work', 'somanystories', 'wip');
                    await ButtonRegistry_1.BUTTON_REGISTRY.getAllWorksByAuthor.execute('all works', 'somanystories');
                },
            }));
            profileButtons.append(createButton({
                name: 'View Profile 1',
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.viewAuthor.execute('author with many stories', 'somanystories');
                    await ButtonRegistry_1.BUTTON_REGISTRY.getAllWorksByAuthor.execute('all works', 'somanystories');
                },
            }));
            profileButtons.append(createButton({
                name: 'Create Profile 2',
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.createAuthor.execute('single story author', 'justonestory', '<mention vanity="somanystories"> writes so much');
                    await ButtonRegistry_1.BUTTON_REGISTRY.createWork.execute('one big work', 'made by <mention vanity="justonestory">', 'wow description', 'bigstory', 'Ongoing', 'Public', ['Protagonist: Transgender', 'Genre: Fantasy', 'Genre: Romance', 'Setting: Urban Fantasy'], ['just a test work lmao', 'gotta add some custom tags']);
                    await ButtonRegistry_1.BUTTON_REGISTRY.createChapter.execute('justonestory', 'bigstory', 'big story 1', 'start of a long story', 'Public');
                    await ButtonRegistry_1.BUTTON_REGISTRY.createChapter.execute('justonestory', 'bigstory', 'big story interlude', 'middle of a long story', 'Public', false, 'only notes before');
                    await ButtonRegistry_1.BUTTON_REGISTRY.createChapter.execute('justonestory', 'bigstory', 'big story 2', 'aaaa', 'Public', true, undefined, 'only notes after');
                    await ButtonRegistry_1.BUTTON_REGISTRY.createChapter.execute('justonestory', 'bigstory', 'big story 3', 'aaaaaaa', 'Public', true, 'both notes before', 'and notes after');
                    await ButtonRegistry_1.BUTTON_REGISTRY.createChapter.execute('justonestory', 'bigstory', 'big story 3.1', 'aaaaaaaaaaaaaaaaaaa', 'Public', false);
                    await ButtonRegistry_1.BUTTON_REGISTRY.createChapter.execute('justonestory', 'bigstory', 'big story 3.2', 'aaaaaaaaaaaaaaaaaaa', 'Private', false);
                    await ButtonRegistry_1.BUTTON_REGISTRY.createChapter.execute('justonestory', 'bigstory', 'big story 3.3', 'aaaaaaaaaaaaaaaaaaa', 'Public');
                    for (let i = 4; i < 50; i++) {
                        await ButtonRegistry_1.BUTTON_REGISTRY.createChapter.execute('justonestory', 'bigstory', `big story ${i}`, 'aaaaaaaaaaaaaaaaaaa', 'Public');
                    }
                    await ButtonRegistry_1.BUTTON_REGISTRY.updateChapter.execute('justonestory', 'bigstory', 4, undefined, undefined, undefined, false);
                    await ButtonRegistry_1.BUTTON_REGISTRY.viewChapter.execute('', 'justonestory', 'bigstory', 1);
                    await ButtonRegistry_1.BUTTON_REGISTRY.viewWork.execute('big story five chapters', 'justonestory', 'bigstory');
                    await ButtonRegistry_1.BUTTON_REGISTRY.getAllChapters.execute('justonestory', 'bigstory', 0);
                    await ButtonRegistry_1.BUTTON_REGISTRY.viewChapterPaginated.execute('0', 'justonestory', 'bigstory', 0);
                    await ButtonRegistry_1.BUTTON_REGISTRY.viewChapterPaginated.execute('4 (3.1)', 'justonestory', 'bigstory', 4);
                    await ButtonRegistry_1.BUTTON_REGISTRY.viewChapterPaginated.execute('6 (private)', 'justonestory', 'bigstory', 6);
                    // await BUTTON_REGISTRY.follow.execute("work", "debut");
                },
            }));
            profileButtons.append(createButton({
                name: 'View Profile 2',
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.viewAuthor.execute('justonestory author', 'justonestory');
                },
            }));
            profileButtons.append(createButton({
                name: 'View Profile 2\'s stories',
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.viewChapter.execute('', 'justonestory', 'bigstory', 1);
                    await ButtonRegistry_1.BUTTON_REGISTRY.viewWork.execute('big story five chapters', 'justonestory', 'bigstory');
                    await ButtonRegistry_1.BUTTON_REGISTRY.getAllChapters.execute('justonestory', 'bigstory', 0);
                    await ButtonRegistry_1.BUTTON_REGISTRY.viewChapterPaginated.execute('0', 'justonestory', 'bigstory', 0);
                    await ButtonRegistry_1.BUTTON_REGISTRY.viewChapterPaginated.execute('4 (3.1)', 'justonestory', 'bigstory', 4);
                    await ButtonRegistry_1.BUTTON_REGISTRY.viewChapterPaginated.execute('6 (private)', 'justonestory', 'bigstory', 6);
                },
            }));
            // profileButtons.append(createButton({
            // 	name: "Set Chiri Patreon chapters",
            // 	async execute () {
            // 		await BUTTON_REGISTRY.patreonSetThresholds.execute("justonestory", "bigstory", "Patreon", ["8", "9"], "4392761")
            // 	},
            // }))
            const followButtons = Block().appendTo(view.content);
            followButtons.append(createButton({
                name: 'Test New Following',
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.createAuthor.execute('new follows', 'thefollower');
                    await ButtonRegistry_1.BUTTON_REGISTRY.createWork.execute('wow a work', 'test pls ignore', 'pls ignore', 'wowawork', 'Ongoing', 'Public');
                    await ButtonRegistry_1.BUTTON_REGISTRY.getAllFollows.execute('work');
                    await ButtonRegistry_1.BUTTON_REGISTRY.getAllFollows.execute('work');
                    await ButtonRegistry_1.BUTTON_REGISTRY.follow.execute('author', 'thefollower');
                    await ButtonRegistry_1.BUTTON_REGISTRY.followWork.execute('thefollower', 'wowawork');
                    await ButtonRegistry_1.BUTTON_REGISTRY.getFollow.execute('author', 'thefollower');
                    await ButtonRegistry_1.BUTTON_REGISTRY.getFollow.execute('author', 'thefollower');
                    await ButtonRegistry_1.BUTTON_REGISTRY.getAllFollows.execute('work');
                    await ButtonRegistry_1.BUTTON_REGISTRY.getAllFollows.execute('work');
                    await ButtonRegistry_1.BUTTON_REGISTRY.getAllFollowsMerged.execute();
                    await ButtonRegistry_1.BUTTON_REGISTRY.getAllFollowsMerged.execute();
                    await ButtonRegistry_1.BUTTON_REGISTRY.unignoreWork.execute('thefollower', 'wowawork');
                    // await BUTTON_REGISTRY.unfollow.execute("work", "wowawork");
                    await ButtonRegistry_1.BUTTON_REGISTRY.getFollowWork.execute('thefollower', 'wowawork');
                },
            }));
            followButtons.append(createButton({
                name: 'Create a work with loads of chapters',
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.createWork.execute('even longer story', 'aaaaaaaaa', 'short description aaaaa', 'wowbig', 'Ongoing', 'Public');
                    for (let i = 0; i < 2000; i++) {
                        await ButtonRegistry_1.BUTTON_REGISTRY.createChapter.execute('justonestory', 'wowbig', `chapter ${i}`, `wow chapter body ${i}`, 'Public');
                    }
                },
            }));
            followButtons.append(createButton({
                name: 'Follows testing',
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.getAllFollows.execute('work', 0);
                    await ButtonRegistry_1.BUTTON_REGISTRY.getAllFollows.execute('work', 1);
                    await ButtonRegistry_1.BUTTON_REGISTRY.getAllFollowsMerged.execute(0);
                    await ButtonRegistry_1.BUTTON_REGISTRY.getAllFollowsMerged.execute(1);
                },
            }));
            followButtons.append(createButton({
                name: 'Spam Create Follow Work Test',
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.createAuthor.execute('spam create works', 'manyworks');
                    for (let i = 0; i < 100; i++) {
                        await ButtonRegistry_1.BUTTON_REGISTRY.createWork.execute(`rapid story ${i}`, 'aaaaaaaaa', 'rapid story aaaaa', `rapidstory${i}`, 'Ongoing', 'Public');
                        await ButtonRegistry_1.BUTTON_REGISTRY.follow.execute('work', `rapidstory${i}`);
                    }
                },
            }));
            followButtons.append(createButton({
                name: 'Test Ignore Endpoints',
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.createAuthor.execute('ignoring myself', 'ignorepls');
                    await ButtonRegistry_1.BUTTON_REGISTRY.createWork.execute('to ignore', 'testing ignoring', 'test ignoring', 'worktoignore', 'Ongoing', 'Public');
                    await ButtonRegistry_1.BUTTON_REGISTRY.ignore.execute('author', 'ignorepls');
                    await ButtonRegistry_1.BUTTON_REGISTRY.ignore.execute('work', 'worktoignore');
                    await ButtonRegistry_1.BUTTON_REGISTRY.getIgnore.execute('author', 'ignorepls');
                    await ButtonRegistry_1.BUTTON_REGISTRY.getIgnore.execute('author', 'ignorepls');
                    await ButtonRegistry_1.BUTTON_REGISTRY.getIgnore.execute('work', 'worktoignore');
                    await ButtonRegistry_1.BUTTON_REGISTRY.getIgnore.execute('work', 'worktoignore');
                    await ButtonRegistry_1.BUTTON_REGISTRY.getAllIgnores.execute('author');
                    await ButtonRegistry_1.BUTTON_REGISTRY.getAllIgnores.execute('author');
                    await ButtonRegistry_1.BUTTON_REGISTRY.getAllIgnores.execute('work');
                    await ButtonRegistry_1.BUTTON_REGISTRY.getAllIgnoresMerged.execute();
                    await ButtonRegistry_1.BUTTON_REGISTRY.getAllIgnoresMerged.execute();
                },
            }));
            const privRoleButtons = Block().appendTo(view.content);
            privRoleButtons.append(createButton({
                name: 'privileges initial test',
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.privilegeGrantAuthor.execute('somanystories', 'WorkViewPrivate', 'PrivilegeViewAuthor');
                    await ButtonRegistry_1.BUTTON_REGISTRY.privilegeGetAllAuthor.execute('privileges of somanystories', 'somanystories');
                    await ButtonRegistry_1.BUTTON_REGISTRY.privilegeRevokeAuthor.execute('somanystories', 'WorkViewPrivate');
                    await ButtonRegistry_1.BUTTON_REGISTRY.privilegeGrantAuthor.execute('somanystories', 'RevokePrivilege');
                    await ButtonRegistry_1.BUTTON_REGISTRY.privilegeRevokeAuthor.execute('somanystories', 'WorkViewPrivate');
                    await ButtonRegistry_1.BUTTON_REGISTRY.privilegeGrantAuthor.execute('somanystories', 'ThisPrivilegeDoesntExist');
                    await ButtonRegistry_1.BUTTON_REGISTRY.privilegeGetAllAuthor.execute('privileges of somanystories', 'somanystories');
                },
            }));
            privRoleButtons.append(createButton({
                name: 'grant privs for testing',
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.privilegeGrantAuthor.execute('somanystories', 'PrivilegeRevoke', 'RoleCreate', 'RoleEdit', 'RoleDelete', 'RoleGrant', 'RoleRevoke', 'PrivilegeViewAuthor', 'RoleViewAll');
                    await ButtonRegistry_1.BUTTON_REGISTRY.createRole.execute('TestingRevoke', 'Visible');
                    await ButtonRegistry_1.BUTTON_REGISTRY.grantRoleToAuthor.execute('TestingRevoke', 'somanystories');
                    await ButtonRegistry_1.BUTTON_REGISTRY.revokeRoleFromAuthor.execute('TestingRevoke', 'somanystories');
                    await ButtonRegistry_1.BUTTON_REGISTRY.privilegeGrantRole.execute('TestingRevoke', 'ViewAllRoles');
                    await ButtonRegistry_1.BUTTON_REGISTRY.privilegeRevokeRole.execute('TestingRevoke', 'ViewAllRoles');
                    await ButtonRegistry_1.BUTTON_REGISTRY.deleteRole.execute('TestingRevoke');
                    await ButtonRegistry_1.BUTTON_REGISTRY.createRole.execute('SecondAuthorRole', 'Visible');
                    await ButtonRegistry_1.BUTTON_REGISTRY.grantRoleToAuthor.execute('SecondAuthorRole', 'justonestory');
                    await ButtonRegistry_1.BUTTON_REGISTRY.privilegeGrantRole.execute('SecondAuthorRole', 'RoleEdit', 'RoleDelete', 'RoleCreate');
                    // await BUTTON_REGISTRY.privilegeGrantAuthor.execute("justonestory", "ViewPrivateStories");
                },
            }));
            privRoleButtons.append(createButton({
                name: 'second author test stuff',
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.createRole.execute('DontWork', 'Admin');
                    await ButtonRegistry_1.BUTTON_REGISTRY.createRole.execute('DoWork', 'SecondAuthorRole');
                    await ButtonRegistry_1.BUTTON_REGISTRY.editRole.execute('Admin', 'CantDoThis');
                    await ButtonRegistry_1.BUTTON_REGISTRY.deleteRole.execute('SecondAuthorRole');
                },
            }));
            privRoleButtons.append(createButton({
                name: 'see highest level',
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.privilegeGrantAuthor.execute('somanystories', 'RoleViewAll', 'RoleGrant', 'RoleCreate');
                    await ButtonRegistry_1.BUTTON_REGISTRY.createRole.execute('NotTopRole', 'Admin');
                    await ButtonRegistry_1.BUTTON_REGISTRY.grantRoleToAuthor.execute('NotTopRole', 'somanystories');
                    await ButtonRegistry_1.BUTTON_REGISTRY.roleListAll.execute('listing all roles');
                    await ButtonRegistry_1.BUTTON_REGISTRY.roleListAll.execute('listing all roles');
                },
            }));
            privRoleButtons.append(createButton({
                name: 'role reorder test',
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.privilegeGrantAuthor.execute('somanystories', 'RoleViewAll', 'RoleGrant', 'RoleCreate');
                    await ButtonRegistry_1.BUTTON_REGISTRY.createRole.execute('Role1', 'Visible', 'Admin');
                    await ButtonRegistry_1.BUTTON_REGISTRY.createRole.execute('Role2', 'Visible', 'Admin');
                    await ButtonRegistry_1.BUTTON_REGISTRY.createRole.execute('Role3', 'Hidden', 'Admin');
                    await ButtonRegistry_1.BUTTON_REGISTRY.createRole.execute('Role4', 'Hidden', 'Admin');
                    await ButtonRegistry_1.BUTTON_REGISTRY.roleReorder.execute('Role1', 'Role2', 'Role3', 'Role4');
                },
            }));
            const moreRoleButtons = Block().appendTo(view.content);
            moreRoleButtons.append(createButton({
                name: 'Make ten billion works',
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.createAuthor.execute('lots of works test', 'manyworks', 'test description');
                    await ButtonRegistry_1.BUTTON_REGISTRY.privilegeGrantAuthor.execute('manyworks', 'TagGlobalCreate', 'TagGlobalDelete', 'TagGlobalUpdate', 'TagCategoryCreate', 'TagCategoryUpdate', 'TagCategoryDelete', 'TagPromote', 'TagDemote');
                    await ButtonRegistry_1.BUTTON_REGISTRY.tagCreateCategory.execute('Category One', 'the first test category');
                    await ButtonRegistry_1.BUTTON_REGISTRY.tagCreateCategory.execute('Category Two', 'the second test category');
                    await ButtonRegistry_1.BUTTON_REGISTRY.tagCreateCategory.execute('Category Three', 'the third test category');
                    await ButtonRegistry_1.BUTTON_REGISTRY.tagCreateGlobal.execute('Tag One', 'test tag 1', 'Category One');
                    await ButtonRegistry_1.BUTTON_REGISTRY.tagCreateGlobal.execute('Tag Two', 'test tag 1', 'Category Two');
                    await ButtonRegistry_1.BUTTON_REGISTRY.tagCreateGlobal.execute('Tag Three', 'test tag 1', 'Category Three');
                    for (let a = 0; a < 333; a++) {
                        await ButtonRegistry_1.BUTTON_REGISTRY.createWork.execute(`work${a}`, `description no ${a} mentions <mention vanity="manyworks">\n"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."`, 'Lorem ipsum dolor sit amet, consectetur adipiscing elit,', `testwork${a}`, 'Ongoing', 'Public', ['Category One: Tag One', 'Category Two: Tag Two', 'Category Three: Tag Three'], ['custom tag one', `custom tag two ${a}`]);
                    }
                    for (let a = 0; a < 333; a++) {
                        await ButtonRegistry_1.BUTTON_REGISTRY.createChapter.execute('manyworks', `testwork${a}`, `chapter ${a}`, `it's a test chapter ${a}`, 'Public');
                    }
                },
            }));
            moreRoleButtons.append(createButton({
                name: 'view ten billion works',
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.getAllWorksByAuthor.execute('many works', 'manyworks');
                },
            }));
            moreRoleButtons.append(createButton({
                name: 'admin list roles test (profile 1)',
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.privilegeGrantAuthor.execute('somanystories', 'RoleGrant', 'RoleCreate');
                    await ButtonRegistry_1.BUTTON_REGISTRY.createRole.execute('Role4', 'Hidden', 'Admin');
                    await ButtonRegistry_1.BUTTON_REGISTRY.createRole.execute('Role3', 'Visible', 'Admin');
                    await ButtonRegistry_1.BUTTON_REGISTRY.createRole.execute('Role2', 'Hidden', 'Admin');
                    await ButtonRegistry_1.BUTTON_REGISTRY.createRole.execute('Role1', 'Visible', 'Admin');
                    await ButtonRegistry_1.BUTTON_REGISTRY.grantRoleToAuthor.execute('Role2', 'justonestory');
                    await ButtonRegistry_1.BUTTON_REGISTRY.roleListAll.execute('all roles admin');
                },
            }));
            moreRoleButtons.append(createButton({
                name: 'user list roles test (profile 2)',
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.roleListAll.execute('all roles user');
                },
            }));
            moreRoleButtons.append(createButton({
                name: 'Delete Author Test',
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.deleteAuthor.execute();
                },
            }));
            const commentsButton = Block().appendTo(view.content);
            commentsButton.append(createButton({
                name: 'Author 2 lots of comments',
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.createCommentChapter.execute('justonestory', 'bigstory', '1', 'base comments 1');
                    await ButtonRegistry_1.BUTTON_REGISTRY.createCommentChapter.execute('justonestory', 'bigstory', '2', 'base comments 2');
                    await ButtonRegistry_1.BUTTON_REGISTRY.createCommentChapter.execute('justonestory', 'bigstory', '3', 'base comments 3');
                    await ButtonRegistry_1.BUTTON_REGISTRY.createCommentChapter.execute('justonestory', 'bigstory', '4', 'base comments 4');
                    await ButtonRegistry_1.BUTTON_REGISTRY.createCommentChapter.execute('justonestory', 'bigstory', '5', 'base comments 5');
                    await ButtonRegistry_1.BUTTON_REGISTRY.createCommentChapter.execute('justonestory', 'bigstory', '1', 'child comment <mention vanity="justonestory">', '6');
                    await ButtonRegistry_1.BUTTON_REGISTRY.createCommentChapter.execute('justonestory', 'bigstory', '1', 'child comment 2', '6');
                    await ButtonRegistry_1.BUTTON_REGISTRY.createCommentChapter.execute('justonestory', 'bigstory', '1', 'child comment 3<mention vanity="justonestory">', '11');
                    await ButtonRegistry_1.BUTTON_REGISTRY.createCommentChapter.execute('justonestory', 'bigstory', '1', 'child comment 4<mention vanity="justonestory">', '12');
                    await ButtonRegistry_1.BUTTON_REGISTRY.createCommentChapter.execute('justonestory', 'bigstory', '1', 'base comment index 1');
                    await ButtonRegistry_1.BUTTON_REGISTRY.createCommentChapter.execute('justonestory', 'bigstory', '1', 'child comment 6', '13');
                    await ButtonRegistry_1.BUTTON_REGISTRY.createCommentChapter.execute('justonestory', 'bigstory', '1', 'child comment 7', '11');
                    await ButtonRegistry_1.BUTTON_REGISTRY.createCommentChapter.execute('justonestory', 'bigstory', '1', 'base comment index 1 again');
                    await ButtonRegistry_1.BUTTON_REGISTRY.getAllComments.execute('justonestory', 'bigstory', '1');
                    await ButtonRegistry_1.BUTTON_REGISTRY.getComment.execute('1', 'get comment');
                },
            }));
            commentsButton.append(createButton({
                name: 'Author 2 just get comments',
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.getAllComments.execute('justonestory', 'bigstory', '1');
                },
            }));
            commentsButton.append(createButton({
                name: 'Author 1 single comment ping',
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.createCommentChapter.execute('somanystories', 'debut', '1', 'wow you write so many stories @somanystories how do you do it');
                    await ButtonRegistry_1.BUTTON_REGISTRY.createCommentChapter.execute('somanystories', 'debut', '1', '@somanystories you\'re so @somanystories amazing');
                    await ButtonRegistry_1.BUTTON_REGISTRY.getComment.execute('4');
                    await ButtonRegistry_1.BUTTON_REGISTRY.getComment.execute('5');
                    await ButtonRegistry_1.BUTTON_REGISTRY.updateCommentChapter.execute('4', 'okay done fawning over @somanystories now');
                    await ButtonRegistry_1.BUTTON_REGISTRY.getComment.execute('4');
                    await ButtonRegistry_1.BUTTON_REGISTRY.deleteCommentChapter.execute('5');
                    await ButtonRegistry_1.BUTTON_REGISTRY.getComment.execute('5');
                },
            }));
            commentsButton.append(createButton({
                name: 'try to delete author 1\'s comment',
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.deleteCommentChapter.execute('4');
                    await ButtonRegistry_1.BUTTON_REGISTRY.getComment.execute('4');
                },
            }));
            const patreonButtons = Block().appendTo(view.content);
            (0, Button_20.default)()
                .text.set('Campaign Test')
                .event.subscribe('click', async () => {
                await (0, Popup_1.default)('Campaign OAuth', `${Env_8.default.API_ORIGIN}auth/patreon/campaign/begin`, 600, 900)
                    .then(() => true).catch(err => { console.warn(err); return false; });
                await Session_17.default.refresh();
            })
                .appendTo(patreonButtons);
            patreonButtons.append(createButton({
                name: 'create patreon author',
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.createAuthor.execute('has a campaign', 'patreonuser');
                    await ButtonRegistry_1.BUTTON_REGISTRY.createWork.execute('patreon only story', 'test', 'short description test', 'exclusive', 'Ongoing', 'Public');
                    await ButtonRegistry_1.BUTTON_REGISTRY.createChapter.execute('patreonuser', 'exclusive', 'chapter 1', 'hewwo', 'Private');
                    await ButtonRegistry_1.BUTTON_REGISTRY.createChapter.execute('patreonuser', 'exclusive', 'chapter 2', 'hewwoo', 'Private');
                    await ButtonRegistry_1.BUTTON_REGISTRY.createChapter.execute('patreonuser', 'exclusive', 'chapter 3', 'hewwooo', 'Private');
                    await ButtonRegistry_1.BUTTON_REGISTRY.createChapter.execute('patreonuser', 'exclusive', 'chapter 4', 'hewwooo', 'Private');
                    await ButtonRegistry_1.BUTTON_REGISTRY.createChapter.execute('patreonuser', 'exclusive', 'chapter 5', 'hewwooo', 'Private');
                },
            }));
            patreonButtons.append(createButton({
                name: 'get patreon tiers',
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.patreonGetTiers.execute('patreon tiers');
                    await ButtonRegistry_1.BUTTON_REGISTRY.patreonGetTiers.execute('patreon tiers');
                },
            }));
            patreonButtons.append(createButton({
                name: 'set patreon chapters',
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.updateChapter.execute('patreonuser', 'exclusive', 1, undefined, undefined, 'Public');
                    await ButtonRegistry_1.BUTTON_REGISTRY.patreonSetThresholds.execute('patreonuser', 'exclusive', 'Public', ['2', '3']);
                    await ButtonRegistry_1.BUTTON_REGISTRY.patreonSetThresholds.execute('patreonuser', 'exclusive', 'Patreon', ['4', '5'], '4392761');
                },
            }));
            (0, Button_20.default)()
                .text.set('Patron Test')
                .event.subscribe('click', async () => {
                await (0, Popup_1.default)('Patron OAuth', `${Env_8.default.API_ORIGIN}auth/patreon/patron/begin`, 600, 900)
                    .then(() => true).catch(err => { console.warn(err); return false; });
                await Session_17.default.refresh();
            })
                .appendTo(patreonButtons);
            patreonButtons.append(createButton({
                name: 'get patreon-only chapters',
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.viewChapter.execute('public:', 'patreonuser', 'exclusive', 3);
                    await ButtonRegistry_1.BUTTON_REGISTRY.viewChapter.execute('public:', 'patreonuser', 'exclusive', 3);
                    await ButtonRegistry_1.BUTTON_REGISTRY.viewChapter.execute('patreon:', 'patreonuser', 'exclusive', 4);
                    await ButtonRegistry_1.BUTTON_REGISTRY.viewChapter.execute('patreon:', 'patreonuser', 'exclusive', 4);
                },
            }));
            patreonButtons.append(createButton({
                name: 'update patreon-only chapters',
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.patreonSetThresholds.execute('patreonuser', 'exclusive', 'Public', ['4']);
                },
            }));
            const tagButtons = Block().appendTo(view.content);
            tagButtons.append(createButton({
                name: 'Create Tag Author',
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.createAuthor.execute('tagging test', 'thetagger', 'test description');
                    await ButtonRegistry_1.BUTTON_REGISTRY.privilegeGrantAuthor.execute('thetagger', 'TagGlobalCreate', 'TagGlobalDelete', 'TagGlobalUpdate', 'TagCategoryCreate', 'TagCategoryUpdate', 'TagCategoryDelete', 'TagPromote', 'TagDemote');
                },
            }));
            tagButtons.append(createButton({
                name: 'Update Tag Author',
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.viewAuthor.execute('view post-update', 'thetagger');
                    await ButtonRegistry_1.BUTTON_REGISTRY.viewAuthor.execute('view post-update', 'thetagger');
                    await ButtonRegistry_1.BUTTON_REGISTRY.updateAuthor.execute('the tagger 2', 'wow i\'m <mention vanity="thetagger">');
                    await ButtonRegistry_1.BUTTON_REGISTRY.viewAuthor.execute('view post-update', 'thetagger');
                    await ButtonRegistry_1.BUTTON_REGISTRY.viewAuthor.execute('view post-update', 'thetagger');
                },
            }));
            tagButtons.append(createButton({
                name: 'Tag Create Test',
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.tagCreateCategory.execute('Category One', 'the first test category');
                    await ButtonRegistry_1.BUTTON_REGISTRY.tagCreateCategory.execute('Category Two', 'the second test category');
                    await ButtonRegistry_1.BUTTON_REGISTRY.tagCreateCategory.execute('Category Three', 'the third test category');
                    await ButtonRegistry_1.BUTTON_REGISTRY.tagCreateGlobal.execute('Tag One', 'test tag 1 <mention vanity="thetagger">', 'Category One');
                    await ButtonRegistry_1.BUTTON_REGISTRY.tagUpdateGlobal.execute('Category One: Tag One', 'Tag One Updated', 'test tag 1 updated', 'Category Two');
                    await ButtonRegistry_1.BUTTON_REGISTRY.tagUpdateCategory.execute('Category One', 'Category One Updated', 'first test category updated');
                    await ButtonRegistry_1.BUTTON_REGISTRY.tagRemoveCategory.execute('Category One Updated');
                    await ButtonRegistry_1.BUTTON_REGISTRY.tagRemoveGlobal.execute('Category Two: Tag One Updated');
                    await ButtonRegistry_1.BUTTON_REGISTRY.tagCreateGlobal.execute('tag conflict', 'conflicting', 'Category Two');
                    await ButtonRegistry_1.BUTTON_REGISTRY.tagCreateGlobal.execute('tag conflict', 'conflicting', 'Category Three');
                    await ButtonRegistry_1.BUTTON_REGISTRY.tagUpdateGlobal.execute('Category Three: tag conflict', undefined, undefined, 'Category Two');
                },
            }));
            tagButtons.append(createButton({
                name: 'Work Tag Test',
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.tagCreateGlobal.execute('Tag Two', 'test tag 2', 'Category Two');
                    await ButtonRegistry_1.BUTTON_REGISTRY.tagCreateGlobal.execute('Tag Three', 'test tag 2', 'Category Two');
                    await ButtonRegistry_1.BUTTON_REGISTRY.tagCreateGlobal.execute('Tag Four', 'test tag 2', 'Category Two');
                    await ButtonRegistry_1.BUTTON_REGISTRY.createWork.execute('Tag Test Work', 'test', 'desc test', 'testwork', 'Ongoing', 'Public', ['Category Two: Tag Two', 'Category Two: Tag Three'], ['custom tag 1', 'custom tag 2']);
                    await ButtonRegistry_1.BUTTON_REGISTRY.createWork.execute('Tag Test Work Two', 'test2', 'desc test', 'testworktwo', 'Ongoing', 'Public', ['Category Two: Tag Two', 'Category Two: Tag Three'], ['custom tag 2', 'custom tag 3']);
                    await ButtonRegistry_1.BUTTON_REGISTRY.viewWork.execute('work view 1', 'thetagger', 'testworktwo');
                    await ButtonRegistry_1.BUTTON_REGISTRY.viewWork.execute('work view 2', 'thetagger', 'testworktwo');
                    await ButtonRegistry_1.BUTTON_REGISTRY.updateWork.execute('thetagger', 'testworktwo', 'Test Work Two Updated');
                    await ButtonRegistry_1.BUTTON_REGISTRY.viewWork.execute('work view 3', 'thetagger', 'testworktwo');
                    await ButtonRegistry_1.BUTTON_REGISTRY.viewWork.execute('work view 4', 'thetagger', 'testworktwo');
                    await ButtonRegistry_1.BUTTON_REGISTRY.getAllWorksByAuthor.execute('all works', 'thetagger');
                },
            }));
            tagButtons.append(createButton({
                name: 'Chapter Tag Test',
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.createChapter.execute('thetagger', 'testworktwo', 'test chapter', 'test chapter body', 'Public', true, undefined, undefined, ['Category Two: Tag Two', 'Category Two: Tag Three'], ['custom tag 2', 'custom tag 3', 'custom tag 4']);
                    await ButtonRegistry_1.BUTTON_REGISTRY.viewChapter.execute('chapter', 'thetagger', 'testworktwo', 1);
                },
            }));
            tagButtons.append(createButton({
                name: 'Tag Promote/Demote',
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.tagPromoteCustom.execute('custom tag 1', 'test description', 'Category Two');
                    await ButtonRegistry_1.BUTTON_REGISTRY.tagDemoteGlobal.execute('Category Two: Tag Three');
                    await ButtonRegistry_1.BUTTON_REGISTRY.viewWork.execute('work view 3', 'thetagger', 'testwork');
                    await ButtonRegistry_1.BUTTON_REGISTRY.viewWork.execute('work view 4', 'thetagger', 'testworktwo');
                },
            }));
            tagButtons.append(createButton({
                name: 'manifest test',
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.tagGetManifest.execute();
                },
            }));
            tagButtons.append(createButton({
                name: 'manifest test 2',
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.tagCreateGlobal.execute('extra tag', 'wow', 'Category Three');
                    await ButtonRegistry_1.BUTTON_REGISTRY.tagGetManifest.execute();
                },
            }));
            tagButtons.append(createButton({
                name: 'form length manifest',
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.manifestFormLengthGet.execute();
                },
            }));
            const notifButtons = Block().appendTo(view.content);
            notifButtons.append(createButton({
                name: 'Get Notifications',
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.notificationsGet.execute();
                    await ButtonRegistry_1.BUTTON_REGISTRY.notificationsGetUnread.execute();
                },
            }));
            notifButtons.append(createButton({
                name: 'Mark Notifications Read',
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.notificationsMark.execute('read', ['ba397c1b-02e5-462c-b367-04b007d1f09a', 'd8830a0c-3e2c-4caa-ae4b-679a8c5cefa5']);
                    await ButtonRegistry_1.BUTTON_REGISTRY.notificationsMark.execute('unread', ['ba397c1b-02e5-462c-b367-04b007d1f09a', '3b9781ea-d15d-4915-bbeb-4788ed734453']);
                },
            }));
            notifButtons.append(createButton({
                name: 'Get Front Page Feed',
                async execute() {
                    await ButtonRegistry_1.BUTTON_REGISTRY.feedGet.execute();
                },
            }));
            return view;
        },
    });
});
define("endpoint/feed/EndpointFeedGetFollowed", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_37) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_37 = __importDefault(Endpoint_37);
    exports.default = (0, Endpoint_37.default)('/feed/get/followed', 'get');
});
define("ui/component/WorkFeed", ["require", "exports", "model/PagedListData", "ui/Component", "ui/component/core/Link", "ui/component/core/Paginator", "ui/component/Work", "utility/State"], function (require, exports, PagedListData_2, Component_59, Link_10, Paginator_3, Work_4, State_44) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    PagedListData_2 = __importDefault(PagedListData_2);
    Component_59 = __importDefault(Component_59);
    Link_10 = __importDefault(Link_10);
    Paginator_3 = __importDefault(Paginator_3);
    Work_4 = __importDefault(Work_4);
    State_44 = __importDefault(State_44);
    const WorkFeed = Component_59.default.Builder((component) => {
        const paginator = component.and(Paginator_3.default)
            .type('flush');
        const set = paginator.set;
        const feed = paginator.extend(feed => ({
            setFromEndpoint(endpoint) {
                const authors = (0, State_44.default)([]);
                const data = (0, PagedListData_2.default)(endpoint.getPageSize?.() ?? 25, {
                    async get(page) {
                        const response = await endpoint.query(undefined, { page });
                        if (toast.handleError(response))
                            return false;
                        if (!Array.isArray(response.data) || response.data.length) {
                            authors.value.push(...response.data.authors);
                            authors.value.distinctInPlace(author => author.vanity);
                            authors.emit();
                            return response.data.works;
                        }
                        return null;
                    },
                });
                feed.setFromWorks(data /* .resized(3)*/, authors.value);
                return feed;
            },
            setFromWorks(pagedData, authors) {
                set(pagedData, (slot, works) => {
                    for (const workData of works) {
                        const author = authors.find(author => author.vanity === workData.author);
                        (0, Link_10.default)(author && `/work/${author.vanity}/${workData.vanity}`)
                            .and(Work_4.default, workData, author, true)
                            .viewTransition(false)
                            .appendTo(slot);
                    }
                });
                return feed;
            },
        }));
        paginator.orElse(slot => (0, Component_59.default)()
            .style('placeholder')
            .text.use('work-feed/empty')
            .appendTo(slot));
        return feed;
    });
    exports.default = WorkFeed;
});
define("ui/view/FeedView", ["require", "exports", "endpoint/feed/EndpointFeedGetFollowed", "lang/en-nz", "model/Follows", "ui/component/core/Button", "ui/component/core/Link", "ui/component/WorkFeed", "ui/view/shared/component/View", "ui/view/shared/component/ViewDefinition"], function (require, exports, EndpointFeedGetFollowed_1, en_nz_11, Follows_3, Button_21, Link_11, WorkFeed_1, View_5, ViewDefinition_6) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    EndpointFeedGetFollowed_1 = __importDefault(EndpointFeedGetFollowed_1);
    en_nz_11 = __importDefault(en_nz_11);
    Follows_3 = __importDefault(Follows_3);
    Button_21 = __importDefault(Button_21);
    Link_11 = __importDefault(Link_11);
    WorkFeed_1 = __importDefault(WorkFeed_1);
    View_5 = __importDefault(View_5);
    ViewDefinition_6 = __importDefault(ViewDefinition_6);
    exports.default = (0, ViewDefinition_6.default)({
        create: () => {
            const view = (0, View_5.default)('feed');
            view.breadcrumbs.title.text.use('view/feed/main/title');
            view.breadcrumbs.description.text.use('view/feed/main/description');
            (0, Link_11.default)('/following')
                .and(Button_21.default)
                .type('flush')
                .setIcon('circle-check')
                .text.bind(Follows_3.default.map(view, () => en_nz_11.default['view/shared/info/following'](Follows_3.default.getTotalFollowing())))
                .appendTo(view.breadcrumbs.actions);
            (0, Link_11.default)('/ignoring')
                .and(Button_21.default)
                .type('flush')
                .setIcon('ban')
                .text.bind(Follows_3.default.map(view, () => en_nz_11.default['view/shared/info/ignoring'](Follows_3.default.getTotalIgnoring())))
                .appendTo(view.breadcrumbs.actions);
            (0, WorkFeed_1.default)()
                .viewTransition('feed-view-feed')
                .setFromEndpoint(EndpointFeedGetFollowed_1.default)
                .appendTo(view.content);
            return view;
        },
    });
});
define("ui/component/core/Tabinator", ["require", "exports", "ui/Component", "ui/component/core/Block", "ui/component/core/Button", "utility/Objects", "utility/State"], function (require, exports, Component_60, Block_12, Button_22, Objects_9, State_45) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Tab = void 0;
    Component_60 = __importDefault(Component_60);
    Block_12 = __importDefault(Block_12);
    Button_22 = __importDefault(Button_22);
    State_45 = __importDefault(State_45);
    exports.Tab = Component_60.default.Builder((component) => {
        const content = (0, Component_60.default)()
            .style('tabinator-panel')
            .ariaRole('tabpanel')
            .setRandomId();
        const tab = component.and(Button_22.default)
            .type('flush')
            .style('tabinator-tab')
            .ariaRole('tab')
            .setRandomId()
            .ariaControls(content)
            .extend(tab => ({
            content,
            tabinator: undefined,
            tweakContent(tweaker, ...params) {
                content.tweak(tweaker, tab, ...params);
                return tab;
            },
            addTo(tabinator) {
                tabinator.addTab(tab);
                return tab;
            },
        }));
        content
            .ariaLabelledBy(tab)
            .setOwner(tab);
        return tab;
    })
        .setName('Tab');
    const Tabinator = Component_60.default.Builder((component) => {
        const activeTab = (0, State_45.default)(undefined);
        const tabs = (0, State_45.default)([]);
        const tabinator = component
            .and(Block_12.default)
            .type('flush')
            .style('tabinator')
            .ariaRole('tablist')
            .extend(tabinator => ({
            tab: activeTab,
            showTab(newTab) {
                if (tabs.value.includes(newTab))
                    activeTab.value = newTab;
                return tabinator;
            },
            addTab(newTab) {
                if (tabs.value.includes(newTab))
                    return tabinator;
                const selected = activeTab.map(newTab, tab => tab === newTab);
                newTab
                    .setOwner(tabinator)
                    .attributes.bind(selected, 'aria-selected', 'true', 'false')
                    .style.bind(selected, 'tabinator-tab--active')
                    .event.subscribe('click', () => activeTab.value = newTab)
                    .appendTo(tabinator.header);
                newTab.content
                    .style('tabinator-panel--hidden')
                    .appendTo(tabinator.content);
                (0, Objects_9.mutable)(newTab).tabinator = tabinator;
                tabs.value.push(newTab);
                tabs.emit();
                if (tabinator.tab.value === undefined)
                    activeTab.value = newTab;
                return tabinator;
            },
            removeTab(removeTab) {
                if (!tabs.value.includes(removeTab))
                    return tabinator;
                removeTab.setOwner(undefined);
                removeTab.remove();
                tabs.value.filterInPlace(tab => tab !== removeTab);
                tabs.emit();
                if (activeTab.value === removeTab)
                    activeTab.value = undefined;
                return tabinator;
            },
        }));
        tabinator.header.style('tabinator-tab-list');
        tabinator.content.style('tabinator-content');
        activeTab.useManual((tab, oldTab) => {
            const pageNumber = tabs.value.indexOf(tab) + 1;
            const previousPageNumber = (tabs.value.indexOf(oldTab) + 1) || pageNumber;
            const direction = Math.sign(pageNumber - previousPageNumber);
            oldTab?.content
                .style('tabinator-panel--hidden')
                .style.setVariable('page-direction', direction);
            tab?.content
                .style.remove('tabinator-panel--hidden')
                .style.setVariable('page-direction', direction);
        });
        return tabinator;
    });
    exports.default = Tabinator;
});
define("endpoint/author/EndpointAuthorsResolveReferences", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_38) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_38 = __importDefault(Endpoint_38);
    exports.default = (0, Endpoint_38.default)('/authors/resolve', 'get');
});
define("ui/view/following/FollowingAuthorsTab", ["require", "exports", "endpoint/author/EndpointAuthorsResolveReferences", "model/Follows", "model/PagedListData", "ui/Component", "ui/component/Author", "ui/component/core/Link", "ui/component/core/Paginator", "ui/component/core/Placeholder", "ui/component/core/Slot", "ui/component/core/Tabinator", "utility/AbortPromise", "utility/Arrays"], function (require, exports, EndpointAuthorsResolveReferences_1, Follows_4, PagedListData_3, Component_61, Author_2, Link_12, Paginator_4, Placeholder_3, Slot_16, Tabinator_1, AbortPromise_5, Arrays_6) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    EndpointAuthorsResolveReferences_1 = __importDefault(EndpointAuthorsResolveReferences_1);
    Follows_4 = __importDefault(Follows_4);
    PagedListData_3 = __importDefault(PagedListData_3);
    Component_61 = __importDefault(Component_61);
    Author_2 = __importDefault(Author_2);
    Link_12 = __importDefault(Link_12);
    Paginator_4 = __importDefault(Paginator_4);
    Placeholder_3 = __importDefault(Placeholder_3);
    Slot_16 = __importDefault(Slot_16);
    AbortPromise_5 = __importDefault(AbortPromise_5);
    const FollowingAuthorsTab = Component_61.default.Builder((component, type) => {
        const tab = component.and(Tabinator_1.Tab)
            .text.use('view/following/tab/authors')
            .extend(tab => ({}));
        const authors = Follows_4.default.map(tab, manifest => manifest?.[type].author ?? [], (a, b) => true
            && !!a === !!b
            && a.length === b.length
            && a.every(follow => b.some(follow2 => follow.author === follow2.author)));
        let page = 0;
        (0, Slot_16.default)()
            .use(authors, AbortPromise_5.default.asyncFunction(async (signal, slot, follows) => {
            const authors = (0, PagedListData_3.default)(25, {
                async get(page) {
                    const slice = follows.slice(page * 25, (page + 1) * 25) ?? [];
                    if (!slice.length)
                        return null;
                    const response = await EndpointAuthorsResolveReferences_1.default.query(undefined, { authors: slice.map(follow => follow.author).filterInPlace(Arrays_6.NonNullish) });
                    if (toast.handleError(response))
                        return false;
                    return response.data;
                },
            });
            await authors.get(0);
            (0, Paginator_4.default)()
                .type('flush')
                .viewTransition(false)
                .set(authors, (slot, authors) => {
                for (const author of authors) {
                    (0, Link_12.default)(`/author/${author.vanity}`)
                        .and(Author_2.default, author)
                        .viewTransition(false)
                        .appendTo(slot);
                }
            })
                .orElse(slot => (0, Placeholder_3.default)()
                .text.use(`view/${type}/panel/authors/empty`)
                .appendTo(slot))
                .tweak(paginator => paginator.page.asMutable?.setValue(page))
                .tweak(paginator => paginator.page.use(slot, newPage => page = newPage))
                .appendTo(slot);
        }))
            .appendTo(tab.content);
        return tab;
    });
    exports.default = FollowingAuthorsTab;
});
define("ui/component/TagBlock", ["require", "exports", "lang/en-nz", "model/Follows", "model/Session", "model/Tags", "ui/Component", "ui/component/core/Block", "ui/component/core/Button", "ui/component/Tag"], function (require, exports, en_nz_12, Follows_5, Session_18, Tags_5, Component_62, Block_13, Button_23, Tag_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    en_nz_12 = __importDefault(en_nz_12);
    Follows_5 = __importDefault(Follows_5);
    Session_18 = __importDefault(Session_18);
    Tags_5 = __importDefault(Tags_5);
    Component_62 = __importDefault(Component_62);
    Block_13 = __importDefault(Block_13);
    Button_23 = __importDefault(Button_23);
    Tag_3 = __importDefault(Tag_3);
    const TagBlock = Component_62.default.Builder((component, tag) => {
        const block = component
            .and(Block_13.default)
            .style('tag-block')
            .extend(tab => ({}));
        const id = Tags_5.default.toId(tag);
        block.header.style('tag-block-header');
        block.setActionsMenu(popover => {
            Session_18.default.Auth.loggedIn.use(popover, loggedIn => {
                if (!loggedIn)
                    return;
                (0, Button_23.default)()
                    .type('flush')
                    .bindIcon(Follows_5.default.map(popover, () => Follows_5.default.followingTag(id)
                    ? 'circle-check'
                    : 'circle'))
                    .text.bind(Follows_5.default.map(popover, () => Follows_5.default.followingTag(id)
                    ? en_nz_12.default['tag/action/label/unfollow']()
                    : en_nz_12.default['tag/action/label/follow']()))
                    .event.subscribe('click', () => Follows_5.default.toggleFollowingTag(id))
                    .appendTo(popover);
                (0, Button_23.default)()
                    .type('flush')
                    .bindIcon(Follows_5.default.map(popover, () => Follows_5.default.ignoringTag(id)
                    ? 'ban'
                    : 'circle'))
                    .text.bind(Follows_5.default.map(popover, () => Follows_5.default.ignoringTag(id)
                    ? en_nz_12.default['tag/action/label/unignore']()
                    : en_nz_12.default['tag/action/label/ignore']()))
                    .event.subscribe('click', () => Follows_5.default.toggleIgnoringTag(id))
                    .appendTo(popover);
            });
        });
        const info = (0, Component_62.default)()
            .style('tag-block-info')
            .prependTo(block.header);
        const tagComponent = (0, Tag_3.default)(tag)
            .replaceElement(document.createElement('span'))
            .style('tag-block-tag')
            .appendTo(info);
        tagComponent.categoryWrapper?.style('tag-block-tag-category');
        tagComponent.nameWrapper.style('tag-block-tag-name');
        (0, Component_62.default)()
            .style('tag-block-description')
            .setMarkdownContent(tag.description)
            .appendTo(block.content);
        return block;
    });
    exports.default = TagBlock;
});
define("ui/view/following/FollowingTagsTab", ["require", "exports", "model/Follows", "model/Tags", "ui/Component", "ui/component/core/Link", "ui/component/core/Placeholder", "ui/component/core/Slot", "ui/component/core/Tabinator", "ui/component/TagBlock", "utility/AbortPromise", "utility/Arrays"], function (require, exports, Follows_6, Tags_6, Component_63, Link_13, Placeholder_4, Slot_17, Tabinator_2, TagBlock_1, AbortPromise_6, Arrays_7) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Follows_6 = __importDefault(Follows_6);
    Tags_6 = __importDefault(Tags_6);
    Component_63 = __importDefault(Component_63);
    Link_13 = __importDefault(Link_13);
    Placeholder_4 = __importDefault(Placeholder_4);
    Slot_17 = __importDefault(Slot_17);
    TagBlock_1 = __importDefault(TagBlock_1);
    AbortPromise_6 = __importDefault(AbortPromise_6);
    const FollowingTagsTab = Component_63.default.Builder((component, type) => {
        const tab = component.and(Tabinator_2.Tab)
            .text.use('view/following/tab/tags')
            .extend(tab => ({}));
        const tags = Follows_6.default.map(tab, manifest => manifest?.[type].tag ?? [], (a, b) => true
            && !!a === !!b
            && a.length === b.length
            && a.every(follow => b.some(follow2 => follow.tag === follow2.tag)));
        (0, Slot_17.default)()
            .use(tags, AbortPromise_6.default.asyncFunction(async (signal, slot, follows) => {
            const tags = await Tags_6.default.resolve(follows.map(follow => follow.tag).filterInPlace(Arrays_7.NonNullish));
            if (!tags.length)
                return (0, Placeholder_4.default)()
                    .text.use(`view/${type}/panel/tags/empty`)
                    .appendTo(slot);
            for (const tag of tags)
                (0, Link_13.default)(`/tag/${tag.category.toLowerCase()}/${tag.name.toLowerCase()}`)
                    .and(TagBlock_1.default, tag)
                    .viewTransition(false)
                    .appendTo(slot);
        }))
            .appendTo(tab.content);
        return tab;
    });
    exports.default = FollowingTagsTab;
});
define("endpoint/work/EndpointWorksResolveReferences", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_39) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_39 = __importDefault(Endpoint_39);
    exports.default = (0, Endpoint_39.default)('/works/resolve', 'get');
});
define("ui/view/following/FollowingWorksTab", ["require", "exports", "endpoint/work/EndpointWorksResolveReferences", "model/Follows", "model/PagedListData", "model/Works", "ui/Component", "ui/component/core/Link", "ui/component/core/Paginator", "ui/component/core/Placeholder", "ui/component/core/Slot", "ui/component/core/Tabinator", "ui/component/Work", "utility/AbortPromise", "utility/Arrays", "utility/State"], function (require, exports, EndpointWorksResolveReferences_1, Follows_7, PagedListData_4, Works_3, Component_64, Link_14, Paginator_5, Placeholder_5, Slot_18, Tabinator_3, Work_5, AbortPromise_7, Arrays_8, State_46) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    EndpointWorksResolveReferences_1 = __importDefault(EndpointWorksResolveReferences_1);
    Follows_7 = __importDefault(Follows_7);
    PagedListData_4 = __importDefault(PagedListData_4);
    Works_3 = __importDefault(Works_3);
    Component_64 = __importDefault(Component_64);
    Link_14 = __importDefault(Link_14);
    Paginator_5 = __importDefault(Paginator_5);
    Placeholder_5 = __importDefault(Placeholder_5);
    Slot_18 = __importDefault(Slot_18);
    Work_5 = __importDefault(Work_5);
    AbortPromise_7 = __importDefault(AbortPromise_7);
    State_46 = __importDefault(State_46);
    const FollowingWorksTab = Component_64.default.Builder((component, type) => {
        const tab = component.and(Tabinator_3.Tab)
            .text.use('view/following/tab/works')
            .extend(tab => ({}));
        const works = Follows_7.default.map(tab, manifest => manifest?.[type].work ?? [], (a, b) => true
            && !!a === !!b
            && a.length === b.length
            && a.every(follow => b.some(follow2 => follow.work?.author === follow2.work?.author && follow.work?.vanity === follow2.work?.vanity)));
        let page = 0;
        (0, Slot_18.default)()
            .use(works, AbortPromise_7.default.asyncFunction(async (signal, slot, follows) => {
            const authors = (0, State_46.default)([]);
            const works = (0, PagedListData_4.default)(25, {
                async get(page) {
                    const slice = follows.slice(page * 25, (page + 1) * 25) ?? [];
                    if (!slice.length)
                        return null;
                    const response = await EndpointWorksResolveReferences_1.default.query(undefined, { works: slice.map(follow => Works_3.default.reference(follow.work)).filterInPlace(Arrays_8.NonNullish) });
                    if (toast.handleError(response))
                        return false;
                    authors.value.push(...response.data.authors);
                    authors.value.distinctInPlace(author => author.vanity);
                    authors.emit();
                    return response.data.works;
                },
            });
            await works.get(0);
            (0, Paginator_5.default)()
                .type('flush')
                .viewTransition(false)
                .set(works, (slot, works) => {
                for (const work of works) {
                    (0, Link_14.default)(`/work/${work.author}/${work.vanity}`)
                        .and(Work_5.default, work, authors.value.find(author => author.vanity === work.author), true)
                        .viewTransition(false)
                        .appendTo(slot);
                }
            })
                .orElse(slot => (0, Placeholder_5.default)()
                .text.use(`view/${type}/panel/works/empty`)
                .appendTo(slot))
                .tweak(paginator => paginator.page.asMutable?.setValue(page))
                .tweak(paginator => paginator.page.use(slot, newPage => page = newPage))
                .appendTo(slot);
        }))
            .appendTo(tab.content);
        return tab;
    });
    exports.default = FollowingWorksTab;
});
define("ui/view/FollowingView", ["require", "exports", "ui/component/core/Tabinator", "ui/view/following/FollowingAuthorsTab", "ui/view/following/FollowingTagsTab", "ui/view/following/FollowingWorksTab", "ui/view/shared/component/View", "ui/view/shared/component/ViewDefinition"], function (require, exports, Tabinator_4, FollowingAuthorsTab_1, FollowingTagsTab_1, FollowingWorksTab_1, View_6, ViewDefinition_7) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Tabinator_4 = __importDefault(Tabinator_4);
    FollowingAuthorsTab_1 = __importDefault(FollowingAuthorsTab_1);
    FollowingTagsTab_1 = __importDefault(FollowingTagsTab_1);
    FollowingWorksTab_1 = __importDefault(FollowingWorksTab_1);
    View_6 = __importDefault(View_6);
    ViewDefinition_7 = __importDefault(ViewDefinition_7);
    exports.default = (0, ViewDefinition_7.default)({
        create: () => {
            const view = (0, View_6.default)('following');
            view.breadcrumbs.title.text.use('view/following/main/title');
            view.breadcrumbs.description.text.use('view/following/main/description');
            (0, Tabinator_4.default)()
                .addTab((0, FollowingWorksTab_1.default)('following'))
                .addTab((0, FollowingAuthorsTab_1.default)('following'))
                .addTab((0, FollowingTagsTab_1.default)('following'))
                .appendTo(view.content);
            return view;
        },
    });
});
define("endpoint/history/EndpointHistoryGet", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_40) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_40 = __importDefault(Endpoint_40);
    exports.default = (0, Endpoint_40.default)('/history/get', 'get');
});
define("model/Authors", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Authors;
    (function (Authors) {
        function resolve(vanity, authors) {
            return !vanity ? undefined : authors.find(author => author.vanity === vanity);
        }
        Authors.resolve = resolve;
    })(Authors || (Authors = {}));
    exports.default = Authors;
});
define("ui/view/HistoryView", ["require", "exports", "endpoint/history/EndpointHistoryGet", "model/Authors", "model/PagedListData", "model/Works", "ui/component/Chapter", "ui/component/core/Block", "ui/component/core/Link", "ui/component/core/Paginator", "ui/component/Work", "ui/view/shared/component/View", "ui/view/shared/component/ViewDefinition"], function (require, exports, EndpointHistoryGet_1, Authors_1, PagedListData_5, Works_4, Chapter_2, Block_14, Link_15, Paginator_6, Work_6, View_7, ViewDefinition_8) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    EndpointHistoryGet_1 = __importDefault(EndpointHistoryGet_1);
    Authors_1 = __importDefault(Authors_1);
    PagedListData_5 = __importDefault(PagedListData_5);
    Works_4 = __importDefault(Works_4);
    Chapter_2 = __importDefault(Chapter_2);
    Block_14 = __importDefault(Block_14);
    Link_15 = __importDefault(Link_15);
    Paginator_6 = __importDefault(Paginator_6);
    Work_6 = __importDefault(Work_6);
    View_7 = __importDefault(View_7);
    ViewDefinition_8 = __importDefault(ViewDefinition_8);
    exports.default = (0, ViewDefinition_8.default)({
        create: () => {
            const view = (0, View_7.default)('history');
            view.breadcrumbs.title.text.use('view/history/main/title');
            view.breadcrumbs.description.text.use('view/history/main/description');
            (0, Paginator_6.default)()
                .type('flush')
                .set(PagedListData_5.default.fromEndpoint(25, EndpointHistoryGet_1.default.prep(), data => ({
                content: data.items,
                auxiliary: data,
            })), (slot, history, page, data) => {
                slot.style('history');
                let currentWork;
                for (let i = history.length - 1; i >= 0; i--) {
                    const item = history[i];
                    if (item.chapter && !Works_4.default.equals(item.work, currentWork))
                        history.splice(i + 1, 0, { work: item.work, view_time: item.view_time });
                    if (!item.chapter && Works_4.default.equals(item.work, currentWork))
                        history.splice(i, 1);
                    currentWork = item.work;
                }
                let currentChapterBlock;
                for (const historyItem of history) {
                    const work = Works_4.default.resolve(historyItem.work, data.works.value);
                    const author = Authors_1.default.resolve(work?.author, data.authors.value);
                    if (!work || !author)
                        continue;
                    if (!historyItem.chapter) {
                        (0, Link_15.default)(`/work/${author.vanity}/${work.vanity}`)
                            .and(Work_6.default, { ...work, time_last_update: historyItem.view_time }, author)
                            .style('history-work')
                            .appendTo(slot);
                        currentChapterBlock = undefined;
                        continue;
                    }
                    (0, Chapter_2.default)({ ...historyItem.chapter, time_last_update: historyItem.view_time }, work, author)
                        .style('history-chapter')
                        .appendTo(currentChapterBlock ??= (0, Block_14.default)()
                        .style('history-chapter-block', 'chapter-list')
                        .tweak(block => block.content.remove())
                        .appendTo(slot));
                }
            })
                .appendTo(view.content);
            return view;
        },
    });
});
define("ui/view/IgnoringView", ["require", "exports", "ui/component/core/Tabinator", "ui/view/following/FollowingAuthorsTab", "ui/view/following/FollowingTagsTab", "ui/view/following/FollowingWorksTab", "ui/view/shared/component/View", "ui/view/shared/component/ViewDefinition"], function (require, exports, Tabinator_5, FollowingAuthorsTab_2, FollowingTagsTab_2, FollowingWorksTab_2, View_8, ViewDefinition_9) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Tabinator_5 = __importDefault(Tabinator_5);
    FollowingAuthorsTab_2 = __importDefault(FollowingAuthorsTab_2);
    FollowingTagsTab_2 = __importDefault(FollowingTagsTab_2);
    FollowingWorksTab_2 = __importDefault(FollowingWorksTab_2);
    View_8 = __importDefault(View_8);
    ViewDefinition_9 = __importDefault(ViewDefinition_9);
    exports.default = (0, ViewDefinition_9.default)({
        create: () => {
            const view = (0, View_8.default)('ignoring');
            view.breadcrumbs.title.text.use('view/ignoring/main/title');
            view.breadcrumbs.description.text.use('view/ignoring/main/description');
            (0, Tabinator_5.default)()
                .addTab((0, FollowingWorksTab_2.default)('ignoring'))
                .addTab((0, FollowingAuthorsTab_2.default)('ignoring'))
                .addTab((0, FollowingTagsTab_2.default)('ignoring'))
                .appendTo(view.content);
            return view;
        },
    });
});
define("endpoint/feed/EndpointFeedGet", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_41) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_41 = __importDefault(Endpoint_41);
    exports.default = (0, Endpoint_41.default)('/feed/get', 'get');
});
define("endpoint/feed/EndpointFeedGetAuthed", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_42) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_42 = __importDefault(Endpoint_42);
    exports.default = (0, Endpoint_42.default)('/feed/get/authed', 'get');
});
define("ui/view/NewView", ["require", "exports", "endpoint/feed/EndpointFeedGet", "endpoint/feed/EndpointFeedGetAuthed", "model/Session", "ui/component/core/Slot", "ui/component/WorkFeed", "ui/view/shared/component/View", "ui/view/shared/component/ViewDefinition"], function (require, exports, EndpointFeedGet_1, EndpointFeedGetAuthed_1, Session_19, Slot_19, WorkFeed_2, View_9, ViewDefinition_10) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    EndpointFeedGet_1 = __importDefault(EndpointFeedGet_1);
    EndpointFeedGetAuthed_1 = __importDefault(EndpointFeedGetAuthed_1);
    Session_19 = __importDefault(Session_19);
    Slot_19 = __importDefault(Slot_19);
    WorkFeed_2 = __importDefault(WorkFeed_2);
    View_9 = __importDefault(View_9);
    ViewDefinition_10 = __importDefault(ViewDefinition_10);
    exports.default = (0, ViewDefinition_10.default)({
        create: () => {
            const view = (0, View_9.default)('new');
            view.breadcrumbs.title.text.use('view/new/main/title');
            view.breadcrumbs.description.text.use('view/new/main/description');
            (0, Slot_19.default)()
                .use(Session_19.default.Auth.loggedIn, loggedIn => (0, WorkFeed_2.default)()
                .viewTransition('new-view-feed')
                .setFromEndpoint(loggedIn ? EndpointFeedGetAuthed_1.default : EndpointFeedGet_1.default))
                .appendTo(view.content);
            return view;
        },
    });
});
define("endpoint/notification/EndpointNotificationMarkRead", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_43) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_43 = __importDefault(Endpoint_43);
    exports.default = (0, Endpoint_43.default)('/notifications/mark/read', 'post');
});
define("endpoint/notification/EndpointNotificationGetAll", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_44) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_44 = __importDefault(Endpoint_44);
    exports.default = (0, Endpoint_44.default)('/notifications/get/all', 'get');
});
define("endpoint/notification/EndpointNotificationGetCount", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_45) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_45 = __importDefault(Endpoint_45);
    exports.default = (0, Endpoint_45.default)('/notifications/get/count', 'get');
});
define("endpoint/notification/EndpointNotificationMarkUnread", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_46) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_46 = __importDefault(Endpoint_46);
    exports.default = (0, Endpoint_46.default)('/notifications/mark/unread', 'post');
});
define("model/Notifications", ["require", "exports", "endpoint/notification/EndpointNotificationGetAll", "endpoint/notification/EndpointNotificationGetCount", "endpoint/notification/EndpointNotificationMarkRead", "endpoint/notification/EndpointNotificationMarkUnread", "model/PagedListData", "model/Session", "utility/State", "utility/Store", "utility/Time"], function (require, exports, EndpointNotificationGetAll_1, EndpointNotificationGetCount_1, EndpointNotificationMarkRead_1, EndpointNotificationMarkUnread_1, PagedListData_6, Session_20, State_47, Store_3, Time_9) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    EndpointNotificationGetAll_1 = __importDefault(EndpointNotificationGetAll_1);
    EndpointNotificationGetCount_1 = __importDefault(EndpointNotificationGetCount_1);
    EndpointNotificationMarkRead_1 = __importDefault(EndpointNotificationMarkRead_1);
    EndpointNotificationMarkUnread_1 = __importDefault(EndpointNotificationMarkUnread_1);
    PagedListData_6 = __importDefault(PagedListData_6);
    Session_20 = __importDefault(Session_20);
    State_47 = __importDefault(State_47);
    Store_3 = __importDefault(Store_3);
    Time_9 = __importDefault(Time_9);
    var Notifications;
    (function (Notifications) {
        Session_20.default.setClearedWithSessionChange('notifications', () => {
            Notifications.cache.clear();
            simpleCache = [];
            Notifications.authors.value = [];
            Notifications.works.value = [];
            Notifications.chapters.value = [];
            Notifications.comments.value = [];
            Notifications.hasMore.value = false;
            Notifications.unreadCount.value = 0;
            Notifications.lastUpdate.value = 0;
        });
        let simpleCache = Store_3.default.items.notifications?.cache ?? [];
        const pageSize = 25;
        Notifications.cache = (0, PagedListData_6.default)(pageSize, {
            async get(page) {
                const start = page * pageSize;
                const end = (page + 1) * pageSize;
                if (simpleCache.length < start) {
                    const response = await EndpointNotificationGetAll_1.default.query(undefined, { page, page_size: pageSize });
                    if (toast.handleError(response))
                        return false;
                    const data = response.data;
                    if (!data.notifications.length)
                        return null;
                    simpleCache.push(...data.notifications);
                    simpleCache.sort(...sortNotifs);
                    Notifications.authors.value = [...Store_3.default.items.notifications?.authors ?? [], ...data.authors];
                    Notifications.works.value = [...Store_3.default.items.notifications?.works ?? [], ...data.works];
                    Notifications.chapters.value = [...Store_3.default.items.notifications?.chapters ?? [], ...data.chapters];
                    Notifications.comments.value = [...Store_3.default.items.notifications?.comments ?? [], ...data.comments];
                    Store_3.default.items.notifications = {
                        ...Store_3.default.items.notifications,
                        cache: simpleCache,
                        authors: Notifications.authors.value,
                        works: Notifications.works.value,
                        chapters: Notifications.chapters.value,
                        comments: Notifications.comments.value,
                    };
                }
                return simpleCache.slice(start, end);
            },
        });
        Notifications.authors = (0, State_47.default)(Store_3.default.items.notifications?.authors ?? []);
        Notifications.works = (0, State_47.default)(Store_3.default.items.notifications?.works ?? []);
        Notifications.chapters = (0, State_47.default)(Store_3.default.items.notifications?.chapters ?? []);
        Notifications.comments = (0, State_47.default)(Store_3.default.items.notifications?.comments ?? []);
        Notifications.hasMore = (0, State_47.default)(Store_3.default.items.notifications?.hasMore ?? false);
        Notifications.unreadCount = (0, State_47.default)(Store_3.default.items.notifications?.unreadCount ?? 0);
        Notifications.lastUpdate = (0, State_47.default)(Store_3.default.items.notifications?.lastUpdate ?? 0);
        function clear() {
            if (Store_3.default.items.notifications)
                Store_3.default.items.notifications = { ...Store_3.default.items.notifications, lastCheck: 0, lastUpdate: 0 };
        }
        Notifications.clear = clear;
        function check() {
            if (Store_3.default.items.notifications)
                Store_3.default.items.notifications = { ...Store_3.default.items.notifications, lastCheck: 0 };
            return checkNotifications();
        }
        Notifications.check = check;
        async function await() {
            await checkNotifications();
        }
        Notifications.await = await;
        async function markRead(read, ...ids) {
            const endpoint = read ? EndpointNotificationMarkRead_1.default : EndpointNotificationMarkUnread_1.default;
            const response = await endpoint.query({ body: { notification_ids: ids } });
            if (toast.handleError(response))
                return false;
            let modifiedCount = 0;
            for (const notification of simpleCache)
                if (ids.includes(notification.id))
                    if (notification.read !== read) {
                        notification.read = read;
                        modifiedCount++;
                    }
            if (!modifiedCount)
                return true;
            Notifications.unreadCount.value += read ? -modifiedCount : modifiedCount;
            Store_3.default.items.notifications = {
                ...Store_3.default.items.notifications,
                cache: simpleCache,
                unreadCount: Notifications.unreadCount.value,
            };
            for (const page of Notifications.cache.pages)
                if (Array.isArray(page.value) && page.value.some(n => ids.includes(n.id)))
                    page.emit();
            return true;
        }
        Notifications.markRead = markRead;
        const sortNotifs = [
            (notif) => -+notif.read,
            (notif) => -new Date(notif.created_time).getTime(),
        ];
        let activeCheck;
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        setInterval(checkNotifications, Time_9.default.seconds(5));
        async function checkNotifications() {
            if (activeCheck)
                return await activeCheck;
            if (!Session_20.default.Auth.author.value)
                return;
            let notifications = Store_3.default.items.notifications;
            const now = Date.now();
            if (now - (notifications?.lastCheck ?? 0) < Time_9.default.minutes(1))
                return;
            notifications ??= {};
            let resolve;
            activeCheck = new Promise(r => resolve = r);
            try {
                const response = await EndpointNotificationGetCount_1.default.query();
                if (toast.handleError(response))
                    return;
                const time = new Date(response.data.notification_time_last_modified).getTime();
                if (time <= (notifications.lastUpdate ?? 0))
                    return;
                const firstPage = await EndpointNotificationGetAll_1.default.query();
                if (toast.handleError(firstPage))
                    return;
                const count = response.data.unread_notification_count;
                notifications.unreadCount = Notifications.unreadCount.value = count;
                notifications.cache = simpleCache = firstPage.data.notifications.sort(...sortNotifs);
                notifications.authors = Notifications.authors.value = firstPage.data.authors;
                notifications.works = Notifications.works.value = firstPage.data.works;
                notifications.chapters = Notifications.chapters.value = firstPage.data.chapters;
                notifications.comments = Notifications.comments.value = firstPage.data.comments;
                notifications.hasMore = Notifications.hasMore.value = firstPage.has_more;
                notifications.lastUpdate = Notifications.lastUpdate.value = time;
                Notifications.cache.clear();
            }
            finally {
                notifications.lastCheck = Date.now();
                Store_3.default.items.notifications = notifications;
                resolve();
                activeCheck = undefined;
            }
        }
    })(Notifications || (Notifications = {}));
    Object.assign(window, { Notifications });
    exports.default = Notifications;
});
define("model/Comments", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Comments;
    (function (Comments) {
        function resolve(uuid, comments) {
            return !uuid ? undefined : comments.find(comment => comment.comment_id === uuid);
        }
        Comments.resolve = resolve;
    })(Comments || (Comments = {}));
    exports.default = Comments;
});
define("ui/component/Notification", ["require", "exports", "lang/en-nz", "model/Authors", "model/Chapters", "model/Comments", "model/Notifications", "model/TextBody", "model/Works", "ui/Component", "ui/component/core/Button", "ui/component/core/Link", "ui/component/core/Timestamp", "utility/State"], function (require, exports, en_nz_13, Authors_2, Chapters_4, Comments_2, Notifications_1, TextBody_2, Works_5, Component_65, Button_24, Link_16, Timestamp_4, State_48) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    en_nz_13 = __importDefault(en_nz_13);
    Authors_2 = __importDefault(Authors_2);
    Chapters_4 = __importDefault(Chapters_4);
    Comments_2 = __importDefault(Comments_2);
    Notifications_1 = __importDefault(Notifications_1);
    TextBody_2 = __importDefault(TextBody_2);
    Works_5 = __importDefault(Works_5);
    Component_65 = __importDefault(Component_65);
    Button_24 = __importDefault(Button_24);
    Link_16 = __importDefault(Link_16);
    Timestamp_4 = __importDefault(Timestamp_4);
    State_48 = __importDefault(State_48);
    const notificationQuilt = en_nz_13.default;
    const Notification = Component_65.default.Builder('a', (component, data) => {
        const translationFunction = notificationQuilt[`notification/${data.type}`];
        if (!translationFunction)
            return undefined;
        const read = (0, State_48.default)(data.read);
        const notification = component
            .style('notification')
            .style.bind(read, 'notification--read');
        const triggeredBy = Authors_2.default.resolve(data.triggered_by, Notifications_1.default.authors.value);
        const TRIGGERED_BY = !triggeredBy ? undefined : (0, Link_16.default)(`/author/${triggeredBy.vanity}`).text.set(triggeredBy.name);
        const author = Authors_2.default.resolve(data.author, Notifications_1.default.authors.value);
        const AUTHOR = !author ? undefined : (0, Link_16.default)(`/author/${author.vanity}`).text.set(author.name);
        const work = Works_5.default.resolve(data.work, Notifications_1.default.works.value);
        const WORK = !work ? undefined : (0, Link_16.default)(`/work/${work.author}/${work.vanity}`).text.set(work.name);
        const chapter = Chapters_4.default.resolve(data.chapter, Notifications_1.default.chapters.value);
        const CHAPTER = !chapter ? undefined : (0, Link_16.default)(`/work/${chapter.author}/${chapter.work}/chapter/${chapter.url}`).text.set(chapter.name);
        const justMarkedUnread = (0, State_48.default)(false);
        const readButton = (0, Button_24.default)()
            .setIcon('check')
            .type('icon')
            .style('notification-read-button')
            .style.bind(read, 'notification-read-button--read')
            .style.bind(justMarkedUnread, 'notification-read-button--just-marked-unread')
            .tweak(button => button.icon.style('notification-read-button-icon'))
            .event.subscribe('click', async (event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            await toggleRead();
        })
            .appendTo(notification);
        (0, Component_65.default)()
            .style('notification-label')
            .append((0, Component_65.default)().text.set(translationFunction?.({ TRIGGERED_BY, AUTHOR, WORK, CHAPTER })), document.createTextNode('   '), (0, Timestamp_4.default)(data.created_time).style('notification-timestamp'))
            .appendTo(notification);
        const comment = Comments_2.default.resolve(data.comment, Notifications_1.default.comments.value);
        if (comment) {
            (0, Component_65.default)()
                .style('markdown')
                .append(comment.body && (0, Component_65.default)('blockquote')
                .style('notification-comment')
                .setMarkdownContent(TextBody_2.default.resolve(comment.body, Notifications_1.default.authors.value), 64))
                .appendTo(notification);
            if (chapter)
                notification.and(Link_16.default, `/work/${chapter.author}/${chapter.work}/chapter/${chapter.url}`)
                    .event.subscribe('Navigate', toggleRead);
        }
        return notification
            .extend(notification => ({
            readButton,
        }));
        async function toggleRead() {
            if (!await Notifications_1.default.markRead(!read.value, data.id))
                return;
            read.value = !read.value;
            if (!read.value) {
                justMarkedUnread.value = true;
                readButton.hoveredOrFocused.await(component, false, () => justMarkedUnread.value = false);
            }
        }
    });
    exports.default = Notification;
});
define("ui/component/NotificationList", ["require", "exports", "endpoint/notification/EndpointNotificationMarkRead", "model/Notifications", "ui/Component", "ui/component/core/Button", "ui/component/core/Paginator", "ui/component/Notification"], function (require, exports, EndpointNotificationMarkRead_2, Notifications_2, Component_66, Button_25, Paginator_7, Notification_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    EndpointNotificationMarkRead_2 = __importDefault(EndpointNotificationMarkRead_2);
    Notifications_2 = __importDefault(Notifications_2);
    Component_66 = __importDefault(Component_66);
    Button_25 = __importDefault(Button_25);
    Paginator_7 = __importDefault(Paginator_7);
    Notification_1 = __importDefault(Notification_1);
    const NotificationList = Component_66.default.Builder(async (component, onlyUnread, pageSize) => {
        const paginator = component.and(Paginator_7.default)
            .style('notification-list');
        const list = component
            .extend(list => ({
            paginator,
        }));
        (0, Button_25.default)()
            .setIcon('check-double')
            .type('icon')
            .event.subscribe('click', async () => {
            const notifs = paginator.data.value;
            const response = await EndpointNotificationMarkRead_2.default.query({ body: { notification_ids: notifs.map(n => n.id) } });
            if (toast.handleError(response))
                return;
            // TODO figure out how to update render
        })
            .appendTo(paginator.primaryActions);
        paginator.header.style('notification-list-header');
        paginator.title.style('notification-list-title')
            .text.use('masthead/user/notifications/title');
        paginator.content.style('notification-list-content');
        paginator.footer.style('notification-list-footer');
        await Notifications_2.default.await();
        const cache = pageSize === undefined ? Notifications_2.default.cache : Notifications_2.default.cache.resized(pageSize);
        paginator.set(cache, (slot, notifications) => {
            slot.style('notification-list-page');
            for (const notification of notifications) {
                (0, Notification_1.default)(notification)
                    ?.appendTo(slot);
            }
        });
        return list;
    });
    exports.default = NotificationList;
});
define("ui/view/NotificationsView", ["require", "exports", "ui/component/NotificationList", "ui/view/shared/component/View", "ui/view/shared/component/ViewDefinition"], function (require, exports, NotificationList_1, View_10, ViewDefinition_11) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    NotificationList_1 = __importDefault(NotificationList_1);
    View_10 = __importDefault(View_10);
    ViewDefinition_11 = __importDefault(ViewDefinition_11);
    exports.default = (0, ViewDefinition_11.default)({
        async load() {
            const list = await (0, NotificationList_1.default)();
            return { list };
        },
        create(_, { list }) {
            const view = (0, View_10.default)('notifications');
            list.appendTo(view.content);
            return view;
        },
    });
});
define("utility/Errors", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Errors;
    (function (Errors) {
        Errors.Impossible = () => new Error('Something impossible appears to have happened, what are you?');
        Errors.NotFound = () => Object.assign(new Error('Not found'), { code: 404 });
        Errors.BadData = (message) => Object.assign(new Error('Bad data was sent by the server', { cause: message }), { code: 500 });
    })(Errors || (Errors = {}));
    exports.default = Errors;
});
define("ui/view/TagView", ["require", "exports", "endpoint/feed/EndpointFeedGet", "endpoint/feed/EndpointFeedGetAuthed", "model/Session", "model/Tags", "ui/component/TagBlock", "ui/component/WorkFeed", "ui/view/shared/component/View", "ui/view/shared/component/ViewDefinition", "utility/Errors"], function (require, exports, EndpointFeedGet_2, EndpointFeedGetAuthed_2, Session_21, Tags_7, TagBlock_2, WorkFeed_3, View_11, ViewDefinition_12, Errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    EndpointFeedGet_2 = __importDefault(EndpointFeedGet_2);
    EndpointFeedGetAuthed_2 = __importDefault(EndpointFeedGetAuthed_2);
    Session_21 = __importDefault(Session_21);
    Tags_7 = __importDefault(Tags_7);
    TagBlock_2 = __importDefault(TagBlock_2);
    WorkFeed_3 = __importDefault(WorkFeed_3);
    View_11 = __importDefault(View_11);
    ViewDefinition_12 = __importDefault(ViewDefinition_12);
    Errors_1 = __importDefault(Errors_1);
    const fromURLRegex = /(-|^)(.)/g;
    const fromURL = (name) => name.replaceAll(fromURLRegex, (_, dash, char) => `${dash ? ' ' : ''}${char.toUpperCase()}`);
    exports.default = (0, ViewDefinition_12.default)({
        async load(params) {
            const tag = params.custom_name ?? await Tags_7.default.resolve(fromURL(params.category), fromURL(params.name));
            if (!tag)
                throw Errors_1.default.NotFound();
            return { tag };
        },
        create(params, { tag }) {
            const view = (0, View_11.default)('tag');
            (0, TagBlock_2.default)(tag)
                .appendTo(view.content);
            (0, WorkFeed_3.default)()
                .setFromEndpoint((Session_21.default.Auth.author.value ? EndpointFeedGetAuthed_2.default : EndpointFeedGet_2.default)
                .prep(undefined, {
                whitelistTags: [`${tag.category}: ${tag.name}`],
            }))
                .appendTo(view.content);
            return view;
        },
    });
});
define("endpoint/work/EndpointWorkCreate", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_47) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_47 = __importDefault(Endpoint_47);
    exports.default = (0, Endpoint_47.default)('/work/create', 'post');
});
define("endpoint/work/EndpointWorkUpdate", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_48) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_48 = __importDefault(Endpoint_48);
    exports.default = (0, Endpoint_48.default)('/work/{author}/{vanity}/update', 'post');
});
define("ui/component/core/Textarea", ["require", "exports", "lang/en-nz", "ui/Component", "ui/component/core/ext/Input", "ui/utility/StringApplicator", "utility/State"], function (require, exports, en_nz_14, Component_67, Input_6, StringApplicator_6, State_49) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    en_nz_14 = __importDefault(en_nz_14);
    Component_67 = __importDefault(Component_67);
    Input_6 = __importDefault(Input_6);
    StringApplicator_6 = __importDefault(StringApplicator_6);
    State_49 = __importDefault(State_49);
    const Textarea = Component_67.default.Builder((component) => {
        let shouldIgnoreInputEvent = false;
        const contenteditable = (0, Component_67.default)()
            .style('text-input', 'text-area')
            .attributes.set('contenteditable', 'plaintext-only')
            .ariaRole('textbox')
            .attributes.set('aria-multiline', 'true');
        const hiddenInput = (0, Component_67.default)('input')
            .style('text-area-validity-pipe-input')
            .tabIndex('programmatic')
            .attributes.set('type', 'text')
            .setName(`text-area-validity-pipe-input-${Math.random().toString(36).slice(2)}`);
        const state = (0, State_49.default)('');
        const input = component
            .and(Input_6.default)
            .style('text-area-wrapper')
            .pipeValidity(hiddenInput)
            .append(contenteditable, hiddenInput)
            .extend(input => ({
            value: '',
            state,
            default: (0, StringApplicator_6.default)(input, value => {
                if (input.value === '') {
                    input.value = value ?? '';
                    state.value = value ?? '';
                    input.length.asMutable?.setValue(value?.length ?? 0);
                }
            }),
            placeholder: (0, StringApplicator_6.default)(input, value => {
                contenteditable.attributes.set('placeholder', value);
            }),
            ignoreInputEvent: (ignore = true) => {
                shouldIgnoreInputEvent = ignore;
                return input;
            },
            setLabel(label) {
                contenteditable.setName(label?.for);
                contenteditable.setId(label?.for);
                label?.setInput(input);
                contenteditable.ariaLabelledBy(label);
                return input;
            },
        }))
            .extendMagic('value', input => ({
            get: () => contenteditable.element.textContent || '',
            set: (value) => {
                contenteditable.element.textContent = value;
                state.value = value;
                input.length.asMutable?.setValue(value.length);
            },
        }));
        input.length.asMutable?.setValue(0);
        input.onRooted(input => {
            contenteditable.event.subscribe(['input', 'change'], event => {
                if (shouldIgnoreInputEvent)
                    return;
                state.value = input.value;
                input.length.asMutable?.setValue(input.value.length);
                let invalid;
                if ((input.length.value ?? 0) > (input.maxLength.value ?? Infinity))
                    invalid = en_nz_14.default['shared/form/invalid/too-long']();
                input.setCustomInvalidMessage(invalid);
            });
        });
        return input;
    });
    exports.default = Textarea;
});
define("ui/view/work/WorkEditForm", ["require", "exports", "endpoint/work/EndpointWorkCreate", "endpoint/work/EndpointWorkUpdate", "lang/en-nz", "model/FormInputLengths", "model/Session", "ui/Component", "ui/component/core/Block", "ui/component/core/Form", "ui/component/core/LabelledTable", "ui/component/core/RadioRow", "ui/component/core/Textarea", "ui/component/core/TextEditor", "ui/component/core/TextInput", "ui/component/core/toast/Toast", "ui/component/TagsEditor", "ui/component/VanityInput"], function (require, exports, EndpointWorkCreate_1, EndpointWorkUpdate_1, en_nz_15, FormInputLengths_5, Session_22, Component_68, Block_15, Form_3, LabelledTable_3, RadioRow_2, Textarea_1, TextEditor_4, TextInput_6, Toast_4, TagsEditor_2, VanityInput_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    EndpointWorkCreate_1 = __importDefault(EndpointWorkCreate_1);
    EndpointWorkUpdate_1 = __importDefault(EndpointWorkUpdate_1);
    en_nz_15 = __importDefault(en_nz_15);
    FormInputLengths_5 = __importDefault(FormInputLengths_5);
    Session_22 = __importDefault(Session_22);
    Component_68 = __importDefault(Component_68);
    Block_15 = __importDefault(Block_15);
    Form_3 = __importDefault(Form_3);
    LabelledTable_3 = __importDefault(LabelledTable_3);
    RadioRow_2 = __importDefault(RadioRow_2);
    Textarea_1 = __importDefault(Textarea_1);
    TextEditor_4 = __importDefault(TextEditor_4);
    TextInput_6 = __importDefault(TextInput_6);
    TagsEditor_2 = __importDefault(TagsEditor_2);
    exports.default = Component_68.default.Builder((component, state) => {
        const block = component.and(Block_15.default);
        const form = block.and(Form_3.default, block.title);
        form.viewTransition('work-edit-form');
        const type = state.value ? 'update' : 'create';
        form.title.text.use(`view/work-edit/${type}/title`);
        form.setName(en_nz_15.default[`view/work-edit/${type}/title`]().toString());
        // if (params.type === "create")
        // 	form.description.text.use("view/work-edit/create/description")
        form.submit.textWrapper.text.use(`view/work-edit/${type}/submit`);
        const table = (0, LabelledTable_3.default)().appendTo(form.content);
        const nameInput = (0, TextInput_6.default)()
            .setRequired()
            .default.bind(state.map(component, work => work?.name))
            .hint.use('view/work-edit/shared/form/name/hint')
            .setMaxLength(FormInputLengths_5.default.value?.work.name);
        table.label(label => label.text.use('view/work-edit/shared/form/name/label'))
            .content((content, label) => content.append(nameInput.setLabel(label)));
        const vanityInput = (0, TextInput_6.default)()
            .placeholder.bind(nameInput.state
            .map(component, name => (0, VanityInput_2.FilterVanity)(name)))
            .default.bind(state.map(component, work => work?.vanity))
            .filter(VanityInput_2.FilterVanity)
            .hint.use('view/work-edit/shared/form/vanity/hint')
            .setMaxLength(FormInputLengths_5.default.value?.work.vanity);
        table.label(label => label.text.use('view/work-edit/shared/form/vanity/label'))
            .content((content, label) => content.append(vanityInput.setLabel(label)));
        const descriptionInput = (0, Textarea_1.default)()
            .default.bind(state.map(component, work => work?.description))
            .hint.use('view/work-edit/shared/form/description/hint')
            .setMaxLength(FormInputLengths_5.default.value?.work.description);
        table.label(label => label.text.use('view/work-edit/shared/form/description/label'))
            .content((content, label) => content.append(descriptionInput.setLabel(label)));
        const synopsisInput = (0, TextEditor_4.default)()
            .default.bind(state.map(component, work => work?.synopsis.body))
            .hint.use('view/work-edit/shared/form/synopsis/hint')
            .setMaxLength(FormInputLengths_5.default.value?.work.synopsis);
        table.label(label => label.text.use('view/work-edit/shared/form/synopsis/label'))
            .content((content, label) => content.append(synopsisInput.setLabel(label)));
        const tagsEditor = (0, TagsEditor_2.default)()
            .default.bind(state)
            .setMaxLengthGlobal(FormInputLengths_5.default.value?.work_tags.global)
            .setMaxLengthCustom(FormInputLengths_5.default.value?.work_tags.custom);
        table.label(label => label.text.use('view/work-edit/shared/form/tags/label'))
            .content((content, label) => content.append(tagsEditor.setLabel(label)));
        const VisibilityRadioInitialiser = (radio, id) => radio
            .text.use(`view/work-edit/shared/form/visibility/${id.toLowerCase()}`);
        const visibility = (0, RadioRow_2.default)()
            .hint.use('view/work-edit/shared/form/visibility/hint')
            .add('Public', VisibilityRadioInitialiser)
            .add('Private', VisibilityRadioInitialiser)
            .default.bind(state.map(component, work => work?.visibility ?? 'Private'));
        table.label(label => label.text.use('view/work-edit/shared/form/visibility/label'))
            .content((content, label) => content.append(visibility.setLabel(label)));
        form.event.subscribe('submit', async (event) => {
            event.preventDefault();
            const name = nameInput.value;
            const response = await (() => {
                switch (type) {
                    case 'create':
                        return EndpointWorkCreate_1.default.query({
                            body: {
                                name,
                                vanity: vanityInput.value,
                                description: descriptionInput.value,
                                synopsis: synopsisInput.useMarkdown(),
                                visibility: visibility.selection.value ?? 'Private',
                                ...tagsEditor.state.value,
                            },
                        });
                    case 'update': {
                        if (!state.value)
                            return;
                        const authorVanity = Session_22.default.Auth.author.value?.vanity;
                        if (!authorVanity)
                            return new Error('Cannot update a work when not signed in');
                        return EndpointWorkUpdate_1.default.query({
                            params: {
                                author: authorVanity,
                                vanity: state.value.vanity,
                            },
                            body: {
                                name,
                                vanity: vanityInput.value,
                                description: descriptionInput.value,
                                synopsis: synopsisInput.useMarkdown(),
                                visibility: visibility.selection.value ?? 'Private',
                                ...tagsEditor.state.value,
                            },
                        });
                    }
                }
            })();
            if (toast.handleError(response, quilt => quilt['view/work-edit/shared/toast/failed-to-save'](name)))
                return;
            toast.success(Toast_4.TOAST_SUCCESS, quilt => quilt['view/work-edit/shared/toast/saved'](name));
            state.value = response?.data;
        });
        return form;
    });
});
define("ui/view/WorkEditView", ["require", "exports", "endpoint/work/EndpointWorkGet", "model/Works", "ui/Component", "ui/component/core/ActionRow", "ui/component/core/Button", "ui/component/core/InfoDialog", "ui/component/core/Slot", "ui/view/shared/component/View", "ui/view/shared/component/ViewDefinition", "ui/view/shared/ext/ViewTransition", "ui/view/work/WorkEditForm", "utility/State"], function (require, exports, EndpointWorkGet_3, Works_6, Component_69, ActionRow_5, Button_26, InfoDialog_2, Slot_20, View_12, ViewDefinition_13, ViewTransition_3, WorkEditForm_1, State_50) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    EndpointWorkGet_3 = __importDefault(EndpointWorkGet_3);
    Works_6 = __importDefault(Works_6);
    Component_69 = __importDefault(Component_69);
    ActionRow_5 = __importDefault(ActionRow_5);
    Button_26 = __importDefault(Button_26);
    InfoDialog_2 = __importDefault(InfoDialog_2);
    Slot_20 = __importDefault(Slot_20);
    View_12 = __importDefault(View_12);
    ViewDefinition_13 = __importDefault(ViewDefinition_13);
    ViewTransition_3 = __importDefault(ViewTransition_3);
    WorkEditForm_1 = __importDefault(WorkEditForm_1);
    State_50 = __importDefault(State_50);
    exports.default = (0, ViewDefinition_13.default)({
        requiresLogin: true,
        async load(params) {
            const response = params && await EndpointWorkGet_3.default.query({ params });
            if (response instanceof Error)
                throw response;
            const owner = (0, Component_69.default)();
            const work = response?.data;
            if (!work)
                await InfoDialog_2.default.prompt(owner, {
                    titleTranslation: 'shared/prompt/beta-restrictions/title',
                    bodyTranslation: 'shared/prompt/beta-restrictions/description',
                });
            owner.remove();
            return { work };
        },
        create(params, { work }) {
            const id = 'work-edit';
            const view = (0, View_12.default)(id);
            const state = (0, State_50.default)(work);
            const editFormState = (0, State_50.default)(work);
            state.use(view, work => view.breadcrumbs.setBackButton(work && `/work/${work.author}/${work.vanity}`, button => work && button.subText.set(work.name)));
            (0, Slot_20.default)()
                .use(state, () => (0, WorkEditForm_1.default)(editFormState).subviewTransition(id))
                .appendTo(view.content);
            (0, Slot_20.default)()
                .use(state, () => createActionRow()?.subviewTransition(id))
                .appendTo(view.content);
            editFormState.subscribe(view, work => ViewTransition_3.default.perform('subview', id, () => state.value = work));
            return view;
            function createActionRow() {
                const work = state.value;
                if (!work)
                    return;
                return (0, ActionRow_5.default)()
                    .viewTransition('work-edit-action-row')
                    .tweak(row => row.left
                    .append((0, Button_26.default)()
                    .setIcon('plus')
                    .text.use('view/work-edit/update/action/new-chapter')
                    .event.subscribe('click', () => navigate.toURL(`/work/${work.author}/${work.vanity}/chapter/new`))))
                    .tweak(row => row.right
                    .append((0, Button_26.default)()
                    .setIcon('trash')
                    .text.use('view/work-edit/update/action/delete')
                    .event.subscribe('click', async () => Works_6.default.delete(work, view))));
            }
        },
    });
});
define("endpoint/chapter/EndpointChapterGetAll", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_49) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_49 = __importDefault(Endpoint_49);
    exports.default = (0, Endpoint_49.default)('/work/{author}/{vanity}/chapters/list', 'get');
});
define("endpoint/chapter/EndpointChapterReorder", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_50) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_50 = __importDefault(Endpoint_50);
    exports.default = (0, Endpoint_50.default)('/work/{author}/{work}/chapter/{url}/reorder', 'post');
});
define("endpoint/history/EndpointHistoryAddWork", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_51) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_51 = __importDefault(Endpoint_51);
    exports.default = (0, Endpoint_51.default)('/history/add/{author}/{vanity}', 'post');
});
define("ui/view/WorkView", ["require", "exports", "endpoint/chapter/EndpointChapterGetAll", "endpoint/chapter/EndpointChapterReorder", "endpoint/history/EndpointHistoryAddWork", "endpoint/work/EndpointWorkGet", "model/PagedListData", "model/Session", "ui/Component", "ui/component/Chapter", "ui/component/core/Block", "ui/component/core/Button", "ui/component/core/Paginator", "ui/component/core/Placeholder", "ui/component/core/Slot", "ui/component/Work", "ui/view/shared/component/View", "ui/view/shared/component/ViewDefinition", "utility/Errors", "utility/State"], function (require, exports, EndpointChapterGetAll_1, EndpointChapterReorder_1, EndpointHistoryAddWork_1, EndpointWorkGet_4, PagedListData_7, Session_23, Component_70, Chapter_3, Block_16, Button_27, Paginator_8, Placeholder_6, Slot_21, Work_7, View_13, ViewDefinition_14, Errors_2, State_51) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    EndpointChapterGetAll_1 = __importDefault(EndpointChapterGetAll_1);
    EndpointChapterReorder_1 = __importDefault(EndpointChapterReorder_1);
    EndpointHistoryAddWork_1 = __importDefault(EndpointHistoryAddWork_1);
    EndpointWorkGet_4 = __importDefault(EndpointWorkGet_4);
    PagedListData_7 = __importDefault(PagedListData_7);
    Session_23 = __importDefault(Session_23);
    Component_70 = __importDefault(Component_70);
    Chapter_3 = __importDefault(Chapter_3);
    Block_16 = __importDefault(Block_16);
    Button_27 = __importDefault(Button_27);
    Paginator_8 = __importDefault(Paginator_8);
    Placeholder_6 = __importDefault(Placeholder_6);
    Slot_21 = __importDefault(Slot_21);
    Work_7 = __importDefault(Work_7);
    View_13 = __importDefault(View_13);
    ViewDefinition_14 = __importDefault(ViewDefinition_14);
    Errors_2 = __importDefault(Errors_2);
    State_51 = __importDefault(State_51);
    exports.default = (0, ViewDefinition_14.default)({
        async load(params) {
            const response = await EndpointWorkGet_4.default.query({ params });
            if (response instanceof Error)
                throw response;
            const work = response.data;
            return { work };
        },
        create(params, { work: workData }) {
            const view = (0, View_13.default)('work');
            if (Session_23.default.Auth.loggedIn.value)
                void EndpointHistoryAddWork_1.default.query({ params });
            const authorData = workData.synopsis.mentions.find(author => author.vanity === params.author);
            if (!authorData)
                throw Errors_2.default.BadData('Work author not in synopsis authors');
            (0, Work_7.default)(workData, authorData)
                .viewTransition('work-view-work')
                .setContainsHeading()
                .appendTo(view.content);
            const movingChapter = (0, State_51.default)(undefined);
            const chaptersListState = (0, State_51.default)(null);
            (0, Slot_21.default)()
                .use(chaptersListState, () => (0, Paginator_8.default)()
                .viewTransition('work-view-chapters')
                .style('view-type-work-chapter-list')
                .tweak(paginator => {
                paginator.title.text.use('view/work/chapters/title');
                (0, Slot_21.default)()
                    .use(movingChapter, (slot, movingChapterData) => {
                    if (!movingChapterData)
                        return;
                    (0, Chapter_3.default)(movingChapterData, workData, authorData)
                        .style('view-type-work-chapter-list-chapter-moving')
                        .append(ReorderingIcon())
                        .tweakActions(actions => actions
                        .insertAction('reorder', 'before', 'delete', Session_23.default.Auth.author, (slot, self) => true
                        && authorData.vanity === self?.vanity
                        && (0, Button_27.default)()
                            .type('flush')
                            .setIcon('arrow-up-arrow-down')
                            .text.use('chapter/action/label/reorder-cancel')
                            .event.subscribe('click', () => movingChapter.value = undefined)))
                        .appendTo(slot);
                })
                    .appendTo(paginator.header);
            })
                .set(PagedListData_7.default.fromEndpoint(25, EndpointChapterGetAll_1.default.prep({
                params: {
                    author: params.author,
                    vanity: params.vanity,
                },
            })), (slot, chapters) => {
                slot.style('chapter-list')
                    .style.bind(movingChapter.truthy, 'view-type-work-chapter-list--moving-chapter');
                for (const chapterData of chapters) {
                    MoveSlot('before', chapterData).appendTo(slot);
                    const isMoving = movingChapter.map(slot, movingChapter => movingChapter === chapterData);
                    (0, Chapter_3.default)(chapterData, workData, authorData)
                        .style('view-type-work-chapter')
                        .style.bind(isMoving, 'view-type-work-chapter--moving')
                        .style.bind(movingChapter.truthy, 'view-type-work-chapter--has-moving-sibling')
                        .attributes.bind(movingChapter.truthy, 'inert')
                        .tweak(chapter => {
                        chapter.number.style.bind(isMoving, 'view-type-work-chapter--moving-number');
                        chapter.chapterName.style.bind(isMoving, 'view-type-work-chapter--moving-name');
                        chapter.timestamp?.style.bind(isMoving, 'view-type-work-chapter--moving-timestamp');
                        (0, Slot_21.default)()
                            .if(isMoving, () => ReorderingIcon()
                            .style('view-type-work-chapter-reordering-icon--slot'))
                            .appendTo(chapter);
                    })
                        .tweakActions(actions => actions
                        .insertAction('reorder', 'before', 'delete', Session_23.default.Auth.author, (slot, self) => true
                        && authorData.vanity === self?.vanity
                        && (0, Slot_21.default)()
                            .use(movingChapter, (slot, movingChapterData) => {
                            (0, Button_27.default)()
                                .type('flush')
                                .setIcon('arrow-up-arrow-down')
                                .text.use(movingChapterData === chapterData ? 'chapter/action/label/reorder-cancel' : 'chapter/action/label/reorder')
                                .event.subscribe('click', () => movingChapter.value = movingChapter.value === chapterData ? undefined : chapterData)
                                .appendTo(slot);
                        })))
                        .appendTo(slot);
                }
                const lastChapter = chapters.at(-1);
                if (lastChapter)
                    MoveSlot('after', lastChapter)
                        .appendTo(slot);
                function MoveSlot(direction, chapter) {
                    return (0, Component_70.default)()
                        .style('view-type-work-chapter-slot-wrapper')
                        .style.bind(movingChapter.truthy, 'view-type-work-chapter-slot-wrapper--has-moving-chapter')
                        .append((0, Button_27.default)()
                        .style('chapter', 'view-type-work-chapter-slot')
                        .event.subscribe('click', async () => {
                        const movingChapterData = movingChapter.value;
                        if (!movingChapterData)
                            return;
                        if (movingChapterData.url === chapter.url) {
                            // no-op
                            movingChapter.value = undefined;
                            return;
                        }
                        const response = await EndpointChapterReorder_1.default.query({
                            params: movingChapterData,
                            body: {
                                relative_to: chapter.url,
                                position: direction,
                            },
                        });
                        movingChapter.value = undefined;
                        if (toast.handleError(response))
                            return;
                        chaptersListState.emit();
                    }));
                }
            })
                .orElse(slot => (0, Block_16.default)()
                .type('flush')
                .tweak(block => (0, Placeholder_6.default)()
                .text.use('view/work/chapters/content/empty')
                .appendTo(block.content))
                .appendTo(slot))
                .setActionsMenu(popover => popover
                .append((0, Slot_21.default)()
                .if(Session_23.default.Auth.author.map(popover, author => author?.vanity === params.author), () => (0, Button_27.default)()
                .setIcon('plus')
                .type('flush')
                .text.use('view/work/chapters/action/label/new')
                .event.subscribe('click', () => navigate.toURL(`/work/${params.author}/${params.vanity}/chapter/new`))))))
                .appendTo(view.content);
            return view;
        },
    });
    function ReorderingIcon() {
        return (0, Component_70.default)()
            .and(Button_27.default)
            .ariaHidden()
            .tabIndex('programmatic')
            .setIcon('arrow-up-arrow-down')
            .type('icon')
            .style('view-type-work-chapter-reordering-icon');
    }
});
define("navigation/Routes", ["require", "exports", "navigation/Route", "navigation/RoutePath", "ui/view/AccountView", "ui/view/AuthorView", "ui/view/ChapterEditView", "ui/view/ChapterView", "ui/view/DebugView", "ui/view/FeedView", "ui/view/FollowingView", "ui/view/HistoryView", "ui/view/IgnoringView", "ui/view/NewView", "ui/view/NotificationsView", "ui/view/TagView", "ui/view/WorkEditView", "ui/view/WorkView"], function (require, exports, Route_1, RoutePath_3, AccountView_1, AuthorView_1, ChapterEditView_1, ChapterView_1, DebugView_1, FeedView_1, FollowingView_1, HistoryView_1, IgnoringView_1, NewView_1, NotificationsView_1, TagView_1, WorkEditView_1, WorkView_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Route_1 = __importDefault(Route_1);
    AccountView_1 = __importDefault(AccountView_1);
    AuthorView_1 = __importDefault(AuthorView_1);
    ChapterEditView_1 = __importDefault(ChapterEditView_1);
    ChapterView_1 = __importDefault(ChapterView_1);
    DebugView_1 = __importDefault(DebugView_1);
    FeedView_1 = __importDefault(FeedView_1);
    FollowingView_1 = __importDefault(FollowingView_1);
    HistoryView_1 = __importDefault(HistoryView_1);
    IgnoringView_1 = __importDefault(IgnoringView_1);
    NewView_1 = __importDefault(NewView_1);
    NotificationsView_1 = __importDefault(NotificationsView_1);
    TagView_1 = __importDefault(TagView_1);
    WorkEditView_1 = __importDefault(WorkEditView_1);
    WorkView_1 = __importDefault(WorkView_1);
    const Routes = [
        (0, Route_1.default)('/debug', DebugView_1.default.navigate),
        (0, Route_1.default)('/', NewView_1.default.navigate),
        (0, Route_1.default)('/feed', FeedView_1.default.navigate),
        (0, Route_1.default)('/history', HistoryView_1.default.navigate),
        (0, Route_1.default)('/following', FollowingView_1.default.navigate),
        (0, Route_1.default)('/ignoring', IgnoringView_1.default.navigate),
        (0, Route_1.default)('/account', AccountView_1.default.navigate),
        (0, Route_1.default)('/author/$vanity', AuthorView_1.default.navigate),
        (0, Route_1.default)('/notifications', NotificationsView_1.default.navigate),
        (0, Route_1.default)('/work/new', WorkEditView_1.default.navigate),
        (0, Route_1.default)('/work/$author/$vanity', WorkView_1.default.navigate),
        (0, Route_1.default)('/work/$author/$vanity/edit', WorkEditView_1.default.navigate),
        (0, Route_1.default)('/work/$author/$work/chapter/new', ChapterEditView_1.default.navigate),
        (0, Route_1.default)('/work/$author/$work/chapter/$url', ChapterView_1.default.navigate),
        (0, Route_1.default)('/work/$author/$work/chapter/$url/edit', ChapterEditView_1.default.navigate),
        (0, Route_1.default)('/tag/$category/$name', TagView_1.default.navigate),
        // Route('/tag/$custom_name', TagView.navigate),
    ];
    RoutePath_3.RoutePath.setRoutes(Routes);
    exports.default = Routes;
});
define("navigation/RoutePath", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RoutePath = void 0;
    var RoutePath;
    (function (RoutePath) {
        let routes;
        function setRoutes(routesIn) {
            routes = routesIn;
        }
        RoutePath.setRoutes = setRoutes;
        function is(value) {
            return !!value && routes.some(route => route.path === value || !!route.match(value));
        }
        RoutePath.is = is;
    })(RoutePath || (exports.RoutePath = RoutePath = {}));
});
define("ui/utility/StringApplicator", ["require", "exports", "lang/en-nz", "utility/State"], function (require, exports, en_nz_16, State_52) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.QuiltHelper = exports.Quilt = void 0;
    en_nz_16 = __importStar(en_nz_16);
    State_52 = __importDefault(State_52);
    Object.assign(window, { quilt: en_nz_16.default });
    var Quilt;
    (function (Quilt) {
        function fake(text) {
            const weave = { content: [{ content: text }], toString: () => text };
            return () => weave;
        }
        Quilt.fake = fake;
    })(Quilt || (exports.Quilt = Quilt = {}));
    var QuiltHelper;
    (function (QuiltHelper) {
        let isComponent;
        let Break;
        let Link;
        let ExternalLink;
        function init(dependencies) {
            const { Component } = dependencies;
            isComponent = Component.is;
            Link = dependencies.Link;
            ExternalLink = dependencies.ExternalLink;
            Break = Component
                .Builder('br', component => component.style('break'))
                .setName('Break');
        }
        QuiltHelper.init = init;
        function renderWeave(weave) {
            return weave.content.map(renderWeft);
        }
        QuiltHelper.renderWeave = renderWeave;
        // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
        function arg(arg) {
            if (typeof arg === 'object' && arg && 'map' in arg)
                arg = arg.value;
            if (typeof arg === 'function')
                arg = arg(en_nz_16.default, QuiltHelper);
            if (typeof arg === 'string' && arg in en_nz_16.default)
                arg = en_nz_16.default[arg]();
            return arg;
        }
        QuiltHelper.arg = arg;
        function toString(arg) {
            if (State_52.default.is(arg))
                arg = arg.value;
            if (typeof arg !== 'function') {
                const key = arg;
                arg = () => en_nz_16.default[key]();
            }
            return arg(en_nz_16.default, QuiltHelper).toString();
        }
        QuiltHelper.toString = toString;
        function isPlaintextWeft(weft) {
            return true
                && typeof weft.content === 'string'
                && !weft.content.includes('\n');
        }
        function renderWeft(weft) {
            if (isPlaintextWeft(weft))
                return document.createTextNode(weft.content);
            let element;
            const tag = weft.tag?.toLowerCase();
            if (tag) {
                if (tag.startsWith('link(')) {
                    const href = tag.slice(5, -1);
                    const link = href.startsWith('/')
                        ? Link(href)
                        : ExternalLink(href);
                    element = link.element;
                }
                switch (tag) {
                    case 'b':
                        element = document.createElement('strong');
                        break;
                    case 'i':
                        element = document.createElement('em');
                        break;
                    case 'u':
                        element = document.createElement('u');
                        break;
                    case 's':
                        element = document.createElement('s');
                        break;
                }
            }
            element ??= document.createElement('span');
            if (Array.isArray(weft.content))
                element.append(...weft.content.map(renderWeft));
            else if (typeof weft.content === 'object' && weft.content) {
                if (!en_nz_16.WeavingArg.isRenderable(weft.content))
                    element.append(...renderWeave(weft.content));
                else if (isComponent(weft.content))
                    element.append(weft.content.element);
                else if (weft.content instanceof Node)
                    element.append(weft.content);
                else
                    console.warn('Unrenderable weave content:', weft.content);
            }
            else {
                const value = `${weft.content ?? ''}`;
                const texts = value.split('\n');
                for (let i = 0; i < texts.length; i++) {
                    if (i > 0)
                        element.append(Break().element);
                    element.append(document.createTextNode(texts[i]));
                }
            }
            return element;
        }
    })(QuiltHelper || (exports.QuiltHelper = QuiltHelper = {}));
    function BaseStringApplicator(host, defaultValue, set) {
        let translationHandler;
        let unbind;
        const result = makeApplicator(host);
        const setInternal = set.bind(null, result);
        return result;
        function makeApplicator(host) {
            return {
                state: (0, State_52.default)(defaultValue),
                set: value => {
                    unbind?.();
                    translationHandler = undefined;
                    setInternal(value);
                    return host;
                },
                use: translation => {
                    unbind?.();
                    if (typeof translation === 'string') {
                        translationHandler = undefined;
                        setInternal(en_nz_16.default[translation]());
                        return host;
                    }
                    translationHandler = translation;
                    result.refresh();
                    return host;
                },
                bind: state => {
                    translationHandler = undefined;
                    unbind?.();
                    unbind = undefined;
                    if (state === undefined || state === null) {
                        setInternal(defaultValue);
                        return host;
                    }
                    if (!State_52.default.is(state)) {
                        setInternal(state);
                        return host;
                    }
                    unbind = state?.use(host, setInternal);
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
                    setInternal(translationHandler(en_nz_16.default, QuiltHelper).toString());
                },
                rehost: makeApplicator,
            };
        }
    }
    function StringApplicator(host, defaultValueOrApply, maybeApply) {
        const defaultValue = !maybeApply ? undefined : defaultValueOrApply;
        const apply = (maybeApply ?? defaultValueOrApply);
        return BaseStringApplicator(host, defaultValue, (result, value) => {
            if (typeof value === 'object' && value !== null)
                value = value.toString();
            if (result.state.value !== value) {
                result.state.asMutable?.setValue(value);
                apply(value ?? undefined);
            }
        });
    }
    (function (StringApplicator) {
        function render(content) {
            if (typeof content === 'string')
                content = { content: [{ content }] };
            return !content ? [] : QuiltHelper.renderWeave(content);
        }
        StringApplicator.render = render;
        function Nodes(host, defaultValueOrApply, maybeApply) {
            const defaultValue = !maybeApply ? undefined : defaultValueOrApply;
            const apply = (maybeApply ?? defaultValueOrApply);
            return BaseStringApplicator(host, defaultValue, (result, value) => {
                const valueString = typeof value === 'object' && value !== null ? value.toString() : value;
                if (result.state.value === valueString)
                    return;
                result.state.asMutable?.setValue(valueString);
                apply(render(value));
            });
        }
        StringApplicator.Nodes = Nodes;
    })(StringApplicator || (StringApplicator = {}));
    exports.default = StringApplicator;
});
define("ui/utility/TextManipulator", ["require", "exports", "ui/utility/StringApplicator"], function (require, exports, StringApplicator_7) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    StringApplicator_7 = __importDefault(StringApplicator_7);
    function TextManipulator(component, target = component) {
        return apply(StringApplicator_7.default.Nodes(component, nodes => {
            target.removeContents();
            target.append(...nodes);
            return nodes;
        }));
        function apply(applicator) {
            const rehost = applicator.rehost;
            return Object.assign(applicator, {
                prepend(text) {
                    target.prepend(...StringApplicator_7.default.render(text));
                    return component;
                },
                append(text) {
                    target.append(...StringApplicator_7.default.render(text));
                    return component;
                },
                rehost(component) {
                    return apply(rehost(component));
                },
            });
        }
    }
    exports.default = TextManipulator;
});
define("ui/component/core/Button", ["require", "exports", "ui/Component", "ui/utility/BrowserListener", "ui/utility/FontsListener", "ui/utility/TypeManipulator", "utility/State", "utility/Type"], function (require, exports, Component_71, BrowserListener_1, FontsListener_1, TypeManipulator_3, State_53, Type_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Component_71 = __importDefault(Component_71);
    BrowserListener_1 = __importDefault(BrowserListener_1);
    FontsListener_1 = __importDefault(FontsListener_1);
    TypeManipulator_3 = __importDefault(TypeManipulator_3);
    State_53 = __importDefault(State_53);
    Type_2 = __importDefault(Type_2);
    const Button = Component_71.default.Builder('button', (component) => {
        const disabledReasons = new Set();
        const disabled = State_53.default.Generator(() => !!disabledReasons.size);
        const hasSubtext = (0, State_53.default)(false);
        let icon;
        const unuseDisabledStateMap = new WeakMap();
        let unuseIconState;
        const button = component
            .attributes.set('type', 'button')
            .style('button')
            .style.bind(BrowserListener_1.default.isWebkit, 'button--webkit')
            .style.bind(disabled, 'button--disabled')
            .style.bind(hasSubtext, 'button--has-subtext')
            .attributes.bind(disabled, 'disabled')
            .extend(button => ({
            textWrapper: undefined,
            subTextWrapper: undefined,
            subText: undefined,
            disabled,
            type: TypeManipulator_3.default.Style(button, type => `button-type-${type}`),
            setDisabled(newState, reason) {
                const size = disabledReasons.size;
                if (newState)
                    disabledReasons.add(reason);
                else
                    disabledReasons.delete(reason);
                if (disabledReasons.size !== size)
                    disabled.refresh();
                return button;
            },
            bindDisabled(state, reason) {
                unuseDisabledStateMap.get(state)?.();
                unuseDisabledStateMap.set(state, state.use(button, (newState, oldState) => {
                    if (typeof newState === 'string')
                        button.setDisabled(!!newState, newState || oldState);
                    else
                        button.setDisabled(!!newState, reason ?? '');
                }));
                return button;
            },
            unbindDisabled(state, reason) {
                unuseDisabledStateMap.get(state)?.();
                unuseDisabledStateMap.delete(state);
                button.setDisabled(false, reason ?? Type_2.default.as('string', state.value) ?? '');
                return button;
            },
            setIcon(newIcon) {
                unuseIconState?.();
                setIcon(newIcon);
                return button;
            },
            bindIcon(state) {
                unuseIconState?.();
                unuseIconState = state.use(button, setIcon);
                return button;
            },
        }))
            .extendJIT('textWrapper', button => (0, Component_71.default)()
            .style('button-text')
            .appendTo(button))
            .extendJIT('text', button => button.textWrapper.text.rehost(button))
            .extendJIT('subTextWrapper', button => {
            hasSubtext.value = true;
            return (0, Component_71.default)()
                .style('button-subtext')
                .appendTo(button);
        })
            .extendJIT('subText', button => button.subTextWrapper.text.rehost(button));
        return button;
        function setIcon(newIcon) {
            button.icon ??= (0, Component_71.default)()
                .style('button-icon')
                .style.bind(hasSubtext, 'button-icon--has-subtext')
                .style.bind(FontsListener_1.default.loaded.not, 'button-icon--no-icon')
                .prependTo(button);
            button.icon.style.bind(button.type.state.map(button.icon, types => types.has('icon')), 'button-icon--type-icon');
            if (icon)
                button.icon.style.remove(`button-icon-${icon}`);
            icon = newIcon;
            if (icon)
                button.icon.style(`button-icon-${icon}`);
        }
    });
    exports.default = Button;
});
define("ui/component/core/Label", ["require", "exports", "ui/Component", "ui/component/core/Button", "ui/component/core/Form", "ui/view/shared/component/View", "utility/State"], function (require, exports, Component_72, Button_28, Form_4, View_14, State_54) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AutoLabel = void 0;
    Component_72 = __importDefault(Component_72);
    Button_28 = __importDefault(Button_28);
    Form_4 = __importDefault(Form_4);
    View_14 = __importDefault(View_14);
    State_54 = __importDefault(State_54);
    const Label = Component_72.default.Builder('label', (label) => {
        label.style('label');
        const textWrapper = (0, Component_72.default)()
            .style('label-text')
            .appendTo(label);
        const infoButton = (0, Button_28.default)()
            .style('label-info-button', 'label-info-button--hidden')
            .type('icon')
            .setIcon('circle-question')
            .tweak(button => button.icon?.style('label-info-button-icon'))
            .appendTo(label);
        let requiredState;
        let unuseInput;
        return label
            .extend(label => ({
            textWrapper,
            for: (0, State_54.default)(undefined),
            setFor: inputName => {
                label.attributes.set('for', inputName);
                label.for.asMutable?.setValue(inputName);
                return label;
            },
            setRequired: (required = true) => {
                label.style.unbind(requiredState);
                requiredState = undefined;
                if (typeof required === 'boolean')
                    textWrapper.style.toggle('label-required');
                else
                    textWrapper.style.bind(requiredState = required, 'label-required');
                return label;
            },
            setInput: input => {
                unuseInput?.();
                if (!label.is(exports.AutoLabel))
                    label.setFor(input?.name.value);
                label.setRequired(input?.required);
                const unuseInputInvalid = input?.invalid.use(label, invalid => label.style.toggle(!!invalid, 'label--invalid'));
                const unuseInputHasPopover = input?.hasPopover.use(label, hasPopover => {
                    infoButton.style.toggle(!hasPopover, 'label-info-button--hidden');
                });
                infoButton.event.subscribe('click', onInfoButtonClick);
                function onInfoButtonClick() {
                    const popover = input?.getPopover();
                    if ((popover?.lastStateChangeTime ?? Infinity) + 10 >= Date.now())
                        return;
                    input?.getPopover()?.toggle().anchor.apply();
                }
                unuseInput = !input ? undefined : () => {
                    unuseInputInvalid?.();
                    unuseInputHasPopover?.();
                    infoButton.event.unsubscribe('click', onInfoButtonClick);
                    unuseInput = undefined;
                };
                return label;
            },
        }))
            .extendJIT('text', label => label.textWrapper.text.rehost(label));
    });
    exports.default = Label;
    let globalI = 0;
    exports.AutoLabel = Component_72.default.Builder('label', (component) => {
        const i = globalI++;
        const label = component.and(Label);
        let formName;
        let viewPath;
        let unuseFormName;
        label.receiveAncestorInsertEvents();
        label.event.subscribe(['insert', 'ancestorInsert'], () => {
            unuseFormName?.();
            const form = label.closest(Form_4.default);
            unuseFormName = form?.name.use(label, name => formName = name);
            const view = label.closest(View_14.default);
            viewPath = view ? view.hash : '_';
            updateFor();
        });
        label.text.state.use(label, () => updateFor());
        return label.extend(label => ({}));
        function updateFor() {
            const text = label.text.state.value?.toString().toLowerCase().replace(/\W+/g, '-');
            if (!text) {
                label.setFor();
                return;
            }
            if (!formName)
                label.setFor(`${viewPath}--${text}--${i}`);
            else
                label.setFor(`${viewPath}--${formName}--${text}`);
        }
    });
});
define("ui/utility/AttributeManipulator", ["require", "exports", "lang/en-nz", "ui/utility/StringApplicator"], function (require, exports, en_nz_17, StringApplicator_8) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    en_nz_17 = __importDefault(en_nz_17);
    function AttributeManipulator(component) {
        let translationHandlers;
        const unuseAttributeMap = new Map();
        const result = {
            has(attribute) {
                return component.element.hasAttribute(attribute);
            },
            get(attribute) {
                return component.element.getAttribute(attribute) ?? undefined;
            },
            append(...attributes) {
                for (const attribute of attributes) {
                    delete translationHandlers?.[attribute];
                    component.element.setAttribute(attribute, '');
                }
                return component;
            },
            prepend(...attributes) {
                const oldAttributes = {};
                for (const attribute of [...component.element.attributes]) {
                    oldAttributes[attribute.name] = attribute.value;
                    component.element.removeAttribute(attribute.name);
                }
                for (const attribute of attributes)
                    component.element.setAttribute(attribute, oldAttributes[attribute] ?? '');
                for (const name of Object.keys(oldAttributes))
                    component.element.setAttribute(name, oldAttributes[name]);
                return component;
            },
            insertBefore(referenceAttribute, ...attributes) {
                const oldAttributes = {};
                for (const attribute of [...component.element.attributes]) {
                    oldAttributes[attribute.name] = attribute.value;
                    component.element.removeAttribute(attribute.name);
                }
                for (const attribute of Object.keys(oldAttributes)) {
                    if (attribute === referenceAttribute)
                        for (const attribute of attributes)
                            component.element.setAttribute(attribute, oldAttributes[attribute] ?? '');
                    component.element.setAttribute(attribute, oldAttributes[attribute]);
                }
                return component;
            },
            insertAfter(referenceAttribute, ...attributes) {
                const oldAttributes = {};
                for (const attribute of [...component.element.attributes]) {
                    oldAttributes[attribute.name] = attribute.value;
                    component.element.removeAttribute(attribute.name);
                }
                if (!(referenceAttribute in oldAttributes))
                    for (const attribute of attributes)
                        component.element.setAttribute(attribute, oldAttributes[attribute] ?? '');
                for (const attribute of Object.keys(oldAttributes)) {
                    component.element.setAttribute(attribute, oldAttributes[attribute]);
                    if (attribute === referenceAttribute)
                        for (const attribute of attributes)
                            component.element.setAttribute(attribute, oldAttributes[attribute] ?? '');
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
            bind(state, attribute, value, orElse) {
                unuseAttributeMap.get(attribute)?.();
                unuseAttributeMap.set(attribute, state.use(component, active => {
                    if (active)
                        component.element.setAttribute(attribute, value ?? '');
                    else if (orElse !== undefined)
                        component.element.setAttribute(attribute, orElse);
                    else
                        component.element.removeAttribute(attribute);
                }));
                return component;
            },
            compute(attribute, supplier) {
                if (component.element.hasAttribute(attribute))
                    return component;
                delete translationHandlers?.[attribute];
                const value = supplier(component);
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
                    const weave = typeof translationHandler === 'string' ? en_nz_17.default[translationHandler]() : translationHandler(en_nz_17.default, StringApplicator_8.QuiltHelper);
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
            toggle(present, attribute, value = '') {
                return this[present ? 'set' : 'remove'](attribute, value);
            },
            copy(element) {
                if ('element' in element)
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
            has(...classes) {
                return classes.every(className => component.element.classList.contains(className));
            },
            some(...classes) {
                return classes.some(className => component.element.classList.contains(className));
            },
            add(...classes) {
                component.element.classList.add(...classes);
                return component;
            },
            remove(...classes) {
                component.element.classList.remove(...classes);
                return component;
            },
            toggle(present, ...classes) {
                return this[present ? 'add' : 'remove'](...classes);
            },
            copy(element) {
                if ('element' in element)
                    element = element.element;
                component.element.classList.add(...element.classList);
                return component;
            },
        };
    }
    exports.default = ClassManipulator;
});
define("ui/Component", ["require", "exports", "lang/en-nz", "ui/utility/AnchorManipulator", "ui/utility/AttributeManipulator", "ui/utility/ClassManipulator", "ui/utility/EventManipulator", "ui/utility/FocusListener", "ui/utility/StringApplicator", "ui/utility/StyleManipulator", "ui/utility/TextManipulator", "ui/utility/Viewport", "utility/Arrays", "utility/Async", "utility/Define", "utility/Env", "utility/Errors", "utility/Objects", "utility/State", "utility/string/Strings"], function (require, exports, en_nz_18, AnchorManipulator_3, AttributeManipulator_1, ClassManipulator_1, EventManipulator_2, FocusListener_2, StringApplicator_9, StyleManipulator_1, TextManipulator_2, Viewport_6, Arrays_9, Async_4, Define_5, Env_9, Errors_3, Objects_10, State_55, Strings_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ComponentInsertionDestination = void 0;
    AnchorManipulator_3 = __importDefault(AnchorManipulator_3);
    AttributeManipulator_1 = __importDefault(AttributeManipulator_1);
    ClassManipulator_1 = __importDefault(ClassManipulator_1);
    EventManipulator_2 = __importDefault(EventManipulator_2);
    FocusListener_2 = __importDefault(FocusListener_2);
    StringApplicator_9 = __importDefault(StringApplicator_9);
    StyleManipulator_1 = __importDefault(StyleManipulator_1);
    TextManipulator_2 = __importDefault(TextManipulator_2);
    Viewport_6 = __importDefault(Viewport_6);
    Async_4 = __importDefault(Async_4);
    Define_5 = __importDefault(Define_5);
    Env_9 = __importDefault(Env_9);
    Errors_3 = __importDefault(Errors_3);
    State_55 = __importDefault(State_55);
    Strings_3 = __importDefault(Strings_3);
    const SYMBOL_COMPONENT_BRAND = Symbol('COMPONENT_BRAND');
    const ELEMENT_TO_COMPONENT_MAP = new WeakMap();
    Define_5.default.magic(Element.prototype, 'component', {
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
    var ComponentInsertionDestination;
    (function (ComponentInsertionDestination) {
        function is(value) {
            return typeof value === 'object' && !!value?.isInsertionDestination;
        }
        ComponentInsertionDestination.is = is;
    })(ComponentInsertionDestination || (exports.ComponentInsertionDestination = ComponentInsertionDestination = {}));
    var Classes;
    (function (Classes) {
        Classes["ReceiveAncestorInsertEvents"] = "_receieve-ancestor-insert-events";
        Classes["ReceiveDescendantInsertEvents"] = "_receieve-descendant-insert-events";
        Classes["ReceiveAncestorRectDirtyEvents"] = "_receieve-ancestor-rect-dirty-events";
        Classes["ReceiveScrollEvents"] = "_receieve-scroll-events";
    })(Classes || (Classes = {}));
    const componentExtensionsRegistry = [];
    function Component(type = 'span') {
        if (!canBuildComponents)
            throw new Error('Components cannot be built yet');
        let unuseIdState;
        let unuseNameState;
        let unuseAriaLabelledByIdState;
        let unuseAriaControlsIdState;
        let unuseOwnerRemove;
        let descendantsListeningForScroll;
        const jitTweaks = new Map();
        let component = {
            supers: (0, State_55.default)([]),
            isComponent: true,
            isInsertionDestination: true,
            element: document.createElement(type),
            removed: (0, State_55.default)(false),
            rooted: (0, State_55.default)(false),
            get tagName() {
                return component.element.tagName;
            },
            setOwner: newOwner => {
                unuseOwnerRemove?.();
                unuseOwnerRemove = newOwner?.removed.use(component, removed => removed && component.remove());
                return component;
            },
            replaceElement: newElement => {
                if (typeof newElement === 'string')
                    newElement = document.createElement(newElement);
                const oldElement = component.element;
                Component.removeContents(newElement);
                newElement.replaceChildren(...component.element.childNodes);
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
            is: (builder) => !builder || (Array.isArray(builder) ? builder : [builder]).some(builder => component.supers.value.includes(builder)),
            as: (builder) => !builder || component.supers.value.includes(builder) ? component : undefined,
            cast: () => component,
            and(builder, ...params) {
                if (component.is(builder))
                    return component;
                const result = builder.from(component, ...params);
                if (result instanceof Promise)
                    return result.then(result => {
                        component = result;
                        component.supers.value.push(builder);
                        component.supers.emit();
                        if (builder.name)
                            component.attributes.prepend(`:${builder.name.kebabcase}`);
                        return component;
                    });
                component = result;
                component.supers.value.push(builder);
                component.supers.emit();
                if (builder.name)
                    component.attributes.prepend(`:${builder.name.kebabcase}`);
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                return component;
            },
            extend: extension => Object.assign(component, extension(component)),
            override: (property, provider) => {
                const original = component[property];
                component[property] = provider(component, original);
                return component;
            },
            extendMagic: (property, magic) => {
                Define_5.default.magic(component, property, magic(component));
                return component;
            },
            extendJIT: (property, supplier) => {
                Define_5.default.magic(component, property, {
                    get: () => {
                        const value = supplier(component);
                        Define_5.default.set(component, property, value);
                        const tweaks = jitTweaks.get(property);
                        if (tweaks && tweaks !== true)
                            for (const tweaker of tweaks)
                                tweaker(value, component);
                        jitTweaks.set(property, true);
                        return value;
                    },
                    set: value => {
                        Define_5.default.set(component, property, value);
                    },
                });
                return component;
            },
            tweakJIT: (property, tweaker) => {
                const tweaks = jitTweaks.compute(property, () => new Set());
                if (tweaks === true)
                    tweaker(component[property], component);
                else
                    tweaks.add(tweaker);
                return component;
            },
            tweak: (tweaker, ...params) => {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                tweaker?.(component, ...params);
                return component;
            },
            get style() {
                return Define_5.default.set(component, 'style', (0, StyleManipulator_1.default)(component));
            },
            get classes() {
                return Define_5.default.set(component, 'classes', (0, ClassManipulator_1.default)(component));
            },
            get attributes() {
                return Define_5.default.set(component, 'attributes', (0, AttributeManipulator_1.default)(component));
            },
            get event() {
                return Define_5.default.set(component, 'event', (0, EventManipulator_2.default)(component));
            },
            get text() {
                return Define_5.default.set(component, 'text', (0, TextManipulator_2.default)(component));
            },
            get anchor() {
                return Define_5.default.set(component, 'anchor', (0, AnchorManipulator_3.default)(component));
            },
            get hovered() {
                return Define_5.default.set(component, 'hovered', (0, State_55.default)(false));
            },
            get focused() {
                return Define_5.default.set(component, 'focused', (0, State_55.default)(false));
            },
            get hasFocused() {
                return Define_5.default.set(component, 'hasFocused', (0, State_55.default)(false));
            },
            get hadFocusedLast() {
                return Define_5.default.set(component, 'hadFocusedLast', (0, State_55.default)(false));
            },
            get hoveredOrFocused() {
                return Define_5.default.set(component, 'hoveredOrFocused', State_55.default.Generator(() => component.hovered.value || component.focused.value)
                    .observe(component, component.hovered, component.focused));
            },
            get hoveredOrHasFocused() {
                return Define_5.default.set(component, 'hoveredOrHasFocused', State_55.default.Generator(() => component.hovered.value || component.hasFocused.value)
                    .observe(component, component.hovered, component.hasFocused));
            },
            get active() {
                return Define_5.default.set(component, 'active', (0, State_55.default)(false));
            },
            get id() {
                return Define_5.default.set(component, 'id', (0, State_55.default)(undefined));
            },
            get name() {
                return Define_5.default.set(component, 'name', (0, State_55.default)(undefined));
            },
            get rect() {
                const rectState = State_55.default.JIT(() => component.element.getBoundingClientRect());
                const oldMarkDirty = rectState.markDirty;
                rectState.markDirty = () => {
                    oldMarkDirty();
                    for (const descendant of this.element.getElementsByClassName(Classes.ReceiveAncestorRectDirtyEvents))
                        descendant.component?.event.emit('ancestorRectDirty');
                    return rectState;
                };
                this.receiveAncestorInsertEvents();
                this.receiveAncestorScrollEvents();
                this.classes.add(Classes.ReceiveAncestorRectDirtyEvents);
                this.event.subscribe(['insert', 'ancestorInsert', 'ancestorScroll', 'ancestorRectDirty'], rectState.markDirty);
                Viewport_6.default.size.subscribe(component, rectState.markDirty);
                return Define_5.default.set(component, 'rect', rectState);
            },
            setId: id => {
                unuseIdState?.();
                unuseIdState = undefined;
                if (id && typeof id !== 'string')
                    unuseIdState = id.use(component, setId);
                else
                    setId(id);
                return component;
                function setId(id) {
                    if (id) {
                        component.element.setAttribute('id', id);
                        component.id.asMutable?.setValue(id);
                    }
                    else {
                        component.element.removeAttribute('id');
                        component.id.asMutable?.setValue(undefined);
                    }
                }
            },
            setRandomId: () => {
                component.setId(Strings_3.default.uid());
                return component;
            },
            setName: name => {
                unuseNameState?.();
                unuseNameState = undefined;
                if (name && typeof name !== 'string')
                    unuseNameState = name.use(component, setName);
                else
                    setName(name);
                return component;
                function setName(name) {
                    if (name) {
                        name = name.replace(/[^\w-]+/g, '-').toLowerCase();
                        component.element.setAttribute('name', name);
                        component.name.asMutable?.setValue(name);
                    }
                    else {
                        component.element.removeAttribute('name');
                        component.name.asMutable?.setValue(undefined);
                    }
                }
            },
            disableInsertion() {
                return component;
            },
            remove() {
                component.removeContents();
                component.removed.asMutable?.setValue(true);
                component.rooted.asMutable?.setValue(false);
                component.element.component = undefined;
                component.element.remove();
                component.event.emit('unroot');
                unuseOwnerRemove?.();
            },
            appendTo(destination) {
                destination.append(component.element);
                component.emitInsert();
                return component;
            },
            prependTo(destination) {
                destination.prepend(component.element);
                component.emitInsert();
                return component;
            },
            insertTo(destination, direction, sibling) {
                if (ComponentInsertionDestination.is(destination)) {
                    destination.insert(direction, sibling, component);
                    component.emitInsert();
                    return component;
                }
                const siblingElement = sibling ? Component.element(sibling) : null;
                if (direction === 'before')
                    destination.insertBefore(component.element, siblingElement);
                else
                    destination.insertBefore(component.element, siblingElement?.nextSibling ?? null);
                component.emitInsert();
                return component;
            },
            append(...contents) {
                const elements = contents.filter(Arrays_9.Truthy).map(Component.element);
                component.element.append(...elements);
                for (const element of elements)
                    element.component?.emitInsert();
                component.event.emit('childrenInsert', elements);
                return component;
            },
            prepend(...contents) {
                const elements = contents.filter(Arrays_9.Truthy).map(Component.element);
                component.element.prepend(...elements);
                for (const element of elements)
                    element.component?.emitInsert();
                component.event.emit('childrenInsert', elements);
                return component;
            },
            insert(direction, sibling, ...contents) {
                const siblingElement = sibling ? Component.element(sibling) : null;
                const elements = contents.filter(Arrays_9.Truthy).map(Component.element);
                if (direction === 'before')
                    for (let i = elements.length - 1; i >= 0; i--)
                        component.element.insertBefore(elements[i], siblingElement);
                else
                    for (const element of elements)
                        component.element.insertBefore(element, siblingElement?.nextSibling ?? null);
                for (const element of elements)
                    element.component?.emitInsert();
                component.event.emit('childrenInsert', elements);
                return component;
            },
            removeContents() {
                Component.removeContents(component.element);
                return component;
            },
            closest(builder) {
                return Component.closest(builder, component);
            },
            getStateForClosest(builders) {
                const state = State_55.default.JIT(() => component.closest(builders));
                component.receiveAncestorInsertEvents();
                component.onRooted(() => {
                    state.markDirty();
                    component.event.subscribe(['insert', 'ancestorInsert'], () => state.markDirty());
                });
                return state;
            },
            get parent() {
                return component.element.parentElement?.component;
            },
            get previousSibling() {
                return component.element.previousElementSibling?.component;
            },
            getPreviousSibling(builder) {
                const [sibling] = component.getPreviousSiblings(builder);
                return sibling;
            },
            get nextSibling() {
                return component.element.nextElementSibling?.component;
            },
            getNextSibling(builder) {
                const [sibling] = component.getNextSiblings(builder);
                return sibling;
            },
            *getAncestorComponents(builder) {
                let cursor = component.element;
                while (cursor) {
                    cursor = cursor.parentElement;
                    const component = cursor?.component;
                    if (component?.is(builder))
                        yield component;
                }
            },
            *getChildren(builder) {
                for (const child of component.element.children) {
                    const component = child.component;
                    if (component?.is(builder))
                        yield component;
                }
            },
            *getSiblings(builder) {
                const parent = component.element.parentElement;
                for (const child of parent?.children ?? [])
                    if (child !== component.element) {
                        const component = child.component;
                        if (component?.is(builder))
                            yield component;
                    }
            },
            *getPreviousSiblings(builder) {
                const parent = component.element.parentElement;
                for (const child of parent?.children ?? []) {
                    if (child === component.element)
                        break;
                    const childComponent = child.component;
                    if (childComponent?.is(builder))
                        yield childComponent;
                }
            },
            *getNextSiblings(builder) {
                let cursor = component.element;
                while ((cursor = cursor.nextElementSibling)) {
                    const component = cursor.component;
                    if (component?.is(builder))
                        yield component;
                }
            },
            *getDescendants(builder) {
                const walker = document.createTreeWalker(component.element, NodeFilter.SHOW_ELEMENT);
                let node;
                while ((node = walker.nextNode())) {
                    const component = node.component;
                    if (component?.is(builder))
                        yield component;
                }
            },
            getFirstDescendant(builder) {
                const [first] = component.getDescendants(builder);
                return first;
            },
            receiveAncestorInsertEvents: () => {
                component.element.classList.add(Classes.ReceiveAncestorInsertEvents);
                return component;
            },
            receiveDescendantInsertEvents: () => {
                component.element.classList.add(Classes.ReceiveAncestorInsertEvents);
                return component;
            },
            receiveAncestorScrollEvents() {
                component.element.classList.add(Classes.ReceiveScrollEvents);
                return component;
            },
            emitInsert: () => {
                updateRooted(component);
                emitInsert(component);
                return component;
            },
            monitorScrollEvents() {
                descendantsListeningForScroll ??= (component.element === window ? document.documentElement : component.element).getElementsByClassName(Classes.ReceiveScrollEvents);
                component.event.subscribe('scroll', () => {
                    for (const descendant of [...descendantsListeningForScroll])
                        descendant.component?.event.emit('ancestorScroll');
                });
                return component;
            },
            onRooted(callback) {
                component.rooted.awaitManual(true, () => callback(component));
                return component;
            },
            onRemove(owner, callback) {
                component.removed.await(owner, true, () => callback(component));
                return component;
            },
            onRemoveManual(callback) {
                component.removed.awaitManual(true, () => callback(component));
                return component;
            },
            ariaRole: (role) => {
                if (!role)
                    return component.attributes.remove('role');
                return component.attributes.set('role', role);
            },
            get ariaLabel() {
                return Define_5.default.set(component, 'ariaLabel', (0, StringApplicator_9.default)(component, value => component.attributes.set('aria-label', value)));
            },
            ariaLabelledBy: labelledBy => {
                unuseAriaLabelledByIdState?.();
                if (labelledBy) {
                    const state = State_55.default.Generator(() => labelledBy.id.value ?? labelledBy.attributes.get('for'))
                        .observe(component, labelledBy.id, labelledBy.cast()?.for);
                    unuseAriaLabelledByIdState = state.use(component, id => component.attributes.set('aria-labelledby', id));
                }
                return component;
            },
            ariaHidden: () => component.attributes.set('aria-hidden', 'true'),
            ariaChecked: state => {
                state.use(component, state => component.attributes.set('aria-checked', `${state}`));
                return component;
            },
            ariaControls: target => {
                unuseAriaControlsIdState?.();
                unuseAriaControlsIdState = target?.id.use(component, id => component.attributes.set('aria-controls', id));
                return component;
            },
            tabIndex: index => {
                if (index === undefined)
                    component.element.removeAttribute('tabindex');
                else if (index === 'programmatic')
                    component.element.setAttribute('tabindex', '-1');
                else if (index === 'auto')
                    component.element.setAttribute('tabindex', '0');
                else
                    component.element.setAttribute('tabindex', `${index}`);
                return component;
            },
            focus: () => {
                FocusListener_2.default.focus(component.element);
                return component;
            },
            blur: () => {
                FocusListener_2.default.blur(component.element);
                return component;
            },
        };
        en_nz_18.WeavingArg.setRenderable(component);
        for (const extension of componentExtensionsRegistry)
            extension(component);
        if (!Component.is(component))
            throw Errors_3.default.Impossible();
        component.element.component = component;
        return component;
    }
    function emitInsert(component) {
        if (!component)
            return;
        component.event.emit('insert');
        const descendantsListeningForEvent = component.element.getElementsByClassName(Classes.ReceiveAncestorInsertEvents);
        for (const descendant of descendantsListeningForEvent)
            descendant.component?.event.emit('ancestorInsert');
        let cursor = component.element.parentElement;
        while (cursor) {
            cursor.component?.event.emit('descendantInsert');
            cursor = cursor.parentElement;
        }
    }
    function updateRooted(component) {
        if (component) {
            const rooted = document.documentElement.contains(component.element);
            if (component.rooted.value === rooted)
                return;
            component.rooted.asMutable?.setValue(rooted);
            component.event.emit(rooted ? 'root' : 'unroot');
            for (const descendant of component.element.querySelectorAll('*')) {
                const component = descendant.component;
                if (component) {
                    component.rooted.asMutable?.setValue(rooted);
                    component.event.emit(rooted ? 'root' : 'unroot');
                }
            }
        }
    }
    let canBuildComponents = false;
    (function (Component) {
        function allowBuilding() {
            canBuildComponents = true;
        }
        Component.allowBuilding = allowBuilding;
        function is(value) {
            return typeof value === 'object' && !!value?.isComponent;
        }
        Component.is = is;
        function element(from) {
            return is(from) ? from.element : from;
        }
        Component.element = element;
        function wrap(element) {
            const component = Component();
            (0, Objects_10.mutable)(component).element = element;
            return component;
        }
        Component.wrap = wrap;
        const SYMBOL_COMPONENT_TYPE_BRAND = Symbol('COMPONENT_TYPE_BRAND');
        const defaultBuilder = (type) => Component(type);
        function Builder(initialOrBuilder, builder) {
            let name = getBuilderName();
            const type = typeof initialOrBuilder === 'string' ? initialOrBuilder : undefined;
            const initialBuilder = !builder || typeof initialOrBuilder === 'string' ? defaultBuilder : initialOrBuilder;
            builder ??= initialOrBuilder;
            const realBuilder = (component = initialBuilder(type), ...params) => {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                const result = builder(component, ...params);
                if (result instanceof Promise)
                    return result.then(result => {
                        if (result !== component)
                            void ensureOriginalComponentNotSubscriptionOwner(component);
                        return result;
                    });
                if (result !== component)
                    void ensureOriginalComponentNotSubscriptionOwner(component);
                return result;
            };
            const simpleBuilder = (...params) => {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                const component = realBuilder(undefined, ...params);
                if (component instanceof Promise)
                    return component.then(completeComponent);
                return completeComponent(component);
            };
            Object.defineProperty(simpleBuilder, 'name', { value: name, configurable: true });
            const resultBuilder = Object.assign(simpleBuilder, {
                from: realBuilder,
                setName(newName) {
                    name = addKebabCase(newName);
                    Object.defineProperty(simpleBuilder, 'name', { value: name });
                    return resultBuilder;
                },
            });
            return resultBuilder;
            function completeComponent(component) {
                if (!component)
                    return component;
                if (name && Env_9.default.isDev) {
                    component[Symbol.toStringTag] ??= name.toString();
                    const tagName = `:${name.kebabcase}`;
                    if (component.element.tagName === 'SPAN') {
                        component.replaceElement(tagName);
                    }
                    else {
                        component.attributes.prepend(tagName);
                    }
                }
                component.supers.value.push(simpleBuilder);
                component.supers.emit();
                return component;
            }
            async function ensureOriginalComponentNotSubscriptionOwner(original) {
                if (!original || !State_55.default.OwnerMetadata.hasSubscriptions(original))
                    return;
                const originalRef = new WeakRef(original);
                original = undefined;
                await Async_4.default.sleep(1000);
                original = originalRef.deref();
                if (!original || original.rooted.value || original.removed.value)
                    return;
                console.error(`${String(name ?? 'Component')} builder returned a replacement component, but the original component was used as a subscription owner and is not in the tree!`);
            }
        }
        Component.Builder = Builder;
        function Extension(builder) {
            return {
                name: getBuilderName(),
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
            if (!element || (typeof element !== 'object' && typeof element !== 'function'))
                return undefined;
            return ELEMENT_TO_COMPONENT_MAP.get(element);
        }
        Component.get = get;
        const STACK_FILE_NAME_REGEX = /\(http.*?(\w+)\.ts:\d+:\d+\)/;
        const PASCAL_CASE_WORD_START = /(?<=[a-z0-9_-])(?=[A-Z])/g;
        function addKebabCase(name) {
            return Object.assign(String(name), {
                kebabcase: name.replaceAll(PASCAL_CASE_WORD_START, '-').toLowerCase(),
            });
        }
        function getBuilderName() {
            const stack = Strings_3.default.shiftLine((new Error().stack ?? ''), 3);
            const name = stack.match(STACK_FILE_NAME_REGEX)?.[1];
            if (!name || name === 'Component')
                return undefined;
            return addKebabCase(name);
        }
        function removeContents(element) {
            for (const child of [...element.childNodes]) {
                if (child.component)
                    child.component.remove();
                else {
                    removeContents(child);
                    child.remove();
                }
            }
        }
        Component.removeContents = removeContents;
        function closest(builder, element) {
            let cursor = is(element) ? element.element : element ?? null;
            while (cursor) {
                cursor = cursor.parentElement;
                const component = cursor?.component;
                if (component?.is(builder))
                    return component;
            }
        }
        Component.closest = closest;
    })(Component || (Component = {}));
    State_55.default.Owner.setConstructor(() => Component());
    exports.default = Component;
});
define("model/Session", ["require", "exports", "endpoint/auth/EndpointAuthDelete", "endpoint/session/EndpointSessionGet", "endpoint/session/EndpointSessionReset", "utility/Env", "utility/Popup", "utility/State", "utility/Store"], function (require, exports, EndpointAuthDelete_1, EndpointSessionGet_1, EndpointSessionReset_1, Env_10, Popup_2, State_56, Store_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    EndpointAuthDelete_1 = __importDefault(EndpointAuthDelete_1);
    EndpointSessionGet_1 = __importDefault(EndpointSessionGet_1);
    EndpointSessionReset_1 = __importDefault(EndpointSessionReset_1);
    Env_10 = __importDefault(Env_10);
    Popup_2 = __importDefault(Popup_2);
    State_56 = __importDefault(State_56);
    Store_4 = __importDefault(Store_4);
    var Session;
    (function (Session) {
        Session.has = (0, State_56.default)(false);
        const clearedWithSessionChange = [];
        function setClearedWithSessionChange(...cleared) {
            clearedWithSessionChange.push(...cleared);
        }
        Session.setClearedWithSessionChange = setClearedWithSessionChange;
        async function refresh() {
            const session = await EndpointSessionGet_1.default.query();
            const stateToken = session.headers.get('State-Token');
            if (stateToken)
                Store_4.default.items.stateToken = stateToken;
            if (Store_4.default.items.session?.created !== session.data?.created)
                for (const keyOrHandler of clearedWithSessionChange)
                    if (typeof keyOrHandler === 'function')
                        keyOrHandler();
                    else
                        Store_4.default.delete(keyOrHandler);
            Store_4.default.items.session = session?.data ?? undefined;
            updateState();
        }
        Session.refresh = refresh;
        async function reset(skipRefresh = false) {
            await EndpointSessionReset_1.default.query();
            delete Store_4.default.items.session;
            if (skipRefresh)
                updateState();
            else
                await refresh();
        }
        Session.reset = reset;
        function setAuthor(author) {
            const session = Store_4.default.items.session;
            if (!session)
                return void refresh();
            Store_4.default.items.session = {
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
            Session.has.value = !!Store_4.default.items.session;
            Auth.state.value = Store_4.default.items.session?.author ? 'logged-in' : Store_4.default.items.session?.authorisations?.length ? 'has-authorisations' : 'none';
            Auth.authorisations.value = Store_4.default.items.session?.authorisations ?? [];
            Auth.author.value = Store_4.default.items.session?.author ?? undefined;
        }
        function getStateToken() {
            return Store_4.default.items.stateToken;
        }
        Session.getStateToken = getStateToken;
        let Auth;
        (function (Auth) {
            Auth.state = (0, State_56.default)('none');
            Auth.loggedIn = State_56.default.Generator(() => Auth.state.value === 'logged-in').observeManual(Auth.state);
            Auth.authorisations = (0, State_56.default)([]);
            Auth.author = (0, State_56.default)(undefined, (a, b) => a?.vanity === b?.vanity);
            function getAll() {
                return Store_4.default.items.session?.authorisations ?? [];
            }
            Auth.getAll = getAll;
            function get(service) {
                return Store_4.default.items.session?.authorisations?.find(auth => auth.service === service);
            }
            Auth.get = get;
            function isAuthed(service) {
                return Session.Auth.authorisations.value.some(auth => auth.service === service.name);
            }
            Auth.isAuthed = isAuthed;
            async function unauth(authOrId) {
                const id = typeof authOrId === 'string' ? authOrId : authOrId.id;
                await EndpointAuthDelete_1.default.query({ body: { id } });
                const session = Store_4.default.items.session;
                if (session?.authorisations) {
                    let authorisations = session.authorisations.filter(auth => auth.id !== id);
                    if (!authorisations.length)
                        authorisations = null;
                    Store_4.default.items.session = {
                        ...session,
                        authorisations,
                    };
                }
                updateState();
            }
            Auth.unauth = unauth;
            async function auth(service) {
                await (0, Popup_2.default)(`Login Using ${service.name}`, service.url_begin, 600, 900)
                    .then(() => true).catch(err => { console.warn(err); return false; });
                await Session.refresh();
            }
            Auth.auth = auth;
            let isRequestingDangerToken = false;
            function canRequestDangerToken() {
                return !isRequestingDangerToken;
            }
            Auth.canRequestDangerToken = canRequestDangerToken;
            async function requestDangerToken(type, service) {
                if (isRequestingDangerToken)
                    return false;
                isRequestingDangerToken = true;
                const result = await (0, Popup_2.default)(`Re-authenticate Using ${service.name}`, `${Env_10.default.API_ORIGIN}danger-token/request/${type}/${service.id}/begin`, 600, 900)
                    .then(() => true).catch(err => { console.warn(err); return false; });
                isRequestingDangerToken = false;
                return result;
            }
            Auth.requestDangerToken = requestDangerToken;
            async function await(owner) {
                if (Auth.state.value === 'logged-in')
                    return true;
                return new Promise(resolve => {
                    Auth.state.subscribe(owner, handleStateChange);
                    function handleStateChange(value) {
                        if (value !== 'logged-in')
                            return;
                        resolve();
                        Auth.state.unsubscribe(handleStateChange);
                    }
                });
            }
            Auth.await = await;
        })(Auth = Session.Auth || (Session.Auth = {}));
    })(Session || (Session = {}));
    Object.assign(window, { Session });
    exports.default = Session;
});
define("model/Manifest", ["require", "exports", "model/Session", "utility/State", "utility/Time"], function (require, exports, Session_24, State_57, Time_10) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Session_24 = __importDefault(Session_24);
    State_57 = __importDefault(State_57);
    Time_10 = __importDefault(Time_10);
    function Manifest(definition) {
        let manifestTime;
        let promise;
        let unuseState = undefined;
        const state = (0, State_57.default)(undefined, false);
        tryLoad();
        const result = Object.assign(state, {
            isFresh(manifest) {
                return !!manifest && Date.now() - (manifestTime ?? 0) < definition.valid;
            },
            async getManifest(force) {
                // don't re-request the tag manifest if it was requested less than 5 minutes ago
                if (!force && result.isFresh(state.value))
                    return state.value;
                if (definition.requiresAuthor && !Session_24.default.Auth.loggedIn.value)
                    return undefined;
                return promise ??= (async () => {
                    try {
                        const response = await definition.get();
                        if (response instanceof Error)
                            throw response;
                        state.value = response.data;
                        manifestTime = Date.now();
                        setupSaveWatcher();
                    }
                    catch (err) {
                        if (definition.orElse)
                            state.value = definition.orElse();
                        else
                            throw err;
                    }
                    promise = undefined;
                    return state.value;
                })();
            },
        });
        let lastAttempt = 0;
        if (definition.refresh)
            setInterval(() => {
                if (result.isFresh(state.value))
                    return;
                if (Date.now() - lastAttempt < Time_10.default.seconds(30))
                    return;
                lastAttempt = Date.now();
                void result.getManifest(true);
            }, 100);
        return result;
        function setupSaveWatcher() {
            if (!definition.cacheId)
                return;
            unuseState?.();
            unuseState = state.useManual(data => localStorage.setItem(`manifest:${definition.cacheId}`, JSON.stringify({ time: Date.now(), data })));
        }
        function tryLoad() {
            if (!definition.cacheId)
                return undefined;
            const data = localStorage.getItem(`manifest:${definition.cacheId}`);
            if (!data)
                return undefined;
            try {
                const result = JSON.parse(data);
                if (!result || !('time' in result) || !('data' in result))
                    return undefined;
                manifestTime = +result.time || 0;
                state.value = result.data;
            }
            catch (err) {
                console.log(err);
                return undefined;
            }
            setupSaveWatcher();
        }
    }
    exports.default = Manifest;
});
define("model/FormInputLengths", ["require", "exports", "endpoint/manifest/EndpointFormInputLengths", "model/Manifest", "utility/Time"], function (require, exports, EndpointFormInputLengths_1, Manifest_3, Time_11) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    EndpointFormInputLengths_1 = __importDefault(EndpointFormInputLengths_1);
    Manifest_3 = __importDefault(Manifest_3);
    Time_11 = __importDefault(Time_11);
    exports.default = (0, Manifest_3.default)({
        valid: Time_11.default.minutes(5),
        get() {
            return EndpointFormInputLengths_1.default.query();
        },
        orElse() {
            const empy = {};
            return new Proxy({}, {
                get(target, p, receiver) {
                    return empy;
                },
            });
        },
    });
});
define("ui/view/ErrorView", ["require", "exports", "lang/en-nz", "ui/component/core/Heading", "ui/component/core/Paragraph", "ui/component/core/Placeholder", "ui/view/shared/component/View", "ui/view/shared/component/ViewDefinition"], function (require, exports, en_nz_19, Heading_3, Paragraph_3, Placeholder_7, View_15, ViewDefinition_15) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    en_nz_19 = __importDefault(en_nz_19);
    Heading_3 = __importDefault(Heading_3);
    Paragraph_3 = __importDefault(Paragraph_3);
    Placeholder_7 = __importDefault(Placeholder_7);
    View_15 = __importDefault(View_15);
    ViewDefinition_15 = __importDefault(ViewDefinition_15);
    exports.default = (0, ViewDefinition_15.default)({
        create: (params) => {
            const view = (0, View_15.default)('error');
            if (params.code >= 500 && params.error)
                console.error(params.error);
            (0, Heading_3.default)()
                .text.use(quilt => quilt['view/error/title']({ CODE: params.code }))
                .appendTo(view.content);
            const key = `view/error/description-${params.code}`;
            if (key in en_nz_19.default)
                (0, Paragraph_3.default)()
                    .and(Placeholder_7.default)
                    .text.use(key)
                    .appendTo(view.content);
            return view;
        },
    });
});
define("ui/view/RequireLoginView", ["require", "exports", "ui/component/core/ActionRow", "ui/component/core/Block", "ui/component/core/Button", "ui/view/AccountView", "ui/view/shared/component/View", "ui/view/shared/component/ViewDefinition"], function (require, exports, ActionRow_6, Block_17, Button_29, AccountView_2, View_16, ViewDefinition_16) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    ActionRow_6 = __importDefault(ActionRow_6);
    Block_17 = __importDefault(Block_17);
    Button_29 = __importDefault(Button_29);
    AccountView_2 = __importDefault(AccountView_2);
    View_16 = __importDefault(View_16);
    ViewDefinition_16 = __importDefault(ViewDefinition_16);
    exports.default = (0, ViewDefinition_16.default)({
        create: () => {
            const view = (0, View_16.default)('require-login');
            const block = (0, Block_17.default)().appendTo(view.content);
            block.title.text.use('view/shared/login-required/title');
            block.description.text.use('view/shared/login-required/description');
            const actionRow = (0, ActionRow_6.default)()
                .appendTo(block);
            (0, Button_29.default)()
                .type('primary')
                .text.use('view/shared/login-required/action')
                .event.subscribe('click', () => navigate.ephemeral(AccountView_2.default, undefined))
                .appendTo(actionRow.right);
            return view;
        },
    });
});
define("ui/view/shared/component/ViewContainer", ["require", "exports", "model/Session", "ui/Component", "ui/component/core/Button", "ui/component/core/Dialog", "ui/view/AccountView", "ui/view/ErrorView", "ui/view/RequireLoginView", "ui/view/shared/ext/ViewTransition"], function (require, exports, Session_25, Component_73, Button_30, Dialog_3, AccountView_3, ErrorView_1, RequireLoginView_1, ViewTransition_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Session_25 = __importDefault(Session_25);
    Component_73 = __importDefault(Component_73);
    Button_30 = __importDefault(Button_30);
    Dialog_3 = __importDefault(Dialog_3);
    AccountView_3 = __importDefault(AccountView_3);
    ErrorView_1 = __importDefault(ErrorView_1);
    RequireLoginView_1 = __importDefault(RequireLoginView_1);
    ViewTransition_4 = __importDefault(ViewTransition_4);
    let globalId = 0;
    const ViewContainer = () => {
        let cancelLogin;
        const container = (0, Component_73.default)()
            .style('view-container')
            .tabIndex('programmatic')
            .ariaRole('main')
            .ariaLabel.use('view/container/alt')
            .extend(container => ({
            show: async (definition, params) => {
                const showingId = ++globalId;
                let view;
                let loadParams = undefined;
                const needsLogin = definition.requiresLogin && !Session_25.default.Auth.loggedIn.value;
                if (needsLogin || definition.load) {
                    let loginPromise;
                    const transition = ViewTransition_4.default.perform('view', async () => {
                        swapRemove();
                        if (!needsLogin)
                            return;
                        const login = logIn();
                        loginPromise = login?.authed;
                        await login?.accountViewShown;
                    });
                    await transition.updateCallbackDone;
                    await loginPromise;
                    if (needsLogin && !Session_25.default.Auth.loggedIn.value) {
                        let setLoggedIn;
                        const loggedIn = new Promise(resolve => setLoggedIn = resolve);
                        ViewTransition_4.default.perform('view', async () => {
                            hideEphemeral();
                            const view = await swapAdd(RequireLoginView_1.default);
                            if (!view)
                                return;
                            Session_25.default.Auth.loggedIn.subscribe(view, loggedIn => loggedIn && setLoggedIn());
                        });
                        await loggedIn;
                    }
                }
                let loadError;
                try {
                    loadParams = !definition.load ? undefined : await Promise.resolve(definition.load(params));
                }
                catch (err) {
                    loadError = err;
                }
                if (globalId !== showingId)
                    return;
                if (container.view || showingId > 1) {
                    const transition = ViewTransition_4.default.perform('view', swap);
                    await transition.updateCallbackDone;
                }
                else {
                    await swap();
                }
                return view;
                async function swap() {
                    swapRemove();
                    await swapAdd();
                }
                function swapRemove() {
                    container.view?.remove();
                    hideEphemeral();
                }
                async function swapAdd(replacementDefinition = definition) {
                    const shownView = await (loadError ? Promise.reject(loadError) : Promise.resolve(replacementDefinition.create(params, loadParams)))
                        .then(v => {
                        view = replacementDefinition === definition ? v : undefined;
                        return v;
                    })
                        .catch((error) => ErrorView_1.default.create({
                        code: (error.code < 200 ? undefined : error.code) ?? 600,
                        error,
                    }, {}));
                    if (shownView) {
                        shownView.appendTo(container);
                        container.view = shownView;
                        if (replacementDefinition === definition)
                            shownView.params = params;
                    }
                    return shownView;
                }
            },
            ephemeralDialog: (0, Dialog_3.default)()
                .style('view-container-ephemeral')
                .tweak(dialog => dialog.style.bind(dialog.opened, 'view-container-ephemeral--open'))
                .setOwner(container)
                .setNotModal()
                .append((0, Button_30.default)()
                .setIcon('xmark')
                .style('view-container-ephemeral-close')
                .event.subscribe('click', () => {
                if (cancelLogin)
                    cancelLogin();
                else
                    return container.hideEphemeral();
            }))
                .appendTo(document.body),
            showEphemeral: async (definition, params) => {
                let view;
                const transition = document.startViewTransition(async () => view = await showEphemeral(definition, params));
                await transition.updateCallbackDone;
                return view;
            },
            hideEphemeral: async () => {
                const transition = document.startViewTransition(hideEphemeral);
                await transition.updateCallbackDone;
            },
        }));
        return container;
        async function showEphemeral(definition, params) {
            container.ephemeral?.remove();
            let view;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const loadParams = await definition.load?.(params);
            const shownView = await Promise.resolve(definition.create(params, loadParams))
                .then(v => view = v)
                .catch((error) => ErrorView_1.default.create({ code: error.code ?? 600, error }, {}));
            if (shownView) {
                shownView.prependTo(container.ephemeralDialog);
                container.ephemeral = shownView;
                container.ephemeralDialog.open();
                container.attributes.append('inert');
                container.ephemeralDialog.opened.subscribe(shownView, opened => {
                    if (!opened) {
                        hideEphemeral();
                    }
                });
            }
            return view;
        }
        function hideEphemeral() {
            container.ephemeralDialog.close();
            container.ephemeral?.remove();
            delete container.ephemeral;
            container.attributes.remove('inert');
        }
        function logIn() {
            if (Session_25.default.Auth.author.value)
                return;
            const accountViewShown = showEphemeral(AccountView_3.default, undefined);
            const authPromise = accountViewShown.then(async (view) => {
                if (!view)
                    return false;
                const loginCancelledPromise = new Promise(resolve => cancelLogin = resolve);
                await Promise.race([
                    Session_25.default.Auth.await(view),
                    loginCancelledPromise,
                ]);
                cancelLogin = undefined;
                return Session_25.default.Auth.loggedIn.value;
            });
            return {
                accountViewShown,
                authed: authPromise,
            };
        }
    };
    exports.default = ViewContainer;
});
define("navigation/Navigate", ["require", "exports", "navigation/Routes", "ui/utility/EventManipulator", "ui/view/ErrorView", "utility/Env"], function (require, exports, Routes_1, EventManipulator_3, ErrorView_2, Env_11) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Routes_1 = __importDefault(Routes_1);
    EventManipulator_3 = __importDefault(EventManipulator_3);
    ErrorView_2 = __importDefault(ErrorView_2);
    Env_11 = __importDefault(Env_11);
    function Navigator() {
        let lastURL;
        const navigate = {
            event: undefined,
            isURL: (glob) => {
                const pattern = glob
                    .replace(/(?<=\/)\*(?!\*)/g, '[^/]*')
                    .replace(/\/\*\*/g, '.*');
                return new RegExp(`^${pattern}$`).test(location.pathname);
            },
            fromURL: async () => {
                if (location.href === lastURL?.href)
                    return;
                if (!app)
                    throw new Error('Cannot navigate yet, no app instance');
                const oldURL = lastURL;
                lastURL = new URL(location.href);
                let matchedRoute;
                let errored = false;
                if (location.pathname !== oldURL?.pathname) {
                    const url = location.pathname;
                    let handled = false;
                    for (const route of Routes_1.default) {
                        const params = route.match(url);
                        if (!params)
                            continue;
                        matchedRoute = route.path;
                        await route.handler(app, (!Object.keys(params).length ? undefined : params));
                        handled = true;
                        break;
                    }
                    if (!handled) {
                        errored = true;
                        await app.view.show(ErrorView_2.default, { code: 404 });
                    }
                }
                if (location.hash && !errored) {
                    const id = location.hash.slice(1);
                    const element = document.getElementById(id);
                    if (!element) {
                        console.error(`No element by ID: "${id}"`);
                        location.hash = '';
                        return;
                    }
                    element.scrollIntoView();
                    element.focus();
                }
                navigate.event.emit('Navigate', matchedRoute);
            },
            toURL: async (url) => {
                navigate.setURL(url);
                return navigate.fromURL();
            },
            setURL: (url) => {
                if (url !== location.pathname)
                    history.pushState({}, '', `${Env_11.default.URL_ORIGIN}${url.slice(1)}`);
            },
            toRawURL: (url) => {
                if (url.startsWith('http')) {
                    location.href = url;
                    return true;
                }
                if (url.startsWith('/')) {
                    void navigate.toURL(url);
                    return true;
                }
                if (url.startsWith('#')) {
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
            ephemeral: (...args) => {
                if (!app)
                    throw new Error('Cannot show ephemeral view yet, no app instance');
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
                return app.view.showEphemeral(...args);
            },
        };
        navigate.event = (0, EventManipulator_3.default)(navigate);
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        window.addEventListener('popstate', navigate.fromURL);
        Object.assign(window, { navigate });
        return navigate;
    }
    let app;
    (function (Navigator) {
        function setApp(instance) {
            app = instance;
        }
        Navigator.setApp = setApp;
    })(Navigator || (Navigator = {}));
    exports.default = Navigator;
});
define("ui/component/masthead/Flag", ["require", "exports", "ui/Component", "utility/Arrays"], function (require, exports, Component_74, Arrays_10) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Component_74 = __importDefault(Component_74);
    Arrays_10 = __importDefault(Arrays_10);
    const Flag = Component_74.default.Builder((component) => {
        const stripes = Arrays_10.default.range(5)
            .map(i => (0, Component_74.default)()
            .style('flag-stripe', `flag-stripe-${FLAG_STRIPE_COLOURS[i]}`, `flag-stripe-${i + 1}`));
        let endWhen = Infinity;
        const activeReasons = new Set();
        function add(reason) {
            if (!activeReasons.size) {
                endWhen = Infinity;
                for (const stripe of stripes) {
                    stripe.style.remove('flag-stripe--animate-end-0', 'flag-stripe--animate-end-1');
                    stripe.style('flag-stripe--animate');
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
        component.hoveredOrFocused.subscribe(component, enabled => toggle('focus', enabled));
        for (const stripe of stripes) {
            const first = stripe === stripes[0];
            let iteration = 0;
            stripe.event.subscribe('animationstart', () => iteration = 0);
            stripe.event.subscribe('animationiteration', () => {
                iteration++;
                if (first && !activeReasons.size)
                    endWhen = iteration;
                if (iteration >= endWhen) {
                    stripe.style.remove('flag-stripe--animate');
                    stripe.style(`flag-stripe--animate-end-${(iteration % 2)}`);
                }
            });
        }
        return component
            .style('flag')
            .append(...stripes)
            .extend(flag => ({
            wave: toggle,
        }));
    });
    exports.default = Flag;
    const FLAG_STRIPE_COLOURS = [
        'blue',
        'pink',
        'white',
        'pink',
        'blue',
    ];
});
define("ui/component/PrimaryNav", ["require", "exports", "model/Session", "ui/Component", "ui/component/core/Button", "ui/component/core/Heading", "ui/component/core/Link", "ui/component/core/Slot", "ui/utility/StringApplicator", "utility/Env"], function (require, exports, Session_26, Component_75, Button_31, Heading_4, Link_17, Slot_22, StringApplicator_10, Env_12) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Session_26 = __importDefault(Session_26);
    Component_75 = __importDefault(Component_75);
    Button_31 = __importDefault(Button_31);
    Heading_4 = __importDefault(Heading_4);
    Link_17 = __importDefault(Link_17);
    Slot_22 = __importDefault(Slot_22);
    Env_12 = __importDefault(Env_12);
    exports.default = Component_75.default.Builder(nav => {
        nav.style('primary-nav');
        const top = (0, Component_75.default)()
            .style('primary-nav-top')
            .appendTo(nav);
        const bottom = (0, Component_75.default)()
            .style('primary-nav-bottom')
            .appendTo(nav);
        function Group(at, translation) {
            return (0, Component_75.default)()
                .style('primary-nav-group')
                .append((0, Heading_4.default)()
                .style('primary-nav-group-heading')
                .style.remove('heading')
                .text.use(translation))
                .extend(group => ({
                add: createAddFunction(group),
                using: (state, initialiser) => {
                    (0, Slot_22.default)()
                        .use(state, (transaction, value) => initialiser(Object.assign(transaction, { add: createAddFunction(transaction) }), value))
                        .appendTo(group);
                    return group;
                },
            }))
                .tweak(group => at !== null
                && group.appendTo(at === 'top' ? top : bottom));
            function createAddFunction(addTo) {
                return (path, translation, initialiser) => {
                    (0, Link_17.default)(path)
                        .and(Button_31.default)
                        .style('primary-nav-link')
                        .type('flush')
                        .text.use(translation)
                        .override('setIcon', (button, original) => icon => original(icon)
                        .tweak(button => button.icon?.style('primary-nav-link-icon')))
                        .tweak(button => button
                        .style.bind(button.disabled, 'button--disabled', 'primary-nav-link--disabled'))
                        .tweak(button => button
                        .textWrapper.style('primary-nav-link-text'))
                        .tweak(initialiser)
                        .appendTo(addTo);
                    return addTo;
                };
            }
        }
        //#endregion
        ////////////////////////////////////
        ////////////////////////////////////
        //#region Content
        Group('top', 'sidebar/section/browse')
            .add('/', 'sidebar/link/new', button => button.setIcon('calendar-plus'))
            .using(Session_26.default.Auth.author, (group, author) => group
            .add('/feed', 'sidebar/link/feed', button => button.setIcon('heart')
            .setDisabled(!author, 'no author'))
            .add('/history', 'sidebar/link/history', button => button.setIcon('clock-rotate-left')
            .setDisabled(!author, 'no author')));
        (0, Slot_22.default)()
            .use(Session_26.default.Auth.author, (slot, author) => author
            && Group('top', 'sidebar/section/create')
                .tweak(group => {
                for (const work of author.works ?? [])
                    group.add(`/work/${work.author}/${work.vanity}`, StringApplicator_10.Quilt.fake(work.name), button => button.setIcon('book'));
            })
                .add('/work/new', 'sidebar/link/create-work', button => button.setIcon('plus')))
            .appendTo(top);
        Group('bottom', 'sidebar/section/profile')
            .using(Session_26.default.Auth.author, (group, author) => {
            if (author)
                group
                    .add(`/author/${author.vanity}`, StringApplicator_10.Quilt.fake(author.name), button => button
                    .setIcon('circle-user')
                    .ariaLabel.use(quilt => quilt['sidebar/link/profile'](author.name)))
                    .add('/account', 'sidebar/link/settings', button => button.setIcon('id-card'));
            else
                group
                    .add('/account', 'sidebar/link/login', button => button.setIcon('circle-user'));
        });
        if (Env_12.default.ENVIRONMENT === 'dev')
            Group('bottom', 'sidebar/section/dev')
                .add('/debug', 'sidebar/link/debug', button => button.setIcon('bug'));
        //#endregion
        ////////////////////////////////////
        return nav;
    });
});
define("ui/component/Sidebar", ["require", "exports", "ui/Component", "utility/Store"], function (require, exports, Component_76, Store_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Component_76 = __importDefault(Component_76);
    Store_5 = __importDefault(Store_5);
    const Sidebar = Component_76.default.Builder('nav', (sidebar) => {
        sidebar.style('sidebar')
            .ariaLabel.use('masthead/primary-nav/alt');
        updateSidebarVisibility();
        return sidebar.extend(sidebar => ({
            toggle: () => {
                Store_5.default.items.sidebar = !Store_5.default.items.sidebar;
                updateSidebarVisibility();
                return sidebar;
            },
        }));
        function updateSidebarVisibility() {
            sidebar.style.toggle(!!Store_5.default.items.sidebar, 'sidebar--visible');
        }
    });
    exports.default = Sidebar;
});
define("ui/component/Masthead", ["require", "exports", "model/Notifications", "model/Session", "ui/Component", "ui/component/core/Button", "ui/component/core/Link", "ui/component/core/Slot", "ui/component/masthead/Flag", "ui/component/NotificationList", "ui/component/PrimaryNav", "ui/component/Sidebar", "ui/utility/Viewport", "utility/AbortPromise", "utility/Env"], function (require, exports, Notifications_3, Session_27, Component_77, Button_32, Link_18, Slot_23, Flag_1, NotificationList_2, PrimaryNav_1, Sidebar_1, Viewport_7, AbortPromise_8, Env_13) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Notifications_3 = __importDefault(Notifications_3);
    Session_27 = __importDefault(Session_27);
    Component_77 = __importDefault(Component_77);
    Button_32 = __importDefault(Button_32);
    Link_18 = __importDefault(Link_18);
    Slot_23 = __importDefault(Slot_23);
    Flag_1 = __importDefault(Flag_1);
    NotificationList_2 = __importDefault(NotificationList_2);
    PrimaryNav_1 = __importDefault(PrimaryNav_1);
    Sidebar_1 = __importDefault(Sidebar_1);
    Viewport_7 = __importDefault(Viewport_7);
    AbortPromise_8 = __importDefault(AbortPromise_8);
    Env_13 = __importDefault(Env_13);
    const MASTHEAD_CLASS = '_masthead';
    const Masthead = Component_77.default.Builder('header', (masthead, view) => {
        masthead.style('masthead').classes.add(MASTHEAD_CLASS);
        const sidebar = (0, Sidebar_1.default)();
        const nav = (0, PrimaryNav_1.default)();
        (0, Button_32.default)()
            .style('masthead-skip-nav')
            .text.use('masthead/skip-navigation')
            .event.subscribe('click', view.focus)
            .appendTo(masthead);
        let popover;
        const left = (0, Component_77.default)()
            .append((0, Component_77.default)()
            .and(Button_32.default)
            .setIcon('bars')
            .type('icon')
            .style('masthead-left-hamburger', 'masthead-left-hamburger-sidebar')
            .ariaHidden()
            .event.subscribe('click', sidebar.toggle))
            .append((0, Button_32.default)()
            .setIcon('bars')
            .type('icon')
            .style('masthead-left-hamburger', 'masthead-left-hamburger-popover')
            .ariaLabel.use('masthead/primary-nav/alt')
            .clearPopover()
            .setPopover('hover', p => popover = p
            .style('primary-nav-popover')
            .anchor.add('aligned left', 'off bottom')
            .ariaRole('navigation')))
            .style('masthead-left')
            .appendTo(masthead);
        sidebar.style.bind(masthead.hasFocused, 'sidebar--visible-due-to-keyboard-navigation');
        let sizeTimeout;
        Viewport_7.default.size.use(masthead, () => {
            window.clearTimeout(sizeTimeout);
            sizeTimeout = window.setTimeout(() => {
                const sidebarMode = !!sidebar.element.clientWidth;
                nav
                    .style.toggle(sidebarMode, 'primary-nav--sidebar')
                    .appendTo(sidebarMode ? sidebar : popover);
            }, 1);
        });
        const flag = (0, Flag_1.default)()
            .style('masthead-home-logo');
        const homeLink = (0, Link_18.default)('/')
            .ariaLabel.use('home/label')
            .clearPopover()
            .append((0, Component_77.default)()
            .and(Button_32.default)
            .style('masthead-home', 'heading')
            .append(flag)
            .append((0, Component_77.default)('img')
            .style('masthead-home-logo-wordmark')
            .ariaHidden()
            .attributes.set('src', `${Env_13.default.URL_ORIGIN}image/logo-wordmark.svg`)))
            .appendTo(left);
        flag.style.bind(homeLink.hoveredOrFocused, 'flag--focused');
        flag.style.bind(homeLink.active, 'flag--active');
        homeLink.hoveredOrFocused.subscribe(masthead, focus => flag.wave('home link focus', focus));
        (0, Component_77.default)()
            .style('masthead-search')
            .appendTo(masthead);
        (0, Slot_23.default)()
            .style.remove('slot')
            .style('masthead-user')
            .if(Session_27.default.Auth.loggedIn, () => (0, Component_77.default)()
            ////////////////////////////////////
            //#region Notifications Button
            .append((0, Button_32.default)()
            .setIcon('bell')
            .type('icon')
            .style('masthead-user-notifications')
            .clearPopover()
            .ariaLabel.use('masthead/user/notifications/alt')
            .append((0, Slot_23.default)().use(Notifications_3.default.unreadCount, (slot, count) => !count ? undefined
            : (0, Component_77.default)()
                .style('masthead-user-notifications-badge')
                .text.set(`${count}`)))
            .setPopover('hover', popover => popover
            .style('masthead-user-notifications-popover')
            .anchor.add('aligned right', 'off bottom')
            .anchor.add('aligned left', `.${MASTHEAD_CLASS}`, 'off bottom')
            .append((0, Slot_23.default)().use(Notifications_3.default.cache, AbortPromise_8.default.asyncFunction(async (signal, slot, notifications) => {
            const list = await (0, NotificationList_2.default)(true, 5);
            if (signal.aborted)
                return;
            list.paginator.type('flush')
                .style('masthead-user-notifications-list');
            list.paginator.header.style('masthead-user-notifications-list-header');
            list.paginator.title.style('masthead-user-notifications-list-title');
            list.paginator.content.style('masthead-user-notifications-list-content');
            list.paginator.footer.style('masthead-user-notifications-list-footer');
            for (const action of list.paginator.primaryActions.getChildren())
                if (action.is(Button_32.default))
                    action.style('masthead-user-notifications-list-action');
            (0, Link_18.default)('/notifications')
                .and(Button_32.default)
                .type('flush')
                .text.use('masthead/user/notifications/link/label')
                .appendTo(list.paginator.footer.middle);
            list.appendTo(slot);
        })))))
            //#endregion
            ////////////////////////////////////
            ////////////////////////////////////
            //#region Profile Button
            .append((0, Button_32.default)()
            .setIcon('circle-user')
            .type('icon')
            .clearPopover()
            .ariaLabel.use('masthead/user/profile/alt')
            .setPopover('hover', popover => popover
            .anchor.add('aligned right', 'off bottom')
            .ariaRole('navigation')
            .append((0, Slot_23.default)()
            .style('action-group')
            .style.remove('slot')
            .use(Session_27.default.Auth.author, (slot, author) => {
            if (!author)
                return;
            (0, Link_18.default)(`/author/${author.vanity}`)
                .and(Button_32.default)
                .type('flush')
                .style('masthead-popover-link-button')
                .tweak(button => button.textWrapper.style('masthead-popover-link-button-text'))
                .setIcon('circle-user')
                .text.set(author.name)
                .ariaLabel.use(quilt => quilt['masthead/user/profile/popover/profile'](author.name))
                .appendTo(slot);
            (0, Link_18.default)('/account')
                .and(Button_32.default)
                .type('flush')
                .style('masthead-popover-link-button')
                .setIcon('id-card')
                .text.use('masthead/user/profile/popover/account')
                .appendTo(slot);
            (0, Button_32.default)()
                .type('flush')
                .style('masthead-popover-link-button')
                .setIcon('arrow-right-from-bracket')
                .text.use('view/account/action/logout')
                .event.subscribe('click', () => Session_27.default.reset())
                .appendTo(slot);
        }))))
        //#endregion
        ////////////////////////////////////
        )
            .else(() => (0, Button_32.default)()
            .style('masthead-user-action-login')
            .type('primary')
            .setIcon('circle-user')
            .text.use('masthead/action/login')
            .event.subscribe('click', () => navigate.toURL('/account')))
            .appendTo(masthead);
        return masthead.extend(masthead => ({
            sidebar,
        }));
    });
    exports.default = Masthead;
});
define("ui/component/Mention", ["require", "exports", "lang/en-nz", "ui/Component", "ui/component/core/Link", "ui/utility/MarkdownContent"], function (require, exports, en_nz_20, Component_78, Link_19, MarkdownContent_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.registerMarkdownMentionHandler = registerMarkdownMentionHandler;
    en_nz_20 = __importDefault(en_nz_20);
    Component_78 = __importDefault(Component_78);
    Link_19 = __importDefault(Link_19);
    MarkdownContent_4 = __importDefault(MarkdownContent_4);
    const Mention = Component_78.default.Builder('a', (component, author) => {
        return component
            .and(Link_19.default, author && `/author/${author.vanity}`)
            .append((0, Component_78.default)().style('mention-punctuation').text.set('@'))
            .append((0, Component_78.default)().style('mention-author-name').text.set(author?.name ?? en_nz_20.default['shared/mention/unresolved']()))
            .style('mention');
    });
    exports.default = Mention;
    function registerMarkdownMentionHandler() {
        MarkdownContent_4.default.handle((element, context) => {
            if (element.tagName !== 'MENTION')
                return;
            return () => {
                const vanity = element.getAttribute('vanity');
                const author = context.mentions?.find(author => author.vanity === vanity);
                const mention = Mention(author);
                element.replaceWith(mention.element);
            };
        });
    }
});
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
            document.addEventListener('mousedown', updateActive);
            document.addEventListener('mouseup', updateActive);
            function updateActive() {
                const allActive = document.querySelectorAll(':active');
                const active = allActive[allActive.length - 1];
                if (active === lastActive[lastActive.length - 1])
                    return;
                const newActive = [...allActive];
                for (const element of lastActive)
                    if (element.component && !newActive.includes(element))
                        element.component.active.asMutable?.setValue(false);
                for (const element of newActive)
                    if (element.component && !lastActive.includes(element))
                        element.component.active.asMutable?.setValue(true);
                lastActive = newActive;
            }
        }
        ActiveListener.listen = listen;
    })(ActiveListener || (ActiveListener = {}));
    exports.default = ActiveListener;
    Object.assign(window, { ActiveListener });
});
define("App", ["require", "exports", "lang/en-nz", "model/FormInputLengths", "model/Session", "navigation/Navigate", "style", "ui/Component", "ui/component/core/ExternalLink", "ui/component/core/Link", "ui/component/core/toast/ToastList", "ui/component/Masthead", "ui/component/Mention", "ui/InputBus", "ui/utility/ActiveListener", "ui/utility/FocusListener", "ui/utility/FontsListener", "ui/utility/HoverListener", "ui/utility/Mouse", "ui/utility/StringApplicator", "ui/utility/Viewport", "ui/view/shared/component/ViewContainer", "utility/Async", "utility/DevServer", "utility/Store", "utility/Time"], function (require, exports, en_nz_21, FormInputLengths_6, Session_28, Navigate_1, style_2, Component_79, ExternalLink_2, Link_20, ToastList_1, Masthead_1, Mention_1, InputBus_3, ActiveListener_1, FocusListener_3, FontsListener_2, HoverListener_2, Mouse_5, StringApplicator_11, Viewport_8, ViewContainer_1, Async_5, DevServer_2, Store_6, Time_12) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    en_nz_21 = __importDefault(en_nz_21);
    FormInputLengths_6 = __importDefault(FormInputLengths_6);
    Session_28 = __importDefault(Session_28);
    Navigate_1 = __importDefault(Navigate_1);
    style_2 = __importDefault(style_2);
    Component_79 = __importDefault(Component_79);
    ExternalLink_2 = __importDefault(ExternalLink_2);
    Link_20 = __importDefault(Link_20);
    ToastList_1 = __importDefault(ToastList_1);
    Masthead_1 = __importDefault(Masthead_1);
    InputBus_3 = __importDefault(InputBus_3);
    ActiveListener_1 = __importDefault(ActiveListener_1);
    FocusListener_3 = __importDefault(FocusListener_3);
    FontsListener_2 = __importDefault(FontsListener_2);
    HoverListener_2 = __importDefault(HoverListener_2);
    Mouse_5 = __importDefault(Mouse_5);
    Viewport_8 = __importDefault(Viewport_8);
    ViewContainer_1 = __importDefault(ViewContainer_1);
    Async_5 = __importDefault(Async_5);
    DevServer_2 = __importDefault(DevServer_2);
    Store_6 = __importDefault(Store_6);
    Time_12 = __importDefault(Time_12);
    StringApplicator_11.QuiltHelper.init({
        Component: Component_79.default,
        Link: Link_20.default,
        ExternalLink: ExternalLink_2.default,
    });
    (0, Mention_1.registerMarkdownMentionHandler)();
    async function App() {
        if (location.pathname.startsWith('/auth/')) {
            if (location.pathname.endsWith('/error')) {
                const params = new URLSearchParams(location.search);
                // eslint-disable-next-line no-debugger
                debugger;
                Store_6.default.items.popupError = {
                    code: +(params.get('code') ?? '500'),
                    message: params.get('message') ?? 'Internal Server Error',
                };
            }
            window.close();
        }
        await screen?.orientation?.lock?.('portrait-primary').catch(() => { });
        InputBus_3.default.subscribe('down', event => {
            if (event.use('F6'))
                for (const stylesheet of document.querySelectorAll('link[rel=stylesheet]')) {
                    const href = stylesheet.getAttribute('href');
                    const newHref = `${href.slice(0, Math.max(0, href.indexOf('?')) || Infinity)}?${Math.random().toString().slice(2)}`;
                    stylesheet.setAttribute('href', newHref);
                }
            if (event.use('F4'))
                document.documentElement.classList.add('persist-tooltips');
        });
        InputBus_3.default.subscribe('up', event => {
            if (event.use('F4'))
                document.documentElement.classList.remove('persist-tooltips');
        });
        Component_79.default.allowBuilding();
        await FormInputLengths_6.default.getManifest();
        // const path = URL.path ?? URL.hash;
        // if (path === AuthView.id) {
        // 	URL.hash = null;
        // 	URL.path = null;
        // }
        // ViewManager.showByHash(URL.path ?? URL.hash);
        await Promise.race([
            Session_28.default.refresh(),
            Async_5.default.sleep(Time_12.default.seconds(2)),
        ]);
        const navigate = (0, Navigate_1.default)();
        HoverListener_2.default.listen();
        ActiveListener_1.default.listen();
        FocusListener_3.default.listen();
        Mouse_5.default.listen();
        Viewport_8.default.listen();
        void FontsListener_2.default.listen();
        DevServer_2.default.connect();
        document.title = en_nz_21.default['fluff4me/title']().toString();
        document.body.classList.add(...style_2.default.body);
        const view = (0, ViewContainer_1.default)();
        const masthead = (0, Masthead_1.default)(view);
        const related = (0, Component_79.default)()
            .style('app-content-related');
        const content = (0, Component_79.default)()
            .style('app-content')
            .append(view, related);
        Component_79.default.wrap(document.documentElement).monitorScrollEvents();
        Component_79.default.wrap(document.body).monitorScrollEvents();
        Component_79.default.wrap(window).monitorScrollEvents();
        const app = (0, Component_79.default)()
            .style('app')
            .append(masthead, masthead.sidebar, content)
            .append((0, ToastList_1.default)())
            .extend(app => ({
            navigate,
            view,
        }))
            .tweak(Navigate_1.default.setApp)
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
    exports.APP_NAME = 'fluff4.me / Queer Webnovels';
});
define("utility/DOMRect", ["require", "exports", "utility/Define", "utility/maths/Vector2"], function (require, exports, Define_6, Vector2_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = default_1;
    Define_6 = __importDefault(Define_6);
    Vector2_3 = __importDefault(Vector2_3);
    function default_1() {
        Define_6.default.magic(DOMRect.prototype, 'centreX', {
            get() {
                return this.left + this.width / 2;
            },
        });
        Define_6.default.magic(DOMRect.prototype, 'centreY', {
            get() {
                return this.top + this.height / 2;
            },
        });
        Define_6.default.magic(DOMRect.prototype, 'centre', {
            get() {
                return (0, Vector2_3.default)(this.left + this.width / 2, this.top + this.height / 2);
            },
        });
        Define_6.default.magic(DOMRect.prototype, 'position', {
            get() {
                return (0, Vector2_3.default)(this.left, this.top);
            },
        });
        (0, Define_6.default)(DOMRect.prototype, 'expand', function (amount) {
            return new DOMRect(this.x - amount, this.y - amount, this.width + amount * 2, this.height + amount * 2);
        });
        (0, Define_6.default)(DOMRect.prototype, 'contract', function (amount) {
            return new DOMRect(Math.min(this.x + amount, this.centreX), Math.min(this.y - amount, this.centreY), Math.max(0, this.width - amount * 2), Math.max(0, this.height - amount * 2));
        });
        (0, Define_6.default)(DOMRect.prototype, 'intersects', function (target) {
            if ('width' in target)
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
define("utility/Elements", ["require", "exports", "utility/Define"], function (require, exports, Define_7) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Define_7 = __importDefault(Define_7);
    var Elements;
    (function (Elements) {
        function applyPrototypes() {
            Define_7.default.set(Element.prototype, 'asType', function (tagName) {
                return this.tagName.toLowerCase() === tagName ? this : undefined;
            });
        }
        Elements.applyPrototypes = applyPrototypes;
    })(Elements || (Elements = {}));
    exports.default = Elements;
});
define("utility/Maps", ["require", "exports", "utility/Define"], function (require, exports, Define_8) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Define_8 = __importDefault(Define_8);
    var Maps;
    (function (Maps) {
        function applyPrototypes() {
            (0, Define_8.default)(Map.prototype, 'compute', function (key, provider) {
                if (this.has(key))
                    return this.get(key);
                const value = provider(key);
                this.set(key, value);
                return value;
            });
        }
        Maps.applyPrototypes = applyPrototypes;
    })(Maps || (Maps = {}));
    exports.default = Maps;
});
define("index", ["require", "exports", "utility/Arrays", "utility/DOMRect", "utility/Elements", "browser-source-map-support", "utility/Env", "utility/Maps"], function (require, exports, Arrays_11, DOMRect_1, Elements_1, browser_source_map_support_1, Env_14, Maps_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Arrays_11 = __importDefault(Arrays_11);
    DOMRect_1 = __importDefault(DOMRect_1);
    Elements_1 = __importDefault(Elements_1);
    browser_source_map_support_1 = __importDefault(browser_source_map_support_1);
    Env_14 = __importDefault(Env_14);
    Maps_1 = __importDefault(Maps_1);
    Object.assign(window, {
        _: undefined,
        select: (fn) => fn(),
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    browser_source_map_support_1.default.install({
        environment: 'browser',
    });
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
    Arrays_11.default.applyPrototypes();
    Maps_1.default.applyPrototypes();
    Elements_1.default.applyPrototypes();
    void (async () => {
        await Env_14.default.load();
        const app = await new Promise((resolve_2, reject_2) => { require(['App'], resolve_2, reject_2); }).then(__importStar);
        await app.default();
    })();
});
define("endpoint/follow/EndpointFollowGet", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_52) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_52 = __importDefault(Endpoint_52);
    exports.default = {
        Author: (0, Endpoint_52.default)('/follows/author/{vanity}', 'get'),
        Work: (0, Endpoint_52.default)('/follows/work/{vanity}', 'get'),
        Tag: (0, Endpoint_52.default)('/follows/tag/{vanity}', 'get'),
        Category: (0, Endpoint_52.default)('/follows/category/{vanity}', 'get'),
    };
});
define("endpoint/follow/EndpointFollowGetAll", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_53) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_53 = __importDefault(Endpoint_53);
    exports.default = (0, Endpoint_53.default)('/following/{type}', 'get');
});
define("endpoint/follow/EndpointFollowGetWork", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_54) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_54 = __importDefault(Endpoint_54);
    exports.default = (0, Endpoint_54.default)('/follows/work/{author}/{vanity}', 'get');
});
define("endpoint/follow/EndpointIgnoreGet", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_55) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_55 = __importDefault(Endpoint_55);
    exports.default = {
        Author: (0, Endpoint_55.default)('/ignores/author/{vanity}', 'get'),
        Work: (0, Endpoint_55.default)('/ignores/work/{vanity}', 'get'),
        Tag: (0, Endpoint_55.default)('/ignores/tag/{vanity}', 'get'),
        Category: (0, Endpoint_55.default)('/ignores/category/{vanity}', 'get'),
    };
});
define("endpoint/follow/EndpointIgnoreGetAll", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_56) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_56 = __importDefault(Endpoint_56);
    exports.default = (0, Endpoint_56.default)('/ignoring/{type}', 'get');
});
define("endpoint/follow/EndpointIgnoreGetWork", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_57) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_57 = __importDefault(Endpoint_57);
    exports.default = (0, Endpoint_57.default)('/ignores/work/{author}/{vanity}', 'get');
});
define("endpoint/history/EndpointHistoryDeleteChapter", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_58) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_58 = __importDefault(Endpoint_58);
    exports.default = (0, Endpoint_58.default)('/history/delete/{author}/{work}/chapter/{url}', 'post');
});
define("endpoint/history/EndpointHistoryDeleteWork", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_59) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_59 = __importDefault(Endpoint_59);
    exports.default = (0, Endpoint_59.default)('/history/delete/{author}/{vanity}', 'post');
});
define("endpoint/notification/EndpointNotificationGetUnread", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_60) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_60 = __importDefault(Endpoint_60);
    exports.default = (0, Endpoint_60.default)('/notifications/get/unread', 'get');
});
define("endpoint/patreon/EndpointPatreonGetTiers", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_61) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_61 = __importDefault(Endpoint_61);
    exports.default = (0, Endpoint_61.default)('/patreon/campaign/tiers/get', 'get');
});
define("endpoint/patreon/EndpointPatreonSetThresholds", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_62) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_62 = __importDefault(Endpoint_62);
    exports.default = (0, Endpoint_62.default)('/patreon/campaign/tiers/set/{author}/{vanity}', 'post');
});
define("endpoint/privilege/EndpointPrivilegeGetAllAuthor", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_63) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_63 = __importDefault(Endpoint_63);
    exports.default = (0, Endpoint_63.default)('/privilege/get/{vanity}', 'get');
});
define("endpoint/privilege/EndpointPrivilegeGrantAuthor", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_64) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_64 = __importDefault(Endpoint_64);
    exports.default = (0, Endpoint_64.default)('/privilege/grant/author/{vanity}', 'post');
});
define("endpoint/privilege/EndpointPrivilegeGrantRole", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_65) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_65 = __importDefault(Endpoint_65);
    exports.default = (0, Endpoint_65.default)('/privilege/grant/role/{vanity}', 'post');
});
define("endpoint/privilege/EndpointPrivilegeRevokeAuthor", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_66) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_66 = __importDefault(Endpoint_66);
    exports.default = (0, Endpoint_66.default)('/privilege/revoke/author/{vanity}', 'post');
});
define("endpoint/privilege/EndpointPrivilegeRevokeRole", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_67) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_67 = __importDefault(Endpoint_67);
    exports.default = (0, Endpoint_67.default)('/privilege/revoke/role/{vanity}', 'post');
});
define("endpoint/role/EndpointRoleCreate", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_68) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_68 = __importDefault(Endpoint_68);
    exports.default = (0, Endpoint_68.default)('/role/create', 'post');
});
define("endpoint/role/EndpointRoleDelete", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_69) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_69 = __importDefault(Endpoint_69);
    exports.default = (0, Endpoint_69.default)('/role/delete/{role}', 'post');
});
define("endpoint/role/EndpointRoleGrantAuthor", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_70) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_70 = __importDefault(Endpoint_70);
    exports.default = (0, Endpoint_70.default)('/role/grant/{role}/{author}', 'post');
});
define("endpoint/role/EndpointRoleListAll", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_71) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_71 = __importDefault(Endpoint_71);
    exports.default = (0, Endpoint_71.default)('/role/get', 'get');
});
define("endpoint/role/EndpointRoleReorder", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_72) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_72 = __importDefault(Endpoint_72);
    exports.default = (0, Endpoint_72.default)('/role/reorder', 'post');
});
define("endpoint/role/EndpointRoleRevokeAuthor", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_73) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_73 = __importDefault(Endpoint_73);
    exports.default = (0, Endpoint_73.default)('/role/revoke/{role}/{author}', 'post');
});
define("endpoint/role/EndpointRoleUpdate", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_74) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_74 = __importDefault(Endpoint_74);
    exports.default = (0, Endpoint_74.default)('/role/update/{role}', 'post');
});
define("endpoint/tag/EndpointTagCreateCategory", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_75) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_75 = __importDefault(Endpoint_75);
    exports.default = (0, Endpoint_75.default)('/tag/create/category', 'post');
});
define("endpoint/tag/EndpointTagCreateGlobal", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_76) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_76 = __importDefault(Endpoint_76);
    exports.default = (0, Endpoint_76.default)('/tag/create/global', 'post');
});
define("endpoint/tag/EndpointTagCustomPromote", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_77) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_77 = __importDefault(Endpoint_77);
    exports.default = (0, Endpoint_77.default)('/tag/promote/{vanity}', 'post');
});
define("endpoint/tag/EndpointTagDeleteCategory", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_78) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_78 = __importDefault(Endpoint_78);
    exports.default = (0, Endpoint_78.default)('/tag/delete/category/{vanity}', 'post');
});
define("endpoint/tag/EndpointTagDeleteGlobal", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_79) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_79 = __importDefault(Endpoint_79);
    exports.default = (0, Endpoint_79.default)('/tag/delete/global/{vanity}', 'post');
});
define("endpoint/tag/EndpointTagGlobalDemote", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_80) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_80 = __importDefault(Endpoint_80);
    exports.default = (0, Endpoint_80.default)('/tag/demote/{vanity}', 'post');
});
define("endpoint/tag/EndpointTagUpdateCategory", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_81) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_81 = __importDefault(Endpoint_81);
    exports.default = (0, Endpoint_81.default)('/tag/update/category/{vanity}', 'post');
});
define("endpoint/tag/EndpointTagUpdateGlobal", ["require", "exports", "endpoint/Endpoint"], function (require, exports, Endpoint_82) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Endpoint_82 = __importDefault(Endpoint_82);
    exports.default = (0, Endpoint_82.default)('/tag/update/global/{vanity}', 'post');
});
define("ui/component/core/ActionHeading", ["require", "exports", "ui/Component", "ui/component/core/ActionRow", "ui/component/core/Heading"], function (require, exports, Component_80, ActionRow_7, Heading_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Component_80 = __importDefault(Component_80);
    ActionRow_7 = __importDefault(ActionRow_7);
    Heading_5 = __importDefault(Heading_5);
    const ActionHeading = Component_80.default.Builder((component) => {
        const row = component.and(ActionRow_7.default)
            .viewTransition('action-heading')
            .style('action-heading');
        const heading = row.left.and(Heading_5.default).style('action-heading-heading');
        return row.extend(row => ({
            heading,
        }));
    });
    exports.default = ActionHeading;
});
define("ui/view/TestView", ["require", "exports", "markdown-it", "ui/Component", "ui/component/core/Block", "ui/component/core/TextEditor", "ui/view/shared/component/View", "ui/view/shared/component/ViewDefinition", "utility/Env", "utility/string/MarkdownItHTML"], function (require, exports, markdown_it_2, Component_81, Block_18, TextEditor_5, View_17, ViewDefinition_17, Env_15, MarkdownItHTML_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    markdown_it_2 = __importDefault(markdown_it_2);
    Component_81 = __importDefault(Component_81);
    Block_18 = __importDefault(Block_18);
    TextEditor_5 = __importDefault(TextEditor_5);
    View_17 = __importDefault(View_17);
    ViewDefinition_17 = __importDefault(ViewDefinition_17);
    Env_15 = __importDefault(Env_15);
    MarkdownItHTML_2 = __importDefault(MarkdownItHTML_2);
    exports.default = (0, ViewDefinition_17.default)({
        create: () => {
            const view = (0, View_17.default)('home');
            const block = (0, Block_18.default)().appendTo(view.content);
            block.title.text.set('Test the text editor');
            block.description.text.set('fluff4.me is still a work-in-progress. In the meantime, feel free to play with this!');
            // const form = block.and(Form, block.title)
            (0, TextEditor_5.default)()
                .appendTo(block.content);
            if (Env_15.default.isDev) {
                (0, Component_81.default)('br').appendTo(block.content);
                const output = (0, Component_81.default)('div');
                (0, Component_81.default)('div')
                    .attributes.set('contenteditable', 'plaintext-only')
                    .style.setProperty('white-space', 'pre-wrap')
                    .style.setProperty('font', 'inherit')
                    .style.setProperty('background', '#222')
                    .style.setProperty('width', '100%')
                    .style.setProperty('height', '400px')
                    .style.setProperty('padding', '0.5em')
                    .style.setProperty('box-sizing', 'border-box')
                    .event.subscribe('input', event => {
                    const text = event.host.element.textContent ?? '';
                    const md = new markdown_it_2.default('commonmark', { html: true, breaks: true });
                    MarkdownItHTML_2.default.use(md, MarkdownItHTML_2.default.Options()
                        .disallowTags('img', 'figure', 'figcaption', 'map', 'area'));
                    console.log(md.parse(text, {}));
                    output.element.innerHTML = md.render(text);
                })
                    .appendTo(block.content);
                output
                    .style.setProperty('font', 'inherit')
                    .style.setProperty('background', '#222')
                    .style.setProperty('width', '100%')
                    .style.setProperty('padding', '0.5em')
                    .style.setProperty('margin-top', '1em')
                    .style.setProperty('box-sizing', 'border-box')
                    .appendTo(block.content);
            }
            return view;
        },
    });
});
define("utility/Debug", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Debug = void 0;
    var Debug;
    (function (Debug) {
        Debug.placeholder = false;
    })(Debug || (exports.Debug = Debug = {}));
    Object.assign(window, { Debug });
});
define("utility/Tuples", ["require", "exports", "utility/Arrays"], function (require, exports, Arrays_12) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Arrays_12 = __importDefault(Arrays_12);
    var Tuples;
    (function (Tuples) {
        function make(...values) {
            return values;
        }
        Tuples.make = make;
        const nullishFilters = Object.fromEntries(Arrays_12.default.range(6)
            .map(index => make(index, (value) => value[index] !== undefined && value[index] !== null)));
        function filterNullish(index) {
            return nullishFilters[index];
        }
        Tuples.filterNullish = filterNullish;
        const falsyFilters = Object.fromEntries(Arrays_12.default.range(6)
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            .map(index => make(index, (value) => value[index])));
        function filterFalsy(index) {
            return falsyFilters[index];
        }
        Tuples.filterFalsy = filterFalsy;
        function getter(index) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
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
