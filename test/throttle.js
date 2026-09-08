'use strict';
var assert = require('chai').assert,
    sinon = require('sinon'),
    throttle = require('../lib/throttle');

suite('throttle.serialize', function() {
    let clock;

    setup(function() {
        clock = sinon.useFakeTimers({ toFake: ['setTimeout', 'performance'] });
    });

    teardown(function() {
        clock.restore();
    });

    test('first call resolves without artificial wait', async function() {
        var fn = sinon.stub().resolves('ok');
        var throttled = throttle.serialize(fn, 1000);

        var p = throttled();
        // No setTimeout should be required for the very first call; allow
        // microtasks to settle so the underlying fn runs.
        await clock.tickAsync(0);
        assert.strictEqual(fn.callCount, 1);

        var result = await p;
        assert.strictEqual(result, 'ok');
    });

    test('second call waits minDelayMs after first completes', async function() {
        var fn = sinon.stub().resolves('ok');
        var throttled = throttle.serialize(fn, 1000);

        var p1 = throttled();
        await clock.tickAsync(0);
        await p1;
        assert.strictEqual(fn.callCount, 1);

        var p2 = throttled();

        // Just under the delay: still no second call.
        await clock.tickAsync(999);
        assert.strictEqual(fn.callCount, 1);

        // Crossing the threshold: second call fires.
        await clock.tickAsync(1);
        assert.strictEqual(fn.callCount, 2);

        var result = await p2;
        assert.strictEqual(result, 'ok');
    });

    test('rejected call does not block subsequent calls and rejection is observable', async function() {
        var err = new Error('boom');
        var fn = sinon.stub();
        fn.onFirstCall().rejects(err);
        fn.onSecondCall().resolves('ok');

        var throttled = throttle.serialize(fn, 1000);

        var p1 = throttled();
        await clock.tickAsync(0);

        var caught;
        try {
            await p1;
        } catch (e) {
            caught = e;
        }
        assert.strictEqual(caught, err);
        assert.strictEqual(fn.callCount, 1);

        // Second call must still be rate-limited (1000ms) after the rejection.
        var p2 = throttled();
        await clock.tickAsync(999);
        assert.strictEqual(fn.callCount, 1);
        await clock.tickAsync(1);
        assert.strictEqual(fn.callCount, 2);

        var result = await p2;
        assert.strictEqual(result, 'ok');
    });

    test('calls execute strictly in submission order', async function() {
        var order = [];
        var resolvers = [];
        var fn = function(label) {
            order.push('start:' + label);
            return new Promise(function(resolve) {
                resolvers.push(function() {
                    order.push('end:' + label);
                    resolve(label);
                });
            });
        };

        var throttled = throttle.serialize(fn, 1000);

        var p1 = throttled('a');
        var p2 = throttled('b');
        var p3 = throttled('c');

        // Let microtasks run; only 'a' should have started.
        await clock.tickAsync(0);
        assert.deepEqual(order, ['start:a']);

        // Resolve 'a'.
        resolvers[0]();
        await p1;

        // 'b' shouldn't start until 1000ms after 'a' ended.
        await clock.tickAsync(999);
        assert.deepEqual(order, ['start:a', 'end:a']);
        await clock.tickAsync(1);
        assert.deepEqual(order, ['start:a', 'end:a', 'start:b']);

        // Resolve 'b', then 'c' starts after another 1000ms.
        resolvers[1]();
        await p2;
        await clock.tickAsync(999);
        assert.strictEqual(order.length, 4);
        await clock.tickAsync(1);
        assert.deepEqual(order, [
            'start:a', 'end:a',
            'start:b', 'end:b',
            'start:c',
        ]);

        resolvers[2]();
        var result = await p3;
        assert.strictEqual(result, 'c');
    });
});
