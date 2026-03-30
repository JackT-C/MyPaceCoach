import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { racePBs, activities } from '../api'
import { Trophy, Plus, X, Edit2, Trash2, RefreshCw } from 'lucide-react'
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['race-pbs'] })
  })

  const rescanPBs = async () => {
    setIsRescanning(true)
    try {
      const response = await activities.rescanPBs()
      await queryClient.invalidateQueries({ queryKey: ['race-pbs'] })
      alert(`Found ${response.data.pbsUpdated} personal bests from ${response.data.activitiesScanned} activities.`)
    } catch (error) {
      alert('Failed to scan activities for PBs. Please try again.')
    } finally {
      setIsRescanning(false)
    }
  }

  const formatTime = (seconds, distance) => {
    const isSprint = ['100m', '200m', '400m'].includes(distance)
    if (isSprint) {
      const totalSeconds = Math.floor(seconds / 1000)
      const milliseconds = seconds % 1000
      return `${totalSeconds}.${String(milliseconds).padStart(3, '0')}s`
    }
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
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
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Race PBs</h1>
        <div className="flex space-x-3">
          <button onClick={rescanPBs} disabled={isRescanning} className="btn-secondary flex items-center space-x-2 text-sm">
            <RefreshCw className={`w-4 h-4 ${isRescanning ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isRescanning ? 'Scanning...' : 'Import from Strava'}</span>
          </button>
          <button onClick={() => { setEditingPB(null); setShowAddModal(true) }} className="btn-primary flex items-center space-x-2 text-sm">
            <Plus className="w-4 h-4" /><span>Add PB</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-teal-600 border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {DISTANCE_OPTIONS.map((option) => {
            const distancePBs = groupedPBs[option.value]
            const bestPB = distancePBs.length > 0 
              ? distancePBs.reduce((best, pb) => pb.time < best.time ? pb : best, distancePBs[0])
              : null

            return (
              <div key={option.value} className="card !p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{option.label}</h3>
                  <Trophy className={`w-4 h-4 ${bestPB ? 'text-amber-500' : ''}`} style={!bestPB ? { color: 'var(--text-muted)', opacity: 0.3 } : undefined} />
                </div>

                {bestPB ? (
                  <div>
                    <div className="text-2xl font-bold tracking-tight text-teal-600 dark:text-teal-400">
                      {formatTime(bestPB.time, bestPB.distance)}
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      {format(new Date(bestPB.date), 'MMM d, yyyy')}
                    </div>
                    {bestPB.raceName && (
                      <div className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>{bestPB.raceName}</div>
                    )}

                    <div className="flex space-x-1 mt-3">
                      <button
                        onClick={() => { setEditingPB(bestPB); setShowAddModal(true) }}
                        className="flex-1 px-2 py-1 text-xs rounded-lg transition-colors flex items-center justify-center"
                        style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-secondary)' }}
                      >
                        <Edit2 className="w-3 h-3 mr-1" />Edit
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(bestPB.id)}
                        className="px-2 py-1 text-xs text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    {distancePBs.length > 1 && (
                      <div className="mt-3 pt-3 space-y-1" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Previous:</div>
                        {distancePBs.filter(pb => pb.id !== bestPB.id).slice(0, 2).map((pb) => (
                          <div key={pb.id} className="text-xs flex justify-between" style={{ color: 'var(--text-muted)' }}>
                            <span>{formatTime(pb.time)}</span>
                            <span>{format(new Date(pb.date), 'MMM yyyy')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-4 text-center">
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No PB</p>
                    <button
                      onClick={() => { setEditingPB({ distance: option.value }); setShowAddModal(true) }}
                      className="mt-1 text-xs text-teal-600 dark:text-teal-400 font-medium"
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

      {showAddModal && (
        <PBModal
          pb={editingPB}
          onClose={() => { setShowAddModal(false); setEditingPB(null) }}
          onSuccess={() => { setShowAddModal(false); setEditingPB(null); queryClient.invalidateQueries({ queryKey: ['race-pbs'] }) }}
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
        time = (parseInt(data.seconds || 0) * 1000) + parseInt(data.milliseconds || 0)
      } else {
        time = (parseInt(data.hours || 0) * 3600) + (parseInt(data.minutes || 0) * 60) + parseInt(data.seconds || 0)
      }
      const payload = { distance: data.distance, time, date: data.date, raceName: data.raceName, notes: data.notes }
      return pb?.id ? racePBs.update(pb.id, payload) : racePBs.create(payload)
    },
    onSuccess
  })

  const handleSubmit = (e) => { e.preventDefault(); saveMutation.mutate(formData) }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="rounded-xl max-w-lg w-full p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            {pb?.id ? 'Edit' : 'Add'} Race PB
          </h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Distance</label>
            <select value={formData.distance} onChange={(e) => setFormData({ ...formData, distance: e.target.value })} className="input" required>
              {DISTANCE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Time</label>
            {isSprint ? (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <input type="number" min="0" value={formData.seconds} onChange={(e) => setFormData({ ...formData, seconds: e.target.value })} className="input text-center" placeholder="SS" required />
                  <div className="text-xs text-center mt-1" style={{ color: 'var(--text-muted)' }}>Seconds</div>
                </div>
                <div>
                  <input type="number" min="0" max="999" value={formData.milliseconds} onChange={(e) => setFormData({ ...formData, milliseconds: e.target.value })} className="input text-center" placeholder="MS" required />
                  <div className="text-xs text-center mt-1" style={{ color: 'var(--text-muted)' }}>Milliseconds</div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <input type="number" min="0" value={formData.hours} onChange={(e) => setFormData({ ...formData, hours: e.target.value })} className="input text-center" placeholder="HH" />
                  <div className="text-xs text-center mt-1" style={{ color: 'var(--text-muted)' }}>Hours</div>
                </div>
                <div>
                  <input type="number" min="0" max="59" value={formData.minutes} onChange={(e) => setFormData({ ...formData, minutes: e.target.value })} className="input text-center" placeholder="MM" required />
                  <div className="text-xs text-center mt-1" style={{ color: 'var(--text-muted)' }}>Minutes</div>
                </div>
                <div>
                  <input type="number" min="0" max="59" value={formData.seconds} onChange={(e) => setFormData({ ...formData, seconds: e.target.value })} className="input text-center" placeholder="SS" required />
                  <div className="text-xs text-center mt-1" style={{ color: 'var(--text-muted)' }}>Seconds</div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Date</label>
            <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="input" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Race Name</label>
            <input type="text" value={formData.raceName} onChange={(e) => setFormData({ ...formData, raceName: e.target.value })} className="input" placeholder="e.g., Boston Marathon" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Notes</label>
            <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="input" rows="2" placeholder="Conditions, how you felt, etc." />
          </div>

          <div className="flex space-x-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : 'Save PB'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
