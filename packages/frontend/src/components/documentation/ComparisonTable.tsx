import clsx from 'clsx'

interface Column {
  key: string
  header: string
  align?: 'left' | 'center' | 'right'
}

interface ComparisonTableProps {
  columns: Column[]
  rows: Record<string, React.ReactNode>[]
  className?: string
}

export default function ComparisonTable({ columns, rows, className }: ComparisonTableProps) {
  return (
    <div className={clsx('overflow-x-auto rounded-xl shadow-card', className)}>
      <table className="comparison-table w-full">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={clsx(
                  col.align === 'center' && 'text-center',
                  col.align === 'right' && 'text-right'
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={clsx(
                    col.align === 'center' && 'text-center',
                    col.align === 'right' && 'text-right'
                  )}
                >
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Badge components for table cells
export function BadgeYes({ children = '✓ Sim' }: { children?: React.ReactNode }) {
  return <span className="badge badge-yes">{children}</span>
}

export function BadgeNo({ children = '✗ Não' }: { children?: React.ReactNode }) {
  return <span className="badge badge-no">{children}</span>
}

export function BadgePartial({ children = '◐ Parcial' }: { children?: React.ReactNode }) {
  return <span className="badge badge-partial">{children}</span>
}
