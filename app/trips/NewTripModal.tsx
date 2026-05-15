'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createTrip } from './actions'
import { X, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const TEAM_COLORS = ['#7F77DD', '#1D9E75', '#378ADD', '#E07B39', '#C94F7C', '#9ca3af']

interface TeamRow { name: string; headcount: number; color: string }

export function NewTripModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [loading, setLoading] = useState(false)
  const [teams, setTeams] = useState<TeamRow[]>([
    { name: '', headcount: 0, color: TEAM_COLORS[0] },
  ])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formRef.current) return
    setLoading(true)
    try {
      const fd = new FormData(formRef.current)
      fd.set('teams', JSON.stringify(teams.filter(t => t.name.trim())))
      const trip = await createTrip(fd)
      router.push(`/trips/${trip.id}/week`)
    } finally {
      setLoading(false)
    }
  }

  function addTeam() {
    setTeams(prev => [...prev, { name: '', headcount: 0, color: TEAM_COLORS[prev.length % TEAM_COLORS.length] }])
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold">New Trip</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trip name</label>
            <input name="name" required placeholder="Providence — June 2026"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Office location</label>
            <input name="office_location" placeholder="Providence, RI"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start date</label>
              <input name="start_date" type="date" required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End date</label>
              <input name="end_date" type="date" required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Teams</label>
            <div className="space-y-2">
              {teams.map((team, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="color" value={team.color}
                    onChange={e => setTeams(prev => prev.map((t, j) => j === i ? { ...t, color: e.target.value } : t))}
                    className="w-8 h-8 rounded border border-gray-200 cursor-pointer p-0.5"
                  />
                  <input
                    placeholder="Team name"
                    value={team.name}
                    onChange={e => setTeams(prev => prev.map((t, j) => j === i ? { ...t, name: e.target.value } : t))}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <input
                    type="number" min={0} placeholder="Pax"
                    value={team.headcount || ''}
                    onChange={e => setTeams(prev => prev.map((t, j) => j === i ? { ...t, headcount: Number(e.target.value) } : t))}
                    className="w-16 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <button type="button" onClick={() => setTeams(prev => prev.filter((_, j) => j !== i))}
                    className="text-gray-300 hover:text-red-400"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addTeam}
              className="mt-2 flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800">
              <Plus size={14} /> Add team
            </button>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className={cn('px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60')}>
              {loading ? 'Creating…' : 'Create trip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
