import type { DayModule } from '../../types/content';
import { cpp } from '../cpp';
import { TRACE_CODE } from '../traceCode';

const day: DayModule = {
  day: {
    day: 10,
    title: 'Stacks, Queues, Deques and Monotonic Structures',
    zone: 'stacks-queues',
    objectives: [
      'Use std::stack, std::queue and std::deque correctly and safely',
      'Match nested structures (brackets, expressions) with a stack',
      'Solve next-greater/smaller problems with a monotonic stack in O(n)',
      'Maintain a sliding-window maximum with a monotonic deque',
    ],
    prerequisites: ['Day 5: sliding windows', 'Day 1: amortised thinking about loops'],
    lesson: [
      {
        heading: 'LIFO and FIFO',
        body: 'A **stack** returns the most recent item first (push/pop/top). A **queue** returns the oldest item first (push/pop/front). A **deque** allows push and pop at both ends. All operations are O(1). Calling `top()`, `front()` or `pop()` on an empty container is undefined behaviour — always check `empty()`.',
      },
      {
        heading: 'Stacks model nesting',
        body: 'Whenever the most recently opened thing must close first — brackets, function calls, HTML tags, undo — a stack holds the currently open items.',
      },
      {
        heading: 'Monotonic stacks',
        body: 'Keep the stack sorted (e.g. values decreasing from bottom to top). When a new element breaks the order, pop the elements it beats: for each popped index, the new element is its **next greater element**. Every index is pushed and popped at most once, so the nested while loop is O(n) in total.',
      },
      {
        heading: 'Monotonic deques',
        body: 'For the maximum of each window of size k, keep indices in a deque with **decreasing values**. Pop from the back while the new value is ≥ the back (those can never be a maximum again); pop from the front when the index leaves the window. The front is always the current maximum.',
      },
      {
        heading: 'Choosing between them',
        body: 'Previous/next greater or smaller → monotonic stack. Max/min of a moving window → monotonic deque. Level-by-level processing → queue. Matching/undo → stack.',
      },
    ],
    recognition: [
      '"Next greater/warmer/taller", "how many days until" → monotonic stack.',
      '"Maximum of every window of size k" → monotonic deque.',
      'Brackets, expressions, nested structures → stack.',
      'An element can only matter until something bigger arrives → it is safe to pop it.',
    ],
    patterns: ['monotonic-stack-decreasing', 'monotonic-queue', 'expression-parsing', 'next-greater-element', 'amortized-analysis'],
    visualizations: ['stack-queue'],
    exampleA: {
      id: 'd10-A',
      title: 'Next greater element with a monotonic stack',
      goal: 'For every element, find the first larger element to its right (or −1).',
      input: 'a = {2, 1, 2, 4, 3}',
      output: 'next greater: 4 2 4 -1 -1',
      idea: 'The stack holds indices still waiting for a greater element; their values decrease from bottom to top. A new value resolves every waiting index with a smaller value.',
      code: TRACE_CODE['next-greater'],
      keyLines: [
        { match: 'vector<int> ans(n, -1);', note: 'Default answer for elements that never find a greater one.' },
        { match: 'while (!st.empty() && a[st.top()] < a[i]) {', note: 'Check emptiness first; < means equal values do not resolve each other.' },
        { match: 'ans[st.top()] = a[i];', note: 'a[i] is the first greater element for the popped index.' },
        { match: 'st.push(i);', note: 'Push the index (not the value) so we know where to write the answer.' },
      ],
      complexity: { time: 'O(n)', space: 'O(n)', why: 'Each index is pushed once and popped at most once (amortised O(1) per element).' },
      edgeCases: ['Strictly decreasing array → all −1', 'Equal neighbours (2, 2) do not count as greater', 'Single element'],
      mistakes: ['Storing values instead of indices', 'Calling st.top() on an empty stack'],
      tryIt: 'Change the program to output, for each day, how many days you wait until a warmer one (ans[j] = i − j).',
      trace: { id: 'next-greater', input: { a: [2, 1, 2, 4, 3] } },
      bug: {
        find: 'while (!st.empty() && a[st.top()] < a[i]) {',
        replace: 'while (!st.empty() && a[st.top()] <= a[i]) {',
        symptom: 'The program prints "next greater: 2 2 4 -1 -1" — index 0 (value 2) is answered by another 2.',
        explanation: '"Greater" means strictly greater. With <= an equal value pops the earlier index and is recorded as its answer.',
      },
    },
    exampleB: {
      id: 'd10-B',
      kind: 'variant',
      title: 'Sliding-window maximum with a monotonic deque',
      goal: 'Print the maximum of every window of size k.',
      input: 'a = {1, 3, -1, -3, 5, 3, 6, 7}, k = 3',
      output: '3 3 5 5 6 7',
      idea: 'Indices in the deque have decreasing values. A new value removes all smaller values from the back (they can never be a future maximum). The front leaves when it falls out of the window.',
      code: cpp`
#include <deque>
#include <iostream>
#include <vector>
using namespace std;

vector<int> windowMax(const vector<int>& a, int k) {
    deque<int> dq;  // indices; values decrease from front to back
    vector<int> out;
    for (int i = 0; i < (int)a.size(); i++) {
        if (!dq.empty() && dq.front() <= i - k) dq.pop_front();          //@gap
        while (!dq.empty() && a[dq.back()] <= a[i]) dq.pop_back();       //@gap
        dq.push_back(i);
        if (i >= k - 1) out.push_back(a[dq.front()]);
    }
    return out;
}

int main() {
    vector<int> a = {1, 3, -1, -3, 5, 3, 6, 7};
    vector<int> out = windowMax(a, 3);
    for (size_t i = 0; i < out.size(); i++) cout << out[i] << (i + 1 < out.size() ? " " : "\n");
    return 0;
}`,
      keyLines: [
        { match: 'if (!dq.empty() && dq.front() <= i - k) dq.pop_front();', note: 'The front index is outside the window [i − k + 1, i].' },
        { match: 'while (!dq.empty() && a[dq.back()] <= a[i]) dq.pop_back();', note: 'Smaller (or equal) older values are dominated by a[i] forever.' },
        { match: 'if (i >= k - 1) out.push_back(a[dq.front()]);', note: 'The first full window ends at index k − 1.' },
      ],
      dryRun: {
        columns: ['i', 'a[i]', 'deque (index:value)', 'window max'],
        rows: [
          ['0', '1', '0:1', '—'],
          ['1', '3', '1:3', '—'],
          ['2', '−1', '1:3 2:−1', '3'],
          ['3', '−3', '1:3 2:−1 3:−3', '3'],
          ['4', '5', '4:5', '5'],
          ['5', '3', '4:5 5:3', '5'],
          ['6', '6', '6:6', '6'],
          ['7', '7', '7:7', '7'],
        ],
      },
      complexity: { time: 'O(n)', space: 'O(k)', why: 'Each index enters and leaves the deque once; at most k indices are inside.' },
      edgeCases: ['k = 1 → the array itself', 'k = n → one maximum', 'Decreasing array keeps the deque full'],
      mistakes: ['Storing values (cannot tell when they leave the window)', 'Checking the window before pushing the current index'],
      tryIt: 'Change it to produce the minimum of each window (flip the comparison).',
    },
    complexityNotes: 'Monotonic stacks and deques are O(n) by amortised analysis: total pops ≤ total pushes = n. Bracket matching is O(n) time and O(n) stack space in the worst case.',
    quiz: [
      {
        prompt: 'Why is the monotonic-stack next-greater algorithm O(n) despite the nested while loop?',
        options: ['The while loop runs at most once', 'Each index is pushed once and popped at most once overall', 'Stacks are O(1)', 'n is small'],
        answer: 1,
        explanation: 'The total number of pops over the whole run is at most n.',
      },
      {
        prompt: 'Sliding-window maximum: a new value 5 arrives and the deque back holds value 3. What happens to 3?',
        options: ['It stays', 'It is popped — it can never be the maximum while 5 is in the window', 'It moves to the front', 'The window shrinks'],
        answer: 1,
        explanation: '5 is newer and larger, so it outlives and outranks 3.',
      },
      {
        prompt: 'What does `st.top()` do on an empty std::stack?',
        options: ['Returns 0', 'Throws', 'Undefined behaviour', 'Returns a default value'],
        answer: 2,
        explanation: 'Always check st.empty() first.',
      },
    ],
    recap: 'Stacks track open/nested items and power monotonic "next greater" scans; deques give window maxima. Popping dominated elements keeps everything O(n).',
    nextPrep: 'Tomorrow: recursion. The call stack you will see is the same LIFO idea, managed by the language.',
  },
  questions: [
    {
      id: 'd10-valid-brackets',
      day: 10,
      title: 'Balanced Brackets',
      difficulty: 'Easy',
      topic: 'stacks-queues',
      patterns: ['expression-parsing'],
      objective: 'Match nested brackets with a stack.',
      statement: 'A string contains only ()[]{}. Print `true` if every bracket is closed by the same type in the correct order.',
      constraints: ['1 ≤ |s| ≤ 10⁴'],
      examples: [{ input: 's = "([]{})"', output: 'true' }, { input: 's = "(]"', output: 'false' }],
      edgeCases: ['Starts with a closing bracket', 'Unclosed opening brackets at the end'],
      cues: ['Most recent opening must close first → stack'],
      hints: ['Push opening brackets.', 'On a closing bracket the stack top must be its partner.', 'At the end the stack must be empty.'],
      approach: 'Stack of opening brackets with a partner check.',
      correctness: 'The stack always holds the unmatched openings in order; a valid string closes them in reverse order.',
      complexity: { time: 'O(n)', space: 'O(n)', why: 'One pass; stack up to n.' },
      cpp: cpp`
#include <iostream>
#include <stack>
#include <string>
using namespace std;

bool isValid(const string& s) {
    stack<char> st;
    for (char c : s) {
        if (c == '(' || c == '[' || c == '{') {
            st.push(c);
            continue;
        }
        if (st.empty()) return false;
        char open = st.top();
        st.pop();
        if ((c == ')' && open != '(') || (c == ']' && open != '[') || (c == '}' && open != '{')) return false;
    }
    return st.empty();
}`,
      main: cpp`
int main() {
    string s;
    cin >> s;
    cout << (isValid(s) ? "true" : "false") << "\n";
    return 0;
}`,
      io: 'Input: one string. Output: true or false.',
      keyLines: [{ match: 'if (st.empty()) return false;', note: 'A closing bracket with nothing open is invalid.' }],
      mistakes: ['Forgetting the final emptiness check'],
      tests: [
        { in: '([]{})', out: 'true' },
        { in: '(]', out: 'false' },
        { in: ')(', out: 'false' },
        { in: '((', out: 'false' },
      ],
      viz: 'stack-queue',
    },
    {
      id: 'd10-min-stack',
      day: 10,
      title: 'Stack With Instant Minimum',
      difficulty: 'Medium',
      topic: 'stacks-queues',
      patterns: ['running-aggregate', 'expression-parsing'],
      objective: 'Store the running minimum alongside each element.',
      statement: 'Process operations on a stack: `push x`, `pop`, `top`, `min`. For `top` and `min` print the value. All pops/queries are on a non-empty stack.',
      constraints: ['1 ≤ operations ≤ 10⁵'],
      examples: [{ input: 'push 3, push 1, min, pop, min', output: '1\n3' }],
      edgeCases: ['Duplicate minimum values', 'Pop the current minimum'],
      cues: ['O(1) minimum with push/pop → each entry remembers the minimum below it'],
      hints: ['When you pop the minimum, what is the new minimum?', 'Store pairs (value, min so far).'],
      approach: 'Stack of pairs (value, min(value, previous min)).',
      correctness: 'Each entry\'s stored minimum is the minimum of itself and everything below it, which is unchanged by later pushes.',
      complexity: { time: 'O(1) per operation', space: 'O(n)', why: 'Constant work per push/pop/query.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <stack>
#include <string>
using namespace std;

struct MinStack {
    stack<pair<long long, long long>> st;  // (value, minimum so far)
    void push(long long x) { st.push({x, st.empty() ? x : min(x, st.top().second)}); }
    void pop() { st.pop(); }
    long long top() const { return st.top().first; }
    long long getMin() const { return st.top().second; }
};`,
      main: cpp`
int main() {
    int q;
    cin >> q;
    MinStack ms;
    while (q--) {
        string op;
        cin >> op;
        if (op == "push") {
            long long x;
            cin >> x;
            ms.push(x);
        } else if (op == "pop") ms.pop();
        else if (op == "top") cout << ms.top() << "\n";
        else cout << ms.getMin() << "\n";
    }
    return 0;
}`,
      io: 'Input: q, then q operations. Output: answers to top/min.',
      keyLines: [{ match: 'void push(long long x) { st.push({x, st.empty() ? x : min(x, st.top().second)}); }', note: 'The new minimum depends only on x and the minimum below.' }],
      mistakes: ['A single global min variable (cannot be restored after pop)'],
      tests: [
        { in: '5\npush 3\npush 1\nmin\npop\nmin', out: '1\n3' },
        { in: '6\npush 2\npush 2\npop\nmin\ntop\npush -5', out: '2\n2' },
        { in: '4\npush -1\npush 4\ntop\nmin', out: '4\n-1' },
        { in: '3\npush 7\nmin\ntop', out: '7\n7' },
      ],
    },
    {
      id: 'd10-daily-temperatures',
      day: 10,
      title: 'Days Until Warmer',
      difficulty: 'Medium',
      topic: 'stacks-queues',
      patterns: ['monotonic-stack-decreasing', 'next-greater-element'],
      objective: 'Store indices to measure distances to the next greater element.',
      statement: 'For each day print how many days you must wait for a strictly warmer temperature (0 if never).',
      constraints: ['1 ≤ n ≤ 10⁵', '30 ≤ t ≤ 100'],
      examples: [{ input: 't = [73,74,75,71,69,72,76,73]', output: '1 1 4 2 1 1 0 0' }],
      edgeCases: ['Strictly decreasing → all 0', 'Equal temperatures'],
      cues: ['"how many days until greater" → next greater with indices'],
      hints: ['Monotonic stack of indices.', 'When popping index j at day i, the answer for j is i − j.'],
      approach: 'Decreasing stack; resolve popped indices with i − j.',
      correctness: 'Same as next greater element; the distance is the index difference.',
      complexity: { time: 'O(n)', space: 'O(n)', why: 'Amortised pushes/pops.' },
      cpp: cpp`
#include <iostream>
#include <stack>
#include <vector>
using namespace std;

vector<int> daysUntilWarmer(const vector<int>& t) {
    vector<int> ans(t.size(), 0);
    stack<int> st;
    for (int i = 0; i < (int)t.size(); i++) {
        while (!st.empty() && t[st.top()] < t[i]) {
            ans[st.top()] = i - st.top();
            st.pop();
        }
        st.push(i);
    }
    return ans;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<int> t(n);
    for (auto& x : t) cin >> x;
    vector<int> ans = daysUntilWarmer(t);
    for (int i = 0; i < n; i++) cout << ans[i] << (i + 1 < n ? " " : "\n");
    return 0;
}`,
      io: 'Input: n, then n temperatures. Output: n waiting times.',
      keyLines: [{ match: 'ans[st.top()] = i - st.top();', note: 'Distance from the waiting day to the warmer day.' }],
      mistakes: ['Brute force O(n²) scanning forward from each day'],
      tests: [
        { in: '8\n73 74 75 71 69 72 76 73', out: '1 1 4 2 1 1 0 0' },
        { in: '4\n30 40 50 60', out: '1 1 1 0' },
        { in: '3\n90 60 30', out: '0 0 0' },
        { in: '4\n50 50 50 51', out: '3 2 1 0' },
      ],
    },
    {
      id: 'd10-eval-rpn',
      day: 10,
      title: 'Postfix Calculator',
      difficulty: 'Medium',
      topic: 'stacks-queues',
      patterns: ['expression-parsing'],
      objective: 'Evaluate Reverse Polish Notation with an operand stack.',
      statement: 'Evaluate an expression in Reverse Polish Notation with tokens separated by spaces. Operators are + − * /, and division truncates toward zero.',
      constraints: ['1 ≤ tokens ≤ 10⁴', 'Valid expression; intermediate values fit in 64-bit'],
      examples: [{ input: '2 1 + 3 *', output: '9' }],
      edgeCases: ['Negative numbers as tokens', 'Division with negative operands'],
      cues: ['Operators apply to the two most recent operands → stack'],
      hints: ['Push numbers.', 'For an operator pop b then a, push a op b.', 'Order matters for − and /.'],
      approach: 'Operand stack; detect operators as single-character tokens + − * /.',
      correctness: 'Postfix guarantees that an operator\'s operands are exactly the two most recent results.',
      complexity: { time: 'O(n)', space: 'O(n)', why: 'One pass over tokens.' },
      cpp: cpp`
#include <iostream>
#include <sstream>
#include <stack>
#include <string>
using namespace std;

long long evalRPN(const string& line) {
    stack<long long> st;
    istringstream in(line);
    string tok;
    while (in >> tok) {
        if (tok.size() == 1 && string("+-*/").find(tok[0]) != string::npos) {
            long long b = st.top(); st.pop();
            long long a = st.top(); st.pop();
            if (tok == "+") st.push(a + b);
            else if (tok == "-") st.push(a - b);
            else if (tok == "*") st.push(a * b);
            else st.push(a / b);
        } else {
            st.push(stoll(tok));
        }
    }
    return st.top();
}`,
      main: cpp`
int main() {
    string line;
    getline(cin, line);
    cout << evalRPN(line) << "\n";
    return 0;
}`,
      io: 'Input: one line of space-separated tokens. Output: the value.',
      keyLines: [
        { match: 'long long b = st.top(); st.pop();', note: 'The right operand is on top.' },
        { match: 'if (tok.size() == 1 && string("+-*/").find(tok[0]) != string::npos) {', note: '"-3" is a number, "-" is an operator — check the length.' },
      ],
      mistakes: ['Swapping a and b for − and /'],
      tests: [
        { in: '2 1 + 3 *', out: '9' },
        { in: '4 13 5 / +', out: '6' },
        { in: '10 6 9 3 + -11 * / * 17 + 5 +', out: '22' },
        { in: '-7 2 /', out: '-3' },
      ],
    },
    {
      id: 'd10-next-greater-circular',
      day: 10,
      title: 'Next Greater on a Ring',
      difficulty: 'Medium',
      topic: 'stacks-queues',
      patterns: ['next-greater-element', 'monotonic-stack-decreasing'],
      objective: 'Handle circular arrays by iterating twice.',
      statement: 'The array is circular (after the last element comes the first). For each element print the next strictly greater element when walking forward around the ring, or -1.',
      constraints: ['1 ≤ n ≤ 10⁴'],
      examples: [{ input: 'a = [1, 2, 1]', output: '2 -1 2' }],
      edgeCases: ['All equal → all -1', 'Maximum element → -1'],
      cues: ['Circular + next greater → simulate two passes with i % n'],
      hints: ['Walk i from 0 to 2n − 1 using a[i % n].', 'Only push indices during the first pass.'],
      approach: 'Monotonic stack over 2n steps; resolve with a[i % n].',
      correctness: 'Within two laps every element sees every other element once in forward circular order.',
      complexity: { time: 'O(n)', space: 'O(n)', why: '2n iterations, each index pushed once.' },
      cpp: cpp`
#include <iostream>
#include <stack>
#include <vector>
using namespace std;

vector<int> nextGreaterCircular(const vector<int>& a) {
    int n = a.size();
    vector<int> ans(n, -1);
    stack<int> st;
    for (int i = 0; i < 2 * n; i++) {
        int v = a[i % n];
        while (!st.empty() && a[st.top()] < v) {
            ans[st.top()] = v;
            st.pop();
        }
        if (i < n) st.push(i);
    }
    return ans;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (auto& x : a) cin >> x;
    vector<int> ans = nextGreaterCircular(a);
    for (int i = 0; i < n; i++) cout << ans[i] << (i + 1 < n ? " " : "\n");
    return 0;
}`,
      io: 'Input: n, then n integers. Output: n answers.',
      keyLines: [{ match: 'if (i < n) st.push(i);', note: 'The second lap only resolves; it does not add new indices.' }],
      mistakes: ['Pushing during the second pass (duplicates)'],
      tests: [
        { in: '3\n1 2 1', out: '2 -1 2' },
        { in: '5\n1 2 3 4 3', out: '2 3 4 -1 4' },
        { in: '3\n5 5 5', out: '-1 -1 -1' },
        { in: '1\n9', out: '-1' },
      ],
    },
    {
      id: 'd10-stock-span',
      day: 10,
      title: 'Price Span',
      difficulty: 'Medium',
      topic: 'stacks-queues',
      patterns: ['monotonic-stack-decreasing', 'next-greater-element'],
      objective: 'Find the previous greater element for each day.',
      statement: 'For each day print the span: the number of consecutive days up to and including today with price ≤ today\'s price.',
      constraints: ['1 ≤ n ≤ 10⁵'],
      examples: [{ input: 'p = [100, 80, 60, 70, 60, 75, 85]', output: '1 1 1 2 1 4 6' }],
      edgeCases: ['Increasing prices → spans 1..n', 'Equal prices extend the span'],
      cues: ['Distance back to the previous strictly greater element → monotonic stack'],
      hints: ['span = i − (index of previous greater price).', 'Pop while the top price ≤ today.'],
      approach: 'Stack of indices with strictly decreasing prices; span = i − top (or i + 1 when empty).',
      correctness: 'Popped indices have prices ≤ today, so they are inside today\'s span and can never bound a later span.',
      complexity: { time: 'O(n)', space: 'O(n)', why: 'Amortised.' },
      cpp: cpp`
#include <iostream>
#include <stack>
#include <vector>
using namespace std;

vector<int> spans(const vector<int>& p) {
    vector<int> out(p.size());
    stack<int> st;
    for (int i = 0; i < (int)p.size(); i++) {
        while (!st.empty() && p[st.top()] <= p[i]) st.pop();
        out[i] = st.empty() ? i + 1 : i - st.top();
        st.push(i);
    }
    return out;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<int> p(n);
    for (auto& x : p) cin >> x;
    vector<int> s = spans(p);
    for (int i = 0; i < n; i++) cout << s[i] << (i + 1 < n ? " " : "\n");
    return 0;
}`,
      io: 'Input: n, then n prices. Output: n spans.',
      keyLines: [{ match: 'out[i] = st.empty() ? i + 1 : i - st.top();', note: 'The remaining top is the previous strictly greater price.' }],
      mistakes: ['Using < so equal prices stop the span'],
      tests: [
        { in: '7\n100 80 60 70 60 75 85', out: '1 1 1 2 1 4 6' },
        { in: '3\n1 2 3', out: '1 2 3' },
        { in: '3\n5 5 5', out: '1 2 3' },
        { in: '2\n9 1', out: '1 1' },
      ],
    },
    {
      id: 'd10-largest-rectangle',
      day: 10,
      title: 'Largest Billboard in a Skyline',
      difficulty: 'Hard',
      topic: 'stacks-queues',
      patterns: ['monotonic-stack-increasing', 'amortized-analysis'],
      objective: 'Use previous/next smaller boundaries to evaluate every bar as the limiting height.',
      statement: 'Histogram bars of width 1 have heights h[i]. Print the area of the largest rectangle that fits inside the histogram.',
      constraints: ['1 ≤ n ≤ 10⁵', '0 ≤ h[i] ≤ 10⁴'],
      examples: [{ input: 'h = [2, 1, 5, 6, 2, 3]', output: '10' }],
      edgeCases: ['All equal', 'Increasing heights', 'Zeros split the histogram'],
      cues: ['Each bar extends left/right until a smaller bar → previous/next smaller via increasing stack'],
      hints: ['For each bar as the shortest, the rectangle spans between the nearest smaller bars on both sides.', 'An increasing stack finds both: when a bar is popped, the current index is its next smaller, and the new top is its previous smaller.', 'Append a sentinel height 0 to flush the stack.'],
      brute: 'For every pair (l, r) take min height × width: O(n²).',
      approach: 'Increasing stack; on popping index j at i, width = i − (top after pop) − 1, area = h[j] × width.',
      correctness: 'Every maximal rectangle is limited by some bar of minimum height, evaluated exactly when that bar is popped.',
      complexity: { time: 'O(n)', space: 'O(n)', why: 'Each bar pushed and popped once.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <stack>
#include <vector>
using namespace std;

long long largestRectangle(vector<int> h) {
    h.push_back(0);  // sentinel flushes the stack at the end
    stack<int> st;
    long long best = 0;
    for (int i = 0; i < (int)h.size(); i++) {
        while (!st.empty() && h[st.top()] >= h[i]) {
            int height = h[st.top()];
            st.pop();
            int left = st.empty() ? -1 : st.top();
            best = max(best, (long long)height * (i - left - 1));
        }
        st.push(i);
    }
    return best;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<int> h(n);
    for (auto& x : h) cin >> x;
    cout << largestRectangle(h) << "\n";
    return 0;
}`,
      io: 'Input: n, then n heights. Output: maximum area.',
      keyLines: [
        { match: 'h.push_back(0);', note: 'Forces every remaining bar to be evaluated.' },
        { match: 'int left = st.empty() ? -1 : st.top();', note: 'Previous smaller bar after popping; −1 if none.' },
      ],
      mistakes: ['Forgetting the sentinel', 'Width off by one'],
      tests: [
        { in: '6\n2 1 5 6 2 3', out: '10' },
        { in: '2\n2 4', out: '4' },
        { in: '5\n3 3 3 3 3', out: '15' },
        { in: '3\n0 0 0', out: '0' },
      ],
    },
    {
      id: 'd10-window-maximum',
      day: 10,
      title: 'Peak Load per Window',
      difficulty: 'Hard',
      topic: 'stacks-queues',
      patterns: ['monotonic-queue', 'sliding-window-fixed'],
      objective: 'Implement the monotonic deque from scratch.',
      statement: 'Given server loads and k, print the maximum load of every window of k consecutive minutes.',
      constraints: ['1 ≤ k ≤ n ≤ 10⁵'],
      examples: [{ input: 'a = [1, 3, -1, -3, 5, 3, 6, 7], k = 3', output: '3 3 5 5 6 7' }],
      edgeCases: ['k = 1', 'k = n', 'Decreasing input'],
      cues: ['Max of every fixed window → monotonic deque'],
      hints: ['Keep indices in a deque, values decreasing.', 'Remove the front when it leaves the window.', 'Remove smaller values from the back before pushing.'],
      brute: 'Scan each window: O(n·k).',
      approach: 'Monotonic deque (Example B).',
      correctness: 'The deque front is the largest value among indices in the window that are not dominated.',
      complexity: { time: 'O(n)', space: 'O(k)', why: 'Amortised O(1) per element.' },
      cpp: cpp`
#include <deque>
#include <iostream>
#include <vector>
using namespace std;

vector<int> windowMax(const vector<int>& a, int k) {
    deque<int> dq;
    vector<int> out;
    for (int i = 0; i < (int)a.size(); i++) {
        if (!dq.empty() && dq.front() <= i - k) dq.pop_front();
        while (!dq.empty() && a[dq.back()] <= a[i]) dq.pop_back();
        dq.push_back(i);
        if (i >= k - 1) out.push_back(a[dq.front()]);
    }
    return out;
}`,
      main: cpp`
int main() {
    int n, k;
    cin >> n >> k;
    vector<int> a(n);
    for (auto& x : a) cin >> x;
    vector<int> out = windowMax(a, k);
    for (size_t i = 0; i < out.size(); i++) cout << out[i] << (i + 1 < out.size() ? " " : "\n");
    return 0;
}`,
      io: 'Input: n k, then n integers. Output: n − k + 1 maxima.',
      keyLines: [{ match: 'while (!dq.empty() && a[dq.back()] <= a[i]) dq.pop_back();', note: 'Dominated elements are removed for good.' }],
      mistakes: ['Using a max-heap without removing stale entries'],
      tests: [
        { in: '8 3\n1 3 -1 -3 5 3 6 7', out: '3 3 5 5 6 7' },
        { in: '1 1\n4', out: '4' },
        { in: '5 2\n5 4 3 2 1', out: '5 4 3 2' },
        { in: '4 4\n2 9 1 3', out: '9' },
      ],
    },
  ],
};

export default day;
