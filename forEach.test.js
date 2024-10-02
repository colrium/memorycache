import MemoryCache from './index.js';
const memoryCache = MemoryCache.getInstance();
const map = new Map([
	[1, "one"],
	[2, "two"],
	[3, "three"]
]);
console.log('map', map.size)
// Test forEach method
function testForEach() {
  console.log('arguments', arguments)
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
    console.log(value, key);
    console.assert(cache === memoryCache, 'Cache reference is incorrect');
  });
  console.log('count', count)
  console.log('memoryCache', memoryCache)
  console.assert(count === 3, 'forEach did not iterate over all entries');
  console.assert(JSON.stringify(values) === JSON.stringify(['value1', 'value2', 'value3']), 'forEach iterates in wrong order');

  // Test 2: Empty cache
  memoryCache.clear();
  let emptyCount = 0;
  memoryCache.forEach((entry) => {
    console.log(entry);
    emptyCount++;
  });
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
