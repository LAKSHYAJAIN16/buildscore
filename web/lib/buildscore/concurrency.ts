// Hand-rolled bounded-concurrency runner -- trivial to implement correctly,
// avoids adding a dependency for something this small. Used two ways: (a)
// concurrency across a repo's own releases/languages/commitActivity/
// codeFrequency calls, and (b) concurrency across repos within a scan
// chunk. Bounding concurrency across repos is what actually shrinks
// wall-clock time for cold-cache accounts: multiple repos' /stats 202-retry
// backoff overlaps instead of serializing.
export async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;

  async function lane(): Promise<void> {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i], i);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, lane));
  return results;
}
