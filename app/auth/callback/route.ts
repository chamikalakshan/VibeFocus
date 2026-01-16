import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/dashboard'

    console.log('Auth callback hit. Code present:', !!code)

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            console.log('Session exchange successful')
            const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
            const isLocalEnv = process.env.NODE_ENV === 'development'
            if (isLocalEnv) {
                return NextResponse.redirect(`${origin}${next}`)
            } else if (forwardedHost) {
                return NextResponse.redirect(`https://${forwardedHost}${next}`)
            } else {
                return NextResponse.redirect(`${origin}${next}`)
            }
        } else {
            console.error('Auth callback error during exchange:', error)
        }
    } else {
        console.error('Auth callback missing code param')
    }

    // Check for existing error params from Supabase
    const errorCode = searchParams.get('error')
    const errorDesc = searchParams.get('error_description')

    if (errorCode) {
        console.error('Auth callback received error from Supabase:', errorCode, errorDesc)
        return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${errorCode}&message=${errorDesc}`)
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=missing_code`)
}
