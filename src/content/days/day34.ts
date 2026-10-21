import type { DayModule } from '../../types/content';
import { cpp } from '../cpp';

const day: DayModule = {
  day: {
    day: 34,
    title: 'Sweep Line and Difference Arrays',
    zone: 'greedy',
    objectives: [
      'Turn intervals into +1/−1 events and sweep them in order',
      'Decide the tie-break between an end and a start at the same coordinate',
      'Apply many range updates in O(1) each with a difference array',
      'Use an ordered multiset to sweep while tracking the current maximum',
    ],
    prerequisites: ['Day 3: prefix sums and difference arrays', 'Day 20: intervals'],
    lesson: [
      {
        heading: 'Events instead of intervals',
        body: 'An interval [s, e) becomes two events: +1 at s and −1 at e. Sort events by coordinate and walk through them keeping a running count — the number of intervals covering the current position. The maximum running count is the maximum overlap.',
      },
      {
        heading: 'Tie-breaking matters',
        body: 'If one meeting ends at 10 and another starts at 10, do they overlap? For half-open intervals [s, e) process the **end first** (−1 before +1). For closed intervals [s, e] process the start first. Encoding events as pairs `(time, delta)` and sorting gives −1 before +1 automatically.',
      },
      {
        heading: 'Difference arrays',
        body: 'When coordinates are small integers, skip sorting: `diff[s] += v; diff[e] −= v;` then a prefix sum gives each position\'s total. k updates and one sweep cost O(k + range).',
      },
      {
        heading: 'Sweeping with a data structure',
        body: 'Some sweeps need more than a counter — e.g. the skyline needs the tallest active building. Keep active items in a multiset (or heap with lazy deletion): insert at a start event, erase at an end event, read the maximum after each coordinate.',
      },
      {
        heading: 'Coordinate compression',
        body: 'If coordinates go up to 10⁹ but there are only n intervals, sort the distinct coordinates and replace each by its rank. Then a difference array of size 2n works.',
      },
    ],
    recognition: [
      '"Maximum number of overlapping …", "minimum rooms/platforms" → sweep line.',
      'Many "add v to every position in [l, r]" updates, then read all values → difference array.',
      '"Outline", "maximum active value over time" → sweep with a multiset/heap.',
    ],
    patterns: ['sweep-line', 'difference-array', 'interval-sorting'],
    visualizations: ['greedy', 'prefix-sum'],
    exampleA: {
      id: 'd34-A',
      title: 'Maximum overlap with a sweep line',
      goal: 'Find the largest number of meetings in progress at the same time. Meetings are half-open [start, end).',
      input: '[1,4) [2,5) [9,12) [5,9) [5,12)',
      output: 'events: (1,+1) (2,+1) (4,-1) (5,-1) (5,+1) (5,+1) (9,-1) (9,+1) (12,-1) (12,-1)\nmax overlap = 2',
      idea: 'Each meeting adds +1 at its start and −1 at its end. Sorting pairs (time, delta) puts −1 before +1 at equal times, so back-to-back meetings do not count as overlapping.',
      code: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<pair<int, int>> meetings = {{1, 4}, {2, 5}, {9, 12}, {5, 9}, {5, 12}};
    vector<pair<int, int>> events;
    for (auto& [s, e] : meetings) {
        events.push_back({s, +1});  //@gap
        events.push_back({e, -1});  //@gap
    }
    sort(events.begin(), events.end());  // equal times: -1 sorts before +1
    cout << "events:";
    for (auto& [t, d] : events) cout << " (" << t << "," << (d > 0 ? "+1" : "-1") << ")";
    cout << "\n";
    int active = 0, best = 0;
    for (auto& [t, d] : events) {
        active += d;
        best = max(best, active);
    }
    cout << "max overlap = " << best << "\n";
    return 0;
}`,
      keyLines: [
        { match: 'events.push_back({s, +1});', note: 'A meeting starts: one more room in use.' },
        { match: 'sort(events.begin(), events.end());  // equal times: -1 sorts before +1', note: 'Pairs compare by time, then by delta: ends are processed first.' },
        { match: 'best = max(best, active);', note: 'The peak of the running count is the answer.' },
      ],
      dryRun: {
        columns: ['event', 'active', 'best'],
        rows: [
          ['(1,+1)', '1', '1'],
          ['(2,+1)', '2', '2'],
          ['(4,−1)', '1', '2'],
          ['(5,−1)', '0', '2'],
          ['(5,+1) (5,+1)', '1 → 2', '2'],
          ['(9,−1) (9,+1)', '1 → 2', '2'],
          ['(12,−1) (12,−1)', '1 → 0', '2'],
        ],
      },
      complexity: { time: 'O(n log n)', space: 'O(n)', why: 'Sorting 2n events, then a linear sweep.' },
      edgeCases: ['Touching intervals', 'Zero-length intervals [t, t)', 'All intervals identical'],
      mistakes: ['Processing starts before ends at the same time for half-open intervals', 'Sorting starts and ends independently without care for ties'],
      tryIt: 'Make the intervals closed: encode starts as (t, −1) and ends as (t, +1) with negated deltas, or use a custom comparator.',
      bug: {
        find: 'events.push_back({e, -1});',
        replace: 'events.push_back({e + 1, -1});',
        symptom: 'The program prints "max overlap = 3" — meetings that merely touch at 5 and 9 are counted as overlapping.',
        explanation: 'Moving the end one step later turns [s, e) into [s, e] (closed). The meeting ending at 5 is then still active when two others start at 5.',
      },
    },
    exampleB: {
      id: 'd34-B',
      kind: 'variant',
      title: 'Car pooling with a difference array',
      goal: 'A car with capacity 6 drives east. Each trip picks up p passengers at km `from` and drops them at km `to`. Is the car ever over capacity?',
      input: 'trips (2 at 1→5), (3 at 3→7), (2 at 5→8); capacity 6',
      output: 'load per km: 2 2 5 5 5 5 2 0\nfits = yes',
      idea: 'Add p at `from` and subtract p at `to` in a difference array; the prefix sum is the load on each km.',
      code: cpp`
#include <iostream>
#include <vector>
using namespace std;

int main() {
    struct Trip {
        int passengers, from, to;
    };
    vector<Trip> trips = {{2, 1, 5}, {3, 3, 7}, {2, 5, 8}};
    int capacity = 6, maxKm = 8;
    vector<int> diff(maxKm + 1, 0);
    for (auto& t : trips) {
        diff[t.from] += t.passengers;
        diff[t.to] -= t.passengers;  // they leave at "to"
    }
    bool fits = true;
    int load = 0;
    cout << "load per km:";
    for (int km = 1; km <= maxKm; km++) {
        load += diff[km];
        cout << " " << load;
        if (load > capacity) fits = false;
    }
    cout << "\n";
    cout << "fits = " << (fits ? "yes" : "no") << "\n";
    return 0;
}`,
      keyLines: [
        { match: 'diff[t.from] += t.passengers;', note: 'O(1) range update: start of the range.' },
        { match: 'diff[t.to] -= t.passengers;  // they leave at "to"', note: 'End of the range (exclusive).' },
        { match: 'load += diff[km];', note: 'The prefix sum recovers the actual load.' },
      ],
      complexity: { time: 'O(trips + maxKm)', space: 'O(maxKm)', why: 'One update per trip and one sweep over the road.' },
      edgeCases: ['Pick-up and drop-off at the same km', 'Coordinates too large → sort events instead'],
      mistakes: ['Subtracting at to + 1 (passengers would occupy the seat one km too long)'],
      tryIt: 'Lower the capacity to 4 and find the first km where the car overflows.',
    },
    complexityNotes: 'Sorting events costs O(n log n); a difference array costs O(n + range). With a multiset of active items each event costs O(log n).',
    quiz: [
      {
        prompt: 'Half-open meetings [1,5) and [5,8): to avoid counting them as overlapping, at time 5 process…',
        options: ['The start first', 'The end first', 'Either order', 'Neither'],
        answer: 1,
        explanation: 'The first meeting is over before the second begins.',
      },
      {
        prompt: 'After k range additions on a difference array of size m, reading all values costs…',
        options: ['O(k · m)', 'O(k + m)', 'O(k log m)', 'O(m²)'],
        answer: 1,
        explanation: 'Each update is O(1); one prefix sum recovers everything.',
      },
      {
        prompt: 'The minimum number of rooms for a set of meetings equals…',
        options: ['The number of meetings', 'The maximum overlap', 'The longest meeting', 'The number of distinct start times'],
        answer: 1,
        explanation: 'At the busiest moment every active meeting needs its own room, and that many rooms always suffice.',
      },
    ],
    recap: 'Turn intervals into events, sort with the right tie-break, and sweep with a counter (or a multiset when the maximum active value is needed). With small integer coordinates a difference array replaces sorting.',
    nextPrep: 'Tomorrow: minimum spanning trees with Kruskal and Prim.',
  },
  questions: [
    {
      id: 'd34-points-covered',
      day: 34,
      title: 'Parking Spots Taken',
      difficulty: 'Easy',
      topic: 'greedy',
      patterns: ['difference-array', 'sweep-line'],
      objective: 'Count covered integer points with a difference array.',
      statement: 'Each car covers every integer point in [start, end] (inclusive). Print how many integer points are covered by at least one car.',
      constraints: ['1 ≤ n ≤ 100', '1 ≤ start ≤ end ≤ 100'],
      examples: [{ input: '[3,6] [1,5] [4,7]', output: '7' }],
      edgeCases: ['Single-point cars', 'Nested intervals'],
      cues: ['Small coordinates + union of ranges'],
      hints: ['diff[start]++, diff[end + 1]−− for inclusive ranges.'],
      approach: 'Difference array over 1..101.',
      correctness: 'The prefix sum at x is the number of cars covering x.',
      complexity: { time: 'O(n + C)', space: 'O(C)', why: 'C = coordinate range.' },
      cpp: cpp`
#include <iostream>
#include <vector>
using namespace std;

int coveredPoints(const vector<pair<int, int>>& cars) {
    vector<int> diff(102, 0);
    for (auto& [s, e] : cars) {
        diff[s]++;
        diff[e + 1]--;
    }
    int cover = 0, count = 0;
    for (int x = 1; x <= 100; x++) {
        cover += diff[x];
        if (cover > 0) count++;
    }
    return count;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<pair<int, int>> cars(n);
    for (auto& c : cars) cin >> c.first >> c.second;
    cout << coveredPoints(cars) << "\n";
    return 0;
}`,
      io: 'Input: n, then n lines "start end". Output: covered count.',
      keyLines: [{ match: 'diff[e + 1]--;', note: 'Inclusive end: stop counting after e.' }],
      mistakes: ['diff[e]-- for inclusive ranges (drops the last point)'],
      tests: [
        { in: '3\n3 6\n1 5\n4 7', out: '7' },
        { in: '2\n1 3\n5 8', out: '7' },
        { in: '1\n4 4', out: '1' },
        { in: '3\n1 100\n2 3\n50 60', out: '100' },
      ],
      viz: 'prefix-sum',
    },
    {
      id: 'd34-meeting-rooms',
      day: 34,
      title: 'Rooms for the Conference',
      difficulty: 'Medium',
      topic: 'greedy',
      patterns: ['sweep-line', 'interval-sorting'],
      objective: 'Maximum overlap of half-open intervals.',
      statement: 'Meetings are half-open [start, end). Print the minimum number of rooms needed.',
      constraints: ['1 ≤ n ≤ 10⁵', '0 ≤ start < end ≤ 10⁹'],
      examples: [{ input: '[0,30) [5,10) [15,20)', output: '2' }],
      edgeCases: ['Back-to-back meetings share a room'],
      cues: ['"minimum rooms" = maximum overlap'],
      hints: ['Sort starts and ends separately; sweep with two pointers.'],
      approach: 'Two sorted arrays: a start before the next end needs a new room.',
      correctness: 'The number of starts minus ends seen so far is the current overlap.',
      complexity: { time: 'O(n log n)', space: 'O(n)', why: 'Sorting.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int minRooms(const vector<pair<int, int>>& m) {
    vector<int> starts, ends;
    for (auto& [s, e] : m) {
        starts.push_back(s);
        ends.push_back(e);
    }
    sort(starts.begin(), starts.end());
    sort(ends.begin(), ends.end());
    int rooms = 0, best = 0;
    size_t j = 0;
    for (int s : starts) {
        while (j < ends.size() && ends[j] <= s) {
            j++;
            rooms--;  // a meeting finished before s: its room is free
        }
        rooms++;
        best = max(best, rooms);
    }
    return best;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<pair<int, int>> m(n);
    for (auto& x : m) cin >> x.first >> x.second;
    cout << minRooms(m) << "\n";
    return 0;
}`,
      io: 'Input: n, then n lines "start end". Output: rooms.',
      keyLines: [{ match: 'while (j < ends.size() && ends[j] <= s) {', note: '<= : a meeting ending at s frees its room for s.' }],
      mistakes: ['Using < (back-to-back meetings counted as overlapping)'],
      tests: [
        { in: '3\n0 30\n5 10\n15 20', out: '2' },
        { in: '2\n7 10\n2 4', out: '1' },
        { in: '3\n1 5\n5 9\n9 12', out: '1' },
        { in: '4\n1 10\n2 9\n3 8\n4 7', out: '4' },
      ],
    },
    {
      id: 'd34-platforms',
      day: 34,
      title: 'Platforms at a Junction',
      difficulty: 'Medium',
      topic: 'greedy',
      patterns: ['sweep-line'],
      objective: 'Closed intervals: start beats end on ties.',
      statement: 'Trains occupy a platform from arrival to departure inclusive (HHMM integers). Print the minimum number of platforms.',
      constraints: ['1 ≤ n ≤ 10⁵', '0 ≤ arrival ≤ departure ≤ 2359'],
      examples: [{ input: 'arr 900 940 950 1100 1500 1800, dep 910 1200 1120 1130 1900 2000', output: '3' }],
      edgeCases: ['A train arriving exactly when another departs needs a separate platform'],
      cues: ['Inclusive occupation → closed intervals'],
      hints: ['Events (time, type) with arrivals sorted before departures at the same time.'],
      approach: 'Event sweep with arrival-first tie-break.',
      correctness: 'Inclusive intervals overlap at a shared endpoint, so arrivals must be counted first.',
      complexity: { time: 'O(n log n)', space: 'O(n)', why: 'Sorting events.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int minPlatforms(const vector<int>& arr, const vector<int>& dep) {
    vector<pair<int, int>> ev;  // (time, 0 = arrive, 1 = depart)
    for (size_t i = 0; i < arr.size(); i++) {
        ev.push_back({arr[i], 0});
        ev.push_back({dep[i], 1});
    }
    sort(ev.begin(), ev.end());
    int cur = 0, best = 0;
    for (auto& [t, type] : ev) {
        cur += type == 0 ? 1 : -1;
        best = max(best, cur);
    }
    return best;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<int> arr(n), dep(n);
    for (auto& a : arr) cin >> a;
    for (auto& d : dep) cin >> d;
    cout << minPlatforms(arr, dep) << "\n";
    return 0;
}`,
      io: 'Input: n, arrivals, departures. Output: platforms.',
      keyLines: [{ match: 'vector<pair<int, int>> ev;  // (time, 0 = arrive, 1 = depart)', note: 'Type 0 sorts first: arrivals before departures at equal times.' }],
      mistakes: ['Wrong tie-break for inclusive intervals'],
      tests: [
        { in: '6\n900 940 950 1100 1500 1800\n910 1200 1120 1130 1900 2000', out: '3' },
        { in: '2\n1000 1100\n1100 1200', out: '2' },
        { in: '1\n500 500', out: '1' },
        { in: '3\n100 200 300\n150 250 350', out: '1' },
      ],
    },
    {
      id: 'd34-car-pooling',
      day: 34,
      title: 'Shuttle Capacity Check',
      difficulty: 'Medium',
      topic: 'greedy',
      patterns: ['difference-array', 'sweep-line'],
      objective: 'Difference array feasibility check.',
      statement: 'Trips are (passengers, from, to) on km 0..1000; passengers ride on [from, to). Print YES if the shuttle never exceeds the capacity, else NO.',
      constraints: ['1 ≤ trips ≤ 1000', '0 ≤ from < to ≤ 1000'],
      examples: [{ input: '(2,1,5) (3,3,7), capacity 4', output: 'NO' }],
      edgeCases: ['Drop-off and pick-up at the same km'],
      cues: ['Range additions + check every point'],
      hints: ['diff[from] += p; diff[to] −= p.'],
      approach: 'Difference array, then prefix sums.',
      correctness: 'Prefix sums give the exact load on each km.',
      complexity: { time: 'O(trips + 1000)', space: 'O(1000)', why: 'Fixed range.' },
      cpp: cpp`
#include <iostream>
#include <vector>
using namespace std;

bool carPooling(const vector<vector<int>>& trips, int capacity) {
    vector<int> diff(1001, 0);
    for (auto& t : trips) {
        diff[t[1]] += t[0];
        diff[t[2]] -= t[0];
    }
    int load = 0;
    for (int km = 0; km <= 1000; km++) {
        load += diff[km];
        if (load > capacity) return false;
    }
    return true;
}`,
      main: cpp`
int main() {
    int n, cap;
    cin >> n >> cap;
    vector<vector<int>> trips(n, vector<int>(3));
    for (auto& t : trips) cin >> t[0] >> t[1] >> t[2];
    cout << (carPooling(trips, cap) ? "YES" : "NO") << "\n";
    return 0;
}`,
      io: 'Input: n capacity, then n lines "passengers from to". Output: YES or NO.',
      keyLines: [{ match: 'diff[t[2]] -= t[0];', note: 'They are gone at km "to".' }],
      mistakes: ['Checking only at trip starts but with stale loads'],
      tests: [
        { in: '2 4\n2 1 5\n3 3 7', out: 'NO' },
        { in: '2 5\n2 1 5\n3 3 7', out: 'YES' },
        { in: '2 3\n2 1 5\n3 5 7', out: 'YES' },
        { in: '3 11\n3 2 7\n3 7 9\n8 3 9', out: 'YES' },
      ],
    },
    {
      id: 'd34-flight-bookings',
      day: 34,
      title: 'Seat Reservations per Flight',
      difficulty: 'Medium',
      topic: 'greedy',
      patterns: ['difference-array'],
      objective: 'Inclusive range additions, output every value.',
      statement: 'Flights are numbered 1..n. Booking (first, last, seats) reserves seats on every flight from first to last inclusive. Print the total seats for each flight.',
      constraints: ['1 ≤ n ≤ 2·10⁴', '1 ≤ bookings ≤ 2·10⁴'],
      examples: [{ input: 'n=5, (1,2,10) (2,3,20) (2,5,25)', output: '10 55 45 25 25' }],
      edgeCases: ['Booking covering all flights'],
      cues: ['Range add, then read all'],
      hints: ['diff[first] += s; diff[last + 1] −= s.'],
      approach: 'Difference array.',
      correctness: 'Prefix sums of diff equal the sum of bookings covering each flight.',
      complexity: { time: 'O(n + bookings)', space: 'O(n)', why: 'Linear.' },
      cpp: cpp`
#include <iostream>
#include <vector>
using namespace std;

vector<long long> seatsPerFlight(int n, const vector<vector<int>>& bookings) {
    vector<long long> diff(n + 2, 0);
    for (auto& b : bookings) {
        diff[b[0]] += b[2];
        diff[b[1] + 1] -= b[2];
    }
    vector<long long> res(n);
    long long run = 0;
    for (int f = 1; f <= n; f++) {
        run += diff[f];
        res[f - 1] = run;
    }
    return res;
}`,
      main: cpp`
int main() {
    int n, k;
    cin >> n >> k;
    vector<vector<int>> b(k, vector<int>(3));
    for (auto& x : b) cin >> x[0] >> x[1] >> x[2];
    auto res = seatsPerFlight(n, b);
    for (int i = 0; i < n; i++) cout << (i ? " " : "") << res[i];
    cout << "\n";
    return 0;
}`,
      io: 'Input: n k, then k bookings. Output: n totals.',
      keyLines: [{ match: 'diff[b[1] + 1] -= b[2];', note: 'Size n + 2 keeps last + 1 in bounds.' }],
      mistakes: ['diff of size n + 1 → out of bounds when last = n'],
      tests: [
        { in: '5 3\n1 2 10\n2 3 20\n2 5 25', out: '10 55 45 25 25' },
        { in: '2 2\n1 1 10\n2 2 15', out: '10 15' },
        { in: '3 1\n1 3 7', out: '7 7 7' },
        { in: '4 2\n2 3 5\n1 4 1', out: '1 6 6 1' },
      ],
    },
    {
      id: 'd34-brightest',
      day: 34,
      title: 'Brightest Spot on the Street',
      difficulty: 'Medium',
      topic: 'greedy',
      patterns: ['sweep-line', 'difference-array'],
      objective: 'Sweep with large coordinates (map as a sparse difference array).',
      statement: 'Lamp i at position p with range r lights [p − r, p + r]. Print the smallest position with the maximum number of lamps covering it.',
      constraints: ['1 ≤ n ≤ 10⁵', '|p| ≤ 10⁸', '0 ≤ r ≤ 10⁸'],
      examples: [{ input: '(-3,2) (1,2) (3,3)', output: '-1' }],
      edgeCases: ['Single lamp → its left end', 'Negative coordinates'],
      cues: ['Coordinates too large for an array → ordered map of deltas'],
      hints: ['map[l]++, map[r + 1]−−, then sweep keys in order.'],
      approach: 'Sparse difference array in std::map.',
      correctness: 'Brightness only changes at keys; the first key reaching the max is the smallest brightest position.',
      complexity: { time: 'O(n log n)', space: 'O(n)', why: 'Ordered map.' },
      cpp: cpp`
#include <iostream>
#include <map>
#include <vector>
using namespace std;

long long brightest(const vector<pair<long long, long long>>& lamps) {
    map<long long, int> delta;
    for (auto& [p, r] : lamps) {
        delta[p - r]++;
        delta[p + r + 1]--;
    }
    int cur = 0, best = 0;
    long long pos = 0;
    for (auto& [x, d] : delta) {
        cur += d;
        if (cur > best) {
            best = cur;
            pos = x;
        }
    }
    return pos;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<pair<long long, long long>> lamps(n);
    for (auto& l : lamps) cin >> l.first >> l.second;
    cout << brightest(lamps) << "\n";
    return 0;
}`,
      io: 'Input: n, then n lines "position range". Output: brightest position.',
      keyLines: [{ match: 'if (cur > best) {', note: 'Strictly greater keeps the smallest position on ties.' }],
      mistakes: ['>= (reports a later position with the same brightness)'],
      tests: [
        { in: '3\n-3 2\n1 2\n3 3', out: '-1' },
        { in: '2\n1 0\n0 1', out: '1' },
        { in: '1\n1 2', out: '-1' },
        { in: '3\n0 0\n10 0\n10 0', out: '10' },
      ],
    },
    {
      id: 'd34-remove-covered',
      day: 34,
      title: 'Redundant Coverage',
      difficulty: 'Medium',
      topic: 'greedy',
      patterns: ['interval-sorting', 'sweep-line'],
      objective: 'Sort by start ascending, end descending.',
      statement: 'An interval [a, b] is covered by [c, d] if c ≤ a and b ≤ d. Print how many intervals remain after removing every covered interval.',
      constraints: ['1 ≤ n ≤ 1000', 'All intervals distinct'],
      examples: [{ input: '[1,4] [3,6] [2,8]', output: '2' }],
      edgeCases: ['Same start, different ends'],
      cues: ['Containment among intervals'],
      hints: ['Sort by start ascending, end descending; track the max end seen.'],
      approach: 'Sorted sweep with a running maximum end.',
      correctness: 'After sorting, an interval is covered iff some earlier interval reaches at least its end.',
      complexity: { time: 'O(n log n)', space: 'O(1)', why: 'Sort + scan.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int remainingIntervals(vector<pair<int, int>> v) {
    sort(v.begin(), v.end(), [](const pair<int, int>& x, const pair<int, int>& y) {
        return x.first != y.first ? x.first < y.first : x.second > y.second;
    });
    int count = 0, maxEnd = -1;
    for (auto& [s, e] : v)
        if (e > maxEnd) {
            count++;
            maxEnd = e;
        }
    return count;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<pair<int, int>> v(n);
    for (auto& x : v) cin >> x.first >> x.second;
    cout << remainingIntervals(v) << "\n";
    return 0;
}`,
      io: 'Input: n, then n intervals. Output: remaining count.',
      keyLines: [{ match: 'return x.first != y.first ? x.first < y.first : x.second > y.second;', note: 'Longer first on equal starts, so the shorter one is detected as covered.' }],
      mistakes: ['Ascending ends on ties (misses containment with equal starts)'],
      tests: [
        { in: '3\n1 4\n3 6\n2 8', out: '2' },
        { in: '2\n1 4\n2 3', out: '1' },
        { in: '2\n1 2\n1 4', out: '1' },
        { in: '3\n3 10\n4 10\n5 11', out: '2' },
      ],
    },
    {
      id: 'd34-skyline',
      day: 34,
      title: 'City Skyline Outline',
      difficulty: 'Hard',
      topic: 'greedy',
      patterns: ['sweep-line', 'heap-greedy'],
      objective: 'Sweep with a multiset of active heights.',
      statement: 'Buildings are (left, right, height) rectangles on the ground. Print the skyline key points "x h" where the outline height changes, left to right.',
      constraints: ['1 ≤ n ≤ 10⁴', '0 ≤ left < right ≤ 2³¹ − 1', '1 ≤ height ≤ 2³¹ − 1'],
      examples: [{ input: '(2,9,10) (3,7,15) (5,12,12) (15,20,10) (19,24,8)', output: '2 10 / 3 15 / 7 12 / 12 0 / 15 10 / 20 8 / 24 0' }],
      edgeCases: ['Adjacent buildings of equal height (no key point between)', 'Buildings sharing a left edge'],
      cues: ['Outline / maximum active height over x'],
      hints: ['Events: (left, −h) for starts and (right, h) for ends; sorting puts taller starts first.', 'Keep active heights in a multiset with 0; after each x, compare the max with the previous height.'],
      approach: 'Sorted events + multiset of heights.',
      correctness: 'The outline at x is the maximum height of buildings covering x; it only changes at event coordinates.',
      complexity: { time: 'O(n log n)', space: 'O(n)', why: 'Sorting + multiset operations.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <set>
#include <vector>
using namespace std;

vector<pair<long long, long long>> skyline(const vector<vector<long long>>& b) {
    vector<pair<long long, long long>> ev;
    for (auto& x : b) {
        ev.push_back({x[0], -x[2]});  // start: negative height sorts first
        ev.push_back({x[1], x[2]});
    }
    sort(ev.begin(), ev.end());
    multiset<long long> active = {0};
    vector<pair<long long, long long>> res;
    long long prev = 0;
    for (size_t i = 0; i < ev.size(); i++) {
        auto [x, h] = ev[i];
        if (h < 0) active.insert(-h);
        else active.erase(active.find(h));
        if (i + 1 < ev.size() && ev[i + 1].first == x) continue;  // finish all events at x
        long long cur = *active.rbegin();
        if (cur != prev) {
            res.push_back({x, cur});
            prev = cur;
        }
    }
    return res;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<vector<long long>> b(n, vector<long long>(3));
    for (auto& x : b) cin >> x[0] >> x[1] >> x[2];
    for (auto& [x, h] : skyline(b)) cout << x << " " << h << "\n";
    return 0;
}`,
      io: 'Input: n, then n lines "left right height". Output: key points, one per line.',
      keyLines: [
        { match: 'if (i + 1 < ev.size() && ev[i + 1].first == x) continue;  // finish all events at x', note: 'Only compare heights once all events at x are applied.' },
        { match: 'else active.erase(active.find(h));', note: 'Erase one copy — equal heights may be active twice.' },
      ],
      mistakes: ['multiset::erase(value) removes all equal heights', 'Emitting duplicate points at the same x'],
      tests: [
        { in: '5\n2 9 10\n3 7 15\n5 12 12\n15 20 10\n19 24 8', out: '2 10\n3 15\n7 12\n12 0\n15 10\n20 8\n24 0' },
        { in: '2\n0 2 3\n2 5 3', out: '0 3\n5 0' },
        { in: '1\n1 2 1', out: '1 1\n2 0' },
        { in: '2\n1 5 3\n1 5 7', out: '1 7\n5 0' },
      ],
    },
  ],
};

export default day;
