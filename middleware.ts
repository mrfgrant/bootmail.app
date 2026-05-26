import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Pass through everything — auth handled per-page
  return NextResponse.next()
}

export const config = {
  matcher: [],
}
