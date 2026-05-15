export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      trips: {
        Row: {
          id: string
          name: string
          office_location: string
          start_date: string
          end_date: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['trips']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['trips']['Insert']>
      }
      teams: {
        Row: {
          id: string
          trip_id: string
          name: string
          headcount: number
          color: string
        }
        Insert: Omit<Database['public']['Tables']['teams']['Row'], 'id'> & { id?: string }
        Update: Partial<Database['public']['Tables']['teams']['Insert']>
      }
      guests: {
        Row: {
          id: string
          trip_id: string
          team_id: string | null
          name: string
          arrival_date: string | null
          arrival_time: string | null
          arrival_flight: string | null
          departure_date: string | null
          departure_time: string | null
          departure_flight: string | null
          transport_mode: string | null
          special_requests: string | null
          bonvoy_number: string | null
          notes: string | null
        }
        Insert: Omit<Database['public']['Tables']['guests']['Row'], 'id'> & { id?: string }
        Update: Partial<Database['public']['Tables']['guests']['Insert']>
      }
      events: {
        Row: {
          id: string
          trip_id: string
          title: string
          date: string
          start_time: string | null
          end_time: string | null
          is_fuzzy_time: boolean
          applies_to_all_teams: boolean
          booking_status: string
          venue: string | null
          headcount: number | null
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['events']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['events']['Insert']>
      }
      event_teams: {
        Row: {
          id: string
          event_id: string
          team_id: string
        }
        Insert: Omit<Database['public']['Tables']['event_teams']['Row'], 'id'> & { id?: string }
        Update: Partial<Database['public']['Tables']['event_teams']['Insert']>
      }
      bookings: {
        Row: {
          id: string
          event_id: string
          type: string
          status: string
          vendor: string | null
          confirmation_number: string | null
          headcount: number | null
          notes: string | null
        }
        Insert: Omit<Database['public']['Tables']['bookings']['Row'], 'id'> & { id?: string }
        Update: Partial<Database['public']['Tables']['bookings']['Insert']>
      }
    }
  }
}

// Convenience types
export type Trip = Database['public']['Tables']['trips']['Row']
export type Team = Database['public']['Tables']['teams']['Row']
export type Guest = Database['public']['Tables']['guests']['Row']
export type Event = Database['public']['Tables']['events']['Row']
export type EventTeam = Database['public']['Tables']['event_teams']['Row']
export type Booking = Database['public']['Tables']['bookings']['Row']

export type EventWithTeams = Event & { teams: Team[] }
export type GuestWithTeam = Guest & { team: Team | null }
export type TripWithTeams = Trip & { teams: Team[] }
