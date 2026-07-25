import * as Common from './common';
import * as Surge from './surge';

export interface Script {
    name: string;
    startTime: Date;
    type: string;
}

export interface Environment {
    system: string;
    ['stash-build']: string;
    ['stash-version']: string;
    language: string;
    ['device-model']?: string;
}

export interface PersistentStore {
    write: (data: string, key?: string) => boolean;
    read: (key?: string) => string | null;
}

export interface HttpClient extends Surge.HttpClient {}

export interface Notification {
    post: (title: string, subtitle: string, body: string) => void;
}

export interface HttpRequest extends Common.HttpRequest {}

export interface HttpResponse extends Common.HttpResponse {}

export interface HttpRequestDone extends Common.HttpRequestDone {
    response?: HttpResponseDone;
}

export interface HttpResponseDone extends Omit<Common.HttpResponseDone, 'h2_trailers'> {}

export type Done = (result?: HttpRequestDone | HttpResponseDone) => void;
