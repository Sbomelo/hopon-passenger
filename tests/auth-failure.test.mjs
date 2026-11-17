import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    AUTH_FAILURE_EVENT, getMyTrips, getMapData, getEmergencyContact,
    upsertEmergencyContact, deleteEmergencyContact, verifyOtp, getNotifications, getBoardingStatus, boardTrip, alightTrip, getTripHistory, getAccessCheck,
} from '../src/api/hoponApi.js';

test('all authenticated API helpers signal logout for 401 and 403', async () => {
    const originalFetch = globalThis.fetch;
    const originalWindow = globalThis.window;
    globalThis.window = new EventTarget();
    const events = [];
    window.addEventListener(AUTH_FAILURE_EVENT, event => events.push(event.detail.token));
    try {
        const requests = [
            () => getMyTrips('session-token'),
            () => getNotifications('session-token'),
            () => getMapData(1, 'session-token'),
            ...[getBoardingStatus, boardTrip, alightTrip, getTripHistory, getAccessCheck].map(helper => () => helper(1, 'session-token')),
            () => getEmergencyContact('session-token'),
            () => upsertEmergencyContact('Contact', '+27000000001', 'session-token'),
            () => deleteEmergencyContact('session-token'),
        ];
        for (const status of [401, 403]) {
            globalThis.fetch = async () => new Response(null, { status });
            for (const request of requests) {
                const before = events.length;
                await assert.rejects(request, new RegExp(`Request failed \\(${status}\\)`));
                assert.equal(events.length, before + 1);
                assert.equal(events.at(-1), 'session-token');
            }
        }
        const before = events.length;
        globalThis.fetch = async () => new Response('"Incorrect code"', { status: 401 });
        await assert.rejects(() => verifyOtp('+27000000001', '000000'), /Incorrect code/);
        assert.equal(events.length, before, 'anonymous OTP errors must stay on the login form');
        for (const status of [404, 500]) {
            globalThis.fetch = async () => new Response(null, { status });
            await assert.rejects(() => getMyTrips('session-token'));
            assert.equal(events.length, before, 'other errors must not log out');
        }
        globalThis.fetch = async () => Response.json({ liveTrips: [] });
        assert.deepEqual(await getMyTrips('session-token'), { liveTrips: [] });
        assert.equal(events.length, before);
    } finally {
        globalThis.fetch = originalFetch;
        globalThis.window = originalWindow;
    }
});

test('boarding preserves plain-text API errors and accepts empty success bodies', async () => {
    const originalFetch = globalThis.fetch;
    try {
        globalThis.fetch = async () => new Response('Confirm boarding before confirming you have left the bus.', { status: 400 });
        await assert.rejects(() => alightTrip(1, 'token'), /Confirm boarding before confirming you have left the bus/);
        globalThis.fetch = async () => new Response(null, { status: 204 });
        assert.equal(await deleteEmergencyContact('token'), null);
    } finally { globalThis.fetch = originalFetch; }
});
