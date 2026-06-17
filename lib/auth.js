import { createClient } from './supabase/client';

const supabase = createClient();
// In lib/auth.js - registerUser function
export async function registerUser(email, password, displayName) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { display_name: displayName },
            },
        });
        
        if (error) throw error;
        
        if (data.user) {
            // Insert profile WITHOUT referencing any foreign key
            const { error: profileError } = await supabase
                .from('user_profiles')
                .insert({
                    user_id: data.user.id,
                    display_name: displayName,
                    is_complete: false,
                    onboarding_completed: false,
                    onboarding_answers: []
                });
            
            if (profileError) {
                console.error('Profile creation error:', profileError);
                // Don't throw - user can create profile later
            }
        }
        
        return { user: data.user, error: null };
    } catch (error) {
        return { user: null, error: error.message };
    }
}

export async function loginUser(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
        return { user: data.user, error: null };
    } catch (error) {
        return { user: null, error: error.message };
    }
}

export async function getCurrentUser() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    } catch (error) {
        console.error('Error getting user:', error);
        return null;
    }
}

export async function logoutUser() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        return { error: null };
    } catch (error) {
        return { error: error.message };
    }
}

export async function getOrCreateProfile(userId, displayName) {
    try {
        // First try to get existing profile
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle()
        
        if (error) {
            console.error('Error getting profile:', error)
            return { data: null, error }
        }
        
        if (data) {
            console.log('Existing profile found:', data)
            return { data, error: null }
        }
        
        // No profile exists, create one
        console.log('Creating new profile for user:', userId)
        
        const profileData = {
            user_id: userId,
            display_name: displayName || 'User',
            is_complete: false,
            onboarding_completed: false,
            onboarding_answers: []
        }
        
        const { data: newProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert(profileData)
            .select()
            .single()
        
        if (createError) {
            console.error('Error creating profile:', createError)
            return { data: null, error: createError }
        }
        
        console.log('New profile created:', newProfile)
        return { data: newProfile, error: null }
        
    } catch (error) {
        console.error('Unexpected error:', error)
        return { data: null, error: error }
    }
}