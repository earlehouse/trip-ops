'use client'
import { useState } from 'react'
import { Plus, Download, ChevronUp, ChevronDown, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { updateGuest, addGuest, deleteGuest } from '@/app/trips/[tripId]/roster/actions'
import { CanvasSyncPanel } from './CanvasSyncPanel'
import { useToast } from '@/components/ui/Toast'
import type { Trip, Team } from '@/lib/supabase/types'

type Guest = {
  id: string; trip_id: string; team_id: string | null; name: string
  phone_number: string | null
  arrival_date: string | null; arrival_time: string | null
  departure_date: string | null; departure_time: string | null
  hotel_confirmation: string | null
  marriott_loyalty: string | null; hilton_loyalty: string | null
  notes: string | null
  team: Team | null
}

type SortKey = 'name' | 'team' | 'arrival'

interface Props { tripId: string; trip: Trip; initialGuests: Guest[]; teams: Team[] }

export function GuestTable({ tripId, trip, initialGuests, teams }: Props) {
  const { toast } = useToast()
  const [guests, setGuests] = useState<Guest[]>(initialGuests)
  const [filterTeam, setFilterTeam] = useState<string>('all')
  const [sortKey, setSortKey] = useState<SortKey>('arrival')
  const [sortAsc, setSortAsc] = useState(true)
  const [showSync, setShowSync] = useState(false)

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
      setGuests(prev => [...prev, { ...g, team: null }])
    } catch { toast('Failed to add guest', 'error') }
  }

  async function handleDelete(id: string) {
    setGuests(prev => prev.filter(g => g.id !== id))
    try { await deleteGuest(tripId, id) } catch {
      toast('Failed to delete', 'error')
      setGuests(initialGuests)
    }
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(a => !a)
    else { setSortKey(key); setSortAsc(true) }
  }

  const filtered = guests
    .filter(g => filterTeam === 'all' || g.team_id === filterTeam)
    .sort((a, b) => {
      let va = '', vb = ''
      if (sortKey === 'arrival') {
        va = (a.arrival_date ?? '') + (a.arrival_time ?? '')
        vb = (b.arrival_date ?? '') + (b.arrival_time ?? '')
      } else if (sortKey === 'name') { va = a.name; vb = b.name }
      else if (sortKey === 'team') { va = a.team?.name ?? ''; vb = b.team?.name ?? '' }
      return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va)
    })

  function exportCsv() {
    const rows = [
      ['Name', 'Team', 'Phone', 'Arrival', 'Departure', 'Hotel Confirmation', 'Marriott #', 'Hilton #', 'Notes'],
      ...filtered.map(g => [
        g.name,
        g.team?.name ?? '',
        g.phone_number ?? '',
        [g.arrival_date, g.arrival_time ? fmtTime(g.arrival_time) : ''].filter(Boolean).join(' '),
        [g.departure_date, g.departure_time ? fmtTime(g.departure_time) : ''].filter(Boolean).join(' '),
        g.hotel_confirmation ?? '',
        g.marriott_loyalty ?? '',
        g.hilton_loyalty ?? '',
        g.notes ?? '',
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
      ? sortAsc ? <ChevronUp size={12} className="inline ml-0.5" /> : <ChevronDown size={12} className="inline ml-0.5" />
      : null

  const cols: { label: string; key?: SortKey }[] = [
    { label: 'Name', key: 'name' },
    { label: 'Team', key: 'team' },
    { label: 'Phone' },
    { label: 'Arrival', key: 'arrival' },
    { label: 'Departure' },
    { label: 'Hotel Confirmation' },
    { label: 'Marriott #' },
    { label: 'Hilton #' },
    { label: 'Notes' },
  ]

  return (
    <div className="flex flex-col h-full">
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
        <button onClick={() => setShowSync(true)} className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50">
          <RefreshCw size={14} /> Sync from Canvas
        </button>
        <button onClick={exportCsv} className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50">
          <Download size={14} /> Export CSV
        </button>
        <button onClick={handleAdd} className="flex items-center gap-1.5 text-sm text-white bg-indigo-600 rounded-lg px-3 py-1.5 hover:bg-indigo-700">
          <Plus size={14} /> Add guest
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="min-w-full text-sm border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
            <tr>
              {cols.map(col => (
                <th
                  key={col.label}
                  onClick={() => col.key && handleSort(col.key)}
                  className={cn(
                    'text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap select-none',
                    col.key && 'cursor-pointer hover:text-gray-800'
                  )}
                >
                  {col.label}{col.key && <SortIcon k={col.key} />}
                </th>
              ))}
              <th className="w-8 px-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {filtered.map(guest => (
              <GuestRow
                key={guest.id}
                guest={guest}
                teams={teams}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400 text-sm">No guests found</div>
        )}
      </div>

      {showSync && (
        <CanvasSyncPanel
          tripId={tripId}
          tripStartDate={trip.start_date}
          onClose={() => setShowSync(false)}
          onSynced={() => {
            toast('Roster synced — refresh to see updates')
            setShowSync(false)
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}

function fmtTime(t: string): string {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'pm' : 'am'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')}${ampm}`
}

function fmtDate(d: string): string {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function GuestRow({ guest, teams, onUpdate, onDelete }: {
  guest: Guest; teams: Team[]
  onUpdate: (id: string, field: string, value: string | null) => void
  onDelete: (id: string) => void
}) {
  const arrivalDisplay = [
    guest.arrival_date ? fmtDate(guest.arrival_date) : null,
    guest.arrival_time ? fmtTime(guest.arrival_time) : null,
  ].filter(Boolean).join(' ')

  const departureDisplay = [
    guest.departure_date ? fmtDate(guest.departure_date) : null,
    guest.departure_time ? fmtTime(guest.departure_time) : null,
  ].filter(Boolean).join(' ')

  return (
    <tr className="group hover:bg-gray-50">
      <EditCell value={guest.name} onSave={v => onUpdate(guest.id, 'name', v)} />
      <TeamCell guest={guest} teams={teams} onUpdate={onUpdate} />
      <EditCell value={guest.phone_number} onSave={v => onUpdate(guest.id, 'phone_number', v)} placeholder="—" />
      <DateTimeCell
        date={guest.arrival_date}
        time={guest.arrival_time}
        display={arrivalDisplay}
        onSaveDate={v => onUpdate(guest.id, 'arrival_date', v)}
        onSaveTime={v => onUpdate(guest.id, 'arrival_time', v)}
      />
      <DateTimeCell
        date={guest.departure_date}
        time={guest.departure_time}
        display={departureDisplay}
        onSaveDate={v => onUpdate(guest.id, 'departure_date', v)}
        onSaveTime={v => onUpdate(guest.id, 'departure_time', v)}
      />
      <EditCell value={guest.hotel_confirmation} onSave={v => onUpdate(guest.id, 'hotel_confirmation', v)} placeholder="—" />
      <EditCell value={guest.marriott_loyalty} onSave={v => onUpdate(guest.id, 'marriott_loyalty', v)} placeholder="—" />
      <EditCell value={guest.hilton_loyalty} onSave={v => onUpdate(guest.id, 'hilton_loyalty', v)} placeholder="—" />
      <EditCell value={guest.notes} onSave={v => onUpdate(guest.id, 'notes', v)} placeholder="—" wide />
      <td className="px-2">
        <button
          onClick={() => onDelete(guest.id)}
          className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-opacity"
          title="Delete"
        >✕</button>
      </td>
    </tr>
  )
}

function EditCell({ value, onSave, placeholder = '—', wide = false }: {
  value: string | null; onSave: (v: string | null) => void; placeholder?: string; wide?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [local, setLocal] = useState(value ?? '')

  if (editing) {
    return (
      <td className={cn('px-4 py-2', wide && 'min-w-[200px]')}>
        <input
          autoFocus
          value={local}
          onChange={e => setLocal(e.target.value)}
          onBlur={() => { setEditing(false); onSave(local.trim() || null) }}
          onKeyDown={e => {
            if (e.key === 'Enter') { setEditing(false); onSave(local.trim() || null) }
            if (e.key === 'Escape') { setEditing(false); setLocal(value ?? '') }
          }}
          className="w-full border-b border-indigo-400 bg-transparent focus:outline-none text-sm py-0.5"
        />
      </td>
    )
  }

  return (
    <td
      onClick={() => { setEditing(true); setLocal(value ?? '') }}
      className={cn('px-4 py-2.5 cursor-pointer hover:bg-indigo-50 whitespace-nowrap', wide && 'min-w-[200px]')}
    >
      {value || <span className="text-gray-300">{placeholder}</span>}
    </td>
  )
}

function DateTimeCell({ date, time, display, onSaveDate, onSaveTime }: {
  date: string | null; time: string | null; display: string
  onSaveDate: (v: string | null) => void; onSaveTime: (v: string | null) => void
}) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <td className="px-4 py-2 min-w-[180px]">
        <div className="flex flex-col gap-1">
          <input
            type="date"
            defaultValue={date ?? ''}
            onBlur={e => onSaveDate(e.target.value || null)}
            className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400 w-full"
          />
          <input
            type="time"
            defaultValue={time?.slice(0, 5) ?? ''}
            onBlur={e => { onSaveTime(e.target.value ? e.target.value + ':00' : null); setEditing(false) }}
            onKeyDown={e => e.key === 'Escape' && setEditing(false)}
            className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400 w-full"
          />
        </div>
      </td>
    )
  }

  return (
    <td
      onClick={() => setEditing(true)}
      className="px-4 py-2.5 cursor-pointer hover:bg-indigo-50 whitespace-nowrap"
    >
      {display || <span className="text-gray-300">—</span>}
    </td>
  )
}

function TeamCell({ guest, teams, onUpdate }: {
  guest: Guest; teams: Team[]
  onUpdate: (id: string, field: string, value: string | null) => void
}) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <td className="px-4 py-2">
        <select
          autoFocus
          value={guest.team_id ?? ''}
          onChange={e => { onUpdate(guest.id, 'team_id', e.target.value || null); setEditing(false) }}
          onBlur={() => setEditing(false)}
          className="border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
        >
          <option value="">—</option>
          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </td>
    )
  }

  return (
    <td onClick={() => setEditing(true)} className="px-4 py-2.5 cursor-pointer hover:bg-indigo-50 whitespace-nowrap">
      {guest.team
        ? <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white" style={{ backgroundColor: guest.team.color }}>{guest.team.name}</span>
        : <span className="text-gray-300">—</span>
      }
    </td>
  )
}
