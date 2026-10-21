// Driver building blocks shared by several days. They are pasted into each
// program so every question still compiles as a standalone file.

/** Includes + TreeNode definition placed at the top of tree solutions. */
export const TREE_HEAD = `#include <algorithm>
#include <climits>
#include <iostream>
#include <queue>
#include <string>
#include <vector>
using namespace std;

struct TreeNode {
    int val;
    TreeNode *left = nullptr, *right = nullptr;
    TreeNode(int v) : val(v) {}
};`;

/** Builds a tree from level-order tokens ("null" = missing child). Placed before main(). */
export const TREE_BUILD = `// Builds a tree from level-order tokens; "null" marks a missing child.
TreeNode* build(const vector<string>& t, vector<TreeNode*>& pool) {
    auto make = [&](const string& s) -> TreeNode* {
        if (s == "null") return nullptr;
        pool.push_back(new TreeNode(stoi(s)));
        return pool.back();
    };
    if (t.empty()) return nullptr;
    TreeNode* root = make(t[0]);
    queue<TreeNode*> q;
    if (root) q.push(root);
    size_t i = 1;
    while (!q.empty() && i < t.size()) {
        TreeNode* cur = q.front();
        q.pop();
        cur->left = make(t[i++]);
        if (cur->left) q.push(cur->left);
        if (i < t.size()) {
            cur->right = make(t[i++]);
            if (cur->right) q.push(cur->right);
        }
    }
    return root;
}

vector<string> readTokens() {
    int n;
    cin >> n;
    vector<string> t(n);
    for (auto& s : t) cin >> s;
    return t;
}`;

export const TREE_IO = 'Input: n, then n level-order tokens (integers or "null").';
