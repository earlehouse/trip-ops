export const PREP_TASKS = [
  { key: 'supplies_order',    label: 'Check supplies & make order',          daysBeforeTrip: 7    },
  { key: 'pantry_order',      label: 'Check kitchen & order pantry items',   daysBeforeTrip: 4    },
  { key: 'butterfly_codes',   label: 'Issue Butterfly access codes',         daysBeforeTrip: 3    },
  { key: 'butterfly_reminder',label: 'Send Butterfly access code reminder',  daysBeforeTrip: 1    },
  { key: 'special_requests',  label: 'Special requests handled',             daysBeforeTrip: null },
  { key: 'feedback_form',     label: 'Send feedback form',                   daysBeforeTrip: null },
] as const

export type PrepTaskKey = typeof PREP_TASKS[number]['key']
