'use client'
import { useState } from 'react'
import { formatTime } from '@/lib/utils'
import { StatusPill } from './StatusPill'
import { updateEventStatus } from '@/app/trips/[tripId]/bookings/actions'
import { useToast } from '@/components/ui/Toast'
import type { Team } from '@/lib/supabase/types'

type TrackerEvent = {
  id: string; trip_id: string; title: string; date: string
  start_time: string | null; end_time: string | null
  booking_status: string; venue: string | null; headcount: number | null; notes: string | null
  teamIds: string[]
}

interface Props { tripId: string; initialEvents: TrackerEvent[]; teams: Team[] }

export function BookingTracker({ tripId, initialEvents, teams }: Props) {
  const { toast } = useToast()
  const [events, setEvents] = useState(initialEvents)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterTeam, setFilterTeam] = useState<string>('all')
  const [filterDay, setFilterDay] = useState<string>('all')

  const allDays = [...new Set(events.map(e => e.date))].sort()

  async function cycleStatus(ev: TrackerEvent, nextSt: string) {
    if (ev.booking_status === 'na') return
    setEvents(prev => prev.map(e => e.id === ev.id ? { ...e, booking_status: nextSt } : e))
    try {
      await updateEventStatus(tripId, ev.id, nextSt)
    } catch {
      toast('Failed to save', 'error')
      setEvents(initialEvents)
    }
  }

  const filtered = events.filter(ev => {
    if (filterStatus !== 'all' && ev.booking_status !== filterStatus) return false
    if (filterTeam !== 'all' && !ev.teamIds.includes(filterTeam)) return false
    if (filterDay !== 'all' && ev.date !== filterDay) return false
    return true
  })

  const counts = {
    needed: events.filter(e => e.booking_status === 'needed').length,
    in_progress: events.filter(e => e.booking_status === 'in_progress').length,
    booked: events.filter(e => e.booking_status === 'booked').length,
  }

  // Group by day
  const grouped: Record<string, TrackerEvent[]> = {}
  for (const ev of filtered) {
    if (!grouped[ev.date]) grouped[ev.date] = []
    grouped[ev.date].push(ev)
  }

  function getTeamNames(teamIds: string[]) {
    return teamIds.map(id => teams.find(t => t.id === id)?.name ?? '').filter(Boolean).join(', ')
  }

  function dayLabel(d: string) {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric',
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Summary bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-6 shrink-0">
        <h1 className="text-base font-semibold text-gray-900 mr-auto">Bookings</h1>
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gray-400" />
            <span className="text-gray-600">{counts.needed} needed</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-gray-600">{counts.in_progress} in progress</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-gray-600">{counts.booked} booked</span>
          </span>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white border-b border-gray-100 px-6 py-2 flex items-center gap-3 text-sm shrink-0">
        <span className="text-gray-400 text-xs font-medium uppercase tracking-wide mr-1">Filter:</span>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
          <option value="all">All statuses</option>
          <option value="needed">Needed</option>
          <option value="in_progress">In progress</option>
          <option value="booked">Booked</option>
          <option value="na">N/A</option>
        </select>
        <select value={filterTeam} onChange={e => setFilterTeam(e.target.value)}
          className="border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
          <option value="all">All teams</option>
          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select value={filterDay} onChange={e => setFilterDay(e.target.value)}
          className="border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
          <option value="all">All days</option>
          {allDays.map(d => <option key={d} value={d}>{dayLabel(d)}</option>)}
        </select>
        {(filterStatus !== 'all' || filterTeam !== 'all' || filterDay !== 'all') && (
          <button onClick={() => { setFilterStatus('all'); setFilterTeam('all'); setFilterDay('all') }}
            className="text-indigo-600 hover:underline text-xs">Clear filters</button>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {Object.keys(grouped).length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No events match your filters</div>
        ) : (
          Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([day, dayEvents]) => (
            <div key={day}>
              <div className="sticky top-0 z-10 bg-gray-50 border-y border-gray-200 px-6 py-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{dayLabel(day)}</span>
              </div>
              <table className="min-w-full">
                <tbody className="divide-y divide-gray-50">
                  {dayEvents.map(ev => (
                    <tr key={ev.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 w-32 text-sm text-gray-500 whitespace-nowrap">
                        {ev.start_time ? formatTime(ev.start_time) : '—'}
                        {ev.end_time ? ` – ${formatTime(ev.end_time)}` : ''}
                      </td>
                      <td className="px-3 py-3 font-medium text-gray-900 text-sm">{ev.title}</td>
                      <td className="px-3 py-3 text-sm text-gray-500">{getTeamNames(ev.teamIds) || 'All teams'}</td>
                      <td className="px-3 py-3 text-sm text-gray-500">{ev.headcount ? `${ev.headcount} pax` : '—'}</td>
                      <td className="px-3 py-3">
                        <StatusPill status={ev.booking_status} onCycle={next => cycleStatus(ev, next)} />
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-500">{ev.venue ?? '—'}</td>
                      <td className="px-3 py-3 text-sm text-gray-400 max-w-xs truncate">{ev.notes ?? ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
