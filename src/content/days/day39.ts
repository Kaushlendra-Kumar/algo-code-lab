import type { DayModule } from '../../types/content';
import { cpp } from '../cpp';

const day: DayModule = {
  day: {
    day: 39,
    title: 'Implementation Craft: Matrices, Parsing and Edge Cases',
    zone: 'advanced',
    advanced: true,
    objectives: [
      'Traverse matrices with shrinking boundaries without off-by-one errors',
      'Transform arrays in place using index tricks',
      'Parse input defensively (signs, whitespace, overflow)',
      'Build a habit of listing edge cases before coding',
    ],
    prerequisites: ['Day 1: complexity and arrays', 'Day 14: bit manipulation'],
    lesson: [
      {
        heading: 'Boundaries as invariants',
        body: 'For spiral traversal keep four boundaries `top, bottom, left, right` that describe the unvisited rectangle. Each side you walk shrinks one boundary. Before walking the bottom row or left column, re-check that the rectangle is still non-empty — single rows and columns are where spiral code breaks.',
      },
      {
        heading: 'In-place tricks',
        body: '- Rotate 90° clockwise = transpose, then reverse every row.\n- Use the array itself as a hash: put value v at index v − 1 (first missing positive).\n- Use the first row/column as marker storage (set matrix zeroes).\nThese give O(1) extra space when the problem asks for it.',
      },
      {
        heading: 'Integer overflow',
        body: '`int` holds about ±2.1·10⁹. Danger zones: `(lo + hi) / 2` for large indices, `a * b` for values near 10⁵, sums of many values, and `abs(INT_MIN)`. Use `long long`, `lo + (hi − lo) / 2`, and check bounds *before* multiplying when parsing digits.',
      },
      {
        heading: 'Parsing without surprises',
        body: 'Read character by character: skip leading spaces, read an optional sign, then digits. Before `value = value * 10 + d`, check whether it would exceed the limit and clamp. Stop at the first non-digit.',
      },
      {
        heading: 'Edge-case checklist',
        body: 'Empty input · single element · all equal · already sorted / reverse sorted · negative numbers · zero · maximum values · duplicates · 1×n and n×1 matrices. Write them as tests *before* the code.',
      },
    ],
    recognition: [
      '"Return the elements in spiral / diagonal / zigzag order" → boundary simulation.',
      '"O(1) extra space" with values in 1..n → use indices as markers.',
      '"Parse", "convert", "validate" → careful state machine with explicit limits.',
    ],
    patterns: ['in-place-transform', 'invariant-reasoning', 'hash-lookup'],
    visualizations: ['complexity'],
    exampleA: {
      id: 'd39-A',
      title: 'Spiral order with shrinking boundaries',
      goal: 'Print a matrix in clockwise spiral order.',
      input: '3×4 matrix 1 2 3 4 / 5 6 7 8 / 9 10 11 12',
      output: 'spiral: 1 2 3 4 8 12 11 10 9 5 6 7',
      idea: 'Walk the top row, right column, bottom row and left column of the remaining rectangle, shrinking a boundary after each side. Guard the bottom and left walks so a single remaining row or column is not printed twice.',
      code: cpp`
#include <iostream>
#include <vector>
using namespace std;

vector<int> spiral(const vector<vector<int>>& m) {
    vector<int> out;
    int top = 0, bottom = m.size() - 1, left = 0, right = m[0].size() - 1;
    while (top <= bottom && left <= right) {
        for (int c = left; c <= right; c++) out.push_back(m[top][c]);
        top++;
        for (int r = top; r <= bottom; r++) out.push_back(m[r][right]);
        right--;
        if (top <= bottom) {  //@gap
            for (int c = right; c >= left; c--) out.push_back(m[bottom][c]);
            bottom--;
        }
        if (left <= right) {  //@gap
            for (int r = bottom; r >= top; r--) out.push_back(m[r][left]);
            left++;
        }
    }
    return out;
}

int main() {
    vector<vector<int>> m = {{1, 2, 3, 4}, {5, 6, 7, 8}, {9, 10, 11, 12}};
    cout << "spiral:";
    for (int x : spiral(m)) cout << " " << x;
    cout << "\n";
    return 0;
}`,
      keyLines: [
        { match: 'int top = 0, bottom = m.size() - 1, left = 0, right = m[0].size() - 1;', note: 'Inclusive boundaries of the unvisited rectangle.' },
        { match: 'top++;', note: 'The top row is done: shrink.' },
        { match: 'if (top <= bottom) {', note: 'A bottom row still exists — otherwise we would re-print the row we just walked.' },
        { match: 'if (left <= right) {', note: 'Same guard for the left column.' },
      ],
      dryRun: {
        columns: ['side', 'cells', 'boundaries after'],
        rows: [
          ['top row', '1 2 3 4', 'top=1'],
          ['right column', '8 12', 'right=2'],
          ['bottom row', '11 10 9', 'bottom=1'],
          ['left column', '5', 'left=1'],
          ['top row', '6 7', 'top=2 > bottom → stop'],
        ],
      },
      complexity: { time: 'O(R · C)', space: 'O(1) besides the output', why: 'Every cell is output exactly once.' },
      edgeCases: ['Single row', 'Single column', '1×1', 'Non-square matrices'],
      mistakes: ['Missing the guards → duplicated middle row/column', 'Using unsigned sizes so bottom = −1 wraps around'],
      tryIt: 'Run the code on a 3×1 matrix with the guards removed and compare.',
      bug: {
        find: 'if (top <= bottom) {',
        replace: 'if (true) {',
        symptom: 'The program prints "spiral: 1 2 3 4 8 12 11 10 9 5 6 7 6" — the middle row is walked twice.',
        explanation: 'After the last top-row walk, top > bottom, so the "bottom row" is the same row again. The guard prevents re-reading it.',
      },
    },
    exampleB: {
      id: 'd39-B',
      kind: 'edge-case',
      title: 'Overflow traps and their fixes',
      goal: 'See three classic overflow bugs and the safe alternatives side by side.',
      input: 'lo = 2 000 000 000, hi = 2 100 000 000; a = b = 100 000; INT_MIN',
      output: 'safe midpoint = 2050000000\nproduct as long long = 10000000000\n|INT_MIN| as long long = 2147483648\nsum of 3 x 2e9 = 6000000000',
      idea: 'Compute in a type that can hold the result before the operation happens, and rewrite formulas so intermediate values stay small.',
      code: cpp`
#include <climits>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    int lo = 2000000000, hi = 2100000000;
    // (lo + hi) / 2 would overflow int: lo + hi > INT_MAX.
    int mid = lo + (hi - lo) / 2;
    cout << "safe midpoint = " << mid << "\n";

    int a = 100000, b = 100000;
    // a * b is computed in int and overflows before any conversion.
    long long product = (long long)a * b;
    cout << "product as long long = " << product << "\n";

    int x = INT_MIN;
    // -x is undefined for INT_MIN; widen first.
    long long magnitude = -(long long)x;
    cout << "|INT_MIN| as long long = " << magnitude << "\n";

    vector<int> big = {2000000000, 2000000000, 2000000000};
    long long sum = 0;  // an int accumulator would overflow
    for (int v : big) sum += v;
    cout << "sum of 3 x 2e9 = " << sum << "\n";
    return 0;
}`,
      keyLines: [
        { match: 'int mid = lo + (hi - lo) / 2;', note: 'hi − lo is small, so nothing overflows.' },
        { match: 'long long product = (long long)a * b;', note: 'Cast one operand *before* multiplying.' },
        { match: 'long long magnitude = -(long long)x;', note: 'Negating INT_MIN in int is undefined behaviour.' },
        { match: 'long long sum = 0;  // an int accumulator would overflow', note: 'The accumulator type decides the arithmetic type of +=.' },
      ],
      complexity: { time: 'O(1) per operation', space: 'O(1)', why: 'Only the types change, not the algorithm.' },
      edgeCases: ['Signed overflow is undefined behaviour in C++ — the compiler may assume it never happens', 'unsigned wraps around silently'],
      mistakes: ['(long long)(a * b) — the cast comes too late', 'Using abs() on INT_MIN'],
      tryIt: 'Compile int bad = a * b; with -fsanitize=undefined and read the runtime error.',
    },
    complexityNotes: 'Implementation problems are usually O(input size). The difficulty is correctness: boundaries, overflow and edge cases. Sanitizers (-fsanitize=address,undefined) catch many mistakes automatically.',
    quiz: [
      {
        prompt: 'Rotating a square matrix 90° clockwise in place can be done by…',
        options: ['Reversing columns only', 'Transposing, then reversing each row', 'Sorting rows', 'Swapping diagonals only'],
        answer: 1,
        explanation: 'Transpose maps (r, c) → (c, r); reversing rows maps that to (c, n − 1 − r), the clockwise rotation.',
      },
      {
        prompt: 'Which midpoint formula cannot overflow for 0 ≤ lo ≤ hi ≤ INT_MAX?',
        options: ['(lo + hi) / 2', 'lo + (hi − lo) / 2', '(lo * hi) / 2', 'hi / 2 + lo'],
        answer: 1,
        explanation: 'hi − lo fits in int and the result lies between lo and hi.',
      },
      {
        prompt: 'In (long long)(a * b) with int a, b, when does overflow happen?',
        options: ['Never', 'Inside a * b, before the cast', 'During the cast', 'Only if the result is negative'],
        answer: 1,
        explanation: 'The multiplication is done in int first.',
      },
    ],
    recap: 'Treat boundaries as invariants, prefer in-place index tricks when space is limited, widen types before arithmetic, and enumerate edge cases before writing code.',
    nextPrep: 'Tomorrow: the final mixed review — interview-style problems that combine everything.',
  },
  questions: [
    {
      id: 'd39-merge-alternately',
      day: 39,
      title: 'Interleaving Two Names',
      difficulty: 'Easy',
      topic: 'advanced',
      patterns: ['two-pointers-same'],
      objective: 'Two indices with unequal lengths.',
      statement: 'Merge two words by alternating letters starting with the first word; append the rest of the longer word.',
      constraints: ['1 ≤ lengths ≤ 100'],
      examples: [{ input: 'abc pqrs', output: 'apbqcrs' }],
      edgeCases: ['Equal lengths', 'One letter each'],
      cues: ['Alternate between sequences'],
      hints: ['Loop while either index is in range.'],
      approach: 'Single loop over max length.',
      correctness: 'Position i contributes a[i] then b[i] when they exist.',
      complexity: { time: 'O(n + m)', space: 'O(n + m)', why: 'Output size.' },
      cpp: cpp`
#include <iostream>
#include <string>
using namespace std;

string mergeAlternately(const string& a, const string& b) {
    string out;
    for (size_t i = 0; i < a.size() || i < b.size(); i++) {
        if (i < a.size()) out += a[i];
        if (i < b.size()) out += b[i];
    }
    return out;
}`,
      main: cpp`
int main() {
    string a, b;
    cin >> a >> b;
    cout << mergeAlternately(a, b) << "\n";
    return 0;
}`,
      io: 'Input: two words. Output: merged word.',
      keyLines: [{ match: 'for (size_t i = 0; i < a.size() || i < b.size(); i++) {', note: 'Continue until both are exhausted.' }],
      mistakes: ['Stopping at the shorter length and forgetting the tail'],
      tests: [
        { in: 'abc pqrs', out: 'apbqcrs' },
        { in: 'ab pq', out: 'apbq' },
        { in: 'abcd p', out: 'apbcd' },
        { in: 'x y', out: 'xy' },
      ],
    },
    {
      id: 'd39-spiral',
      day: 39,
      title: 'Snail Walk Through a Grid',
      difficulty: 'Medium',
      topic: 'advanced',
      patterns: ['invariant-reasoning', 'in-place-transform'],
      objective: 'Boundary simulation with guards.',
      statement: 'Print the elements of an R×C matrix in clockwise spiral order.',
      constraints: ['1 ≤ R, C ≤ 100'],
      examples: [{ input: '123 / 456 / 789', output: '1 2 3 6 9 8 7 4 5' }],
      edgeCases: ['Single row/column'],
      cues: ['Spiral order'],
      hints: ['Four boundaries, guard the bottom and left walks.'],
      approach: 'Shrinking rectangle.',
      correctness: 'Each walk outputs one side of the current rectangle exactly once.',
      complexity: { time: 'O(R · C)', space: 'O(1) extra', why: 'Each cell once.' },
      cpp: cpp`
#include <iostream>
#include <vector>
using namespace std;

vector<int> spiralOrder(const vector<vector<int>>& m) {
    vector<int> out;
    int top = 0, bottom = m.size() - 1, left = 0, right = m[0].size() - 1;
    while (top <= bottom && left <= right) {
        for (int c = left; c <= right; c++) out.push_back(m[top][c]);
        for (int r = ++top; r <= bottom; r++) out.push_back(m[r][right]);
        --right;
        if (top <= bottom) {
            for (int c = right; c >= left; c--) out.push_back(m[bottom][c]);
            --bottom;
        }
        if (left <= right) {
            for (int r = bottom; r >= top; r--) out.push_back(m[r][left]);
            ++left;
        }
    }
    return out;
}`,
      main: cpp`
int main() {
    int R, C;
    cin >> R >> C;
    vector<vector<int>> m(R, vector<int>(C));
    for (auto& row : m)
        for (auto& x : row) cin >> x;
    auto out = spiralOrder(m);
    for (size_t i = 0; i < out.size(); i++) cout << (i ? " " : "") << out[i];
    cout << "\n";
    return 0;
}`,
      io: 'Input: R C, then the matrix. Output: spiral order.',
      keyLines: [{ match: 'if (left <= right) {', note: 'Without this guard a single column is printed twice.' }],
      mistakes: ['Missing guards'],
      tests: [
        { in: '3 3\n1 2 3\n4 5 6\n7 8 9', out: '1 2 3 6 9 8 7 4 5' },
        { in: '3 4\n1 2 3 4\n5 6 7 8\n9 10 11 12', out: '1 2 3 4 8 12 11 10 9 5 6 7' },
        { in: '1 3\n1 2 3', out: '1 2 3' },
        { in: '3 1\n1\n2\n3', out: '1 2 3' },
      ],
    },
    {
      id: 'd39-rotate',
      day: 39,
      title: 'Turning the Photo',
      difficulty: 'Medium',
      topic: 'advanced',
      patterns: ['in-place-transform'],
      objective: 'Transpose + reverse rows.',
      statement: 'Rotate an n×n matrix 90° clockwise in place and print it.',
      constraints: ['1 ≤ n ≤ 20'],
      examples: [{ input: '123 / 456 / 789', output: '741 / 852 / 963' }],
      edgeCases: ['n = 1'],
      cues: ['Rotate in place'],
      hints: ['Swap m[i][j] with m[j][i] for j > i, then reverse each row.'],
      approach: 'Transpose then reverse.',
      correctness: '(r, c) → (c, r) → (c, n − 1 − r) is the clockwise rotation.',
      complexity: { time: 'O(n²)', space: 'O(1)', why: 'Each element moved a constant number of times.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

void rotate(vector<vector<int>>& m) {
    int n = m.size();
    for (int i = 0; i < n; i++)
        for (int j = i + 1; j < n; j++) swap(m[i][j], m[j][i]);
    for (auto& row : m) reverse(row.begin(), row.end());
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<vector<int>> m(n, vector<int>(n));
    for (auto& row : m)
        for (auto& x : row) cin >> x;
    rotate(m);
    for (auto& row : m) {
        for (int j = 0; j < n; j++) cout << (j ? " " : "") << row[j];
        cout << "\n";
    }
    return 0;
}`,
      io: 'Input: n, then the matrix. Output: rotated matrix.',
      keyLines: [{ match: 'for (int j = i + 1; j < n; j++) swap(m[i][j], m[j][i]);', note: 'j starts at i + 1, otherwise every pair is swapped twice.' }],
      mistakes: ['j from 0 (undoes the transpose)'],
      tests: [
        { in: '3\n1 2 3\n4 5 6\n7 8 9', out: '7 4 1\n8 5 2\n9 6 3' },
        { in: '1\n5', out: '5' },
        { in: '2\n1 2\n3 4', out: '3 1\n4 2' },
        { in: '4\n5 1 9 11\n2 4 8 10\n13 3 6 7\n15 14 12 16', out: '15 13 2 5\n14 3 4 1\n12 6 8 9\n16 7 10 11' },
      ],
    },
    {
      id: 'd39-atoi',
      day: 39,
      title: 'Reading a Number from a Form',
      difficulty: 'Medium',
      topic: 'advanced',
      patterns: ['invariant-reasoning'],
      objective: 'Parse with clamping, without overflow.',
      statement: 'Convert a line to a 32-bit integer: skip leading spaces, optional + or −, then digits until a non-digit. Clamp to [−2³¹, 2³¹ − 1]. Print 0 if no digits.',
      constraints: ['0 ≤ length ≤ 200'],
      examples: [{ input: '"   -42abc"', output: '-42' }],
      edgeCases: ['Empty line', 'Only a sign', 'Huge numbers', 'Leading zeros'],
      cues: ['Parse + clamp'],
      hints: ['Accumulate in long long and clamp as soon as the value exceeds 2³¹.'],
      approach: 'Character state machine with early clamping.',
      correctness: 'Once the magnitude exceeds 2³¹ the clamped result cannot change, so stopping is safe.',
      complexity: { time: 'O(length)', space: 'O(1)', why: 'Single scan.' },
      cpp: cpp`
#include <cctype>
#include <climits>
#include <iostream>
#include <string>
using namespace std;

int myAtoi(const string& s) {
    size_t i = 0;
    while (i < s.size() && s[i] == ' ') i++;
    int sign = 1;
    if (i < s.size() && (s[i] == '+' || s[i] == '-')) sign = s[i++] == '-' ? -1 : 1;
    long long val = 0;
    while (i < s.size() && isdigit((unsigned char)s[i])) {
        val = val * 10 + (s[i++] - '0');
        if (val > (long long)INT_MAX + 1) break;  // already beyond any clamp
    }
    val *= sign;
    if (val > INT_MAX) return INT_MAX;
    if (val < INT_MIN) return INT_MIN;
    return (int)val;
}`,
      main: cpp`
int main() {
    string line;
    getline(cin, line);
    cout << myAtoi(line) << "\n";
    return 0;
}`,
      io: 'Input: one line. Output: the parsed integer.',
      keyLines: [{ match: 'if (val > (long long)INT_MAX + 1) break;  // already beyond any clamp', note: 'Stops long digit strings from overflowing long long too.' }],
      mistakes: ['Overflowing long long with 30 digits', 'Accepting a second sign'],
      tests: [
        { in: '   -42abc', out: '-42' },
        { in: '4193 with words', out: '4193' },
        { in: '-91283472332', out: '-2147483648' },
        { in: '+-12', out: '0' },
      ],
    },
    {
      id: 'd39-sudoku',
      day: 39,
      title: 'Checking a Puzzle Grid',
      difficulty: 'Medium',
      topic: 'advanced',
      patterns: ['hash-lookup', 'bit-masks'],
      objective: 'Validate rows, columns and boxes with bitmasks.',
      statement: 'Given a 9×9 Sudoku with "." for empty cells, print YES if no row, column or 3×3 box contains a digit twice, else NO.',
      constraints: ['Exactly 9 rows of 9 characters'],
      examples: [{ input: 'standard partially filled board', output: 'YES' }],
      edgeCases: ['Empty board → YES'],
      cues: ['Uniqueness across several groupings'],
      hints: ['Box index = (r / 3) * 3 + c / 3.', 'One 9-bit mask per row, column and box.'],
      approach: 'Single pass with 27 bitmasks.',
      correctness: 'A digit is rejected exactly when it was already recorded in one of its three groups.',
      complexity: { time: 'O(81)', space: 'O(27)', why: 'Fixed board.' },
      cpp: cpp`
#include <iostream>
#include <string>
#include <vector>
using namespace std;

bool validSudoku(const vector<string>& b) {
    int rows[9] = {}, cols[9] = {}, boxes[9] = {};
    for (int r = 0; r < 9; r++)
        for (int c = 0; c < 9; c++) {
            if (b[r][c] == '.') continue;
            int bit = 1 << (b[r][c] - '1'), box = (r / 3) * 3 + c / 3;
            if ((rows[r] & bit) || (cols[c] & bit) || (boxes[box] & bit)) return false;
            rows[r] |= bit;
            cols[c] |= bit;
            boxes[box] |= bit;
        }
    return true;
}`,
      main: cpp`
int main() {
    vector<string> b(9);
    for (auto& row : b) cin >> row;
    cout << (validSudoku(b) ? "YES" : "NO") << "\n";
    return 0;
}`,
      io: 'Input: 9 lines of 9 characters. Output: YES or NO.',
      keyLines: [{ match: 'int bit = 1 << (b[r][c] - \'1\'), box = (r / 3) * 3 + c / 3;', note: 'Digit d ↦ bit d − 1; boxes numbered row-major.' }],
      mistakes: ['Box index r / 3 + c / 3 (collides)'],
      tests: [
        { in: '53..7....\n6..195...\n.98....6.\n8...6...3\n4..8.3..1\n7...2...6\n.6....28.\n...419..5\n....8..79', out: 'YES' },
        { in: '83..7....\n6..195...\n.98....6.\n8...6...3\n4..8.3..1\n7...2...6\n.6....28.\n...419..5\n....8..79', out: 'NO' },
        { in: '.........\n.........\n.........\n.........\n.........\n.........\n.........\n.........\n.........', out: 'YES' },
        { in: '1........\n.1.......\n.........\n.........\n.........\n.........\n.........\n.........\n.........', out: 'NO' },
      ],
    },
    {
      id: 'd39-set-zeroes',
      day: 39,
      title: 'Spreading the Blackout',
      difficulty: 'Medium',
      topic: 'advanced',
      patterns: ['in-place-transform'],
      objective: 'Use the first row/column as marker storage.',
      statement: 'If a cell is 0, set its entire row and column to 0. Do it in place with O(1) extra space and print the matrix.',
      constraints: ['1 ≤ R, C ≤ 200'],
      examples: [{ input: '111 / 101 / 111', output: '101 / 000 / 101' }],
      edgeCases: ['Zero in the first row or column'],
      cues: ['O(1) space, row/column flags'],
      hints: ['Remember separately whether the first row/column themselves contain a zero.'],
      approach: 'Mark in row 0 / column 0, apply, then handle the first row/column last.',
      correctness: 'Markers are written only into cells that will be zeroed anyway.',
      complexity: { time: 'O(R · C)', space: 'O(1)', why: 'Two booleans.' },
      cpp: cpp`
#include <iostream>
#include <vector>
using namespace std;

void setZeroes(vector<vector<int>>& m) {
    int R = m.size(), C = m[0].size();
    bool firstRow = false, firstCol = false;
    for (int c = 0; c < C; c++) firstRow |= m[0][c] == 0;
    for (int r = 0; r < R; r++) firstCol |= m[r][0] == 0;
    for (int r = 1; r < R; r++)
        for (int c = 1; c < C; c++)
            if (m[r][c] == 0) m[r][0] = m[0][c] = 0;
    for (int r = 1; r < R; r++)
        for (int c = 1; c < C; c++)
            if (m[r][0] == 0 || m[0][c] == 0) m[r][c] = 0;
    if (firstRow)
        for (int c = 0; c < C; c++) m[0][c] = 0;
    if (firstCol)
        for (int r = 0; r < R; r++) m[r][0] = 0;
}`,
      main: cpp`
int main() {
    int R, C;
    cin >> R >> C;
    vector<vector<int>> m(R, vector<int>(C));
    for (auto& row : m)
        for (auto& x : row) cin >> x;
    setZeroes(m);
    for (auto& row : m) {
        for (int c = 0; c < C; c++) cout << (c ? " " : "") << row[c];
        cout << "\n";
    }
    return 0;
}`,
      io: 'Input: R C, then the matrix. Output: the modified matrix.',
      keyLines: [{ match: 'if (m[r][c] == 0) m[r][0] = m[0][c] = 0;', note: 'Markers live in the first row/column.' }],
      mistakes: ['Zeroing immediately (new zeros cascade)'],
      tests: [
        { in: '3 3\n1 1 1\n1 0 1\n1 1 1', out: '1 0 1\n0 0 0\n1 0 1' },
        { in: '3 4\n0 1 2 0\n3 4 5 2\n1 3 1 5', out: '0 0 0 0\n0 4 5 0\n0 3 1 0' },
        { in: '1 1\n5', out: '5' },
        { in: '2 2\n1 2\n3 0', out: '1 0\n0 0' },
      ],
    },
    {
      id: 'd39-majority-ii',
      day: 39,
      title: 'Frequent Voters',
      difficulty: 'Medium',
      topic: 'advanced',
      patterns: ['invariant-reasoning', 'frequency-counting'],
      objective: 'Boyer–Moore voting with two candidates.',
      statement: 'Print, in ascending order, all values appearing more than ⌊n/3⌋ times, or "-" if none. Use O(1) extra space.',
      constraints: ['1 ≤ n ≤ 5·10⁴'],
      examples: [{ input: '3 2 3', output: '3' }],
      edgeCases: ['Two answers', 'No answer'],
      cues: ['"more than n/3" → at most two candidates'],
      hints: ['Keep two candidates with counters; cancel triples.', 'Verify candidates with a second pass.'],
      approach: 'Extended Boyer–Moore + verification.',
      correctness: 'Removing three distinct values at a time never removes all copies of a value occurring more than n/3 times.',
      complexity: { time: 'O(n)', space: 'O(1)', why: 'Two passes.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

vector<int> majorityThird(const vector<int>& a) {
    int c1 = 0, c2 = 1, n1 = 0, n2 = 0;  // distinct initial candidates
    for (int x : a) {
        if (x == c1) n1++;
        else if (x == c2) n2++;
        else if (n1 == 0) c1 = x, n1 = 1;
        else if (n2 == 0) c2 = x, n2 = 1;
        else n1--, n2--;
    }
    vector<int> res;
    for (int c : {c1, c2})
        if (count(a.begin(), a.end(), c) > (int)a.size() / 3) res.push_back(c);
    sort(res.begin(), res.end());
    res.erase(unique(res.begin(), res.end()), res.end());
    return res;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (auto& x : a) cin >> x;
    auto res = majorityThird(a);
    if (res.empty()) cout << "-";
    for (size_t i = 0; i < res.size(); i++) cout << (i ? " " : "") << res[i];
    cout << "\n";
    return 0;
}`,
      io: 'Input: n, then n values. Output: values ascending, or "-".',
      keyLines: [{ match: 'else n1--, n2--;', note: 'Cancel one copy of each candidate together with x.' }],
      mistakes: ['Skipping the verification pass'],
      tests: [
        { in: '3\n3 2 3', out: '3' },
        { in: '1\n1', out: '1' },
        { in: '2\n1 2', out: '1 2' },
        { in: '6\n1 2 3 4 5 6', out: '-' },
      ],
    },
    {
      id: 'd39-first-missing',
      day: 39,
      title: 'Lowest Free Locker',
      difficulty: 'Hard',
      topic: 'advanced',
      patterns: ['in-place-transform', 'hash-lookup'],
      objective: 'Use indices as a hash table (cyclic placement).',
      statement: 'Print the smallest positive integer that does not appear in the array, in O(n) time and O(1) extra space.',
      constraints: ['1 ≤ n ≤ 10⁵', '|a[i]| ≤ 2³¹ − 1'],
      examples: [{ input: '3 4 -1 1', output: '2' }],
      edgeCases: ['1..n all present → n + 1', 'Duplicates', 'All negative → 1'],
      cues: ['Answer must be in 1..n+1; O(1) space'],
      hints: ['Swap value v into index v − 1 while it is in range and not already there.'],
      approach: 'Cyclic placement, then scan for the first mismatch.',
      correctness: 'After placement, a[i] == i + 1 for every present value in 1..n; the first failure is the answer.',
      complexity: { time: 'O(n)', space: 'O(1)', why: 'Each swap places one value permanently.' },
      cpp: cpp`
#include <iostream>
#include <utility>
#include <vector>
using namespace std;

int firstMissingPositive(vector<long long> a) {
    int n = a.size();
    for (int i = 0; i < n; i++)
        while (a[i] >= 1 && a[i] <= n && a[a[i] - 1] != a[i]) swap(a[i], a[a[i] - 1]);
    for (int i = 0; i < n; i++)
        if (a[i] != i + 1) return i + 1;
    return n + 1;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<long long> a(n);
    for (auto& x : a) cin >> x;
    cout << firstMissingPositive(a) << "\n";
    return 0;
}`,
      io: 'Input: n, then n integers. Output: smallest missing positive.',
      keyLines: [{ match: 'while (a[i] >= 1 && a[i] <= n && a[a[i] - 1] != a[i]) swap(a[i], a[a[i] - 1]);', note: 'The duplicate check stops infinite swapping.' }],
      mistakes: ['Checking a[i] != i + 1 instead of the target slot (loops forever on duplicates)'],
      tests: [
        { in: '4\n3 4 -1 1', out: '2' },
        { in: '3\n1 2 0', out: '3' },
        { in: '5\n7 8 9 11 12', out: '1' },
        { in: '4\n1 1 2 2', out: '3' },
      ],
    },
  ],
};

export default day;
