// Tiny syntax highlighter for C++ and Go (no dependencies). Produces token spans per line.
export type TokKind = 'kw' | 'type' | 'str' | 'num' | 'com' | 'pre' | 'fn' | 'plain';
export interface Tok {
  t: TokKind;
  s: string;
}

const CPP_KW = new Set('if else for while do return break continue switch case default new delete this true false nullptr struct class public private protected const auto using namespace template typename static inline operator sizeof void friend virtual override constexpr noexcept throw try catch goto'.split(' '));
const CPP_TYPES = new Set('int long short char bool double float unsigned signed size_t string vector pair map set unordered_map unordered_set stack queue deque priority_queue array tuple greater less multiset multimap list bitset ListNode TreeNode DSU Trie TrieNode int64_t uint64_t uint32_t'.split(' '));
const GO_KW = new Set('func return if else for range switch case default break continue var const type struct map chan go defer package import nil true false make append len cap new'.split(' '));
const GO_TYPES = new Set('int int64 int32 uint byte rune string bool float64 error'.split(' '));

export function highlight(code: string, lang: 'cpp' | 'go' = 'cpp'): Tok[][] {
  const kw = lang === 'cpp' ? CPP_KW : GO_KW;
  const types = lang === 'cpp' ? CPP_TYPES : GO_TYPES;
  const lines: Tok[][] = [];
  let inBlock = false;
  for (const line of code.split('\n')) {
    const toks: Tok[] = [];
    let i = 0;
    const push = (t: TokKind, s: string) => {
      const last = toks[toks.length - 1];
      if (last && last.t === t && t === 'plain') last.s += s;
      else toks.push({ t, s });
    };
    if (lang === 'cpp' && /^\s*#/.test(line) && !inBlock) {
      toks.push({ t: 'pre', s: line });
      lines.push(toks);
      continue;
    }
    while (i < line.length) {
      if (inBlock) {
        const end = line.indexOf('*/', i);
        if (end === -1) {
          push('com', line.slice(i));
          i = line.length;
        } else {
          push('com', line.slice(i, end + 2));
          i = end + 2;
          inBlock = false;
        }
        continue;
      }
      const rest = line.slice(i);
      if (rest.startsWith('//')) {
        push('com', rest);
        break;
      }
      if (rest.startsWith('/*')) {
        inBlock = true;
        continue;
      }
      const ch = line[i];
      if (ch === '"' || ch === "'" || (lang === 'go' && ch === '`')) {
        let j = i + 1;
        while (j < line.length && line[j] !== ch) j += line[j] === '\\' ? 2 : 1;
        push('str', line.slice(i, j + 1));
        i = j + 1;
        continue;
      }
      const num = rest.match(/^(0x[0-9a-fA-F]+|\d+(\.\d+)?)(LL|ULL|L|U|ll|e\d+)?/);
      if (num && !/[A-Za-z_]/.test(line[i - 1] ?? '')) {
        push('num', num[0]);
        i += num[0].length;
        continue;
      }
      const id = rest.match(/^[A-Za-z_]\w*/);
      if (id) {
        const w = id[0];
        const after = line.slice(i + w.length);
        if (kw.has(w)) push('kw', w);
        else if (types.has(w)) push('type', w);
        else if (/^\s*\(/.test(after)) push('fn', w);
        else push('plain', w);
        i += w.length;
        continue;
      }
      push('plain', ch);
      i++;
    }
    lines.push(toks);
  }
  return lines;
}
