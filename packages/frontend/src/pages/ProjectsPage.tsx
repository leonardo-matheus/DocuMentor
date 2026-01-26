import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, FileText, Calendar, GitBranch, Eye, Pencil, Trash2, X, AlertTriangle, Loader2 } from 'lucide-react'
import { api } from '@/services/api'
import toast from 'react-hot-toast'

interface Project {
  id: string
  name: string
  description: string
  repositoryUrl: string
  createdAt: string
  updatedAt: string
  status: 'draft' | 'generating' | 'complete'
}

// Modal de Confirmação de Exclusão
function DeleteModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  projectName,
  isDeleting 
}: { 
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  projectName: string
  isDeleting: boolean
}) {
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-up">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Excluir Projeto</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Esta ação não pode ser desfeita</p>
          </div>
          <button 
            onClick={onClose}
            className="ml-auto p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        
        {/* Content */}
        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-300">
            Tem certeza que deseja excluir o projeto{' '}
            <strong className="text-gray-900 dark:text-white">"{projectName}"</strong>?
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Todas as seções, configurações e dados de documentação serão permanentemente removidos.
          </p>
        </div>
        
        {/* Actions */}
        <div className="flex gap-3">
          <button 
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 btn btn-secondary"
          >
            Cancelar
          </button>
          <button 
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 btn bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Excluir
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ProjectsPage() {
  const queryClient = useQueryClient()
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; project: Project | null }>({
    isOpen: false,
    project: null
  })
  
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get<Project[]>('/projects').then(res => res.data),
  })
  
  // Mutation para deletar projeto
  const deleteMutation = useMutation({
    mutationFn: (projectId: string) => api.delete(`/projects/${projectId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Projeto excluído com sucesso!')
      setDeleteModal({ isOpen: false, project: null })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao excluir projeto')
    }
  })
  
  const handleDeleteClick = (project: Project) => {
    setDeleteModal({ isOpen: true, project })
  }
  
  const handleConfirmDelete = () => {
    if (deleteModal.project) {
      deleteMutation.mutate(deleteModal.project.id)
    }
  }
  
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-gray-200 dark:bg-slate-700 rounded w-1/4" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-200 dark:bg-slate-700 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Meus Projetos</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Documentações geradas e em progresso</p>
        </div>
        <Link to="/projects/new" className="btn btn-primary hover-lift">
          <Plus className="w-5 h-5" />
          Novo Projeto
        </Link>
      </div>
      
      {/* Projects Grid */}
      {projects && projects.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <div 
              key={project.id} 
              className="doc-card dark:bg-slate-800 dark:border dark:border-slate-700 overflow-hidden group animate-fade-in-up hover-lift"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Card Header */}
              <div className="p-6 border-b border-gray-100 dark:border-slate-700">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-movemais to-movemais-dark flex items-center justify-center text-white shadow-lg">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{project.name}</h3>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        project.status === 'complete' ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400' :
                        project.status === 'generating' ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 animate-pulse' :
                        'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400'
                      }`}>
                        {project.status === 'complete' ? '✓ Completo' :
                         project.status === 'generating' ? '⏳ Gerando...' : '📝 Rascunho'}
                      </span>
                    </div>
                  </div>
                  {/* Delete Button */}
                  <button 
                    onClick={() => handleDeleteClick(project)}
                    className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all text-gray-400 hover:text-red-500"
                    title="Excluir projeto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Card Body */}
              <div className="p-6">
                <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-4">
                  {project.description || 'Sem descrição'}
                </p>
                
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                  <div className="flex items-center gap-1">
                    <GitBranch className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[120px]">
                      {project.repositoryUrl ? new URL(project.repositoryUrl).pathname.slice(1) : 'Sem repositório'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(project.updatedAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </div>
              
              {/* Card Actions */}
              <div className="px-6 pb-6 flex gap-2">
                <Link 
                  to={`/projects/${project.id}/preview`}
                  className="flex-1 btn btn-secondary text-sm py-2 hover-scale"
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </Link>
                <Link 
                  to={`/projects/${project.id}/edit`}
                  className="flex-1 btn btn-primary text-sm py-2 hover-scale"
                >
                  <Pencil className="w-4 h-4" />
                  Editar
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 animate-fade-in-up">
          <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-6 animate-float">
            <FileText className="w-10 h-10 text-gray-400 dark:text-gray-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Nenhum projeto ainda
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Comece criando sua primeira documentação
          </p>
          <Link to="/projects/new" className="btn btn-primary hover-lift">
            <Plus className="w-5 h-5" />
            Criar Primeiro Projeto
          </Link>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, project: null })}
        onConfirm={handleConfirmDelete}
        projectName={deleteModal.project?.name || ''}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  )
}
