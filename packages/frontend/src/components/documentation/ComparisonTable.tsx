import clsx from 'clsx'

interface Column {
  key: string
  header: string
  icon?: string
  align?: 'left' | 'center' | 'right'
}

interface ComparisonTableProps {
  columns: Column[]
  rows: Record<string, React.ReactNode>[]
  className?: string
  variant?: 'default' | 'striped' | 'bordered'
}

export default function ComparisonTable({ columns, rows, className, variant = 'striped' }: ComparisonTableProps) {
  return (
    <div className={clsx('relative overflow-hidden rounded-2xl', className)}>
      {/* Background Glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl blur-xl" />
      
      <div className="relative bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 text-white">
                {columns.map((col, idx) => (
                  <th
                    key={col.key}
                    className={clsx(
                      'px-6 py-4 text-sm font-bold tracking-wide uppercase',
                      col.align === 'center' && 'text-center',
                      col.align === 'right' && 'text-right',
                      idx === 0 && 'rounded-tl-xl',
                      idx === columns.length - 1 && 'rounded-tr-xl'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {col.icon && <span className="text-lg">{col.icon}</span>}
                      {col.header}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row, idx) => (
                <tr 
                  key={idx} 
                  className={clsx(
                    'transition-colors duration-200 hover:bg-indigo-50/50',
                    variant === 'striped' && idx % 2 === 1 && 'bg-gray-50/50'
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={clsx(
                        'px-6 py-4 text-sm text-gray-700',
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
      </div>
    </div>
  )
}

// Modern Badge components for table cells
export function BadgeYes({ children = '✓ Sim' }: { children?: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-sm">
      {children}
    </span>
  )
}

export function BadgeNo({ children = '✗ Não' }: { children?: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-sm">
      {children}
    </span>
  )
}

export function BadgePartial({ children = '◐ Parcial' }: { children?: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm">
      {children}
    </span>
  )
}

export function BadgeInfo({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-sm">
      {children}
    </span>
  )
}
