"use strict";

/* global performance */

// Errors propagate to the caller but don't block subsequent calls.
function serialize(fn, minDelayMs) {
    let chain = Promise.resolve();
    let lastEnd = -Infinity;
    const wrapper = function(...args) {
        const next = chain.then(async () => {
            const wait = lastEnd + wrapper.minDelayMs - performance.now();
            if (wait > 0) {
                await new Promise(resolve => setTimeout(resolve, wait));
            }
            try {
                return await fn(...args);
            } finally {
                lastEnd = performance.now();
            }
        });
        chain = next.catch(() => {});
        return next;
    };
    wrapper.minDelayMs = minDelayMs;
    return wrapper;
}

exports.serialize = serialize;
