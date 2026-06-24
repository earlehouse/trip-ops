'use client'
import { useState, useRef, useId, useEffect } from 'react'
import { Trash2, UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import { upsertTraveler, deleteTraveler } from '@/app/trips/travelers/actions'

export type Traveler = {
  id: string
  name: string
  marriott_loyalty: string | null
  hilton_loyalty: string | null
  dietary_restrictions: string | null
}

type EditRow = Traveler & { isNew?: boolean }

export function TravelersDirectory({ travelers: initialTravelers }: { travelers: Traveler[] }) {
  const { toast } = useToast()
  const [travelers, setTravelers] = useState<Traveler[]>(initialTravelers)
  const [newRow, setNewRow] = useState<EditRow | null>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const newRowId = useId()

  function handleAddTraveler() {
    const draft: EditRow = {
      id: newRowId,
      name: '',
      marriott_loyalty: null,
      hilton_loyalty: null,
      dietary_restrictions: null,
      isNew: true,
    }
    setNewRow(draft)
    // Focus name input after render
    setTimeout(() => nameInputRef.current?.focus(), 0)
  }

  async function handleSaveNew() {
    if (!newRow || !newRow.name.trim()) {
      toast('Name is required', 'error')
      nameInputRef.current?.focus()
      return
    }

    const draft = {
      name: newRow.name.trim(),
      marriott_loyalty: newRow.marriott_loyalty?.trim() || null,
      hilton_loyalty: newRow.hilton_loyalty?.trim() || null,
      dietary_restrictions: newRow.dietary_restrictions?.trim() || null,
    }

    // Optimistic: add a placeholder
    const tempId = `temp-${Date.now()}`
    const optimistic: Traveler = { id: tempId, ...draft }
    setTravelers(prev => [optimistic, ...prev])
    setNewRow(null)

    try {
      await upsertTraveler(draft)
      toast('Traveler added')
    } catch {
      // Roll back
      setTravelers(prev => prev.filter(t => t.id !== tempId))
      toast('Failed to save traveler', 'error')
    }
  }

  function handleCancelNew() {
    setNewRow(null)
  }

  async function handleFieldBlur(
    traveler: Traveler,
    field: keyof Omit<Traveler, 'id'>,
    value: string
  ) {
    const trimmed = value.trim() || null
    const prev = traveler[field]

    // No change
    if ((trimmed ?? '') === (prev ?? '')) return

    // Name required
    if (field === 'name' && !trimmed) {
      toast('Name cannot be empty', 'error')
      return
    }

    // Optimistic update
    setTravelers(rows =>
      rows.map(r => r.id === traveler.id ? { ...r, [field]: field === 'name' ? (trimmed ?? r.name) : trimmed } : r)
    )

    try {
      await upsertTraveler({
        id: traveler.id,
        name: field === 'name' ? (trimmed ?? traveler.name) : traveler.name,
        marriott_loyalty: field === 'marriott_loyalty' ? trimmed : traveler.marriott_loyalty,
        hilton_loyalty: field === 'hilton_loyalty' ? trimmed : traveler.hilton_loyalty,
        dietary_restrictions: field === 'dietary_restrictions' ? trimmed : traveler.dietary_restrictions,
      })
    } catch {
      // Roll back
      setTravelers(rows =>
        rows.map(r => r.id === traveler.id ? { ...r, [field]: prev } : r)
      )
      toast('Failed to save', 'error')
    }
  }

  async function handleDelete(traveler: Traveler) {
    if (!confirm(`Delete "${traveler.name}"? This cannot be undone.`)) return

    // Optimistic remove
    setTravelers(prev => prev.filter(t => t.id !== traveler.id))

    try {
      await deleteTraveler(traveler.id)
      toast('Traveler deleted')
    } catch {
      // Roll back
      setTravelers(prev => {
        const sorted = [...prev, traveler].sort((a, b) => a.name.localeCompare(b.name))
        return sorted
      })
      toast('Failed to delete', 'error')
    }
  }

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-200 bg-white shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Travelers</h1>
          <p className="text-sm text-gray-400 mt-0.5">Loyalty numbers and profiles</p>
        </div>
        <button
          onClick={handleAddTraveler}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          <UserPlus size={15} />
          Add Traveler
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {travelers.length === 0 && !newRow ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400 text-sm gap-2">
            <UserPlus size={32} className="text-gray-300" />
            <p>No travelers yet — add one to get started</p>
          </div>
        ) : (
          <table className="min-w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-48">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-44">Marriott #</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-44">Hilton #</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Dietary Restrictions</th>
                <th className="px-4 py-3 w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {/* New row at top */}
              {newRow && (
                <NewTravelerRow
                  row={newRow}
                  nameInputRef={nameInputRef}
                  onChange={setNewRow}
                  onSave={handleSaveNew}
                  onCancel={handleCancelNew}
                />
              )}
              {travelers.map(traveler => (
                <TravelerRow
                  key={traveler.id}
                  traveler={traveler}
                  onBlur={handleFieldBlur}
                  onDelete={handleDelete}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ── New row being added ──────────────────────────────────────────────────────

function NewTravelerRow({
  row,
  nameInputRef,
  onChange,
  onSave,
  onCancel,
}: {
  row: EditRow
  nameInputRef: React.RefObject<HTMLInputElement | null>
  onChange: (row: EditRow) => void
  onSave: () => void
  onCancel: () => void
}) {
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') onSave()
    if (e.key === 'Escape') onCancel()
  }

  return (
    <tr className="bg-indigo-50/40 align-middle">
      <td className="px-5 py-2">
        <input
          ref={nameInputRef}
          type="text"
          value={row.name}
          onChange={e => onChange({ ...row, name: e.target.value })}
          onKeyDown={handleKeyDown}
          placeholder="Full name"
          className="w-full text-sm text-gray-900 placeholder-gray-400 border border-indigo-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
        />
      </td>
      <td className="px-4 py-2">
        <input
          type="text"
          value={row.marriott_loyalty ?? ''}
          onChange={e => onChange({ ...row, marriott_loyalty: e.target.value || null })}
          onKeyDown={handleKeyDown}
          placeholder="Marriott Bonvoy #"
          className="w-full text-sm text-gray-700 placeholder-gray-400 border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
        />
      </td>
      <td className="px-4 py-2">
        <input
          type="text"
          value={row.hilton_loyalty ?? ''}
          onChange={e => onChange({ ...row, hilton_loyalty: e.target.value || null })}
          onKeyDown={handleKeyDown}
          placeholder="Hilton Honors #"
          className="w-full text-sm text-gray-700 placeholder-gray-400 border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
        />
      </td>
      <td className="px-4 py-2">
        <input
          type="text"
          value={row.dietary_restrictions ?? ''}
          onChange={e => onChange({ ...row, dietary_restrictions: e.target.value || null })}
          onKeyDown={handleKeyDown}
          placeholder="e.g. Vegetarian, no nuts"
          className="w-full text-sm text-gray-700 placeholder-gray-400 border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
        />
      </td>
      <td className="px-4 py-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={onSave}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            Save
          </button>
          <span className="text-gray-300">·</span>
          <button
            onClick={onCancel}
            className="text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </td>
    </tr>
  )
}

// ── Existing traveler row ─────────────────────────────────────────────────────

function TravelerRow({
  traveler,
  onBlur,
  onDelete,
}: {
  traveler: Traveler
  onBlur: (traveler: Traveler, field: keyof Omit<Traveler, 'id'>, value: string) => void
  onDelete: (traveler: Traveler) => void
}) {
  const hasNoNumbers = !traveler.marriott_loyalty && !traveler.hilton_loyalty

  return (
    <tr className="align-middle hover:bg-gray-50/60 group">
      <td className="px-5 py-2">
        <InlineField
          value={traveler.name}
          placeholder="Name"
          className="font-medium text-gray-900"
          onBlur={val => onBlur(traveler, 'name', val)}
        />
      </td>
      <td className="px-4 py-2">
        <InlineField
          value={traveler.marriott_loyalty ?? ''}
          placeholder="—"
          className="text-gray-700 font-mono text-xs"
          onBlur={val => onBlur(traveler, 'marriott_loyalty', val)}
        />
      </td>
      <td className="px-4 py-2">
        <div className="flex items-center gap-2">
          <InlineField
            value={traveler.hilton_loyalty ?? ''}
            placeholder="—"
            className="text-gray-700 font-mono text-xs"
            onBlur={val => onBlur(traveler, 'hilton_loyalty', val)}
          />
          {hasNoNumbers && (
            <span className={cn(
              'shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
              'bg-gray-100 text-gray-400 border border-gray-200'
            )}>
              No numbers yet
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-2">
        <InlineField
          value={traveler.dietary_restrictions ?? ''}
          placeholder="—"
          className="text-gray-700 text-sm"
          onBlur={val => onBlur(traveler, 'dietary_restrictions', val)}
        />
      </td>
      <td className="px-4 py-2">
        <button
          onClick={() => onDelete(traveler)}
          className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all"
          title="Delete traveler"
        >
          <Trash2 size={15} />
        </button>
      </td>
    </tr>
  )
}

// ── Inline editable cell ──────────────────────────────────────────────────────

function InlineField({
  value,
  placeholder,
  className,
  onBlur,
}: {
  value: string
  placeholder: string
  className?: string
  onBlur: (val: string) => void
}) {
  const [localValue, setLocalValue] = useState(value)
  const [editing, setEditing] = useState(false)

  // Sync when parent value changes (e.g. optimistic rollback)
  useEffect(() => {
    if (!editing) setLocalValue(value)
  }, [value, editing])

  function handleBlur() {
    setEditing(false)
    onBlur(localValue)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === 'Escape') {
      e.currentTarget.blur()
    }
  }

  if (editing) {
    return (
      <input
        autoFocus
        type="text"
        value={localValue}
        onChange={e => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={cn(
          'w-full border border-indigo-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white text-sm',
          className
        )}
      />
    )
  }

  return (
    <button
      onClick={() => {
        setLocalValue(value)
        setEditing(true)
      }}
      className={cn(
        'w-full text-left rounded px-2 py-1 text-sm hover:bg-indigo-50 hover:text-indigo-800 transition-colors cursor-text',
        value ? className : 'text-gray-300 italic'
      )}
    >
      {value || placeholder}
    </button>
  )
}
