import { useParams } from 'react-router-dom'

export default function ProjectDetailPage() {
  const { id } = useParams()
  
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold">Projeto {id}</h1>
      {/* TODO: Project details */}
    </div>
  )
}
