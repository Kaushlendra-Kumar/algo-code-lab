import type { DayModule } from '../../types/content';
import { cpp } from '../cpp';
import { TRACE_CODE } from '../traceCode';

const day: DayModule = {
  day: {
    day: 20,
    title: 'Intervals: Merging, Overlaps and Meeting Rooms',
    zone: 'greedy',
    objectives: [
      'Decide overlap of two intervals with a single comparison',
      'Merge overlapping intervals after sorting by start',
      'Count simultaneous intervals with a heap of end times',
      'Be explicit about open/closed endpoints',
    ],
    prerequisites: ['Day 9: sorting pairs', 'Day 15: priority queues'],
    lesson: [
      {
        heading: 'Overlap test',
        body: 'Closed intervals [a, b] and [c, d] overlap iff `a <= d && c <= b`. For half-open meetings [start, end) use strict `<` — a meeting ending at 10 does not clash with one starting at 10. Decide the convention before coding.',
      },
      {
        heading: 'Merge after sorting by start',
        body: 'Sorted by start, an interval can only overlap the **last merged** interval: if `start <= last.end`, extend `last.end = max(last.end, end)`; otherwise start a new block. O(n log n) for the sort, O(n) for the scan.',
      },
      {
        heading: 'Insert into a sorted list',
        body: 'For an already sorted, non-overlapping list: copy everything ending before the new interval, merge everything that overlaps it, then copy the rest — O(n), no re-sort.',
      },
      {
        heading: 'How many rooms?',
        body: 'Sort meetings by start. Keep a min-heap of end times of rooms in use. Before placing a meeting, free every room whose end ≤ start. The maximum heap size is the answer. Equivalent sweep: sort starts and ends separately and walk two pointers.',
      },
    ],
    recognition: [
      'Intervals + "merge", "union", "covered length" → sort by start and merge.',
      '"Minimum rooms/platforms", "maximum overlap" → heap of ends or sweep line.',
      '"Remove the fewest intervals to avoid overlap" → greedy by earliest end (Day 31).',
    ],
    patterns: ['interval-sorting', 'heap-greedy', 'sweep-line'],
    visualizations: ['greedy'],
    exampleA: {
      id: 'd20-A',
      title: 'Merge overlapping intervals',
      goal: 'Combine every set of overlapping intervals into one.',
      input: '{1,3}, {8,10}, {2,6}, {15,18}, {17,20}',
      output: '[1,6] [8,10] [15,20]',
      idea: 'After sorting by start, each new interval either overlaps the last merged block (extend it) or begins a new block.',
      code: TRACE_CODE['merge-intervals'],
      keyLines: [
        { match: 'sort(v.begin(), v.end());', note: 'pair comparison sorts by start, then by end.' },
        { match: 'if (!out.empty() && s <= out.back().second) {', note: 'Overlap (closed intervals; touching [1,4],[4,5] merges).' },
        { match: 'out.back().second = max(out.back().second, e);', note: 'max handles an interval fully contained in the block.' },
      ],
      complexity: { time: 'O(n log n)', space: 'O(n)', why: 'Sorting dominates; the scan is linear. Output may hold n intervals.' },
      edgeCases: ['Nested intervals like [1,10] and [2,3]', 'Touching intervals', 'Single interval'],
      mistakes: ['out.back().second = e (shrinks the block for nested intervals)', 'Forgetting to sort'],
      tryIt: 'Return the total length covered by the union of all intervals.',
      trace: { id: 'merge-intervals', input: { intervals: [[1, 3], [8, 10], [2, 6], [15, 18], [17, 20]] } },
      bug: {
        find: 'sort(v.begin(), v.end());',
        replace: '/* no sort */',
        symptom: 'The program prints "[1,3] [8,10] [15,20]" — [2,6] was swallowed by [8,10].',
        explanation: 'The merge only compares with the last block, which is valid only when intervals arrive in order of start. Unsorted, [2,6] is compared with [8,10] and wrongly merged into it.',
      },
    },
    exampleB: {
      id: 'd20-B',
      kind: 'variant',
      title: 'Minimum meeting rooms with a heap of end times',
      goal: 'Find how many rooms are needed so no meetings collide.',
      input: '[0,30), [5,10), [15,20), [10,15)',
      output: 'rooms needed = 2',
      idea: 'Process meetings by start time. The heap holds end times of busy rooms; its top is the room that frees up first. Reuse it if it is free by the time the next meeting starts.',
      code: cpp`
#include <algorithm>
#include <functional>
#include <iostream>
#include <queue>
#include <vector>
using namespace std;

int minRooms(vector<pair<int, int>> m) {
    sort(m.begin(), m.end());
    priority_queue<int, vector<int>, greater<int>> ends;  // end times of busy rooms
    int best = 0;
    for (auto [s, e] : m) {
        while (!ends.empty() && ends.top() <= s) ends.pop();  //@gap
        ends.push(e);
        best = max(best, (int)ends.size());
    }
    return best;
}

int main() {
    vector<pair<int, int>> meetings = {{0, 30}, {5, 10}, {15, 20}, {10, 15}};
    cout << "rooms needed = " << minRooms(meetings) << "\n";
    return 0;
}`,
      keyLines: [
        { match: 'priority_queue<int, vector<int>, greater<int>> ends;', note: 'Min-heap: the earliest-ending room is on top.' },
        { match: 'while (!ends.empty() && ends.top() <= s) ends.pop();', note: '<= because [10,15) can start when [5,10) ends.' },
        { match: 'best = max(best, (int)ends.size());', note: 'Rooms in use right now.' },
      ],
      dryRun: {
        columns: ['meeting', 'freed', 'heap after', 'rooms'],
        rows: [
          ['[0,30)', '—', '30', '1'],
          ['[5,10)', '—', '10, 30', '2'],
          ['[10,15)', '10', '15, 30', '2'],
          ['[15,20)', '15', '20, 30', '2'],
        ],
      },
      complexity: { time: 'O(n log n)', space: 'O(n)', why: 'Sort plus one push and at most one pop per meeting.' },
      edgeCases: ['Back-to-back meetings share a room', 'All meetings overlap → n rooms'],
      mistakes: ['Using < instead of <= for half-open intervals', 'Only popping one room per meeting (if is fine here, but while makes the heap size exact)'],
      tryIt: 'Solve it with two sorted arrays (starts and ends) and two pointers instead of a heap.',
    },
    complexityNotes: 'Interval problems are usually O(n log n) because of sorting; merging and heap sweeps are O(n) or O(n log n) after that.',
    quiz: [
      {
        prompt: 'Closed intervals [2, 5] and [5, 9]: do they overlap?',
        options: ['No', 'Yes — they share the point 5', 'Only if half-open', 'Cannot tell'],
        answer: 1,
        explanation: 'Closed intervals include their endpoints.',
      },
      {
        prompt: 'Why sort by start before merging?',
        options: ['To make it O(n²)', 'Then an interval can only overlap the most recent merged block', 'Because ends are irrelevant', 'To remove duplicates'],
        answer: 1,
        explanation: 'Any earlier block ends before the most recent one starts.',
      },
      {
        prompt: 'Meeting rooms: the heap\'s top end time is 10 and the next meeting starts at 10 (half-open). What happens?',
        options: ['A new room is opened', 'The room is reused', 'The meeting is skipped', 'Undefined'],
        answer: 1,
        explanation: 'A room free at time 10 can host a meeting starting at 10.',
      },
    ],
    recap: 'Sort intervals by start to merge; use a min-heap of end times (or a sweep) to count simultaneous intervals. Be precise about endpoint conventions.',
    nextPrep: 'Tomorrow begins graphs: adjacency lists, DFS and BFS on general graphs.',
  },
  questions: [
    {
      id: 'd20-summary-ranges',
      day: 20,
      title: 'Compress Consecutive Runs',
      difficulty: 'Easy',
      topic: 'greedy',
      patterns: ['interval-sorting', 'two-pointers-same'],
      objective: 'Group consecutive numbers into ranges.',
      statement: 'Given a sorted list of distinct integers, print ranges covering exactly the numbers: "a->b" for runs, "a" for singles, separated by spaces.',
      constraints: ['0 ≤ n ≤ 20', 'Values fit in 32-bit'],
      examples: [{ input: 'a = [0, 1, 2, 4, 5, 7]', output: '0->2 4->5 7' }],
      edgeCases: ['Empty list → empty line', 'Negative values', 'INT_MAX (avoid overflow when checking a[i] + 1)'],
      cues: ['Consecutive runs → scan with a run start'],
      hints: ['Extend the run while a[j + 1] == a[j] + 1.', 'Compare in 64-bit to avoid overflow.'],
      approach: 'Two-pointer scan building strings.',
      correctness: 'Each maximal run of consecutive values becomes exactly one range.',
      complexity: { time: 'O(n)', space: 'O(1) extra', why: 'Single pass.' },
      cpp: cpp`
#include <iostream>
#include <string>
#include <vector>
using namespace std;

vector<string> ranges(const vector<long long>& a) {
    vector<string> out;
    for (size_t i = 0; i < a.size();) {
        size_t j = i;
        while (j + 1 < a.size() && a[j + 1] == a[j] + 1) j++;
        out.push_back(i == j ? to_string(a[i]) : to_string(a[i]) + "->" + to_string(a[j]));
        i = j + 1;
    }
    return out;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<long long> a(n);
    for (auto& x : a) cin >> x;
    vector<string> r = ranges(a);
    for (size_t i = 0; i < r.size(); i++) cout << r[i] << (i + 1 < r.size() ? " " : "");
    cout << "\n";
    return 0;
}`,
      io: 'Input: n, then n sorted integers. Output: ranges separated by spaces.',
      keyLines: [{ match: 'while (j + 1 < a.size() && a[j + 1] == a[j] + 1) j++;', note: 'long long values: a[j] + 1 cannot overflow.' }],
      mistakes: ['int overflow at INT_MAX'],
      tests: [
        { in: '6\n0 1 2 4 5 7', out: '0->2 4->5 7' },
        { in: '0', out: '' },
        { in: '3\n-2 -1 5', out: '-2->-1 5' },
        { in: '2\n2147483646 2147483647', out: '2147483646->2147483647' },
      ],
      viz: 'greedy',
    },
    {
      id: 'd20-merge-intervals',
      day: 20,
      title: 'Consolidate Bookings',
      difficulty: 'Medium',
      topic: 'greedy',
      patterns: ['interval-sorting'],
      objective: 'Sort and merge closed intervals.',
      statement: 'Merge all overlapping closed intervals and print the result sorted by start, one per line as "start end".',
      constraints: ['1 ≤ n ≤ 10⁴'],
      examples: [{ input: '[1,3] [2,6] [8,10] [15,18]', output: '1 6\n8 10\n15 18' }],
      edgeCases: ['Nested intervals', 'Touching intervals merge'],
      cues: ['Union of intervals → sort + merge'],
      hints: ['Sort by start.', 'Extend the last block with max(end).'],
      approach: 'Example A.',
      correctness: 'See Example A.',
      complexity: { time: 'O(n log n)', space: 'O(n)', why: 'Sorting.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

vector<pair<int, int>> merge(vector<pair<int, int>> v) {
    sort(v.begin(), v.end());
    vector<pair<int, int>> out;
    for (auto [s, e] : v) {
        if (!out.empty() && s <= out.back().second) out.back().second = max(out.back().second, e);
        else out.push_back({s, e});
    }
    return out;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<pair<int, int>> v(n);
    for (auto& [s, e] : v) cin >> s >> e;
    for (auto [s, e] : merge(v)) cout << s << " " << e << "\n";
    return 0;
}`,
      io: 'Input: n, then n lines "start end". Output: merged intervals.',
      keyLines: [{ match: 'out.back().second = max(out.back().second, e);', note: 'Handles containment.' }],
      mistakes: ['Not sorting', 'Assigning e directly'],
      tests: [
        { in: '4\n1 3\n2 6\n8 10\n15 18', out: '1 6\n8 10\n15 18' },
        { in: '2\n1 4\n4 5', out: '1 5' },
        { in: '2\n1 10\n2 3', out: '1 10' },
        { in: '3\n5 6\n1 2\n3 4', out: '1 2\n3 4\n5 6' },
      ],
    },
    {
      id: 'd20-insert-interval',
      day: 20,
      title: 'Add a Booking to a Sorted Calendar',
      difficulty: 'Medium',
      topic: 'greedy',
      patterns: ['interval-sorting', 'two-pointers-same'],
      objective: 'Insert and merge in one linear pass.',
      statement: 'Given sorted non-overlapping closed intervals and a new interval, insert it (merging where needed) and print the result.',
      constraints: ['0 ≤ n ≤ 10⁴'],
      examples: [{ input: '[1,3] [6,9], new [2,5]', output: '1 5\n6 9' }],
      edgeCases: ['Empty calendar', 'New interval before all / after all', 'Covers everything'],
      cues: ['Already sorted → three phases: before, overlapping, after'],
      hints: ['Copy intervals ending before newStart.', 'Merge all intervals with start ≤ newEnd.', 'Copy the rest.'],
      approach: 'Three-phase linear scan.',
      correctness: 'Intervals overlapping the new one form one contiguous block in sorted order.',
      complexity: { time: 'O(n)', space: 'O(n)', why: 'Single pass.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

vector<pair<int, int>> insertInterval(const vector<pair<int, int>>& v, pair<int, int> nw) {
    vector<pair<int, int>> out;
    size_t i = 0;
    while (i < v.size() && v[i].second < nw.first) out.push_back(v[i++]);
    while (i < v.size() && v[i].first <= nw.second) {
        nw.first = min(nw.first, v[i].first);
        nw.second = max(nw.second, v[i].second);
        i++;
    }
    out.push_back(nw);
    while (i < v.size()) out.push_back(v[i++]);
    return out;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<pair<int, int>> v(n);
    for (auto& [s, e] : v) cin >> s >> e;
    pair<int, int> nw;
    cin >> nw.first >> nw.second;
    for (auto [s, e] : insertInterval(v, nw)) cout << s << " " << e << "\n";
    return 0;
}`,
      io: 'Input: n, n intervals, then the new interval. Output: resulting intervals.',
      keyLines: [{ match: 'while (i < v.size() && v[i].first <= nw.second) {', note: 'Absorb every interval that starts before the new one ends.' }],
      mistakes: ['Appending and re-sorting (O(n log n))'],
      tests: [
        { in: '2\n1 3\n6 9\n2 5', out: '1 5\n6 9' },
        { in: '5\n1 2\n3 5\n6 7\n8 10\n12 16\n4 8', out: '1 2\n3 10\n12 16' },
        { in: '0\n5 7', out: '5 7' },
        { in: '1\n1 5\n0 0', out: '0 0\n1 5' },
      ],
    },
    {
      id: 'd20-erase-overlaps',
      day: 20,
      title: 'Cancel the Fewest Events',
      difficulty: 'Medium',
      topic: 'greedy',
      patterns: ['interval-scheduling', 'interval-sorting'],
      objective: 'Keep the most compatible intervals by earliest end.',
      statement: 'Half-open intervals [start, end). Print the minimum number to remove so the rest do not overlap.',
      constraints: ['1 ≤ n ≤ 10⁵'],
      examples: [{ input: '[1,2) [2,3) [3,4) [1,3)', output: '1' }],
      edgeCases: ['All identical', 'Already disjoint'],
      cues: ['Remove fewest = keep most → interval scheduling by earliest end'],
      hints: ['Sort by end.', 'Keep an interval if it starts at or after the last kept end.', 'Answer = n − kept.'],
      approach: 'Greedy activity selection.',
      correctness: 'Earliest-end greedy maximises the kept set (exchange argument, Day 31).',
      complexity: { time: 'O(n log n)', space: 'O(1) extra', why: 'Sort + scan.' },
      cpp: cpp`
#include <algorithm>
#include <climits>
#include <iostream>
#include <vector>
using namespace std;

int eraseOverlaps(vector<pair<int, int>> v) {
    sort(v.begin(), v.end(), [](auto& a, auto& b) { return a.second < b.second; });
    int kept = 0;
    long long lastEnd = LLONG_MIN;
    for (auto [s, e] : v) {
        if (s >= lastEnd) {
            kept++;
            lastEnd = e;
        }
    }
    return (int)v.size() - kept;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<pair<int, int>> v(n);
    for (auto& [s, e] : v) cin >> s >> e;
    cout << eraseOverlaps(v) << "\n";
    return 0;
}`,
      io: 'Input: n, then n intervals. Output: minimum removals.',
      keyLines: [{ match: 'if (s >= lastEnd) {', note: 'Half-open: touching intervals are compatible.' }],
      mistakes: ['Sorting by start and keeping the first (fails on long early intervals)'],
      tests: [
        { in: '4\n1 2\n2 3\n3 4\n1 3', out: '1' },
        { in: '3\n1 2\n1 2\n1 2', out: '2' },
        { in: '2\n1 2\n2 3', out: '0' },
        { in: '4\n0 10\n1 3\n3 5\n5 7', out: '1' },
      ],
    },
    {
      id: 'd20-meeting-rooms',
      day: 20,
      title: 'How Many Rooms?',
      difficulty: 'Medium',
      topic: 'greedy',
      patterns: ['heap-greedy', 'sweep-line'],
      objective: 'Track busy rooms with a min-heap of end times.',
      statement: 'Given half-open meetings [start, end), print the minimum number of rooms required.',
      constraints: ['1 ≤ n ≤ 10⁴'],
      examples: [{ input: '[0,30) [5,10) [15,20)', output: '2' }],
      edgeCases: ['Back-to-back meetings', 'Identical meetings'],
      cues: ['Maximum simultaneous intervals → heap of ends or sweep'],
      hints: ['Sort by start.', 'Free rooms whose end ≤ current start.', 'Track the maximum heap size.'],
      approach: 'Example B.',
      correctness: 'The heap size equals the number of meetings in progress at each start time; the maximum over starts is the peak.',
      complexity: { time: 'O(n log n)', space: 'O(n)', why: 'Sort + heap.' },
      cpp: cpp`
#include <algorithm>
#include <functional>
#include <iostream>
#include <queue>
#include <vector>
using namespace std;

int minRooms(vector<pair<int, int>> m) {
    sort(m.begin(), m.end());
    priority_queue<int, vector<int>, greater<int>> ends;
    int best = 0;
    for (auto [s, e] : m) {
        while (!ends.empty() && ends.top() <= s) ends.pop();
        ends.push(e);
        best = max(best, (int)ends.size());
    }
    return best;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<pair<int, int>> m(n);
    for (auto& [s, e] : m) cin >> s >> e;
    cout << minRooms(m) << "\n";
    return 0;
}`,
      io: 'Input: n, then n meetings. Output: minimum rooms.',
      keyLines: [{ match: 'while (!ends.empty() && ends.top() <= s) ends.pop();', note: 'Rooms freed by now can be reused.' }],
      mistakes: ['Counting overlaps pairwise (not the same as the peak)'],
      tests: [
        { in: '3\n0 30\n5 10\n15 20', out: '2' },
        { in: '2\n7 10\n2 4', out: '1' },
        { in: '3\n1 5\n1 5\n1 5', out: '3' },
        { in: '4\n1 2\n2 3\n3 4\n1 4', out: '2' },
      ],
    },
    {
      id: 'd20-intersections',
      day: 20,
      title: 'Common Free Time of Two Calendars',
      difficulty: 'Medium',
      topic: 'greedy',
      patterns: ['two-pointers-same', 'interval-sorting'],
      objective: 'Intersect two sorted interval lists with two pointers.',
      statement: 'Two lists of closed, disjoint, sorted intervals are given. Print their intersection intervals in order.',
      constraints: ['0 ≤ n, m ≤ 1000'],
      examples: [{ input: 'A = [0,2] [5,10] [13,23] [24,25], B = [1,5] [8,12] [15,24] [25,26]', output: '1 2\n5 5\n8 10\n15 23\n24 24\n25 25' }],
      edgeCases: ['One list empty', 'Single-point intersections'],
      cues: ['Two sorted lists → advance the one that ends first'],
      hints: ['Intersection of [a1,a2] and [b1,b2] is [max(a1,b1), min(a2,b2)] if non-empty.', 'Advance the interval with the smaller end.'],
      approach: 'Two pointers.',
      correctness: 'The interval ending first cannot intersect anything later in the other list.',
      complexity: { time: 'O(n + m)', space: 'O(1) extra', why: 'Each pointer moves forward only.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

vector<pair<int, int>> intersect(const vector<pair<int, int>>& A, const vector<pair<int, int>>& B) {
    vector<pair<int, int>> out;
    size_t i = 0, j = 0;
    while (i < A.size() && j < B.size()) {
        int lo = max(A[i].first, B[j].first), hi = min(A[i].second, B[j].second);
        if (lo <= hi) out.push_back({lo, hi});
        if (A[i].second < B[j].second) i++;
        else j++;
    }
    return out;
}`,
      main: cpp`
int main() {
    int n, m;
    cin >> n;
    vector<pair<int, int>> A(n);
    for (auto& [s, e] : A) cin >> s >> e;
    cin >> m;
    vector<pair<int, int>> B(m);
    for (auto& [s, e] : B) cin >> s >> e;
    for (auto [s, e] : intersect(A, B)) cout << s << " " << e << "\n";
    return 0;
}`,
      io: 'Input: n, n intervals, m, m intervals. Output: intersections.',
      keyLines: [{ match: 'if (A[i].second < B[j].second) i++;', note: 'Drop the interval that finishes first.' }],
      mistakes: ['Advancing both pointers'],
      tests: [
        { in: '4\n0 2\n5 10\n13 23\n24 25\n4\n1 5\n8 12\n15 24\n25 26', out: '1 2\n5 5\n8 10\n15 23\n24 24\n25 25' },
        { in: '0\n1\n1 2', out: '' },
        { in: '1\n1 10\n2\n2 3\n5 6', out: '2 3\n5 6' },
        { in: '1\n1 2\n1\n3 4', out: '' },
      ],
    },
    {
      id: 'd20-min-arrows',
      day: 20,
      title: 'Fewest Arrows for Balloons',
      difficulty: 'Medium',
      topic: 'greedy',
      patterns: ['interval-scheduling', 'interval-sorting'],
      objective: 'Greedy point stabbing by earliest end.',
      statement: 'Each balloon spans [start, end] on the x-axis. An arrow shot at x bursts all balloons with start ≤ x ≤ end. Print the minimum number of arrows.',
      constraints: ['1 ≤ n ≤ 10⁵', 'Coordinates fit in 32-bit'],
      examples: [{ input: '[10,16] [2,8] [1,6] [7,12]', output: '2' }],
      edgeCases: ['Touching balloons share an arrow', 'Extreme coordinates'],
      cues: ['Minimum points hitting all intervals → sort by end, shoot at the end'],
      hints: ['Sort by end.', 'Shoot at the first end; skip all balloons starting ≤ that point.'],
      approach: 'Greedy stabbing.',
      correctness: 'Shooting at the earliest end bursts the first balloon and as many others as possible (exchange argument).',
      complexity: { time: 'O(n log n)', space: 'O(1) extra', why: 'Sort + scan.' },
      cpp: cpp`
#include <algorithm>
#include <cstdint>
#include <iostream>
#include <vector>
using namespace std;

int minArrows(vector<pair<int, int>> b) {
    sort(b.begin(), b.end(), [](auto& x, auto& y) { return x.second < y.second; });
    int arrows = 0;
    long long pos = (long long)INT32_MIN - 1;
    for (auto [s, e] : b) {
        if (s > pos) {
            arrows++;
            pos = e;
        }
    }
    return arrows;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<pair<int, int>> b(n);
    for (auto& [s, e] : b) cin >> s >> e;
    cout << minArrows(b) << "\n";
    return 0;
}`,
      io: 'Input: n, then n balloons. Output: minimum arrows.',
      keyLines: [{ match: 'if (s > pos) {', note: 'Not reached by the current arrow → shoot a new one at its end.' }],
      mistakes: ['Sentinel INT_MIN fails for a balloon starting at INT_MIN'],
      tests: [
        { in: '4\n10 16\n2 8\n1 6\n7 12', out: '2' },
        { in: '4\n1 2\n3 4\n5 6\n7 8', out: '4' },
        { in: '4\n1 2\n2 3\n3 4\n4 5', out: '2' },
        { in: '1\n-2147483648 2147483647', out: '1' },
      ],
    },
    {
      id: 'd20-free-time',
      day: 20,
      title: 'Team-Wide Free Slots',
      difficulty: 'Hard',
      topic: 'greedy',
      patterns: ['interval-sorting', 'heap-greedy'],
      objective: 'Merge many schedules and report gaps.',
      statement: 'k employees each have a sorted list of busy closed intervals. Print the finite free intervals common to everyone (gaps between merged busy times), one per line as "start end".',
      constraints: ['1 ≤ k ≤ 50', 'Total intervals ≤ 10⁴'],
      examples: [{ input: '[[1,2],[5,6]], [[1,3]], [[4,10]]', output: '3 4' }],
      edgeCases: ['No gaps → empty output', 'Touching busy intervals (no gap)'],
      cues: ['Union of all busy intervals → gaps between merged blocks'],
      hints: ['Collect all intervals and sort by start (or k-way merge).', 'Merge them.', 'Each gap between consecutive merged blocks is free time.'],
      approach: 'Flatten, sort, merge, output gaps.',
      correctness: 'Common free time is exactly the complement of the union of busy times between the first start and last end.',
      complexity: { time: 'O(N log N)', space: 'O(N)', why: 'Sorting all N intervals.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

vector<pair<int, int>> freeTime(vector<pair<int, int>> all) {
    sort(all.begin(), all.end());
    vector<pair<int, int>> gaps;
    int end = all[0].second;
    for (size_t i = 1; i < all.size(); i++) {
        if (all[i].first > end) gaps.push_back({end, all[i].first});
        end = max(end, all[i].second);
    }
    return gaps;
}`,
      main: cpp`
int main() {
    int k;
    cin >> k;
    vector<pair<int, int>> all;
    for (int e = 0; e < k; e++) {
        int m;
        cin >> m;
        while (m--) {
            int s, t;
            cin >> s >> t;
            all.push_back({s, t});
        }
    }
    for (auto [s, e] : freeTime(all)) cout << s << " " << e << "\n";
    return 0;
}`,
      io: 'Input: k, then for each employee "m" followed by m intervals. Output: free intervals.',
      keyLines: [{ match: 'if (all[i].first > end) gaps.push_back({end, all[i].first});', note: 'Strict >: touching intervals leave no gap.' }],
      mistakes: ['Reporting the infinite gaps before the first start or after the last end'],
      tests: [
        { in: '3\n2 1 2 5 6\n1 1 3\n1 4 10', out: '3 4' },
        { in: '3\n2 1 3 6 7\n1 2 4\n2 2 5 9 12', out: '5 6\n7 9' },
        { in: '1\n1 1 5', out: '' },
        { in: '2\n1 1 2\n1 2 3', out: '' },
      ],
    },
  ],
};

export default day;
