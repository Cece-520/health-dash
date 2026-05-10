'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

const API_URL = process.env.NEXT_PUBLIC_API_URL

const COMMON_SYMPTOMS = [
  'Headache', 'Fatigue', 'Nausea', 'Back pain',
  'Anxiety', 'Insomnia', 'Dizziness', 'Sore throat'
]

// ── Slider component ─────────────────────────────────────────
function Slider({ label, value, onChange, color, min = 1, max = 10, step = 1, unit }: {
  label: string
  value: number
  onChange: (v: number) => void
  color: string
  min?: number
  max?: number
  step?: number
  unit?: string
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="text-zinc-500 text-xs tracking-widest uppercase">{label}</label>
        <span className={`text-sm font-bold ${color}`}>
          {value}{unit ?? ` / ${max}`}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: color.replace('text-', '').includes('green') ? '#4ade80' : color.includes('blue') ? '#60a5fa' : '#fbbf24' }}
      />
      <div className="flex justify-between text-zinc-700 text-xs mt-1">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}

export default function CheckIn() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Form state
  const [mood, setMood] = useState(5)
  const [sleep, setSleep] = useState(7)
  const [energy, setEnergy] = useState(5)
  const [notes, setNotes] = useState('')
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([])
  const [customSymptom, setCustomSymptom] = useState('')
  const [severities, setSeverities] = useState<Record<string, number>>({})

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) router.push('/')
    }
    checkAuth()
  }, [router])

  function toggleSymptom(name: string) {
    setSelectedSymptoms(prev =>
      prev.includes(name)
        ? prev.filter(s => s !== name)
        : [...prev, name]
    )
    setSeverities(prev =>
      selectedSymptoms.includes(name)
        ? Object.fromEntries(Object.entries(prev).filter(([k]) => k !== name))
        : { ...prev, [name]: 5 }
    )
  }

  function addCustomSymptom() {
    const trimmed = customSymptom.trim()
    if (!trimmed || selectedSymptoms.includes(trimmed)) return
    setSelectedSymptoms(prev => [...prev, trimmed])
    setSeverities(prev => ({ ...prev, [trimmed]: 5 }))
    setCustomSymptom('')
  }

  async function handleSubmit() {
    setError('')
    setLoading(true)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/'); return }

    //Debugggg
    console.log('SESSION:', session)        // ← add this line
    console.log('TOKEN:', session.access_token) 

    const today = new Date().toISOString().split('T')[0]

    const body = {
      date: today,
      mood,
      sleep_hours: sleep,
      energy,
      notes: notes.trim() || null,
      symptoms: selectedSymptoms.map(name => ({
        name,
        severity: severities[name] ?? 5
      }))
    }

    const res = await fetch(`${API_URL}/checkins/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`
      },
      body: JSON.stringify(body)
    })

    if (res.ok) {
      setSuccess(true)
      setTimeout(() => router.push('/dashboard'), 1500)
    } else {
      const data = await res.json()
      setError(data.detail ?? 'Something went wrong. Try again.')
    }

    setLoading(false)
  }

  if (success) {
    return (
      <main className="min-h-screen bg-[#0f0f0f] flex items-center justify-center font-mono">
        <div className="text-center">
          <div className="text-5xl mb-4">✅</div>
          <p className="text-green-400 font-bold text-lg">Check-in saved!</p>
          <p className="text-zinc-500 text-sm mt-2">Redirecting to dashboard...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#0f0f0f] font-mono text-white">

      {/* Background grid */}
      <div className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      <div className="relative max-w-lg mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 text-xs tracking-widest uppercase">Daily Check-in</span>
            </div>
            <h1 className="text-2xl font-bold">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h1>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-zinc-500 hover:text-zinc-300 text-xs transition-colors"
          >
            ← Back
          </button>
        </div>

        {/* Sliders */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-4 space-y-7">
          <Slider label="Mood" value={mood} onChange={setMood} color="text-green-400" />
          <Slider label="Sleep" value={sleep} onChange={setSleep} color="text-blue-400" min={0} max={12} step={0.5} unit=" hrs" />
          <Slider label="Energy" value={energy} onChange={setEnergy} color="text-amber-400" />
        </div>

        {/* Symptoms */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-4">
          <p className="text-zinc-500 text-xs tracking-widest uppercase mb-4">Symptoms (optional)</p>

          {/* Quick select */}
          <div className="flex flex-wrap gap-2 mb-4">
            {COMMON_SYMPTOMS.map(s => (
              <button
                key={s}
                onClick={() => toggleSymptom(s)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  selectedSymptoms.includes(s)
                    ? 'bg-green-400 border-green-400 text-black font-bold'
                    : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Custom symptom input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={customSymptom}
              onChange={e => setCustomSymptom(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCustomSymptom()}
              placeholder="Add custom symptom..."
              className="flex-1 bg-zinc-800 border border-zinc-700 text-white text-xs rounded-lg px-3 py-2 outline-none focus:border-green-400 transition-colors placeholder:text-zinc-600"
            />
            <button
              onClick={addCustomSymptom}
              className="text-xs bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-zinc-400 px-3 py-2 rounded-lg transition-colors"
            >
              Add
            </button>
          </div>

          {/* Severity sliders for selected symptoms */}
          {selectedSymptoms.length > 0 && (
            <div className="mt-5 space-y-4 border-t border-zinc-800 pt-5">
              <p className="text-zinc-600 text-xs tracking-widest uppercase">Severity</p>
              {selectedSymptoms.map(s => (
                <div key={s} className="flex items-center gap-4">
                  <span className="text-zinc-400 text-xs w-28 truncate">{s}</span>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={severities[s] ?? 5}
                    onChange={e => setSeverities(prev => ({ ...prev, [s]: Number(e.target.value) }))}
                    className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
                    style={{ accentColor: '#f87171' }}
                  />
                  <span className="text-red-400 text-xs font-bold w-6 text-right">{severities[s] ?? 5}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
          <label className="text-zinc-500 text-xs tracking-widest uppercase block mb-3">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="How are you feeling today? Anything unusual?"
            rows={3}
            className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-4 py-3 outline-none focus:border-green-400 transition-colors placeholder:text-zinc-600 resize-none"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-950 border border-red-800 text-red-400 text-xs px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-green-400 hover:bg-green-300 text-black text-sm font-bold py-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Save check-in'}
        </button>

      </div>
    </main>
  )
}