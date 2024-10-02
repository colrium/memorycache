import MemoryCache from './index.js';
const memoryCache = MemoryCache.getInstance();

function testEntries() {
  console.log('Testing entries method:');

  // Test 1: Basic functionality
  memoryCache.clear();
  memoryCache.set('key1', 'value1');
  memoryCache.set('key2', 'value2');
  
  const entriesArray = Array.from(memoryCache.entries());
  console.assert(entriesArray.length === 2, 'entries returns correct number of items');
  console.assert(JSON.stringify(entriesArray) === JSON.stringify([['key1', 'value1'], ['key2', 'value2']]), 'entries returns correct key-value pairs');

  // Test 2: Empty cache
  memoryCache.clear();
  const emptyEntries = Array.from(memoryCache.entries());
  console.assert(emptyEntries.length === 0, 'entries returns empty array for empty cache');

  // Test 3: Function values
  memoryCache.clear();
  const func1 = () => 'result1';
  const func2 = () => 'result2';
  memoryCache.set('key1', func1, { fetch: true });
  memoryCache.set('key2', func2, { fetch: true });

  const funcEntries = Array.from(memoryCache.entries());
  console.assert(funcEntries.length === 2, 'entries returns correct number of items for function values');
  console.assert(JSON.stringify(funcEntries) === JSON.stringify([['key1', 'result1'], ['key2', 'result2']]), 'entries returns correct results for function values');

  // Test 4: Order of entries
  memoryCache.clear();
  memoryCache.set('key1', 'value1');
  memoryCache.set('key2', 'value2');
  memoryCache.set('key3', 'value3');
  memoryCache.get('key1'); // Move key1 to the end

    const orderedEntries = Array.from(memoryCache.entries());
	console.log("orderedEntries", JSON.stringify(orderedEntries));
  console.assert(JSON.stringify(orderedEntries) === JSON.stringify([['key2', 'value2'], ['key3', 'value3'], ['key1', 'value1']]), `entries does not respects LRU order`);

  // Test 5: Expired entries
  memoryCache.clear();
  memoryCache.set('key1', 'value1', { ttl: 100 }); // 1ms TTL
  memoryCache.set('key2', 'value2');

  setTimeout(() => {
    const expiredEntries = Array.from(memoryCache.entries());
    console.assert(expiredEntries.length === 1, 'entries does not include expired items');
    console.assert(JSON.stringify(expiredEntries) === JSON.stringify([['key2', 'value2']]), 'entries returns only non-expired items');

    console.log('All entries tests completed.', expiredEntries);
  }, 1000);
}

// Run the tests
testEntries();
