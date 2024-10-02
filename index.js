const minutesToLive = 2;
const DEFAULT_OPTS = {
	ttl: minutesToLive * 60 * 1000,
	fetch: true,
	evictable: true
};

class ListNode {
	constructor(key) {
		this.key = key;
		this.prev = null;
		this.next = null;
	}
}

class CacheEntry {
	fetchDate = new Date();
	#cache;
	/**
	 * @param {Function} fetchFunction - Function to fetch data
	 * @param {number} [ttl=DEFAULT_OPTS.ttl] - Time-to-live in milliseconds
	 * @param {boolean} evictable when TTL expires
	 */
	constructor(fetchFunction, ttl = DEFAULT_OPTS.ttl, evictable = DEFAULT_OPTS.evictable) {
		this.ttl = ttl;
		this.fetchFunction = fetchFunction.bind(this);
		this.evictable = evictable;
		this.fetched = false;
		this.getCache(); // call fetch function and cache result
	}

	/**
	 * Checks if the cache entry has expired
	 * @returns {boolean}
	 */
	get stale() {
		return this.fetchDate.getTime() + this.ttl <= new Date().getTime();
	}

	

	/**
	 * Checks if the fetch function is asynchronous
	 * @returns {boolean}
	 */
	isAsynchronous() {
		const AsyncFunction = (async () => {}).constructor;
		const GeneratorFunction = function* () {}.constructor;
		return this.fetchFunction instanceof AsyncFunction && AsyncFunction !== Function && AsyncFunction !== GeneratorFunction;
	}

	/**
	 * Retrieves data from cache or fetches new data
	 * @param {...any} args - Arguments to pass to the fetch function
	 * @returns {any|Promise<any>}
	 */
	getCache(...args) {
		if (this.stale || !this.fetched) {
			if (this.isAsynchronous()) {
				return this.fetchFunction(...args).then((results) => {
					this.#cache = results;
					this.fetchDate = new Date();
					this.fetched = true;
					return this.#cache;
				});
			} else {
				this.#cache = this.fetchFunction(...args);
				this.fetchDate = new Date();
				this.fetched = true;
			}
		}
		return this.#cache;
	}

	/**
	 * Resets the cache entry
	 * @param {Function|null} resetFetchFunction - New fetch function to use
	 */
	resetCache(resetFetchFunction = null) {
		this.fetchDate = new Date(0);
		if (resetFetchFunction) {
			this.fetchFunction = resetFetchFunction;
		}
	}
}

/**
 * Memory cache implementation with LRU eviction policy
 * Stores cache entries in doubly linked list ordered by last access
 * Implements LRU eviction policy where least recently used entries are evicted first
 * Behaves like the native Map with additional cache features
 */
class MemoryCache {
	#storage;
	#head;
	#tail;
	#nodeMap;
	#limit;
	#hits;
	#misses;
	static #instance;
	static #_id = Symbol("MemoryCache");

	constructor() {
		const id = arguments[0] || Symbol();
		if (MemoryCache.#instance && id === MemoryCache.#_id) {
			return MemoryCache.#instance;
		}
		this.#storage = new Map();
		this.#limit = 100000;
		this.#hits = 0;
		this.#misses = 0;
		this.#head = new ListNode(null); // Dummy head
		this.#tail = new ListNode(null); // Dummy tail
		this.#head.next = this.#tail;
		this.#tail.prev = this.#head;
		this.#nodeMap = new Map(); // Map to store key-node pairs
		this.id = id; // ID to differentiate instances
	}
	/**
	 * @returns {MemoryCache} The cache singleton instance
	 */
	static getInstance() {
		if (!MemoryCache.#instance) {
			MemoryCache.#instance = new MemoryCache(MemoryCache.#_id);
		}
		return MemoryCache.#instance;
	}

	/**
	 * Moves or adds a key to the end of the cache (most recently used)
	 * @param {string} key - The key to move or add
	 * @private
	 */
	#moveToEnd(key) {
		let node = this.#nodeMap.get(key);
		if (node) {
			node.prev.next = node.next;
			node.next.prev = node.prev;
		} else {
			node = new ListNode(key);
			this.#nodeMap.set(key, node);
			if (this.#nodeMap.size > this.#limit) {
				const lruKey = this.#head.next.key;
				this.#nodeMap.delete(lruKey);
				this.#storage.delete(lruKey);
				this.#head.next = this.#head.next.next;
				this.#head.next.prev = this.#head;
			}
		}
		const lastNode = this.#tail.prev;
		lastNode.next = node;
		node.prev = lastNode;
		node.next = this.#tail;
		this.#tail.prev = node;
	}

	/**
	 * Retrieves a value from the cache
	 * @param {string} key - The key to retrieve
	 * @param {...any} args - Arguments to pass to the fetch function
	 * @returns {*} The cached value or undefined if not found
	 */
	get(key, ...args) {
		let value = this.#storage.get(key);
		if (value) {
			this.#moveToEnd(key);

			if (value.stale && value.evictable) {
				value = undefined;
				this.evict(key, true);
				this.#misses++;
			} else {
				value = value.getCache(...args);
				this.#hits++;
			}
		} else {
			this.#misses++;
		}
		return value;
	}

	/**
	 * Sets a value in the cache
	 * @param {string} key - The key to set
	 * @param {*} value - The value to cache
	 * @param {Object} [options={}] - Cache options
	 * @returns {MemoryCache} The cache instance
	 */
	set(key, value, options = {}) {
		this.#moveToEnd(key);
		const { ttl, fetch } = { ...DEFAULT_OPTS, ...options };
		const isFetch = fetch && typeof value === "function";
		const evictable = options?.evictable ?? !isFetch;
		const setter = fetch && typeof value === "function" ? value : () => value;
		this.#storage.set(key, new CacheEntry(setter, ttl, evictable));
		return this;
	}

	/**
	 * Checks if a key exists in the cache
	 * @param {string} key - The key to check
	 * @returns {boolean} True if the key exists, false otherwise
	 */
	has(key) {
		return this.#storage.has(key);
	}

	/**
	 * Evicts a key from the cache
	 * @param {string} key - The key to evict
	 * @param {boolean} [force=false] - Force eviction even if not evictable
	 * @returns {MemoryCache} The cache instance
	 */
	evict(key, force = false) {
		if (this.#storage.has(key)) {
			const entry = this.#storage.get(key);
			if (force || entry.evictable) {
				this.#storage.delete(key);
				const node = this.#nodeMap.get(key);
				if (node) {
					node.prev.next = node.next;
					node.next.prev = node.prev;
					this.#nodeMap.delete(key);
				}
			}
		}
		return this;
	}

	/**
	 * Resets a cache entry
	 * @param {string} key - The key to reset
	 * @param {Function} [getter=null] - New getter function
	 * @returns {MemoryCache} The cache instance
	 */
	reset(key, getter = null) {
		if (this.#storage.has(key)) {
			const entry = this.#storage.get(key);
			entry.resetCache(getter);
		}
		return this;
	}

	/**
	 * Clears the entire cache
	 * @returns {MemoryCache} The cache instance
	 */
	clear() {
		this.#storage.clear();
		this.#head.next = this.#tail;
		this.#tail.prev = this.#head;
		this.#nodeMap.clear();
		this.#hits = 0;
		this.#misses = 0;
		return this;
	}

	/**
	 * Gets the current size of the cache
	 * @returns {number} The number of items in the cache
	 */
	get size() {
		this.#prune();
		return this.#storage.size;
	}

	/**
	 * Sets the maximum size limit of the cache
	 * @param {number} limit - The new size limit
	 * @returns {MemoryCache} The cache instance
	 */
	setLimit(limit) {
		this.#prune();
		this.#limit = limit > 0 ? limit : this.#limit;
		while (this.size > this.#limit) {
			const lruKey = this.#head.next.key;
			this.evict(lruKey);
		}
		return this;
	}

	/**
	 * Removes expired items from the cache
	 * @returns {MemoryCache} The cache instance
	 * @private
	 */
	#prune() {
		for (const [key, value] of this.#storage.entries()) {
			if (value.stale) {
				this.evict(key, value.evictable);
			}
		}
		return this;
	}

	/**
	 * Returns cache statistics
	 * @returns {Object} An object containing cache stats
	 */
	stats() {
		this.#prune();
		const totalRequests = this.#hits + this.#misses;
		return {
			size: this.size,
			limit: this.#limit,
			hits: this.#hits,
			misses: this.#misses,
			hitRate: totalRequests > 0 ? this.#hits / totalRequests : 0,
			missRate: totalRequests > 0 ? this.#misses / totalRequests : 0
		};
	}

	/**
	 * Returns an iterator for cache entries
	 * @yields {Array} Key-value pairs of cache entries
	 */
	*entries() {
		this.#prune();
		/* for (const [key, cacheEntry] of this.#storage.entries()) {
			yield [key, cacheEntry.getCache()];
		} */
		let node = this.#head.next;
		while (node !== this.#tail) {
			const key = node.key;
			const cacheEntry = this.#storage.get(key);
			yield [key, cacheEntry.getCache()];
			node = node.next;
		}
	}

	/**
	 * Returns an iterator for cache keys
	 * @yields {string} Cache keys
	 */
	*keys() {
		for ([key] of this.entries()) {
			yield key;
		}
	}

	/**
	 * Returns an iterator for cache values
	 * @yields {*} Cache values
	 */
	*values() {
		for ([, value] of this.entries()) {
			yield value;
		}
	}

	/**
	 * Executes a callback for each cache entry
	 * @param {Function} cb - Function to execute for each entry
	 */
	forEach(cb) {
		if (typeof cb !== "function") {
			return;
		}
		const entries = this.entries();
		for (const [key, value] of entries) {
			cb(value, key, this);
		}
	}

	/**
	 * Converts the cache to a plain object
	 * @returns {Object} An object representation of the cache
	 */
	toObject() {
		return Object.fromEntries(this.entries());
	}
}

export default MemoryCache;
