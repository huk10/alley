export class OrderedList<T extends {kind: number, priority: number}> {
  private list: Array<T> = [];

  // 获取列表长度。
  get length(): number {
    return this.list.length;
  }

  sort(): void {
    this.list.sort((a, b) => {
      if (a.kind > b.kind) return +1;
      if (a.kind < b.kind) return -1;
      // 如果 kind 相同，则比较 priority
      if (a.priority > b.priority) return -1;
      if (a.priority < b.priority) return +1;
      return 0;
    });
  }

  at(index: number): T {
    return this.list[index];
  }

  first(): T | undefined {
    return this.list[0];
  }

  append(...nodes: T[]): void {
    this.list.push(...nodes);
    this.sort();
  }

  replace(index: number, node: T): void {
    this.list[index] = node;
    this.sort();
  }

  remove(node: T): void {
    this.list = this.list.filter(n => n !== node);
  }

  entries(): IterableIterator<[number, T]> {
    return this.list.entries();
  }

  values(): Iterable<T> {
    return this.list.values();
  }
}
