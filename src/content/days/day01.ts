import type { DayModule } from '../../types/content';
import { cpp } from '../cpp';
import { TRACE_CODE } from '../traceCode';

const day: DayModule = {
  day: {
    day: 1,
    title: 'Big-O, Arrays and Strings',
    zone: 'foundations',
    objectives: [
      'Estimate time and space complexity by counting how work grows with n',
      'Use input constraints to decide which complexities are fast enough',
      'Traverse arrays and strings safely with correct index bounds',
      'Maintain running aggregates (sum, max, min) in a single pass',
    ],
    prerequisites: ['Basic C++ syntax: variables, loops, functions', 'std::vector and std::string basics'],
    lesson: [
      {
        heading: 'Why count operations instead of seconds?',
        body: 'Seconds depend on the machine, compiler and load. Counting how the **number of basic operations** grows with the input size n is portable. Big-O keeps only the dominant term and drops constants: 3n² + 10n + 7 is O(n²) because for large n the n² term dominates.',
      },
      {
        heading: 'Reading constraints like an interviewer',
        body: 'A judge or interviewer typically allows ~10⁸ simple operations per second. Use constraints to pick a target:\n- n ≤ 20 → O(2ⁿ) or O(n!) may be fine\n- n ≤ 2 000 → O(n²) is fine\n- n ≤ 2·10⁵ → aim for O(n log n) or O(n)\n- n ≤ 10⁹ → you need O(log n) or O(1) (math, binary search)',
      },
      {
        heading: 'Space complexity',
        body: '**Auxiliary space** is the extra memory beyond the input. A loop with a few variables is O(1); copying the array is O(n); a recursion of depth d uses O(d) stack. Interviewers usually mean auxiliary space unless they say otherwise.',
      },
      {
        heading: 'Arrays and strings in C++',
        body: '`vector<int>` stores elements contiguously, so `a[i]` is O(1). `a.size()` returns an **unsigned** `size_t`; writing `for (int i = 0; i < (int)a.size(); i++)` avoids signed/unsigned surprises, especially with `a.size() - 1` on an empty vector (it wraps to a huge number). `string` behaves like a `vector<char>`.',
      },
      {
        heading: 'Running aggregates',
        body: 'Many "scan" problems only need a small summary of what came before: the sum so far, the best value so far, the minimum so far. Updating a summary in O(1) per element turns an O(n²) "recompute for every i" into O(n). Initialise carefully: the max of an array with negative numbers is **not** 0 — start from `a[0]` or `INT_MIN`.',
      },
    ],
    recognition: [
      'Does the answer only need a summary of the prefix (sum, max, count)? → one pass with a running aggregate.',
      'What is n? Use it to choose an acceptable complexity before designing the algorithm.',
      'Are you recomputing the same thing inside a nested loop? That repeated work is your optimisation target.',
    ],
    patterns: ['running-aggregate', 'brute-to-optimal', 'in-place-transform', 'suffix-sum'],
    visualizations: ['complexity', 'prefix-sum'],
    exampleA: {
      id: 'd01-A',
      title: 'Sum and maximum in one pass',
      goal: 'Compute the total and the first index of the maximum value of an array in a single traversal.',
      input: 'a = {4, -2, 7, 7, 1}',
      output: 'sum = 17\nmax = 7 at index 2',
      idea: 'Keep two running aggregates. The sum absorbs every element; the maximum only changes when a strictly larger value appears, so the first occurrence wins ties.',
      code: TRACE_CODE['running-sum'],
      keyLines: [
        { match: 'long long sum = 0;', note: '`long long` because the sum of many large ints can exceed 2³¹ − 1.' },
        { match: 'int best = a[0]', note: 'Initialise from a real element, not 0 — every value might be negative.' },
        { match: 'sum += a[i];', note: 'Running sum: after this line, sum = a[0] + … + a[i].' },
        { match: 'if (a[i] > best)', note: 'Strict > keeps the first index on ties; >= would report the last one.' },
      ],
      complexity: { time: 'O(n)', space: 'O(1)', why: 'One loop over n elements doing constant work each; only three scalar variables are stored.' },
      edgeCases: ['Single element: the loop still runs once and best = a[0]', 'All negative values: initialising best with 0 would be wrong', 'Empty array: a[0] is undefined behaviour — check a.empty() first in real code'],
      mistakes: ['Starting best at 0', 'Using int for the sum of up to 10⁵ values of size 10⁹'],
      tryIt: 'Modify the program to also print the minimum value and how many times the maximum occurs.',
      trace: { id: 'running-sum', input: { a: [4, -2, 7, 7, 1] } },
      bug: {
        find: 'if (a[i] > best) {',
        replace: 'if (a[i] >= best) {',
        symptom: 'The program prints "max = 7 at index 3" instead of index 2.',
        explanation: 'With >= the maximum is replaced by later equal values, so the last occurrence wins. The task asks for the first occurrence, which needs a strict comparison.',
      },
    },
    exampleB: {
      id: 'd01-B',
      kind: 'brute-vs-optimized',
      title: 'Duplicate check: O(n²) brute force vs O(n log n) sorting',
      goal: 'Decide whether an array contains any repeated value, comparing two approaches.',
      input: 'a = {7, 3, 9, 1, 3}, b = {5, 1, 4}',
      output: 'a brute=true sorted=true\nb brute=false sorted=false',
      idea: 'Brute force compares every pair (n(n−1)/2 comparisons). Sorting first puts equal values next to each other, so one linear scan of neighbours is enough.',
      code: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

// Brute force: compare every pair. O(n^2) time, O(1) extra space.
bool hasDuplicateBrute(const vector<int>& a) {
    int n = a.size();
    for (int i = 0; i < n; i++)
        for (int j = i + 1; j < n; j++)
            if (a[i] == a[j]) return true;
    return false;
}

// Sort a copy: equal values become neighbours. O(n log n) time, O(n) space for the copy.
bool hasDuplicateSorted(vector<int> a) {
    sort(a.begin(), a.end());
    for (int i = 1; i < (int)a.size(); i++)
        if (a[i] == a[i - 1]) return true;
    return false;
}

int main() {
    vector<int> a = {7, 3, 9, 1, 3};
    vector<int> b = {5, 1, 4};
    cout << boolalpha;
    cout << "a brute=" << hasDuplicateBrute(a) << " sorted=" << hasDuplicateSorted(a) << "\n";
    cout << "b brute=" << hasDuplicateBrute(b) << " sorted=" << hasDuplicateSorted(b) << "\n";
    return 0;
}`,
      keyLines: [
        { match: 'for (int j = i + 1; j < n; j++)', note: 'j starts at i + 1 so each unordered pair is compared once and an element is never compared with itself.' },
        { match: 'bool hasDuplicateSorted(vector<int> a)', note: 'Taking the vector by value makes a copy, so sorting does not modify the caller\'s data.' },
        { match: 'if (a[i] == a[i - 1]) return true;', note: 'After sorting, any duplicate must have an equal neighbour.' },
        { match: 'cout << boolalpha;', note: 'Prints bool values as true/false instead of 1/0.' },
      ],
      dryRun: {
        columns: ['step', 'sorted a', 'i', 'a[i−1]', 'a[i]', 'equal?'],
        rows: [
          ['sort', '1 3 3 7 9', '—', '—', '—', '—'],
          ['scan', '1 3 3 7 9', '1', '1', '3', 'no'],
          ['scan', '1 3 3 7 9', '2', '3', '3', 'yes → return true'],
        ],
      },
      complexity: { time: 'Brute O(n²); sorted O(n log n)', space: 'Brute O(1); sorted O(n) for the copy', why: 'Brute: the inner loop runs n−1, n−2, …, 1 times → n(n−1)/2. Sorted: std::sort is O(n log n) and the neighbour scan is O(n).' },
      edgeCases: ['Empty array or one element: no duplicate, both loops do nothing', 'All equal values: both return true almost immediately'],
      mistakes: ['Starting j at 0 (compares an element with itself)', 'Sorting the caller\'s array when it must stay unchanged'],
      tryIt: 'For n = 10⁵, estimate the number of comparisons of each version. Then write a third version using unordered_set (Day 2) and state its complexity.',
    },
    complexityNotes: 'Today\'s examples are O(n) and O(n log n) one-pass algorithms. Tie every bound to the code: one loop over n items is O(n); two nested loops over the same range are O(n²); a sort costs O(n log n).',
    quiz: [
      {
        prompt: 'An algorithm performs 4n² + 100n log n + 5 operations. What is its Big-O time complexity?',
        options: ['O(n log n)', 'O(n²)', 'O(4n²)', 'O(n² + n log n)'],
        answer: 1,
        explanation: 'Keep only the dominant term and drop constants: n² grows faster than n log n.',
      },
      {
        prompt: 'n ≤ 2·10⁵. Which complexity is the safest target?',
        options: ['O(n²)', 'O(2ⁿ)', 'O(n log n)', 'O(n³)'],
        answer: 2,
        explanation: 'n² = 4·10¹⁰ operations is far too many; n log n ≈ 3.5·10⁶ is comfortable.',
      },
      {
        prompt: 'What is wrong with `for (size_t i = 0; i <= a.size() - 1; i++)` when a is empty?',
        options: ['Nothing, the loop does not run', 'a.size() - 1 wraps around to a huge unsigned value, so the loop reads out of bounds', 'It is O(n²)', 'It skips the last element'],
        answer: 1,
        explanation: 'size_t is unsigned: 0 − 1 becomes 2⁶⁴ − 1. Use i < a.size() or cast to int.',
      },
    ],
    optimize: {
      prompt: 'The brute-force duplicate check compares every pair. What repeated work does the sorting version eliminate?',
      options: [
        'It removes the need to read every element',
        'Comparisons between values that cannot be equal: after sorting, only neighbours can be duplicates',
        'It avoids allocating memory',
        'It makes the comparison operator faster',
      ],
      answer: 1,
      explanation: 'Sorting groups equal values together, so instead of comparing each element with all others we compare it only with its neighbour.',
    },
    recap: 'Big-O measures growth, constraints tell you the target complexity, and a running aggregate replaces repeated rescans with O(1) updates.',
    nextPrep: 'Tomorrow uses hash maps to make "have I seen this before?" an O(1) question. Review how unordered_map insert and find work.',
  },
  questions: [
    {
      id: 'd01-max-count',
      day: 1,
      title: 'Peak Reading Count',
      difficulty: 'Easy',
      topic: 'foundations',
      patterns: ['running-aggregate'],
      objective: 'Maintain two related aggregates in one pass.',
      statement: 'A sensor records n integer readings. Report the highest reading and how many times it occurs.',
      constraints: ['1 ≤ n ≤ 10⁵', '−10⁹ ≤ reading ≤ 10⁹'],
      examples: [{ input: 'readings = [3, 9, 2, 9, 9]', output: '9 3', explanation: '9 is the maximum and appears three times.' }],
      edgeCases: ['All readings negative', 'Single reading', 'Every reading equal'],
      cues: ['Only the maximum and its count are needed — no sorting required'],
      hints: ['You can track the current maximum while scanning.', 'What should happen to the count when a strictly larger value appears?', 'Reset count to 1 on a new maximum; increment it on a tie.'],
      brute: 'Find the maximum in one pass, then count it in a second pass — still O(n), but two passes.',
      approach: 'Scan once. If x > best, set best = x and count = 1; else if x == best, increment count.',
      correctness: 'After processing i readings, best is the maximum of those readings and count is how many of them equal best: a larger value invalidates all previous occurrences, an equal one adds to them.',
      complexity: { time: 'O(n)', space: 'O(1)', why: 'Each reading triggers at most two comparisons.' },
      cpp: cpp`
#include <iostream>
#include <vector>
using namespace std;

pair<long long, int> peakCount(const vector<long long>& r) {
    long long best = r[0];
    int count = 0;
    for (long long x : r) {
        if (x > best) {
            best = x;
            count = 1;
        } else if (x == best) {
            count++;
        }
    }
    return {best, count};
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<long long> r(n);
    for (auto& x : r) cin >> x;
    auto [best, count] = peakCount(r);
    cout << best << " " << count << "\n";
    return 0;
}`,
      io: 'Input: n, then n readings. Output: the maximum and its count separated by a space.',
      keyLines: [
        { match: 'long long best = r[0];', note: 'Start from a real reading so all-negative inputs work.' },
        { match: 'int count = 0;', note: 'count starts at 0 because the loop also visits r[0] and counts it as a tie.' },
        { match: 'count = 1;', note: 'A strictly larger value starts a fresh count.' },
      ],
      mistakes: ['Initialising best = 0', 'Starting count at 1 and also counting r[0] in the loop (double count)'],
      tests: [
        { in: '5\n3 9 2 9 9', out: '9 3' },
        { in: '1\n-5', out: '-5 1' },
        { in: '4\n-3 -1 -1 -7', out: '-1 2' },
        { in: '3\n1000000000 1000000000 1000000000', out: '1000000000 3' },
      ],
      viz: 'prefix-sum',
      related: ['d01-second-largest'],
    },
    {
      id: 'd01-second-largest',
      day: 1,
      title: 'Runner-up Score',
      difficulty: 'Easy',
      topic: 'foundations',
      patterns: ['running-aggregate'],
      objective: 'Track the top two distinct values with careful tie handling.',
      statement: 'Given n scores, print the second largest distinct score, or -1 if all scores are equal.',
      constraints: ['1 ≤ n ≤ 10⁵', '0 ≤ score ≤ 10⁹'],
      examples: [{ input: 'scores = [5, 8, 8, 3]', output: '5', explanation: 'Distinct values are {3, 5, 8}; the runner-up is 5.' }],
      edgeCases: ['All scores equal → -1', 'The maximum appears several times', 'n = 1'],
      cues: ['"second largest" → keep first and second in one pass instead of sorting'],
      hints: ['Keep two variables: first and second.', 'When x beats first, the old first becomes second.', 'Ignore x if it equals first — the runner-up must be distinct.'],
      brute: 'Sort descending and walk until a value differs from the first: O(n log n).',
      approach: 'Maintain first > second (second = -1 initially). For each x: if x > first, second = first and first = x; else if x < first and x > second, second = x.',
      correctness: 'Invariant: first is the largest value seen and second is the largest value strictly smaller than first (or -1). Each branch preserves it.',
      complexity: { time: 'O(n)', space: 'O(1)', why: 'Constant work per score.' },
      cpp: cpp`
#include <iostream>
#include <vector>
using namespace std;

long long runnerUp(const vector<long long>& a) {
    long long first = -1, second = -1;  // scores are non-negative
    for (long long x : a) {
        if (x > first) {
            second = first;
            first = x;
        } else if (x < first && x > second) {
            second = x;
        }
    }
    return second;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<long long> a(n);
    for (auto& x : a) cin >> x;
    cout << runnerUp(a) << "\n";
    return 0;
}`,
      io: 'Input: n, then n scores. Output: the second largest distinct score or -1.',
      keyLines: [
        { match: 'second = first;', note: 'The previous champion becomes the runner-up before being replaced.' },
        { match: 'x < first && x > second', note: 'x < first excludes duplicates of the maximum.' },
      ],
      mistakes: ['Updating first before saving it into second', 'Allowing x == first to become second'],
      tests: [
        { in: '4\n5 8 8 3', out: '5' },
        { in: '3\n7 7 7', out: '-1' },
        { in: '1\n4', out: '-1' },
        { in: '5\n1 2 3 4 5', out: '4' },
      ],
      related: ['d01-max-count'],
    },
    {
      id: 'd01-missing-number',
      day: 1,
      title: 'The Missing Ticket',
      difficulty: 'Easy',
      topic: 'foundations',
      patterns: ['running-aggregate', 'xor-properties'],
      objective: 'Use arithmetic invariants and avoid overflow.',
      statement: 'Tickets numbered 0..n were issued, but you received only n distinct tickets. Print the missing number.',
      constraints: ['1 ≤ n ≤ 10⁶', 'All received numbers are distinct and in [0, n]'],
      examples: [{ input: 'n = 3, tickets = [3, 0, 1]', output: '2' }],
      edgeCases: ['Missing 0', 'Missing n', 'n large enough that n(n+1)/2 overflows int'],
      cues: ['Exactly one value from a known range is missing → compare an expected total to the actual total'],
      hints: ['What is the sum 0 + 1 + … + n?', 'Subtract the sum of the received tickets.', 'Use long long: n(n+1)/2 exceeds 2³¹ for n ≈ 65 536.'],
      brute: 'For each candidate 0..n, scan to see if it is present: O(n²).',
      approach: 'expected = n(n+1)/2 computed in 64-bit; answer = expected − sum(received).',
      correctness: 'The received tickets are exactly {0..n} minus one value m, so their sum is expected − m.',
      complexity: { time: 'O(n)', space: 'O(1)', why: 'One pass to add the inputs.' },
      cpp: cpp`
#include <iostream>
using namespace std;

long long missingFromSum(long long n, long long receivedSum) {
    long long expected = n * (n + 1) / 2;
    return expected - receivedSum;
}`,
      main: cpp`
int main() {
    long long n;
    cin >> n;
    long long sum = 0;
    for (long long i = 0; i < n; i++) {
        long long x;
        cin >> x;
        sum += x;
    }
    cout << missingFromSum(n, sum) << "\n";
    return 0;
}`,
      io: 'Input: n, then n distinct ticket numbers. Output: the missing number.',
      keyLines: [{ match: 'long long expected = n * (n + 1) / 2;', note: 'n is long long, so the multiplication is done in 64 bits — no overflow for n ≤ 10⁶.' }],
      mistakes: ['Computing n * (n + 1) in int', 'Using the formula for 1..n instead of 0..n'],
      tests: [
        { in: '3\n3 0 1', out: '2' },
        { in: '1\n1', out: '0' },
        { in: '1\n0', out: '1' },
        { in: '5\n0 1 2 3 4', out: '5' },
      ],
    },
    {
      id: 'd01-longest-run',
      day: 1,
      title: 'Longest Repeat Streak',
      difficulty: 'Easy',
      topic: 'foundations',
      patterns: ['running-aggregate'],
      objective: 'Track the current run and the best run while scanning a string.',
      statement: 'Given a non-empty lowercase string, print the length of the longest block of identical consecutive characters and that character (first such block on ties).',
      constraints: ['1 ≤ |s| ≤ 10⁵'],
      examples: [{ input: 's = "aabbbcbb"', output: '3 b' }],
      edgeCases: ['Single character', 'All characters equal', 'Two blocks of equal length (report the first)'],
      cues: ['"consecutive" + "longest" → current run length vs best run length'],
      hints: ['Compare s[i] with s[i − 1].', 'If equal, the current run grows; otherwise it restarts at 1.', 'Update the best only when the current run is strictly longer.'],
      approach: 'run = 1; for i ≥ 1: run = (s[i] == s[i−1]) ? run + 1 : 1; if run > best, record best and s[i].',
      correctness: 'run always equals the length of the block ending at i; best is the maximum over all prefixes.',
      complexity: { time: 'O(n)', space: 'O(1)', why: 'Single pass with two counters.' },
      cpp: cpp`
#include <iostream>
#include <string>
using namespace std;

pair<int, char> longestRun(const string& s) {
    int best = 1, run = 1;
    char bestChar = s[0];
    for (int i = 1; i < (int)s.size(); i++) {
        run = (s[i] == s[i - 1]) ? run + 1 : 1;
        if (run > best) {
            best = run;
            bestChar = s[i];
        }
    }
    return {best, bestChar};
}`,
      main: cpp`
int main() {
    string s;
    cin >> s;
    auto [len, ch] = longestRun(s);
    cout << len << " " << ch << "\n";
    return 0;
}`,
      io: 'Input: one string. Output: the run length and its character.',
      keyLines: [{ match: 'run = (s[i] == s[i - 1]) ? run + 1 : 1;', note: 'The run either extends or restarts — it never needs to look further back.' }],
      mistakes: ['Starting the loop at 0 and reading s[-1]', 'Using >= and reporting the last block on ties'],
      tests: [
        { in: 'aabbbcbb', out: '3 b' },
        { in: 'z', out: '1 z' },
        { in: 'aabb', out: '2 a' },
        { in: 'qqqqq', out: '5 q' },
      ],
    },
    {
      id: 'd01-rotate-right',
      day: 1,
      title: 'Carousel Rotation',
      difficulty: 'Medium',
      topic: 'foundations',
      patterns: ['in-place-transform'],
      objective: 'Rotate an array in place with O(1) extra space using reversals.',
      statement: 'Rotate an array of n integers to the right by k positions in place and print it.',
      constraints: ['1 ≤ n ≤ 10⁵', '0 ≤ k ≤ 10⁹'],
      examples: [{ input: 'a = [1, 2, 3, 4, 5], k = 2', output: '4 5 1 2 3' }],
      edgeCases: ['k ≥ n (use k mod n)', 'k = 0', 'n = 1'],
      cues: ['"in place", "O(1) extra space" + rotation → reversal trick'],
      hints: ['Rotating by n changes nothing, so reduce k first.', 'Where do the last k elements end up?', 'Reverse the whole array, then reverse the first k and the remaining n − k separately.'],
      brute: 'Rotate by one position k times: O(n·k), far too slow for k = 10⁹.',
      approach: 'k %= n; reverse(all); reverse(first k); reverse(rest).',
      correctness: 'Reversing the whole array moves the last k elements to the front but in reverse order; reversing each part restores the internal order of both blocks.',
      complexity: { time: 'O(n)', space: 'O(1)', why: 'Three reversals touch each element at most twice.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

void rotateRight(vector<int>& a, long long k) {
    int n = a.size();
    k %= n;
    reverse(a.begin(), a.end());
    reverse(a.begin(), a.begin() + k);
    reverse(a.begin() + k, a.end());
}`,
      main: cpp`
int main() {
    int n;
    long long k;
    cin >> n >> k;
    vector<int> a(n);
    for (auto& x : a) cin >> x;
    rotateRight(a, k);
    for (int i = 0; i < n; i++) cout << a[i] << (i + 1 < n ? " " : "\n");
    return 0;
}`,
      io: 'Input: n k, then n integers. Output: the rotated array.',
      keyLines: [
        { match: 'k %= n;', note: 'Rotating n times is the identity, so only k mod n matters.' },
        { match: 'reverse(a.begin(), a.begin() + k);', note: 'Restores the order of the block that moved to the front.' },
      ],
      mistakes: ['Forgetting k %= n (iterator past the end)', 'Reversing in the wrong order for a left rotation'],
      tests: [
        { in: '5 2\n1 2 3 4 5', out: '4 5 1 2 3' },
        { in: '3 7\n1 2 3', out: '3 1 2' },
        { in: '1 5\n9', out: '9' },
        { in: '4 0\n1 2 3 4', out: '1 2 3 4' },
      ],
    },
    {
      id: 'd01-buy-sell-once',
      day: 1,
      title: 'One Trade Profit',
      difficulty: 'Medium',
      topic: 'foundations',
      patterns: ['running-aggregate', 'brute-to-optimal'],
      objective: 'Replace a nested loop with a running minimum.',
      statement: 'prices[i] is an asset price on day i. Buy once and sell once on a later day. Print the maximum profit, or 0 if no profitable trade exists.',
      constraints: ['1 ≤ n ≤ 10⁵', '0 ≤ prices[i] ≤ 10⁴'],
      examples: [{ input: 'prices = [7, 1, 5, 3, 6, 4]', output: '5', explanation: 'Buy at 1, sell at 6.' }],
      edgeCases: ['Strictly decreasing prices → 0', 'Single day', 'Best buy appears after a local maximum'],
      cues: ['For each sell day, only the cheapest earlier price matters'],
      hints: ['Brute force tries all buy/sell pairs.', 'If you sell on day i, which buy day is best?', 'Track the minimum price seen so far.'],
      brute: 'Try every pair i < j: O(n²).',
      approach: 'minPrice = prices[0]; for each price p: best = max(best, p − minPrice); minPrice = min(minPrice, p).',
      correctness: 'For each sell day j the optimal buy is the minimum over days < j, which minPrice holds when profit is computed (it is updated afterwards).',
      complexity: { time: 'O(n)', space: 'O(1)', why: 'One pass with two variables.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int maxProfit(const vector<int>& prices) {
    int minPrice = prices[0], best = 0;
    for (int p : prices) {
        best = max(best, p - minPrice);
        minPrice = min(minPrice, p);
    }
    return best;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<int> prices(n);
    for (auto& p : prices) cin >> p;
    cout << maxProfit(prices) << "\n";
    return 0;
}`,
      io: 'Input: n, then n prices. Output: maximum profit.',
      keyLines: [
        { match: 'best = max(best, p - minPrice);', note: 'Sell today using the cheapest earlier price.' },
        { match: 'minPrice = min(minPrice, p);', note: 'Updated after computing profit so a day never buys and sells against itself in a harmful way (profit 0 at worst).' },
      ],
      mistakes: ['Returning a negative profit instead of 0', 'Using global min and max regardless of order'],
      tests: [
        { in: '6\n7 1 5 3 6 4', out: '5' },
        { in: '5\n7 6 4 3 1', out: '0' },
        { in: '1\n5', out: '0' },
        { in: '6\n3 8 1 4 2 6', out: '5' },
      ],
    },
    {
      id: 'd01-leaders',
      day: 1,
      title: 'Skyline Leaders',
      difficulty: 'Medium',
      topic: 'foundations',
      patterns: ['suffix-sum', 'running-aggregate'],
      objective: 'Scan from the right with a running maximum.',
      statement: 'A building is a leader if it is strictly taller than every building to its right. The last building is always a leader. Print all leaders from left to right.',
      constraints: ['1 ≤ n ≤ 10⁵', '1 ≤ height ≤ 10⁹'],
      examples: [{ input: 'h = [16, 17, 4, 3, 5, 2]', output: '17 5 2' }],
      edgeCases: ['Strictly increasing → only the last', 'Strictly decreasing → all', 'Equal heights (strictly taller required)'],
      cues: ['"greater than everything to its right" → right-to-left scan with a suffix maximum'],
      hints: ['Checking all buildings to the right for each i is O(n²).', 'Scan from the right and remember the tallest seen so far.', 'Collect leaders in reverse, then reverse the list.'],
      brute: 'For each i, scan i+1..n−1: O(n²).',
      approach: 'Walk i from n−1 down to 0 with maxRight = 0; if h[i] > maxRight, it is a leader; update maxRight.',
      correctness: 'maxRight is exactly the maximum of the suffix after i when i is examined.',
      complexity: { time: 'O(n)', space: 'O(1) extra (besides the output)', why: 'One backwards pass.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

vector<int> leaders(const vector<int>& h) {
    vector<int> out;
    int maxRight = 0;  // heights are >= 1
    for (int i = (int)h.size() - 1; i >= 0; i--) {
        if (h[i] > maxRight) out.push_back(h[i]);
        maxRight = max(maxRight, h[i]);
    }
    reverse(out.begin(), out.end());
    return out;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<int> h(n);
    for (auto& x : h) cin >> x;
    vector<int> out = leaders(h);
    for (int i = 0; i < (int)out.size(); i++) cout << out[i] << (i + 1 < (int)out.size() ? " " : "\n");
    return 0;
}`,
      io: 'Input: n, then n heights. Output: leaders left to right.',
      keyLines: [
        { match: 'for (int i = (int)h.size() - 1; i >= 0; i--)', note: 'Cast before subtracting so the loop variable is a signed int.' },
        { match: 'if (h[i] > maxRight)', note: 'Strictly taller than every building to the right.' },
      ],
      mistakes: ['Using size_t for a decreasing loop (never becomes negative)', 'Forgetting to reverse the collected leaders'],
      tests: [
        { in: '6\n16 17 4 3 5 2', out: '17 5 2' },
        { in: '4\n1 2 3 4', out: '4' },
        { in: '3\n5 5 5', out: '5' },
        { in: '4\n9 7 4 1', out: '9 7 4 1' },
      ],
    },
    {
      id: 'd01-trapping-rain',
      day: 1,
      title: 'Rainwater Between Walls',
      difficulty: 'Hard',
      topic: 'foundations',
      patterns: ['suffix-sum', 'running-aggregate', 'brute-to-optimal'],
      objective: 'Combine prefix and suffix maxima to compute a per-index answer.',
      statement: 'n walls of width 1 have heights h[i]. After rain, water is trapped between walls. Print the total units of trapped water.',
      constraints: ['1 ≤ n ≤ 2·10⁵', '0 ≤ h[i] ≤ 10⁵'],
      examples: [{ input: 'h = [0,1,0,2,1,0,1,3,2,1,2,1]', output: '6' }],
      edgeCases: ['Monotone heights trap nothing', 'n ≤ 2 traps nothing', 'Total can exceed 2³¹ — use long long'],
      cues: ['Water above index i depends on the tallest wall to the left and to the right'],
      hints: ['Above column i the water level is min(tallest on the left, tallest on the right).', 'Precompute leftMax[i] and rightMax[i].', 'water[i] = min(leftMax[i], rightMax[i]) − h[i].'],
      brute: 'For each i scan both sides to find the maxima: O(n²).',
      approach: 'Build leftMax with a forward pass and rightMax with a backward pass, then sum min(leftMax, rightMax) − h.',
      correctness: 'Water at i cannot rise above the lower of the two tallest boundaries, and it does rise to exactly that level because both boundaries exist.',
      complexity: { time: 'O(n)', space: 'O(n)', why: 'Three linear passes and two auxiliary arrays (reducible to O(1) with two pointers on Day 4).' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

long long trappedWater(const vector<int>& h) {
    int n = h.size();
    vector<int> leftMax(n), rightMax(n);
    for (int i = 0; i < n; i++) leftMax[i] = max(h[i], i ? leftMax[i - 1] : 0);
    for (int i = n - 1; i >= 0; i--) rightMax[i] = max(h[i], i + 1 < n ? rightMax[i + 1] : 0);
    long long total = 0;
    for (int i = 0; i < n; i++) total += min(leftMax[i], rightMax[i]) - h[i];
    return total;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<int> h(n);
    for (auto& x : h) cin >> x;
    cout << trappedWater(h) << "\n";
    return 0;
}`,
      io: 'Input: n, then n heights. Output: total trapped water.',
      keyLines: [
        { match: 'leftMax[i] = max(h[i], i ? leftMax[i - 1] : 0);', note: 'Including h[i] itself makes min(...) − h[i] never negative.' },
        { match: 'total += min(leftMax[i], rightMax[i]) - h[i];', note: 'The lower boundary decides the water level.' },
      ],
      mistakes: ['Excluding h[i] from leftMax/rightMax and getting negative water', 'Summing into int'],
      tests: [
        { in: '12\n0 1 0 2 1 0 1 3 2 1 2 1', out: '6' },
        { in: '6\n4 2 0 3 2 5', out: '9' },
        { in: '3\n1 2 3', out: '0' },
        { in: '1\n5', out: '0' },
      ],
    },
  ],
};

export default day;
