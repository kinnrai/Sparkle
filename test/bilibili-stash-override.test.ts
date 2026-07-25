import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const stashOverridePath = 'release/stash/override/bilibili.stoverride';

test('keeps the original description and only states Stash feature differences', async () => {
    const override = await readFile(stashOverridePath, 'utf8');
    assert.match(override, /拜托，没有广告的哔哩哔哩真的超酷的/);
    assert.match(override, /不包含 P2P\/Tracker 禁用和空降助手/);
    assert.doesNotMatch(override, /原生覆写|透明改写|备用域名/);
});

test('keeps comment MainList as a native request', async () => {
    const override = await readFile(stashOverridePath, 'utf8');
    assert.equal(override.match(/MainList/g)?.length, 1, 'MainList must only match the response script');
});

test('transparently redirects the native gRPC host to the compatible endpoint', async () => {
    const override = await readFile(stashOverridePath, 'utf8');
    const mitmSection = override.match(/ {2}mitm:\n(?<entries>(?: {4}- .+\n)+)/)?.groups?.entries;

    assert.ok(mitmSection, 'the override must define a MitM section');
    assert.match(mitmSection, /^ {4}- grpc\.biliapi\.net$/m);
    assert.doesNotMatch(mitmSection, /^ {4}- -grpc\.biliapi\.net$/m);
    assert.match(mitmSection, /^ {4}- app\.bilibili\.com$/m);
    assert.match(override, /^ {4}- \^https:\\\/\\\/grpc\\\.biliapi\\\.net https:\/\/app\.bilibili\.com transparent$/m);
});

test('leaves Bilibili P2P and tracker traffic untouched', async () => {
    const override = await readFile(stashOverridePath, 'utf8');
    assert.doesNotMatch(override, /pd-proxy\/tracker|tracker\/conf/);
    assert.doesNotMatch(override, /127\.0\.0\.1:9|DST-PORT,3478|chat\.bilibili\.com/);
});

test('keeps Stash fallback-domain rules aligned with the other clients', async () => {
    const override = await readFile(stashOverridePath, 'utf8');
    const fallbackDomains = ['api.biliapi.com', 'app.biliapi.com', 'api.biliapi.net', 'app.biliapi.net'];

    for (const domain of fallbackDomains) {
        const pattern = domain.replaceAll('.', String.raw`\.`);
        assert.match(override, new RegExp(`^ {2}- DOMAIN,${pattern},REJECT$`, 'm'));
    }
});

test('omits SponsorBlock and request-side gRPC refetching', async () => {
    const override = await readFile(stashOverridePath, 'utf8');
    assert.doesNotMatch(override, /bsbsb\.top|DmSegMobile/);
    assert.doesNotMatch(override, /name: bilibili\.protobuf\.request/);
    assert.doesNotMatch(override, /^ {2}bilibili\.protobuf\.request:$/m);
    assert.doesNotMatch(override, /"sponsorBlock":true/);
    assert.match(override, /"sponsorBlock":false/);
});

test('documents the minimum Stash version required by mock rewrites', async () => {
    const readme = await readFile('src/script/bilibili/README.md', 'utf8');
    assert.match(readme, /要求 Stash 3\.2\.0 或更高版本/);
});
