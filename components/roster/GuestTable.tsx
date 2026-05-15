'use client'
import { useState, useCallback } from 'react'
import { Plus, Download, ChevronUp, ChevronDown } from 'lucide-react'
import { cn, formatTime, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { GanttMini } from './GanttMini'
import { updateGuest, addGuest, deleteGuest } from '@/app/trips/[tripId]/roster/actions'
import type { Trip, Team } from '@/lib/supabase/types'
import { useToast } from '@/components/ui/Toast'

type Guest = {
  id: string; trip_id: string; team_id: string | null; name: string
  arrival_date: string | null; arrival_time: string | null; arrival_flight: string | null
  departure_date: string | null; departure_time: string | null; departure_flight: string | null
  transport_mode: string | null; special_requests: string | null; bonvoy_number: string | null; notes: string | null
  team: Team | null
}

type SortKey = 'arrival_date' | 'name' | 'team'

interface Props { tripId: string; trip: Trip; initialGuests: Guest[]; teams: Team[] }

export function GuestTable({ tripId, trip, initialGuests, teams }: Props) {
  const { toast } = useToast()
  const [guests, setGuests] = useState<Guest[]>(initialGuests)
  const [filterTeam, setFilterTeam] = useState<string>('all')
  const [sortKey, setSortKey] = useState<SortKey>('arrival_date')
  const [sortAsc, setSortAsc] = useState(true)

  const isVip = (g: Guest) => !!g.special_requests?.toLowerCase().includes('vip')
  const isEarlyCI = (g: Guest) => !!g.special_requests?.toLowerCase().includes('early check')
  const isOddArrival = (g: Guest) =>
    !!(g.arrival_date && (g.arrival_date > trip.end_date || g.arrival_date < trip.start_date))

  async function handleUpdate(id: string, field: string, value: string | null) {
    setGuests(prev => prev.map(g => g.id === id ? { ...g, [field]: value } : g))
    try {
      await updateGuest(id, field, value)
    } catch {
      toast('Failed to save', 'error')
      setGuests(initialGuests)
    }
  }

  async function handleAdd() {
    try {
      const g = await addGuest(tripId, null) as Guest
      const newGuest: Guest = { ...g, team: null }
      setGuests(prev => [...prev, newGuest])
    } catch { toast('Failed to add guest', 'error') }
  }

  async function handleDelete(id: string) {
    setGuests(prev => prev.filter(g => g.id !== id))
    try { await deleteGuest(tripId, id) } catch { toast('Failed to delete', 'error'); setGuests(initialGuests) }
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(a => !a)
    else { setSortKey(key); setSortAsc(true) }
  }

  const filtered = guests
    .filter(g => filterTeam === 'all' || g.team_id === filterTeam)
    .sort((a, b) => {
      let va = '', vb = ''
      if (sortKey === 'arrival_date') { va = (a.arrival_date ?? '') + (a.arrival_time ?? ''); vb = (b.arrival_date ?? '') + (b.arrival_time ?? '') }
      else if (sortKey === 'name') { va = a.name; vb = b.name }
      else if (sortKey === 'team') { va = a.team?.name ?? ''; vb = b.team?.name ?? '' }
      return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va)
    })

  function exportCsv() {
    const rows = [
      ['Name', 'Team', 'Arrival Date', 'Arrival Time', 'Arrival Flight', 'Departure Date', 'Departure Time', 'Departure Flight', 'Transport', 'Special Requests', 'Bonvoy #', 'Notes'],
      ...filtered.map(g => [
        g.name, g.team?.name ?? '', g.arrival_date ?? '', g.arrival_time ? formatTime(g.arrival_time) : '',
        g.arrival_flight ?? '', g.departure_date ?? '', g.departure_time ? formatTime(g.departure_time) : '',
        g.departure_flight ?? '', g.transport_mode ?? '', g.special_requests ?? '', g.bonvoy_number ?? '', g.notes ?? '',
      ]),
    ]
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    a.download = `${trip.name}-roster.csv`
    a.click()
  }

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k
      ? sortAsc ? <ChevronUp size={13} className="inline" /> : <ChevronDown size={13} className="inline" />
      : null

  return (
    <div className="flex flex-col h-full">
      {/* Gantt */}
      <GanttMini guests={guests} teams={teams} trip={trip} />

      {/* Toolbar */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-200 bg-white shrink-0">
        <h1 className="text-base font-semibold text-gray-900 mr-auto">Roster</h1>
        <select
          value={filterTeam}
          onChange={e => setFilterTeam(e.target.value)}
          className="border border-gray-200 rounded-lg text-sm px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="all">All teams</option>
          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <button onClick={exportCsv} className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50">
          <Download size={14} /> Export CSV
        </button>
        <button onClick={handleAdd} className="flex items-center gap-1.5 text-sm text-white bg-indigo-600 rounded-lg px-3 py-1.5 hover:bg-indigo-700">
          <Plus size={14} /> Add guest
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
            <tr>
              {[
                { label: 'Name', key: 'name' as SortKey },
                { label: 'Team', key: 'team' as SortKey },
                { label: 'Arrives', key: 'arrival_date' as SortKey },
                { label: 'Departs', key: null },
                { label: 'Transport', key: null },
                { label: 'Special Requests', key: null },
                { label: 'Bonvoy #', key: null },
                { label: 'Notes', key: null },
              ].map(col => (
                <th
                  key={col.label}
                  className={cn('text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap', col.key && 'cursor-pointer hover:text-gray-700')}
                  onClick={() => col.key && handleSort(col.key)}
                >
                  {col.label} {col.key && <SortIcon k={col.key} />}
                </th>
              ))}
              <th className="px-3 py-2.5 w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(guest => (
              <GuestRow
                key={guest.id}
                guest={guest}
                teams={teams}
                trip={trip}
                isVip={isVip(guest)}
                isEarlyCI={isEarlyCI(guest)}
                isOddArrival={isOddArrival(guest)}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400 text-sm">
            No guests found
          </div>
        )}
      </div>
    </div>
  )
}

function GuestRow({ guest, teams, trip, isVip, isEarlyCI, isOddArrival, onUpdate, onDelete }: {
  guest: Guest; teams: Team[]; trip: Trip
  isVip: boolean; isEarlyCI: boolean; isOddArrival: boolean
  onUpdate: (id: string, field: string, value: string | null) => void
  onDelete: (id: string) => void
}) {
  const rowClass = cn(
    'group',
    isVip && 'bg-purple-50',
    isEarlyCI && !isVip && 'bg-amber-50',
    isOddArrival && 'opacity-60',
  )

  const teamColor = guest.team?.color
  const arrivalStr = [guest.arrival_date, guest.arrival_time ? formatTime(guest.arrival_time) : '', guest.arrival_flight].filter(Boolean).join(' · ')
  const departureStr = [guest.departure_date, guest.departure_time ? formatTime(guest.departure_time) : '', guest.departure_flight].filter(Boolean).join(' · ')

  function Cell({ field, value, type = 'text' }: { field: string; value: string | null; type?: string }) {
    const [editing, setEditing] = useState(false)
    const [local, setLocal] = useState(value ?? '')

    if (editing) {
      return (
        <td className="px-3 py-1.5">
          <input
            autoFocus
            type={type}
            value={local}
            onChange={e => setLocal(e.target.value)}
            onBlur={() => { setEditing(false); onUpdate(guest.id, field, local || null) }}
            onKeyDown={e => { if (e.key === 'Enter') { setEditing(false); onUpdate(guest.id, field, local || null) } if (e.key === 'Escape') { setEditing(false); setLocal(value ?? '') } }}
            className="w-full border-b border-indigo-400 bg-transparent text-sm focus:outline-none px-0"
          />
        </td>
      )
    }
    return (
      <td
        className="px-3 py-2 text-gray-700 cursor-pointer hover:bg-indigo-50 rounded whitespace-nowrap"
        onClick={() => setEditing(true)}
      >
        {local || <span className="text-gray-300 italic">—</span>}
      </td>
    )
  }

  function TeamCell() {
    const [editing, setEditing] = useState(false)
    if (editing) {
      return (
        <td className="px-3 py-1.5">
          <select
            autoFocus
            value={guest.team_id ?? ''}
            onChange={e => { onUpdate(guest.id, 'team_id', e.target.value || null); setEditing(false) }}
            onBlur={() => setEditing(false)}
            className="border border-gray-200 rounded text-sm focus:outline-none"
          >
            <option value="">—</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </td>
      )
    }
    return (
      <td className="px-3 py-2 cursor-pointer hover:bg-indigo-50" onClick={() => setEditing(true)}>
        {guest.team ? (
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white" style={{ backgroundColor: teamColor }}>
            {guest.team.name}
          </span>
        ) : <span className="text-gray-300 italic text-xs">—</span>}
      </td>
    )
  }

  function ComboCell({ dateField, timeField, flightField }: { dateField: string; timeField: string; flightField: string }) {
    const [editing, setEditing] = useState(false)
    const dateVal = (guest as Record<string, unknown>)[dateField] as string | null
    const timeVal = (guest as Record<string, unknown>)[timeField] as string | null
    const flightVal = (guest as Record<string, unknown>)[flightField] as string | null

    if (editing) {
      return (
        <td className="px-3 py-1.5">
          <div className="flex flex-col gap-1 min-w-[180px]">
            <input type="date" defaultValue={dateVal ?? ''} placeholder="Date"
              onBlur={e => onUpdate(guest.id, dateField, e.target.value || null)}
              className="border-b border-gray-300 text-xs focus:outline-none" />
            <input type="time" defaultValue={timeVal?.slice(0, 5) ?? ''} placeholder="Time"
              onBlur={e => onUpdate(guest.id, timeField, e.target.value ? e.target.value + ':00' : null)}
              className="border-b border-gray-300 text-xs focus:outline-none" />
            <input type="text" defaultValue={flightVal ?? ''} placeholder="Flight / transport"
              onBlur={e => { onUpdate(guest.id, flightField, e.target.value || null); setEditing(false) }}
              onKeyDown={e => e.key === 'Enter' && setEditing(false)}
              className="border-b border-gray-300 text-xs focus:outline-none" />
          </div>
        </td>
      )
    }
    const display = [
      dateVal,
      timeVal ? formatTime(timeVal) : null,
      flightVal,
    ].filter(Boolean).join(' · ')
    return (
      <td className="px-3 py-2 cursor-pointer hover:bg-indigo-50 whitespace-nowrap" onClick={() => setEditing(true)}>
        {display || <span className="text-gray-300 italic">—</span>}
      </td>
    )
  }

  return (
    <tr className={rowClass}>
      <Cell field="name" value={guest.name} />
      <TeamCell />
      <ComboCell dateField="arrival_date" timeField="arrival_time" flightField="arrival_flight" />
      <ComboCell dateField="departure_date" timeField="departure_time" flightField="departure_flight" />
      <Cell field="transport_mode" value={guest.transport_mode} />
      <td className="px-3 py-2">
        {isVip && <Badge variant="purple" className="mr-1">VIP</Badge>}
        {isEarlyCI && <Badge variant="amber" className="mr-1">Early CI</Badge>}
        {!isVip && !isEarlyCI && guest.special_requests ? (
          <span className="text-gray-600 text-xs">{guest.special_requests}</span>
        ) : null}
      </td>
      <Cell field="bonvoy_number" value={guest.bonvoy_number} />
      <Cell field="notes" value={guest.notes} />
      <td className="px-3 py-2">
        <button
          onClick={() => onDelete(guest.id)}
          className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-opacity text-xs"
          title="Delete guest"
        >✕</button>
      </td>
    </tr>
  )
}
