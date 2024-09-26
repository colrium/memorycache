import MemoryCache from './memoryCache.js';
const memoryCache = MemoryCache.getInstance();

// Test set and get
memoryCache.set('key1', 'value1');
console.assert(memoryCache.get('key1') === 'value1', 'Set and get failed');

// Test add
memoryCache.add('key2', 'value2');
console.assert(memoryCache.get('key2') === 'value2', 'Add failed');
memoryCache.add('key2', 'value3');
console.assert(memoryCache.get('key2') === 'value2', 'Add should not overwrite existing key');

// Test delete
memoryCache.delete('key1');
console.assert(memoryCache.get('key1') === undefined, 'Delete failed');

// Test clear
memoryCache.clear();
console.assert(memoryCache.size === 0, 'Clear failed');

// Test limit
memoryCache.setLimit(2);
memoryCache.set('key1', 'value1');
memoryCache.set('key2', 'value2');
memoryCache.set('key3', 'value3');
console.assert(memoryCache.size === 2, 'Limit not enforced');
console.assert(memoryCache.get('key1') === undefined, 'LRU eviction failed');

// Test expiration
memoryCache.set('expireKey', 'expireValue', { ttl: 100 });
setTimeout(() => {
    console.assert(memoryCache.get('expireKey') === undefined, 'Expiration failed');
}, 200);

// Test fetch function
memoryCache.set('fetchKey', () => 'fetchedValue', { fetch: true });
console.assert(memoryCache.get('fetchKey') === 'fetchedValue', 'Fetch function failed');

// Test async fetch function
memoryCache.set('asyncKey', async () => 'asyncValue', { fetch: true });
memoryCache.get('asyncKey').then(value => {
    console.assert(value === 'asyncValue', 'Async fetch function failed');
});

// Test reset
memoryCache.set('resetKey', 'resetValue');
memoryCache.set('resetKey', () => 'newResetValue');
// Force expiration by waiting
console.log("memoryCache.get('resetKey')", memoryCache.get('resetKey'))
console.assert(memoryCache.get('resetKey') === 'newResetValue', 'Reset unsuccessful');

// Test stats
memoryCache.clear()
memoryCache.set('statsKey1', 'statsValue1');
memoryCache.get('statsKey1');
memoryCache.get('nonExistentKey');
const stats = memoryCache.stats();
console.assert(stats.hits === 1, 'Hit count incorrect');
console.assert(stats.misses === 1, 'Miss count incorrect');
console.assert(stats.size === 1, 'Size incorrect');
console.log('stats', stats);
console.log('All tests completed');