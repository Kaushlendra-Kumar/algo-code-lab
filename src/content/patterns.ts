import type { Pattern } from '../types/content';
import { cpp } from './cpp';

const P = (p: Omit<Pattern, 'examples' | 'mistakes' | 'related' | 'prerequisites'> & Partial<Pick<Pattern, 'examples' | 'mistakes' | 'related' | 'prerequisites'>>): Pattern => ({
  examples: [],
  mistakes: [],
  related: [],
  prerequisites: [],
  ...p,
});

export const PATTERNS: Pattern[] = [
  // ------------------------------------------------------------ Arrays & Hashing
  P({
    id: 'frequency-counting',
    name: 'Frequency counting',
    family: 'Arrays & Hashing',
    summary: 'Count how often each value occurs in one pass, then answer questions from the counts instead of re-scanning.',
    cues: ['"anagram", "duplicate", "most frequent", "appears exactly k times"', 'Order does not matter, only multiplicity', 'Alphabet is small (26 letters) → an array of counts works'],
    useWhen: ['You need multiplicities or to compare two multisets', 'A value must be checked for repeats quickly'],
    avoidWhen: ['The answer depends on positions/order (use indices or two pointers)', 'Values are huge and sparse and memory is tight (prefer sorting)'],
    invariant: 'After processing the first i items, count[x] equals the occurrences of x among them.',
    complexity: 'O(n) time; O(k) space for k distinct keys (O(1) for a fixed alphabet).',
    visualization: 'prefix-sum',
    examples: ['d02-B'],
    mistakes: ['Using map when unordered_map or a fixed array suffices', 'Forgetting to decrement/erase when the window shrinks', 'char used as an index can be negative — cast to unsigned char'],
    related: ['hash-lookup', 'sliding-window-variable', 'top-k'],
    go: `func freq(s string) map[rune]int {
	count := map[rune]int{}
	for _, ch := range s {
		count[ch]++
	}
	return count
}`,
  }),
  P({
    id: 'hash-lookup',
    name: 'Hash-based lookup (complement search)',
    family: 'Arrays & Hashing',
    summary: 'Store what you have seen in a hash map so the partner of the current element can be found in O(1) average time.',
    cues: ['"find two elements whose sum/difference is X"', 'Unsorted input and you need pairs', 'Brute force is a nested loop comparing all pairs'],
    useWhen: ['Pairs/complements in unsorted data', 'Need first/last index of a value', 'Deduplication'],
    avoidWhen: ['Input is already sorted and O(1) extra space is required (two pointers)', 'Worst-case guarantees matter (adversarial hashing) — consider sorting'],
    invariant: 'Before processing index i, the map contains exactly the elements at indices < i.',
    complexity: 'O(n) average time, O(n) space.',
    visualization: 'prefix-sum',
    examples: ['d02-A'],
    mistakes: ['Inserting the current element before looking up its complement (pairs an element with itself)', 'Assuming unordered_map iteration order is meaningful'],
    related: ['frequency-counting', 'two-pointers-opposite', 'prefix-sum'],
    go: `func twoSum(nums []int, target int) (int, int) {
	seen := map[int]int{}
	for i, x := range nums {
		if j, ok := seen[target-x]; ok {
			return j, i
		}
		seen[x] = i
	}
	return -1, -1
}`,
  }),
  P({
    id: 'prefix-sum',
    name: 'Prefix sums',
    family: 'Arrays & Hashing',
    summary: 'Precompute prefix[i] = sum of the first i elements so any range sum is a single subtraction.',
    cues: ['Many range-sum queries on a static array', '"subarray sum equals k" (prefix sums + hash map)', 'Sum of a rectangle in a matrix (2D prefix)'],
    useWhen: ['The array does not change between queries', 'You need counts/sums over contiguous ranges'],
    avoidWhen: ['Values change frequently between queries (use a Fenwick/segment tree)', 'You need range minimum (prefix sums do not invert min)'],
    invariant: 'prefix[i + 1] = prefix[i] + a[i]; sum(l..r) = prefix[r + 1] − prefix[l].',
    complexity: 'O(n) build, O(1) per query, O(n) space.',
    visualization: 'prefix-sum',
    examples: ['d03-A', 'd38-A'],
    mistakes: ['Off-by-one: using prefix[r] − prefix[l] (drops a[r])', 'Overflow: store prefix in long long', 'Forgetting prefix[0] = 0 when combining with a hash map (subarrays starting at 0)'],
    related: ['difference-array', 'suffix-sum', 'hash-lookup'],
    go: `func prefixSums(a []int) []int64 {
	p := make([]int64, len(a)+1)
	for i, x := range a {
		p[i+1] = p[i] + int64(x)
	}
	return p
}`,
  }),
  P({
    id: 'suffix-sum',
    name: 'Suffix aggregates',
    family: 'Arrays & Hashing',
    summary: 'Precompute information about everything to the right of each index (sum, product, max) to combine with a left-to-right pass.',
    cues: ['"product of array except self"', '"for each i, best value after i"', 'An answer combines left part and right part'],
    useWhen: ['Each position needs an aggregate of the elements after it'],
    avoidWhen: ['The aggregate is not decomposable (needs the whole window)'],
    invariant: 'suffix[i] aggregates a[i..n−1]; suffix[n] is the identity (0 for sums, 1 for products).',
    complexity: 'O(n) time, O(n) space (often reducible to O(1) by folding into the output array).',
    examples: [],
    mistakes: ['Wrong identity element for the empty suffix', 'Building the suffix array in the wrong direction'],
    related: ['prefix-sum', 'running-aggregate'],
  }),
  P({
    id: 'difference-array',
    name: 'Difference arrays',
    family: 'Arrays & Hashing',
    summary: 'Apply "add v to every element in [l, r]" in O(1) by recording +v at l and −v at r + 1, then prefix-sum once at the end.',
    cues: ['Many range updates followed by one read of the final array', '"bookings", "car pooling", "how many intervals cover point x"'],
    useWhen: ['Updates are all known before the reads', 'Range increments on a fixed-size domain'],
    avoidWhen: ['Reads and updates interleave (use a Fenwick tree)'],
    invariant: 'value[i] = diff[0] + diff[1] + … + diff[i].',
    complexity: 'O(1) per update, O(n) to materialise.',
    visualization: 'prefix-sum',
    examples: ['d03-B', 'd34-B'],
    mistakes: ['Allocating n instead of n + 1 slots (r + 1 out of bounds)', 'Forgetting the final prefix-sum pass'],
    related: ['prefix-sum', 'sweep-line'],
  }),
  P({
    id: 'running-aggregate',
    name: 'Running aggregates',
    family: 'Arrays & Hashing',
    summary: 'Carry a summary (sum, max, min, best-so-far) through one pass instead of recomputing it for every position.',
    cues: ['"maximum so far", "best time to buy and sell"', 'The answer for position i depends on all positions before i through a simple summary'],
    useWhen: ['The summary can be updated in O(1) from the previous one'],
    avoidWhen: ['The summary needs elements to be removed later (use a monotonic deque or window)'],
    invariant: 'After step i the aggregate summarises exactly a[0..i].',
    complexity: 'O(n) time, O(1) space.',
    visualization: 'prefix-sum',
    examples: ['d01-A', 'd27-B'],
    mistakes: ['Initialising max with 0 when all values can be negative', 'Updating the aggregate before using its previous value'],
    related: ['prefix-sum', 'dp-1d'],
  }),
  P({
    id: 'in-place-transform',
    name: 'In-place array transformation',
    family: 'Arrays & Hashing',
    summary: 'Rewrite the array using a write index (or swaps) so no extra array is needed.',
    cues: ['"in place", "O(1) extra space"', '"move zeros", "remove element", "rotate"'],
    useWhen: ['Memory must be O(1)', 'Relative order of kept elements must be preserved (write pointer)'],
    avoidWhen: ['The original array must stay unchanged'],
    invariant: 'a[0..write) holds exactly the kept elements seen so far, in order.',
    complexity: 'O(n) time, O(1) extra space.',
    visualization: 'two-pointers',
    examples: ['d04-B'],
    cpp: cpp`
// Move all zeros to the end, keeping the order of non-zero values.
void moveZeros(vector<int>& a) {
    int write = 0;
    for (int read = 0; read < (int)a.size(); read++)
        if (a[read] != 0) swap(a[write++], a[read]);
}`,
    mistakes: ['Overwriting values before reading them', 'Using erase() inside a loop (O(n²))'],
    related: ['two-pointers-same'],
  }),

  // ------------------------------------------------------------ Pointers & Windows
  P({
    id: 'two-pointers-opposite',
    name: 'Opposite-direction two pointers',
    family: 'Pointers & Windows',
    summary: 'Start one pointer at each end of a sorted (or symmetric) sequence and move the one that cannot be part of an answer.',
    cues: ['Sorted array + pair/triplet sum', 'Palindrome checks', '"container with most water"-style area between two ends'],
    useWhen: ['Moving one pointer provably discards a whole set of candidate pairs'],
    avoidWhen: ['The array is unsorted and sorting would destroy needed indices (use hashing)'],
    invariant: 'Any valid pair lies within [left, right]; every discarded pair was proven not to work.',
    complexity: 'O(n) time, O(1) space (plus O(n log n) if you must sort first).',
    visualization: 'two-pointers',
    examples: ['d04-A'],
    mistakes: ['Using while (left <= right) when a pair needs two distinct indices', 'Moving the wrong pointer', 'Not skipping duplicates when unique results are required'],
    related: ['hash-lookup', 'binary-search', 'two-pointers-same'],
    go: `func pairSum(a []int, target int) (int, int) {
	l, r := 0, len(a)-1
	for l < r {
		s := a[l] + a[r]
		switch {
		case s == target:
			return l, r
		case s < target:
			l++
		default:
			r--
		}
	}
	return -1, -1
}`,
  }),
  P({
    id: 'two-pointers-same',
    name: 'Same-direction two pointers',
    family: 'Pointers & Windows',
    summary: 'A slow (write/anchor) pointer and a fast (read) pointer both move forward; the slow one marks the boundary of the processed result.',
    cues: ['Remove duplicates from sorted array', 'Merge two sorted arrays', 'Partition by a condition'],
    useWhen: ['Single forward scan with a second boundary'],
    avoidWhen: ['You need to look backward arbitrarily'],
    invariant: 'Elements before slow are final; fast has scanned everything before it.',
    complexity: 'O(n) time, O(1) space.',
    visualization: 'two-pointers',
    examples: ['d04-B'],
    mistakes: ['Returning slow vs slow + 1 incorrectly', 'Reading past the end of one array when merging'],
    related: ['in-place-transform', 'sliding-window-variable', 'merge-sort'],
  }),
  P({
    id: 'fast-slow-pointers',
    name: 'Fast and slow pointers',
    family: 'Pointers & Windows',
    summary: 'Move one pointer twice as fast as the other to detect cycles or find the middle without extra memory.',
    cues: ['Linked list cycle', 'Middle node', '"happy number", repeated function application x → f(x)'],
    useWhen: ['You cannot index randomly and want O(1) memory'],
    avoidWhen: ['A hash set of visited nodes is acceptable and simpler to explain'],
    invariant: 'Inside a cycle, the gap between fast and slow shrinks by exactly one node per step, so they must meet.',
    complexity: 'O(n) time, O(1) space.',
    visualization: 'fast-slow',
    examples: ['d06-A', 'd06-B'],
    mistakes: ['Checking fast->next->next without checking fast->next', 'Starting phase 2 from the wrong node'],
    related: ['two-pointers-same'],
  }),
  P({
    id: 'sliding-window-fixed',
    name: 'Sliding window (fixed size)',
    family: 'Pointers & Windows',
    summary: 'Maintain an aggregate of exactly k consecutive elements; slide by adding the new element and removing the one that left.',
    cues: ['"every subarray of size k"', '"average/sum/max of each window of length k"'],
    useWhen: ['The window aggregate can be updated incrementally (sum, counts)'],
    avoidWhen: ['The aggregate cannot remove an element cheaply (max → use a monotonic deque)'],
    invariant: 'window = a[right − k + 1] + … + a[right].',
    complexity: 'O(n) time, O(1) or O(k) space.',
    visualization: 'sliding-window',
    examples: ['d05-A'],
    mistakes: ['k larger than n', 'Updating the best answer before the first full window exists'],
    related: ['sliding-window-variable', 'monotonic-queue', 'prefix-sum'],
  }),
  P({
    id: 'sliding-window-variable',
    name: 'Sliding window (variable size)',
    family: 'Pointers & Windows',
    summary: 'Expand the right edge; while the window violates a constraint, shrink from the left. Works when the constraint is monotone in window size.',
    cues: ['"longest/shortest subarray or substring such that …"', 'Constraint like "at most k distinct", "sum ≥ target" with non-negative numbers'],
    useWhen: ['Shrinking a valid window keeps it valid (or growing an invalid one keeps it invalid)'],
    avoidWhen: ['Negative numbers break the monotonicity of sums (use prefix sums + hash map instead)'],
    invariant: 'After shrinking, the window [left, right] satisfies the constraint.',
    complexity: 'O(n) time — each index enters and leaves once; O(k) space for the window state.',
    visualization: 'sliding-window',
    examples: ['d05-B'],
    mistakes: ['Using if instead of while when shrinking', 'Applying it to sums with negative numbers'],
    related: ['sliding-window-fixed', 'frequency-counting', 'two-pointers-same'],
    go: `func longestUnique(s string) int {
	last := map[byte]int{}
	left, best := 0, 0
	for right := 0; right < len(s); right++ {
		if p, ok := last[s[right]]; ok && p >= left {
			left = p + 1
		}
		last[s[right]] = right
		if right-left+1 > best {
			best = right - left + 1
		}
	}
	return best
}`,
  }),
  P({
    id: 'multiple-windows',
    name: 'Multiple windows / "at most k" trick',
    family: 'Pointers & Windows',
    summary: 'Count subarrays with exactly k of something as atMost(k) − atMost(k − 1), each solved with a variable window.',
    cues: ['"exactly k distinct"', '"number of subarrays with exactly k odd numbers"'],
    useWhen: ['"Exactly" is hard to maintain but "at most" is monotone'],
    avoidWhen: ['A single window already captures the condition'],
    invariant: 'atMost(k) counts, for every right, all lefts whose window has ≤ k items of interest.',
    complexity: 'O(n) time (two passes), O(k) space.',
    visualization: 'sliding-window',
    examples: ['d05-B'],
    cpp: cpp`
// Number of subarrays with at most k odd numbers.
long long atMost(const vector<int>& a, int k) {
    long long count = 0;
    int left = 0, odd = 0;
    for (int right = 0; right < (int)a.size(); right++) {
        odd += a[right] % 2 != 0;
        while (odd > k) odd -= a[left++] % 2 != 0;
        count += right - left + 1;  // every left in [left, right]
    }
    return count;
}
// exactly(k) = atMost(k) - atMost(k - 1)`,
    mistakes: ['Calling atMost(−1) without guarding (should return 0)'],
    related: ['sliding-window-variable'],
  }),

  // ------------------------------------------------------------ Searching & Sorting
  P({
    id: 'binary-search',
    name: 'Binary search',
    family: 'Searching & Sorting',
    summary: 'Halve a sorted search space each step by comparing with the middle element.',
    cues: ['Sorted array', '"O(log n)" required', 'Searching for a target value'],
    useWhen: ['Random access + sorted order (or any monotone condition)'],
    avoidWhen: ['Data is unsorted and searched only once (a linear scan is O(n) vs O(n log n) to sort)'],
    invariant: 'If the target exists, it is inside [lo, hi].',
    complexity: 'O(log n) time, O(1) space.',
    visualization: 'binary-search',
    examples: ['d07-A'],
    mistakes: ['mid = (lo + hi) / 2 can overflow — use lo + (hi − lo) / 2', 'Infinite loop when lo = mid without + 1', 'Mixing closed [lo, hi] and half-open [lo, hi) conventions'],
    related: ['lower-upper-bound', 'binary-search-answer'],
    go: `func binarySearch(a []int, target int) int {
	lo, hi := 0, len(a)-1
	for lo <= hi {
		mid := lo + (hi-lo)/2
		switch {
		case a[mid] == target:
			return mid
		case a[mid] < target:
			lo = mid + 1
		default:
			hi = mid - 1
		}
	}
	return -1
}`,
  }),
  P({
    id: 'lower-upper-bound',
    name: 'Lower bound / upper bound',
    family: 'Searching & Sorting',
    summary: 'Find the first index whose value is ≥ target (lower bound) or > target (upper bound). Their difference counts occurrences.',
    cues: ['"first/last position of target"', '"insert position"', '"count of values in [a, b]"'],
    useWhen: ['Duplicates exist and you need a boundary, not just any match'],
    avoidWhen: ['Only membership is needed (unordered_set may be simpler)'],
    invariant: 'Everything left of lo is < target; everything at or right of hi is ≥ target.',
    complexity: 'O(log n) time.',
    visualization: 'binary-search',
    examples: ['d07-B'],
    mistakes: ['Returning lo − 1 / hi + 1 inconsistently', 'Forgetting that the answer can be n (no such element)'],
    related: ['binary-search', 'monotonic-predicate'],
  }),
  P({
    id: 'binary-search-answer',
    name: 'Binary search on the answer',
    family: 'Searching & Sorting',
    summary: 'When "can we do it with value x?" is monotone in x, binary search over x and test feasibility with a greedy check.',
    cues: ['"minimum capacity/speed/time such that …"', '"maximise the minimum distance"', 'Answer range is large but checking one candidate is easy'],
    useWhen: ['feasible(x) is false…false true…true (or reverse)'],
    avoidWhen: ['Feasibility is not monotone', 'A direct formula exists'],
    invariant: 'lo is never feasible-and-skipped; the first feasible value stays inside [lo, hi].',
    complexity: 'O(log(range) × cost of feasible()).',
    visualization: 'binary-search',
    examples: ['d08-A'],
    mistakes: ['Wrong search bounds (low must be feasible-or-not, high must be feasible)', 'Overflow when summing inside feasible()'],
    related: ['monotonic-predicate', 'binary-search'],
  }),
  P({
    id: 'monotonic-predicate',
    name: 'Search over a monotonic predicate',
    family: 'Searching & Sorting',
    summary: 'Reframe the problem as finding the boundary where a yes/no predicate flips; binary search finds that boundary.',
    cues: ['Rotated sorted arrays', '"first bad version"', 'Peak finding'],
    useWhen: ['You can decide which half contains the boundary from one probe'],
    avoidWhen: ['Probes cannot tell you which side to discard'],
    invariant: 'pred(lo − 1) is false and pred(hi) is true (conceptually).',
    complexity: 'O(log n) probes.',
    visualization: 'binary-search',
    examples: ['d08-B', 'd07-B'],
    mistakes: ['Predicate not actually monotone with duplicates (rotated array with repeats)'],
    related: ['binary-search-answer', 'lower-upper-bound', 'monotonicity-detection'],
  }),
  P({
    id: 'divide-and-conquer',
    name: 'Divide and conquer',
    family: 'Searching & Sorting',
    summary: 'Split the problem into independent halves, solve each recursively, and combine the answers.',
    cues: ['Merge-based counting (inversions)', 'Fast exponentiation', 'Tree construction from traversals'],
    useWhen: ['Subproblems do not overlap (otherwise use DP)'],
    avoidWhen: ['Subproblems repeat — memoize instead'],
    invariant: 'Each recursive call returns the correct answer for its range.',
    complexity: 'Often O(n log n) via T(n) = 2T(n/2) + O(n).',
    visualization: 'sorting',
    examples: ['d11-A', 'd19-A'],
    mistakes: ['Missing or wrong base case', 'Combining step that is accidentally O(n²)'],
    related: ['merge-sort', 'recursive-decomposition'],
  }),
  P({
    id: 'merge-sort',
    name: 'Merge sort and merge-based reasoning',
    family: 'Searching & Sorting',
    summary: 'Sort halves recursively, then merge two sorted runs with two pointers. The merge step can also count cross pairs.',
    cues: ['Count inversions', 'Stable O(n log n) sort required', 'Merge k sorted lists'],
    useWhen: ['Stability matters', 'Counting relationships between left and right halves'],
    avoidWhen: ['O(1) extra space is required (merge needs O(n))'],
    invariant: 'Both runs are sorted; output so far contains the smallest elements in order.',
    complexity: 'O(n log n) time, O(n) space.',
    visualization: 'sorting',
    examples: ['d09-A'],
    cpp: cpp`
void mergeSort(vector<int>& a, int lo, int hi, vector<int>& tmp) {  // sorts [lo, hi)
    if (hi - lo < 2) return;
    int mid = lo + (hi - lo) / 2;
    mergeSort(a, lo, mid, tmp);
    mergeSort(a, mid, hi, tmp);
    int i = lo, j = mid, k = lo;
    while (i < mid && j < hi) tmp[k++] = (a[i] <= a[j]) ? a[i++] : a[j++];  // <= keeps it stable
    while (i < mid) tmp[k++] = a[i++];
    while (j < hi) tmp[k++] = a[j++];
    for (k = lo; k < hi; k++) a[k] = tmp[k];
}`,
    mistakes: ['Using < instead of <= in the merge (loses stability)', 'Allocating a new vector in every call (slow)'],
    related: ['divide-and-conquer', 'two-pointers-same'],
  }),
  P({
    id: 'quickselect',
    name: 'Quickselect',
    family: 'Searching & Sorting',
    summary: 'Partition around a pivot and recurse only into the side containing the k-th element.',
    cues: ['"k-th largest/smallest" without needing full order'],
    useWhen: ['Average O(n) is enough and modifying the array is allowed'],
    avoidWhen: ['Worst-case guarantees are needed (use a heap or nth_element with care)'],
    invariant: 'After partition, the pivot is at its final sorted index p.',
    complexity: 'O(n) average, O(n²) worst case; O(1) extra space.',
    visualization: 'sorting',
    examples: ['d33-A'],
    mistakes: ['Confusing k-th largest with index k (should be n − k)', 'Always picking the first element as pivot on sorted input'],
    related: ['top-k', 'merge-sort'],
  }),
  P({
    id: 'custom-sort',
    name: 'Custom sorting with comparators',
    family: 'Searching & Sorting',
    summary: 'Sort by a key or rule that makes the rest of the algorithm simple — then a linear scan often finishes the job.',
    cues: ['Order by multiple keys', '"largest number formed by concatenation"', 'Sorting objects/pairs'],
    useWhen: ['The problem becomes greedy or linear once ordered'],
    avoidWhen: ['Original indices are needed and not kept alongside values'],
    invariant: 'A comparator must be a strict weak ordering: comp(a, a) is false and it is transitive.',
    complexity: 'O(n log n) comparisons.',
    visualization: 'sorting',
    examples: ['d09-A'],
    mistakes: ['Comparator returning true for equal elements (<=) → undefined behaviour in std::sort', 'Copying heavy objects inside the comparator (take const&)'],
    related: ['interval-sorting', 'merge-sort'],
  }),
  P({
    id: 'interval-sorting',
    name: 'Interval sorting',
    family: 'Searching & Sorting',
    summary: 'Sort intervals by start (to merge) or by end (to schedule) so overlaps only need to be checked against the last kept interval.',
    cues: ['Intervals, meetings, bookings, ranges'],
    useWhen: ['Overlap decisions can be made locally after ordering'],
    avoidWhen: ['Queries arrive online (consider a balanced tree / map)'],
    invariant: 'After sorting by start, an interval can only overlap the most recent merged interval.',
    complexity: 'O(n log n).',
    visualization: 'greedy',
    examples: ['d20-A', 'd31-A'],
    mistakes: ['Sorting by the wrong endpoint for the goal', 'Treating touching intervals [1,2],[2,3] inconsistently'],
    related: ['interval-scheduling', 'sweep-line', 'custom-sort'],
  }),

  // ------------------------------------------------------------ Stacks & Queues
  P({
    id: 'monotonic-stack-decreasing',
    name: 'Monotonic decreasing stack',
    family: 'Stacks & Queues',
    summary: 'Keep a stack whose values decrease from bottom to top; a larger arrival pops (and resolves) every smaller element it beats.',
    cues: ['"next greater element"', '"daily temperatures"', '"how many days until warmer"'],
    useWhen: ['Each element waits for the first later element that is larger'],
    avoidWhen: ['You need the k-th greater, not the first'],
    invariant: 'Stack values strictly decrease (bottom → top); each element is pushed and popped once.',
    complexity: 'O(n) amortised time, O(n) space.',
    visualization: 'stack-queue',
    examples: ['d10-A'],
    mistakes: ['Storing values instead of indices when distances are needed', 'Using < vs <= incorrectly with duplicates'],
    related: ['next-greater-element', 'monotonic-stack-increasing', 'amortized-analysis'],
  }),
  P({
    id: 'monotonic-stack-increasing',
    name: 'Monotonic increasing stack',
    family: 'Stacks & Queues',
    summary: 'Keep values increasing from bottom to top to find previous/next smaller elements — the core of "largest rectangle in histogram".',
    cues: ['"previous smaller element"', '"largest rectangle"', '"sum of subarray minimums"'],
    useWhen: ['Each bar/element is limited by the nearest smaller neighbour'],
    avoidWhen: ['Simple prefix minimum suffices'],
    invariant: 'Stack values increase bottom → top; the element below each entry is its previous smaller.',
    complexity: 'O(n) amortised.',
    visualization: 'stack-queue',
    examples: ['d10-A'],
    cpp: cpp`
// prevSmaller[i] = index of the nearest element to the left that is smaller, or -1.
vector<int> previousSmaller(const vector<int>& a) {
    vector<int> res(a.size(), -1);
    stack<int> st;
    for (int i = 0; i < (int)a.size(); i++) {
        while (!st.empty() && a[st.top()] >= a[i]) st.pop();
        if (!st.empty()) res[i] = st.top();
        st.push(i);
    }
    return res;
}`,
    mistakes: ['Forgetting a sentinel to flush remaining bars at the end'],
    related: ['monotonic-stack-decreasing', 'next-greater-element'],
  }),
  P({
    id: 'monotonic-queue',
    name: 'Monotonic queue (deque)',
    family: 'Stacks & Queues',
    summary: 'A deque of indices with decreasing values gives the maximum of a sliding window in O(1) per step.',
    cues: ['"maximum/minimum of every window of size k"', 'DP transitions over a sliding range'],
    useWhen: ['Window max/min with both ends moving forward'],
    avoidWhen: ['Arbitrary deletions (use a multiset or heap with lazy deletion)'],
    invariant: 'Deque indices are inside the window and their values decrease front → back.',
    complexity: 'O(n) amortised, O(k) space.',
    visualization: 'stack-queue',
    examples: ['d10-B'],
    mistakes: ['Popping the front by value instead of checking index ≤ i − k'],
    related: ['sliding-window-fixed', 'monotonic-stack-decreasing'],
  }),
  P({
    id: 'expression-parsing',
    name: 'Stack-based expression parsing',
    family: 'Stacks & Queues',
    summary: 'Use stacks to handle nesting: brackets, operators with precedence, and evaluation of postfix expressions.',
    cues: ['Balanced parentheses', 'Evaluate an arithmetic expression', 'Decode nested strings like 3[a2[c]]'],
    useWhen: ['The most recent unmatched item must be matched first (LIFO)'],
    avoidWhen: ['There is no nesting — a counter may be enough'],
    invariant: 'The stack holds exactly the currently open (unmatched) constructs.',
    complexity: 'O(n) time, O(n) space.',
    visualization: 'stack-queue',
    examples: ['d10-A'],
    cpp: cpp`
bool balanced(const string& s) {
    stack<char> st;
    for (char c : s) {
        if (c == '(' || c == '[' || c == '{') st.push(c);
        else {
            if (st.empty()) return false;
            char open = st.top(); st.pop();
            if ((c == ')' && open != '(') || (c == ']' && open != '[') || (c == '}' && open != '{')) return false;
        }
    }
    return st.empty();
}`,
    mistakes: ['Calling top() on an empty stack', 'Forgetting to check the stack is empty at the end'],
    related: ['monotonic-stack-decreasing', 'recursive-decomposition'],
  }),
  P({
    id: 'next-greater-element',
    name: 'Next greater / smaller element',
    family: 'Stacks & Queues',
    summary: 'For every element, find the first element to its right (or left) that is greater (or smaller) using a monotonic stack.',
    cues: ['"next warmer day"', '"stock span"', '"first larger to the right"'],
    useWhen: ['Pairs are "nearest" in one direction with a comparison'],
    avoidWhen: ['You need all greater elements, not the nearest'],
    invariant: 'Elements in the stack have not yet found their next greater element.',
    complexity: 'O(n).',
    visualization: 'stack-queue',
    examples: ['d10-A'],
    mistakes: ['Circular arrays need two passes (i from 0 to 2n − 1 with i % n)'],
    related: ['monotonic-stack-decreasing', 'monotonic-stack-increasing'],
  }),
  P({
    id: 'queue-level-traversal',
    name: 'Queue-based level traversal',
    family: 'Stacks & Queues',
    summary: 'Process items in rounds: snapshot the queue size, pop exactly that many, push their successors for the next round.',
    cues: ['"level by level"', '"minimum number of steps/rounds/minutes"'],
    useWhen: ['You need the round number of each item'],
    avoidWhen: ['Edges have different weights (use Dijkstra)'],
    invariant: 'At the start of each round, the queue holds exactly the items at the current distance.',
    complexity: 'O(V + E).',
    visualization: 'tree',
    examples: ['d17-A', 'd22-A'],
    mistakes: ['Reading q.size() inside the for condition while pushing (the size changes)'],
    related: ['tree-bfs', 'graph-bfs', 'multi-source-bfs'],
  }),

  // ------------------------------------------------------------ Recursion & Search
  P({
    id: 'recursive-decomposition',
    name: 'Recursive decomposition',
    family: 'Recursion & Search',
    summary: 'Express the answer for a problem in terms of answers to strictly smaller instances, plus a base case.',
    cues: ['Self-similar structure (trees, nested lists)', '"compute f(n) from f(n − 1)"'],
    useWhen: ['The recursive definition is natural and depth is bounded'],
    avoidWhen: ['Depth could reach 10⁵+ (stack overflow) — convert to iteration'],
    invariant: 'Trust the recursive call: assume it is correct for smaller inputs (induction).',
    complexity: 'Number of calls × work per call; space = maximum depth.',
    visualization: 'recursion',
    examples: ['d11-A', 'd11-B'],
    mistakes: ['Base case missing or unreachable', 'Recomputing overlapping subproblems exponentially'],
    related: ['divide-and-conquer', 'memoization', 'tree-dfs'],
  }),
  P({
    id: 'backtracking',
    name: 'Backtracking',
    family: 'Recursion & Search',
    summary: 'Build a candidate step by step: choose, recurse, then undo the choice before trying the next one.',
    cues: ['"all combinations / permutations / arrangements"', 'Constraint satisfaction (N-Queens, Sudoku)'],
    useWhen: ['You must enumerate solutions and the search space is small'],
    avoidWhen: ['Only a count or optimum is needed and subproblems overlap (try DP)'],
    invariant: 'On entry to each call, cur holds exactly the choices on the path from the root.',
    complexity: 'Exponential — proportional to the number of nodes in the recursion tree.',
    visualization: 'recursion',
    examples: ['d12-A', 'd13-B'],
    mistakes: ['Forgetting to undo (pop_back / unmark visited)', 'Copying the partial vector at every call (slow)'],
    related: ['subsets', 'permutations', 'combinations', 'constraint-pruning'],
  }),
  P({
    id: 'subsets',
    name: 'Subsets',
    family: 'Recursion & Search',
    summary: 'Each element is either in or out — 2ⁿ subsets, generated by recursion or bitmasks.',
    cues: ['"all subsets", "power set"'],
    useWhen: ['n ≤ ~20'],
    avoidWhen: ['n is large — look for DP over sums instead'],
    invariant: 'Elements before index start have already been decided.',
    complexity: 'O(n · 2ⁿ).',
    visualization: 'recursion',
    examples: ['d12-A', 'd14-B'],
    mistakes: ['Duplicates in input: sort and skip equal siblings'],
    related: ['backtracking', 'subset-enumeration'],
  }),
  P({
    id: 'permutations',
    name: 'Permutations',
    family: 'Recursion & Search',
    summary: 'Pick each unused element for the next position; n! orderings.',
    cues: ['"all orderings", "arrangements"'],
    useWhen: ['n ≤ ~9'],
    avoidWhen: ['Only the next permutation is needed (std::next_permutation)'],
    invariant: 'used[i] is true exactly for elements already placed in cur.',
    complexity: 'O(n · n!).',
    visualization: 'recursion',
    examples: ['d12-B'],
    mistakes: ['Forgetting to reset used[i] after recursion'],
    related: ['backtracking'],
  }),
  P({
    id: 'combinations',
    name: 'Combinations',
    family: 'Recursion & Search',
    summary: 'Choose k items without regard to order by only moving forward in the index (start parameter).',
    cues: ['"choose k of n"', '"combination sum"'],
    useWhen: ['Order does not matter'],
    avoidWhen: ['Order matters (permutations)'],
    invariant: 'Chosen indices are strictly increasing, which prevents duplicate orderings.',
    complexity: 'O(k · C(n, k)).',
    visualization: 'recursion',
    examples: ['d13-A'],
    mistakes: ['Starting the loop at 0 instead of start (produces permutations)'],
    related: ['backtracking', 'constraint-pruning'],
  }),
  P({
    id: 'constraint-pruning',
    name: 'Constraint pruning',
    family: 'Recursion & Search',
    summary: 'Stop exploring a branch as soon as it cannot lead to a valid answer — often enabled by sorting the choices.',
    cues: ['Sum exceeds target', 'Board position already attacked', 'Remaining items cannot reach k'],
    useWhen: ['A cheap test can reject a whole subtree'],
    avoidWhen: ['The test is more expensive than exploring'],
    invariant: 'Every pruned branch provably contains no solution.',
    complexity: 'Same worst case, often dramatically fewer nodes in practice.',
    visualization: 'recursion',
    examples: ['d13-A'],
    mistakes: ['Pruning with continue when sorted input allows break (or vice versa when not sorted)'],
    related: ['backtracking', 'branch-and-bound'],
  }),
  P({
    id: 'branch-and-bound',
    name: 'Branch and bound (introduction)',
    family: 'Recursion & Search',
    summary: 'In an optimisation search, discard a branch when an optimistic bound on it cannot beat the best answer found so far.',
    cues: ['Minimise/maximise over an exponential search space', 'A cheap optimistic estimate exists'],
    useWhen: ['Exact optimum on small inputs where DP state is too large'],
    avoidWhen: ['A polynomial DP or greedy exists'],
    invariant: 'best is a valid answer; bound(node) is never worse than any completion of node.',
    complexity: 'Exponential worst case; depends on bound quality.',
    visualization: 'recursion',
    intro: true,
    examples: ['d13-A'],
    cpp: cpp`
// Minimum number of coins by DFS with a bound: stop when used >= best.
void dfs(const vector<int>& coins, int idx, int remain, int used, int& best) {
    if (remain == 0) { best = min(best, used); return; }
    if (idx == (int)coins.size() || used >= best) return;      // bound
    int c = coins[idx];                                           // coins sorted descending
    for (int take = remain / c; take >= 0; take--) {
        if (used + take >= best) continue;
        dfs(coins, idx + 1, remain - take * c, used + take, best);
    }
}`,
    mistakes: ['Using a bound that is not optimistic (prunes real optima)'],
    related: ['constraint-pruning', 'backtracking'],
  }),

  // ------------------------------------------------------------ Trees & Graphs
  P({
    id: 'tree-dfs',
    name: 'Tree DFS (recursive)',
    family: 'Trees & Graphs',
    summary: 'Compute a property of a node from the properties of its children (post-order) or pass information down (pre-order).',
    cues: ['Height, diameter, path sums, balanced checks', 'Answer for a node depends on subtrees'],
    useWhen: ['Nearly every binary-tree problem'],
    avoidWhen: ['Very deep (degenerate) trees with 10⁵ nodes → iterative stack'],
    invariant: 'dfs(node) returns the correct value for the subtree rooted at node.',
    complexity: 'O(n) time, O(h) stack space.',
    visualization: 'tree',
    examples: ['d16-A', 'd16-B'],
    mistakes: ['Null checks missing', 'Mixing "value returned upward" with "global best answer"'],
    related: ['tree-bfs', 'recursive-decomposition'],
  }),
  P({
    id: 'tree-bfs',
    name: 'Tree BFS (level order)',
    family: 'Trees & Graphs',
    summary: 'Visit nodes level by level with a queue; snapshot the level size to group results.',
    cues: ['"level", "depth", "right side view", "minimum depth"'],
    useWhen: ['Answers grouped by depth', 'Shallowest node with a property'],
    avoidWhen: ['Subtree aggregates (DFS is simpler)'],
    invariant: 'At the start of a round the queue holds exactly one level.',
    complexity: 'O(n) time, O(width) space.',
    visualization: 'tree',
    examples: ['d17-A', 'd17-B'],
    mistakes: ['Not freezing the level size before the inner loop'],
    related: ['queue-level-traversal', 'graph-bfs'],
  }),
  P({
    id: 'bst-property',
    name: 'Binary search tree property',
    family: 'Trees & Graphs',
    summary: 'Left subtree < node < right subtree for every node — enabling O(h) search and sorted in-order traversal.',
    cues: ['"BST", "validate", "k-th smallest", "lowest common ancestor in BST"'],
    useWhen: ['You can steer left/right by comparing with the node value'],
    avoidWhen: ['General binary trees (no ordering)'],
    invariant: 'Every node value lies within (low, high) bounds inherited from its ancestors.',
    complexity: 'O(h) per search; h = O(log n) only if balanced.',
    visualization: 'tree',
    examples: ['d18-A', 'd18-B'],
    mistakes: ['Validating only parent-child pairs instead of the whole range', 'Using int bounds when values reach INT_MIN/INT_MAX'],
    related: ['tree-dfs', 'binary-search'],
  }),
  P({
    id: 'graph-dfs',
    name: 'Graph DFS',
    family: 'Trees & Graphs',
    summary: 'Explore as deep as possible before backtracking, marking nodes visited to avoid infinite loops.',
    cues: ['Connectivity, components, cycle detection', 'Paths exist / reachability'],
    useWhen: ['Reachability or structure, not shortest distance'],
    avoidWhen: ['Shortest path in unweighted graphs (BFS)'],
    invariant: 'A node is marked visited before (or when) its neighbours are explored, so it is entered once.',
    complexity: 'O(V + E) time, O(V) space.',
    visualization: 'graph-algos',
    examples: ['d21-A', 'd23-B'],
    mistakes: ['Marking visited too late (duplicate pushes)', 'Recursion depth on large graphs'],
    related: ['graph-bfs', 'grid-traversal', 'topological-sort'],
  }),
  P({
    id: 'graph-bfs',
    name: 'Graph BFS',
    family: 'Trees & Graphs',
    summary: 'Explore in increasing distance order using a FIFO queue — gives shortest paths when every edge costs the same.',
    cues: ['"minimum number of moves/steps"', 'Unweighted graph shortest path'],
    useWhen: ['All edges have equal weight'],
    avoidWhen: ['Weighted edges (Dijkstra) or 0/1 weights (0-1 BFS)'],
    invariant: 'Nodes leave the queue in non-decreasing order of distance.',
    complexity: 'O(V + E).',
    visualization: 'graph-algos',
    examples: ['d21-B', 'd22-A'],
    mistakes: ['Marking visited when popping instead of when pushing (duplicates in queue)'],
    related: ['tree-bfs', 'multi-source-bfs', 'dijkstra', 'algorithm-selection'],
    go: `func bfs(adj [][]int, src int) []int {
	dist := make([]int, len(adj))
	for i := range dist {
		dist[i] = -1
	}
	dist[src] = 0
	q := []int{src}
	for len(q) > 0 {
		u := q[0]
		q = q[1:]
		for _, v := range adj[u] {
			if dist[v] == -1 {
				dist[v] = dist[u] + 1
				q = append(q, v)
			}
		}
	}
	return dist
}`,
  }),
  P({
    id: 'multi-source-bfs',
    name: 'Multi-source BFS',
    family: 'Trees & Graphs',
    summary: 'Start BFS from all sources at once (distance 0) to get each cell\'s distance to the nearest source.',
    cues: ['"nearest exit/gate/zero"', '"spreading simultaneously from many places"'],
    useWhen: ['Many starting points, one distance field'],
    avoidWhen: ['Different sources have different start times/weights (Dijkstra)'],
    invariant: 'Queue processes cells in order of distance to the nearest source.',
    complexity: 'O(V + E) — not O(sources × (V + E)).',
    visualization: 'grid-paths',
    examples: ['d36-B'],
    mistakes: ['Running a separate BFS from every source (too slow)'],
    related: ['graph-bfs', 'grid-traversal'],
  }),
  P({
    id: 'grid-traversal',
    name: 'Grid traversal / flood fill',
    family: 'Trees & Graphs',
    summary: 'Treat each cell as a node with up to 4 (or 8) neighbours; DFS/BFS while checking bounds and visited.',
    cues: ['2D board, islands, regions, mazes'],
    useWhen: ['The graph is implicit in a matrix'],
    avoidWhen: ['—'],
    invariant: 'Each cell is visited at most once.',
    complexity: 'O(R × C).',
    visualization: 'grid-paths',
    examples: ['d22-A', 'd22-B'],
    mistakes: ['Bounds check after indexing', 'Swapping rows and columns in direction arrays'],
    related: ['graph-dfs', 'graph-bfs', 'union-find'],
  }),
  P({
    id: 'topological-sort',
    name: 'Topological sorting',
    family: 'Trees & Graphs',
    summary: 'Order the nodes of a DAG so every edge goes forward — Kahn\'s algorithm repeatedly removes in-degree-0 nodes.',
    cues: ['Prerequisites, build order, dependency resolution', '"is it possible to finish all tasks?"'],
    useWhen: ['Directed dependencies; cycle detection in directed graphs'],
    avoidWhen: ['Undirected graphs (no direction to order)'],
    invariant: 'A node enters the queue only after all its prerequisites have been output.',
    complexity: 'O(V + E).',
    visualization: 'graph-algos',
    examples: ['d23-A', 'd23-B'],
    mistakes: ['Reversing edge direction', 'Forgetting that output size < n means a cycle'],
    related: ['graph-dfs', 'state-space-dp'],
    go: `func topo(n int, edges [][2]int) []int {
	adj := make([][]int, n)
	indeg := make([]int, n)
	for _, e := range edges {
		adj[e[0]] = append(adj[e[0]], e[1])
		indeg[e[1]]++
	}
	q := []int{}
	for i := 0; i < n; i++ {
		if indeg[i] == 0 {
			q = append(q, i)
		}
	}
	order := []int{}
	for len(q) > 0 {
		u := q[0]
		q = q[1:]
		order = append(order, u)
		for _, v := range adj[u] {
			indeg[v]--
			if indeg[v] == 0 {
				q = append(q, v)
			}
		}
	}
	if len(order) != n {
		return nil
	}
	return order
}`,
  }),
  P({
    id: 'union-find',
    name: 'Union-Find (Disjoint Set Union)',
    family: 'Trees & Graphs',
    summary: 'Maintain disjoint sets under merges; find returns a representative, unite merges two sets.',
    cues: ['"connected?" queries with edges added over time', 'Redundant edge / cycle in undirected graph', 'Kruskal'],
    useWhen: ['Only merges (no splits) and connectivity queries'],
    avoidWhen: ['Edges are removed (offline tricks needed)', 'You need the actual path'],
    invariant: 'parent pointers form a forest; two nodes are connected iff find() returns the same root.',
    complexity: 'Nearly O(1) amortised (inverse Ackermann) with path compression + union by size.',
    visualization: 'graph-algos',
    examples: ['d24-A', 'd24-B'],
    mistakes: ['Linking x to y instead of root(x) to root(y)', 'Forgetting to initialise parent[i] = i'],
    related: ['minimum-spanning-tree', 'graph-dfs'],
    go: `type DSU struct{ parent, size []int }

func NewDSU(n int) *DSU {
	d := &DSU{make([]int, n), make([]int, n)}
	for i := range d.parent {
		d.parent[i], d.size[i] = i, 1
	}
	return d
}

func (d *DSU) Find(x int) int {
	if d.parent[x] != x {
		d.parent[x] = d.Find(d.parent[x])
	}
	return d.parent[x]
}

func (d *DSU) Unite(a, b int) bool {
	a, b = d.Find(a), d.Find(b)
	if a == b {
		return false
	}
	if d.size[a] < d.size[b] {
		a, b = b, a
	}
	d.parent[b] = a
	d.size[a] += d.size[b]
	return true
}`,
  }),
  P({
    id: 'dijkstra',
    name: 'Dijkstra\'s shortest paths',
    family: 'Trees & Graphs',
    summary: 'Repeatedly settle the unsettled node with the smallest tentative distance; relax its outgoing edges.',
    cues: ['Weighted graph, non-negative weights, "minimum cost/time"'],
    useWhen: ['All edge weights ≥ 0'],
    avoidWhen: ['Negative edges (Bellman-Ford)', 'All weights equal (BFS is simpler and faster)'],
    invariant: 'When a node is popped with d == dist[u], dist[u] is final.',
    complexity: 'O((V + E) log V) with a binary heap.',
    visualization: 'graph-algos',
    examples: ['d25-A', 'd25-B'],
    mistakes: ['Not skipping stale heap entries', 'Using int when path sums overflow', 'Max-heap instead of min-heap'],
    related: ['graph-bfs', 'zero-one-bfs', 'algorithm-selection'],
  }),
  P({
    id: 'zero-one-bfs',
    name: '0-1 BFS',
    family: 'Trees & Graphs',
    summary: 'For edge weights 0 or 1, use a deque: push 0-edges to the front and 1-edges to the back — Dijkstra in O(V + E).',
    cues: ['"minimum number of walls to break"', 'Moves that are free vs cost 1'],
    useWhen: ['Weights are only 0 and 1'],
    avoidWhen: ['Other weights appear'],
    invariant: 'The deque holds at most two distinct distance values d and d + 1, in order.',
    complexity: 'O(V + E).',
    visualization: 'grid-paths',
    intro: true,
    examples: ['d36-A'],
    mistakes: ['Pushing 0-weight edges to the back (breaks ordering)'],
    related: ['dijkstra', 'graph-bfs'],
  }),
  P({
    id: 'minimum-spanning-tree',
    name: 'Minimum spanning tree',
    family: 'Trees & Graphs',
    summary: 'Connect all nodes with minimum total edge weight: Kruskal (sorted edges + DSU) or Prim (grow from a node with a heap).',
    cues: ['"connect all cities with minimum cable"', 'Undirected weighted graph, total cost'],
    useWhen: ['Undirected, connected (or per-component forest)'],
    avoidWhen: ['Shortest paths between two nodes (different problem!)'],
    invariant: 'Cut property: the lightest edge crossing any cut belongs to some MST.',
    complexity: 'Kruskal O(E log E); Prim O(E log V).',
    visualization: 'graph-algos',
    examples: ['d35-A', 'd35-B'],
    mistakes: ['Confusing MST with shortest-path tree', 'Not detecting a disconnected graph (fewer than n − 1 edges chosen)'],
    related: ['union-find', 'heap-greedy'],
  }),
  P({
    id: 'trie',
    name: 'Trie (prefix tree)',
    family: 'Trees & Graphs',
    summary: 'Store strings character by character in a tree so all words sharing a prefix share a path.',
    cues: ['"starts with", autocomplete, prefix counting', 'Many words searched against a dictionary'],
    useWhen: ['Prefix queries over many strings'],
    avoidWhen: ['Only exact lookups (unordered_set<string> is simpler)'],
    invariant: 'The path from the root to a node spells exactly its prefix; isEnd marks complete words.',
    complexity: 'O(L) per insert/search for a word of length L; memory O(total characters × alphabet).',
    visualization: 'tree',
    examples: ['d32-A', 'd32-B'],
    mistakes: ['Forgetting the end-of-word flag', 'Leaking nodes (prefer vector-based storage or unique_ptr)'],
    related: ['tree-dfs', 'hash-lookup'],
  }),

  // ------------------------------------------------------------ Dynamic Programming
  P({
    id: 'memoization',
    name: 'Memoization (top-down DP)',
    family: 'Dynamic Programming',
    summary: 'Write the natural recursion, then cache each state\'s answer so it is computed only once.',
    cues: ['Recursive solution with repeated calls on the same arguments', '"number of ways", "minimum cost" over choices'],
    useWhen: ['Only some states are reachable', 'The recursive formulation is clearer'],
    avoidWhen: ['Recursion depth is too large', 'Every state is needed anyway and iteration is easy'],
    invariant: 'memo[state] is either "unknown" or the final answer for that state.',
    complexity: 'O(#states × transitions per state).',
    visualization: 'dp',
    examples: ['d26-A'],
    mistakes: ['Using 0 as "not computed" when 0 is a valid answer', 'State missing a parameter the answer depends on'],
    related: ['tabulation', 'recursive-decomposition'],
  }),
  P({
    id: 'tabulation',
    name: 'Tabulation (bottom-up DP)',
    family: 'Dynamic Programming',
    summary: 'Fill a table in an order where every dependency is computed before it is needed.',
    cues: ['Clear base cases and transitions over increasing size'],
    useWhen: ['All states are needed', 'You want to optimise space by keeping only recent rows'],
    avoidWhen: ['The fill order is unclear or states are sparse'],
    invariant: 'When computing dp[i], all states it depends on already hold final values.',
    complexity: 'O(#states × transitions); space can often shrink to one row.',
    visualization: 'dp',
    examples: ['d26-B'],
    mistakes: ['Wrong loop order (dependency not yet computed)', 'Off-by-one table size'],
    related: ['memoization', 'dp-1d', 'dp-2d'],
    go: `func climbStairs(n int) int64 {
	dp := make([]int64, n+2)
	dp[0], dp[1] = 1, 1
	for i := 2; i <= n; i++ {
		dp[i] = dp[i-1] + dp[i-2]
	}
	return dp[n]
}`,
  }),
  P({
    id: 'dp-1d',
    name: 'One-dimensional DP',
    family: 'Dynamic Programming',
    summary: 'dp[i] describes the best/number of ways for the prefix ending at (or up to) i.',
    cues: ['Linear sequence of decisions (take/skip, step sizes)', 'House robber, climbing stairs, decode ways'],
    useWhen: ['State = position only'],
    avoidWhen: ['Decisions depend on extra information (add a dimension)'],
    invariant: 'dp[i] is final once i is processed.',
    complexity: 'O(n × choices); O(1) space if only the last few values are needed.',
    visualization: 'dp',
    examples: ['d27-A', 'd27-B'],
    mistakes: ['Confusing "ending at i" with "up to i"'],
    related: ['tabulation', 'running-aggregate'],
  }),
  P({
    id: 'dp-2d',
    name: 'Two-dimensional DP',
    family: 'Dynamic Programming',
    summary: 'State has two indices — e.g. positions in two strings, or item index and capacity.',
    cues: ['Two sequences compared', 'Item + budget'],
    useWhen: ['Answer depends on two independent progress variables'],
    avoidWhen: ['One dimension is redundant'],
    invariant: 'dp[i][j] depends only on cells with smaller i and/or j.',
    complexity: 'O(n × m).',
    visualization: 'dp',
    examples: ['d29-A', 'd30-A'],
    mistakes: ['Memory blow-up when n × m is huge (use rolling rows)'],
    related: ['grid-dp', 'knapsack', 'subsequence-dp'],
  }),
  P({
    id: 'grid-dp',
    name: 'Grid DP',
    family: 'Dynamic Programming',
    summary: 'Each cell\'s answer combines answers from the cells you could have come from (usually up and left).',
    cues: ['Moves only right/down', 'Count paths, min path sum, obstacles'],
    useWhen: ['Movement is acyclic (no going back)'],
    avoidWhen: ['Moves in all 4 directions (graph shortest path instead)'],
    invariant: 'dp[r][c] is final once row r, column c is processed in row-major order.',
    complexity: 'O(R × C), O(C) space with one row.',
    visualization: 'dp',
    examples: ['d28-A', 'd28-B'],
    mistakes: ['Obstacle at the start cell', 'Initialising the first row/column independently of obstacles'],
    related: ['dp-2d'],
  }),
  P({
    id: 'knapsack',
    name: 'Knapsack',
    family: 'Dynamic Programming',
    summary: 'For each item decide take or skip under a capacity; dp over (item, capacity).',
    cues: ['Budget/capacity + items with weight and value', '"can we reach sum S?" (subset sum)', '"partition into equal halves"'],
    useWhen: ['Capacity is a small integer (≤ ~10⁵)'],
    avoidWhen: ['Capacity huge and n small (meet-in-the-middle)', 'Fractional items (greedy by ratio)'],
    invariant: 'dp[i][w] = best value using the first i items within capacity w.',
    complexity: 'O(n × W) time; O(W) space with a 1D array iterated downwards.',
    visualization: 'dp',
    examples: ['d29-A', 'd29-B'],
    mistakes: ['Iterating capacity upward in the 1D version (reuses an item = unbounded knapsack)'],
    related: ['dp-2d', 'subsets'],
  }),
  P({
    id: 'subsequence-dp',
    name: 'Subsequence / string DP',
    family: 'Dynamic Programming',
    summary: 'Compare prefixes of strings: match characters diagonally, otherwise take the best of dropping one character.',
    cues: ['LCS, edit distance, LIS, palindromic subsequence'],
    useWhen: ['Characters can be skipped but order is kept'],
    avoidWhen: ['Contiguous substrings (often sliding window / different DP)'],
    invariant: 'dp[i][j] solves the prefixes a[0..i) and b[0..j).',
    complexity: 'O(n × m) (LIS: O(n log n) with patience sorting).',
    visualization: 'dp',
    examples: ['d30-A', 'd30-B'],
    mistakes: ['Confusing subsequence with substring'],
    related: ['dp-2d'],
  }),
  P({
    id: 'interval-dp',
    name: 'Interval DP (introduction)',
    family: 'Dynamic Programming',
    summary: 'dp[l][r] solves the subarray l..r by trying every split point or by peeling ends; fill by increasing length.',
    cues: ['"burst balloons", "matrix chain", "palindrome partitioning", "merge stones"'],
    useWhen: ['The answer for a range combines answers of smaller ranges'],
    avoidWhen: ['n > ~500 with O(n³) transitions'],
    invariant: 'All shorter intervals are solved before any longer one.',
    complexity: 'Typically O(n³) (O(n²) states × O(n) splits).',
    visualization: 'dp',
    intro: true,
    examples: [],
    cpp: cpp`
// Longest palindromic subsequence: dp[l][r] for s[l..r].
int lps(const string& s) {
    int n = s.size();
    vector<vector<int>> dp(n, vector<int>(n, 0));
    for (int len = 1; len <= n; len++)
        for (int l = 0; l + len - 1 < n; l++) {
            int r = l + len - 1;
            if (len == 1) dp[l][r] = 1;
            else if (s[l] == s[r]) dp[l][r] = 2 + (len > 2 ? dp[l + 1][r - 1] : 0);
            else dp[l][r] = max(dp[l + 1][r], dp[l][r - 1]);
        }
    return n ? dp[0][n - 1] : 0;
}`,
    mistakes: ['Filling by l then r instead of by length'],
    related: ['dp-2d', 'divide-and-conquer'],
  }),
  P({
    id: 'state-space-dp',
    name: 'State-space DP',
    family: 'Dynamic Programming',
    summary: 'Add whatever extra information the future depends on (holding a stock? last colour? cooldown?) as dimensions of the state.',
    cues: ['"with cooldown", "at most k transactions", "no two adjacent of the same colour"'],
    useWhen: ['A plain dp[i] is not enough to make the next decision'],
    avoidWhen: ['The extra dimension explodes the state count'],
    invariant: 'The state captures everything the remaining decisions depend on (Markov property).',
    complexity: 'O(#states × transitions).',
    visualization: 'dp',
    examples: ['d37-A', 'd37-B'],
    mistakes: ['Forgetting a state variable, making the DP wrong in subtle cases'],
    related: ['bitmask-dp', 'state-space-modeling'],
  }),
  P({
    id: 'bitmask-dp',
    name: 'Bitmask DP (introduction)',
    family: 'Dynamic Programming',
    summary: 'Represent "which items have been used" as bits of an integer; dp[mask][last] over all subsets.',
    cues: ['n ≤ 20 and order/visiting all items matters', 'Travelling salesman, assignment problems'],
    useWhen: ['2ⁿ × n states fits in time/memory'],
    avoidWhen: ['n > ~20'],
    invariant: 'dp[mask][j] = best cost to visit exactly the set mask, ending at j.',
    complexity: 'O(2ⁿ × n²).',
    visualization: 'dp',
    intro: true,
    examples: ['d37-A'],
    mistakes: ['Operator precedence: write (mask >> j) & 1 with parentheses', '1 << n overflow for n ≥ 31 (use 1LL)'],
    related: ['bitmask-state', 'state-space-dp'],
  }),

  // ------------------------------------------------------------ Greedy & Optimization
  P({
    id: 'interval-scheduling',
    name: 'Interval scheduling',
    family: 'Greedy & Optimization',
    summary: 'To fit the most non-overlapping intervals, always take the one that finishes first.',
    cues: ['"maximum number of meetings/events"', '"minimum intervals to remove to avoid overlap"'],
    useWhen: ['All intervals have equal value'],
    avoidWhen: ['Intervals have weights (weighted interval scheduling needs DP)'],
    invariant: 'Greedy\'s k-th chosen interval ends no later than the k-th interval of any optimal schedule.',
    complexity: 'O(n log n).',
    visualization: 'greedy',
    examples: ['d31-A'],
    mistakes: ['Sorting by start time', 'Sorting by duration'],
    related: ['activity-selection', 'interval-sorting'],
  }),
  P({
    id: 'activity-selection',
    name: 'Activity selection & exchange arguments',
    family: 'Greedy & Optimization',
    summary: 'Prove a greedy choice is safe by showing any optimal solution can be transformed to include it without getting worse.',
    cues: ['"maximum number", "minimum cost" with a natural ordering', 'Local choice seems obviously good — verify!'],
    useWhen: ['An exchange argument holds'],
    avoidWhen: ['A small counterexample breaks it (then use DP)'],
    invariant: 'After each choice there is still an optimal solution consistent with all choices so far.',
    complexity: 'Usually dominated by sorting: O(n log n).',
    visualization: 'greedy',
    examples: ['d31-A', 'd31-B'],
    mistakes: ['Trusting a greedy rule without testing small counterexamples'],
    related: ['interval-scheduling', 'heap-greedy'],
  }),
  P({
    id: 'heap-greedy',
    name: 'Heap-based greedy selection',
    family: 'Greedy & Optimization',
    summary: 'Keep candidates in a priority queue and repeatedly take the currently best one (cheapest, earliest ending, largest).',
    cues: ['"minimum meeting rooms"', '"connect ropes with minimum cost"', 'Task scheduling with priorities'],
    useWhen: ['The best candidate changes as you go'],
    avoidWhen: ['A single sort suffices'],
    invariant: 'The heap holds exactly the currently available candidates.',
    complexity: 'O(n log n).',
    visualization: 'heap',
    examples: ['d20-B', 'd15-B'],
    mistakes: ['std::priority_queue is a max-heap by default'],
    related: ['top-k', 'activity-selection', 'minimum-spanning-tree'],
  }),
  P({
    id: 'sweep-line',
    name: 'Sweep line',
    family: 'Greedy & Optimization',
    summary: 'Turn intervals into +1/−1 events, sort by time, and sweep while maintaining the active count.',
    cues: ['"maximum overlap", "minimum platforms", "skyline"'],
    useWhen: ['Only event order matters'],
    avoidWhen: ['Coordinates are small — a difference array is simpler'],
    invariant: 'After processing all events at time ≤ t, active = number of intervals covering t.',
    complexity: 'O(n log n).',
    visualization: 'greedy',
    examples: ['d34-A'],
    mistakes: ['Tie-breaking: process ends before starts when intervals are half-open'],
    related: ['difference-array', 'interval-sorting'],
  }),
  P({
    id: 'two-heaps',
    name: 'Two heaps',
    family: 'Greedy & Optimization',
    summary: 'A max-heap for the lower half and a min-heap for the upper half keep the median available in O(1).',
    cues: ['"running median"', '"balance two halves of a stream"'],
    useWhen: ['Order statistics around the middle on a stream'],
    avoidWhen: ['Arbitrary k-th order statistics (order-statistic tree)'],
    invariant: 'Every value in low ≤ every value in high; sizes differ by at most 1.',
    complexity: 'O(log n) per insertion, O(1) median.',
    visualization: 'heap',
    examples: ['d33-B'],
    mistakes: ['Forgetting to rebalance after each insertion'],
    related: ['streaming', 'top-k'],
  }),
  P({
    id: 'top-k',
    name: 'Top-K selection',
    family: 'Greedy & Optimization',
    summary: 'Keep a min-heap of size k: its top is the k-th largest; anything smaller is discarded.',
    cues: ['"k largest / most frequent / closest"'],
    useWhen: ['k ≪ n, or data streams in'],
    avoidWhen: ['k ≈ n (just sort)'],
    invariant: 'The heap contains the k largest values seen so far.',
    complexity: 'O(n log k) time, O(k) space.',
    visualization: 'heap',
    examples: ['d15-A', 'd38-B'],
    mistakes: ['Using a max-heap of all n items (O(n log n), O(n) memory)'],
    related: ['quickselect', 'heap-greedy', 'two-heaps'],
  }),
  P({
    id: 'streaming',
    name: 'Streaming / online processing',
    family: 'Greedy & Optimization',
    summary: 'Answer queries as data arrives, keeping only a compact summary (heap, counts, running stats).',
    cues: ['"data stream", "after each insertion report …"'],
    useWhen: ['You cannot store or re-scan everything'],
    avoidWhen: ['All data is available up front and simpler offline methods exist'],
    invariant: 'The summary is sufficient to answer the query for the prefix seen so far.',
    complexity: 'Per-element update cost, typically O(1) or O(log n).',
    visualization: 'heap',
    examples: ['d33-B'],
    mistakes: ['Recomputing from scratch on every query'],
    related: ['two-heaps', 'running-aggregate'],
  }),

  // ------------------------------------------------------------ Bit Manipulation
  P({
    id: 'xor-properties',
    name: 'XOR properties',
    family: 'Bit Manipulation',
    summary: 'x ^ x = 0 and x ^ 0 = x, and XOR is associative/commutative — pairs cancel out.',
    cues: ['"every element appears twice except one"', '"missing number"', 'Swap without temp'],
    useWhen: ['Paired cancellation'],
    avoidWhen: ['Elements appear three times (needs bit counting)'],
    invariant: 'acc = XOR of all processed elements; paired values contribute 0.',
    complexity: 'O(n) time, O(1) space.',
    examples: ['d14-A'],
    mistakes: ['Operator precedence: x ^ y == 0 parses as x ^ (y == 0)'],
    related: ['bit-masks'],
  }),
  P({
    id: 'bit-masks',
    name: 'Bit masks',
    family: 'Bit Manipulation',
    summary: 'Use the bits of an integer as a compact set of booleans.',
    cues: ['Small set of flags (≤ 64)', '"which letters appear in a word"'],
    useWhen: ['Fast set operations: & intersection, | union'],
    avoidWhen: ['More than 64 flags (use bitset<N>)'],
    invariant: 'Bit i is 1 iff element i is in the set.',
    complexity: 'O(1) per operation on machine words.',
    examples: ['d14-A', 'd14-B'],
    mistakes: ['1 << 40 overflows int — use 1LL << 40'],
    related: ['bit-ops', 'subset-enumeration', 'bitmask-state'],
  }),
  P({
    id: 'bit-ops',
    name: 'Set / clear / toggle / test bits',
    family: 'Bit Manipulation',
    summary: 'mask | (1 << i) sets, mask & ~(1 << i) clears, mask ^ (1 << i) toggles, (mask >> i) & 1 tests; x & (x − 1) drops the lowest set bit.',
    cues: ['"count set bits"', '"power of two"', '"lowest set bit"'],
    useWhen: ['Bit-level reasoning'],
    avoidWhen: ['Readability matters more than speed (use bool arrays)'],
    invariant: 'Each operation changes only bit i (or the lowest set bit).',
    complexity: 'O(1); popcount in O(number of set bits) with Kernighan\'s trick.',
    examples: ['d14-A'],
    mistakes: ['Shifting negative numbers', 'Forgetting parentheses around shifts'],
    related: ['bit-masks'],
  }),
  P({
    id: 'subset-enumeration',
    name: 'Subset enumeration with bitmasks',
    family: 'Bit Manipulation',
    summary: 'Loop mask from 0 to 2ⁿ − 1; bit i of mask says whether item i is in the subset.',
    cues: ['n ≤ 20, try every subset'],
    useWhen: ['Iterative alternative to recursive subsets'],
    avoidWhen: ['n > ~22'],
    invariant: 'Each mask corresponds to exactly one subset.',
    complexity: 'O(n · 2ⁿ).',
    examples: ['d14-B'],
    mistakes: ['Iterating sub = mask; sub > 0; sub = (sub − 1) & mask misses the empty subset — handle it separately'],
    related: ['subsets', 'bit-masks'],
  }),
  P({
    id: 'bitmask-state',
    name: 'Bitmask state representation',
    family: 'Bit Manipulation',
    summary: 'Encode visited sets or on/off configurations as integers so they can index arrays or be hashed cheaply.',
    cues: ['BFS over configurations (lights, keys collected)', 'DP over subsets'],
    useWhen: ['State includes a small set'],
    avoidWhen: ['Set size exceeds ~20 for array indexing'],
    invariant: 'Two states are equal iff their masks are equal.',
    complexity: '2ⁿ possible states.',
    examples: ['d37-A'],
    mistakes: ['Mixing up "visited" mask with position'],
    related: ['bitmask-dp', 'state-space-modeling'],
  }),

  // ------------------------------------------------------------ Interview Meta-Patterns
  P({
    id: 'invariant-reasoning',
    name: 'Invariant-based reasoning',
    family: 'Interview Meta-Patterns',
    summary: 'State what is always true at the top of every loop iteration; use it to justify correctness and find bugs.',
    cues: ['Any loop with pointers/boundaries', 'You keep getting off-by-one errors'],
    useWhen: ['Always — especially binary search and two pointers'],
    avoidWhen: ['—'],
    invariant: 'Initialisation makes it true, each iteration preserves it, termination + invariant ⇒ answer.',
    complexity: 'n/a',
    examples: ['d04-A', 'd07-B'],
    mistakes: ['Writing code first and the invariant never'],
    related: ['binary-search', 'two-pointers-opposite'],
  }),
  P({
    id: 'monotonicity-detection',
    name: 'Monotonicity detection',
    family: 'Interview Meta-Patterns',
    summary: 'Ask "if x works, does x + 1 also work?" — monotone answers unlock binary search, two pointers and sliding windows.',
    cues: ['"minimum value such that", "at most", non-negative numbers'],
    useWhen: ['You suspect an O(n²) scan can become O(n log n) or O(n)'],
    avoidWhen: ['A counterexample shows non-monotone behaviour'],
    invariant: 'feasible(x) ⇒ feasible(x + 1) (or the reverse).',
    complexity: 'n/a',
    examples: ['d08-A', 'd05-B'],
    mistakes: ['Assuming monotonicity with negative numbers'],
    related: ['binary-search-answer', 'sliding-window-variable'],
  }),
  P({
    id: 'state-space-modeling',
    name: 'State-space modeling',
    family: 'Interview Meta-Patterns',
    summary: 'Define the state (what you need to know), the moves between states and the goal — then pick BFS, Dijkstra or DP to search it.',
    cues: ['Puzzles, locks, word ladders', '"minimum operations to transform A into B"'],
    useWhen: ['The problem is about reaching a configuration'],
    avoidWhen: ['The state space is astronomically large without structure'],
    invariant: 'Each state is processed once with its best known cost.',
    complexity: 'O(states × moves).',
    examples: ['d37-A', 'd36-A'],
    mistakes: ['Encoding states inconsistently so duplicates are not detected'],
    related: ['graph-bfs', 'state-space-dp', 'bitmask-state'],
  }),
  P({
    id: 'algorithm-selection',
    name: 'Choosing BFS vs DFS vs Dijkstra vs DP',
    family: 'Interview Meta-Patterns',
    summary: 'Equal weights → BFS. Non-negative weights → Dijkstra. 0/1 weights → 0-1 BFS. Acyclic dependencies → DP/topological order. Reachability or enumeration → DFS.',
    cues: ['"shortest", "minimum cost", "number of ways", "is it reachable"'],
    useWhen: ['Before writing any graph/DP code'],
    avoidWhen: ['—'],
    invariant: 'The chosen algorithm\'s assumptions (weights, acyclicity) hold for the input.',
    complexity: 'BFS/DFS O(V + E), Dijkstra O(E log V), DP O(states × transitions).',
    visualization: 'grid-paths',
    examples: ['d25-B', 'd36-A'],
    mistakes: ['BFS on weighted graphs', 'DP on graphs with cycles'],
    related: ['graph-bfs', 'dijkstra', 'tabulation'],
  }),
  P({
    id: 'brute-to-optimal',
    name: 'From brute force to optimal',
    family: 'Interview Meta-Patterns',
    summary: 'Write the brute force, identify the repeated work, and remove it with a data structure (hash, heap), precomputation (prefix), or caching (DP).',
    cues: ['Nested loops recomputing the same thing', 'Exponential recursion with repeated arguments'],
    useWhen: ['Always as an interview narrative'],
    avoidWhen: ['—'],
    invariant: 'The optimised version computes exactly what the brute force computes.',
    complexity: 'Typically O(n²) → O(n) or O(2ⁿ) → O(n²).',
    examples: ['d01-B', 'd26-A'],
    mistakes: ['Optimising before having a correct baseline to test against'],
    related: ['hash-lookup', 'prefix-sum', 'memoization'],
  }),
  P({
    id: 'amortized-analysis',
    name: 'Amortised complexity reasoning',
    family: 'Interview Meta-Patterns',
    summary: 'Count total work across the whole run: a nested while loop is still O(n) overall if each element is pushed and popped once.',
    cues: ['Monotonic stacks/queues', 'Sliding windows', 'vector::push_back doubling'],
    useWhen: ['A single step can be expensive but such steps are rare'],
    avoidWhen: ['Hard real-time per-operation bounds are required'],
    invariant: 'Total pops ≤ total pushes ≤ n.',
    complexity: 'Total O(n) even with inner loops.',
    examples: ['d10-A', 'd05-B'],
    mistakes: ['Declaring a monotonic stack O(n²) because of the inner while'],
    related: ['monotonic-stack-decreasing', 'sliding-window-variable'],
  }),
];

export const PATTERN_BY_ID: Record<string, Pattern> = Object.fromEntries(PATTERNS.map((p) => [p.id, p]));

export const PATTERN_FAMILIES = [...new Set(PATTERNS.map((p) => p.family))];
