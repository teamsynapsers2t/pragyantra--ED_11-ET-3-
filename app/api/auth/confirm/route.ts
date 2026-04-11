import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest } from 'next/server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/onboarding'

  const supabase = await createClient()

  // 1. If PKCE flow is enabled, exchange the code for a session
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      redirect(next)
    }
  }

  // 2. If standard Hash flow is enabled, verify the OTP
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    if (!error) {
      redirect(next)
    }
  }

  // redirect the user to an error page with some instructions
  redirect('/sign-in?message=Authentication+Error.+Please+try+signing+in+again.')
}
