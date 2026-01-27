import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { user } from '../api'
import { Award, Calendar, MapPin, Mail, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, subWeeks, startOfWeek, endOfWeek } from 'date-fns'

export default function Profile() {
  const [weekOffset, setWeekOffset] = useState(0)
  const queryClient = useQueryClient()
  
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => user.getProfile().then(res => res.data)
  })

  const { data: weeklyData } = useQuery({
    queryKey: ['weeklyStats', weekOffset],
    queryFn: () => user.getWeeklyStats(weekOffset).then(res => res.data)
  })

  const currentWeekStart = startOfWeek(subWeeks(new Date(), weekOffset), { weekStartsOn: 1 })
  const currentWeekEnd = endOfWeek(subWeeks(new Date(), weekOffset), { weekStartsOn: 1 })
  const isCurrentWeek = weekOffset === 0

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Profile</h1>

      {/* Profile Card */}
      <div className="card">
        <div className="flex items-start space-x-6">
          <img
            src={profile?.profile || profile?.profileMedium || 'https://via.placeholder.com/120'}
            alt={profile?.firstName || 'User'}
            className="w-24 h-24 rounded-full"
          />
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">
              {profile?.firstName || ''} {profile?.lastName || ''}
            </h2>
            <p className="text-gray-600">@{profile?.username || 'user'}</p>
            
            <div className="mt-4 space-y-2">
              {profile?.email && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{profile.email}</span>
                </div>
              )}
              {profile?.city && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{profile.city}, {profile.state}, {profile.country}</span>
                </div>
              )}
              {profile?.premium && (
                <div className="flex items-center space-x-2 text-sm text-primary-600">
                  <Award className="w-4 h-4" />
                  <span>Strava Premium Member</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm text-gray-600 font-medium">Total Runs</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{profile?.totalRuns || 0}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 font-medium">Total km This Year</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {profile?.yearlyDistance?.toFixed(1) || 0}
            <span className="text-lg text-gray-500 ml-1">km</span>
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 font-medium">Total hrs This Year</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {profile?.yearlyTime?.toFixed(1) || 0}
            <span className="text-lg text-gray-500 ml-1">hrs</span>
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 font-medium">Last Sync</p>
          <p className="text-xl font-bold text-gray-900 mt-1">
            {profile?.lastSync ? format(new Date(profile.lastSync), 'MMM d, yyyy') : 'Never'}
          </p>
        </div>
      </div>

      {/* Weekly Distance */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Weekly Distance</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setWeekOffset(weekOffset + 1)}
              className="btn-secondary p-2"
              title="Previous week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-gray-700 min-w-[200px] text-center">
              {format(currentWeekStart, 'MMM d')} - {format(currentWeekEnd, 'MMM d, yyyy')}
            </span>
            <button
              onClick={() => setWeekOffset(Math.max(0, weekOffset - 1))}
              disabled={isCurrentWeek}
              className="btn-secondary p-2 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Next week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Total Distance</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {weeklyData?.totalDistance?.toFixed(1) || 0}
              <span className="text-sm text-gray-500 ml-1">km</span>
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Total Runs</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{weeklyData?.totalRuns || 0}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Total Time</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {weeklyData?.totalTime?.toFixed(1) || 0}
              <span className="text-sm text-gray-500 ml-1">hrs</span>
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Avg Pace</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {weeklyData?.averagePace ? `${Math.floor(weeklyData.averagePace)}:${String(Math.round((weeklyData.averagePace % 1) * 60)).padStart(2, '0')}` : '--'}
              <span className="text-sm text-gray-500 ml-1">/km</span>
            </p>
          </div>
        </div>
      </div>

      {/* Account Info */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Member since</span>
            <span className="font-medium text-gray-900">
              {profile?.createdAt ? format(new Date(profile.createdAt), 'MMM d, yyyy') : 'Unknown'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Strava ID</span>
            <span className="font-medium text-gray-900">{profile?.stravaId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Coaching Style</span>
            <span className="font-medium text-gray-900 capitalize">{profile?.coachingStyle || 'Balanced'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
