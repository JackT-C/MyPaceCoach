import { useQuery } from '@tanstack/react-query'
import { activities, coach } from '../api'
import { Activity, TrendingUp, Calendar, Zap, RefreshCw, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, subDays, subWeeks, startOfWeek, endOfWeek } from 'date-fns'
import { useState } from 'react'

export default function Dashboard() {
  const [syncing, setSyncing] = useState(false)
  const [weekOffset, setWeekOffset] = useState(0)

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats', 'week'],
    queryFn: () => activities.getStats('week').then(res => res.data)
  })

  // Fetch activities for the selected week
  const { data: weekActivities, isLoading: weekActivitiesLoading } = useQuery({
    queryKey: ['activities', 'week', weekOffset],
    queryFn: () => {
      // Calculate week boundaries inside the query
      const currentWeekStart = startOfWeek(subWeeks(new Date(), weekOffset), { weekStartsOn: 1 })
      const currentWeekEnd = endOfWeek(subWeeks(new Date(), weekOffset), { weekStartsOn: 1 })
      
      return activities.getAll({ limit: 100 }).then(res => {
        // Filter activities for the selected week
        return res.data.filter(a => {
          const activityDate = new Date(a.date)
          return activityDate >= currentWeekStart && activityDate <= currentWeekEnd
        })
      })
    }
  })

  const { data: recentActivities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['activities', 'recent'],
    queryFn: () => activities.getAll({ limit: 10 }).then(res => res.data)
  })

  const { data: insights, isLoading: insightsLoading } = useQuery({
    queryKey: ['insights'],
    queryFn: () => coach.getInsights().then(res => res.data)
  })

  // Calculate week boundaries for display
  const currentWeekStart = startOfWeek(subWeeks(new Date(), weekOffset), { weekStartsOn: 1 })
  const currentWeekEnd = endOfWeek(subWeeks(new Date(), weekOffset), { weekStartsOn: 1 })
  const isCurrentWeek = weekOffset === 0

  const handleSync = async () => {
    setSyncing(true)
    try {
      await activities.sync()
      window.location.reload()
    } catch (error) {
      console.error('Sync failed:', error)
    } finally {
      setSyncing(false)
    }
  }

  // Calculate weekly chart data with pagination
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(currentWeekEnd, 6 - i)
    const dayActivities = weekActivities?.filter(a => {
      const activityDate = new Date(a.date)
      return activityDate.toDateString() === date.toDateString()
    }) || []
    return {
      key: i,
      day: format(date, 'EEE'),
      distance: dayActivities.reduce((sum, a) => sum + (a.distance || 0), 0) / 1000
    }
  })

  if (statsLoading || activitiesLoading || weekActivitiesLoading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's your training overview</p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="btn-primary flex items-center space-x-2"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          <span>Sync Strava</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Distance</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats?.totalDistance?.toFixed(1) || 0}
                <span className="text-lg text-gray-500 ml-1">km</span>
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-primary-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Last 7 days</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Runs</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.totalRuns || 0}</p>
            </div>
            <div className="w-12 h-12 bg-accent-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-accent-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">This week</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Avg Pace</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats?.averagePace ? `${Math.floor(stats.averagePace)}:${String(Math.round((stats.averagePace % 1) * 60)).padStart(2, '0')}` : '--'}
                <span className="text-lg text-gray-500 ml-1">/km</span>
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Average pace</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Time Running</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats?.totalTime?.toFixed(1) || 0}
                <span className="text-lg text-gray-500 ml-1">hrs</span>
              </p>
            </div>
            <div className="w-12 h-12 bg-accent-100 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-accent-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Total time</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Distance Chart */}
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
              <span className="text-xs font-medium text-gray-700 min-w-[140px] text-center">
                {format(currentWeekStart, 'MMM d')} - {format(currentWeekEnd, 'MMM d')}
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
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                formatter={(value) => [`${value.toFixed(1)} km`, 'Distance']}
              />
              <Bar dataKey="distance" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* AI Insights */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">AI Coach Insights</h3>
            <MessageCircle className="w-5 h-5 text-primary-600" />
          </div>
          {insightsLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 max-h-[300px] overflow-y-auto">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {insights?.insights}
                </p>
              </div>
              <button className="btn-primary w-full" onClick={() => window.location.href = '/coach'}>
                Chat with Coach
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activities */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
        <div className="space-y-3">
          {recentActivities?.slice(0, 5).map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{activity.name}</p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(activity.date), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">
                  {((activity.distance || 0) / 1000).toFixed(2)} km
                </p>
                <p className="text-sm text-gray-600">
                  {activity.pace ? `${Math.floor(activity.pace)}:${String(Math.round((activity.pace % 1) * 60)).padStart(2, '0')} /km` : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
