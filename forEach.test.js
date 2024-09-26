import MemoryCache from './memoryCache.js';
const memoryCache = MemoryCache.getInstance();

// Test forEach method
function testForEach() {
  memoryCache.clear();

  // Test 1: Iterate over multiple entries
  memoryCache.set('key1', 'value1');
  memoryCache.set('key2', 'value2');
  memoryCache.set('key3', 'value3');

  let count = 0;
  const values = [];
  memoryCache.forEach((value, key, cache) => {
    count++;
    values.push(value);
    console.assert(cache === memoryCache, 'Cache reference is correct');
  });

  console.assert(count === 3, 'forEach iterates over all entries');
  console.assert(JSON.stringify(values) === JSON.stringify(['value1', 'value2', 'value3']), 'forEach iterates in correct order');

  // Test 2: Empty cache
  memoryCache.clear();
  let emptyCount = 0;
  memoryCache.forEach(() => emptyCount++);
  console.assert(emptyCount === 0, 'forEach does not iterate on empty cache');

  // Test 3: Function values
  const func1 = () => 'result1';
  const func2 = () => 'result2';
  memoryCache.set('key1', func1, { fetch: true });
  memoryCache.set('key2', func2, { fetch: true });

  const funcResults = [];
  memoryCache.forEach((value) => funcResults.push(value));
  console.assert(JSON.stringify(funcResults) === JSON.stringify(['result1', 'result2']), 'forEach handles function values correctly');

  // Test 4: Modifying cache during iteration
  memoryCache.clear();
  memoryCache.set('key1', 'value1');
  memoryCache.set('key2', 'value2');

    memoryCache.forEach((value, key) => {
      
    if (key === 'key1') {
      memoryCache.set('key3', 'value3');
    }
  });

  console.assert(memoryCache.get('key3') === 'value3', 'Cache can be modified during forEach iteration');

  console.log('All forEach tests completed.', memoryCache);
}

// Run the tests
testForEach();
