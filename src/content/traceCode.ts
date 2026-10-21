// Complete C++17 programs whose execution is mirrored step-by-step by the
// generators in src/lib/viz/traces.ts. Trailing `//#marker` comments link a
// code line to trace steps; `//@gap` marks lines used in fill-the-gap mode.
// Every program here is compiled and run by scripts/verify-cpp.ts.
import { cpp } from './cpp';
import type { TraceId } from '../types/content';

export const TRACE_CODE: Record<TraceId, string> = {
  'running-sum': cpp`
#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<int> a = {4, -2, 7, 7, 1};
    long long sum = 0;                         //#init
    int best = a[0], bestIdx = 0;              //#init2
    for (int i = 0; i < (int)a.size(); i++) {
        sum += a[i];                           //#add @gap
        if (a[i] > best) {                     //#cmp @gap
            best = a[i];                       //#upd
            bestIdx = i;
        }
    }
    cout << "sum = " << sum << "\n";
    cout << "max = " << best << " at index " << bestIdx << "\n";  //#print
    return 0;
}`,

  'prefix-sum': cpp`
#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<int> a = {3, 1, 4, 1, 5, 9, 2};
    int n = a.size();
    // prefix[i] = sum of the first i elements, so prefix[0] = 0.
    vector<long long> prefix(n + 1, 0);        //#init
    for (int i = 0; i < n; i++) {
        prefix[i + 1] = prefix[i] + a[i];      //#build @gap
    }
    vector<pair<int, int>> queries = {{1, 3}, {0, 6}, {4, 4}};
    for (auto [l, r] : queries) {
        long long sum = prefix[r + 1] - prefix[l];  //#query @gap
        cout << "sum[" << l << ".." << r << "] = " << sum << "\n";  //#print
    }
    return 0;
}`,

  'two-sum-hash': cpp`
#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;

vector<int> twoSum(const vector<int>& nums, int target) {
    // value -> index of a value we have already passed
    unordered_map<int, int> seen;              //#init
    for (int i = 0; i < (int)nums.size(); i++) {
        int need = target - nums[i];           //#need @gap
        auto it = seen.find(need);             //#lookup
        if (it != seen.end()) {
            return {it->second, i};            //#found
        }
        seen[nums[i]] = i;                     //#store @gap
    }
    return {};                                 //#none
}

int main() {
    vector<int> nums = {3, 8, 4, 9, 1, 6};
    vector<int> ans = twoSum(nums, 10);
    if (ans.empty()) cout << "no pair\n";
    else cout << "indices " << ans[0] << " " << ans[1] << "\n";
    return 0;
}`,

  'pair-sum-sorted': cpp`
#include <iostream>
#include <utility>
#include <vector>
using namespace std;

// a must be sorted in non-decreasing order.
pair<int, int> pairSum(const vector<int>& a, int target) {
    int left = 0, right = (int)a.size() - 1;   //#init
    while (left < right) {                     //#loop
        int sum = a[left] + a[right];          //#sum
        if (sum == target) return {left, right};  //#found
        if (sum < target) left++;              //#left @gap
        else right--;                          //#right @gap
    }
    return {-1, -1};                           //#none
}

int main() {
    vector<int> a = {1, 3, 4, 6, 8, 11};
    auto [i, j] = pairSum(a, 10);
    if (i == -1) cout << "no pair\n";
    else cout << "pair at " << i << " " << j << " (" << a[i] << " + " << a[j] << ")\n";
    return 0;
}`,

  'window-fixed': cpp`
#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<int> a = {2, 1, 5, 1, 3, 2};
    int k = 3;
    if (k > (int)a.size()) {
        cout << "window larger than array\n";
        return 0;
    }
    long long window = 0;                      //#init
    for (int i = 0; i < k; i++) window += a[i];  //#first
    long long best = window;
    int bestStart = 0;                         //#best0
    for (int right = k; right < (int)a.size(); right++) {
        window += a[right] - a[right - k];     //#slide @gap
        if (window > best) {                   //#cmp
            best = window;                     //#upd
            bestStart = right - k + 1;
        }
    }
    cout << "max sum " << best << " starts at " << bestStart << "\n";  //#print
    return 0;
}`,

  'window-variable': cpp`
#include <iostream>
#include <string>
#include <vector>
using namespace std;

int main() {
    string s = "abcbdca";
    vector<int> last(256, -1);                 //#init
    int left = 0, best = 0, bestStart = 0;
    for (int right = 0; right < (int)s.size(); right++) {
        int c = (unsigned char)s[right];       //#read
        if (last[c] >= left) {                 //#dup @gap
            left = last[c] + 1;                //#shrink @gap
        }
        last[c] = right;                       //#mark
        if (right - left + 1 > best) {         //#cmp
            best = right - left + 1;           //#upd
            bestStart = left;
        }
    }
    cout << "longest " << best << " \"" << s.substr(bestStart, best) << "\"\n";  //#print
    return 0;
}`,

  'binary-search': cpp`
#include <iostream>
#include <vector>
using namespace std;

int binarySearch(const vector<int>& a, int target) {
    int lo = 0, hi = (int)a.size() - 1;        //#init
    while (lo <= hi) {                         //#loop
        int mid = lo + (hi - lo) / 2;          //#mid @gap
        if (a[mid] == target) return mid;      //#found
        if (a[mid] < target) lo = mid + 1;     //#right @gap
        else hi = mid - 1;                     //#left
    }
    return -1;                                 //#none
}

int main() {
    vector<int> a = {2, 5, 8, 12, 16, 23, 38, 56, 72, 91};
    int target = 23;
    int idx = binarySearch(a, target);
    if (idx == -1) cout << target << " not found\n";
    else cout << "found " << target << " at index " << idx << "\n";
    return 0;
}`,

  'lower-bound': cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

// First index i with a[i] >= target; a.size() if none. Search space is [lo, hi).
int lowerBound(const vector<int>& a, int target) {
    int lo = 0, hi = (int)a.size();            //#init
    while (lo < hi) {                          //#loop
        int mid = lo + (hi - lo) / 2;          //#mid
        if (a[mid] < target) lo = mid + 1;     //#right @gap
        else hi = mid;                         //#left @gap
    }
    return lo;                                 //#ret
}

int main() {
    vector<int> a = {1, 2, 2, 2, 5, 7};
    int target = 2;
    int first = lowerBound(a, target);
    int after = upper_bound(a.begin(), a.end(), target) - a.begin();
    cout << "first index with a[i] >= " << target << ": " << first << "\n";
    cout << "count of " << target << ": " << after - first << "\n";
    return 0;
}`,

  'fast-slow-cycle': cpp`
#include <iostream>
#include <vector>
using namespace std;

struct ListNode {
    int val;
    ListNode* next;
    ListNode(int v) : val(v), next(nullptr) {}
};

// Floyd's algorithm: returns the first node of the cycle, or nullptr.
ListNode* cycleStart(ListNode* head) {
    ListNode* slow = head;                     //#init
    ListNode* fast = head;
    while (fast && fast->next) {               //#loop
        slow = slow->next;                     //#move @gap
        fast = fast->next->next;               //@gap
        if (slow == fast) {                    //#meet
            ListNode* p = head;                //#phase2
            while (p != slow) {                //#loop2
                p = p->next;                   //#move2
                slow = slow->next;
            }
            return p;                          //#found
        }
    }
    return nullptr;                            //#none
}

int main() {
    vector<ListNode*> nodes;
    for (int v = 1; v <= 6; v++) nodes.push_back(new ListNode(v));
    for (int i = 0; i + 1 < 6; i++) nodes[i]->next = nodes[i + 1];
    nodes[5]->next = nodes[2];  // tail links back to the node holding 3
    ListNode* start = cycleStart(nodes[0]);
    if (start) cout << "cycle starts at value " << start->val << "\n";
    else cout << "no cycle\n";
    for (ListNode* p : nodes) delete p;
    return 0;
}`,

  'next-greater': cpp`
#include <iostream>
#include <stack>
#include <vector>
using namespace std;

vector<int> nextGreater(const vector<int>& a) {
    int n = a.size();
    vector<int> ans(n, -1);                    //#init
    stack<int> st;  // indices still waiting for a greater element; values decrease bottom->top
    for (int i = 0; i < n; i++) {
        while (!st.empty() && a[st.top()] < a[i]) {  //#check @gap
            ans[st.top()] = a[i];              //#resolve
            st.pop();
        }
        st.push(i);                            //#push @gap
    }
    return ans;                                //#ret
}

int main() {
    vector<int> a = {2, 1, 2, 4, 3};
    vector<int> ans = nextGreater(a);
    cout << "next greater:";
    for (int x : ans) cout << " " << x;
    cout << "\n";
    return 0;
}`,

  'insertion-sort': cpp`
#include <iostream>
#include <vector>
using namespace std;

void insertionSort(vector<int>& a) {
    for (int i = 1; i < (int)a.size(); i++) {
        int key = a[i];                        //#key
        int j = i - 1;
        while (j >= 0 && a[j] > key) {         //#cmp @gap
            a[j + 1] = a[j];                   //#shift @gap
            j--;
        }
        a[j + 1] = key;                        //#insert
    }
}

int main() {
    vector<int> a = {5, 2, 4, 6, 1, 3};
    insertionSort(a);
    cout << "sorted:";
    for (int x : a) cout << " " << x;
    cout << "\n";
    return 0;
}`,

  subsets: cpp`
#include <iostream>
#include <vector>
using namespace std;

void backtrack(const vector<int>& nums, int start, vector<int>& cur, vector<vector<int>>& out) {
    out.push_back(cur);                        //#record
    for (int i = start; i < (int)nums.size(); i++) {
        cur.push_back(nums[i]);                //#choose @gap
        backtrack(nums, i + 1, cur, out);      //#recurse
        cur.pop_back();                        //#undo @gap
    }
}

int main() {
    vector<int> nums = {1, 2, 3};
    vector<vector<int>> out;
    vector<int> cur;
    backtrack(nums, 0, cur, out);
    for (const auto& s : out) {
        cout << "[";
        for (int i = 0; i < (int)s.size(); i++) cout << (i ? "," : "") << s[i];
        cout << "]\n";
    }
    cout << "total " << out.size() << "\n";
    return 0;
}`,

  'bfs-grid': cpp`
#include <iostream>
#include <queue>
#include <string>
#include <vector>
using namespace std;

// 'S' start, 'G' goal, '#' wall, '.' open. Moves: up, right, down, left.
int shortestPath(const vector<string>& g) {
    int R = g.size(), C = g[0].size();
    vector<vector<int>> dist(R, vector<int>(C, -1));
    queue<pair<int, int>> q;
    for (int r = 0; r < R; r++)
        for (int c = 0; c < C; c++)
            if (g[r][c] == 'S') { dist[r][c] = 0; q.push({r, c}); }  //#start
    int dr[] = {-1, 0, 1, 0}, dc[] = {0, 1, 0, -1};
    while (!q.empty()) {
        auto [r, c] = q.front();               //#pop
        q.pop();
        if (g[r][c] == 'G') return dist[r][c];  //#goal
        for (int k = 0; k < 4; k++) {
            int nr = r + dr[k], nc = c + dc[k];
            if (nr < 0 || nc < 0 || nr >= R || nc >= C) continue;
            if (g[nr][nc] == '#' || dist[nr][nc] != -1) continue;  //#skip @gap
            dist[nr][nc] = dist[r][c] + 1;     //#push @gap
            q.push({nr, nc});
        }
    }
    return -1;                                 //#none
}

int main() {
    vector<string> grid = {
        "S..#",
        ".#..",
        "...#",
        "#.G.",
    };
    cout << "shortest path length = " << shortestPath(grid) << "\n";
    return 0;
}`,

  dijkstra: cpp`
#include <climits>
#include <iostream>
#include <queue>
#include <vector>
using namespace std;

vector<long long> dijkstra(int n, const vector<vector<pair<int, int>>>& adj, int src) {
    const long long INF = LLONG_MAX;
    vector<long long> dist(n, INF);
    // min-heap of (distance, node)
    priority_queue<pair<long long, int>, vector<pair<long long, int>>, greater<>> pq;  //#init
    dist[src] = 0;
    pq.push({0, src});
    while (!pq.empty()) {
        auto [d, u] = pq.top();                //#pop
        pq.pop();
        if (d > dist[u]) continue;             //#stale @gap
        for (auto [v, w] : adj[u]) {
            if (dist[u] + w < dist[v]) {       //#relax @gap
                dist[v] = dist[u] + w;         //#update
                pq.push({dist[v], v});
            }
        }
    }
    return dist;
}

int main() {
    int n = 5;
    vector<vector<pair<int, int>>> adj(n);
    auto addEdge = [&](int u, int v, int w) { adj[u].push_back({v, w}); };
    addEdge(0, 1, 4);
    addEdge(0, 2, 1);
    addEdge(2, 1, 2);
    addEdge(1, 3, 1);
    addEdge(2, 3, 5);
    addEdge(3, 4, 3);
    vector<long long> dist = dijkstra(n, adj, 0);
    cout << "dist:";
    for (long long d : dist) {
        if (d == LLONG_MAX) cout << " INF";
        else cout << " " << d;
    }
    cout << "\n";
    return 0;
}`,

  'topo-kahn': cpp`
#include <iostream>
#include <queue>
#include <vector>
using namespace std;

// Returns a topological order, or an empty vector if there is a cycle.
vector<int> topoSort(int n, const vector<pair<int, int>>& edges) {
    vector<vector<int>> adj(n);
    vector<int> indeg(n, 0);
    for (auto [u, v] : edges) {
        adj[u].push_back(v);
        indeg[v]++;                            //#indeg
    }
    queue<int> q;
    for (int i = 0; i < n; i++)
        if (indeg[i] == 0) q.push(i);          //#seed
    vector<int> order;
    while (!q.empty()) {
        int u = q.front();                     //#pop
        q.pop();
        order.push_back(u);
        for (int v : adj[u]) {
            if (--indeg[v] == 0) q.push(v);    //#relax @gap
        }
    }
    if ((int)order.size() != n) return {};     //#cycle
    return order;
}

int main() {
    // edge u -> v means "u must come before v"
    vector<pair<int, int>> edges = {{0, 1}, {0, 2}, {1, 3}, {2, 3}, {3, 4}, {5, 4}};
    vector<int> order = topoSort(6, edges);
    if (order.empty()) {
        cout << "cycle detected\n";
        return 0;
    }
    cout << "order:";
    for (int u : order) cout << " " << u;
    cout << "\n";
    return 0;
}`,

  'union-find': cpp`
#include <iostream>
#include <numeric>
#include <vector>
using namespace std;

struct DSU {
    vector<int> parent, sz;
    DSU(int n) : parent(n), sz(n, 1) { iota(parent.begin(), parent.end(), 0); }
    int find(int x) {
        if (parent[x] != x) parent[x] = find(parent[x]);  //#find @gap
        return parent[x];
    }
    bool unite(int a, int b) {
        a = find(a);                           //#roots
        b = find(b);
        if (a == b) return false;              //#same
        if (sz[a] < sz[b]) swap(a, b);         //#size @gap
        parent[b] = a;                         //#link
        sz[a] += sz[b];
        return true;
    }
};

int main() {
    int n = 6;
    DSU dsu(n);
    vector<pair<int, int>> ops = {{0, 1}, {2, 3}, {1, 3}, {4, 5}, {0, 3}};
    int components = n;
    for (auto [a, b] : ops) {
        bool merged = dsu.unite(a, b);
        if (merged) components--;
        cout << "unite(" << a << "," << b << ") " << (merged ? "merged" : "already connected") << "\n";
    }
    cout << "components = " << components << "\n";
    return 0;
}`,

  'climb-stairs': cpp`
#include <iostream>
#include <vector>
using namespace std;

// Ways to reach step n taking 1 or 2 steps at a time.
long long climbStairs(int n) {
    vector<long long> dp(n + 1, 0);
    dp[0] = 1;                                 //#base
    if (n >= 1) dp[1] = 1;
    for (int i = 2; i <= n; i++) {
        dp[i] = dp[i - 1] + dp[i - 2];         //#trans @gap
    }
    return dp[n];                              //#ret
}

int main() {
    int n = 6;
    cout << "ways(" << n << ") = " << climbStairs(n) << "\n";
    return 0;
}`,

  'house-robber': cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

long long rob(const vector<int>& a) {
    int n = a.size();
    if (n == 0) return 0;
    vector<long long> dp(n);  // dp[i] = best loot using houses 0..i
    dp[0] = a[0];                              //#base
    for (int i = 1; i < n; i++) {
        long long skip = dp[i - 1];            //#skip
        long long take = a[i] + (i >= 2 ? dp[i - 2] : 0);  //#take @gap
        dp[i] = max(skip, take);               //#best @gap
    }
    return dp[n - 1];                          //#ret
}

int main() {
    vector<int> houses = {2, 7, 9, 3, 1};
    cout << "max loot = " << rob(houses) << "\n";
    return 0;
}`,

  knapsack: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

// dp[i][w] = best value using the first i items with capacity w.
int knapsack(const vector<int>& wt, const vector<int>& val, int W) {
    int n = wt.size();
    vector<vector<int>> dp(n + 1, vector<int>(W + 1, 0));  //#init
    for (int i = 1; i <= n; i++) {
        for (int w = 0; w <= W; w++) {
            dp[i][w] = dp[i - 1][w];           //#skip @gap
            if (wt[i - 1] <= w) {
                dp[i][w] = max(dp[i][w], dp[i - 1][w - wt[i - 1]] + val[i - 1]);  //#take @gap
            }
        }
    }
    return dp[n][W];                           //#ret
}

int main() {
    vector<int> wt = {1, 3, 4, 5};
    vector<int> val = {1, 4, 5, 7};
    cout << "best value = " << knapsack(wt, val, 7) << "\n";
    return 0;
}`,

  'heap-topk': cpp`
#include <functional>
#include <iostream>
#include <queue>
#include <vector>
using namespace std;

// k largest values using a min-heap that never holds more than k items.
vector<int> topK(const vector<int>& nums, int k) {
    priority_queue<int, vector<int>, greater<int>> heap;  //#init
    for (int x : nums) {
        heap.push(x);                          //#push
        if ((int)heap.size() > k) heap.pop();  //#pop @gap
    }
    vector<int> out;
    while (!heap.empty()) {
        out.push_back(heap.top());             //#drain
        heap.pop();
    }
    return out;  // ascending order
}

int main() {
    vector<int> nums = {5, 1, 9, 3, 7, 6, 8};
    vector<int> best = topK(nums, 3);
    cout << "top 3:";
    for (int x : best) cout << " " << x;
    cout << "\n";
    return 0;
}`,

  'level-order': cpp`
#include <iostream>
#include <queue>
#include <vector>
using namespace std;

struct TreeNode {
    int val;
    TreeNode *left = nullptr, *right = nullptr;
    TreeNode(int v) : val(v) {}
};

vector<vector<int>> levelOrder(TreeNode* root) {
    vector<vector<int>> levels;
    if (!root) return levels;
    queue<TreeNode*> q;
    q.push(root);                              //#init
    while (!q.empty()) {
        int size = q.size();                   //#size @gap
        vector<int> level;
        for (int i = 0; i < size; i++) {
            TreeNode* node = q.front();        //#pop
            q.pop();
            level.push_back(node->val);
            if (node->left) q.push(node->left);    //#kids
            if (node->right) q.push(node->right);
        }
        levels.push_back(level);               //#level
    }
    return levels;
}

int main() {
    // Tree: 3 has children 9 and 20; 20 has children 15 and 7.
    TreeNode n15(15), n7(7), n9(9), n20(20), root(3);
    n20.left = &n15;
    n20.right = &n7;
    root.left = &n9;
    root.right = &n20;
    vector<vector<int>> levels = levelOrder(&root);
    for (int d = 0; d < (int)levels.size(); d++) {
        cout << "level " << d << ":";
        for (int v : levels[d]) cout << " " << v;
        cout << "\n";
    }
    return 0;
}`,

  'merge-intervals': cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

vector<pair<int, int>> mergeIntervals(vector<pair<int, int>> v) {
    sort(v.begin(), v.end());                  //#sort
    vector<pair<int, int>> out;
    for (auto [s, e] : v) {
        if (!out.empty() && s <= out.back().second) {  //#overlap @gap
            out.back().second = max(out.back().second, e);  //#extend @gap
        } else {
            out.push_back({s, e});             //#new
        }
    }
    return out;
}

int main() {
    vector<pair<int, int>> v = {{1, 3}, {8, 10}, {2, 6}, {15, 18}, {17, 20}};
    vector<pair<int, int>> merged = mergeIntervals(v);
    for (int i = 0; i < (int)merged.size(); i++)
        cout << (i ? " " : "") << "[" << merged[i].first << "," << merged[i].second << "]";
    cout << "\n";
    return 0;
}`,
};
