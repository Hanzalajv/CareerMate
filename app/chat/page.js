import { fetchGemini } from '@/lib/ai/gemini'

export async function POST(request) {
    try {
        const { messages, profile } = await request.json()

        if (!messages || messages.length === 0) {
            return new Response(
                JSON.stringify({ error: 'No messages provided' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            )
        }

        const systemPrompt = `
You are CareerMate AI, a career coach focused on helping one specific user.

User Profile:
- Name: ${profile?.display_name || 'User'}
- Education: ${profile?.education || 'Not specified'}
- Interests: ${profile?.interests?.join(', ') || 'Not specified'}
- Skills: ${profile?.skills?.join(', ') || 'Not specified'}
- Location: ${profile?.location || 'Not specified'}
- Work Preference: ${profile?.preferences?.work_environment || 'Not specified'}

Onboarding Answers:
${profile?.onboarding_answers?.map(a => `- ${a.question}: ${a.answer}`).join('\n') || 'No onboarding data available'}

Your job:
1. Be warm, encouraging, and personal. Always address the user by name.
2. Give SHORT, specific answers. Maximum 2-3 sentences per response.
3. Focus ONLY on what this user needs based on their profile.
4. DON'T give generic advice or go into debates.
5. If you don't know, say "I'm not sure, but let me help you find out."
6. Keep it conversational — like a friend helping you think through things.

IMPORTANT: Keep responses brief. 2-3 sentences maximum but not always.
`

        const allMessages = [
            { role: 'system', content: systemPrompt },
            ...messages
        ]

        const aiResponse = await fetchGemini(allMessages)

        return new Response(
            JSON.stringify({ response: aiResponse }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Chat API error:', error)
        return new Response(
            JSON.stringify({
                error: error.message || 'Failed to generate response'
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
    }
}