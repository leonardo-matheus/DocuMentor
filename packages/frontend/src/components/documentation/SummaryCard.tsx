import clsx from 'clsx'

interface SummaryCardProps {
  icon: string
  value: string
  label: string
  className?: string
}

export default function SummaryCard({ icon, value, label, className }: SummaryCardProps) {
  return (
    <div
      className={clsx(
        'relative bg-white rounded-2xl p-6 shadow-card transition-all duration-300 text-center',
        'before:absolute before:bottom-0 before:left-1/2 before:-translate-x-1/2 before:w-1/2 before:h-1 before:bg-gradient-to-r before:from-movemais before:to-primary before:rounded-t-full before:opacity-0 before:transition-opacity',
        'hover:-translate-y-2 hover:shadow-card-hover hover:before:opacity-100',
        className
      )}
    >
      <div className="text-4xl mb-3">{icon}</div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-gray-500 text-sm">{label}</div>
    </div>
  )
}
