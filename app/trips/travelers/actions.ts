'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function upsertTraveler(data: {
  id?: string
  name: string
  marriott_loyalty: string | null
  hilton_loyalty: string | null
  dietary_restrictions: string | null
}) {
  const supabase = await createClient()

  if (data.id) {
    const { error } = await supabase
      .from('travelers')
      .update({
        name: data.name,
        marriott_loyalty: data.marriott_loyalty,
        hilton_loyalty: data.hilton_loyalty,
        dietary_restrictions: data.dietary_restrictions,
      })
      .eq('id', data.id)
    if (error) throw new Error(error.message)
  } else {
    // Use upsert on name so adding a traveler that already exists merges instead of duplicating
    const { error } = await supabase
      .from('travelers')
      .upsert(
        {
          name: data.name,
          marriott_loyalty: data.marriott_loyalty,
          hilton_loyalty: data.hilton_loyalty,
          dietary_restrictions: data.dietary_restrictions,
        },
        { onConflict: 'lower(trim(name))' }
      )
    if (error) throw new Error(error.message)
  }

  revalidatePath('/trips/travelers')
}

export async function deleteTraveler(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('travelers').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/trips/travelers')
}
