import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import ProjectsPage from './pages/ProjectsPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import NewProjectPage from './pages/NewProjectPage'
import EditorPage from './pages/EditorPage'
import PreviewPage from './pages/PreviewPage'
import PublicationsPage from './pages/PublicationsPage'
import PublicDocPage from './pages/PublicDocPage'
import HelpPage from './pages/HelpPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'projects', element: <ProjectsPage /> },
      { path: 'projects/new', element: <NewProjectPage /> },
      { path: 'projects/:id', element: <ProjectDetailPage /> },
      { path: 'projects/:id/edit', element: <EditorPage /> },
      { path: 'projects/:id/preview', element: <PreviewPage /> },
      { path: 'publications', element: <PublicationsPage /> },
      { path: 'help', element: <HelpPage /> },
    ],
  },
  // Public route (without Layout)
  {
    path: '/docs/:slug',
    element: <PublicDocPage />,
  },
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  },
})

function App() {
  return (
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  )
}

export default App
