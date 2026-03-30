import { Activity, LogOut, Edit3 } from 'lucide-react'
import { useState } from 'react'

export default function Login() {
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [manualData, setManualData] = useState({ username: '', email: '' })
  
  const handleLogin = () => {
    window.location.href = '/api/auth/strava'
  }
  
  const handleManualEntry = async () => {
    try {
      const response = await fetch('/api/auth/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(manualData)
      })
      if (response.ok) {
        window.location.href = '/dashboard'
      }
    } catch (error) {
      console.error('Manual entry error:', error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-sm w-full">
        {/* Logo & Title */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold tracking-tight mb-3" style={{ color: 'var(--text-primary)' }}>
            My<span className="text-teal-600 dark:text-teal-400">Pace</span>
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-muted)' }}>Run smarter.</p>
        </div>

        {/* Login Options */}
        {!showManualEntry ? (
          <div className="space-y-3">
            <button
              onClick={handleLogin}
              className="w-full bg-[#fc4c02] hover:bg-[#e84402] text-white font-semibold py-4 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <span>Connect with Strava</span>
              <LogOut className="w-5 h-5 rotate-180" />
            </button>
            
            <button
              onClick={() => setShowManualEntry(true)}
              className="w-full py-4 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2 font-medium"
              style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-secondary)' }}
            >
              <Edit3 className="w-5 h-5" />
              <span>Manual Entry</span>
            </button>

            <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
              By connecting, you agree to share your Strava data
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Username</label>
              <input
                type="text"
                value={manualData.username}
                onChange={(e) => setManualData({...manualData, username: e.target.value})}
                className="input py-3"
                placeholder="Enter your name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Email (optional)</label>
              <input
                type="email"
                value={manualData.email}
                onChange={(e) => setManualData({...manualData, email: e.target.value})}
                className="input py-3"
                placeholder="your@email.com"
              />
            </div>
            
            <button
              onClick={handleManualEntry}
              disabled={!manualData.username}
              className="w-full btn-primary font-semibold py-4 rounded-xl disabled:opacity-40"
            >
              Get started
            </button>
            
            <button
              onClick={() => setShowManualEntry(false)}
              className="w-full py-2 text-sm transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              Back to Strava login
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
