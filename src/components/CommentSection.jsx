import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { timeAgo } from '../utils/formatting'

export default function CommentSection({ sessionId, onCountChange }) {
  const { user, authHeaders } = useAuth()
  const [comments, setComments] = useState([])
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/sessions/${sessionId}/comments`)
      .then(res => res.json())
      .then(data => { setComments(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [sessionId])

  function handleSubmit(e) {
    e.preventDefault()
    if (!body.trim()) return
    fetch(`/api/sessions/${sessionId}/comments`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ body: body.trim() }),
    })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(comment => {
        const updated = [...comments, comment]
        setComments(updated)
        setBody('')
        onCountChange?.(updated.length)
      })
      .catch(() => {})
  }

  function handleDelete(commentId) {
    fetch(`/api/comments/${commentId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
      .then(res => {
        if (res.ok) {
          const updated = comments.filter(c => c.id !== commentId)
          setComments(updated)
          onCountChange?.(updated.length)
        }
      })
  }

  return (
    <div className="mt-3 border-t border-[#1e3a5f] pt-3">
      {loading ? (
        <p className="text-xs text-white/40">Loading comments...</p>
      ) : (
        <div className="space-y-2">
          {comments.map(c => (
            <div key={c.id} className="bg-[#0d1f3c] border border-[#1e3a5f] rounded px-3 py-2">
              <div className="flex items-center gap-2 mb-1">
                <Link to={`/athlete/${c.username}`} className="text-xs font-medium text-[#c084fc] hover:text-[#d4a5ff]">
                  {c.username}
                </Link>
                <span className="text-xs text-white/40">{timeAgo(c.created_at)}</span>
                {user && user.id === c.user_id && (
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="ml-auto text-xs text-white/30 hover:text-red-400 transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
              <p className="text-sm text-white/80">{c.body}</p>
            </div>
          ))}
        </div>
      )}

      {user ? (
        <form onSubmit={handleSubmit} className="flex gap-2 mt-2">
          <input
            type="text"
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Add a comment..."
            maxLength={500}
            className="flex-1 bg-[#0d1f3c] border border-[#1e3a5f] rounded px-3 py-1.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#4a9eed]"
          />
          <button
            type="submit"
            disabled={!body.trim()}
            className="px-3 py-1.5 bg-[#1976D2] text-white rounded text-sm font-medium hover:bg-[#1565C0] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Post
          </button>
        </form>
      ) : (
        <p className="text-xs text-white/40 mt-2">
          <Link to="/login" className="text-[#4a9eed] hover:underline">Log in</Link> to comment
        </p>
      )}
    </div>
  )
}
