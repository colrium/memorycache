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
	/**
	 * @param {Function} fetchFunction - Function to fetch data
	 * @param {number} [msToLive=DEFAULT_OPTS.ttl] - Time-to-live in milliseconds
	 * @param {boolean} evictable when TTL expires
	 */
	constructor(fetchFunction, msToLive = DEFAULT_OPTS.ttl, evictable = DEFAULT_OPTS.evictable) {
		this.msToLive = msToLive;
		this.fetchFunction = fetchFunction.bind(this);
		this.cache = null;
		this.isFetched = false;
		this.evictable = evictable;
		this.fetchDate = new Date();
	}

	/**
	 * Checks if the cache entry has expired
	 * @returns {boolean}
	 */
	isExpired() {
		return this.fetchDate.getTime() + this.msToLive < new Date().getTime();
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
	getData(...args) {
		if (this.isExpired() || !this.isFetched) {
			this.isFetched = true;
			if (this.isAsynchronous()) {
				return this.fetchFunction(...args).then((results) => {
					this.cache = results;
					this.fetchDate = new Date();
					return this.cache;
				});
			} else {
				this.cache = this.fetchFunction(...args);
				this.fetchDate = new Date();
			}
		}
		return this.cache;
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
 */
export default class MemoryCache {
	#storage;
	#head;
	#tail;
	#nodeMap;
	#limit;
	#hits;
	#misses;
	static #instance;
	static #id = Symbol("MemoryCache");
	

	constructor(id=Symbol()) {
		if (MemoryCache.#instance && id !== MemoryCache.#id) {
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
		
	}

	static getInstance() {
		if (!MemoryCache.#instance) {
			
            MemoryCache.#instance = new MemoryCache();
        }
        return MemoryCache.#instance;
    }

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

    get(key, ...args) {
        let value = this.#storage.get(key);
        if (value) {
            this.#moveToEnd(key);
            const isExpired = value.isExpired();
            if (isExpired && value.evictable) {
                value = undefined;
                this.evict(key, true);
                this.#misses++;
            } else {
                value = value.getData(...args);
                this.#hits++;
            }
        } else {
            this.#misses++;
        }
        return value;
    }

	set(key, value, options = {}) {
        this.#moveToEnd(key);
        const { ttl, fetch } = { ...DEFAULT_OPTS, ...options };
        const isFetch = fetch && typeof value === "function";
        const evictable = options?.evictable ?? !isFetch;
        const setter = fetch && typeof value === "function" ? value : () => value;
        this.#storage.set(key, new CacheEntry(setter, ttl, evictable));
        return this;
    }

    has(key) {
        return this.#storage.has(key);
    }

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

    reset(key, getter = null) {
        if (this.#storage.has(key)) {
            const entry = this.#storage.get(key);
            entry.resetCache(getter);
        }
        return this;
    }

    clear() {
        this.#storage.clear();
        this.#head.next = this.#tail;
        this.#tail.prev = this.#head;
        this.#nodeMap.clear();
        this.#hits = 0;
        this.#misses = 0;
        return this;
    }

	get size() {
		this.#evictExpiredItems()
        return this.#storage.size;
    }

	setLimit(limit) {		
        this.#limit = limit > 0 ? limit : this.#limit;
        while (this.size > this.#limit) {
            const lruKey = this.#head.next.key;
            this.evict(lruKey);
        }
        return this;
    }

	#evictExpiredItems() {
        for (const [key, value] of this.#storage.entries()) {
			if (value.isExpired()) {
				this.evict(key, value.evictable);
            }
        }
        return this;
    }

    stats() {
        const totalRequests = this.#hits + this.#misses;
        return {
            size: this.size,
            limit: this.#limit,
            hits: this.#hits,
            misses: this.#misses,
            get hitRate() {
                return totalRequests > 0 ? this.hits / totalRequests : 0;
            },
            get missRate() {
                return totalRequests > 0 ? this.misses / totalRequests : 0;
            }
        };
    }

	*entries() {
		this.#evictExpiredItems();
        for (const [key, cacheEntry] of this.#storage.entries()) {
			yield [key, cacheEntry.getData()];	
        }
    }
	*keys() {
		for ([key] of super.entries()) {
			yield key;
		}
	}
	*values() {
		for ([, value] of super.entries()) {
			yield value.getData();
		}
	}
    forEach(callback) {
        for (const [key, value] of this.entries()) {
            callback(value, key, this);
        }
    }

    toObject() {
        return Object.fromEntries(this.entries());
    }

    add(key, value, options = {}) {
        if (!this.has(key)) {
            this.set(key, value, options);
        }
        return this;
    }
	static newInstance() {
        return new MemoryCache();
	}
}
