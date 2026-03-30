import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { goals } from '../api'
import { Target, Plus, X, Calendar, TrendingUp, CheckCircle, Sparkles } from 'lucide-react'
import { format } from 'date-fns'

export default function Goals() {
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState(null)
  const queryClient = useQueryClient()

  const { data: goalsList, isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: () => goals.getAll().then(res => res.data)
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => goals.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] })
  })

  const generatePlanMutation = useMutation({
    mutationFn: (id) => goals.generatePlan(id),
    onSuccess: (data, goalId) => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      setSelectedGoal(goalsList.find(g => g.id === goalId))
    }
  })

  const activeGoals = goalsList?.filter(g => g.status === 'active') || []
  const completedGoals = goalsList?.filter(g => g.status === 'completed') || []

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Goals</h1>
        <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center space-x-2 text-sm">
          <Plus className="w-4 h-4" /><span>New Goal</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-teal-600 border-t-transparent"></div>
        </div>
      ) : (
        <>
          {/* Active Goals */}
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>Active</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeGoals.map((goal) => {
                const progress = goal.progress || 0
                const circumference = 2 * Math.PI * 20
                const offset = circumference - (progress / 100) * circumference
                return (
                <div key={goal.id} className="card">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-3 flex-1">
                      {/* Progress ring */}
                      <svg width="48" height="48" className="flex-shrink-0 -rotate-90">
                        <circle cx="24" cy="24" r="20" fill="none" stroke="var(--bg-inset)" strokeWidth="3" />
                        <circle cx="24" cy="24" r="20" fill="none" stroke="#0d9488" strokeWidth="3"
                          strokeDasharray={circumference} strokeDashoffset={offset}
                          strokeLinecap="round" className="transition-all duration-500" />
                        <text x="24" y="24" textAnchor="middle" dominantBaseline="central"
                          className="rotate-90 origin-center" fill="var(--text-primary)"
                          fontSize="11" fontWeight="600">{progress}%</text>
                      </svg>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{goal.title}</h3>
                        {goal.description && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{goal.description}</p>}
                      </div>
                    </div>
                    <button onClick={() => deleteMutation.mutate(goal.id)} className="text-red-400 hover:text-red-600 dark:hover:text-red-300 p-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {goal.raceType && (
                      <div className="flex items-center space-x-1.5">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>{goal.raceType}{goal.targetTime && ` · ${goal.targetTime}`}</span>
                      </div>
                    )}
                    {goal.raceDate && (
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{format(new Date(goal.raceDate), 'MMM d, yyyy')}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex space-x-2">
                    {!goal.trainingPlan?.weeks && (
                      <button
                        onClick={() => generatePlanMutation.mutate(goal.id)}
                        disabled={generatePlanMutation.isPending}
                        className="btn-primary flex-1 text-sm py-2 flex items-center justify-center space-x-1"
                      >
                        <Sparkles className="w-3.5 h-3.5" /><span>Generate Plan</span>
                      </button>
                    )}
                    {goal.trainingPlan?.weeks && (
                      <button onClick={() => setSelectedGoal(goal)} className="btn-secondary flex-1 text-sm py-2">
                        View Plan
                      </button>
                    )}
                  </div>
                </div>
              )})}

              {activeGoals.length === 0 && (
                <div className="col-span-2 card text-center py-10">
                  <Target className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
                  <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>No active goals</p>
                  <p className="text-xs mt-1 mb-4" style={{ color: 'var(--text-muted)' }}>Create a goal to start structured training</p>
                  <button onClick={() => setShowAddModal(true)} className="btn-primary text-sm">Create Goal</button>
                </div>
              )}
            </div>
          </div>

          {/* Completed Goals — compact */}
          {completedGoals.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Completed</h2>
              <div className="card !p-0 divide-y" style={{ borderColor: 'var(--border)' }}>
                {completedGoals.map((goal) => (
                  <div key={goal.id} className="flex items-center space-x-3 px-5 py-3" style={{ borderColor: 'var(--border-subtle)' }}>
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{goal.title}</span>
                    </div>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {format(new Date(goal.completedDate), 'MMM d, yyyy')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {showAddModal && (
        <AddGoalModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => { setShowAddModal(false); queryClient.invalidateQueries({ queryKey: ['goals'] }) }}
        />
      )}

      {selectedGoal && <TrainingPlanDrawer goal={selectedGoal} onClose={() => setSelectedGoal(null)} />}
    </div>
  )
}

function AddGoalModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '', description: '', type: 'race', raceType: '5K', targetTime: '', raceDate: ''
  })

  const createMutation = useMutation({
    mutationFn: (data) => goals.create(data),
    onSuccess
  })

  const handleSubmit = (e) => { e.preventDefault(); createMutation.mutate(formData) }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="rounded-xl max-w-lg w-full p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>New Goal</h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Title</label>
            <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="input" required placeholder="e.g., Run a sub-20 5K" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input" rows="2" placeholder="Optional details" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Type</label>
            <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="input">
              <option value="race">Race</option><option value="distance">Distance</option><option value="consistency">Consistency</option><option value="custom">Custom</option>
            </select>
          </div>
          {formData.type === 'race' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Distance</label>
                  <select value={formData.raceType} onChange={(e) => setFormData({ ...formData, raceType: e.target.value })} className="input">
                    <option value="100m">100m</option><option value="200m">200m</option><option value="400m">400m</option><option value="800m">800m</option>
                    <option value="1500m">1500m</option><option value="1600m">1600m (Mile)</option><option value="3000m">3000m</option>
                    <option value="5K">5K</option><option value="10K">10K</option><option value="Half Marathon">Half Marathon</option>
                    <option value="Marathon">Marathon</option><option value="50K">50K</option><option value="100K">100K</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Target Time</label>
                  <input type="text" value={formData.targetTime} onChange={(e) => setFormData({ ...formData, targetTime: e.target.value })} className="input" placeholder="HH:MM:SS" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Race Date</label>
                <input type="date" value={formData.raceDate} onChange={(e) => setFormData({ ...formData, raceDate: e.target.value })} className="input" />
              </div>
            </>
          )}
          <div className="flex space-x-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function TrainingPlanDrawer({ goal, onClose }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl shadow-xl overflow-y-auto"
        style={{ backgroundColor: 'var(--bg-card)', borderLeft: '1px solid var(--border)' }}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Training Plan: {goal.title}</h2>
            <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X className="w-5 h-5" /></button>
          </div>

          <div className="space-y-4">
            {goal.trainingPlan?.weeks?.map((week, i) => (
              <div key={i} className="rounded-lg p-4" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg-surface)' }}>
                <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>
                  Week {week.weekNumber} — {week.totalDistance} km
                </h3>
                <div className="space-y-2">
                  {week.runs?.map((run, j) => (
                    <div key={j} className="flex items-start space-x-3 text-sm">
                      <span className="font-medium w-16 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{run.day}</span>
                      <div className="flex-1">
                        <span style={{ color: 'var(--text-primary)' }}>{run.type} — {run.distance} km</span>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{run.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <button onClick={onClose} className="btn-primary w-full">Close</button>
          </div>
        </div>
      </div>
    </>
  )
}
