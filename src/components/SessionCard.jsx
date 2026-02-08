import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getRatingByLevel } from '../utils/ratings'
import { useAuth } from '../context/AuthContext'
import CommentSection from './CommentSection'

function formatStartTime(time) {
  if (!time) return ''
  const [h, m] = time.split(':').map(Number)
  if (isNaN(h) || isNaN(m)) return time
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`
}

export default function SessionCard({ session, onDelete, showUser = false }) {
  const { user, authHeaders } = useAuth()
  const [kudos, setKudos] = useState(!!session.user_kudos)
  const [kudosCount, setKudosCount] = useState(session.kudos_count || 0)
  const [commentCount, setCommentCount] = useState(session.comment_count || 0)
  const [showComments, setShowComments] = useState(false)
  const [photos, setPhotos] = useState(session.photos || [])
  const [lightboxPhoto, setLightboxPhoto] = useState(null)

  function handleKudosToggle() {
    if (!user) return
    const method = kudos ? 'DELETE' : 'POST'
    fetch(`/api/sessions/${session.id}/kudos`, {
      method,
      headers: authHeaders(),
    })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        setKudos(data.kudos)
        setKudosCount(data.count)
      })
      .catch(() => {})
  }

  function handlePhotoDelete(photoId) {
    fetch(`/api/sessions/${session.id}/photos/${photoId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(() => {
        setPhotos(prev => prev.filter(p => p.id !== photoId))
        if (lightboxPhoto?.id === photoId) setLightboxPhoto(null)
      })
      .catch(() => {})
  }

  const rating = session.rating ? getRatingByLevel(session.rating) : null
  const dateStr = new Date(session.date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const hours = Math.floor(session.duration / 60)
  const mins = session.duration % 60
  const durationStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`

  return (
    <div className="bg-[#112240] border border-[#1e3a5f] rounded-lg p-4 relative overflow-hidden">
      {rating && (
        <div
          className="absolute top-0 left-0 w-full h-0.5"
          style={{ backgroundColor: rating.color }}
        />
      )}

      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          {showUser && session.username && (
            <Link to={`/athlete/${session.username}`} className="text-xs text-[#c084fc] font-medium hover:text-[#d4a5ff] transition-colors">
              {session.username}
            </Link>
          )}
          <Link
            to={`/spot/${session.spot_id}`}
            className="text-lg font-bold text-white hover:text-[#4a9eed] transition-colors block"
          >
            {session.spot_name}
          </Link>
          <p className="text-sm text-white/60">{dateStr}{session.start_time ? ` at ${formatStartTime(session.start_time)}` : ''}</p>
        </div>
        {rating && (
          <span
            className="flex-shrink-0 px-2 py-0.5 rounded text-xs font-bold text-white"
            style={{ backgroundColor: rating.color }}
          >
            {rating.label}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm mb-2">
        <span className="text-[#7eb8e0]">{durationStr}</span>
        {session.wave_count != null && (
          <span className="text-[#7eb8e0]">{session.wave_count} waves</span>
        )}
        {session.board && (
          <span className="text-white/60">{session.board}</span>
        )}
      </div>

      {session.conditions && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {session.conditions.waveHeight && (
            <span className="px-2 py-0.5 bg-[#0d1f3c] border border-[#1e3a5f] rounded text-xs text-[#7eb8e0]">
              {session.conditions.waveHeight}
            </span>
          )}
          {session.conditions.wind && (
            <span className="px-2 py-0.5 bg-[#0d1f3c] border border-[#1e3a5f] rounded text-xs text-[#7eb8e0]">
              {session.conditions.wind}
            </span>
          )}
          {session.conditions.swellPeriod && (
            <span className="px-2 py-0.5 bg-[#0d1f3c] border border-[#1e3a5f] rounded text-xs text-[#7eb8e0]">
              {session.conditions.swellPeriod}
            </span>
          )}
        </div>
      )}

      {session.notes && (
        <p className="text-sm text-white/70 mb-2">{session.notes}</p>
      )}

      {/* Photo thumbnails */}
      {photos.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {photos.map(photo => (
            <div key={photo.id} className="relative w-20 h-20 rounded-lg overflow-hidden border border-[#1e3a5f] cursor-pointer group">
              <img
                src={photo.url}
                alt=""
                className="w-full h-full object-cover"
                onClick={() => setLightboxPhoto(photo)}
              />
              {user && session.user_id === user.id && (
                <button
                  onClick={(e) => { e.stopPropagation(); handlePhotoDelete(photo.id) }}
                  className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/70 rounded-full text-white text-xs items-center justify-center hover:bg-red-500 transition-colors hidden group-hover:flex"
                >
                  x
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <img src={lightboxPhoto.url} alt="" className="max-w-full max-h-[90vh] rounded-lg object-contain" />
            <button
              onClick={() => setLightboxPhoto(null)}
              className="absolute top-2 right-2 w-8 h-8 bg-black/70 rounded-full text-white text-lg flex items-center justify-center hover:bg-red-500 transition-colors"
            >
              x
            </button>
          </div>
        </div>
      )}

      {/* Social interaction bar */}
      <div className="flex items-center gap-4 text-sm mb-1">
        <button
          onClick={handleKudosToggle}
          className={`flex items-center gap-1 transition-colors ${
            kudos ? 'text-red-400' : 'text-white/40 hover:text-red-400'
          } ${!user ? 'cursor-default' : 'cursor-pointer'}`}
        >
          <span>{kudos ? '♥' : '♡'}</span>
          {kudosCount > 0 && <span>{kudosCount}</span>}
        </button>
        <button
          onClick={() => setShowComments(prev => !prev)}
          className="flex items-center gap-1 text-white/40 hover:text-[#4a9eed] transition-colors"
        >
          <span>💬</span>
          {commentCount > 0 && <span>{commentCount}</span>}
        </button>
      </div>

      {showComments && (
        <CommentSection
          sessionId={session.id}
          onCountChange={setCommentCount}
        />
      )}

      {onDelete && (
        <button
          onClick={() => onDelete(session.id)}
          className="text-xs text-white/30 hover:text-red-400 transition-colors"
        >
          Delete
        </button>
      )}
    </div>
  )
}
