import MemoryCache from './memoryCache.js';

const memoryCache = MemoryCache.getInstance();

const newInstance = new MemoryCache();

console.assert(memoryCache !== newInstance, "New instance should be different from singleton instance");
newInstance.set("key", "value");
console.assert(memoryCache.get("key") === undefined, "Values should not be shared between instances");

console.log("memoryCache id:", memoryCache);
console.log("newInstance id:", newInstance);
console.log("Equal ids:", memoryCache.id === newInstance.id);