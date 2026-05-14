'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from './lib/supabase'

export default function Home() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  async function handleSubmit() {
    setError('')
    setSuccess('')
    setLoading(true)

    if (!email || !password) {
      setError('Please fill in all fields.')
      setLoading(false)
      return
    }

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setSuccess('Account created! Check your email, or log in now.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else router.push('/dashboard')
    }

    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-[#0f0f0f] flex items-center justify-center px-4 font-mono overflow-hidden relative transition-colors duration-300">

      {/* Background grid */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      {/* Glow blob */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(134,239,172,0.07) 0%, transparent 70%)' }}
      />

      <div className="relative w-full max-w-sm">

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-600 dark:text-green-400 text-xs tracking-widest uppercase">Wellness Tracker</span>
          </div>
          <h1 className="text-zinc-900 dark:text-white text-4xl font-bold leading-tight tracking-tight">
            {mode === 'login' ? 'Welcome\nback.' : 'Create\naccount.'}
          </h1>
          <p className="text-zinc-500 text-sm mt-3">
            {mode === 'login'
              ? 'Track your mood, sleep and energy.'
              : 'Start tracking your daily wellness.'}
          </p>
        </div>

        {/* Form */}
        <div className="space-y-3">
          <div>
            <label className="text-zinc-500 text-xs tracking-widest uppercase block mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-sm rounded-lg px-4 py-3 outline-none focus:border-green-500 dark:focus:border-green-400 transition-colors placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
            />
          </div>

          <div>
            <label className="text-zinc-500 text-xs tracking-widest uppercase block mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-sm rounded-lg px-4 py-3 outline-none focus:border-green-500 dark:focus:border-green-400 transition-colors placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
            />
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 text-xs px-4 py-3 rounded-lg">
              {success}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-green-500 dark:bg-green-400 hover:bg-green-400 dark:hover:bg-green-300 text-white dark:text-black text-sm font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1"
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </div>

        {/* Toggle */}
        <div className="mt-6 text-center">
          <span className="text-zinc-500 text-xs">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          </span>
          <button
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setSuccess('') }}
            className="text-green-600 dark:text-green-400 text-xs hover:text-green-500 transition-colors underline underline-offset-2"
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </div>

        <div className="mt-8 border-t border-zinc-200 dark:border-zinc-800 pt-6">
          <p className="text-zinc-400 dark:text-zinc-600 text-xs text-center">
            Portfolio project — data is for demo purposes only.
          </p>
        </div>

      </div>
    </main>
  )
}