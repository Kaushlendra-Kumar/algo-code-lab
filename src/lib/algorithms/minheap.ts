/** Small binary min-heap keyed by a numeric priority; ties broken by insertion order. */
export class MinHeap<T> {
  private items: { p: number; seq: number; v: T }[] = [];
  private seq = 0;

  get size() {
    return this.items.length;
  }

  push(priority: number, value: T) {
    const a = this.items;
    a.push({ p: priority, seq: this.seq++, v: value });
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (!this.lt(i, p)) break;
      [a[i], a[p]] = [a[p], a[i]];
      i = p;
    }
  }

  pop(): { priority: number; value: T } | undefined {
    const a = this.items;
    if (!a.length) return undefined;
    const top = a[0];
    const last = a.pop()!;
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < a.length && this.lt(l, m)) m = l;
        if (r < a.length && this.lt(r, m)) m = r;
        if (m === i) break;
        [a[i], a[m]] = [a[m], a[i]];
        i = m;
      }
    }
    return { priority: top.p, value: top.v };
  }

  values(): T[] {
    return [...this.items].sort((x, y) => x.p - y.p || x.seq - y.seq).map((x) => x.v);
  }

  private lt(i: number, j: number) {
    const a = this.items;
    return a[i].p < a[j].p || (a[i].p === a[j].p && a[i].seq < a[j].seq);
  }
}
