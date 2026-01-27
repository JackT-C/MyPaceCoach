import { Routes, Route, Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { auth } from './api'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Activities from './pages/Activities'
import Coach from './pages/Coach'
import Goals from './pages/Goals'
import Profile from './pages/Profile'
import RacePBs from './pages/RacePBs'

function App() {
  const { data: authStatus, isLoading } = useQuery({
    queryKey: ['authStatus'],
    queryFn: () => auth.getStatus().then(res => res.data),
    retry: false
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const isAuthenticated = authStatus?.authenticated

  if (!isAuthenticated) {
    return <Login />
  }

  return (
    <Layout user={authStatus.user}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/activities" element={<Activities />} />
        <Route path="/coach" element={<Coach />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/race-pbs" element={<RacePBs />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  )
}

export default App
