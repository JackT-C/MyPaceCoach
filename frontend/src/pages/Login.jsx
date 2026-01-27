import { Activity, MessageCircle, Target, User, LogOut, Edit3 } from 'lucide-react'
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">MyPace</h1>
          <p className="text-gray-600">Your AI-Powered Running Coach</p>
        </div>

        {/* Features */}
        <div className="card mb-8 space-y-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Strava Integration</h3>
              <p className="text-sm text-gray-600">Sync your runs and training data automatically</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-accent-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">AI Coach</h3>
              <p className="text-sm text-gray-600">Get personalized training advice and insights</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Smart Goals</h3>
              <p className="text-sm text-gray-600">Set goals and get AI-generated training plans</p>
            </div>
          </div>
        </div>

        {/* Login Options */}
        {!showManualEntry ? (
          <>
            <button
              onClick={handleLogin}
              className="w-full bg-[#fc4c02] hover:bg-[#e84402] text-white font-semibold py-4 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2 mb-3"
            >
              <span>Connect with Strava</span>
              <LogOut className="w-5 h-5 rotate-180" />
            </button>
            
            <button
              onClick={() => setShowManualEntry(true)}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-4 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <Edit3 className="w-5 h-5" />
              <span>Manual Entry (No Strava)</span>
            </button>

            <p className="text-center text-sm text-gray-500 mt-4">
              By connecting, you agree to share your Strava data
            </p>
          </>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <input
                type="text"
                value={manualData.username}
                onChange={(e) => setManualData({...manualData, username: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter your name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email (optional)</label>
              <input
                type="email"
                value={manualData.email}
                onChange={(e) => setManualData({...manualData, email: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="your@email.com"
              />
            </div>
            
            <button
              onClick={handleManualEntry}
              disabled={!manualData.username}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white font-semibold py-4 rounded-xl transition-colors duration-200"
            >
              Start Using MyPace
            </button>
            
            <button
              onClick={() => setShowManualEntry(false)}
              className="w-full text-gray-600 hover:text-gray-900 py-2"
            >
              Back to Strava login
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
