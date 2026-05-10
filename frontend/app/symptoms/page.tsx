'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../lib/supabase'

const API_URL = process.env.NEXT_PUBLIC_API_URL

interface SymptomResult {
  title: string
  summary: string
  url: string
}

interface SymptomInfo {
  symptom: string
  source: string
  disclaimer: string
  results: SymptomResult[]
}

const COMMON_SYMPTOMS = [
  'Headache', 'Fatigue', 'Nausea', 'Back pain',
  'Anxiety', 'Insomnia', 'Dizziness', 'Sore throat'
]

function SymptomsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('name') ?? '')
  const [info, setInfo] = useState<SymptomInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) router.push('/')
    }
    checkAuth()
  }, [router])

  // Auto-search if name param is in URL (coming from dashboard symptom tag)
  useEffect(() => {
    const name = searchParams.get('name')
    if (name) {
      setQuery(name)
      fetchInfo(name)
    }
  }, [searchParams])

  async function fetchInfo(name: string) {
    if (!name.trim()) return
    setLoading(true)
    setError('')
    setInfo(null)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/'); return }

    const res = await fetch(
      `${API_URL}/symptoms/info?name=${encodeURIComponent(name.trim())}`,
      { headers: { Authorization: `Bearer ${session.access_token}` } }
    )

    if (res.ok) {
      setInfo(await res.json())
    } else {
      setError('Could not fetch symptom info. Try again.')
    }

    setLoading(false)
  }

  function handleSearch() {
    fetchInfo(query)
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

      <div className="relative max-w-2xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 text-xs tracking-widest uppercase">Symptom Info</span>
            </div>
            <h1 className="text-2xl font-bold">Health Resources</h1>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-zinc-500 hover:text-zinc-300 text-xs transition-colors"
          >
            ← Dashboard
          </button>
        </div>

        {/* Search bar */}
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search a symptom..."
            className="flex-1 bg-zinc-900 border border-zinc-800 text-white text-sm rounded-lg px-4 py-3 outline-none focus:border-green-400 transition-colors placeholder:text-zinc-600"
          />
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="bg-green-400 hover:bg-green-300 text-black text-xs font-bold px-5 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '...' : 'Search'}
          </button>
        </div>

        {/* Common symptom quick buttons */}
        <div className="mb-8">
          <p className="text-zinc-600 text-xs tracking-widest uppercase mb-3">Common symptoms</p>
          <div className="flex flex-wrap gap-2">
            {COMMON_SYMPTOMS.map(s => (
              <button
                key={s}
                onClick={() => { setQuery(s); fetchInfo(s) }}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  query === s
                    ? 'bg-green-400 border-green-400 text-black font-bold'
                    : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center gap-3 text-zinc-500 py-10 justify-center">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Fetching health info...
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-950 border border-red-800 text-red-400 text-xs px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Results */}
        {info && !loading && (
          <div>
            {/* Source disclaimer */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-5 flex items-start gap-3">
              <span className="text-blue-400 text-lg">ℹ️</span>
              <div>
                <p className="text-zinc-400 text-xs">{info.disclaimer}</p>
                <p className="text-zinc-600 text-xs mt-1">Source: {info.source}</p>
              </div>
            </div>

            {/* Result cards */}
            {info.results.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-zinc-500 text-sm">No results found for "{info.symptom}".</p>
                <p className="text-zinc-600 text-xs mt-2">Try a different search term.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-zinc-500 text-xs tracking-widest uppercase">
                  Results for "{info.symptom}"
                </p>
                {info.results.map((result, i) => (
                  <div key={i} className="bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl p-6 transition-colors">
                    <h3 className="text-white font-bold text-sm mb-3">{result.title}</h3>
                    {result.summary && (
                      <p className="text-zinc-400 text-xs leading-relaxed mb-4 line-clamp-4">
                        {result.summary.replace(/<[^>]*>/g, '')}
                      </p>
                    )}
                    {result.url && (
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-400 hover:text-green-300 text-xs transition-colors underline underline-offset-2"
                      >
                        Read more on MedlinePlus →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!info && !loading && !error && (
          <div className="text-center py-16 border border-zinc-800 rounded-xl">
            <p className="text-4xl mb-4">🔍</p>
            <p className="text-zinc-500 text-sm">Search a symptom to get health information.</p>
            <p className="text-zinc-600 text-xs mt-2">Powered by MedlinePlus — U.S. National Library of Medicine</p>
          </div>
        )}

      </div>
    </main>
  )
}

export default function Symptoms() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#0f0f0f] flex items-center justify-center font-mono">
        <div className="flex items-center gap-3 text-zinc-500">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Loading...
        </div>
      </main>
    }>
      <SymptomsContent />
    </Suspense>
  )
}