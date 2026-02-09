import { Link } from 'react-router-dom'

export default function Privacy() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-white/70 mb-4" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
        <Link to="/" className="hover:text-[#4a9eed] transition-colors">Home</Link>
        <span>/</span>
        <span className="text-white">Privacy Policy</span>
      </div>

      <div className="bg-[#112240] border border-[#1e3a5f] rounded-lg p-6 sm:p-8 space-y-6 text-sm text-white/70 leading-relaxed">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>Privacy Policy</h1>
          <p className="text-white/40 text-xs">Last updated: February 9, 2026</p>
        </div>

        <p>
          ActionSports.World ("we", "us", "our") operates the ActionSports.World website and platform.
          This page informs you of our policies regarding the collection, use, and disclosure of personal
          information when you use our service.
        </p>

        <section>
          <h2 className="text-base font-semibold text-white mb-2">1. Information We Collect</h2>

          <h3 className="text-sm font-medium text-white/80 mt-3 mb-1">Account Information</h3>
          <p>When you register, we collect your username, email address, and a securely hashed password. We never store your password in plain text.</p>

          <h3 className="text-sm font-medium text-white/80 mt-3 mb-1">Surf Session Data</h3>
          <p>When you log sessions, we store the surf spot, date, time, duration, wave count, board used, personal notes, session rating, and conditions. You may also upload session photos (JPEG, PNG, or WebP, max 5 MB each).</p>

          <h3 className="text-sm font-medium text-white/80 mt-3 mb-1">Social Interactions</h3>
          <p>We store follows, kudos, comments, and spot reviews you create. Notifications are generated from these interactions and stored until read or deleted.</p>

          <h3 className="text-sm font-medium text-white/80 mt-3 mb-1">Garmin Connect Integration</h3>
          <p>
            If you choose to connect your Garmin account, we store your Garmin OAuth tokens (access token,
            refresh token, and expiration date) and your Garmin user ID. When you sync, we retrieve your
            surf activities from Garmin's API, including activity timestamps, duration, and GPS start coordinates.
            GPS coordinates are used solely to match activities to the nearest known surf spot and are not stored
            permanently. You can disconnect your Garmin account at any time, which immediately deletes all
            stored Garmin tokens from our system.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white mb-2">2. How We Use Your Information</h2>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>To provide and maintain the service, including session logging, statistics, and leaderboards</li>
            <li>To enable social features such as follows, kudos, comments, and the activity feed</li>
            <li>To sync surf activities from connected Garmin devices</li>
            <li>To match GPS coordinates to known surf spots</li>
            <li>To display ocean conditions and forecasts using third-party weather data providers</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white mb-2">3. Third-Party Services</h2>
          <p>We use the following third-party services to provide ocean and weather data:</p>
          <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
            <li><strong className="text-white/80">StormGlass</strong> — wave, swell, wind, and tide data</li>
            <li><strong className="text-white/80">Open-Meteo</strong> — marine and weather forecast data (free fallback)</li>
            <li><strong className="text-white/80">Garmin Connect</strong> — surf activity sync (only when you explicitly connect your account)</li>
          </ul>
          <p className="mt-2">Your personal data is not shared with these providers. Only spot coordinates (latitude/longitude of public surf spots) are sent to weather APIs. Garmin receives only the OAuth credentials necessary to authenticate your sync requests.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white mb-2">4. Data Storage and Security</h2>
          <p>
            All data is stored in a local SQLite database. Passwords are hashed using bcrypt with a cost
            factor of 10. Authentication uses JSON Web Tokens (JWT) with a 7-day expiration. Uploaded photos
            are stored on the server filesystem. We use WAL mode and foreign key constraints to maintain
            data integrity.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white mb-2">5. Your Rights</h2>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>You can delete your surf sessions at any time, which also removes associated photos, kudos, and comments</li>
            <li>You can disconnect your Garmin account at any time, removing all stored tokens</li>
            <li>You can delete your comments and spot reviews</li>
            <li>To request full account deletion, please contact us</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white mb-2">6. Cookies</h2>
          <p>
            This site does not use cookies for tracking. Authentication is handled via JWT tokens stored
            in your browser's local storage. No third-party analytics or advertising cookies are used.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white mb-2">7. Children's Privacy</h2>
          <p>
            Our service is not directed to individuals under the age of 13. We do not knowingly collect
            personal information from children under 13.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white mb-2">8. Changes to This Policy</h2>
          <p>
            We may update this privacy policy from time to time. We will notify you of any changes by
            posting the new policy on this page and updating the "Last updated" date.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white mb-2">9. Contact</h2>
          <p>
            If you have any questions about this privacy policy or wish to request account deletion,
            please contact us through the platform.
          </p>
        </section>
      </div>
    </div>
  )
}
