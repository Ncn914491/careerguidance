import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use admin client for user management
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export async function POST(request: NextRequest) {
    try {
        // Only allow in development
        if (process.env.NODE_ENV === 'production') {
            return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
        }

        const { email, password, fullName } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        // Create admin user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            user_metadata: {
                full_name: fullName || 'Admin User'
            },
            email_confirm: true // Auto-confirm email
        });

        if (authError) {
            console.error('Error creating admin user:', authError);
            return NextResponse.json({ error: authError.message }, { status: 500 });
        }

        if (!authData.user) {
            return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
        }

        // Create/update profile with admin role
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: authData.user.id,
                email: authData.user.email!,
                full_name: fullName || 'Admin User',
                role: 'admin'
            });

        if (profileError) {
            console.error('Error creating admin profile:', profileError);
            return NextResponse.json({ error: 'Failed to create admin profile' }, { status: 500 });
        }

        return NextResponse.json({
            message: 'Admin user created successfully',
            user: {
                id: authData.user.id,
                email: authData.user.email,
                role: 'admin'
            }
        });
    } catch (error) {
        console.error('Create admin API error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}