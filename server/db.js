import Database from 'better-sqlite3'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { mkdirSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = join(__dirname, 'data')
mkdirSync(dataDir, { recursive: true })

const db = new Database(join(dataDir, 'sessions.db'))

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// Create users table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  )
`)

// Create sessions table
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    spot_id TEXT NOT NULL,
    spot_name TEXT NOT NULL,
    date TEXT NOT NULL,
    start_time TEXT,
    duration INTEGER NOT NULL,
    wave_count INTEGER,
    board TEXT,
    notes TEXT,
    rating INTEGER,
    conditions TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )
`)

// Migration: add user_id to sessions if not present
const columns = db.pragma('table_info(sessions)')
if (!columns.some(c => c.name === 'user_id')) {
  db.exec('ALTER TABLE sessions ADD COLUMN user_id INTEGER REFERENCES users(id)')
}

// Migration: Garmin OAuth columns on users
const userColumns = db.pragma('table_info(users)')
if (!userColumns.some(c => c.name === 'garmin_access_token')) {
  db.exec('ALTER TABLE users ADD COLUMN garmin_access_token TEXT')
  db.exec('ALTER TABLE users ADD COLUMN garmin_refresh_token TEXT')
  db.exec('ALTER TABLE users ADD COLUMN garmin_token_expires_at TEXT')
  db.exec('ALTER TABLE users ADD COLUMN garmin_user_id TEXT')
}

// Migration: Garmin activity tracking on sessions
if (!columns.some(c => c.name === 'garmin_activity_id')) {
  db.exec('ALTER TABLE sessions ADD COLUMN garmin_activity_id TEXT')
}

// Create follows table
db.exec(`
  CREATE TABLE IF NOT EXISTS follows (
    follower_id INTEGER NOT NULL REFERENCES users(id),
    following_id INTEGER NOT NULL REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (follower_id, following_id),
    CHECK (follower_id != following_id)
  )
`)

// Create kudos table
db.exec(`
  CREATE TABLE IF NOT EXISTS kudos (
    user_id INTEGER NOT NULL REFERENCES users(id),
    session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    created_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, session_id)
  )
`)

// Create comments table
db.exec(`
  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  )
`)

// Create session_photos table
db.exec(`
  CREATE TABLE IF NOT EXISTS session_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    original_name TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )
`)

// Create notifications table
db.exec(`
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    actor_id INTEGER NOT NULL REFERENCES users(id),
    type TEXT NOT NULL,
    session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
    comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    is_read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  )
`)

// Create spot_reviews table
db.exec(`
  CREATE TABLE IF NOT EXISTS spot_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    spot_id TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    body TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  )
`)

// Indexes for social tables
db.exec(`CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id)`)
db.exec(`CREATE INDEX IF NOT EXISTS idx_kudos_session ON kudos(session_id)`)
db.exec(`CREATE INDEX IF NOT EXISTS idx_comments_session ON comments(session_id)`)
db.exec(`CREATE INDEX IF NOT EXISTS idx_session_photos_session ON session_photos(session_id)`)
db.exec(`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC)`)
db.exec(`CREATE INDEX IF NOT EXISTS idx_spot_reviews_spot ON spot_reviews(spot_id, created_at DESC)`)
db.exec(`CREATE INDEX IF NOT EXISTS idx_sessions_garmin_activity ON sessions(garmin_activity_id)`)

// --- User prepared statements ---

export const insertUser = db.prepare(`
  INSERT INTO users (username, email, password_hash) VALUES (@username, @email, @password_hash)
`)

export const getUserByEmail = db.prepare(`
  SELECT * FROM users WHERE email = ? COLLATE NOCASE
`)

export const getUserById = db.prepare(`
  SELECT id, username, email, created_at FROM users WHERE id = ?
`)

export const getUserByUsername = db.prepare(`
  SELECT id, username, created_at FROM users WHERE username = ?
`)

// --- Session prepared statements ---

export const insertSession = db.prepare(`
  INSERT INTO sessions (spot_id, spot_name, date, start_time, duration, wave_count, board, notes, rating, conditions, user_id)
  VALUES (@spot_id, @spot_name, @date, @start_time, @duration, @wave_count, @board, @notes, @rating, @conditions, @user_id)
`)

export const getSessionById = db.prepare(`
  SELECT s.*, u.username FROM sessions s LEFT JOIN users u ON s.user_id = u.id WHERE s.id = ?
`)

// User-scoped session queries
export const getSessionsByUser = db.prepare(`
  SELECT s.*, u.username FROM sessions s
  LEFT JOIN users u ON s.user_id = u.id
  WHERE s.user_id = ?
  ORDER BY s.date DESC, s.created_at DESC
`)

export const getSessionsByUserAndSpot = db.prepare(`
  SELECT s.*, u.username FROM sessions s
  LEFT JOIN users u ON s.user_id = u.id
  WHERE s.user_id = ? AND s.spot_id = ?
  ORDER BY s.date DESC, s.created_at DESC
`)

// Public feed — all sessions with username
export const getAllSessionsPublic = db.prepare(`
  SELECT s.*, u.username FROM sessions s
  LEFT JOIN users u ON s.user_id = u.id
  ORDER BY s.date DESC, s.created_at DESC
  LIMIT 50
`)

export const deleteSessionByIdAndUser = db.prepare(`
  DELETE FROM sessions WHERE id = ? AND user_id = ?
`)

// User-scoped stats
export const getStatsByUser = db.prepare(`
  SELECT
    COUNT(*) as total_sessions,
    COALESCE(SUM(wave_count), 0) as total_waves,
    COALESCE(ROUND(AVG(duration)), 0) as avg_duration,
    COALESCE(SUM(duration), 0) as total_time,
    COALESCE(ROUND(AVG(rating), 1), 0) as avg_rating
  FROM sessions WHERE user_id = ?
`)

export const getTopSpotByUser = db.prepare(`
  SELECT spot_name, spot_id, COUNT(*) as session_count
  FROM sessions WHERE user_id = ?
  GROUP BY spot_id ORDER BY session_count DESC LIMIT 1
`)

export const getTopBoardByUser = db.prepare(`
  SELECT board, COUNT(*) as use_count
  FROM sessions WHERE user_id = ? AND board IS NOT NULL AND board != ''
  GROUP BY board ORDER BY use_count DESC LIMIT 1
`)

export const getWeeklyTrendByUser = db.prepare(`
  SELECT strftime('%Y-%W', date) as week, MIN(date) as week_start, COUNT(*) as session_count
  FROM sessions WHERE user_id = ? AND date >= date('now', '-12 weeks')
  GROUP BY week ORDER BY week ASC
`)

// --- Leaderboard prepared statements ---

// Global leaderboards — All Time
export const getLeaderboardSessions = db.prepare(`
  SELECT ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) as rank, u.username, COUNT(*) as value
  FROM sessions s JOIN users u ON s.user_id = u.id
  GROUP BY s.user_id ORDER BY value DESC LIMIT 20
`)

export const getLeaderboardWaves = db.prepare(`
  SELECT ROW_NUMBER() OVER (ORDER BY SUM(s.wave_count) DESC) as rank, u.username, SUM(s.wave_count) as value
  FROM sessions s JOIN users u ON s.user_id = u.id
  WHERE s.wave_count IS NOT NULL
  GROUP BY s.user_id ORDER BY value DESC LIMIT 20
`)

export const getLeaderboardBiggestWaves = db.prepare(`
  SELECT ROW_NUMBER() OVER (ORDER BY MAX(s.wave_count) DESC) as rank, u.username, MAX(s.wave_count) as value
  FROM sessions s JOIN users u ON s.user_id = u.id
  WHERE s.wave_count IS NOT NULL
  GROUP BY s.user_id ORDER BY value DESC LIMIT 20
`)

export const getLeaderboardTime = db.prepare(`
  SELECT ROW_NUMBER() OVER (ORDER BY SUM(s.duration) DESC) as rank, u.username, SUM(s.duration) as value
  FROM sessions s JOIN users u ON s.user_id = u.id
  GROUP BY s.user_id ORDER BY value DESC LIMIT 20
`)

export const getLeaderboardRating = db.prepare(`
  SELECT ROW_NUMBER() OVER (ORDER BY AVG(s.rating) DESC) as rank, u.username, ROUND(AVG(s.rating), 1) as value
  FROM sessions s JOIN users u ON s.user_id = u.id
  WHERE s.rating IS NOT NULL
  GROUP BY s.user_id HAVING COUNT(*) >= 3
  ORDER BY value DESC LIMIT 20
`)

// Global leaderboards — This Month
export const getLeaderboardSessionsMonth = db.prepare(`
  SELECT ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) as rank, u.username, COUNT(*) as value
  FROM sessions s JOIN users u ON s.user_id = u.id
  WHERE s.date >= date('now', 'start of month')
  GROUP BY s.user_id ORDER BY value DESC LIMIT 20
`)

export const getLeaderboardWavesMonth = db.prepare(`
  SELECT ROW_NUMBER() OVER (ORDER BY SUM(s.wave_count) DESC) as rank, u.username, SUM(s.wave_count) as value
  FROM sessions s JOIN users u ON s.user_id = u.id
  WHERE s.wave_count IS NOT NULL AND s.date >= date('now', 'start of month')
  GROUP BY s.user_id ORDER BY value DESC LIMIT 20
`)

export const getLeaderboardBiggestWavesMonth = db.prepare(`
  SELECT ROW_NUMBER() OVER (ORDER BY MAX(s.wave_count) DESC) as rank, u.username, MAX(s.wave_count) as value
  FROM sessions s JOIN users u ON s.user_id = u.id
  WHERE s.wave_count IS NOT NULL AND s.date >= date('now', 'start of month')
  GROUP BY s.user_id ORDER BY value DESC LIMIT 20
`)

export const getLeaderboardTimeMonth = db.prepare(`
  SELECT ROW_NUMBER() OVER (ORDER BY SUM(s.duration) DESC) as rank, u.username, SUM(s.duration) as value
  FROM sessions s JOIN users u ON s.user_id = u.id
  WHERE s.date >= date('now', 'start of month')
  GROUP BY s.user_id ORDER BY value DESC LIMIT 20
`)

export const getLeaderboardRatingMonth = db.prepare(`
  SELECT ROW_NUMBER() OVER (ORDER BY AVG(s.rating) DESC) as rank, u.username, ROUND(AVG(s.rating), 1) as value
  FROM sessions s JOIN users u ON s.user_id = u.id
  WHERE s.rating IS NOT NULL AND s.date >= date('now', 'start of month')
  GROUP BY s.user_id HAVING COUNT(*) >= 2
  ORDER BY value DESC LIMIT 20
`)

// Per-spot leaderboards
export const getSpotLeaderboard = db.prepare(`
  SELECT ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) as rank, u.username,
    COUNT(*) as sessions, COALESCE(SUM(s.wave_count), 0) as waves, SUM(s.duration) as total_time
  FROM sessions s JOIN users u ON s.user_id = u.id
  WHERE s.spot_id = ?
  GROUP BY s.user_id ORDER BY sessions DESC LIMIT 5
`)

export const getSpotLeaderboardMonth = db.prepare(`
  SELECT ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) as rank, u.username,
    COUNT(*) as sessions, COALESCE(SUM(s.wave_count), 0) as waves, SUM(s.duration) as total_time
  FROM sessions s JOIN users u ON s.user_id = u.id
  WHERE s.spot_id = ? AND s.date >= date('now', 'start of month')
  GROUP BY s.user_id ORDER BY sessions DESC LIMIT 5
`)

// --- Follow prepared statements ---

export const insertFollow = db.prepare(`
  INSERT OR IGNORE INTO follows (follower_id, following_id) VALUES (?, ?)
`)

export const deleteFollow = db.prepare(`
  DELETE FROM follows WHERE follower_id = ? AND following_id = ?
`)

export const getFollowStatus = db.prepare(`
  SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?
`)

export const getFollowerCount = db.prepare(`
  SELECT COUNT(*) as count FROM follows WHERE following_id = ?
`)

export const getFollowingCount = db.prepare(`
  SELECT COUNT(*) as count FROM follows WHERE follower_id = ?
`)

export const getFollowingFeed = db.prepare(`
  SELECT s.*, u.username FROM sessions s
  JOIN users u ON s.user_id = u.id
  JOIN follows f ON f.following_id = s.user_id AND f.follower_id = ?
  ORDER BY s.date DESC, s.created_at DESC
  LIMIT 50
`)

// --- Kudos prepared statements ---

export const insertKudos = db.prepare(`
  INSERT OR IGNORE INTO kudos (user_id, session_id) VALUES (?, ?)
`)

export const deleteKudos = db.prepare(`
  DELETE FROM kudos WHERE user_id = ? AND session_id = ?
`)

export const getKudosCount = db.prepare(`
  SELECT COUNT(*) as count FROM kudos WHERE session_id = ?
`)

export const getUserKudos = db.prepare(`
  SELECT 1 FROM kudos WHERE user_id = ? AND session_id = ?
`)

export const getKudosForSessions = db.prepare(`
  SELECT session_id, COUNT(*) as count FROM kudos
  WHERE session_id IN (SELECT value FROM json_each(?))
  GROUP BY session_id
`)

export const getUserKudosForSessions = db.prepare(`
  SELECT session_id FROM kudos
  WHERE user_id = ? AND session_id IN (SELECT value FROM json_each(?))
`)

// --- Comment prepared statements ---

export const insertComment = db.prepare(`
  INSERT INTO comments (user_id, session_id, body) VALUES (?, ?, ?)
`)

export const deleteComment = db.prepare(`
  DELETE FROM comments WHERE id = ? AND user_id = ?
`)

export const getCommentById = db.prepare(`
  SELECT c.*, u.username FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?
`)

export const getCommentsBySession = db.prepare(`
  SELECT c.id, c.body, c.created_at, c.user_id, u.username
  FROM comments c JOIN users u ON c.user_id = u.id
  WHERE c.session_id = ?
  ORDER BY c.created_at ASC
`)

export const getCommentCountForSessions = db.prepare(`
  SELECT session_id, COUNT(*) as count FROM comments
  WHERE session_id IN (SELECT value FROM json_each(?))
  GROUP BY session_id
`)

export const getCommentCountBySession = db.prepare(`
  SELECT COUNT(*) as count FROM comments WHERE session_id = ?
`)

// --- Session Photo prepared statements ---

export const insertPhoto = db.prepare(`
  INSERT INTO session_photos (session_id, filename, original_name) VALUES (?, ?, ?)
`)

export const getPhotosBySession = db.prepare(`
  SELECT id, filename, original_name, created_at FROM session_photos WHERE session_id = ? ORDER BY created_at ASC
`)

export const getPhotoById = db.prepare(`
  SELECT * FROM session_photos WHERE id = ?
`)

export const deletePhotoById = db.prepare(`
  DELETE FROM session_photos WHERE id = ?
`)

export const getPhotoCountBySession = db.prepare(`
  SELECT COUNT(*) as count FROM session_photos WHERE session_id = ?
`)

export const getPhotosForSessions = db.prepare(`
  SELECT id, session_id, filename, original_name FROM session_photos
  WHERE session_id IN (SELECT value FROM json_each(?))
  ORDER BY created_at ASC
`)

// --- Athlete search prepared statements ---

export const searchAthletes = db.prepare(`
  SELECT u.id, u.username, u.created_at,
    COUNT(DISTINCT s.id) AS session_count,
    (SELECT COUNT(*) FROM follows f WHERE f.following_id = u.id) AS follower_count
  FROM users u
  LEFT JOIN sessions s ON s.user_id = u.id
  WHERE u.username LIKE ? COLLATE NOCASE
  GROUP BY u.id
  ORDER BY session_count DESC, u.username ASC
  LIMIT 20
`)

export const getFollowStatusBulk = db.prepare(`
  SELECT following_id FROM follows
  WHERE follower_id = ? AND following_id IN (SELECT value FROM json_each(?))
`)

// --- Notification prepared statements ---

export const insertNotification = db.prepare(`
  INSERT INTO notifications (user_id, actor_id, type, session_id, comment_id) VALUES (?, ?, ?, ?, ?)
`)

export const getUnreadCount = db.prepare(`
  SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0
`)

export const getNotifications = db.prepare(`
  SELECT n.*, u.username as actor_username, s.spot_name
  FROM notifications n
  JOIN users u ON n.actor_id = u.id
  LEFT JOIN sessions s ON n.session_id = s.id
  WHERE n.user_id = ?
  ORDER BY n.created_at DESC
  LIMIT 50
`)

export const markRead = db.prepare(`
  UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?
`)

export const markAllRead = db.prepare(`
  UPDATE notifications SET is_read = 1 WHERE user_id = ?
`)

export const deleteNotificationOnUnkudos = db.prepare(`
  DELETE FROM notifications WHERE actor_id = ? AND type = 'kudos' AND session_id = ?
`)

// --- Spot Review prepared statements ---

export const insertSpotReview = db.prepare(`
  INSERT INTO spot_reviews (user_id, spot_id, rating, body) VALUES (?, ?, ?, ?)
`)

export const getSpotReviewsBySpot = db.prepare(`
  SELECT r.id, r.rating, r.body, r.created_at, r.user_id, u.username
  FROM spot_reviews r JOIN users u ON r.user_id = u.id
  WHERE r.spot_id = ?
  ORDER BY r.created_at DESC
  LIMIT 50
`)

export const deleteSpotReview = db.prepare(`
  DELETE FROM spot_reviews WHERE id = ? AND user_id = ?
`)

export const getSpotAverageRating = db.prepare(`
  SELECT AVG(rating) as avg_rating, COUNT(*) as review_count FROM spot_reviews WHERE spot_id = ?
`)

// --- Garmin prepared statements ---

export const updateGarminTokens = db.prepare(`
  UPDATE users SET garmin_access_token = @garmin_access_token, garmin_refresh_token = @garmin_refresh_token,
    garmin_token_expires_at = @garmin_token_expires_at, garmin_user_id = @garmin_user_id WHERE id = @id
`)

export const clearGarminTokens = db.prepare(`
  UPDATE users SET garmin_access_token = NULL, garmin_refresh_token = NULL,
    garmin_token_expires_at = NULL, garmin_user_id = NULL WHERE id = ?
`)

export const getUserByGarminId = db.prepare(`
  SELECT id, username, email, created_at FROM users WHERE garmin_user_id = ?
`)

export const getGarminTokens = db.prepare(`
  SELECT garmin_access_token, garmin_refresh_token, garmin_token_expires_at, garmin_user_id FROM users WHERE id = ?
`)

export const getSessionByGarminActivity = db.prepare(`
  SELECT id FROM sessions WHERE garmin_activity_id = ?
`)

export const getUserGarminStatus = db.prepare(`
  SELECT garmin_user_id, garmin_token_expires_at FROM users WHERE id = ?
`)

export const insertGarminSession = db.prepare(`
  INSERT INTO sessions (spot_id, spot_name, date, start_time, duration, wave_count, board, notes, rating, conditions, user_id, garmin_activity_id)
  VALUES (@spot_id, @spot_name, @date, @start_time, @duration, @wave_count, @board, @notes, @rating, @conditions, @user_id, @garmin_activity_id)
`)

export default db
