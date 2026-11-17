import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { formatDate, formatTime } from '../src/utils/format.js';

test('UTC timestamps display as SAST, including the date after midnight', () => {
    assert.equal(formatTime('2026-11-20T16:00:00Z'), '18:00');
    assert.equal(formatTime('2026-11-20T22:30:00Z'), '00:30');
    assert.equal(formatDate('2026-11-20T22:30:00Z'), 'Sat, 21 Nov');
    assert.equal(formatDate('2026-11-20T22:30:00Z', true), 'Sat, 21 Nov 2026');
});

test('formatters show a dash for missing or invalid values', () => {
    for (const value of [null, undefined, '', 'invalid']) {
        assert.equal(formatTime(value), '—');
        assert.equal(formatDate(value), '—');
    }
});

test('SAST display does not depend on the device timezone', () => {
    const moduleUrl = new URL('../src/utils/format.js', import.meta.url).href;
    const code = `import { formatDate, formatTime } from ${JSON.stringify(moduleUrl)};
        console.log(JSON.stringify([formatTime('2026-11-20T22:30:00Z'), formatDate('2026-11-20T22:30:00Z', true)]));`;
    for (const zone of ['UTC', 'America/New_York', 'Pacific/Auckland']) {
        const result = spawnSync(process.execPath, ['--input-type=module', '--eval', code], {
            env: { ...process.env, TZ: zone }, encoding: 'utf8',
        });
        assert.equal(result.status, 0, result.stderr);
        assert.deepEqual(JSON.parse(result.stdout), ['00:30', 'Sat, 21 Nov 2026'], zone);
    }
});
