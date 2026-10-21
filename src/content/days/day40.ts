import type { DayModule } from '../../types/content';
import { cpp } from '../cpp';

const day: DayModule = {
  day: {
    day: 40,
    title: 'Final Review: Interview Simulation',
    zone: 'advanced',
    advanced: true,
    objectives: [
      'Design a data structure from two simpler ones (LRU cache)',
      'Recognise binary search on the answer combined with a linear check',
      'Practise the full interview loop: clarify, brute force, optimise, test',
      'Review the pattern map built over the previous 39 days',
    ],
    prerequisites: ['Day 6: linked lists', 'Day 8: binary search on the answer', 'Day 38: combining patterns'],
    lesson: [
      {
        heading: 'The interview loop',
        body: '1. **Clarify**: input sizes, duplicates, negative values, empty input, output format.\n2. **Brute force**: state it with its complexity — it proves you understand the problem.\n3. **Optimise**: find the repeated work and the pattern that removes it.\n4. **Code** with clear names and invariants.\n5. **Test**: walk through a small example and the edge cases out loud.',
      },
      {
        heading: 'Designing with two structures',
        body: 'An LRU cache needs O(1) lookup by key *and* O(1) "move to most recent" / "evict least recent". No single structure does both: a hash map gives lookup, a doubly linked list gives ordering. The map stores iterators into the list so each operation touches both in O(1).',
      },
      {
        heading: 'Binary search on the answer, again',
        body: '"Find the k-th smallest distance", "minimum time to finish", "maximum minimum gap": if you can answer *"is the answer ≤ x?"* quickly and that test is monotone in x, binary search x. The check is often a two-pointer or greedy pass.',
      },
      {
        heading: 'The pattern map',
        body: '- Hashing & prefix sums → lookups and subarray sums.\n- Two pointers & windows → sorted pairs and contiguous ranges.\n- Binary search → sorted data and monotone answers.\n- Stacks/queues/heaps → nearest greater, order, top-k.\n- Trees & graphs → traversal, shortest paths, MST, union-find.\n- DP → overlapping sub-problems; greedy → provable local choices.',
      },
      {
        heading: 'After this course',
        body: 'Revisit questions in the Revision Center when they come due, re-implement Example B of each day from memory, and keep a log of mistakes. Mastery comes from spaced, unassisted repetition, not from reading solutions.',
      },
    ],
    recognition: [
      '"Design a cache / data structure with O(1) operations" → combine a hash map with a list or heap.',
      '"k-th smallest of a huge implicit set" → binary search on the value with a counting check.',
      'Unfamiliar problem → write the brute force first, then ask which pattern removes its repeated work.',
    ],
    patterns: ['hash-lookup', 'binary-search-answer', 'two-pointers-same', 'algorithm-selection'],
    visualizations: ['binary-search', 'complexity'],
    exampleA: {
      id: 'd40-A',
      title: 'LRU cache with a list and a hash map',
      goal: 'Implement get and put in O(1), evicting the least recently used key when capacity is exceeded.',
      input: 'capacity 2: put(1,1) put(2,2) get(1) put(3,3) get(2) put(4,4) get(1) get(3) get(4)',
      output: 'get(1) = 1\nput(3) evicts 2\nget(2) = -1\nput(4) evicts 1\nget(1) = -1\nget(3) = 3\nget(4) = 4',
      idea: 'The list keeps keys from most to least recently used; the map points from each key to its list node. Every access splices the node to the front; eviction removes the back.',
      code: cpp`
#include <iostream>
#include <list>
#include <unordered_map>
using namespace std;

class LRUCache {
    int cap;
    list<pair<int, int>> items;  // front = most recent, (key, value)
    unordered_map<int, list<pair<int, int>>::iterator> where;

public:
    explicit LRUCache(int capacity) : cap(capacity) {}

    int get(int key) {
        auto it = where.find(key);
        if (it == where.end()) return -1;
        items.splice(items.begin(), items, it->second);  //@gap
        return it->second->second;
    }

    void put(int key, int value) {
        auto it = where.find(key);
        if (it != where.end()) {
            it->second->second = value;
            items.splice(items.begin(), items, it->second);
            return;
        }
        if ((int)items.size() == cap) {
            int old = items.back().first;  //@gap
            cout << "put(" << key << ") evicts " << old << "\n";
            where.erase(old);
            items.pop_back();
        }
        items.push_front({key, value});
        where[key] = items.begin();
    }
};

int main() {
    LRUCache c(2);
    c.put(1, 1);
    c.put(2, 2);
    cout << "get(1) = " << c.get(1) << "\n";
    c.put(3, 3);
    cout << "get(2) = " << c.get(2) << "\n";
    c.put(4, 4);
    cout << "get(1) = " << c.get(1) << "\n";
    cout << "get(3) = " << c.get(3) << "\n";
    cout << "get(4) = " << c.get(4) << "\n";
    return 0;
}`,
      keyLines: [
        { match: 'unordered_map<int, list<pair<int, int>>::iterator> where;', note: 'Map from key to its node: O(1) access into the list.' },
        { match: 'items.splice(items.begin(), items, it->second);', note: 'Move the node to the front in O(1) without invalidating iterators.' },
        { match: 'int old = items.back().first;', note: 'The back of the list is the least recently used key.' },
        { match: 'where[key] = items.begin();', note: 'Record where the new node lives.' },
      ],
      dryRun: {
        columns: ['operation', 'list (front → back)', 'note'],
        rows: [
          ['put(1,1)', '1', ''],
          ['put(2,2)', '2 1', ''],
          ['get(1)', '1 2', 'returns 1, 1 becomes most recent'],
          ['put(3,3)', '3 1', 'evicts 2'],
          ['get(2)', '3 1', 'returns −1'],
          ['put(4,4)', '4 3', 'evicts 1'],
          ['get(3), get(4)', '4 3 → 3 4 → 4 3', 'returns 3, 4'],
        ],
      },
      complexity: { time: 'O(1) average per operation', space: 'O(capacity)', why: 'Hash lookups and list splices are constant time.' },
      edgeCases: ['Updating an existing key must also refresh its recency', 'Capacity 1'],
      mistakes: ['Storing list indices instead of iterators', 'Forgetting to erase the evicted key from the map'],
      tryIt: 'Add a size() method and an LFU variant that evicts the least frequently used key.',
      bug: {
        find: 'items.splice(items.begin(), items, it->second);  //@gap',
        replace: '/* recency not updated */',
        symptom: 'The program prints "put(3) evicts 1" — key 1 was just read but is treated as least recent.',
        explanation: 'A get counts as a use. Without moving the node to the front, the list order stays in insertion order and the wrong key is evicted.',
      },
    },
    exampleB: {
      id: 'd40-B',
      kind: 'variant',
      title: 'K-th smallest pair distance (binary search + two pointers)',
      goal: 'Among all pairs i < j, find the k-th smallest |a[i] − a[j]|.',
      input: 'a = {1, 6, 1, 3}, k = 3',
      output: 'sorted: 1 1 3 6\ntry 2: pairs <= 2 = 3\ntry 1: pairs <= 1 = 1\nk-th smallest distance = 2',
      idea: 'Sort. For a candidate distance d, count pairs with distance ≤ d using a sliding left pointer. The count grows with d, so binary search the smallest d with count ≥ k.',
      code: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

long long countAtMost(const vector<int>& a, int d) {
    long long count = 0;
    int left = 0;
    for (int right = 0; right < (int)a.size(); right++) {
        while (a[right] - a[left] > d) left++;  //@gap
        count += right - left;                  //@gap
    }
    return count;
}

int main() {
    vector<int> a = {1, 6, 1, 3};
    long long k = 3;
    sort(a.begin(), a.end());
    cout << "sorted:";
    for (int x : a) cout << " " << x;
    cout << "\n";
    int lo = 0, hi = a.back() - a.front();
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        long long c = countAtMost(a, mid);
        cout << "try " << mid << ": pairs <= " << mid << " = " << c << "\n";
        if (c >= k) hi = mid;
        else lo = mid + 1;
    }
    cout << "k-th smallest distance = " << lo << "\n";
    return 0;
}`,
      keyLines: [
        { match: 'while (a[right] - a[left] > d) left++;', note: 'Sorted order: the valid partners of right form a suffix ending at right.' },
        { match: 'count += right - left;', note: 'All indices in [left, right) pair with right within distance d.' },
        { match: 'if (c >= k) hi = mid;', note: 'mid is feasible: the answer is mid or smaller.' },
      ],
      complexity: { time: 'O(n log n + n log W)', space: 'O(1) extra', why: 'Sort once; each of log W probes is a linear two-pointer pass.' },
      edgeCases: ['Many equal values (distance 0 pairs)', 'k = 1 or k = n(n−1)/2'],
      mistakes: ['Generating all n² distances', 'Returning mid instead of lo after the loop'],
      tryIt: 'Use the same check to find the median pair distance.',
    },
    complexityNotes: 'Composite designs cost the sum of their parts. Binary search on the answer multiplies the check by log(range).',
    quiz: [
      {
        prompt: 'Why does an LRU cache store list iterators in its hash map?',
        options: ['To sort keys', 'To move or erase a node in O(1) without searching the list', 'To save memory', 'Iterators are required by unordered_map'],
        answer: 1,
        explanation: 'Searching the list would be O(n).',
      },
      {
        prompt: 'Binary search on the answer requires that the check "answer ≤ x"…',
        options: ['Is O(1)', 'Is monotone in x', 'Uses recursion', 'Works on unsorted data only'],
        answer: 1,
        explanation: 'Monotonicity lets you discard half the range each time.',
      },
      {
        prompt: 'In an interview, the first thing to do after reading a problem is…',
        options: ['Write the optimal code', 'Clarify inputs and constraints', 'Pick a data structure at random', 'Ask for the solution'],
        answer: 1,
        explanation: 'Constraints decide which complexity — and which pattern — is needed.',
      },
    ],
    recap: 'Complex tasks are compositions of simple tools: hash map + list for LRU, binary search + two pointers for k-th distances. Clarify, brute force, optimise, code, test — and keep revising with spaced repetition.',
    nextPrep: 'You have finished the 40-day path. Use the Revision Center and Daily Challenge to keep your skills fresh.',
  },
  questions: [
    {
      id: 'd40-isomorphic',
      day: 40,
      title: 'Cipher Pattern Match',
      difficulty: 'Easy',
      topic: 'advanced',
      patterns: ['hash-lookup'],
      objective: 'Two-way character mapping.',
      statement: 'Two strings are isomorphic if characters of s can be replaced consistently (one-to-one) to get t. Print YES or NO.',
      constraints: ['1 ≤ |s| = |t| ≤ 5·10⁴', 'ASCII characters'],
      examples: [{ input: 'egg add', output: 'YES' }],
      edgeCases: ['Two letters mapping to the same letter → NO'],
      cues: ['Consistent one-to-one replacement'],
      hints: ['Keep maps in both directions.'],
      approach: 'Two arrays of size 256.',
      correctness: 'A bijection exists iff both directions are consistent.',
      complexity: { time: 'O(n)', space: 'O(1)', why: 'Fixed alphabet.' },
      cpp: cpp`
#include <iostream>
#include <string>
using namespace std;

bool isomorphic(const string& s, const string& t) {
    int fwd[256], bwd[256];
    for (int i = 0; i < 256; i++) fwd[i] = bwd[i] = -1;
    for (size_t i = 0; i < s.size(); i++) {
        unsigned char a = s[i], b = t[i];
        if (fwd[a] == -1 && bwd[b] == -1) {
            fwd[a] = b;
            bwd[b] = a;
        } else if (fwd[a] != b || bwd[b] != a) {
            return false;
        }
    }
    return true;
}`,
      main: cpp`
int main() {
    string s, t;
    cin >> s >> t;
    cout << (isomorphic(s, t) ? "YES" : "NO") << "\n";
    return 0;
}`,
      io: 'Input: s t. Output: YES or NO.',
      keyLines: [{ match: '} else if (fwd[a] != b || bwd[b] != a) {', note: 'Both directions must agree.' }],
      mistakes: ['Checking only s → t (badc / baba passes wrongly)'],
      tests: [
        { in: 'egg add', out: 'YES' },
        { in: 'foo bar', out: 'NO' },
        { in: 'badc baba', out: 'NO' },
        { in: 'paper title', out: 'YES' },
      ],
    },
    {
      id: 'd40-asteroids',
      day: 40,
      title: 'Colliding Comets',
      difficulty: 'Medium',
      topic: 'advanced',
      patterns: ['monotonic-stack-decreasing', 'invariant-reasoning'],
      objective: 'Stack simulation with collisions.',
      statement: 'Positive values move right, negative move left, all at the same speed. When two meet, the smaller (by absolute value) explodes; equal sizes both explode. Print the survivors in order, or "-".',
      constraints: ['1 ≤ n ≤ 10⁴', 'a[i] ≠ 0'],
      examples: [{ input: '5 10 -5', output: '5 10' }],
      edgeCases: ['All moving apart', 'Equal sizes'],
      cues: ['Collisions only between a right-mover on the stack and a new left-mover'],
      hints: ['Keep a stack of survivors; resolve a new negative against positive tops.'],
      approach: 'Stack.',
      correctness: 'The stack always holds a collision-free prefix of the result.',
      complexity: { time: 'O(n)', space: 'O(n)', why: 'Each value pushed and popped at most once.' },
      cpp: cpp`
#include <cstdlib>
#include <iostream>
#include <vector>
using namespace std;

vector<int> survivors(const vector<int>& a) {
    vector<int> st;
    for (int x : a) {
        bool alive = true;
        while (alive && x < 0 && !st.empty() && st.back() > 0) {
            if (st.back() < -x) {
                st.pop_back();  // stack top explodes, keep checking
            } else {
                if (st.back() == -x) st.pop_back();  // both explode
                alive = false;
            }
        }
        if (alive) st.push_back(x);
    }
    return st;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (auto& x : a) cin >> x;
    auto res = survivors(a);
    if (res.empty()) cout << "-";
    for (size_t i = 0; i < res.size(); i++) cout << (i ? " " : "") << res[i];
    cout << "\n";
    return 0;
}`,
      io: 'Input: n, then n values. Output: survivors or "-".',
      keyLines: [{ match: 'while (alive && x < 0 && !st.empty() && st.back() > 0) {', note: 'Only a right-mover followed by a left-mover collide.' }],
      mistakes: ['Colliding a negative top with a positive newcomer (they move apart)'],
      tests: [
        { in: '3\n5 10 -5', out: '5 10' },
        { in: '2\n8 -8', out: '-' },
        { in: '3\n10 2 -5', out: '10' },
        { in: '4\n-2 -1 1 2', out: '-2 -1 1 2' },
      ],
    },
    {
      id: 'd40-palindromic-substrings',
      day: 40,
      title: 'Counting Mirror Fragments',
      difficulty: 'Medium',
      topic: 'advanced',
      patterns: ['two-pointers-opposite', 'brute-to-optimal'],
      objective: 'Expand around centres.',
      statement: 'Print the number of palindromic substrings (counted by position).',
      constraints: ['1 ≤ |s| ≤ 1000'],
      examples: [{ input: 'aaa', output: '6' }],
      edgeCases: ['Single character → 1'],
      cues: ['All palindromic substrings, n ≤ 1000 → O(n²) centres'],
      hints: ['2n − 1 centres: each character and each gap.'],
      approach: 'Expand from every centre while ends match.',
      correctness: 'Every palindrome has a unique centre and is found by expanding from it.',
      complexity: { time: 'O(n²)', space: 'O(1)', why: 'Each expansion step finds one palindrome.' },
      cpp: cpp`
#include <iostream>
#include <string>
using namespace std;

long long countPalindromes(const string& s) {
    int n = s.size();
    long long total = 0;
    for (int center = 0; center < 2 * n - 1; center++) {
        int l = center / 2, r = l + center % 2;
        while (l >= 0 && r < n && s[l] == s[r]) {
            total++;
            l--;
            r++;
        }
    }
    return total;
}`,
      main: cpp`
int main() {
    string s;
    cin >> s;
    cout << countPalindromes(s) << "\n";
    return 0;
}`,
      io: 'Input: s. Output: count.',
      keyLines: [{ match: 'int l = center / 2, r = l + center % 2;', note: 'Even centres are characters, odd centres are gaps.' }],
      mistakes: ['Checking all O(n²) substrings with an O(n) test (O(n³))'],
      tests: [
        { in: 'aaa', out: '6' },
        { in: 'abc', out: '3' },
        { in: 'abba', out: '6' },
        { in: 'a', out: '1' },
      ],
    },
    {
      id: 'd40-min-time-trips',
      day: 40,
      title: 'Fleet Trip Deadline',
      difficulty: 'Medium',
      topic: 'advanced',
      patterns: ['binary-search-answer', 'monotonicity-detection'],
      objective: 'Binary search on time with an overflow-safe check.',
      statement: 'Bus i completes a trip every time[i] minutes, independently and repeatedly. Print the minimum time T such that the total number of trips completed by time T is at least total.',
      constraints: ['1 ≤ n ≤ 10⁵', '1 ≤ time[i] ≤ 10⁷', '1 ≤ total ≤ 10⁷'],
      examples: [{ input: 'times 1 2 3, total 5', output: '3' }],
      edgeCases: ['Single bus', 'Huge answers (up to 10¹⁴)'],
      cues: ['"minimum time such that" + monotone count'],
      hints: ['trips(T) = Σ T / time[i] is non-decreasing in T.', 'Upper bound: min(time) · total.'],
      approach: 'Binary search T in [1, min · total].',
      correctness: 'Monotone predicate; the smallest feasible T is the answer.',
      complexity: { time: 'O(n log(min · total))', space: 'O(1)', why: 'Linear check per probe.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

long long minimumTime(const vector<long long>& t, long long total) {
    long long lo = 1, hi = *min_element(t.begin(), t.end()) * total;
    while (lo < hi) {
        long long mid = lo + (hi - lo) / 2, trips = 0;
        for (long long x : t) {
            trips += mid / x;
            if (trips >= total) break;  // avoid needless work and overflow
        }
        if (trips >= total) hi = mid;
        else lo = mid + 1;
    }
    return lo;
}`,
      main: cpp`
int main() {
    int n;
    long long total;
    cin >> n >> total;
    vector<long long> t(n);
    for (auto& x : t) cin >> x;
    cout << minimumTime(t, total) << "\n";
    return 0;
}`,
      io: 'Input: n total, then n trip times. Output: minimum time.',
      keyLines: [{ match: 'if (trips >= total) break;  // avoid needless work and overflow', note: 'Stop counting once enough trips are reached.' }],
      mistakes: ['int overflow in the upper bound'],
      tests: [
        { in: '3 5\n1 2 3', out: '3' },
        { in: '1 1\n2', out: '2' },
        { in: '2 10000000\n10000000 10000000', out: '50000000000000' },
        { in: '3 7\n2 3 7', out: '8' },
      ],
    },
    {
      id: 'd40-distinct-islands',
      day: 40,
      title: 'Unique Island Shapes',
      difficulty: 'Medium',
      topic: 'advanced',
      patterns: ['grid-traversal', 'hash-lookup'],
      objective: 'Canonical shape encoding with a set.',
      statement: 'Count islands (4-connected 1s) with distinct shapes. Two islands have the same shape if one can be translated (not rotated) onto the other.',
      constraints: ['1 ≤ R, C ≤ 50'],
      examples: [{ input: '11000 / 11000 / 00011 / 00011', output: '1' }],
      edgeCases: ['No land → 0'],
      cues: ['Shapes up to translation → relative coordinates'],
      hints: ['Record each cell relative to the island\'s first cell in DFS order; store the sorted list in a set.'],
      approach: 'DFS + set of normalised coordinate lists.',
      correctness: 'Relative coordinates (sorted) are identical exactly for translated copies.',
      complexity: { time: 'O(R · C log(R · C))', space: 'O(R · C)', why: 'Each cell once; sorting shapes.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <set>
#include <string>
#include <vector>
using namespace std;

vector<string> g;

void collect(int r, int c, int r0, int c0, vector<pair<int, int>>& shape) {
    if (r < 0 || r >= (int)g.size() || c < 0 || c >= (int)g[0].size() || g[r][c] != '1') return;
    g[r][c] = '0';
    shape.push_back({r - r0, c - c0});
    collect(r + 1, c, r0, c0, shape);
    collect(r - 1, c, r0, c0, shape);
    collect(r, c + 1, r0, c0, shape);
    collect(r, c - 1, r0, c0, shape);
}

int distinctIslands() {
    set<vector<pair<int, int>>> shapes;
    for (int r = 0; r < (int)g.size(); r++)
        for (int c = 0; c < (int)g[0].size(); c++)
            if (g[r][c] == '1') {
                vector<pair<int, int>> shape;
                collect(r, c, r, c, shape);
                sort(shape.begin(), shape.end());
                shapes.insert(shape);
            }
    return shapes.size();
}`,
      main: cpp`
int main() {
    int R, C;
    cin >> R >> C;
    g.resize(R);
    for (auto& row : g) cin >> row;
    cout << distinctIslands() << "\n";
    return 0;
}`,
      io: 'Input: R C, then R rows of 0/1 characters. Output: number of distinct shapes.',
      keyLines: [{ match: 'shape.push_back({r - r0, c - c0});', note: 'Relative to the first cell found (top-left-most in scan order).' }],
      mistakes: ['Using absolute coordinates'],
      tests: [
        { in: '4 5\n11000\n11000\n00011\n00011', out: '1' },
        { in: '4 5\n11011\n10000\n00001\n11011', out: '3' },
        { in: '1 1\n0', out: '0' },
        { in: '3 3\n101\n000\n101', out: '1' },
      ],
    },
    {
      id: 'd40-word-ladder',
      day: 40,
      title: 'One Letter at a Time',
      difficulty: 'Hard',
      topic: 'advanced',
      patterns: ['graph-bfs', 'state-space-modeling', 'hash-lookup'],
      objective: 'BFS over words with on-the-fly neighbours.',
      statement: 'Transform begin into end by changing one letter at a time; every intermediate word must be in the dictionary. Print the number of words in the shortest sequence (including begin and end), or 0.',
      constraints: ['1 ≤ length ≤ 10', '1 ≤ dictionary ≤ 5000'],
      examples: [{ input: 'hit → cog, dict hot dot dog lot log cog', output: '5' }],
      edgeCases: ['end not in the dictionary → 0'],
      cues: ['Minimum transformations, unit cost'],
      hints: ['For each word, try all 26 letters at each position and look them up in a hash set.', 'Erase words from the set when visited.'],
      approach: 'BFS with neighbour generation.',
      correctness: 'BFS layers equal the number of changes.',
      complexity: { time: 'O(N · L · 26)', space: 'O(N · L)', why: 'Each word generates L · 26 candidates once.' },
      cpp: cpp`
#include <iostream>
#include <queue>
#include <string>
#include <unordered_set>
#include <vector>
using namespace std;

int ladderLength(const string& begin, const string& end, const vector<string>& words) {
    unordered_set<string> dict(words.begin(), words.end());
    if (!dict.count(end)) return 0;
    queue<string> q;
    q.push(begin);
    dict.erase(begin);
    for (int length = 1; !q.empty(); length++) {
        for (int k = q.size(); k > 0; k--) {
            string w = q.front();
            q.pop();
            if (w == end) return length;
            for (size_t i = 0; i < w.size(); i++) {
                char orig = w[i];
                for (char ch = 'a'; ch <= 'z'; ch++) {
                    w[i] = ch;
                    if (dict.erase(w)) q.push(w);  // erase = mark visited
                }
                w[i] = orig;
            }
        }
    }
    return 0;
}`,
      main: cpp`
int main() {
    string b, e;
    int n;
    cin >> b >> e >> n;
    vector<string> words(n);
    for (auto& w : words) cin >> w;
    cout << ladderLength(b, e, words) << "\n";
    return 0;
}`,
      io: 'Input: begin end n, then n dictionary words. Output: sequence length or 0.',
      keyLines: [{ match: 'if (dict.erase(w)) q.push(w);  // erase = mark visited', note: 'erase returns 1 only for unvisited dictionary words.' }],
      mistakes: ['Comparing every pair of words (O(N² L))'],
      tests: [
        { in: 'hit cog 6\nhot dot dog lot log cog', out: '5' },
        { in: 'hit cog 5\nhot dot dog lot log', out: '0' },
        { in: 'a c 3\na b c', out: '2' },
        { in: 'abc abc 1\nabc', out: '1' },
      ],
    },
    {
      id: 'd40-refuel',
      day: 40,
      title: 'Fewest Fuel Stops',
      difficulty: 'Hard',
      topic: 'advanced',
      patterns: ['heap-greedy', 'activity-selection'],
      objective: 'Greedy with a max-heap of passed opportunities.',
      statement: 'A car starts with startFuel and must reach target (1 unit of fuel per km). Stations along the road (position, fuel) can be used once each. Print the minimum number of stops, or -1.',
      constraints: ['1 ≤ target, startFuel ≤ 10⁹', '0 ≤ stations ≤ 500', 'positions strictly increasing'],
      examples: [{ input: 'target 100, start 10, stations (10,60) (20,30) (30,30) (60,40)', output: '2' }],
      edgeCases: ['startFuel ≥ target → 0', 'A gap that cannot be crossed → -1'],
      cues: ['Minimise stops; decide refuelling retroactively'],
      hints: ['Drive as far as possible; push every station you pass into a max-heap.', 'When stuck, refuel from the largest passed station.'],
      approach: 'Max-heap of fuel amounts from passed stations.',
      correctness: 'If a stop is needed, using the largest available fuel can only extend the reach the most (exchange argument).',
      complexity: { time: 'O(n log n)', space: 'O(n)', why: 'Each station pushed and popped once.' },
      cpp: cpp`
#include <iostream>
#include <queue>
#include <vector>
using namespace std;

int minRefuelStops(long long target, long long fuel, const vector<pair<long long, long long>>& st) {
    priority_queue<long long> passed;
    int stops = 0;
    size_t i = 0;
    while (fuel < target) {
        while (i < st.size() && st[i].first <= fuel) passed.push(st[i++].second);
        if (passed.empty()) return -1;
        fuel += passed.top();  // refuel retroactively at the best station passed
        passed.pop();
        stops++;
    }
    return stops;
}`,
      main: cpp`
int main() {
    long long target, start;
    int n;
    cin >> target >> start >> n;
    vector<pair<long long, long long>> st(n);
    for (auto& s : st) cin >> s.first >> s.second;
    cout << minRefuelStops(target, start, st) << "\n";
    return 0;
}`,
      io: 'Input: target startFuel n, then n lines "position fuel". Output: minimum stops or -1.',
      keyLines: [{ match: 'fuel += passed.top();  // refuel retroactively at the best station passed', note: 'fuel doubles as "farthest reachable position".' }],
      mistakes: ['Stopping at every station greedily'],
      tests: [
        { in: '100 10 4\n10 60\n20 30\n30 30\n60 40', out: '2' },
        { in: '100 1 1\n10 100', out: '-1' },
        { in: '1 1 0', out: '0' },
        { in: '100 50 2\n25 25\n50 50', out: '1' },
      ],
    },
    {
      id: 'd40-kth-pair-distance',
      day: 40,
      title: 'K-th Closest Pair of Towers',
      difficulty: 'Hard',
      topic: 'advanced',
      patterns: ['binary-search-answer', 'two-pointers-same'],
      objective: 'Counting check inside binary search.',
      statement: 'Print the k-th smallest distance |a[i] − a[j]| among all pairs i < j.',
      constraints: ['2 ≤ n ≤ 10⁴', '0 ≤ a[i] ≤ 10⁶', '1 ≤ k ≤ n(n−1)/2'],
      examples: [{ input: '1 3 1, k=1', output: '0' }],
      edgeCases: ['All equal → 0'],
      cues: ['k-th of n² implicit values'],
      hints: ['Sort; binary search d; count pairs ≤ d with two pointers.'],
      approach: 'Binary search on the distance.',
      correctness: 'count(d) is non-decreasing; the smallest d with count ≥ k is the k-th distance.',
      complexity: { time: 'O(n log n + n log W)', space: 'O(1)', why: 'Linear check per probe.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int kthPairDistance(vector<int> a, long long k) {
    sort(a.begin(), a.end());
    int lo = 0, hi = a.back() - a.front();
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        long long cnt = 0;
        for (int r = 0, l = 0; r < (int)a.size(); r++) {
            while (a[r] - a[l] > mid) l++;
            cnt += r - l;
        }
        if (cnt >= k) hi = mid;
        else lo = mid + 1;
    }
    return lo;
}`,
      main: cpp`
int main() {
    int n;
    long long k;
    cin >> n >> k;
    vector<int> a(n);
    for (auto& x : a) cin >> x;
    cout << kthPairDistance(a, k) << "\n";
    return 0;
}`,
      io: 'Input: n k, then n values. Output: k-th smallest distance.',
      keyLines: [{ match: 'cnt += r - l;', note: 'Pairs (l..r−1, r) are all within mid.' }],
      mistakes: ['Materialising all pairs (10⁸ for n = 10⁴)'],
      tests: [
        { in: '3 1\n1 3 1', out: '0' },
        { in: '3 2\n1 1 1', out: '0' },
        { in: '3 3\n1 6 1', out: '5' },
        { in: '4 3\n1 6 1 3', out: '2' },
      ],
    },
  ],
};

export default day;
