import EmptyState from '../common/EmptyState';

export default function AdminTable({ columns = [], rows = [], emptyTitle = 'Kayıt bulunamadı' }) {
  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description="Filtreleri değiştirerek tekrar deneyebilirsiniz." />;
  }

  return (
    <div className="surface-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="animated-table w-full min-w-[760px] text-left">
          <thead className="table-header">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-5 py-4">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border dark:divide-dark-border">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-surface-low/70 dark:hover:bg-dark-surface">
                {columns.map((column) => (
                  <td key={column.key} className="px-5 py-4 text-sm text-muted dark:text-dark-muted">
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
