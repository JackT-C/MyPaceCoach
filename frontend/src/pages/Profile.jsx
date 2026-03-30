import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { user } from '../api'
import { Award, MapPin, Mail, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, subWeeks, startOfWeek, endOfWeek } from 'date-fns'
import { InitialsAvatar } from '../components/Layout'

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
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-teal-600 border-t-transparent"></div>
      </div>
    )
  }

  const initial = (profile?.firstName?.[0] || profile?.username?.[0] || '?').toUpperCase()

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Profile</h1>

      {/* Profile Card */}
      <div className="card">
        <div className="flex items-start space-x-5">
          {profile?.profile || profile?.profileMedium ? (
            <img src={profile.profile || profile.profileMedium} alt={profile?.firstName || 'User'} className="w-20 h-20 rounded-full flex-shrink-0" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-teal-600 dark:bg-teal-500 text-white dark:text-gray-950 text-2xl font-bold flex items-center justify-center flex-shrink-0">
              {initial}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {profile?.firstName || ''} {profile?.lastName || ''}
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>@{profile?.username || 'user'}</p>
            
            <div className="mt-3 space-y-1.5">
              {profile?.email && (
                <div className="flex items-center space-x-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <Mail className="w-3.5 h-3.5" /><span>{profile.email}</span>
                </div>
              )}
              {profile?.city && (
                <div className="flex items-center space-x-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <MapPin className="w-3.5 h-3.5" /><span>{profile.city}, {profile.state}, {profile.country}</span>
                </div>
              )}
              {profile?.premium && (
                <div className="flex items-center space-x-2 text-sm text-amber-600 dark:text-amber-400">
                  <Award className="w-3.5 h-3.5" /><span>Strava Premium</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats — inline key-value */}
      <div className="card">
        <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>Stats</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-baseline">
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Total Runs</span>
            <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{profile?.totalRuns || 0}</span>
          </div>
          <div className="flex justify-between items-baseline" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Distance This Year</span>
            <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {profile?.yearlyDistance?.toFixed(1) || 0} <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>km</span>
            </span>
          </div>
          <div className="flex justify-between items-baseline" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Time This Year</span>
            <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {profile?.yearlyTime?.toFixed(1) || 0} <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>hrs</span>
            </span>
          </div>
          <div className="flex justify-between items-baseline" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Last Synced</span>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {profile?.lastSync ? format(new Date(profile.lastSync), 'MMM d, yyyy') : 'Never'}
            </span>
          </div>
        </div>
      </div>

      {/* Weekly Distance */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Weekly Distance</h3>
          <div className="flex items-center space-x-2">
            <button onClick={() => setWeekOffset(weekOffset + 1)} className="btn-secondary p-1.5">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-medium min-w-[170px] text-center" style={{ color: 'var(--text-secondary)' }}>
              {format(currentWeekStart, 'MMM d')} – {format(currentWeekEnd, 'MMM d, yyyy')}
            </span>
            <button onClick={() => setWeekOffset(Math.max(0, weekOffset - 1))} disabled={isCurrentWeek} className="btn-secondary p-1.5 disabled:opacity-40">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Distance', value: `${weeklyData?.totalDistance?.toFixed(1) || 0}`, unit: 'km' },
            { label: 'Runs', value: `${weeklyData?.totalRuns || 0}`, unit: '' },
            { label: 'Time', value: `${weeklyData?.totalTime?.toFixed(1) || 0}`, unit: 'hrs' },
            { label: 'Avg Pace', value: weeklyData?.averagePace ? `${Math.floor(weeklyData.averagePace)}:${String(Math.round((weeklyData.averagePace % 1) * 60)).padStart(2, '0')}` : '--', unit: '/km' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
              <p className="text-xl font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>
                {stat.value}
                {stat.unit && <span className="text-xs font-normal ml-0.5" style={{ color: 'var(--text-muted)' }}>{stat.unit}</span>}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Account Info */}
      <div className="card">
        <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>Account</h3>
        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between">
            <span style={{ color: 'var(--text-muted)' }}>Member since</span>
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
              {profile?.createdAt ? format(new Date(profile.createdAt), 'MMM d, yyyy') : 'Unknown'}
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: 'var(--text-muted)' }}>Strava ID</span>
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{profile?.stravaId}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: 'var(--text-muted)' }}>Coaching Style</span>
            <span className="font-medium capitalize" style={{ color: 'var(--text-primary)' }}>{profile?.coachingStyle || 'Balanced'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
