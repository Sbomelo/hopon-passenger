import test from 'node:test';
import assert from 'node:assert/strict';
import { updateLiveRoute } from '../src/utils/liveRoute.js';

const planned = [[30, -29], [30.05, -29], [30.1, -29]];

function fix(longitude, latitude, seconds) {
    return { longitude, latitude, recordedAt: new Date(Date.UTC(2026, 10, 21, 8, 0, seconds)).toISOString() };
}

test('a bus on a long segment and an isolated stray fix keep the planned route', () => {
    const result = updateLiveRoute(null, planned, [
        fix(30.02, -29, 0), fix(30.025, -29.004, 10), fix(30.03, -29, 20),
    ]);
    assert.equal(result.drawnPath, planned);
    assert.equal(result.detour, null);
    assert.ok(Math.abs(result.position.fraction - 0.6) < 0.001);
});

test('consecutive off-route fixes replace the line and rejoining preserves the detour', () => {
    const initial = [fix(30.02, -29, 0), fix(30.025, -29.004, 10), fix(30.03, -29.005, 20)];
    const detour = updateLiveRoute(null, planned, initial);
    assert.ok(detour.detour);
    assert.deepEqual(detour.drawnPath.slice(-2), [[30.025, -29.004], [30.03, -29.005]]);
    const extended = updateLiveRoute(detour, planned, [...initial, fix(30.04, -29.005, 30)]);
    assert.equal(extended.drawnPath.length, detour.drawnPath.length + 1);
    const rejoined = updateLiveRoute(extended, planned, [fix(30.06, -29, 40)]);
    assert.equal(rejoined.detour, null);
    assert.deepEqual(rejoined.drawnPath.slice(-3), [[30.04, -29.005], [30.06, -29], [30.1, -29]]);
    assert.equal(rejoined.position.segment, rejoined.drawnPath.length - 2);
});

test('stale fixes and distant samples cannot confirm a new detour', () => {
    const result = updateLiveRoute(null, planned, [
        fix(30.02, -29, 0), fix(30.025, -29.004, 10), fix(30.03, -29.005, 110), fix(30.04, -29.005, 15),
    ]);
    assert.equal(result.drawnPath, planned);
    assert.equal(result.detour, null);
});
