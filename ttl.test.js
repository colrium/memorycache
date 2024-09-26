import memoryCache from './memoryCache.js';

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

    memoryCache.set("key4", () => "value4");
    memoryCache.set("key5", "value5", {ttl: 1000});
    memoryCache.set("key6", () => "value6", { ttl: 4000 });
    memoryCache.set("key6", () => "value6", { ttl: 4000 });
    setTimeout(() => {
        console.log('memoryCache key4 and key6 remain after key5 expires', memoryCache);
		console.assert(memoryCache.size === 2, "key4 and key6 should remain after key5 expires");
        setTimeout(() => {
			console.log('memoryCache key4 remain after key6 expires', memoryCache);
			console.assert(memoryCache.size === 1, "key4 should remain after key5 expires");
			setTimeout(() => {
				console.assert(memoryCache.size === 1, "Cache should be empty after all items expire");
                console.log("All size tests completed!");
			}, 3000);
		}, 3000);
	}, 1000);
    
}

testSizeWithTTl();

