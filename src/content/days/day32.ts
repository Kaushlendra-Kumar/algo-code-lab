import type { DayModule } from '../../types/content';
import { cpp } from '../cpp';

const day: DayModule = {
  day: {
    day: 32,
    title: 'Tries: Prefix Trees for Words',
    zone: 'trees',
    objectives: [
      'Build a trie with insert, search and prefix queries',
      'Store counters on nodes to answer "how many words start with p"',
      'Use DFS over a trie for autocomplete in lexicographic order',
      'Prune a backtracking search with a trie (word search)',
    ],
    prerequisites: ['Day 16: tree DFS', 'Day 2: hashing'],
    lesson: [
      {
        heading: 'One edge per character',
        body: 'A trie is a rooted tree where each edge is labelled with a character. The path from the root spells a prefix; a node is marked `end` if a whole word finishes there. Words sharing a prefix share the path.',
      },
      {
        heading: 'Operations cost O(length)',
        body: 'Insert, search and prefix checks walk one node per character — independent of how many words are stored. With a fixed alphabet use `int next[26]` per node (fast, more memory); for large alphabets use a map.',
      },
      {
        heading: 'Pool of nodes',
        body: 'Store nodes in a `vector<Node>` and link by index instead of `new`. Index 0 is the root, `-1` (or 0 for children, since the root is never a child) means "no edge". No leaks, cache friendly.',
      },
      {
        heading: 'Counting and ordering',
        body: 'Add `pass` (words passing through) to answer prefix counts instantly. A DFS that visits children in a…z order lists words in sorted order — the basis of autocomplete.',
      },
      {
        heading: 'Tries prune searches',
        body: 'When searching a grid or string for many words, walk the trie alongside: if the current prefix has no child for the next character, stop immediately. This is why word search II uses a trie instead of a set.',
      },
    ],
    recognition: [
      'Many queries about prefixes of a fixed word list → trie.',
      '"Autocomplete", "shortest root", "longest common prefix" → trie.',
      'Search many words at once in a grid/string → trie-guided DFS.',
    ],
    patterns: ['trie', 'tree-dfs'],
    visualizations: ['tree'],
    exampleA: {
      id: 'd32-A',
      title: 'Trie insert, search and prefix count',
      goal: 'Insert words, then answer "is this a word?" and "how many words start with this prefix?".',
      input: 'insert apple, app, apt, bat; queries app, ap, b, bad',
      output: 'search app = 1\nsearch ap = 0\nprefix ap = 3\nprefix b = 1\nprefix bad = 0',
      idea: 'Each node keeps 26 child indices, a word-end flag and a pass counter. Walking a string either follows edges or falls off the trie.',
      code: cpp`
#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

struct Trie {
    struct Node {
        int next[26];
        bool end = false;
        int pass = 0;  // words that go through this node
        Node() { fill(next, next + 26, -1); }
    };
    vector<Node> nodes{Node()};  // nodes[0] is the root

    void insert(const string& w) {
        int cur = 0;
        for (char ch : w) {
            int c = ch - 'a';
            if (nodes[cur].next[c] == -1) {
                nodes[cur].next[c] = nodes.size();  //@gap
                nodes.push_back(Node());
            }
            cur = nodes[cur].next[c];  //@gap
            nodes[cur].pass++;
        }
        nodes[cur].end = true;
    }
    int walk(const string& s) const {  // node index after s, or -1
        int cur = 0;
        for (char ch : s) {
            cur = nodes[cur].next[ch - 'a'];
            if (cur == -1) return -1;
        }
        return cur;
    }
    bool search(const string& w) const {
        int node = walk(w);
        return node != -1 && nodes[node].end;
    }
    int prefixCount(const string& p) const {
        int node = walk(p);
        return node == -1 ? 0 : nodes[node].pass;
    }
};

int main() {
    Trie t;
    for (string w : {"apple", "app", "apt", "bat"}) t.insert(w);
    cout << "search app = " << t.search("app") << "\n";
    cout << "search ap = " << t.search("ap") << "\n";
    cout << "prefix ap = " << t.prefixCount("ap") << "\n";
    cout << "prefix b = " << t.prefixCount("b") << "\n";
    cout << "prefix bad = " << t.prefixCount("bad") << "\n";
    return 0;
}`,
      keyLines: [
        { match: 'vector<Node> nodes{Node()};  // nodes[0] is the root', note: 'A node pool: children are indices, not pointers.' },
        { match: 'nodes[cur].next[c] = nodes.size();', note: 'Create the missing child and remember its index.' },
        { match: 'nodes[cur].pass++;', note: 'Counts words sharing this prefix.' },
        { match: 'return node != -1 && nodes[node].end;', note: 'A prefix is not a word unless marked.' },
      ],
      dryRun: {
        columns: ['operation', 'nodes after', 'note'],
        rows: [
          ['insert apple', '6', 'root + a p p l e'],
          ['insert app', '6', 'reuses a p p, marks end'],
          ['insert apt', '7', 'branches after "ap"'],
          ['insert bat', '10', 'new branch from root'],
          ['prefix ap', '—', 'pass at "ap" node = 3'],
        ],
      },
      complexity: { time: 'O(L) per operation', space: 'O(total characters × 26)', why: 'One node visited or created per character.' },
      edgeCases: ['Empty string query → root (prefix of all words)', 'Inserting the same word twice (pass counts it twice)'],
      mistakes: ['Holding a reference to nodes[cur] across push_back (reallocation invalidates it)', 'Treating every prefix node as a word'],
      tryIt: 'Add an erase(word) that decrements pass along the path.',
      bug: {
        find: 'return node != -1 && nodes[node].end;',
        replace: 'return node != -1;',
        symptom: 'The program prints "search ap = 1" — a mere prefix is reported as a stored word.',
        explanation: 'Reaching a node only proves the prefix exists. The end flag records whether a word actually finishes there.',
      },
    },
    exampleB: {
      id: 'd32-B',
      kind: 'variant',
      title: 'Autocomplete: first three words with a prefix',
      goal: 'For each typed prefix of "mou", list up to three dictionary words that start with it, in alphabetical order.',
      input: 'words mobile mouse moneypot monitor mousepad; typed m, mo, mou',
      output: 'm: mobile moneypot monitor\nmo: mobile moneypot monitor\nmou: mouse mousepad',
      idea: 'Walk to the prefix node, then DFS its subtree visiting children a→z, stopping after three words.',
      code: cpp`
#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

struct Node {
    int next[26];
    bool end = false;
    Node() { fill(next, next + 26, -1); }
};
vector<Node> nodes{Node()};

void insert(const string& w) {
    int cur = 0;
    for (char ch : w) {
        int c = ch - 'a';
        if (nodes[cur].next[c] == -1) {
            nodes[cur].next[c] = nodes.size();
            nodes.push_back(Node());
        }
        cur = nodes[cur].next[c];
    }
    nodes[cur].end = true;
}

void collect(int node, string& word, vector<string>& out) {
    if ((int)out.size() == 3) return;  // enough suggestions
    if (nodes[node].end) out.push_back(word);
    for (int c = 0; c < 26; c++) {  // a..z gives sorted order
        int child = nodes[node].next[c];
        if (child == -1) continue;
        word.push_back('a' + c);
        collect(child, word, out);
        word.pop_back();
    }
}

int main() {
    for (string w : {"mobile", "mouse", "moneypot", "monitor", "mousepad"}) insert(w);
    string typed = "mou", prefix;
    int cur = 0;
    for (char ch : typed) {
        prefix += ch;
        if (cur != -1) cur = nodes[cur].next[ch - 'a'];
        vector<string> out;
        string word = prefix;
        if (cur != -1) collect(cur, word, out);
        cout << prefix << ":";
        for (auto& s : out) cout << " " << s;
        cout << "\n";
    }
    return 0;
}`,
      keyLines: [
        { match: 'if ((int)out.size() == 3) return;  // enough suggestions', note: 'Stop the DFS as soon as three words are found.' },
        { match: 'if (nodes[node].end) out.push_back(word);', note: 'Pre-order: a word comes before its extensions (mouse before mousepad).' },
        { match: 'for (int c = 0; c < 26; c++) {  // a..z gives sorted order', note: 'Child order equals lexicographic order.' },
        { match: 'if (cur != -1) cur = nodes[cur].next[ch - \'a\'];', note: 'Once the prefix falls off the trie it stays off.' },
      ],
      complexity: { time: 'O(L + visited nodes) per query', space: 'O(total characters × 26)', why: 'The DFS stops early after three words.' },
      edgeCases: ['Prefix not in the trie → empty list', 'Fewer than three matches'],
      mistakes: ['Collecting all words then sorting (slower)', 'Restarting the walk from the root for every typed character'],
      tryIt: 'Return the three most frequent words instead (store a count per word end).',
    },
    complexityNotes: 'Trie operations cost O(L) for a string of length L. Memory is the weak point: 26 ints per node. Use maps or arrays-of-children only for nodes that need them when memory is tight.',
    quiz: [
      {
        prompt: 'Searching a word of length L in a trie with N words costs…',
        options: ['O(N)', 'O(L)', 'O(L log N)', 'O(N · L)'],
        answer: 1,
        explanation: 'One node per character, regardless of N.',
      },
      {
        prompt: 'Why is a separate end flag needed?',
        options: ['To save memory', 'Because a path to a node may be just a prefix of longer words', 'For sorting', 'It is not needed'],
        answer: 1,
        explanation: '"app" exists as a path when "apple" is inserted, but it is not a word unless marked.',
      },
      {
        prompt: 'A DFS visiting children a→z lists the stored words in…',
        options: ['Insertion order', 'Lexicographic order', 'Length order', 'Random order'],
        answer: 1,
        explanation: 'Pre-order with sorted children produces lexicographic order.',
      },
    ],
    recap: 'A trie shares prefixes: walk one node per character. Flags mark word ends, counters answer prefix counts, and an ordered DFS lists words alphabetically. Tries also prune multi-word searches.',
    nextPrep: 'Tomorrow: selection and streaming — quickselect, k-th elements and running medians.',
  },
  questions: [
    {
      id: 'd32-lcp',
      day: 32,
      title: 'Common Start of All Names',
      difficulty: 'Easy',
      topic: 'trees',
      patterns: ['trie', 'two-pointers-same'],
      objective: 'Longest common prefix with a vertical scan.',
      statement: 'Print the longest common prefix of all words, or "-" if it is empty.',
      constraints: ['1 ≤ n ≤ 200', '1 ≤ length ≤ 200'],
      examples: [{ input: 'flower flow flight', output: 'fl' }],
      edgeCases: ['One word → itself', 'No common prefix → "-"'],
      cues: ['Prefix shared by every word'],
      hints: ['Compare column by column until a word ends or differs.', 'In a trie, it is the path while nodes have one child and no word ends.'],
      approach: 'Vertical scan (equivalent to walking a trie down its single-child chain).',
      correctness: 'The prefix stops exactly at the first column where some word disagrees or ends.',
      complexity: { time: 'O(total characters)', space: 'O(1)', why: 'Each character compared at most once.' },
      cpp: cpp`
#include <iostream>
#include <string>
#include <vector>
using namespace std;

string longestCommonPrefix(const vector<string>& w) {
    for (size_t i = 0; i < w[0].size(); i++)
        for (size_t k = 1; k < w.size(); k++)
            if (i >= w[k].size() || w[k][i] != w[0][i]) return w[0].substr(0, i);
    return w[0];
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<string> w(n);
    for (auto& s : w) cin >> s;
    string p = longestCommonPrefix(w);
    cout << (p.empty() ? "-" : p) << "\n";
    return 0;
}`,
      io: 'Input: n, then n words. Output: the prefix or "-".',
      keyLines: [{ match: 'if (i >= w[k].size() || w[k][i] != w[0][i]) return w[0].substr(0, i);', note: 'Stop at the first mismatch or the end of a word.' }],
      mistakes: ['Indexing past the end of a shorter word'],
      tests: [
        { in: '3\nflower flow flight', out: 'fl' },
        { in: '3\ndog racecar car', out: '-' },
        { in: '1\nalone', out: 'alone' },
        { in: '3\nab abc abcd', out: 'ab' },
      ],
    },
    {
      id: 'd32-prefix-count',
      day: 32,
      title: 'Prefix Census',
      difficulty: 'Easy',
      topic: 'trees',
      patterns: ['trie'],
      objective: 'Pass counters on trie nodes.',
      statement: 'Insert n words, then for each of q prefixes print how many words start with it.',
      constraints: ['1 ≤ n, q ≤ 10⁴', 'Lowercase words of length ≤ 30'],
      examples: [{ input: 'words apple app apt bat, queries ap a b c', output: '3 3 1 0' }],
      edgeCases: ['Duplicate words count twice'],
      cues: ['Many prefix-count queries'],
      hints: ['Increment a counter on every node visited during insert.'],
      approach: 'Trie with pass counts.',
      correctness: 'A node\'s counter equals the number of inserted words whose path goes through it.',
      complexity: { time: 'O(total length)', space: 'O(nodes × 26)', why: 'O(L) per insert and query.' },
      cpp: cpp`
#include <iostream>
#include <string>
#include <vector>
using namespace std;

struct PrefixCounter {
    vector<vector<int>> next{vector<int>(26, -1)};
    vector<int> pass{0};
    void insert(const string& w) {
        int cur = 0;
        for (char ch : w) {
            int c = ch - 'a';
            if (next[cur][c] == -1) {
                next[cur][c] = next.size();
                next.push_back(vector<int>(26, -1));
                pass.push_back(0);
            }
            cur = next[cur][c];
            pass[cur]++;
        }
    }
    int count(const string& p) const {
        int cur = 0;
        for (char ch : p) {
            cur = next[cur][ch - 'a'];
            if (cur == -1) return 0;
        }
        return pass[cur];
    }
};`,
      main: cpp`
int main() {
    int n, q;
    cin >> n >> q;
    PrefixCounter t;
    for (int i = 0; i < n; i++) {
        string w;
        cin >> w;
        t.insert(w);
    }
    for (int i = 0; i < q; i++) {
        string p;
        cin >> p;
        cout << (i ? " " : "") << t.count(p);
    }
    cout << "\n";
    return 0;
}`,
      io: 'Input: n q, n words, q prefixes. Output: counts on one line.',
      keyLines: [{ match: 'pass[cur]++;', note: 'Every word passing through increments the counter.' }],
      mistakes: ['Holding a reference into next across push_back'],
      tests: [
        { in: '4 4\napple app apt bat\nap a b c', out: '3 3 1 0' },
        { in: '2 2\nab ab\nab abc', out: '2 0' },
        { in: '1 1\nz\nz', out: '1' },
        { in: '3 3\ncar card care\ncar card cards', out: '3 1 0' },
      ],
      viz: 'tree',
    },
    {
      id: 'd32-trie-ops',
      day: 32,
      title: 'Dictionary Command Line',
      difficulty: 'Medium',
      topic: 'trees',
      patterns: ['trie'],
      objective: 'Implement insert / search / startsWith.',
      statement: 'Process commands: "add w", "has w" (print 1 if w was added, else 0) and "pre p" (print 1 if some added word starts with p, else 0). Print the outputs separated by spaces.',
      constraints: ['1 ≤ commands ≤ 10⁴', 'Lowercase strings of length ≤ 30'],
      examples: [{ input: 'add apple, has apple, has app, pre app, add app, has app', output: '1 0 1 1' }],
      edgeCases: ['Query before any add'],
      cues: ['Exact-match and prefix queries on a growing set'],
      hints: ['Mark word ends separately from prefix existence.'],
      approach: 'Pointer-free trie in a node pool.',
      correctness: 'has checks the end flag; pre only checks path existence.',
      complexity: { time: 'O(L) per command', space: 'O(total characters × 26)', why: 'Standard trie.' },
      cpp: cpp`
#include <array>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

struct Trie {
    vector<array<int, 26>> next;
    vector<bool> end;
    Trie() { addNode(); }
    int addNode() {
        array<int, 26> blank;
        blank.fill(-1);
        next.push_back(blank);
        end.push_back(false);
        return next.size() - 1;
    }
    void add(const string& w) {
        int cur = 0;
        for (char ch : w) {
            int c = ch - 'a';
            if (next[cur][c] == -1) {
                int child = addNode();
                next[cur][c] = child;
            }
            cur = next[cur][c];
        }
        end[cur] = true;
    }
    int walk(const string& s) const {
        int cur = 0;
        for (char ch : s)
            if ((cur = next[cur][ch - 'a']) == -1) return -1;
        return cur;
    }
    bool has(const string& w) const {
        int n = walk(w);
        return n != -1 && end[n];
    }
    bool pre(const string& p) const { return walk(p) != -1; }
};`,
      main: cpp`
int main() {
    int q;
    cin >> q;
    Trie t;
    bool first = true;
    while (q--) {
        string op, s;
        cin >> op >> s;
        if (op == "add") {
            t.add(s);
            continue;
        }
        int r = op == "has" ? t.has(s) : t.pre(s);
        cout << (first ? "" : " ") << r;
        first = false;
    }
    cout << "\n";
    return 0;
}`,
      io: 'Input: q, then q commands "op string". Output: query answers separated by spaces.',
      keyLines: [
        { match: 'int child = addNode();', note: 'Create first, then link: addNode may reallocate next.' },
        { match: 'bool pre(const string& p) const { return walk(p) != -1; }', note: 'Prefix existence ignores end flags.' },
      ],
      mistakes: ['next[cur][c] = addNode(); — the left side may be evaluated before reallocation (dangling reference before C++17 sequencing)'],
      tests: [
        { in: '6\nadd apple\nhas apple\nhas app\npre app\nadd app\nhas app', out: '1 0 1 1' },
        { in: '2\nhas a\npre a', out: '0 0' },
        { in: '4\nadd abc\npre abcd\npre ab\nhas abc', out: '0 1 1' },
        { in: '3\nadd x\nhas x\npre x', out: '1 1' },
      ],
    },
    {
      id: 'd32-replace-words',
      day: 32,
      title: 'Shortening to Word Roots',
      difficulty: 'Medium',
      topic: 'trees',
      patterns: ['trie'],
      objective: 'Find the shortest stored prefix of each word.',
      statement: 'Given root words and a sentence, replace every word in the sentence by the shortest root that is a prefix of it (if any). Print the new sentence.',
      constraints: ['1 ≤ roots ≤ 1000', 'Sentence ≤ 10⁴ words'],
      examples: [{ input: 'roots cat bat rat; sentence "the cattle was rattled by the battery"', output: 'the cat was rat by the bat' }],
      edgeCases: ['A word shorter than every root', 'Roots that are prefixes of other roots'],
      cues: ['Shortest prefix from a set'],
      hints: ['Walk the word in the trie; stop at the first end flag.'],
      approach: 'Trie of roots, early stop.',
      correctness: 'The first end flag on the path is the shortest root that prefixes the word.',
      complexity: { time: 'O(total characters)', space: 'O(root characters × 26)', why: 'One walk per word.' },
      cpp: cpp`
#include <array>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

struct RootTrie {
    vector<array<int, 26>> next{array<int, 26>{}};
    vector<bool> end{false};
    void add(const string& w) {
        int cur = 0;
        for (char ch : w) {
            int c = ch - 'a';
            if (!next[cur][c]) {  // 0 means "no child": the root is never a child
                next[cur][c] = next.size();
                next.push_back(array<int, 26>{});
                end.push_back(false);
            }
            cur = next[cur][c];
        }
        end[cur] = true;
    }
    string shorten(const string& w) const {
        int cur = 0;
        for (size_t i = 0; i < w.size(); i++) {
            cur = next[cur][w[i] - 'a'];
            if (!cur) return w;
            if (end[cur]) return w.substr(0, i + 1);
        }
        return w;
    }
};`,
      main: cpp`
int main() {
    int r, n;
    cin >> r >> n;
    RootTrie t;
    for (int i = 0; i < r; i++) {
        string w;
        cin >> w;
        t.add(w);
    }
    for (int i = 0; i < n; i++) {
        string w;
        cin >> w;
        cout << (i ? " " : "") << t.shorten(w);
    }
    cout << "\n";
    return 0;
}`,
      io: 'Input: r n, then r roots, then n sentence words. Output: the new sentence.',
      keyLines: [{ match: 'if (end[cur]) return w.substr(0, i + 1);', note: 'First root reached is the shortest.' }],
      mistakes: ['Returning the longest matching root'],
      tests: [
        { in: '3 7\ncat bat rat\nthe cattle was rattled by the battery', out: 'the cat was rat by the bat' },
        { in: '3 4\na b c\naadsfasf absbs bbab cadsfafs', out: 'a a b c' },
        { in: '1 2\nlonger\nlong word', out: 'long word' },
        { in: '2 1\nab abc\nabcdef', out: 'ab' },
      ],
    },
    {
      id: 'd32-search-suggestions',
      day: 32,
      title: 'Store Search Box',
      difficulty: 'Medium',
      topic: 'trees',
      patterns: ['trie', 'binary-search'],
      objective: 'Autocomplete after each typed character.',
      statement: 'Given product names and a typed word, after each typed character print up to three products (alphabetically smallest) that start with the typed prefix, or "-" if none.',
      constraints: ['1 ≤ products ≤ 1000', 'Lengths ≤ 100'],
      examples: [{ input: 'products mobile mouse moneypot monitor mousepad, typed mouse', output: 'mobile moneypot monitor\nmobile moneypot monitor\nmouse mousepad\nmouse mousepad\nmouse mousepad' }],
      edgeCases: ['Prefix with no matches → "-" from then on'],
      cues: ['Suggestions per prefix, sorted'],
      hints: ['Sorting + lower_bound works as well as a trie here.', 'Matches for a prefix are a contiguous block in sorted order.'],
      approach: 'Sort products; for each prefix, lower_bound then take up to three that match.',
      correctness: 'In sorted order all words with a given prefix are contiguous and start at lower_bound(prefix).',
      complexity: { time: 'O(n log n + L · (log n · L))', space: 'O(1) extra', why: 'One binary search per typed character.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

vector<vector<string>> suggestions(vector<string> products, const string& typed) {
    sort(products.begin(), products.end());
    vector<vector<string>> res;
    string prefix;
    for (char ch : typed) {
        prefix += ch;
        auto it = lower_bound(products.begin(), products.end(), prefix);
        vector<string> cur;
        for (; it != products.end() && cur.size() < 3; ++it) {
            if (it->compare(0, prefix.size(), prefix) != 0) break;
            cur.push_back(*it);
        }
        res.push_back(cur);
    }
    return res;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<string> products(n);
    for (auto& p : products) cin >> p;
    string typed;
    cin >> typed;
    for (auto& row : suggestions(products, typed)) {
        if (row.empty()) cout << "-";
        for (size_t i = 0; i < row.size(); i++) cout << (i ? " " : "") << row[i];
        cout << "\n";
    }
    return 0;
}`,
      io: 'Input: n, n products, then the typed word. Output: one line per typed character.',
      keyLines: [{ match: 'if (it->compare(0, prefix.size(), prefix) != 0) break;', note: 'Leaving the contiguous block of matches.' }],
      mistakes: ['Scanning all products for every prefix (O(n · L²))'],
      tests: [
        { in: '5\nmobile mouse moneypot monitor mousepad\nmouse', out: 'mobile moneypot monitor\nmobile moneypot monitor\nmouse mousepad\nmouse mousepad\nmouse mousepad' },
        { in: '1\nhavana\ntatiana', out: '-\n-\n-\n-\n-\n-\n-' },
        { in: '3\nbags baggage banner\nbags', out: 'baggage bags banner\nbaggage bags banner\nbaggage bags\nbags' },
        { in: '2\nab ab\na', out: 'ab ab' },
      ],
    },
    {
      id: 'd32-longest-word',
      day: 32,
      title: 'Word Built Letter by Letter',
      difficulty: 'Medium',
      topic: 'trees',
      patterns: ['trie', 'tree-dfs'],
      objective: 'DFS only through word-end nodes.',
      statement: 'Find the longest word that can be built one character at a time, where every prefix is also in the list. Ties → lexicographically smallest. Print "-" if none.',
      constraints: ['1 ≤ n ≤ 1000', 'Lengths ≤ 30'],
      examples: [{ input: 'w wo wor worl world', output: 'world' }],
      edgeCases: ['No single-letter words → "-"'],
      cues: ['Every prefix must also be a word'],
      hints: ['Insert all words.', 'DFS from the root, only stepping into children marked as word ends.'],
      approach: 'Trie + DFS restricted to end nodes; children a→z gives the tie-break.',
      correctness: 'A node is reachable in the DFS iff every prefix of its word is a word.',
      complexity: { time: 'O(total characters)', space: 'O(nodes × 26)', why: 'Each node visited at most once.' },
      cpp: cpp`
#include <array>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

vector<array<int, 26>> nxt;
vector<bool> isEnd;

void dfs(int node, string& cur, string& best) {
    if (cur.size() > best.size()) best = cur;  // a..z order: first of a length is smallest
    for (int c = 0; c < 26; c++) {
        int child = nxt[node][c];
        if (child && isEnd[child]) {
            cur.push_back('a' + c);
            dfs(child, cur, best);
            cur.pop_back();
        }
    }
}

string longestWord(const vector<string>& words) {
    nxt.assign(1, array<int, 26>{});
    isEnd.assign(1, false);
    for (const string& w : words) {
        int cur = 0;
        for (char ch : w) {
            int c = ch - 'a';
            if (!nxt[cur][c]) {
                nxt[cur][c] = nxt.size();
                nxt.push_back(array<int, 26>{});
                isEnd.push_back(false);
            }
            cur = nxt[cur][c];
        }
        isEnd[cur] = true;
    }
    string cur, best;
    dfs(0, cur, best);
    return best;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<string> w(n);
    for (auto& s : w) cin >> s;
    string best = longestWord(w);
    cout << (best.empty() ? "-" : best) << "\n";
    return 0;
}`,
      io: 'Input: n, then n words. Output: the word or "-".',
      keyLines: [{ match: 'if (child && isEnd[child]) {', note: 'Only continue through complete words.' }],
      mistakes: ['Choosing the longest word without checking all prefixes'],
      tests: [
        { in: '5\nw wo wor worl world', out: 'world' },
        { in: '7\na banana app appl ap apply apple', out: 'apple' },
        { in: '2\nab abc', out: '-' },
        { in: '4\nb a ba ab', out: 'ab' },
      ],
    },
    {
      id: 'd32-distinct-substrings',
      day: 32,
      title: 'Counting Distinct Fragments',
      difficulty: 'Medium',
      topic: 'trees',
      patterns: ['trie'],
      objective: 'Every new trie node is a new distinct substring.',
      statement: 'Print the number of distinct non-empty substrings of s.',
      constraints: ['1 ≤ |s| ≤ 1000', 'Lowercase letters'],
      examples: [{ input: 'abab', output: '7', explanation: 'a, b, ab, ba, aba, bab, abab' }],
      edgeCases: ['All same letters → n'],
      cues: ['Distinct substrings = distinct prefixes of suffixes'],
      hints: ['Insert every suffix into a trie.', 'Count the nodes created (excluding the root).'],
      approach: 'Suffix trie, O(n²) nodes at most.',
      correctness: 'Each substring is a prefix of exactly one path from the root; distinct substrings ↔ non-root nodes.',
      complexity: { time: 'O(n²)', space: 'O(n² × 26) worst case', why: 'Up to n(n+1)/2 nodes.' },
      cpp: cpp`
#include <array>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

long long distinctSubstrings(const string& s) {
    vector<array<int, 26>> next(1, array<int, 26>{});
    for (size_t i = 0; i < s.size(); i++) {
        int cur = 0;
        for (size_t j = i; j < s.size(); j++) {
            int c = s[j] - 'a';
            if (!next[cur][c]) {
                next[cur][c] = next.size();
                next.push_back(array<int, 26>{});
            }
            cur = next[cur][c];
        }
    }
    return next.size() - 1;
}`,
      main: cpp`
int main() {
    string s;
    cin >> s;
    cout << distinctSubstrings(s) << "\n";
    return 0;
}`,
      io: 'Input: s. Output: number of distinct substrings.',
      keyLines: [{ match: 'return next.size() - 1;', note: 'All nodes but the root.' }],
      mistakes: ['Storing all substrings in a set (O(n³) memory/time)'],
      tests: [
        { in: 'abab', out: '7' },
        { in: 'aaaa', out: '4' },
        { in: 'abc', out: '6' },
        { in: 'banana', out: '15' },
      ],
    },
    {
      id: 'd32-word-search-ii',
      day: 32,
      title: 'Word Hunt Board',
      difficulty: 'Hard',
      topic: 'trees',
      patterns: ['trie', 'backtracking', 'grid-traversal'],
      objective: 'Trie-guided backtracking on a grid.',
      statement: 'Find all dictionary words that can be traced on the letter board by moving between horizontally/vertically adjacent cells without reusing a cell within one word. Print them sorted, or "-" if none.',
      constraints: ['1 ≤ R, C ≤ 12', '1 ≤ words ≤ 3·10⁴', 'Word length ≤ 10'],
      examples: [{ input: 'board oaan / etae / ihkr / iflv, words oath pea eat rain', output: 'eat oath' }],
      edgeCases: ['Same word found twice (report once)', 'Word longer than the board area'],
      cues: ['Many words searched in a grid simultaneously'],
      hints: ['Insert all words into a trie; store the word index at its end node.', 'DFS from each cell while the trie has a matching child; clear the word index after reporting.'],
      brute: 'Run a separate DFS for each word — far too slow.',
      approach: 'Backtracking over the grid synchronised with a trie walk.',
      correctness: 'Each DFS path corresponds to a trie path; a word is reported exactly when its end node is reached.',
      complexity: { time: 'O(R · C · 4 · 3^(L−1)) worst case', space: 'O(total word characters)', why: 'The trie prunes most branches early.' },
      cpp: cpp`
#include <algorithm>
#include <array>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

vector<array<int, 26>> nxt;
vector<int> wordAt;  // index of the word ending here, or -1
vector<string> board, dict, found;

void dfs(int r, int c, int node) {
    char ch = board[r][c];
    if (ch == '#') return;
    int child = nxt[node][ch - 'a'];
    if (!child) return;  // no word continues this way
    if (wordAt[child] != -1) {
        found.push_back(dict[wordAt[child]]);
        wordAt[child] = -1;  // report each word once
    }
    board[r][c] = '#';
    const int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
    for (int d = 0; d < 4; d++) {
        int nr = r + dr[d], nc = c + dc[d];
        if (nr >= 0 && nr < (int)board.size() && nc >= 0 && nc < (int)board[0].size()) dfs(nr, nc, child);
    }
    board[r][c] = ch;
}

vector<string> findWords() {
    nxt.assign(1, array<int, 26>{});
    wordAt.assign(1, -1);
    for (int i = 0; i < (int)dict.size(); i++) {
        int cur = 0;
        for (char ch : dict[i]) {
            int c = ch - 'a';
            if (!nxt[cur][c]) {
                nxt[cur][c] = nxt.size();
                nxt.push_back(array<int, 26>{});
                wordAt.push_back(-1);
            }
            cur = nxt[cur][c];
        }
        wordAt[cur] = i;
    }
    found.clear();
    for (int r = 0; r < (int)board.size(); r++)
        for (int c = 0; c < (int)board[0].size(); c++) dfs(r, c, 0);
    sort(found.begin(), found.end());
    return found;
}`,
      main: cpp`
int main() {
    int R, C, w;
    cin >> R >> C;
    board.resize(R);
    for (auto& row : board) cin >> row;
    cin >> w;
    dict.resize(w);
    for (auto& s : dict) cin >> s;
    vector<string> res = findWords();
    if (res.empty()) cout << "-";
    for (size_t i = 0; i < res.size(); i++) cout << (i ? " " : "") << res[i];
    cout << "\n";
    return 0;
}`,
      io: 'Input: R C, R board rows, then w and w words. Output: found words sorted, or "-".',
      keyLines: [
        { match: 'if (!child) return;  // no word continues this way', note: 'The trie prunes the search immediately.' },
        { match: 'wordAt[child] = -1;  // report each word once', note: 'Prevents duplicates when a word is found along several paths.' },
        { match: 'board[r][c] = \'#\';', note: 'Mark visited for this path; restored on backtrack.' },
      ],
      mistakes: ['Forgetting to restore the cell after backtracking', 'Reporting duplicates'],
      tests: [
        { in: '4 4\noaan\netae\nihkr\niflv\n4\noath pea eat rain', out: 'eat oath' },
        { in: '2 2\nab\ncd\n1\nabcb', out: '-' },
        { in: '1 3\naaa\n2\naa aaaa', out: 'aa' },
        { in: '2 2\nab\ndc\n3\nabcd dcba bc', out: 'abcd bc dcba' },
      ],
    },
  ],
};

export default day;
