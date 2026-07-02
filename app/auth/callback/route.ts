import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const requestedNext = searchParams.get('next') ?? '/dashboard'
    const next = requestedNext.startsWith('/') && !requestedNext.startsWith('//') ? requestedNext : '/dashboard'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            return NextResponse.redirect(new URL(next, origin))
        }
    }

    // Check for existing error params from Supabase
    const errorCode = searchParams.get('error')
    const errorDesc = searchParams.get('error_description')

    if (errorCode) {
        const target = new URL('/auth/auth-code-error', origin)
        target.searchParams.set('error', errorCode)
        if (errorDesc) target.searchParams.set('message', errorDesc)
        return NextResponse.redirect(target)
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=missing_code`)
}
