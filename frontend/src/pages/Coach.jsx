import { useState, useRef, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { coach } from '../api'
import { Send, Bot, User, Sparkles, TrendingUp, Target } from 'lucide-react'

export default function Coach() {
  const [message, setMessage] = useState('')
  const [conversation, setConversation] = useState([])
  const messagesEndRef = useRef(null)

  const { data: insights, isLoading: insightsLoading } = useQuery({
    queryKey: ['insights'],
    queryFn: () => coach.getInsights().then(res => res.data)
  })

  const { data: predictions } = useQuery({
    queryKey: ['predictions'],
    queryFn: () => coach.getPredictions().then(res => res.data),
    retry: false
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

  useEffect(() => {
    scrollToBottom()
  }, [conversation])

  const quickQuestions = [
    "How was my training last week?",
    "Should I do intervals or an easy run today?",
    "What's my predicted 5K time?",
    "Am I at risk of overtraining?"
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">AI Coach</h1>
        <p className="text-gray-600 mt-1">Get personalized training advice and insights</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chat */}
        <div className="lg:col-span-2 space-y-4">
          {/* Chat Container */}
          <div className="card h-[600px] flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {conversation.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                    <Bot className="w-8 h-8 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Hi! I'm your AI Running Coach
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md">
                    Ask me anything about your training, get personalized advice, or discuss your running goals.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full max-w-2xl">
                    {quickQuestions.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => setMessage(q)}
                        className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-left transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {conversation.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-start space-x-2 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          msg.role === 'user' ? 'bg-primary-600' : 'bg-gray-200'
                        }`}>
                          {msg.role === 'user' ? (
                            <User className="w-4 h-4 text-white" />
                          ) : (
                            <Bot className="w-4 h-4 text-gray-700" />
                          )}
                        </div>
                        <div className={`px-4 py-3 rounded-2xl ${
                          msg.role === 'user'
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {chatMutation.isPending && (
                    <div className="flex justify-start">
                      <div className="flex items-start space-x-2">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <Bot className="w-4 h-4 text-gray-700" />
                        </div>
                        <div className="px-4 py-3 bg-gray-100 rounded-2xl">
                          <div className="flex space-x-2">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
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
                className="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar - Insights & Predictions */}
        <div className="space-y-4">
          {/* Training Insights */}
          <div className="card">
            <div className="flex items-center space-x-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">Latest Insights</h3>
            </div>
            {insightsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {insights?.insights?.substring(0, 200)}...
                  </p>
                </div>
                {insights?.analysis && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Weekly Average</span>
                      <span className="font-semibold text-gray-900">
                        {insights.analysis.weeklyAverage?.toFixed(1)} km
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Total Runs</span>
                      <span className="font-semibold text-gray-900">
                        {insights.analysis.totalRuns}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Race Predictions */}
          {predictions && !predictions.error && (
            <div className="card">
              <div className="flex items-center space-x-2 mb-4">
                <Target className="w-5 h-5 text-accent-600" />
                <h3 className="text-lg font-semibold text-gray-900">Race Predictions</h3>
              </div>
              <div className="space-y-3">
                {predictions['5K'] && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">5K</span>
                    <span className="text-sm font-bold text-primary-600">{predictions['5K']}</span>
                  </div>
                )}
                {predictions['10K'] && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">10K</span>
                    <span className="text-sm font-bold text-primary-600">{predictions['10K']}</span>
                  </div>
                )}
                {predictions.halfMarathon && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Half Marathon</span>
                    <span className="text-sm font-bold text-primary-600">{predictions.halfMarathon}</span>
                  </div>
                )}
                {predictions.marathon && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Marathon</span>
                    <span className="text-sm font-bold text-primary-600">{predictions.marathon}</span>
                  </div>
                )}
                {predictions.confidence && (
                  <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-200">
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
