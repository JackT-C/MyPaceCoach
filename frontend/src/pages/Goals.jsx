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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
    }
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
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Goals</h1>
          <p className="text-gray-600 mt-1">Set and track your running goals</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Goal</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          {/* Active Goals */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Goals</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeGoals.map((goal) => (
                <div key={goal.id} className="card hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Target className="w-5 h-5 text-primary-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{goal.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteMutation.mutate(goal.id)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    {goal.raceType && (
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4" />
                        <span>{goal.raceType}</span>
                        {goal.targetTime && <span className="font-semibold">• {goal.targetTime}</span>}
                      </div>
                    )}
                    {goal.raceDate && (
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>{format(new Date(goal.raceDate), 'MMM d, yyyy')}</span>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span className="font-semibold">{goal.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex space-x-2">
                    {!goal.trainingPlan?.weeks && (
                      <button
                        onClick={() => generatePlanMutation.mutate(goal.id)}
                        disabled={generatePlanMutation.isPending}
                        className="btn-primary flex-1 text-sm py-2 flex items-center justify-center space-x-1"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Generate AI Plan</span>
                      </button>
                    )}
                    {goal.trainingPlan?.weeks && (
                      <button
                        onClick={() => setSelectedGoal(goal)}
                        className="btn-secondary flex-1 text-sm py-2"
                      >
                        View Training Plan
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {activeGoals.length === 0 && (
                <div className="col-span-2 card text-center py-12">
                  <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">No active goals</h3>
                  <p className="text-gray-600 mb-4">Set a goal to get started with structured training</p>
                  <button onClick={() => setShowAddModal(true)} className="btn-primary inline-flex">
                    Create Your First Goal
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Completed Goals */}
          {completedGoals.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Completed Goals</h2>
              <div className="space-y-2">
                {completedGoals.map((goal) => (
                  <div key={goal.id} className="card bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                        <div>
                          <h3 className="font-semibold text-gray-900">{goal.title}</h3>
                          <p className="text-sm text-gray-600">
                            Completed {format(new Date(goal.completedDate), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Goal Modal */}
      {showAddModal && (
        <AddGoalModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            queryClient.invalidateQueries({ queryKey: ['goals'] })
          }}
        />
      )}

      {/* Training Plan Modal */}
      {selectedGoal && (
        <TrainingPlanModal
          goal={selectedGoal}
          onClose={() => setSelectedGoal(null)}
        />
      )}
    </div>
  )
}

function AddGoalModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'race',
    raceType: '5K',
    targetTime: '',
    raceDate: ''
  })

  const createMutation = useMutation({
    mutationFn: (data) => goals.create(data),
    onSuccess
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    createMutation.mutate(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Create New Goal</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Goal Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input"
              required
              placeholder="e.g., Run a sub-20 5K"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              rows="2"
              placeholder="Optional details about your goal"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Goal Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="input"
            >
              <option value="race">Race Goal</option>
              <option value="distance">Distance Goal</option>
              <option value="consistency">Consistency Goal</option>
              <option value="custom">Custom Goal</option>
            </select>
          </div>

          {formData.type === 'race' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Race Distance</label>
                  <select
                    value={formData.raceType}
                    onChange={(e) => setFormData({ ...formData, raceType: e.target.value })}
                    className="input"
                  >
                    <option value="100m">100m</option>
                    <option value="200m">200m</option>
                    <option value="400m">400m</option>
                    <option value="800m">800m</option>
                    <option value="1500m">1500m</option>
                    <option value="1600m">1600m (Mile)</option>
                    <option value="3000m">3000m</option>
                    <option value="5K">5K</option>
                    <option value="10K">10K</option>
                    <option value="Half Marathon">Half Marathon</option>
                    <option value="Marathon">Marathon</option>
                    <option value="50K">50K</option>
                    <option value="100K">100K</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Time</label>
                  <input
                    type="text"
                    value={formData.targetTime}
                    onChange={(e) => setFormData({ ...formData, targetTime: e.target.value })}
                    className="input"
                    placeholder="HH:MM:SS"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Race Date</label>
                <input
                  type="date"
                  value={formData.raceDate}
                  onChange={(e) => setFormData({ ...formData, raceDate: e.target.value })}
                  className="input"
                />
              </div>
            </>
          )}

          <div className="flex space-x-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function TrainingPlanModal({ goal, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-4xl w-full p-6 my-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Training Plan: {goal.title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4 max-h-[600px] overflow-y-auto">
          {goal.trainingPlan?.weeks?.map((week, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                Week {week.weekNumber} - {week.totalDistance} km
              </h3>
              <div className="space-y-2">
                {week.runs?.map((run, j) => (
                  <div key={j} className="flex items-start space-x-3 text-sm">
                    <span className="font-medium text-gray-700 w-20">{run.day}:</span>
                    <div className="flex-1">
                      <span className="text-gray-900">{run.type} - {run.distance} km</span>
                      <p className="text-gray-600">{run.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <button onClick={onClose} className="btn-primary w-full">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
