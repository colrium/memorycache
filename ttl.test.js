import MemoryCache from './memoryCache.js';
const memoryCache = MemoryCache.getInstance();

function testSizeWithTTl() {
	memoryCache.clear();

	memoryCache.set("key1", "value1");
	console.assert(memoryCache.size === 1);

	memoryCache.set("key2", "value2");
	console.assert(memoryCache.size === 2);

	memoryCache.delete("key1");
	console.assert(memoryCache.size === 1);

	memoryCache.clear();
    console.assert(memoryCache.size === 0);

	memoryCache.set("key4", () => "value4", { ttl: 10000 });
    memoryCache.set("key5", "value5", {ttl: 1000});
    memoryCache.set("key6", () => "value6", { ttl: 4000 });
	memoryCache.set("key7", () => "value7", { ttl: 2000, evictable: false });
    setTimeout(() => {
        console.log('memoryCache key4, key6 and non-evictable key7 remain after key5 expires', memoryCache);
		console.assert(memoryCache.size === 3  , "key4 and key6 should remain after key5 expires");
        setTimeout(() => {
			console.log('memoryCache key4 and non-evictable key7 remain after key6 expires', memoryCache);
			console.assert(memoryCache.size === 2, "key4 and non-evictable key7 should remain after key5 expires");
			setTimeout(() => {
				console.log('memoryCache non-evictable key7 should remain after all entries expire', memoryCache);
				console.assert(memoryCache.size === 1, "non-evictable key7 should remain after all entries expire");
				memoryCache.evict("key7", true);
				console.log('Cache should be empty after all items expire', memoryCache);
				console.assert(memoryCache.size === 0, "Cache should be empty after all items expire");
                console.log("All size tests completed!");
			}, 7000);
		}, 3000);
	}, 1000);
    
}

testSizeWithTTl();

