// Mock Supabase client for demo purposes
// In a production app, you would use the real @supabase/ssr package

interface MockQueryBuilder {
  select: (columns?: string) => MockQueryBuilder
  insert: (data: any) => MockQueryBuilder
  update: (data: any) => MockQueryBuilder
  delete: () => MockQueryBuilder
  eq: (column: string, value: any) => MockQueryBuilder
  order: (column: string, options?: { ascending: boolean }) => MockQueryBuilder
  single: () => Promise<{ data: any; error: any }>
  then: (resolve: (result: { data: any; error: any }) => void) => Promise<{ data: any; error: any }>
}

interface MockSupabaseClient {
  auth: {
    signInWithPassword: (credentials: { email: string; password: string }) => Promise<{ data: any; error: any }>
    signUp: (credentials: { email: string; password: string; options?: any }) => Promise<{ data: any; error: any }>
    signOut: () => Promise<{ error: any }>
    getUser: () => Promise<{ data: { user: any }; error: any }>
  }
  from: (table: string) => MockQueryBuilder
}

export function createClient(): MockSupabaseClient {
  const createQueryBuilder = (table: string): MockQueryBuilder => {
    let operation = "select"
    let data: any = null
    let columns = "*"
    const filters: Array<{ column: string; value: any }> = []
    let orderBy: { column: string; ascending: boolean } | null = null

    const builder: MockQueryBuilder = {
      select: (cols?: string) => {
        operation = "select"
        columns = cols || "*"
        return builder
      },
      insert: (insertData: any) => {
        operation = "insert"
        data = insertData
        return builder
      },
      update: (updateData: any) => {
        operation = "update"
        data = updateData
        return builder
      },
      delete: () => {
        operation = "delete"
        return builder
      },
      eq: (column: string, value: any) => {
        filters.push({ column, value })
        return builder
      },
      order: (column: string, options?: { ascending: boolean }) => {
        orderBy = { column, ascending: options?.ascending ?? true }
        return builder
      },
      single: async () => {
        const result = await builder.then((res) => res)
        if (result.data && Array.isArray(result.data) && result.data.length > 0) {
          return { data: result.data[0], error: null }
        }
        return { data: null, error: null }
      },
      then: async (resolve) => {
        // Mock implementation - in a real app this would query the database
        let result = { data: null as any, error: null }

        switch (operation) {
          case "select":
            // Return empty array for demo - in real app this would query the database
            result = { data: [], error: null }
            break
          case "insert":
            // Return the inserted data with an ID for demo
            result = { data: { ...data, id: data.id || Math.random().toString(36).substr(2, 9) }, error: null }
            break
          case "update":
            result = { data: data, error: null }
            break
          case "delete":
            result = { data: null, error: null }
            break
        }

        resolve(result)
        return result
      },
    }

    return builder
  }

  return {
    auth: {
      signInWithPassword: async (credentials) => {
        // Mock successful login for demo
        return {
          data: { user: { id: "1", email: credentials.email } },
          error: null,
        }
      },
      signUp: async (credentials) => {
        // Mock successful signup for demo
        return {
          data: { user: { id: "1", email: credentials.email } },
          error: null,
        }
      },
      signOut: async () => {
        return { error: null }
      },
      getUser: async () => {
        // Mock user for demo
        return {
          data: { user: { id: "1", email: "demo@example.com" } },
          error: null,
        }
      },
    },
    from: createQueryBuilder,
  }
}
