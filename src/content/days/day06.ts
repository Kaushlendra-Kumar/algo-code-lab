import type { DayModule } from '../../types/content';
import { cpp } from '../cpp';
import { TRACE_CODE } from '../traceCode';

// Shared driver pieces for linked-list questions (kept in each program so it compiles standalone).
const LIST_HEADER = `#include <iostream>
#include <vector>
using namespace std;

struct ListNode {
    int val;
    ListNode* next;
    ListNode(int v) : val(v), next(nullptr) {}
};`;

const day: DayModule = {
  day: {
    day: 6,
    title: 'Fast and Slow Pointers on Linked Lists',
    zone: 'linked-lists',
    objectives: [
      'Traverse and modify singly linked lists safely',
      'Detect a cycle and its entrance with Floyd\'s algorithm',
      'Find the middle node in one pass',
      'Apply fast/slow reasoning to sequences defined by a function',
    ],
    prerequisites: ['Pointers and structs in C++', 'Day 4: two pointers'],
    lesson: [
      {
        heading: 'Linked lists in C++',
        body: 'A node stores a value and a pointer to the next node; the last node points to `nullptr`. There is no random access: reaching the k-th node takes k steps. Always check a pointer before dereferencing it — `node->next` on `nullptr` is undefined behaviour.',
      },
      {
        heading: 'Fast and slow',
        body: 'Move `slow` one step and `fast` two steps per iteration. If the list ends, `fast` reaches `nullptr` first and there is no cycle. If there is a cycle, once both are inside it the distance between them shrinks by exactly 1 each iteration, so they must meet.',
      },
      {
        heading: 'Finding where the cycle begins',
        body: 'Let the cycle start μ steps from the head and have length λ. When they meet, restart one pointer at the head and move both one step at a time: they meet again exactly at the cycle entrance. (Distance arithmetic: the meeting point is μ steps — modulo λ — before the entrance.)',
      },
      {
        heading: 'The middle node',
        body: 'When `fast` cannot take two more steps, `slow` has moved half as far: it is at the middle (the second middle for even lengths with the usual loop `while (fast && fast->next)`).',
      },
      {
        heading: 'Beyond lists',
        body: 'Any sequence x → f(x) over a finite set eventually cycles. Fast/slow detects that cycle with O(1) memory — e.g. "happy numbers" or finding a duplicate in an array whose values are indices.',
      },
    ],
    recognition: [
      'Linked list + "cycle", "middle", "k-th from the end" → two pointers with different speeds or offsets.',
      'Repeated application of a function that may loop → Floyd\'s algorithm.',
      'O(1) extra memory required where a visited set would be easy → fast/slow.',
    ],
    patterns: ['fast-slow-pointers', 'two-pointers-same'],
    visualizations: ['fast-slow'],
    exampleA: {
      id: 'd06-A',
      title: 'Detect a cycle and find its start',
      goal: 'Return the first node of the cycle in a linked list, or report that there is none.',
      input: 'list 1 → 2 → 3 → 4 → 5 → 6 → (back to 3)',
      output: 'cycle starts at value 3',
      idea: 'Phase 1: fast moves 2, slow moves 1; meeting proves a cycle. Phase 2: restart a pointer at head; moving both one step at a time, they meet at the entrance.',
      code: TRACE_CODE['fast-slow-cycle'],
      keyLines: [
        { match: 'while (fast && fast->next) {', note: 'Check both before taking two steps — prevents dereferencing nullptr.' },
        { match: 'fast = fast->next->next;', note: 'Two steps per iteration.' },
        { match: 'ListNode* p = head;', note: 'Phase 2: one pointer restarts from the head.' },
        { match: 'return p;', note: 'Both pointers are now at the cycle entrance.' },
      ],
      complexity: { time: 'O(n)', space: 'O(1)', why: 'Both phases take at most a constant number of passes over the n nodes; only two pointers are stored.' },
      edgeCases: ['Empty list (head = nullptr)', 'Single node pointing to itself', 'No cycle'],
      mistakes: ['Checking only fast->next', 'Comparing values instead of node addresses (values can repeat)'],
      tryIt: 'Return the length of the cycle: after the meeting point, walk once around until you return to it.',
      trace: { id: 'fast-slow-cycle', input: { values: [1, 2, 3, 4, 5, 6], next: [1, 2, 3, 4, 5, 2] } },
      bug: {
        find: 'while (p != slow) {',
        replace: 'while (p->next != slow->next) {',
        symptom: 'The program prints "cycle starts at value 2" instead of 3.',
        explanation: 'Phase 2 must compare the pointers themselves. The node before the entrance (2) and the tail (6) share the same successor, so comparing successors stops one step too early.',
      },
    },
    exampleB: {
      id: 'd06-B',
      kind: 'variant',
      title: 'Middle of a linked list',
      goal: 'Return the middle node; for an even number of nodes return the second middle.',
      input: 'lists [1,2,3,4,5] and [1,2,3,4,5,6]',
      output: 'middle of 5 nodes: 3\nmiddle of 6 nodes: 4',
      idea: 'Fast travels twice as far as slow. When fast can no longer take two steps, slow is halfway.',
      code: cpp`
#include <iostream>
#include <vector>
using namespace std;

struct ListNode {
    int val;
    ListNode* next;
    ListNode(int v) : val(v), next(nullptr) {}
};

ListNode* middle(ListNode* head) {
    ListNode* slow = head;
    ListNode* fast = head;
    while (fast && fast->next) {
        slow = slow->next;
        fast = fast->next->next;
    }
    return slow;
}

ListNode* build(const vector<int>& v, vector<ListNode*>& owned) {
    ListNode* head = nullptr;
    ListNode* tail = nullptr;
    for (int x : v) {
        ListNode* node = new ListNode(x);
        owned.push_back(node);
        if (!head) head = node;
        else tail->next = node;
        tail = node;
    }
    return head;
}

int main() {
    vector<ListNode*> owned;
    for (int n : {5, 6}) {
        vector<int> v;
        for (int i = 1; i <= n; i++) v.push_back(i);
        cout << "middle of " << n << " nodes: " << middle(build(v, owned))->val << "\n";
    }
    for (ListNode* p : owned) delete p;
    return 0;
}`,
      keyLines: [
        { match: 'while (fast && fast->next) {', note: 'Stops when fast is on the last node (odd length) or past it (even length).' },
        { match: 'slow = slow->next;', note: 'slow advances half as fast.' },
        { match: 'owned.push_back(node);', note: 'Track allocations so main can free them — no leaks.' },
      ],
      dryRun: {
        columns: ['iteration', 'slow', 'fast (6 nodes)'],
        rows: [
          ['start', '1', '1'],
          ['1', '2', '3'],
          ['2', '3', '5'],
          ['3', '4', 'nullptr → stop'],
        ],
      },
      complexity: { time: 'O(n)', space: 'O(1)', why: 'fast visits about n nodes; slow about n/2.' },
      edgeCases: ['Single node → itself', 'Two nodes → the second one'],
      mistakes: ['Using while (fast->next && fast->next->next) changes which middle is returned for even lengths'],
      tryIt: 'Change the loop so that for even lengths the first middle is returned.',
    },
    complexityNotes: 'Linked-list traversals are O(n) because each node is visited a constant number of times. Fast/slow keeps space at O(1) compared with O(n) for a visited set.',
    quiz: [
      {
        prompt: 'Why must slow and fast meet if the list has a cycle?',
        options: ['They start at the same node', 'Inside the cycle the gap between them shrinks by one per step', 'fast skips the cycle', 'Because the list is sorted'],
        answer: 1,
        explanation: 'Relative speed is 1 node per iteration, so the gap reaches 0.',
      },
      {
        prompt: 'What is the loop condition that avoids null dereference when fast moves two steps?',
        options: ['while (fast)', 'while (fast->next)', 'while (fast && fast->next)', 'while (slow != fast)'],
        answer: 2,
        explanation: 'Both fast and fast->next must be non-null before fast->next->next.',
      },
      {
        prompt: 'Compared with storing visited nodes in an unordered_set, Floyd\'s algorithm saves…',
        options: ['Time: O(n) → O(log n)', 'Space: O(n) → O(1)', 'Nothing', 'It handles doubly linked lists only'],
        answer: 1,
        explanation: 'Both are O(n) time; Floyd uses constant memory.',
      },
    ],
    recap: 'Two pointers moving at different speeds detect cycles, find their entrance and locate the middle — all in one pass with O(1) memory.',
    nextPrep: 'Tomorrow: binary search. Recall that a sorted array allows you to discard half of the candidates with one comparison.',
  },
  questions: [
    {
      id: 'd06-middle-node',
      day: 6,
      title: 'Middle Carriage',
      difficulty: 'Easy',
      topic: 'linked-lists',
      patterns: ['fast-slow-pointers'],
      objective: 'Find the middle with one traversal.',
      statement: 'A train is a singly linked list of carriages. Print the value of the middle carriage (the second middle when the count is even).',
      constraints: ['1 ≤ n ≤ 10⁵'],
      examples: [{ input: 'list = 1 → 2 → 3 → 4', output: '3' }],
      edgeCases: ['n = 1', 'n = 2'],
      cues: ['Middle without knowing the length → fast/slow'],
      hints: ['Counting nodes then walking n/2 is two passes.', 'Move fast two steps for each slow step.'],
      approach: 'Standard fast/slow loop; return slow.',
      correctness: 'After k iterations slow is at index k and fast at 2k; the loop stops when 2k ≥ n − 1.',
      complexity: { time: 'O(n)', space: 'O(1)', why: 'One pass.' },
      cpp: cpp`${LIST_HEADER}

ListNode* middleNode(ListNode* head) {
    ListNode *slow = head, *fast = head;
    while (fast && fast->next) {
        slow = slow->next;
        fast = fast->next->next;
    }
    return slow;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<ListNode*> nodes(n);
    for (int i = 0; i < n; i++) {
        int v;
        cin >> v;
        nodes[i] = new ListNode(v);
        if (i) nodes[i - 1]->next = nodes[i];
    }
    cout << middleNode(nodes[0])->val << "\n";
    for (auto* p : nodes) delete p;
    return 0;
}`,
      io: 'Input: n, then n values. Output: value of the middle node.',
      keyLines: [{ match: 'while (fast && fast->next) {', note: 'Gives the second middle for even n.' }],
      mistakes: ['Dereferencing fast->next->next without checks'],
      tests: [
        { in: '4\n1 2 3 4', out: '3' },
        { in: '1\n9', out: '9' },
        { in: '5\n1 2 3 4 5', out: '3' },
        { in: '2\n7 8', out: '8' },
      ],
      viz: 'fast-slow',
    },
    {
      id: 'd06-has-cycle',
      day: 6,
      title: 'Endless Loop Detector',
      difficulty: 'Easy',
      topic: 'linked-lists',
      patterns: ['fast-slow-pointers'],
      objective: 'Detect a cycle with O(1) memory.',
      statement: 'A list of n nodes is given with pos: the tail links to the node at index pos (or nowhere if pos = -1). Print `true` if the list has a cycle.',
      constraints: ['0 ≤ n ≤ 10⁴', '-1 ≤ pos < n'],
      examples: [{ input: 'values = [3, 2, 0, -4], pos = 1', output: 'true' }],
      edgeCases: ['Empty list', 'Single node with self-loop'],
      cues: ['Cycle in a linked list, O(1) memory → Floyd'],
      hints: ['A visited set works but uses O(n) memory.', 'Fast and slow meet iff there is a cycle.'],
      approach: 'Run fast/slow; return true if they meet.',
      correctness: 'Without a cycle fast reaches nullptr; with a cycle the gap closes by one per step.',
      complexity: { time: 'O(n)', space: 'O(1)', why: 'At most a few laps.' },
      cpp: cpp`${LIST_HEADER}

bool hasCycle(ListNode* head) {
    ListNode *slow = head, *fast = head;
    while (fast && fast->next) {
        slow = slow->next;
        fast = fast->next->next;
        if (slow == fast) return true;
    }
    return false;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<ListNode*> nodes(n);
    for (int i = 0; i < n; i++) {
        int v;
        cin >> v;
        nodes[i] = new ListNode(v);
        if (i) nodes[i - 1]->next = nodes[i];
    }
    int pos;
    cin >> pos;
    if (n && pos >= 0) nodes[n - 1]->next = nodes[pos];
    cout << (hasCycle(n ? nodes[0] : nullptr) ? "true" : "false") << "\n";
    for (auto* p : nodes) delete p;
    return 0;
}`,
      io: 'Input: n, n values, pos. Output: true or false.',
      keyLines: [{ match: 'if (slow == fast) return true;', note: 'Compare addresses after moving.' }],
      mistakes: ['Comparing before the first move (they start equal)'],
      tests: [
        { in: '4\n3 2 0 -4\n1', out: 'true' },
        { in: '2\n1 2\n-1', out: 'false' },
        { in: '1\n1\n0', out: 'true' },
        { in: '0\n-1', out: 'false' },
      ],
    },
    {
      id: 'd06-happy-number',
      day: 6,
      title: 'Happy Number',
      difficulty: 'Easy',
      topic: 'linked-lists',
      patterns: ['fast-slow-pointers'],
      objective: 'Detect a cycle in a sequence defined by a function.',
      statement: 'Repeatedly replace n by the sum of the squares of its digits. n is happy if this process reaches 1. Print `true` if n is happy.',
      constraints: ['1 ≤ n ≤ 2³¹ − 1'],
      examples: [{ input: 'n = 19', output: 'true', explanation: '1² + 9² = 82 → 68 → 100 → 1' }],
      edgeCases: ['n = 1', 'n = 2 (cycles)'],
      cues: ['Iterating x → f(x) that may loop forever → fast/slow on the sequence'],
      hints: ['The sequence either reaches 1 or enters a cycle.', 'Use slow = f(slow), fast = f(f(fast)).', 'Stop when they meet; happy iff the meeting value is 1.'],
      approach: 'Floyd on the implicit sequence.',
      correctness: 'The digit-square sum of any number < 10¹⁰ is small, so the sequence is eventually periodic; 1 maps to itself.',
      complexity: { time: 'O(log n)', space: 'O(1)', why: 'Values drop quickly to below 243, then at most a short cycle.' },
      cpp: cpp`
#include <iostream>
using namespace std;

long long step(long long x) {
    long long s = 0;
    while (x) {
        long long d = x % 10;
        s += d * d;
        x /= 10;
    }
    return s;
}

bool isHappy(long long n) {
    long long slow = n, fast = step(n);
    while (fast != 1 && slow != fast) {
        slow = step(slow);
        fast = step(step(fast));
    }
    return fast == 1;
}`,
      main: cpp`
int main() {
    long long n;
    cin >> n;
    cout << (isHappy(n) ? "true" : "false") << "\n";
    return 0;
}`,
      io: 'Input: n. Output: true or false.',
      keyLines: [{ match: 'while (fast != 1 && slow != fast) {', note: 'Stop either at 1 or when a cycle is detected.' }],
      mistakes: ['Looping until 1 without cycle detection (infinite loop for unhappy numbers)'],
      tests: [
        { in: '19', out: 'true' },
        { in: '2', out: 'false' },
        { in: '1', out: 'true' },
        { in: '7', out: 'true' },
      ],
    },
    {
      id: 'd06-remove-nth',
      day: 6,
      title: 'Drop the K-th From the End',
      difficulty: 'Medium',
      topic: 'linked-lists',
      patterns: ['two-pointers-same', 'fast-slow-pointers'],
      objective: 'Use a fixed gap between two pointers and a dummy head.',
      statement: 'Remove the k-th node from the end of a list in one pass and print the remaining values (print `empty` if none remain).',
      constraints: ['1 ≤ k ≤ n ≤ 10⁵'],
      examples: [{ input: 'list = [1, 2, 3, 4, 5], k = 2', output: '1 2 3 5' }],
      edgeCases: ['Remove the head (k = n)', 'Single node'],
      cues: ['"k-th from the end" in one pass → lead pointer k steps ahead'],
      hints: ['Move a lead pointer k steps first.', 'Then move both until lead reaches the end.', 'A dummy node before head avoids a special case when removing the head.'],
      approach: 'dummy → head; lead advances k + 1 from dummy; move both; delete trail->next.',
      correctness: 'The gap of k + 1 nodes leaves trail exactly before the target when lead falls off the end.',
      complexity: { time: 'O(n)', space: 'O(1)', why: 'One pass.' },
      cpp: cpp`${LIST_HEADER}

ListNode* removeKthFromEnd(ListNode* head, int k) {
    ListNode dummy(0);
    dummy.next = head;
    ListNode *lead = &dummy, *trail = &dummy;
    for (int i = 0; i <= k; i++) lead = lead->next;
    while (lead) {
        lead = lead->next;
        trail = trail->next;
    }
    ListNode* gone = trail->next;
    trail->next = gone->next;
    delete gone;
    return dummy.next;
}`,
      main: cpp`
int main() {
    int n, k;
    cin >> n >> k;
    ListNode* head = nullptr;
    ListNode* tail = nullptr;
    for (int i = 0; i < n; i++) {
        int v;
        cin >> v;
        ListNode* node = new ListNode(v);
        if (!head) head = node;
        else tail->next = node;
        tail = node;
    }
    head = removeKthFromEnd(head, k);
    if (!head) cout << "empty";
    for (ListNode* p = head; p; p = p->next) cout << p->val << (p->next ? " " : "");
    cout << "\n";
    while (head) {
        ListNode* nx = head->next;
        delete head;
        head = nx;
    }
    return 0;
}`,
      io: 'Input: n k, then n values. Output: remaining values or "empty".',
      keyLines: [
        { match: 'ListNode dummy(0);', note: 'A stack-allocated sentinel before the real head.' },
        { match: 'for (int i = 0; i <= k; i++) lead = lead->next;', note: 'k + 1 steps from dummy create the right gap.' },
      ],
      mistakes: ['Special-casing head removal incorrectly', 'Leaking the removed node'],
      tests: [
        { in: '5 2\n1 2 3 4 5', out: '1 2 3 5' },
        { in: '1 1\n1', out: 'empty' },
        { in: '2 2\n1 2', out: '2' },
        { in: '3 1\n4 5 6', out: '4 5' },
      ],
    },
    {
      id: 'd06-palindrome-list',
      day: 6,
      title: 'Palindromic Chain',
      difficulty: 'Medium',
      topic: 'linked-lists',
      patterns: ['fast-slow-pointers', 'in-place-transform'],
      objective: 'Find the middle, reverse the second half, compare.',
      statement: 'Print `true` if the values of a singly linked list read the same forwards and backwards. Use O(1) extra memory.',
      constraints: ['1 ≤ n ≤ 10⁵'],
      examples: [{ input: 'list = [1, 2, 2, 1]', output: 'true' }],
      edgeCases: ['Odd length', 'n = 1'],
      cues: ['List palindrome with O(1) space → middle + reverse half'],
      hints: ['Find the middle with fast/slow.', 'Reverse the second half in place.', 'Compare the first half with the reversed second half.'],
      approach: 'middle → reverse from middle → walk both halves comparing.',
      correctness: 'After reversal, the i-th node of the reversed half is the i-th node from the end of the original list.',
      complexity: { time: 'O(n)', space: 'O(1)', why: 'Three linear passes.' },
      cpp: cpp`${LIST_HEADER}

ListNode* reverseList(ListNode* head) {
    ListNode* prev = nullptr;
    while (head) {
        ListNode* nx = head->next;
        head->next = prev;
        prev = head;
        head = nx;
    }
    return prev;
}

bool isPalindrome(ListNode* head) {
    ListNode *slow = head, *fast = head;
    while (fast && fast->next) {
        slow = slow->next;
        fast = fast->next->next;
    }
    ListNode* second = reverseList(slow);
    bool ok = true;
    for (ListNode *a = head, *b = second; b; a = a->next, b = b->next)
        if (a->val != b->val) ok = false;
    return ok;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<ListNode*> nodes(n);
    for (int i = 0; i < n; i++) {
        int v;
        cin >> v;
        nodes[i] = new ListNode(v);
        if (i) nodes[i - 1]->next = nodes[i];
    }
    cout << (isPalindrome(nodes[0]) ? "true" : "false") << "\n";
    for (auto* p : nodes) delete p;
    return 0;
}`,
      io: 'Input: n, then n values. Output: true or false.',
      keyLines: [
        { match: 'ListNode* second = reverseList(slow);', note: 'Reverse from the middle; the first half still ends pointing into it.' },
        { match: 'head->next = prev;', note: 'Classic three-pointer in-place reversal.' },
      ],
      mistakes: ['Copying values into a vector (O(n) space)', 'Losing the next pointer before redirecting it'],
      tests: [
        { in: '4\n1 2 2 1', out: 'true' },
        { in: '2\n1 2', out: 'false' },
        { in: '5\n1 2 3 2 1', out: 'true' },
        { in: '1\n7', out: 'true' },
      ],
    },
    {
      id: 'd06-reorder-list',
      day: 6,
      title: 'Zipper Reorder',
      difficulty: 'Medium',
      topic: 'linked-lists',
      patterns: ['fast-slow-pointers', 'in-place-transform'],
      objective: 'Split, reverse and interleave a list in place.',
      statement: 'Reorder list L0 → L1 → … → Ln−1 into L0 → Ln−1 → L1 → Ln−2 → … in place, then print it.',
      constraints: ['1 ≤ n ≤ 5·10⁴'],
      examples: [{ input: 'list = [1, 2, 3, 4, 5]', output: '1 5 2 4 3' }],
      edgeCases: ['n ≤ 2 unchanged'],
      cues: ['Alternate from the front and back of a list → split at middle + reverse + merge'],
      hints: ['Find the middle (first middle) and cut the list there.', 'Reverse the second half.', 'Interleave the two halves.'],
      approach: 'slow/fast to the first middle; second = reverse(slow->next); slow->next = nullptr; merge alternately.',
      correctness: 'The reversed second half yields Ln−1, Ln−2, … which are exactly the values to insert after L0, L1, ….',
      complexity: { time: 'O(n)', space: 'O(1)', why: 'Three passes, constant pointers.' },
      cpp: cpp`${LIST_HEADER}

void reorderList(ListNode* head) {
    if (!head || !head->next) return;
    ListNode *slow = head, *fast = head;
    while (fast->next && fast->next->next) {
        slow = slow->next;
        fast = fast->next->next;
    }
    ListNode* prev = nullptr;
    ListNode* cur = slow->next;
    slow->next = nullptr;
    while (cur) {
        ListNode* nx = cur->next;
        cur->next = prev;
        prev = cur;
        cur = nx;
    }
    for (ListNode *a = head, *b = prev; b;) {
        ListNode *an = a->next, *bn = b->next;
        a->next = b;
        b->next = an;
        a = an;
        b = bn;
    }
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<ListNode*> nodes(n);
    for (int i = 0; i < n; i++) {
        int v;
        cin >> v;
        nodes[i] = new ListNode(v);
        if (i) nodes[i - 1]->next = nodes[i];
    }
    reorderList(nodes[0]);
    for (ListNode* p = nodes[0]; p; p = p->next) cout << p->val << (p->next ? " " : "\n");
    for (auto* p : nodes) delete p;
    return 0;
}`,
      io: 'Input: n, then n values. Output: reordered values.',
      keyLines: [
        { match: 'while (fast->next && fast->next->next) {', note: 'This variant stops at the first middle, so the first half is never shorter.' },
        { match: 'slow->next = nullptr;', note: 'Cut the list so the halves are independent.' },
      ],
      mistakes: ['Forgetting to cut the first half (creates a cycle)'],
      tests: [
        { in: '5\n1 2 3 4 5', out: '1 5 2 4 3' },
        { in: '4\n1 2 3 4', out: '1 4 2 3' },
        { in: '1\n9', out: '9' },
        { in: '2\n1 2', out: '1 2' },
      ],
    },
    {
      id: 'd06-find-duplicate',
      day: 6,
      title: 'The Forged Ticket',
      difficulty: 'Medium',
      topic: 'linked-lists',
      patterns: ['fast-slow-pointers'],
      objective: 'Model an array as a function graph and find the cycle entrance.',
      statement: 'An array of n + 1 integers contains values in [1, n]; exactly one value repeats (possibly many times). Find it without modifying the array and with O(1) extra space.',
      constraints: ['1 ≤ n ≤ 10⁵'],
      examples: [{ input: 'a = [1, 3, 4, 2, 2]', output: '2' }],
      edgeCases: ['Duplicate repeated several times', 'n = 1'],
      cues: ['Values are valid indices → i → a[i] defines a linked structure; the duplicate is a cycle entrance'],
      hints: ['Treat index i as a node with edge i → a[i].', 'Index 0 is never a target, so it is a safe start.', 'Floyd\'s cycle entrance is the duplicated value.'],
      approach: 'Phase 1: slow = a[slow], fast = a[a[fast]] until equal. Phase 2: restart one at 0 and step both once until equal.',
      correctness: 'Two indices point to the duplicated value, so that value is the node where the path from 0 enters the cycle.',
      complexity: { time: 'O(n)', space: 'O(1)', why: 'Floyd\'s two phases.' },
      cpp: cpp`
#include <iostream>
#include <vector>
using namespace std;

int findDuplicate(const vector<int>& a) {
    int slow = 0, fast = 0;
    do {
        slow = a[slow];
        fast = a[a[fast]];
    } while (slow != fast);
    int p = 0;
    while (p != slow) {
        p = a[p];
        slow = a[slow];
    }
    return p;
}`,
      main: cpp`
int main() {
    int m;
    cin >> m;
    vector<int> a(m);
    for (auto& x : a) cin >> x;
    cout << findDuplicate(a) << "\n";
    return 0;
}`,
      io: 'Input: m (= n + 1), then m values. Output: the duplicated value.',
      keyLines: [
        { match: 'fast = a[a[fast]];', note: 'Two hops through the implicit list.' },
        { match: 'do {', note: 'do-while because both start at 0 and must move before comparing.' },
      ],
      mistakes: ['Sorting the array (modifies it)', 'Starting at a[0] for one pointer and 0 for the other in phase 2'],
      tests: [
        { in: '5\n1 3 4 2 2', out: '2' },
        { in: '5\n3 1 3 4 2', out: '3' },
        { in: '2\n1 1', out: '1' },
        { in: '6\n2 2 2 2 2 1', out: '2' },
      ],
    },
    {
      id: 'd06-reverse-k-group',
      day: 6,
      title: 'Reverse in Batches of K',
      difficulty: 'Hard',
      topic: 'linked-lists',
      patterns: ['in-place-transform', 'two-pointers-same'],
      objective: 'Reverse fixed-size segments while reconnecting boundaries.',
      statement: 'Reverse the nodes of a linked list k at a time; a final group with fewer than k nodes stays in order. Print the result.',
      constraints: ['1 ≤ k ≤ n ≤ 5000'],
      examples: [{ input: 'list = [1, 2, 3, 4, 5], k = 2', output: '2 1 4 3 5' }],
      edgeCases: ['k = 1 (unchanged)', 'k = n', 'n not divisible by k'],
      cues: ['Segment-wise reversal → dummy head + group boundary pointers'],
      hints: ['Check that k nodes remain before reversing a group.', 'Reverse the group and remember its new head and tail.', 'Connect the previous group\'s tail to the new head and continue after the group.'],
      approach: 'dummy → head; groupPrev = dummy; repeatedly find the k-th node, reverse [groupPrev->next .. kth], reconnect.',
      correctness: 'Each iteration reverses exactly one complete group and preserves links to the rest of the list.',
      complexity: { time: 'O(n)', space: 'O(1)', why: 'Each node is visited a constant number of times.' },
      cpp: cpp`${LIST_HEADER}

ListNode* reverseKGroup(ListNode* head, int k) {
    ListNode dummy(0);
    dummy.next = head;
    ListNode* groupPrev = &dummy;
    while (true) {
        ListNode* kth = groupPrev;
        for (int i = 0; i < k && kth; i++) kth = kth->next;
        if (!kth) break;
        ListNode* groupNext = kth->next;
        ListNode *prev = groupNext, *cur = groupPrev->next;
        while (cur != groupNext) {
            ListNode* nx = cur->next;
            cur->next = prev;
            prev = cur;
            cur = nx;
        }
        ListNode* oldFirst = groupPrev->next;
        groupPrev->next = kth;
        groupPrev = oldFirst;
    }
    return dummy.next;
}`,
      main: cpp`
int main() {
    int n, k;
    cin >> n >> k;
    vector<ListNode*> nodes(n);
    for (int i = 0; i < n; i++) {
        int v;
        cin >> v;
        nodes[i] = new ListNode(v);
        if (i) nodes[i - 1]->next = nodes[i];
    }
    ListNode* head = reverseKGroup(nodes[0], k);
    for (ListNode* p = head; p; p = p->next) cout << p->val << (p->next ? " " : "\n");
    for (auto* p : nodes) delete p;
    return 0;
}`,
      io: 'Input: n k, then n values. Output: the transformed list.',
      keyLines: [
        { match: 'ListNode *prev = groupNext, *cur = groupPrev->next;', note: 'Starting prev at groupNext makes the reversed group\'s tail point onward automatically.' },
        { match: 'groupPrev = oldFirst;', note: 'The old first node is now the tail of the reversed group.' },
      ],
      mistakes: ['Reversing an incomplete last group', 'Losing the connection to the next group'],
      tests: [
        { in: '5 2\n1 2 3 4 5', out: '2 1 4 3 5' },
        { in: '5 3\n1 2 3 4 5', out: '3 2 1 4 5' },
        { in: '3 1\n1 2 3', out: '1 2 3' },
        { in: '4 4\n1 2 3 4', out: '4 3 2 1' },
      ],
    },
  ],
};

export default day;
