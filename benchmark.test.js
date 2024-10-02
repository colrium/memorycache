import MemoryCache from './index.js';
import { performance } from 'perf_hooks';

const cache = MemoryCache.getInstance();
const iterations = 1000000;

function runBenchmark(name, fn) {
    const start = performance.now();
    fn();
    const end = performance.now();
    console.log(`${name}: ${end - start} ms`);
}

console.log(`Running ${iterations} iterations for each test`);

// Benchmark set operation
runBenchmark('Set', () => {
    for (let i = 0; i < iterations; i++) {
        cache.set(`key${i}`, `value${i}`);
    }
});

// Benchmark get operation (existing keys)
runBenchmark('Get (existing)', () => {
    for (let i = 0; i < iterations; i++) {
        cache.get(`key${i}`);
    }
});

// Benchmark get operation (non-existing keys)
runBenchmark('Get (non-existing)', () => {
    for (let i = 0; i < iterations; i++) {
        cache.get(`nonexistent${i}`);
    }
});

// Benchmark has operation
runBenchmark('Has', () => {
    for (let i = 0; i < iterations; i++) {
        cache.has(`key${i}`);
    }
});

// Benchmark evict operation
runBenchmark('Evict', () => {
    for (let i = 0; i < iterations; i++) {
        cache.evict(`key${i}`);
    }
});

// Benchmark set with function and fetch
runBenchmark('Set with function and fetch', () => {
    for (let i = 0; i < iterations; i++) {
        cache.set(`func${i}`, () => `computed${i}`, { fetch: true });
    }
});

// Benchmark get with function and fetch
runBenchmark('Get with function and fetch', () => {
    for (let i = 0; i < iterations; i++) {
        cache.get(`func${i}`);
    }
});

// Benchmark entries iteration
runBenchmark('Entries iteration', () => {
    for (const [key, value] of cache.entries()) {
        // Do nothing, just iterate
    }
});

// Benchmark forEach
runBenchmark('ForEach', () => {
    cache.forEach((value, key) => {
        // Do nothing, just iterate
    });
});

// Benchmark clear
runBenchmark('Clear', () => {
    cache.clear();
});

console.log('Benchmarking completed');
