import * as Stash from '@/types/stash';
import { HttpRequestDone, HttpResponseDone } from '@/types/context';

type DoneResult = HttpRequestDone | HttpResponseDone;
type DoneSource = DoneResult | NonNullable<HttpRequestDone['response']>;
type DoneKey = 'url' | 'status' | 'headers' | 'body';

export function isStashEnvironment(environment: unknown): environment is Stash.Environment {
    return typeof environment === 'object' && environment !== null && 'stash-version' in environment;
}

function copyDefined(source: DoneSource, keys: DoneKey[]): Record<string, unknown> {
    const target: Record<string, unknown> = {};
    for (const key of keys) {
        const value = (source as Record<DoneKey, unknown>)[key];
        if (value !== undefined) {
            target[key] = value;
        }
    }
    return target;
}

function normalizeHeaders(source: DoneSource): Record<string, string> | undefined {
    const sourceHeaders = source.headers;
    if (!sourceHeaders) {
        return undefined;
    }

    const headers = { ...sourceHeaders };
    if (source.body !== undefined) {
        for (const key of Object.keys(headers)) {
            if (key.toLowerCase() === 'content-length') {
                delete headers[key];
            }
        }
    }
    return headers;
}

function normalizeDoneSource(source: DoneSource): Stash.HttpRequestDone | Stash.HttpResponseDone {
    const target = copyDefined(source, ['url', 'status', 'body']);
    const headers = normalizeHeaders(source);
    if (headers) {
        target.headers = headers;
    }
    return target;
}

export function toStashDoneResult(result: DoneResult): Stash.HttpRequestDone | Stash.HttpResponseDone {
    if ('response' in result && result.response) {
        return { response: normalizeDoneSource(result.response) as Stash.HttpResponseDone };
    }
    return normalizeDoneSource(result);
}
