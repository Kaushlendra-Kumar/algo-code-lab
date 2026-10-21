// Plain reference implementations used by tests and by labs that need answers
// without step recording.

export function prefixSums(a: readonly number[]): number[] {
  const p = new Array(a.length + 1).fill(0);
  for (let i = 0; i < a.length; i++) p[i + 1] = p[i] + a[i];
  return p;
}

export function rangeSum(prefix: readonly number[], l: number, r: number): number {
  if (l < 0 || r >= prefix.length - 1 || l > r) throw new RangeError(`invalid range [${l}, ${r}]`);
  return prefix[r + 1] - prefix[l];
}

/** Difference array: apply +v on [l, r] for each update, return final array. */
export function applyRangeAdds(n: number, updates: readonly [number, number, number][]): number[] {
  const diff = new Array(n + 1).fill(0);
  for (const [l, r, v] of updates) {
    diff[l] += v;
    diff[r + 1] -= v;
  }
  const out: number[] = [];
  let run = 0;
  for (let i = 0; i < n; i++) out.push((run += diff[i]));
  return out;
}

export function pairSumSorted(a: readonly number[], target: number): [number, number] | null {
  let l = 0;
  let r = a.length - 1;
  while (l < r) {
    const s = a[l] + a[r];
    if (s === target) return [l, r];
    if (s < target) l++;
    else r--;
  }
  return null;
}

export function maxWindowSum(a: readonly number[], k: number): number | null {
  if (k <= 0 || k > a.length) return null;
  let w = 0;
  for (let i = 0; i < k; i++) w += a[i];
  let best = w;
  for (let i = k; i < a.length; i++) {
    w += a[i] - a[i - k];
    best = Math.max(best, w);
  }
  return best;
}

export function longestUniqueSubstring(s: string): number {
  const last = new Map<string, number>();
  let left = 0;
  let best = 0;
  for (let r = 0; r < s.length; r++) {
    const p = last.get(s[r]);
    if (p !== undefined && p >= left) left = p + 1;
    last.set(s[r], r);
    best = Math.max(best, r - left + 1);
  }
  return best;
}

/** Smallest length of a contiguous subarray with sum >= target (positive numbers). 0 if none. */
export function minSubarrayLen(a: readonly number[], target: number): number {
  let left = 0;
  let sum = 0;
  let best = Infinity;
  for (let r = 0; r < a.length; r++) {
    sum += a[r];
    while (sum >= target) {
      best = Math.min(best, r - left + 1);
      sum -= a[left++];
    }
  }
  return best === Infinity ? 0 : best;
}

export function binarySearch(a: readonly number[], target: number): number {
  let lo = 0;
  let hi = a.length - 1;
  while (lo <= hi) {
    const mid = lo + ((hi - lo) >> 1);
    if (a[mid] === target) return mid;
    if (a[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}

export function lowerBound(a: readonly number[], target: number): number {
  let lo = 0;
  let hi = a.length;
  while (lo < hi) {
    const mid = lo + ((hi - lo) >> 1);
    if (a[mid] < target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

export function upperBound(a: readonly number[], target: number): number {
  let lo = 0;
  let hi = a.length;
  while (lo < hi) {
    const mid = lo + ((hi - lo) >> 1);
    if (a[mid] <= target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/** Smallest x in [lo, hi] with pred(x) true, assuming pred is monotone false…true. Returns hi + 1 if none. */
export function firstTrue(lo: number, hi: number, pred: (x: number) => boolean): number {
  let l = lo;
  let r = hi + 1;
  while (l < r) {
    const m = l + Math.floor((r - l) / 2);
    if (pred(m)) r = m;
    else l = m + 1;
  }
  return l;
}

export function nextGreater(a: readonly number[]): number[] {
  const ans = a.map(() => -1);
  const st: number[] = [];
  for (let i = 0; i < a.length; i++) {
    while (st.length && a[st[st.length - 1]] < a[i]) ans[st.pop()!] = a[i];
    st.push(i);
  }
  return ans;
}

export function hasCycle(next: readonly number[], head = 0): boolean {
  if (head < 0) return false;
  let slow = head;
  let fast = head;
  while (fast >= 0 && next[fast] >= 0) {
    slow = next[slow];
    fast = next[next[fast]];
    if (slow === fast) return true;
  }
  return false;
}

export function middleIndex(length: number): number {
  // Index reached by slow when fast walks off a list of `length` nodes (second middle for even).
  return Math.floor(length / 2);
}

export function climbStairs(n: number): number {
  let a = 1;
  let b = 1;
  for (let i = 2; i <= n; i++) [a, b] = [b, a + b];
  return n === 0 ? 1 : b;
}

export function houseRobber(a: readonly number[]): number {
  let prev2 = 0;
  let prev1 = 0;
  for (const x of a) [prev2, prev1] = [prev1, Math.max(prev1, prev2 + x)];
  return prev1;
}

export function knapsack01(wt: readonly number[], val: readonly number[], W: number): number {
  const dp = new Array(W + 1).fill(0);
  for (let i = 0; i < wt.length; i++) for (let w = W; w >= wt[i]; w--) dp[w] = Math.max(dp[w], dp[w - wt[i]] + val[i]);
  return dp[W];
}

export function lisLength(a: readonly number[]): number {
  const tails: number[] = [];
  for (const x of a) {
    const i = lowerBound(tails, x);
    tails[i] = x;
  }
  return tails.length;
}

export function lcsLength(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  return dp[a.length][b.length];
}

export function uniquePathsWithObstacles(grid: number[][]): number {
  const C = grid[0]?.length ?? 0;
  const dp = new Array(C).fill(0);
  dp[0] = 1;
  for (const row of grid) {
    for (let c = 0; c < C; c++) {
      if (row[c] === 1) dp[c] = 0;
      else if (c > 0) dp[c] += dp[c - 1];
    }
  }
  return grid.length ? dp[C - 1] : 0;
}
