import MemoryCache from './index.js';
const memoryCache = MemoryCache.getInstance();

function testSizeWithTTl() {
	memoryCache.clear();

	memoryCache.set("key1", "value1");
	console.assert(memoryCache.size === 1, "Setting key1 should increase size to 1");

	memoryCache.set("key2", "value2");
	console.assert(memoryCache.size === 2, "Setting key2 should increase size to 2");

	memoryCache.evict("key1");
	console.assert(memoryCache.size === 1, "Evicting key1 should decrease size by 1");

	memoryCache.clear();
	console.assert(memoryCache.size === 0, "Cache should be cleared");

	memoryCache.set("key4", "value4", { ttl: 11100 });
    memoryCache.set("key5", "value5", {ttl: 1000});
    memoryCache.set("key6", "value6", { ttl: 4000 });
	memoryCache.set("key7", "value7", { ttl: 2000, evictable: false });
	setTimeout(() => {
        console.log(memoryCache.toObject());
		console.assert(memoryCache.size === 3, "key4 and key6 should remain after key5 expires");
		setTimeout(() => {
			memoryCache.get('key4')
			memoryCache.get('key6')
			console.log(memoryCache.toObject())
			console.assert(memoryCache.size === 2, "key4 and non-evictable key7 should remain after key6 expires");	
			setTimeout(() => {
				memoryCache.evict("key7", true);		
				memoryCache.get('key6')
				console.log(memoryCache.toObject());
				console.assert(memoryCache.size === 1, "key4 should remain after forcefully evicting key7");
				setTimeout(() => {
					console.log(memoryCache.toObject());
					console.assert(memoryCache.size === 0, "Cache should be empty after all items expire");
					console.log("All size tests completed!");
				}, 3000);
			}, 7000);
		}, 3000);
        
	}, 1000);
	
	
	
}

testSizeWithTTl();

