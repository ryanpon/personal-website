export class MinHeap<T = unknown> {
  private heap: [number, T][];

  constructor() {
    this.heap = [];
  }

  push(key: number, val: T): void {
    this.heap.push([key, val]);
    this._bubbleUp(this.heap.length - 1);
  }

  pop(): [number, T] | undefined {
    const min = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0 && last !== undefined) {
      this.heap[0] = last;
      this._sinkDown(0);
    }
    return min;
  }

  peek(): [number, T] | undefined {
    return this.heap[0];
  }

  size(): number {
    return this.heap.length;
  }

  clone(): MinHeap<T> {
    const copy = new MinHeap<T>();
    copy.heap = this.heap.slice();
    return copy;
  }

  private _bubbleUp(i: number): void {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.heap[parent][0] <= this.heap[i][0]) break;
      [this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]];
      i = parent;
    }
  }

  private _sinkDown(i: number): void {
    const n = this.heap.length;
    while (true) {
      let smallest = i;
      const l = 2 * i + 1, r = 2 * i + 2;
      if (l < n && this.heap[l][0] < this.heap[smallest][0]) smallest = l;
      if (r < n && this.heap[r][0] < this.heap[smallest][0]) smallest = r;
      if (smallest === i) break;
      [this.heap[smallest], this.heap[i]] = [this.heap[i], this.heap[smallest]];
      i = smallest;
    }
  }
}
