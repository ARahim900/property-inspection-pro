import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  // For demo purposes, we'll skip Supabase authentication and allow all requests
  // In a production app, you would use proper Supabase client creation and authentication

  // Simply return NextResponse.next() to allow all requests through
  return NextResponse.next({
    request,
  })
}
