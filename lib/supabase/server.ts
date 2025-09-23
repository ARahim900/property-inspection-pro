// Mock Supabase server client for demo purposes
// In a production app, you would use the real @supabase/ssr package

interface MockSupabaseClient {
  auth: {
    getUser: () => Promise<{ data: { user: any }; error: any }>
  }
  from: (table: string) => {
    select: (columns?: string) => Promise<{ data: any[]; error: any }>
    insert: (data: any) => Promise<{ data: any; error: any }>
    update: (data: any) => Promise<{ data: any; error: any }>
    delete: () => Promise<{ data: any; error: any }>
  }
}

export async function createClient(): Promise<MockSupabaseClient> {
  return {
    auth: {
      getUser: async () => {
        // Mock user for demo
        return {
          data: { user: { id: "1", email: "demo@example.com" } },
          error: null,
        }
      },
    },
    from: (table: string) => ({
      select: async (columns?: string) => {
        // Mock data for demo
        return { data: [], error: null }
      },
      insert: async (data: any) => {
        return { data: data, error: null }
      },
      update: async (data: any) => {
        return { data: data, error: null }
      },
      delete: async () => {
        return { data: null, error: null }
      },
    }),
  }
}
