import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  console.error('JWT_SECRET is not set. Add it to your .env file.')
  process.exit(1)
}

export function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

// Sets req.user from Bearer token, or null if missing/invalid. Does NOT reject.
export function extractUser(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    req.user = null
    return next()
  }
  try {
    req.user = jwt.verify(header.split(' ')[1], JWT_SECRET)
  } catch {
    req.user = null
  }
  next()
}

// Rejects with 401 if req.user is null.
export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' })
  }
  next()
}
