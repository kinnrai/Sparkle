import * as Surge from './surge';
import * as Loon from './loon';
import * as QuantumultX from './quantumult-x';
import * as Stash from './stash';

declare global {
    const $network: Surge.Network;
    const $script: Surge.Script | Loon.Script | Stash.Script;
    const $environment: Surge.Environment | Stash.Environment;
    const $persistentStore: Surge.PersistentStore | Loon.PersistentStore | Stash.PersistentStore;
    const $httpAPI: Surge.HttpAPI;
    const $httpClient: Surge.HttpClient | Loon.HttpClient | Stash.HttpClient;
    const $utils: Surge.Utils | Loon.Utils;
    const $notification: Surge.Notification | Loon.Notification | Stash.Notification;
    const $request: Surge.HttpRequest | Loon.HttpRequest | Stash.HttpRequest | QuantumultX.HttpRequest;
    const $response: Surge.HttpResponse | Loon.HttpResponse | Stash.HttpResponse | QuantumultX.HttpResponse;
    const $done: Surge.Done | Loon.Done | Stash.Done | QuantumultX.Done;
    const $argument: string | object | undefined;
    const $loon: string;
    const $task: QuantumultX.Task;
    const $prefs: QuantumultX.Prefs;
    const $notify: QuantumultX.Notify;
}
