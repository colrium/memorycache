import MemoryCache from './memoryCache.js';
const memoryCache = MemoryCache.getInstance();

function testLRU() {
  console.log('Testing LRU functionality:');

  // Test 1: Basic LRU eviction
  memoryCache.clear();
  memoryCache.setLimit(3);
  
  memoryCache.set('key1', 'value1');
  memoryCache.set('key2', 'value2');
  memoryCache.set('key3', 'value3');
  memoryCache.set('key4', 'value4');

	console.log("Items:", memoryCache.toObject());
  console.assert(!memoryCache.has('key1'), 'Oldest item (key1) should be evicted');
  console.assert(memoryCache.has('key2') && memoryCache.has('key3') && memoryCache.has('key4'), 'Newer items should remain in cache');

  // Test 2: Accessing an item updates its position
  memoryCache.get('key2');
  memoryCache.set('key5', 'value5');
	console.log("Items:", memoryCache.toObject());
  console.assert(!memoryCache.has('key3'), 'key3 should be evicted after accessing key2');
  console.assert(memoryCache.has('key2') && memoryCache.has('key4') && memoryCache.has('key5'), 'Accessed and newer items should remain in cache');

  // Test 3: Setting an existing key updates its position
  memoryCache.set('key4', 'new value4');
  memoryCache.set('key6', 'value6');

  console.assert(!memoryCache.has('key2'), 'key2 should be evicted after updating key4');
  console.assert(memoryCache.has('key4') && memoryCache.has('key5') && memoryCache.has('key6'), 'Updated and newer items should remain in cache');

  // Test 4: LRU with different limits
  memoryCache.clear();
  memoryCache.setLimit(5);

  for (let i = 1; i <= 6; i++) {
    memoryCache.set(`key${i}`, `value${i}`);
  }

  console.assert(memoryCache.size === 5, 'Cache size should be limited to 5');
  console.assert(!memoryCache.has('key1') && memoryCache.has('key6'), 'Oldest item should be evicted, newest should remain');

  // Test 5: LRU with limit reduction
  memoryCache.setLimit(3);

  console.assert(memoryCache.size === 3, 'Cache size should be reduced to 3');
  console.assert(memoryCache.has('key4') && memoryCache.has('key5') && memoryCache.has('key6'), 'Only the 3 most recent items should remain');

  console.log('All LRU tests completed.');
}

// Run the tests
testLRU();
