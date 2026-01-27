import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { activities, coach } from '../api'
import { Activity, Plus, Filter, Calendar, TrendingUp, X, Edit2, Trash2, ChevronDown, ChevronUp, Heart, Zap, Mic, MicOff, MessageCircle, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

// Calculate training load based on distance, pace, and heart rate
function calculateTrainingLoad(activity) {
  if (!activity.distance || !activity.movingTime) return null;
  
  const distanceKm = activity.distance / 1000;
  const durationMinutes = activity.movingTime / 60;
  
  // Base load from distance (simplified)
  let load = distanceKm * 5; // Reduced base multiplier
  
  // Adjust for pace (faster = harder)
  if (activity.pace) {
    const paceMinPerKm = activity.pace;
    if (paceMinPerKm < 4.0) load *= 1.8; // Very fast
    else if (paceMinPerKm < 4.5) load *= 1.5; // Fast
    else if (paceMinPerKm < 5.0) load *= 1.2; // Moderate-fast
    else if (paceMinPerKm > 6.0) load *= 0.8; // Easy pace
  }
  
  // Adjust for heart rate if available
  if (activity.averageHeartrate) {
    if (activity.averageHeartrate > 175) load *= 1.5;
    else if (activity.averageHeartrate > 165) load *= 1.3;
    else if (activity.averageHeartrate > 155) load *= 1.15;
    else if (activity.averageHeartrate > 145) load *= 1.05;
    else if (activity.averageHeartrate < 130) load *= 0.85; // Easy effort
  }
  
  // Adjust for elevation
  if (activity.totalElevationGain > 100) {
    load *= 1 + (activity.totalElevationGain / 2000); // Reduced elevation impact
  }
  
  return Math.round(load);
}

// Get training load category
function getTrainingLoadCategory(load) {
  if (!load) return { label: 'Unknown', color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-700' };
  if (load < 60) return { label: 'Easy', color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-700' };
  if (load < 90) return { label: 'Moderate', color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-700' };
  if (load < 120) return { label: 'Hard', color: 'orange', bgColor: 'bg-orange-100', textColor: 'text-orange-700' };
  return { label: 'Very Hard', color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-700' };
}

export default function Activities() {
  const [showAddModal, setShowAddModal] = useState(false)
  const [filterType, setFilterType] = useState('all')
  const [expandedActivity, setExpandedActivity] = useState(null)
  const [voiceCoachActivity, setVoiceCoachActivity] = useState(null)
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
    }
  })

  const updateTypesMutation = useMutation({
    mutationFn: () => activities.updateTypes(),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      alert(`✅ ${response.data.message}\n${response.data.updatedCount} activities categorized!`)
    }
  })

  const filteredActivities = activitiesList?.filter(a => 
    filterType === 'all' ? true : a.type === filterType
  ) || []

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Activities</h1>
          <p className="text-gray-600 mt-1">View and manage your training activities</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => updateTypesMutation.mutate()}
            disabled={updateTypesMutation.isPending}
            className="btn-secondary flex items-center space-x-2"
            title="Auto-categorize activities based on titles"
          >
            <Filter className="w-4 h-4" />
            <span>{updateTypesMutation.isPending ? 'Categorizing...' : 'Auto-Categorize'}</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Log Activity</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center space-x-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <div className="flex space-x-2">
            {['all', 'Run', 'Workout', 'Race', 'CrossTraining', 'Rest'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === type
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type === 'all' ? 'All' : type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Activities List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredActivities.map((activity) => {
            const trainingLoad = calculateTrainingLoad(activity);
            const loadCategory = getTrainingLoadCategory(trainingLoad);
            const activityId = activity.id || activity._id;
            const isExpanded = expandedActivity === activityId;
            
            return (
            <div key={activityId} className="card hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    activity.type === 'Race' ? 'bg-accent-100' :
                    activity.type === 'Workout' ? 'bg-yellow-100' :
                    'bg-primary-100'
                  }`}>
                    <Activity className={`w-6 h-6 ${
                      activity.type === 'Race' ? 'text-accent-600' :
                      activity.type === 'Workout' ? 'text-yellow-600' :
                      'text-primary-600'
                    }`} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900">{activity.name}</h3>
                      {trainingLoad && (
                        <span className={`px-2 py-0.5 ${loadCategory.bgColor} ${loadCategory.textColor} text-xs font-medium rounded flex items-center`}>
                          <Zap className="w-3 h-3 mr-1" />
                          {trainingLoad} - {loadCategory.label}
                        </span>
                      )}
                      {activity.isRace && (
                        <span className="px-2 py-0.5 bg-accent-100 text-accent-700 text-xs font-medium rounded">
                          Race
                        </span>
                      )}
                      {activity.source === 'manual' && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                          Manual
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {format(new Date(activity.date), 'MMM d, yyyy')}
                      </span>
                      {activity.distance && (
                        <span>{((activity.distance || 0) / 1000).toFixed(2)} km</span>
                      )}
                      {activity.pace && (
                        <span className="flex items-center">
                          <TrendingUp className="w-4 h-4 mr-1" />
                          {Math.floor(activity.pace)}:{String(Math.round((activity.pace % 1) * 60)).padStart(2, '0')} /km
                        </span>
                      )}
                      {activity.averageHeartrate && (
                        <span className="flex items-center text-red-600">
                          <Heart className="w-4 h-4 mr-1" />
                          {Math.round(activity.averageHeartrate)} bpm
                        </span>
                      )}
                    </div>
                    {activity.notes && (
                      <p className="text-sm text-gray-600 mt-1">{activity.notes}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {(activity.splits?.length > 0 || activity.averageHeartrate || activity.maxHeartrate || trainingLoad) && (
                    <button
                      onClick={() => setExpandedActivity(isExpanded ? null : activityId)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => deleteMutation.mutate(activityId)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                  {/* Training Load Details */}
                  {trainingLoad && (
                    <div className={`${loadCategory.bgColor} rounded-lg p-4`}>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <Zap className={`w-4 h-4 mr-2 ${loadCategory.textColor}`} />
                        Training Load: {loadCategory.label}
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-700">Load Score:</span>
                          <span className={`font-bold ${loadCategory.textColor}`}>{trainingLoad}</span>
                        </div>
                        <div className="w-full bg-white bg-opacity-50 rounded-full h-2 mt-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              loadCategory.color === 'green' ? 'bg-green-500' :
                              loadCategory.color === 'blue' ? 'bg-blue-500' :
                              loadCategory.color === 'orange' ? 'bg-orange-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(100, (trainingLoad / 200) * 100)}%` }}
                          />
                        </div>
                        <p className="text-gray-600 mt-2">
                          {loadCategory.label === 'Easy' && 'Recovery or easy run - good for building base fitness.'}
                          {loadCategory.label === 'Moderate' && 'Solid training stimulus - sustainable for regular training.'}
                          {loadCategory.label === 'Hard' && 'High intensity session - ensure adequate recovery.'}
                          {loadCategory.label === 'Very Hard' && 'Very demanding workout - needs significant recovery time.'}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Heart Rate Stats */}
                  {(activity.averageHeartrate || activity.maxHeartrate) && (
                    <div className="bg-red-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <Heart className="w-4 h-4 mr-2 text-red-600" />
                        Heart Rate
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        {activity.averageHeartrate && (
                          <div>
                            <div className="text-sm text-gray-600">Average</div>
                            <div className="text-2xl font-bold text-red-600">
                              {Math.round(activity.averageHeartrate)}
                              <span className="text-sm text-gray-600 ml-1">bpm</span>
                            </div>
                          </div>
                        )}
                        {activity.maxHeartrate && (
                          <div>
                            <div className="text-sm text-gray-600">Max</div>
                            <div className="text-2xl font-bold text-red-700">
                              {Math.round(activity.maxHeartrate)}
                              <span className="text-sm text-gray-600 ml-1">bpm</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Splits Table */}
                  {activity.splits && activity.splits.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Kilometer Splits
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left font-medium text-gray-600">KM</th>
                              <th className="px-3 py-2 text-right font-medium text-gray-600">Pace</th>
                              <th className="px-3 py-2 text-right font-medium text-gray-600">Time</th>
                              {activity.splits.some(s => s.averageHeartrate) && (
                                <th className="px-3 py-2 text-right font-medium text-gray-600">HR</th>
                              )}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {activity.splits.map((split, idx) => {
                              const paceMinPerKm = split.averageSpeed ? (1000 / 60) / split.averageSpeed : 0
                              const minutes = Math.floor(paceMinPerKm)
                              const seconds = Math.round((paceMinPerKm % 1) * 60)
                              const splitMinutes = Math.floor(split.movingTime / 60)
                              const splitSeconds = Math.round(split.movingTime % 60)
                              
                              return (
                                <tr key={idx} className="hover:bg-gray-50">
                                  <td className="px-3 py-2 font-medium">{idx + 1}</td>
                                  <td className="px-3 py-2 text-right">
                                    {minutes}:{String(seconds).padStart(2, '0')} /km
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    {splitMinutes}:{String(splitSeconds).padStart(2, '0')}
                                  </td>
                                  {activity.splits.some(s => s.averageHeartrate) && (
                                    <td className="px-3 py-2 text-right">
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

                  {/* Voice Coach Section */}
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
            <div className="card text-center py-12">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No activities found</h3>
              <p className="text-gray-600">
                {filterType === 'all' 
                  ? 'Log your first activity or sync from Strava'
                  : `No ${filterType} activities found`
                }
              </p>
            </div>
          )}
        </div>
      )}

      {/* Add Activity Modal */}
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

// Voice Coach Component - Voice-first AI coaching interaction
function VoiceCoach({ 
  activity, 
  isRecording, 
  setIsRecording, 
  voiceTranscript, 
  setVoiceTranscript,
  coachResponse,
  setCoachResponse,
  isProcessingVoice,
  setIsProcessingVoice,
  mediaRecorderRef,
  recognitionRef
}) {
  const [showCoachSection, setShowCoachSection] = useState(false);

  const startVoiceRecording = () => {
    // Check for browser support
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
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }
      
      setVoiceTranscript(finalTranscript + interimTranscript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    setVoiceTranscript('');
    setCoachResponse(null);
  };

  const stopVoiceRecording = async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);

    if (voiceTranscript.trim()) {
      // Send to AI coach for analysis
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
        console.error('Error getting coach response:', error);
        setCoachResponse({
          message: "I'm having trouble connecting right now. Try again in a moment.",
          emotion: 'neutral'
        });
      } finally {
        setIsProcessingVoice(false);
      }
    }
  };

  const resetCoach = () => {
    setVoiceTranscript('');
    setCoachResponse(null);
    setShowCoachSection(false);
  };

  return (
    <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-lg p-4 border border-primary-200">
      <button
        onClick={() => setShowCoachSection(!showCoachSection)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center">
          <MessageCircle className="w-5 h-5 mr-2 text-primary-600" />
          <h4 className="font-semibold text-gray-900">Talk to Your AI Coach</h4>
        </div>
        {showCoachSection ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {showCoachSection && (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-gray-600">
            Share your thoughts about this run - how you felt, what was challenging, your energy level. 
            Your coach will understand both what you say and how you feel.
          </p>

          {/* Voice Recording Interface */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex flex-col items-center space-y-4">
              {!isRecording && !voiceTranscript && !coachResponse && (
                <button
                  onClick={startVoiceRecording}
                  className="btn-primary flex items-center space-x-2 px-6 py-3"
                >
                  <Mic className="w-5 h-5" />
                  <span>Start Recording</span>
                </button>
              )}

              {isRecording && (
                <div className="text-center space-y-3">
                  <div className="relative inline-block">
                    <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                      <Mic className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -inset-2 bg-red-500 rounded-full opacity-20 animate-ping"></div>
                  </div>
                  <p className="text-sm font-medium text-gray-900">Listening...</p>
                  {voiceTranscript && (
                    <div className="text-sm text-gray-600 italic max-w-md">
                      "{voiceTranscript}"
                    </div>
                  )}
                  <button
                    onClick={stopVoiceRecording}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <MicOff className="w-4 h-4" />
                    <span>Stop Recording</span>
                  </button>
                </div>
              )}

              {isProcessingVoice && (
                <div className="text-center space-y-3 py-4">
                  <Loader2 className="w-8 h-8 text-primary-600 animate-spin mx-auto" />
                  <p className="text-sm text-gray-600">Your coach is analyzing your feedback...</p>
                </div>
              )}

              {coachResponse && !isProcessingVoice && (
                <div className="w-full space-y-4">
                  {/* User's transcript */}
                  <div className="bg-gray-100 rounded-lg p-3 text-right">
                    <p className="text-sm text-gray-700 italic">
                      "{voiceTranscript}"
                    </p>
                  </div>

                  {/* Coach's response */}
                  <div className="bg-primary-500 text-white rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
                        <MessageCircle className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-1">Your Coach</p>
                        <p className="text-sm leading-relaxed whitespace-pre-line">
                          {coachResponse.message}
                        </p>
                        {coachResponse.emotion && (
                          <div className="mt-3 text-xs opacity-80">
                            Detected emotion: {coachResponse.emotion}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setVoiceTranscript('');
                        setCoachResponse(null);
                        startVoiceRecording();
                      }}
                      className="btn-secondary flex-1 flex items-center justify-center space-x-2"
                    >
                      <Mic className="w-4 h-4" />
                      <span>Record Again</span>
                    </button>
                    <button
                      onClick={resetCoach}
                      className="btn-primary flex-1"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Feature Info */}
          {!isRecording && !coachResponse && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                <strong>💡 Tip:</strong> Speak naturally about your run. The AI analyzes your words and tone to provide emotionally intelligent coaching feedback.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AddActivityModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'Run',
    date: new Date().toISOString().split('T')[0],
    distance: '',
    movingTime: '',
    effortLevel: 'moderate',
    notes: ''
  })

  const createMutation = useMutation({
    mutationFn: (data) => activities.create(data),
    onSuccess
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      ...formData,
      distance: formData.distance ? parseFloat(formData.distance) * 1000 : undefined, // Convert km to meters
      movingTime: formData.movingTime ? parseFloat(formData.movingTime) * 60 : undefined // Convert minutes to seconds
    }
    createMutation.mutate(payload)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Log Activity</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Activity Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              required
              placeholder="e.g., Morning Run"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="input"
              >
                <option value="Run">Run</option>
                <option value="Workout">Workout</option>
                <option value="Race">Race</option>
                <option value="CrossTraining">Cross Training</option>
                <option value="Rest">Rest</option>
              </select>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Distance (km)</label>
              <input
                type="number"
                step="0.01"
                value={formData.distance}
                onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
                className="input"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time (minutes)</label>
              <input
                type="number"
                value={formData.movingTime}
                onChange={(e) => setFormData({ ...formData, movingTime: e.target.value })}
                className="input"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Effort Level</label>
            <select
              value={formData.effortLevel}
              onChange={(e) => setFormData({ ...formData, effortLevel: e.target.value })}
              className="input"
            >
              <option value="easy">Easy</option>
              <option value="moderate">Moderate</option>
              <option value="hard">Hard</option>
              <option value="race">Race</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input"
              rows="3"
              placeholder="How did it feel?"
            />
          </div>

          <div className="flex space-x-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary flex-1"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Saving...' : 'Save Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
