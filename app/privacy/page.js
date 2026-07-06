export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#070b14] text-white py-20 px-4">
      <div className="max-w-2xl mx-auto prose prose-invert">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-slate-400 mb-4">Last updated: July 2026</p>

        <h2 className="text-xl font-semibold mt-8 mb-3">1. Information We Collect</h2>
        <p className="text-slate-300 mb-4">
          We collect your email, display name, education level, skills, interests, location, 
          and career preferences when you create an account. We also store your conversation 
          history with our AI career coach to provide personalized guidance.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-3">2. How We Use Your Information</h2>
        <p className="text-slate-300 mb-4">
          Your data is used solely to personalize your career guidance experience. 
          Your conversations are processed by AI models (Google Gemini, Groq) to generate 
          career recommendations and reports. We do not sell your data to third parties.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-3">3. AI Processing</h2>
        <p className="text-slate-300 mb-4">
          Your answers are sent to AI providers (Google Gemini API, Groq API) for processing. 
          These providers may process data on servers outside Pakistan. 
          By using CareerMate, you consent to this processing.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-3">4. Data Storage</h2>
        <p className="text-slate-300 mb-4">
          Your data is stored securely on Supabase servers. We retain your profile, 
          conversation history, and career reports until you delete your account.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-3">5. Your Rights</h2>
        <p className="text-slate-300 mb-4">
          You can request deletion of your data at any time by contacting us. 
          You can also export your data upon request.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-3">6. Cookies</h2>
        <p className="text-slate-300 mb-4">
          We use essential cookies for authentication. No tracking cookies are used.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-3">7. Contact</h2>
        <p className="text-slate-300 mb-4">
          For privacy concerns, contact us at: hanzala.javed.dev@gmail.com
        </p>
      </div>
    </div>
  )
}