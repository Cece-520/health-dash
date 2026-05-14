'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { useTheme } from '../lib/ThemeContext'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts'

interface TrendPoint {
  date: string
  avg_mood: number
  avg_sleep: number
  avg_energy: number
}

interface CheckIn {
  id: string
  date: string
  mood: number
  sleep_hours: number
  energy: number
  notes: string
  symptoms: { name: string; severity: number }[]
}

const API_URL = process.env.NEXT_PUBLIC_API_URL

// ── small stat card ──────────────────────────────────────────
function StatCard({ label, value, unit, color }: {
  label: string; value: number | string; unit?: string; color: string
}) {
  return (
    <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 transition-colors">
      <p className="text-zinc-600 dark:text-zinc-500 text-xs tracking-widest uppercase mb-3">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>
        {value}<span className="text-sm font-normal text-zinc-500 dark:text-zinc-500 ml-1">{unit}</span>
      </p>
    </div>
  )
}

// ── custom tooltip for recharts ───────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-3 text-xs shadow-lg transition-colors">
      <p className="text-zinc-600 dark:text-zinc-400 mb-2">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="capitalize">
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const [trends, setTrends] = useState<TrendPoint[]>([])
  const [recent, setRecent] = useState<CheckIn[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [days, setDays] = useState(14)

  useEffect(() => {
    async function load() {
      // Check auth
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/'); return }

      setUserName(session.user.email?.split('@')[0] ?? 'there')
      const token = session.access_token

      // Fetch trends from Python backend
      const [trendsRes, checkinsRes] = await Promise.all([
        fetch(`${API_URL}/analytics/trends?days=${days}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/checkins/?days=5`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      if (trendsRes.ok) setTrends(await trendsRes.json())
      if (checkinsRes.ok) setRecent(await checkinsRes.json())
      setLoading(false)
    }
    load()
  }, [days, router])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  // Latest check-in for stat cards
  const latest = recent[0]

  if (loading) {
    return (
      <main className="min-h-screen bg-white dark:bg-[#0f0f0f] flex items-center justify-center font-mono transition-colors">
        <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-500">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Loading your data...
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white dark:bg-[#0f0f0f] font-mono text-black dark:text-white transition-colors">

      {/* Background grid */}
      <div className="fixed inset-0 pointer-events-none dark:hidden"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />
      <div className="fixed inset-0 pointer-events-none dark:block hidden"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      <div className="relative max-w-4xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 text-xs tracking-widest uppercase">Wellness Tracker</span>
            </div>
            <h1 className="text-2xl font-bold text-black dark:text-white">Hey, {userName} 👋</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/checkin')}
              className="bg-green-400 hover:bg-green-300 text-black text-xs font-bold px-4 py-2 rounded-lg transition-colors"
            >
              + Check in
            </button>
            <button
              onClick={() => router.push('/symptoms')}
              className="text-zinc-600 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300 text-xs transition-colors border border-zinc-300 dark:border-zinc-700 px-3 py-2 rounded-lg"
            >
              🔍 Symptoms
            </button>
            <button
              onClick={toggleTheme}
              className="text-zinc-600 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300 text-xs transition-colors border border-zinc-300 dark:border-zinc-700 px-3 py-2 rounded-lg"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button
              onClick={handleSignOut}
              className="text-zinc-600 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300 text-xs transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Stat cards */}
        {latest ? (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <StatCard label="Last Mood" value={latest.mood} unit="/ 10" color="text-green-400" />
            <StatCard label="Last Sleep" value={latest.sleep_hours} unit="hrs" color="text-blue-400" />
            <StatCard label="Last Energy" value={latest.energy} unit="/ 10" color="text-amber-400" />
          </div>
        ) : (
          <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 mb-8 text-center transition-colors">
            <p className="text-zinc-600 dark:text-zinc-500 text-sm">No check-ins yet.</p>
            <button
              onClick={() => router.push('/checkin')}
              className="text-green-400 text-xs mt-2 hover:text-green-300 transition-colors underline underline-offset-2"
            >
              Log your first check-in →
            </button>
          </div>
        )}

        {/* Trend charts */}
        <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 mb-6 transition-colors">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-bold tracking-widest uppercase text-zinc-600 dark:text-zinc-400">Trends</h2>
            <div className="flex gap-2">
              {[7, 14, 30].map(d => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`text-xs px-3 py-1 rounded-lg transition-colors ${
                    days === d
                      ? 'bg-green-400 text-black font-bold'
                      : 'text-zinc-600 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>

          {trends.length === 0 ? (
            <p className="text-zinc-600 dark:text-zinc-600 text-sm text-center py-10">
              Not enough data yet — log a few check-ins to see trends.
            </p>
          ) : (
            <div className="space-y-8">
              {/* Mood chart */}
              <div>
                <p className="text-xs text-green-400 tracking-widest uppercase mb-3">Mood</p>
                <ResponsiveContainer width="100%" height={120}>
                  <LineChart data={trends}>
                    <CartesianGrid stroke="rgba(0,0,0,0.1)" strokeDasharray="3 3" vertical={false} className="dark:stroke-[#27272a]" />
                    <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} axisLine={false} className="dark:text-[#52525b]" />
                    <YAxis domain={[1, 10]} tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} axisLine={false} width={20} className="dark:text-[#52525b]" />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="avg_mood" stroke="#4ade80" strokeWidth={2} dot={false} name="mood" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Sleep chart */}
              <div>
                <p className="text-xs text-blue-400 tracking-widest uppercase mb-3">Sleep (hrs)</p>
                <ResponsiveContainer width="100%" height={120}>
                  <LineChart data={trends}>
                    <CartesianGrid stroke="rgba(0,0,0,0.1)" strokeDasharray="3 3" vertical={false} className="dark:stroke-[#27272a]" />
                    <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} axisLine={false} className="dark:text-[#52525b]" />
                    <YAxis domain={[0, 12]} tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} axisLine={false} width={20} className="dark:text-[#52525b]" />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="avg_sleep" stroke="#60a5fa" strokeWidth={2} dot={false} name="sleep" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Energy chart */}
              <div>
                <p className="text-xs text-amber-400 tracking-widest uppercase mb-3">Energy</p>
                <ResponsiveContainer width="100%" height={120}>
                  <LineChart data={trends}>
                    <CartesianGrid stroke="rgba(0,0,0,0.1)" strokeDasharray="3 3" vertical={false} className="dark:stroke-[#27272a]" />
                    <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} axisLine={false} className="dark:text-[#52525b]" />
                    <YAxis domain={[1, 10]} tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} axisLine={false} width={20} className="dark:text-[#52525b]" />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="avg_energy" stroke="#fbbf24" strokeWidth={2} dot={false} name="energy" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Recent check-ins */}
        <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 transition-colors">
          <h2 className="text-sm font-bold tracking-widest uppercase text-zinc-600 dark:text-zinc-400 mb-5">Recent Check-ins</h2>
          {recent.length === 0 ? (
            <p className="text-zinc-600 dark:text-zinc-600 text-sm text-center py-6">No check-ins yet.</p>
          ) : (
            <div className="space-y-3">
              {recent.map(c => (
                <div key={c.id} className="flex items-center justify-between border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-3 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors bg-white dark:bg-zinc-800">
                  <div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">{c.date}</p>
                    {c.symptoms?.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {c.symptoms.map(s => (
                          <button
                            key={s.name}
                            onClick={() => router.push(`/symptoms?name=${encodeURIComponent(s.name)}`)}
                            className="text-xs bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-400 px-2 py-0.5 rounded transition-colors"
                          >
                            {s.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-4 text-xs">
                    <span className="text-green-400">😊 {c.mood}</span>
                    <span className="text-blue-400">💤 {c.sleep_hours}h</span>
                    <span className="text-amber-400">⚡ {c.energy}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  )
}