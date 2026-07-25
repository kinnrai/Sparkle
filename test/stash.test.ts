import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import { gzipSync } from 'node:zlib';
import { isStashEnvironment, toStashDoneResult } from '../src/core/stash';
import { ungzip } from '../src/utils';

test('detects Stash without mistaking Surge for Stash', () => {
    assert.equal(isStashEnvironment({ 'stash-version': '3.3.3' }), true);
    assert.equal(isStashEnvironment({ 'surge-version': '6.0.0' }), false);
    assert.equal(isStashEnvironment(undefined), false);
});

test('normalizes a Stash response and removes a stale content length', () => {
    const body = new Uint8Array([0, 0, 0, 0, 0]);
    const result = toStashDoneResult({
        status: 200,
        headers: {
            'Content-Type': 'application/grpc',
            'Content-Length': '99',
        },
        body,
    });

    assert.deepEqual(result, {
        status: 200,
        headers: {
            'Content-Type': 'application/grpc',
        },
        body,
    });
});

test('normalizes a mocked response nested in a request result', () => {
    const result = toStashDoneResult({
        response: {
            status: 200,
            headers: {
                'Content-Type': 'application/grpc',
            },
            body: new Uint8Array([0, 0, 0, 0, 0]),
        },
    });

    assert.ok('response' in result);
    assert.equal(result.response?.status, 200);
    assert.equal(result.response?.headers?.['Content-Type'], 'application/grpc');
});

test('falls back to bundled gzip support when the runtime has no $utils', () => {
    const source = new TextEncoder().encode('stash-compatible-grpc');
    const compressed = new Uint8Array(gzipSync(source));
    assert.deepEqual(ungzip(compressed), source);
});

test('processes a compressed gRPC response in the Stash runtime', async () => {
    const source = new Uint8Array([0x0a, 0x08, 0x0a, 0x02, 0x08, 0x0f, 0x0a, 0x02, 0x08, 0x01]);
    const compressed = new Uint8Array(gzipSync(source));
    const frame = new Uint8Array(compressed.length + 5);
    frame[0] = 1;
    new DataView(frame.buffer).setUint32(1, compressed.length);
    frame.set(compressed, 5);

    const calls: unknown[] = [];
    let finish: (value: unknown) => void = () => undefined;
    const completed = new Promise<unknown>(resolve => {
        finish = resolve;
    });
    const sourceCode = await readFile('dist/bilibili.protobuf.response.js', 'utf8');
    const sandbox = {
        $argument: '{"displayUpList":"auto","purifyComment":true,"sponsorBlock":false,"logLevel":"error"}',
        $done: (value: unknown) => {
            calls.push(value);
            finish(value);
        },
        $environment: {
            system: 'iOS',
            language: 'zh-Hans',
            'stash-build': '1',
            'stash-version': '3.3.3',
            'device-model': 'iPhone',
        },
        $httpClient: {},
        $notification: {
            post: () => undefined,
        },
        $persistentStore: {
            read: () => null,
            write: () => true,
        },
        $request: {
            url: 'https://app.bilibili.com/bilibili.app.dynamic.v2.Dynamic/DynAll',
            method: 'POST',
            headers: {
                'x-bili-moss-engine-type': '1',
            },
        },
        $response: {
            status: 200,
            headers: {
                'Content-Type': 'application/grpc',
                'Content-Length': String(frame.length),
            },
            body: frame,
        },
        ArrayBuffer,
        DataView,
        TextDecoder,
        TextEncoder,
        URL,
        Uint8Array,
        clearTimeout,
        console,
        setTimeout,
    };

    vm.runInNewContext(sourceCode, sandbox);
    const result = (await completed) as {
        status: number;
        headers: Record<string, string>;
        body: Uint8Array;
    };
    await new Promise(resolve => setImmediate(resolve));

    assert.equal(calls.length, 1);
    assert.equal(result.status, 200);
    assert.equal(result.headers['Content-Length'], undefined);
    assert.equal(result.headers['grpc-status'], '0');
    assert.equal(result.body[0], 0);
    assert.equal(new DataView(result.body.buffer, result.body.byteOffset).getUint32(1), 6);
    assert.deepEqual(result.body.subarray(5), new Uint8Array([0x0a, 0x04, 0x0a, 0x02, 0x08, 0x01]));
});
