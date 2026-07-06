import { Mail, MessageCircle } from 'lucide-react'

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#070b14] text-white py-20 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-3xl font-bold mb-4">Contact Us</h1>
        <p className="text-slate-400 mb-12 max-w-md mx-auto">
          Have questions, feedback, or need help? We'd love to hear from you.
        </p>

        <div className="grid gap-6 max-w-md mx-auto">
          {/* Email */}
          <a href="mailto:hanzala78616@gmail.com" 
            className="flex items-center gap-4 p-5 bg-white/[0.02] border border-white/[0.06] rounded-2xl hover:bg-white/[0.04] hover:border-white/[0.1] transition-all group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/20 transition">
              <Mail className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="text-left">
              <p className="text-white font-semibold text-sm">Email</p>
              <p className="text-slate-400 text-sm">hanzala7816@gmail.com</p>
            </div>
          </a>

          {/* WhatsApp */}
          <a href="https://wa.me/923465242781" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-4 p-5 bg-white/[0.02] border border-white/[0.06] rounded-2xl hover:bg-white/[0.04] hover:border-white/[0.1] transition-all group">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-green-500/20 transition">
              <MessageCircle className="w-6 h-6 text-green-400" />
            </div>
            <div className="text-left">
              <p className="text-white font-semibold text-sm">WhatsApp</p>
              <p className="text-slate-400 text-sm">+92 3465242781</p>
            </div>
          </a>
        </div>

        <p className="text-slate-600 text-sm mt-10">
          We typically respond within 24 hours.
        </p>
      </div>
    </div>
  )
}