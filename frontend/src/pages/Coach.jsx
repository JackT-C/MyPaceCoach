import { useState, useRef, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { coach } from '../api'
import { Send, Bot, User, Sparkles, Target } from 'lucide-react'

export default function Coach() {
  const [message, setMessage] = useState('')
  const [conversation, setConversation] = useState([])
  const messagesEndRef = useRef(null)

  const { data: insights, isLoading: insightsLoading } = useQuery({
    queryKey: ['insights'],
    queryFn: () => coach.getInsights().then(res => res.data),
    staleTime: 5 * 60 * 1000
  })

  const { data: predictions } = useQuery({
    queryKey: ['predictions'],
    queryFn: () => coach.getPredictions().then(res => res.data),
    retry: false,
    enabled: !!insights, // wait for insights to load first
    staleTime: 10 * 60 * 1000
  })

  const chatMutation = useMutation({
    mutationFn: (msg) => coach.chat(msg, conversation).then(res => res.data),
    onSuccess: (data) => {
      setConversation(prev => [
        ...prev,
        { role: 'user', content: message },
        { role: 'assistant', content: data.response }
      ])
      setMessage('')
    }
  })

  const handleSend = (e) => {
    e.preventDefault()
    if (!message.trim() || chatMutation.isPending) return
    chatMutation.mutate(message)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => { scrollToBottom() }, [conversation])

  const quickQuestions = [
    "How was my training last week?",
    "Should I do intervals or an easy run today?",
    "What's my predicted 5K time?",
    "Am I at risk of overtraining?"
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>AI Coach</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chat */}
        <div className="lg:col-span-2">
          <div className="card h-[600px] flex flex-col !p-0">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {conversation.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-6">
                  <p className="text-lg font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                    What can I help with today?
                  </p>
                  <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                    Ask about your training, get race predictions, or plan your next session.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full max-w-lg">
                    {quickQuestions.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => setMessage(q)}
                        className="p-3 rounded-full text-sm text-left transition-colors"
                        style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {conversation.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex items-start space-x-2 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                          msg.role === 'user' ? 'bg-teal-600 dark:bg-teal-500' : ''
                        }`} style={msg.role !== 'user' ? { backgroundColor: 'var(--bg-surface)' } : undefined}>
                          {msg.role === 'user' ? (
                            <User className="w-3.5 h-3.5 text-white dark:text-gray-950" />
                          ) : (
                            <Bot className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                          )}
                        </div>
                        <div className={`px-4 py-3 text-sm ${
                          msg.role === 'user'
                            ? 'bg-teal-600 dark:bg-teal-700 text-white rounded-2xl rounded-br-md'
                            : 'rounded-2xl rounded-bl-md'
                        }`} style={msg.role !== 'user' ? { backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' } : undefined}>
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {chatMutation.isPending && (
                    <div className="flex justify-start">
                      <div className="flex items-start space-x-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-surface)' }}>
                          <Bot className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                        </div>
                        <div className="px-4 py-3 rounded-2xl rounded-bl-md" style={{ backgroundColor: 'var(--bg-surface)' }}>
                          <div className="flex space-x-1.5">
                            <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: 'var(--text-muted)', animationDelay: '0ms' }}></div>
                            <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: 'var(--text-muted)', animationDelay: '150ms' }}></div>
                            <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: 'var(--text-muted)', animationDelay: '300ms' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            <div className="p-4" style={{ borderTop: '1px solid var(--border)' }}>
              <form onSubmit={handleSend} className="flex space-x-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask your coach anything..."
                  className="input flex-1"
                  disabled={chatMutation.isPending}
                />
                <button
                  type="submit"
                  disabled={!message.trim() || chatMutation.isPending}
                  className="btn-primary px-4 disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Sidebar — Insights & Predictions */}
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center space-x-2 mb-4">
              <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Insights</h3>
            </div>
            {insightsLoading ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-teal-600 border-t-transparent"></div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {insights?.insights?.substring(0, 200)}...
                </p>
                {insights?.analysis && (
                  <div className="space-y-2 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <div className="flex items-center justify-between text-sm">
                      <span style={{ color: 'var(--text-muted)' }}>Weekly Avg</span>
                      <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {insights.analysis.weeklyAverage?.toFixed(1)} km
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span style={{ color: 'var(--text-muted)' }}>Total Runs</span>
                      <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {insights.analysis.totalRuns}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {predictions && !predictions.error && (
            <div className="card">
              <div className="flex items-center space-x-2 mb-4">
                <Target className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Race Predictions</h3>
              </div>
              <div className="space-y-2.5">
                {predictions['5K'] && (
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: 'var(--text-muted)' }}>5K</span>
                    <span className="font-bold text-teal-600 dark:text-teal-400">{predictions['5K']}</span>
                  </div>
                )}
                {predictions['10K'] && (
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: 'var(--text-muted)' }}>10K</span>
                    <span className="font-bold text-teal-600 dark:text-teal-400">{predictions['10K']}</span>
                  </div>
                )}
                {predictions.halfMarathon && (
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: 'var(--text-muted)' }}>Half Marathon</span>
                    <span className="font-bold text-teal-600 dark:text-teal-400">{predictions.halfMarathon}</span>
                  </div>
                )}
                {predictions.marathon && (
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: 'var(--text-muted)' }}>Marathon</span>
                    <span className="font-bold text-teal-600 dark:text-teal-400">{predictions.marathon}</span>
                  </div>
                )}
                {predictions.confidence && (
                  <p className="text-xs mt-3 pt-3" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)' }}>
                    {predictions.confidence}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
