export async function GET() {
    try {
        const apiKey = process.env.GEMINI_API_KEY

        if (!apiKey) {
            return Response.json({
                error: 'GEMINI_API_KEY is not set'
            }, { status: 500 })
        }

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
            { method: 'GET' }
        )

        const data = await response.json()

        // Filter models that support generateContent
        const generativeModels = data.models?.filter(
            model => model.supportedGenerationMethods?.includes('generateContent')
        ) || []

        return Response.json({
            allModelNames: data.models?.map(m => m.name) || [],
            generativeModelNames: generativeModels.map(m => m.name),
            totalModels: data.models?.length || 0
        })
    } catch (error) {
        return Response.json({
            error: error.message
        }, { status: 500 })
    }
}