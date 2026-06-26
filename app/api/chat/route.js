export async function POST(request) {
    try {
        const { messages, profile } = await request.json()

        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) {
            return new Response(
                JSON.stringify({ error: 'Gemini API key not configured' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            )
        }

        if (!messages || messages.length === 0) {
            return new Response(
                JSON.stringify({ error: 'No messages provided' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            )
        }

        // In app/api/chat/route.js — update the systemPrompt

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

        const conversationHistory = messages.map(m =>
            `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
        ).join('\n')

        const fullPrompt = `
${systemPrompt}

Conversation history:
${conversationHistory}

Assistant: 
`

        // Models to try (in order of preference)
        const modelsToTry = [
            'gemini-3.5-flash',
            'gemini-2.0-flash',
            'gemini-2.5-flash',
            'gemini-flash-latest',
            'gemini-2.5-flash-lite'
        ]

        let lastError = null

        for (const modelName of modelsToTry) {
            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    console.log(`🔄 Trying ${modelName} (attempt ${attempt}/3)...`)

                    const response = await fetch(
                        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                contents: [
                                    {
                                        parts: [{ text: fullPrompt }]
                                    }
                                ],
                                generationConfig: {
                                    temperature: 0.7,
                                    maxOutputTokens: 500,  // ✅ INCREASED TO 1000
                                    topP: 0.8,
                                    topK: 40
                                }
                            })
                        }
                    )

                    const data = await response.json()

                    if (response.ok) {
                        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text ||
                            'Sorry, I could not generate a response.'

                        console.log(`✅ Success with ${modelName}!`)
                        return new Response(
                            JSON.stringify({ response: aiResponse }),
                            { status: 200, headers: { 'Content-Type': 'application/json' } }
                        )
                    }

                    if (data.error?.message?.includes('high demand') ||
                        data.error?.message?.includes('overloaded') ||
                        data.error?.message?.includes('rate limit')) {

                        const waitTime = attempt * 2
                        console.log(`⏳ ${modelName} busy, waiting ${waitTime}s...`)
                        await new Promise(resolve => setTimeout(resolve, waitTime * 1000))
                        continue
                    }

                    if (data.error?.message?.includes('not found')) {
                        console.log(`❌ ${modelName} not found, trying next...`)
                        break
                    }

                    if (data.error?.message?.includes('denied access') ||
                        data.error?.message?.includes('permission')) {
                        console.error(`🚫 ${modelName} denied access! Trying next...`)
                        break
                    }

                    console.log(`⚠️ ${modelName} error:`, data.error?.message)
                    lastError = data.error?.message
                    break

                } catch (error) {
                    console.log(`❌ ${modelName} request failed:`, error.message)
                    lastError = error.message
                    break
                }
            }
        }

        return new Response(
            JSON.stringify({
                error: lastError || 'All models are currently busy or unavailable. Please try again later.'
            }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
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