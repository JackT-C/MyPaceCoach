import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { activities, coach } from '../api'
import { Activity, Plus, Filter, Calendar, TrendingUp, X, Trash2, ChevronDown, ChevronUp, Heart, Zap, Mic, MicOff, MessageCircle, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

function calculateTrainingLoad(activity) {
  if (!activity.distance || !activity.movingTime) return null;
  const distanceKm = activity.distance / 1000;
  let load = distanceKm * 5;
  if (activity.pace) {
    const paceMinPerKm = activity.pace;
    if (paceMinPerKm < 4.0) load *= 1.8;
    else if (paceMinPerKm < 4.5) load *= 1.5;
    else if (paceMinPerKm < 5.0) load *= 1.2;
    else if (paceMinPerKm > 6.0) load *= 0.8;
  }
  if (activity.averageHeartrate) {
    if (activity.averageHeartrate > 175) load *= 1.5;
    else if (activity.averageHeartrate > 165) load *= 1.3;
    else if (activity.averageHeartrate > 155) load *= 1.15;
    else if (activity.averageHeartrate > 145) load *= 1.05;
    else if (activity.averageHeartrate < 130) load *= 0.85;
  }
  if (activity.totalElevationGain > 100) {
    load *= 1 + (activity.totalElevationGain / 2000);
  }
  return Math.round(load);
}

function getTrainingLoadCategory(load) {
  if (!load) return { label: 'Unknown', dot: 'bg-gray-400', bar: 'bg-gray-400' };
  if (load < 60) return { label: 'Easy', dot: 'bg-green-500', bar: 'bg-green-500' };
  if (load < 90) return { label: 'Moderate', dot: 'bg-blue-500', bar: 'bg-blue-500' };
  if (load < 120) return { label: 'Hard', dot: 'bg-orange-500', bar: 'bg-orange-500' };
  return { label: 'Very Hard', dot: 'bg-red-500', bar: 'bg-red-500' };
}

export default function Activities() {
  const [showAddModal, setShowAddModal] = useState(false)
  const [filterType, setFilterType] = useState('all')
  const [expandedActivity, setExpandedActivity] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [voiceTranscript, setVoiceTranscript] = useState('')
  const [coachResponse, setCoachResponse] = useState(null)
  const [isProcessingVoice, setIsProcessingVoice] = useState(false)
  const mediaRecorderRef = useRef(null)
  const recognitionRef = useRef(null)
  const queryClient = useQueryClient()

  const { data: activitiesList, isLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: () => activities.getAll({ limit: 100 }).then(res => res.data)
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => activities.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['activities'] })
  })

  const updateTypesMutation = useMutation({
    mutationFn: () => activities.updateTypes(),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      alert(`${response.data.message}\n${response.data.updatedCount} activities categorized!`)
    }
  })

  const filteredActivities = activitiesList?.filter(a => 
    filterType === 'all' ? true : a.type === filterType
  ) || []

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Activities</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => updateTypesMutation.mutate()}
            disabled={updateTypesMutation.isPending}
            className="btn-secondary flex items-center space-x-2 text-sm"
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">{updateTypesMutation.isPending ? 'Categorizing...' : 'Auto-Categorize'}</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center space-x-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Log Activity</span>
          </button>
        </div>
      </div>

      {/* Pill Filters */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
        {['all', 'Run', 'Workout', 'Race', 'CrossTraining', 'Rest'].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              filterType === type
                ? 'bg-teal-600 dark:bg-teal-500 text-white dark:text-gray-950'
                : ''
            }`}
            style={filterType !== type ? { backgroundColor: 'var(--bg-surface)', color: 'var(--text-secondary)' } : undefined}
          >
            {type === 'all' ? 'All' : type}
          </button>
        ))}
      </div>

      {/* Activities List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-teal-600 border-t-transparent"></div>
        </div>
      ) : (
        <div className="card !p-0 divide-y" style={{ borderColor: 'var(--border)' }}>
          {filteredActivities.map((activity) => {
            const trainingLoad = calculateTrainingLoad(activity);
            const loadCategory = getTrainingLoadCategory(trainingLoad);
            const activityId = activity.id || activity._id;
            const isExpanded = expandedActivity === activityId;
            
            return (
            <div key={activityId} className="px-5 py-4" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 flex-wrap">
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{activity.name}</h3>
                    {trainingLoad && (
                      <span className="inline-flex items-center text-xs" style={{ color: 'var(--text-muted)' }}>
                        <span className={`w-1.5 h-1.5 rounded-full ${loadCategory.dot} mr-1`}></span>
                        {loadCategory.label}
                      </span>
                    )}
                    {activity.isRace && (
                      <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium rounded-full">
                        Race
                      </span>
                    )}
                    {activity.source === 'manual' && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full" style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-muted)' }}>
                        Manual
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <span>{format(new Date(activity.date), 'MMM d, yyyy')}</span>
                    {activity.distance && (
                      <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{((activity.distance || 0) / 1000).toFixed(2)} km</span>
                    )}
                    {activity.pace && (
                      <span>{Math.floor(activity.pace)}:{String(Math.round((activity.pace % 1) * 60)).padStart(2, '0')} /km</span>
                    )}
                    {activity.averageHeartrate && (
                      <span className="text-red-500 dark:text-red-400">
                        {Math.round(activity.averageHeartrate)} bpm
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-1 ml-3">
                  {(activity.splits?.length > 0 || activity.averageHeartrate || activity.maxHeartrate || trainingLoad) && (
                    <button
                      onClick={() => setExpandedActivity(isExpanded ? null : activityId)}
                      className="p-1.5 rounded-lg transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  )}
                  <button
                    onClick={() => deleteMutation.mutate(activityId)}
                    className="p-1.5 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="mt-4 pt-4 space-y-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  {trainingLoad && (
                    <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-surface)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Training Load</span>
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{trainingLoad} &middot; {loadCategory.label}</span>
                      </div>
                      <div className="w-full rounded-full h-1.5" style={{ backgroundColor: 'var(--bg-inset)' }}>
                        <div className={`h-1.5 rounded-full transition-all ${loadCategory.bar}`}
                          style={{ width: `${Math.min(100, (trainingLoad / 200) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {(activity.averageHeartrate || activity.maxHeartrate) && (
                    <div className="grid grid-cols-2 gap-4">
                      {activity.averageHeartrate && (
                        <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--bg-surface)' }}>
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Avg HR</div>
                          <div className="text-xl font-bold text-red-500 dark:text-red-400">
                            {Math.round(activity.averageHeartrate)} <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>bpm</span>
                          </div>
                        </div>
                      )}
                      {activity.maxHeartrate && (
                        <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--bg-surface)' }}>
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Max HR</div>
                          <div className="text-xl font-bold text-red-600 dark:text-red-400">
                            {Math.round(activity.maxHeartrate)} <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>bpm</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activity.splits && activity.splits.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Splits</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                              <th className="px-3 py-2 text-left text-xs font-medium" style={{ color: 'var(--text-muted)' }}>KM</th>
                              <th className="px-3 py-2 text-right text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Pace</th>
                              <th className="px-3 py-2 text-right text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Time</th>
                              {activity.splits.some(s => s.averageHeartrate) && (
                                <th className="px-3 py-2 text-right text-xs font-medium" style={{ color: 'var(--text-muted)' }}>HR</th>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {activity.splits.map((split, idx) => {
                              const paceMinPerKm = split.averageSpeed ? (1000 / 60) / split.averageSpeed : 0
                              const minutes = Math.floor(paceMinPerKm)
                              const seconds = Math.round((paceMinPerKm % 1) * 60)
                              const splitMinutes = Math.floor(split.movingTime / 60)
                              const splitSeconds = Math.round(split.movingTime % 60)
                              
                              return (
                                <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                  <td className="px-3 py-2 font-medium" style={{ color: 'var(--text-primary)' }}>{idx + 1}</td>
                                  <td className="px-3 py-2 text-right" style={{ color: 'var(--text-secondary)' }}>
                                    {minutes}:{String(seconds).padStart(2, '0')} /km
                                  </td>
                                  <td className="px-3 py-2 text-right" style={{ color: 'var(--text-secondary)' }}>
                                    {splitMinutes}:{String(splitSeconds).padStart(2, '0')}
                                  </td>
                                  {activity.splits.some(s => s.averageHeartrate) && (
                                    <td className="px-3 py-2 text-right" style={{ color: 'var(--text-secondary)' }}>
                                      {split.averageHeartrate ? Math.round(split.averageHeartrate) : '-'}
                                    </td>
                                  )}
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <VoiceCoach 
                    activity={activity}
                    isRecording={isRecording}
                    setIsRecording={setIsRecording}
                    voiceTranscript={voiceTranscript}
                    setVoiceTranscript={setVoiceTranscript}
                    coachResponse={coachResponse}
                    setCoachResponse={setCoachResponse}
                    isProcessingVoice={isProcessingVoice}
                    setIsProcessingVoice={setIsProcessingVoice}
                    mediaRecorderRef={mediaRecorderRef}
                    recognitionRef={recognitionRef}
                  />
                </div>
              )}
            </div>
          )})}

          {filteredActivities.length === 0 && (
            <div className="text-center py-12 px-4">
              <Activity className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
              <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>No activities found</h3>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                {filterType === 'all' ? 'Log your first activity or sync from Strava' : `No ${filterType} activities`}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Add Activity — slide-in panel */}
      {showAddModal && (
        <AddActivityModal 
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            queryClient.invalidateQueries({ queryKey: ['activities'] })
          }}
        />
      )}
    </div>
  )
}

function VoiceCoach({ 
  activity, isRecording, setIsRecording, voiceTranscript, setVoiceTranscript,
  coachResponse, setCoachResponse, isProcessingVoice, setIsProcessingVoice,
  mediaRecorderRef, recognitionRef
}) {
  const [showCoachSection, setShowCoachSection] = useState(false);

  const startVoiceRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    let finalTranscript = '';
    recognition.onresult = (event) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalTranscript += transcript + ' ';
        else interimTranscript += transcript;
      }
      setVoiceTranscript(finalTranscript + interimTranscript);
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    setVoiceTranscript('');
    setCoachResponse(null);
  };

  const stopVoiceRecording = async () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsRecording(false);
    if (voiceTranscript.trim()) {
      setIsProcessingVoice(true);
      try {
        const response = await coach.voiceCoaching({
          activityId: activity.id,
          transcript: voiceTranscript,
          activityData: {
            distance: activity.distance / 1000,
            duration: activity.movingTime / 60,
            pace: activity.pace,
            heartRate: activity.averageHeartrate,
            elevationGain: activity.totalElevationGain
          }
        });
        setCoachResponse(response.data);
      } catch (error) {
        setCoachResponse({ message: "Having trouble connecting. Try again in a moment.", emotion: 'neutral' });
      } finally {
        setIsProcessingVoice(false);
      }
    }
  };

  const resetCoach = () => { setVoiceTranscript(''); setCoachResponse(null); setShowCoachSection(false); };

  return (
    <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
      <button
        onClick={() => setShowCoachSection(!showCoachSection)}
        className="w-full flex items-center justify-between text-left text-sm"
      >
        <div className="flex items-center">
          <MessageCircle className="w-4 h-4 mr-2 text-teal-600 dark:text-teal-400" />
          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Voice Coach</span>
        </div>
        {showCoachSection ? <ChevronUp className="w-4 h-4" style={{ color: 'var(--text-muted)' }} /> : <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />}
      </button>

      {showCoachSection && (
        <div className="mt-4 space-y-3">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Share how you felt about this run. Your coach will analyse your words and tone.
          </p>

          <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex flex-col items-center space-y-3">
              {!isRecording && !voiceTranscript && !coachResponse && (
                <button onClick={startVoiceRecording} className="btn-primary flex items-center space-x-2 text-sm">
                  <Mic className="w-4 h-4" /><span>Start Recording</span>
                </button>
              )}
              {isRecording && (
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center animate-pulse mx-auto">
                    <Mic className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>Listening...</p>
                  {voiceTranscript && <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>"{voiceTranscript}"</p>}
                  <button onClick={stopVoiceRecording} className="btn-secondary flex items-center space-x-2 text-sm">
                    <MicOff className="w-4 h-4" /><span>Stop</span>
                  </button>
                </div>
              )}
              {isProcessingVoice && (
                <div className="text-center space-y-2 py-3">
                  <Loader2 className="w-6 h-6 text-teal-600 animate-spin mx-auto" />
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Analysing...</p>
                </div>
              )}
              {coachResponse && !isProcessingVoice && (
                <div className="w-full space-y-3">
                  <div className="rounded-lg p-3 text-right text-sm" style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-secondary)' }}>
                    <p className="italic text-xs">"{voiceTranscript}"</p>
                  </div>
                  <div className="bg-teal-600 dark:bg-teal-700 text-white rounded-lg p-3">
                    <p className="text-sm leading-relaxed whitespace-pre-line">{coachResponse.message}</p>
                    {coachResponse.emotion && <p className="text-xs opacity-70 mt-2">Detected: {coachResponse.emotion}</p>}
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => { setVoiceTranscript(''); setCoachResponse(null); startVoiceRecording(); }} className="btn-secondary flex-1 text-sm flex items-center justify-center space-x-1">
                      <Mic className="w-3 h-3" /><span>Again</span>
                    </button>
                    <button onClick={resetCoach} className="btn-primary flex-1 text-sm">Done</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AddActivityModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '', type: 'Run', date: new Date().toISOString().split('T')[0],
    distance: '', movingTime: '', effortLevel: 'moderate', notes: ''
  })

  const createMutation = useMutation({
    mutationFn: (data) => activities.create(data),
    onSuccess
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      ...formData,
      distance: formData.distance ? parseFloat(formData.distance) * 1000 : undefined,
      movingTime: formData.movingTime ? parseFloat(formData.movingTime) * 60 : undefined
    }
    createMutation.mutate(payload)
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={onClose} />
      {/* Slide-in drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md shadow-xl" style={{ backgroundColor: 'var(--bg-card)', borderLeft: '1px solid var(--border)' }}>
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Log Activity</h2>
            <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X className="w-5 h-5" /></button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Activity Name</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input" required placeholder="e.g., Morning Run" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Type</label>
                <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="input">
                  <option value="Run">Run</option><option value="Workout">Workout</option><option value="Race">Race</option><option value="CrossTraining">Cross Training</option><option value="Rest">Rest</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Date</label>
                <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="input" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Distance (km)</label>
                <input type="number" step="0.01" value={formData.distance} onChange={(e) => setFormData({ ...formData, distance: e.target.value })} className="input" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Time (min)</label>
                <input type="number" value={formData.movingTime} onChange={(e) => setFormData({ ...formData, movingTime: e.target.value })} className="input" placeholder="0" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Effort</label>
              <select value={formData.effortLevel} onChange={(e) => setFormData({ ...formData, effortLevel: e.target.value })} className="input">
                <option value="easy">Easy</option><option value="moderate">Moderate</option><option value="hard">Hard</option><option value="race">Race</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Notes</label>
              <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="input" rows="3" placeholder="How did it feel?" />
            </div>
            <div className="flex space-x-3 pt-2">
              <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" className="btn-primary flex-1" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
