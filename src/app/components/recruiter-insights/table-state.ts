/**
 * Client-side search + sort + pagination for one table.
 * Results are cached, so template getters are cheap on every change-detection pass.
 */
export class TableState<T extends Record<string, any>> {
  page = 1;
  pageSize: number;
  sortKey: string;
  sortDir: 'asc' | 'desc';

  private _search = '';
  private src: T[] = [];
  private version = 0;
  private cacheKey = '';
  private cache: T[] = [];

  constructor(
    private searchKeys: string[] = ['recruiter_name'],
    defaultSort = '',
    defaultDir: 'asc' | 'desc' = 'desc',
    public pageSizes: number[] = [5, 10, 25, 50],
    pageSize = 10
  ) {
    this.sortKey = defaultSort;
    this.sortDir = defaultDir;
    this.pageSize = pageSize;
  }

  get search(): string { return this._search; }
  set search(value: string) {
    this._search = value || '';
    this.page = 1;
  }

  setRows(rows: T[] | null | undefined) {
    this.src = rows || [];
    this.version++;
    this.page = Math.min(this.page, this.totalPages);
  }

  get filtered(): T[] {
    const key = `${this.version}|${this._search}|${this.sortKey}|${this.sortDir}`;
    if (key === this.cacheKey) return this.cache;

    const q = this._search.trim().toLowerCase();
    let rows = q
      ? this.src.filter(r => this.searchKeys.some(k => String(r[k] ?? '').toLowerCase().includes(q)))
      : this.src.slice();

    if (this.sortKey) {
      const k = this.sortKey;
      const dir = this.sortDir === 'asc' ? 1 : -1;
      rows = rows.sort((a, b) => {
        const av = a[k], bv = b[k];
        const aNull = av === null || av === undefined, bNull = bv === null || bv === undefined;
        if (aNull && bNull) return 0;
        if (aNull) return 1;   // empty values always last
        if (bNull) return -1;
        if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
        return String(av).localeCompare(String(bv)) * dir;
      });
    }
    this.cacheKey = key;
    this.cache = rows;
    return rows;
  }

  get total(): number { return this.filtered.length; }
  get totalPages(): number { return Math.max(1, Math.ceil(this.total / this.pageSize)); }
  get pageRows(): T[] {
    const start = (Math.min(this.page, this.totalPages) - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }
  get from(): number { return this.total ? (this.page - 1) * this.pageSize + 1 : 0; }
  get to(): number { return Math.min(this.page * this.pageSize, this.total); }

  setPage(p: number | string) {
    if (typeof p !== 'number' || p < 1 || p > this.totalPages) return;
    this.page = p;
  }

  setPageSize(n: number | string) {
    this.pageSize = +n || 10;
    this.page = 1;
  }

  setSort(key: string) {
    if (this.sortKey === key) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = key;
      this.sortDir = key.endsWith('_name') || key === 'client' || key === 'job_role' ? 'asc' : 'desc';
    }
    this.page = 1;
  }

  sortIcon(key: string): string {
    return this.sortKey !== key ? '' : this.sortDir === 'asc' ? '▲' : '▼';
  }

  /** Page numbers to render; -1 / -2 are ellipses. */
  get pageRange(): number[] {
    const total = this.totalPages, current = this.page;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const delta = 2;
    const range: number[] = [1];
    if (current - delta > 2) range.push(-1);
    for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) range.push(i);
    if (current + delta < total - 1) range.push(-2);
    range.push(total);
    return range;
  }
}
