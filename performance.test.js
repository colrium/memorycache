import MemoryCache from './index.js';

function runPerformanceTests() {
  console.log('Running MemoryCache Performance Tests');

  const cache = MemoryCache.getInstance();
  const iterations = 100000;
  cache.clear();
  cache.setLimit(iterations)
  // Test 1: Set Performance
  console.log('\nTesting Set Performance:');
  const setStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    cache.set(`key${i}`, `value${i}`);
  }
  const setEnd = performance.now();
  console.log(`Set ${iterations} items: ${setEnd - setStart} ms`);

  // Test 2: Get Performance
  console.log('\nTesting Get Performance:');
  const getStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    const iVal = cache.get(`key${i}`);
		console.assert(iVal === `value${i}`, `Get key${i} value mismatch. ${iVal} != value${i}`);
  }
  const getEnd = performance.now();
  console.log(`Get ${iterations} items: ${getEnd - getStart} ms`);

  // Test 3: Has Performance
  console.log('\nTesting Has Performance:');
  const hasStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    cache.has(`key${i}`);
  }
  const hasEnd = performance.now();
  console.log(`Has ${iterations} items: ${hasEnd - hasStart} ms`);

  // Test 4: Delete Performance
  console.log('\nTesting Delete Performance:');
  const deleteStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    cache.evict(`key${i}`);
  }
  const deleteEnd = performance.now();
  console.log(`Delete ${iterations} items: ${deleteEnd - deleteStart} ms`);

  // Test 5: LRU Eviction Performance
  console.log('\nTesting LRU Eviction Performance:');
  cache.setLimit(iterations / 2);
  const evictionStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    cache.set(`key${i}`, `value${i}`);
  }
  const evictionEnd = performance.now();
  console.log(`LRU Eviction for ${iterations/2} items: ${evictionEnd - evictionStart} ms`);

  // Test 6: Entries Performance
  console.log('\nTesting Entries Performance:');
  const entriesStart = performance.now();
  for (const [key, value] of cache.entries()) {
    // Do nothing, just iterate
  }
  const entriesEnd = performance.now();
  console.log(`Iterate over ${cache.size} entries: ${entriesEnd - entriesStart} ms`);

	console.log("\nPerformance tests completed. Stats:", cache.stats());
}

runPerformanceTests();
