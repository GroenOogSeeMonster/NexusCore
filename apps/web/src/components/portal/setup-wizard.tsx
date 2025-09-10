'use client'

import { useEffect, useState } from 'react'

type SetupStatus = { setupCompleted: boolean; admin: null | { firstName: string } }

export function SetupWizard() {
  const [status, setStatus] = useState<SetupStatus | null>(null)
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', openaiApiKey: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/setup/status').then(r => r.json()).then(setStatus).catch(() => setStatus({ setupCompleted: true, admin: null }))
  }, [])

  if (!status || status.setupCompleted) return null

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const res = await fetch('/api/setup/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      setError(j.error || 'Failed to initialize setup')
    } else {
      setStatus({ setupCompleted: true, admin: { firstName: form.firstName } })
      location.reload()
    }
    setSubmitting(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="glass rounded-2xl p-6 w-full max-w-lg">
        <h2 className="text-xl font-display text-white mb-4">Welcome to DevForge</h2>
        <p className="text-gray-300 mb-4">Let's create your admin account and set your OpenAI API key. You can change these later.</p>
        {error && <div className="mb-3 text-red-400 text-sm">{error}</div>}
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white" placeholder="First name" value={form.firstName} onChange={e=>setForm(f=>({...f, firstName:e.target.value}))} required />
            <input className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white" placeholder="Last name" value={form.lastName} onChange={e=>setForm(f=>({...f, lastName:e.target.value}))} required />
          </div>
          <input className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white" placeholder="Email" type="email" value={form.email} onChange={e=>setForm(f=>({...f, email:e.target.value}))} required />
          <input className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white" placeholder="OpenAI API Key (optional)" value={form.openaiApiKey} onChange={e=>setForm(f=>({...f, openaiApiKey:e.target.value}))} />
          <div className="flex justify-end gap-2 pt-2">
            <button type="submit" disabled={submitting} className="btn-cosmic disabled:opacity-50">{submitting ? 'Saving…' : 'Save & Continue'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}


