'use client'

export default function GlobalError({ error, reset }) {
  return (
    <html>
      <body className="bg-[#070b14]">
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">⚠️</span>
            </div>
            <h1 className="text-white text-2xl font-bold mb-2">Critical Error</h1>
            <p className="text-slate-400 text-sm mb-6">
              The application encountered a critical error. Please refresh the page.
            </p>
            <button
              onClick={reset}
              className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition text-sm font-medium"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}