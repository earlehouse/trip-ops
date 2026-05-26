'use client'
import { useState } from 'react'
import { Hotel, Utensils, CalendarCheck, StickyNote, CheckCircle, AlertCircle, ClipboardList } from 'lucide-react'
import { cn, formatTime } from '@/lib/utils'
import { updateTripNotes, togglePrepTask } from '@/app/trips/[tripId]/overview/actions'
import { useToast } from '@/components/ui/Toast'
import { PREP_TASKS } from '@/lib/prepTasks'

type Guest = { id: string; name: string; hotel_confirmation: string | null }
type Event = { id: string; title: string; date: string; start_time: string | null; booking_status: string }
type Trip = { id: string; name: string; start_date: string; end_date: string; notes?: string | null }

const MEAL_KEYWORDS = ['breakfast', 'lunch', 'dinner', 'happy hour', 'catering', 'brunch', 'food']
const isMeal = (title: string) => MEAL_KEYWORDS.some(k => title.toLowerCase().includes(k))

function dayLabel(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

type PrepTaskRow = { task_key: string; completed: boolean; completed_at: string | null }

interface Props {
  trip: Record<string, unknown>
  guests: Guest[]
  events: Event[]
  prepTasks: PrepTaskRow[]
}

export function TripOverview({ trip, guests, events, prepTasks }: Props) {
  const { toast } = useToast()
  const t = trip as unknown as Trip
  const [notes, setNotes] = useState(t.notes ?? '')
  const [saving, setSaving] = useState(false)

  // Hotel stats
  const totalGuests = guests.length
  const confirmed = guests.filter(g => g.hotel_confirmation?.trim())
  const missing = guests.filter(g => !g.hotel_confirmation?.trim())
  const hotelPct = totalGuests > 0 ? Math.round((confirmed.length / totalGuests) * 100) : 0

  // Food to-dos: needed meal events
  const foodTodos = events.filter(e => e.booking_status === 'needed' && isMeal(e.title))

  // Agenda to-dos: needed non-meal events
  const agendaTodos = events.filter(e => e.booking_status === 'needed' && !isMeal(e.title))

  // In-progress items
  const inProgress = events.filter(e => e.booking_status === 'in_progress')

  const agendaAllDone = agendaTodos.length === 0 && inProgress.filter(e => !isMeal(e.title)).length === 0
  const foodAllDone = foodTodos.length === 0 && inProgress.filter(e => isMeal(e.title)).length === 0

  async function saveNotes() {
    setSaving(true)
    try {
      await updateTripNotes(t.id, notes || null)
      toast('Notes saved')
    } catch { toast('Failed to save', 'error') }
    finally { setSaving(false) }
  }

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-200 bg-white shrink-0">
        <h1 className="text-lg font-bold text-gray-900">{t.name}</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {new Date(t.start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
          {' – '}
          {new Date(t.end_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-2 gap-5 content-start">

        {/* Hotels */}
        <Card icon={Hotel} title="Hotels" iconColor="text-indigo-500">
          <div className="space-y-3">
            {/* Progress bar */}
            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="font-medium text-gray-700">{confirmed.length} of {totalGuests} confirmed</span>
                <span className={cn('font-semibold', hotelPct === 100 ? 'text-emerald-600' : 'text-amber-600')}>
                  {hotelPct}%
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', hotelPct === 100 ? 'bg-emerald-500' : 'bg-amber-400')}
                  style={{ width: `${hotelPct}%` }}
                />
              </div>
            </div>

            {/* Missing confirmations */}
            {missing.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Missing confirmation</p>
                <div className="flex flex-wrap gap-1.5">
                  {missing.map(g => (
                    <span key={g.id} className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-800 border border-amber-200 rounded-full px-2 py-0.5">
                      <AlertCircle size={10} /> {g.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Confirmed list */}
            {confirmed.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Confirmed</p>
                <div className="space-y-1">
                  {confirmed.map(g => (
                    <div key={g.id} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 text-gray-700">
                        <CheckCircle size={13} className="text-emerald-500 shrink-0" />
                        {g.name}
                      </span>
                      <span className="text-gray-400 font-mono text-xs">{g.hotel_confirmation}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {totalGuests === 0 && (
              <p className="text-sm text-gray-400">No guests added yet</p>
            )}
          </div>
        </Card>

        {/* Food to-dos */}
        <Card icon={Utensils} title="Food" iconColor="text-orange-500">
          {foodAllDone ? (
            <div className="flex items-center gap-2 text-sm text-emerald-600">
              <CheckCircle size={15} /> All food bookings confirmed
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Still needed</p>
              {foodTodos.map(ev => (
                <TodoRow key={ev.id} event={ev} />
              ))}
            </div>
          )}
          {inProgress.filter(e => isMeal(e.title)).length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">In progress</p>
              {inProgress.filter(e => isMeal(e.title)).map(ev => (
                <TodoRow key={ev.id} event={ev} />
              ))}
            </div>
          )}
        </Card>

        {/* Agenda to-dos */}
        <Card icon={CalendarCheck} title="Agenda" iconColor="text-indigo-500">
          {agendaAllDone ? (
            <div className="flex items-center gap-2 text-sm text-emerald-600">
              <CheckCircle size={15} /> All agenda items confirmed
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Still needed</p>
              {agendaTodos.map(ev => (
                <TodoRow key={ev.id} event={ev} />
              ))}
            </div>
          )}
          {inProgress.filter(e => !isMeal(e.title)).length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">In progress</p>
              {inProgress.filter(e => !isMeal(e.title)).map(ev => (
                <TodoRow key={ev.id} event={ev} />
              ))}
            </div>
          )}
        </Card>

        {/* Pre-arrival checklist */}
        <div className="lg:col-span-2">
          <PrepChecklist tripId={t.id} startDate={t.start_date} savedTasks={prepTasks} />
        </div>

        {/* Misc notes */}
        <Card icon={StickyNote} title="Misc Notes" iconColor="text-gray-400">
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            onBlur={saveNotes}
            placeholder="Freeform notes — AV needs, special requests, reminders…"
            rows={6}
            className="w-full text-sm text-gray-700 placeholder-gray-300 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
          />
          <div className="flex justify-end mt-1">
            <button
              onClick={saveNotes}
              disabled={saving}
              className="text-xs text-indigo-600 hover:underline disabled:opacity-40"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </Card>

      </div>
    </div>
  )
}

function Card({ icon: Icon, title, iconColor, children }: {
  icon: React.ElementType; title: string; iconColor: string; children: React.ReactNode
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon size={16} className={iconColor} />
        <h2 className="font-semibold text-gray-800 text-sm">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function PrepChecklist({ tripId, startDate, savedTasks }: {
  tripId: string
  startDate: string
  savedTasks: PrepTaskRow[]
}) {
  const { toast } = useToast()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const completedMap = Object.fromEntries(savedTasks.map(t => [t.task_key, t.completed]))
  const [checked, setChecked] = useState<Record<string, boolean>>(completedMap)

  async function handleToggle(key: string, value: boolean) {
    setChecked(prev => ({ ...prev, [key]: value }))
    try {
      await togglePrepTask(tripId, key, value)
    } catch {
      setChecked(prev => ({ ...prev, [key]: !value }))
      toast('Failed to save', 'error')
    }
  }

  function dueDate(daysBeforeTrip: number | null): Date | null {
    if (daysBeforeTrip === null) return null
    const d = new Date(startDate + 'T00:00:00')
    d.setDate(d.getDate() - daysBeforeTrip)
    return d
  }

  function dueDateLabel(due: Date | null): { text: string; color: string } | null {
    if (!due) return null
    const diffDays = Math.floor((due.getTime() - today.getTime()) / 86_400_000)
    if (diffDays < 0) return { text: `Overdue by ${Math.abs(diffDays)}d`, color: 'text-red-500' }
    if (diffDays === 0) return { text: 'Due today', color: 'text-red-500' }
    if (diffDays <= 3) return { text: `Due ${due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`, color: 'text-amber-500' }
    return { text: `Due ${due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`, color: 'text-gray-400' }
  }

  const doneCount = PREP_TASKS.filter(t => checked[t.key]).length

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ClipboardList size={16} className="text-indigo-500" />
          <h2 className="font-semibold text-gray-800 text-sm">Pre-arrival Checklist</h2>
        </div>
        <span className={cn(
          'text-xs font-medium',
          doneCount === PREP_TASKS.length ? 'text-emerald-600' : 'text-gray-400'
        )}>
          {doneCount}/{PREP_TASKS.length} done
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {PREP_TASKS.map(task => {
          const due = dueDate(task.daysBeforeTrip)
          const label = dueDateLabel(due)
          const isChecked = !!checked[task.key]
          return (
            <label
              key={task.key}
              className={cn(
                'flex items-start gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors',
                isChecked
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-white border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/30'
              )}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={e => handleToggle(task.key, e.target.checked)}
                className="mt-0.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-400 shrink-0"
              />
              <div className="min-w-0">
                <p className={cn('text-sm leading-tight', isChecked ? 'line-through text-gray-400' : 'text-gray-700')}>
                  {task.label}
                </p>
                {label && !isChecked && (
                  <p className={cn('text-xs mt-0.5', label.color)}>{label.text}</p>
                )}
              </div>
            </label>
          )
        })}
      </div>
    </div>
  )
}

function TodoRow({ event }: { event: Event }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className={cn(
        'mt-0.5 w-2 h-2 rounded-full shrink-0',
        event.booking_status === 'needed' ? 'bg-gray-400' : 'bg-amber-400'
      )} />
      <div className="min-w-0">
        <span className="text-gray-700 font-medium">{event.title}</span>
        <span className="text-gray-400 ml-2 text-xs">
          {dayLabel(event.date)}
          {event.start_time ? ` · ${formatTime(event.start_time)}` : ''}
        </span>
      </div>
    </div>
  )
}
