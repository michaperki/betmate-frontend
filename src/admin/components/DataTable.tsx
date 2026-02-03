import React from 'react';

type Column<T> = {
  key: string;
  header: string;
  align?: 'left' | 'right' | 'center';
  render?: (row: T) => React.ReactNode;
  sort?: boolean | ((a: T, b: T) => number);
};

type DataTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  empty?: string;
  defaultSortKey?: string;
  defaultSortDir?: 'asc' | 'desc';
  className?: string;
};

function DataTable<T>({ columns, rows, empty = 'No data', defaultSortKey, defaultSortDir = 'asc', className }: DataTableProps<T>) {
  const [sortKey, setSortKey] = React.useState<string | undefined>(defaultSortKey);
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>(defaultSortDir);

  const onHeaderClick = (col: Column<T>) => {
    if (!col.sort) return;
    if (sortKey === col.key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(col.key);
      setSortDir('asc');
    }
  };

  const sorted = React.useMemo(() => {
    if (!rows || !rows.length) return rows;
    const col = columns.find((c) => c.key === sortKey && c.sort);
    if (!col) return rows;
    const cmp: (a: any, b: any) => number = typeof col.sort === 'function'
      ? (col.sort as any)
      : ((a: any, b: any) => {
          const av = a[col.key];
          const bv = b[col.key];
          if (av == null && bv == null) return 0;
          if (av == null) return -1;
          if (bv == null) return 1;
          if (typeof av === 'number' && typeof bv === 'number') return av - bv;
          const as = String(av).toLowerCase();
          const bs = String(bv).toLowerCase();
          return as < bs ? -1 : as > bs ? 1 : 0;
        });
    const copy = [...rows];
    copy.sort((a, b) => (sortDir === 'asc' ? cmp(a, b) : -cmp(a, b)));
    return copy;
  }, [rows, columns, sortKey, sortDir]);
  if (!rows || rows.length === 0) {
    return <div style={{ opacity: 0.7 }}>{empty}</div>;
  }
  return (
    <table className={className || 'admin-table'}>
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c.key} style={{ textAlign: c.align || 'left', cursor: c.sort ? 'pointer' : 'default', userSelect: 'none' }} onClick={() => onHeaderClick(c)}>
              {c.header}
              {c.sort && sortKey === c.key && (<span style={{ marginLeft: 6, opacity: 0.6 }}>{sortDir === 'asc' ? '▲' : '▼'}</span>)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sorted.map((row: any, i: number) => (
          <tr key={row?._id || i}>
            {columns.map((c) => (
              <td key={c.key} style={{ textAlign: c.align || 'left' }}>
                {c.render ? c.render(row) : String(row[c.key] ?? '')}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default DataTable;

