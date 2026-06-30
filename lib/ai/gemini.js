export async function fetchGemini(promptOrMessages, options = {}) {
    // Try Groq first, fall back to Gemini
    try {
        return await tryGroq(promptOrMessages, options)
    } catch (groqError) {
        console.log('🔄 Groq failed, switching to Gemini...')
        try {
            return await tryGemini(promptOrMessages, options)
        } catch (geminiError) {
            throw new Error('Both Groq and Gemini are unavailable. Please try again later.')
        }
    }
}

async function tryGroq(promptOrMessages, options = {}) {
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
        throw new Error('Groq API key not configured')
    }

    // Convert messages array to a single prompt string if needed
    let fullPrompt
    if (Array.isArray(promptOrMessages)) {
        fullPrompt = promptOrMessages.map(m =>
            `${m.role === 'system' ? 'System' : m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
        ).join('\n') + '\nAssistant: '
    } else {
        fullPrompt = promptOrMessages
    }

    const maxTokens = options.maxTokens || 500

    // Rate limiting for Groq
    await new Promise(resolve => setTimeout(resolve, 8000))

    // Models to try in order
 const modelsToTry = [
    'llama-3.1-8b-instant',
    'llama-3.3-70b-versatile',
    'mixtral-8x7b-32768',
    'gemma2-9b-it'
]

    let lastError = null

    for (const modelName of modelsToTry) {
        for (let attempt = 1; attempt <= 2; attempt++) {
            try {
                console.log(`🔄 Groq: Trying ${modelName} (attempt ${attempt}/2)...`)

                const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: modelName,
                        messages: [{ role: 'user', content: fullPrompt }],
                        max_tokens: maxTokens,
                        temperature: 0.7
                    })
                })

                const data = await response.json()

                if (response.ok && data.choices?.[0]?.message?.content) {
                    console.log(`✅ Groq success with ${modelName}!`)
                    return data.choices[0].message.content
                }

                // If rate limited, wait and retry
                if (data.error?.message?.includes('rate_limit') ||
                    data.error?.message?.includes('Rate limit')) {
                    const waitTime = attempt * 10
                    console.log(`⏳ Groq ${modelName} rate limited, waiting ${waitTime}s...`)
                    await new Promise(resolve => setTimeout(resolve, waitTime * 1000))
                    continue
                }

                // If model overloaded, try next
                if (data.error?.message?.includes('overloaded') ||
                    data.error?.message?.includes('capacity')) {
                    console.log(`⚠️ Groq ${modelName} overloaded, trying next model...`)
                    break
                }

                // If model not found or not authorized, skip
                if (data.error?.message?.includes('not found') ||
                    data.error?.message?.includes('not authorized') ||
                    data.error?.message?.includes('deprecated')) {
                    console.log(`❌ Groq ${modelName} unavailable, trying next model...`)
                    break
                }

                console.log(`⚠️ Groq ${modelName} error:`, data.error?.message)
                lastError = data.error?.message
                break

            } catch (error) {
                console.log(`❌ Groq ${modelName} request failed:`, error.message)
                lastError = error.message
                break
            }
        }
    }

    throw new Error(lastError || 'All Groq models are currently unavailable.')
}

async function tryGemini(promptOrMessages, options = {}) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
        throw new Error('Gemini API key not configured')
    }

    // Convert messages array to a single prompt string if needed
    let fullPrompt
    if (Array.isArray(promptOrMessages)) {
        fullPrompt = promptOrMessages.map(m =>
            `${m.role === 'system' ? 'System' : m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
        ).join('\n') + '\nAssistant: '
    } else {
        fullPrompt = promptOrMessages
    }

    // Models to try (in order of preference)
    const modelsToTry = [
        'gemini-2.5-flash',
        'gemini-3.5-flash',
        'gemini-2.0-flash',
        'gemini-flash-latest',
        'gemini-2.5-flash-lite'
    ]

    const maxTokens = options.maxTokens || 500

    let lastError = null

    for (const modelName of modelsToTry) {
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                console.log(`🔄 Gemini: Trying ${modelName} (attempt ${attempt}/3)...`)

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
                                maxOutputTokens: maxTokens,
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

                    console.log(`✅ Gemini success with ${modelName}!`)
                    return aiResponse
                }

                // Check for quota exceeded - throw immediately to stop trying Gemini
                if (data.error?.message?.includes('quota') ||
                    data.error?.message?.includes('exceeded')) {
                    console.log(`⚠️ ${modelName} quota exceeded`)
                    throw new Error('QUOTA_EXCEEDED')
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
                if (error.message === 'QUOTA_EXCEEDED') throw error
                console.log(`❌ ${modelName} request failed:`, error.message)
                lastError = error.message
                break
            }
        }
    }

    throw new Error(lastError || 'All Gemini models are currently busy or unavailable.')
}