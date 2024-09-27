import MemoryCache from "./memoryCache.js";
const cache = MemoryCache.getInstance();

cache.set("hello-world", "Hello World!");
console.log(cache.get("hello-world"));

async function runTests() {
  console.log('Starting memoryCache tests...');

  // Test set and get
  cache.set('key1', 'value1');
  console.log('Test set and get:', cache.get('key1') === 'value1' ? 'PASS' : 'FAIL');

  // Test non-existent key
  console.log('Test non-existent key:', cache.get('nonexistent') === undefined ? 'PASS' : 'FAIL');

  // Test overwrite
  cache.set('key1', 'value2');
  console.log('Test overwrite:', cache.get('key1') === 'value2' ? 'PASS' : 'FAIL');

  // Test evict
  cache.evict('key1');
  console.log('Test evict:', cache.get('key1') === undefined ? 'PASS' : 'FAIL');

  // Test clear
  cache.set('key1', 'value1');
  cache.set('key2', 'value2');
  cache.clear();
  console.log('Test clear:', cache.get('key1') === undefined && cache.get('key2') === undefined ? 'PASS' : 'FAIL');
  cache.setLimit(1000000);
  // Test expiration
	cache.set("pkey1", "value1", { ttl: 100, evictable: true });
  console.log('Test expiration (immediate):', cache.get('pkey1'), cache.get('pkey1') === 'value1' ? 'PASS' : 'FAIL');
  setTimeout(async () => {
    console.log('Test expiration (after 150ms):', cache.get('pkey1'), cache.get('pkey1') === undefined ? 'PASS' : 'FAIL');
  }, 150);

	cache.set("ptkey1", () => "value1", { ttl: 1000, evictable: false  });
  console.log('Test no expiration (immediate):', cache.get('ptkey1'), cache.get('ptkey1') === 'value1' ? 'PASS' : 'FAIL');
  setTimeout(() => {
    console.log('Test no expiration (after 1500ms):', cache.get('ptkey1'), cache.get('ptkey1') !== undefined ? 'PASS' : 'FAIL');
  }, 1500);
  // cache.setLimit(10000)
  // Simple profiling
  console.log('\nProfiling set operation:');
  const start = performance.now();
  for (let i = 0; i < 100000; i++) {
    cache.set(`key${i}`, `value${i}`);
  }
  const end = performance.now();
  console.log(`Time taken to set 100000 items: ${end - start} ms`);

  console.log('\nProfiling get operation:');
  const startGet = performance.now();
  for (let i = 0; i < 100000; i++) {
    cache.get(`key${i}`);
  }
  const endGet = performance.now();
  console.log(`Time taken to get 100000 items: ${endGet - startGet} ms`);
  const stats = cache.stats();
	console.log("\nCache stats:", stats);
}

runTests();

