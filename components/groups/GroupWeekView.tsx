'use client'
import Link from 'next/link'
import { Hotel, CalendarDays, Users, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type SubTrip = { id: string; name: string; start_date: string; end_date: string }
type Guest = {
  id: string; name: string; trip_id: string;
  hotel_confirmation: string | null; marriott_loyalty: string | null; hilton_loyalty: string | null
}
type GroupEvent = {
  id: string; trip_id: string | null; title: string; date: string;
  start_time: string | null; booking_status: string; is_shared: boolean
}

interface Props {
  group: { id: string; name: string; start_date: string; end_date: string }
  subTrips: SubTrip[]
  guests: Guest[]
  events: GroupEvent[]
}

function dayLabel(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
}

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
}

export function GroupWeekView({ group, subTrips, guests, events }: Props) {
  const totalGuests = guests.length
  const confirmed = guests.filter(g => g.hotel_confirmation?.trim())
  const missing = guests.filter(g => !g.hotel_confirmation?.trim())
  const hotelPct = totalGuests > 0 ? Math.round((confirmed.length / totalGuests) * 100) : 0

  const sharedEvents = events.filter(e => e.is_shared)

  // Group shared events by date
  const sharedByDate: Record<string, GroupEvent[]> = {}
  for (const ev of sharedEvents) {
    if (!sharedByDate[ev.date]) sharedByDate[ev.date] = []
    sharedByDate[ev.date].push(ev)
  }
  const sharedDates = Object.keys(sharedByDate).sort()

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-200 bg-white shrink-0">
        <h1 className="text-lg font-bold text-gray-900">{group.name}</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {new Date(group.start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
          {' – '}
          {new Date(group.end_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          {totalGuests > 0 && (
            <span className="ml-3 inline-flex items-center gap-1 text-gray-500">
              <Users size={13} /> {totalGuests} guests total
            </span>
          )}
        </p>
      </div>

      <div className="flex-1 p-6 space-y-5 content-start">

        {/* Hotels — full width */}
        <Card icon={Hotel} title="Hotels" iconColor="text-indigo-500" fullWidth>
          <div className="space-y-3">
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

            {confirmed.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Confirmed</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
                  {confirmed.map(g => (
                    <div key={g.id} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 text-gray-700">
                        <CheckCircle size={13} className="text-emerald-500 shrink-0" />
                        {g.name}
                      </span>
                      <span className="text-gray-400 font-mono text-xs ml-2">{g.hotel_confirmation}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {totalGuests === 0 && (
              <p className="text-sm text-gray-400">No guests added across sub-trips yet</p>
            )}
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Shared Events */}
          <Card icon={CalendarDays} title="Shared Events" iconColor="text-indigo-500">
            {sharedDates.length === 0 ? (
              <p className="text-sm text-gray-400">No shared events</p>
            ) : (
              <div className="space-y-4">
                {sharedDates.map(date => (
                  <div key={date}>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                      {dayLabel(date)}
                    </p>
                    <div className="space-y-1.5">
                      {sharedByDate[date].map(ev => (
                        <div key={ev.id} className="flex items-start gap-2 text-sm">
                          <span className={cn(
                            'mt-1.5 w-1.5 h-1.5 rounded-full shrink-0',
                            ev.booking_status === 'confirmed' ? 'bg-emerald-500'
                              : ev.booking_status === 'in_progress' ? 'bg-amber-400'
                              : 'bg-gray-300'
                          )} />
                          <span className="text-gray-700">{ev.title}</span>
                          {ev.start_time && (
                            <span className="text-gray-400 text-xs ml-auto shrink-0">{formatTime(ev.start_time)}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Sub-trip cards */}
          {subTrips.map(sub => {
            const subGuests = guests.filter(g => g.trip_id === sub.id)
            const subEvents = events.filter(e => e.trip_id === sub.id)
            const openItems = subEvents.filter(e => e.booking_status === 'needed' || e.booking_status === 'in_progress')

            return (
              <Card key={sub.id} icon={Users} title={sub.name} iconColor="text-gray-400">
                <div className="space-y-2">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1.5">
                      <Users size={13} className="text-gray-400" />
                      {subGuests.length} guests
                    </span>
                    {openItems.length > 0 && (
                      <span className="flex items-center gap-1.5 text-amber-600">
                        <AlertCircle size={13} />
                        {openItems.length} open items
                      </span>
                    )}
                    {openItems.length === 0 && subEvents.length > 0 && (
                      <span className="flex items-center gap-1.5 text-emerald-600">
                        <CheckCircle size={13} />
                        Agenda confirmed
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    {dayLabel(sub.start_date)} – {dayLabel(sub.end_date)}
                  </div>
                  <Link
                    href={`/trips/${sub.id}/overview`}
                    className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 font-medium mt-1"
                  >
                    View <ArrowRight size={13} />
                  </Link>
                </div>
              </Card>
            )
          })}

        </div>
      </div>
    </div>
  )
}

function Card({ icon: Icon, title, iconColor, children, fullWidth }: {
  icon: React.ElementType
  title: string
  iconColor: string
  children: React.ReactNode
  fullWidth?: boolean
}) {
  return (
    <div className={cn('bg-white border border-gray-200 rounded-xl p-5', fullWidth && 'w-full')}>
      <div className="flex items-center gap-2 mb-4">
        <Icon size={16} className={iconColor} />
        <h2 className="font-semibold text-gray-800 text-sm">{title}</h2>
      </div>
      {children}
    </div>
  )
}
