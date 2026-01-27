import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { racePBs, activities } from '../api'
import { Trophy, Plus, X, Edit2, Trash2, Calendar, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'

const DISTANCE_OPTIONS = [
  { value: '100m', label: '100m' },
  { value: '200m', label: '200m' },
  { value: '400m', label: '400m' },
  { value: '800m', label: '800m' },
  { value: '1500m', label: '1500m' },
  { value: '1600m', label: '1600m (Mile)' },
  { value: '3000m', label: '3000m' },
  { value: '5k', label: '5K' },
  { value: '10k', label: '10K' },
  { value: 'half-marathon', label: 'Half Marathon' },
  { value: 'marathon', label: 'Marathon' },
  { value: '50k', label: '50K' },
  { value: '100k', label: '100K' }
]

export default function RacePBs() {
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingPB, setEditingPB] = useState(null)
  const [isRescanning, setIsRescanning] = useState(false)
  const queryClient = useQueryClient()

  const { data: pbs, isLoading } = useQuery({
    queryKey: ['race-pbs'],
    queryFn: () => racePBs.getAll().then(res => res.data)
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => racePBs.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['race-pbs'] })
    }
  })

  const rescanPBs = async () => {
    setIsRescanning(true)
    try {
      const response = await activities.rescanPBs()
      await queryClient.invalidateQueries({ queryKey: ['race-pbs'] })
      alert(`PB scan completed! Found ${response.data.pbsUpdated} personal bests from ${response.data.activitiesScanned} activities.`)
    } catch (error) {
      console.error('Error rescanning PBs:', error)
      alert('Failed to scan activities for PBs. Please try again.')
    } finally {
      setIsRescanning(false)
    }
  }

  const formatTime = (seconds, distance) => {
    // For sprints, time is stored in milliseconds
    const isSprint = ['100m', '200m', '400m'].includes(distance)
    
    if (isSprint) {
      const totalSeconds = Math.floor(seconds / 1000)
      const milliseconds = seconds % 1000
      return `${totalSeconds}.${String(milliseconds).padStart(3, '0')}s`
    }
    
    // For longer races, time is in seconds
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    }
    return `${minutes}:${String(secs).padStart(2, '0')}`
  }

  const groupedPBs = DISTANCE_OPTIONS.reduce((acc, option) => {
    acc[option.value] = pbs?.filter(pb => pb.distance === option.value) || []
    return acc
  }, {})

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Race Personal Bests</h1>
          <p className="text-gray-600 mt-1">Track your PRs to enhance AI race predictions</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={rescanPBs}
            disabled={isRescanning}
            className="btn-secondary flex items-center space-x-2"
            title="Scan Strava activities for best efforts"
          >
            <RefreshCw className={`w-4 h-4 ${isRescanning ? 'animate-spin' : ''}`} />
            <span>{isRescanning ? 'Scanning...' : 'Import from Strava'}</span>
          </button>
          <button
            onClick={() => {
              setEditingPB(null)
              setShowAddModal(true)
            }}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add PB</span>
          </button>
        </div>
      </div>

      {/* PBs Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {DISTANCE_OPTIONS.map((option) => {
            const distancePBs = groupedPBs[option.value]
            const bestPB = distancePBs.length > 0 
              ? distancePBs.reduce((best, pb) => pb.time < best.time ? pb : best, distancePBs[0])
              : null

            return (
              <div key={option.value} className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{option.label}</h3>
                  <Trophy className={`w-5 h-5 ${bestPB ? 'text-accent-600' : 'text-gray-300'}`} />
                </div>

                {bestPB ? (
                  <div className="space-y-3">
                    <div>
                      <div className="text-3xl font-bold text-primary-600">
                        {formatTime(bestPB.time, bestPB.distance)}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {format(new Date(bestPB.date), 'MMM d, yyyy')}
                      </div>
                      {bestPB.raceName && (
                        <div className="text-sm text-gray-700 mt-1 font-medium">
                          {bestPB.raceName}
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setEditingPB(bestPB)
                          setShowAddModal(true)
                        }}
                        className="flex-1 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center justify-center"
                      >
                        <Edit2 className="w-3 h-3 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(bestPB.id)}
                        className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    {distancePBs.length > 1 && (
                      <div className="pt-3 border-t border-gray-200">
                        <div className="text-xs text-gray-600 mb-2">Previous times:</div>
                        <div className="space-y-1">
                          {distancePBs
                            .filter(pb => pb.id !== bestPB.id)
                            .slice(0, 2)
                            .map((pb) => (
                              <div key={pb.id} className="text-sm text-gray-600 flex justify-between items-center">
                                <span>{formatTime(pb.time)}</span>
                                <span className="text-xs">{format(new Date(pb.date), 'MMM yyyy')}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="text-gray-400 text-sm">No PB recorded</div>
                    <button
                      onClick={() => {
                        setEditingPB({ distance: option.value })
                        setShowAddModal(true)
                      }}
                      className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Add time
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <PBModal
          pb={editingPB}
          onClose={() => {
            setShowAddModal(false)
            setEditingPB(null)
          }}
          onSuccess={() => {
            setShowAddModal(false)
            setEditingPB(null)
            queryClient.invalidateQueries({ queryKey: ['race-pbs'] })
          }}
        />
      )}
    </div>
  )
}

function PBModal({ pb, onClose, onSuccess }) {
  const isSprintPB = pb?.distance && ['100m', '200m', '400m'].includes(pb.distance)
  
  const [formData, setFormData] = useState({
    distance: pb?.distance || '5k',
    hours: pb?.time && !isSprintPB ? Math.floor(pb.time / 3600) : '',
    minutes: pb?.time && !isSprintPB ? Math.floor((pb.time % 3600) / 60) : '',
    seconds: pb?.time ? (isSprintPB ? Math.floor(pb.time / 1000) : pb.time % 60) : '',
    milliseconds: pb?.time && isSprintPB ? pb.time % 1000 : '',
    date: pb?.date ? new Date(pb.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    raceName: pb?.raceName || '',
    notes: pb?.notes || ''
  })

  const isSprint = ['100m', '200m', '400m'].includes(formData.distance)

  const saveMutation = useMutation({
    mutationFn: (data) => {
      const isSprint = ['100m', '200m', '400m'].includes(data.distance)
      
      let time
      if (isSprint) {
        // For sprints: store as milliseconds (seconds * 1000 + milliseconds)
        time = (parseInt(data.seconds || 0) * 1000) + parseInt(data.milliseconds || 0)
      } else {
        // For longer races: store as seconds
        time = (parseInt(data.hours || 0) * 3600) + (parseInt(data.minutes || 0) * 60) + parseInt(data.seconds || 0)
      }
      
      const payload = {
        distance: data.distance,
        time,
        date: data.date,
        raceName: data.raceName,
        notes: data.notes
      }
      
      return pb?.id 
        ? racePBs.update(pb.id, payload)
        : racePBs.create(payload)
    },
    onSuccess
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    saveMutation.mutate(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {pb?.id ? 'Edit' : 'Add'} Race PB
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Distance</label>
            <select
              value={formData.distance}
              onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
              className="input"
              required
            >
              {DISTANCE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
            {isSprint ? (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <input
                    type="number"
                    min="0"
                    value={formData.seconds}
                    onChange={(e) => setFormData({ ...formData, seconds: e.target.value })}
                    className="input text-center"
                    placeholder="SS"
                    required
                  />
                  <div className="text-xs text-gray-500 text-center mt-1">Seconds</div>
                </div>
                <div>
                  <input
                    type="number"
                    min="0"
                    max="999"
                    value={formData.milliseconds}
                    onChange={(e) => setFormData({ ...formData, milliseconds: e.target.value })}
                    className="input text-center"
                    placeholder="MS"
                    required
                  />
                  <div className="text-xs text-gray-500 text-center mt-1">Milliseconds</div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <input
                    type="number"
                    min="0"
                    value={formData.hours}
                    onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                    className="input text-center"
                    placeholder="HH"
                  />
                  <div className="text-xs text-gray-500 text-center mt-1">Hours</div>
                </div>
                <div>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={formData.minutes}
                    onChange={(e) => setFormData({ ...formData, minutes: e.target.value })}
                    className="input text-center"
                    placeholder="MM"
                    required
                  />
                  <div className="text-xs text-gray-500 text-center mt-1">Minutes</div>
                </div>
                <div>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={formData.seconds}
                    onChange={(e) => setFormData({ ...formData, seconds: e.target.value })}
                    className="input text-center"
                    placeholder="SS"
                    required
                  />
                  <div className="text-xs text-gray-500 text-center mt-1">Seconds</div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Race Name</label>
            <input
              type="text"
              value={formData.raceName}
              onChange={(e) => setFormData({ ...formData, raceName: e.target.value })}
              className="input"
              placeholder="e.g., Boston Marathon"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input"
              rows="2"
              placeholder="Conditions, how you felt, etc."
            />
          </div>

          <div className="flex space-x-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary flex-1"
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? 'Saving...' : 'Save PB'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
