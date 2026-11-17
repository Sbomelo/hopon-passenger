import assert from 'node:assert/strict';
import { test } from 'node:test';
import { countUnread } from '../src/utils/notifications.js';
import { formatRelativeTime, formatDateTime } from '../src/utils/format.js';

test('unread comparison excludes seen timestamps and ignores malformed dates', () => {
    const items = [{ createdAt: '2026-11-17T12:00:00Z' }, { createdAt: '2026-11-17T12:00:01Z' }, { createdAt: 'invalid' }];
    assert.equal(countUnread(items, '2026-11-17T12:00:00Z'), 1);
    assert.equal(countUnread(items, ''), 2);
    assert.equal(countUnread(items, 'invalid'), 2);
});

test('relative feed timestamps handle boundaries and device clock skew', () => {
    const now = Date.parse('2026-11-17T12:00:00Z');
    assert.equal(formatRelativeTime('2026-11-17T11:48:00Z', now), '12 min ago');
    assert.equal(formatRelativeTime('2026-11-17T11:00:00Z', now), '1 hr ago');
    assert.equal(formatRelativeTime('2026-11-16T12:00:00Z', now), '1 day ago');
    assert.equal(formatRelativeTime('2026-11-15T12:00:00Z', now), '2 days ago');
    assert.equal(formatRelativeTime('2026-11-17T12:01:00Z', now), 'Just now');
    assert.equal(formatDateTime(null), '—');
    assert.match(formatDateTime('2026-11-17T23:30:00Z'), /18 Nov 2026.*01:30 SAST/);
});
