import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (username.length < 3 || username.length > 30) {
      return setError('Username must be 3-30 characters')
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return setError('Username can only contain letters, numbers, and underscores')
    }
    if (password.length < 6) {
      return setError('Password must be at least 6 characters')
    }
    if (password !== confirmPassword) {
      return setError('Passwords do not match')
    }

    setSubmitting(true)
    try {
      await register(username, email, password)
      navigate('/sessions')
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6 text-center" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
        Create Account
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4 bg-[#112240] border border-[#1e3a5f] rounded-lg p-6">
        <div>
          <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5">Username</label>
          <input
            type="text"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            placeholder="surfer_joe"
            className="w-full px-3 py-2.5 bg-[#0d1f3c] border border-[#1e3a5f] rounded-lg text-white focus:border-[#4a9eed] focus:outline-none"
          />
        </div>

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
            placeholder="6+ characters"
            className="w-full px-3 py-2.5 bg-[#0d1f3c] border border-[#1e3a5f] rounded-lg text-white focus:border-[#4a9eed] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5">Confirm Password</label>
          <input
            type="password"
            name="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
          {submitting ? 'Creating account...' : 'Create Account'}
        </button>

        <p className="text-sm text-white/50 text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-[#4a9eed] hover:underline">Log in</Link>
        </p>
      </form>
    </div>
  )
}
