import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await login(email, password)
      navigate('/sessions')
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6 text-center" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
        Log In
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4 bg-[#112240] border border-[#1e3a5f] rounded-lg p-6">
        <div>
          <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5">Email</label>
          <input
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2.5 bg-[#0d1f3c] border border-[#1e3a5f] rounded-lg text-white focus:border-[#4a9eed] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5">Password</label>
          <input
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2.5 bg-[#0d1f3c] border border-[#1e3a5f] rounded-lg text-white focus:border-[#4a9eed] focus:outline-none"
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full px-5 py-3 bg-[#1976D2] text-white rounded-lg font-medium hover:bg-[#1565C0] transition-colors disabled:opacity-50"
        >
          {submitting ? 'Logging in...' : 'Log In'}
        </button>

        <p className="text-sm text-white/50 text-center">
          Don't have an account?{' '}
          <Link to="/register" className="text-[#4a9eed] hover:underline">Sign up</Link>
        </p>
      </form>
    </div>
  )
}
