import { Link } from 'react-router-dom'

export default function Terms() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-white/70 mb-4" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
        <Link to="/" className="hover:text-[#4a9eed] transition-colors">Home</Link>
        <span>/</span>
        <span className="text-white">Terms of Use</span>
      </div>

      <div className="bg-[#112240] border border-[#1e3a5f] rounded-lg p-6 sm:p-8 space-y-6 text-sm text-white/70 leading-relaxed">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>Terms of Use</h1>
          <p className="text-white/40 text-xs">Last updated: February 9, 2026</p>
        </div>

        <p>
          Welcome to ActionSports.World. By accessing or using this website and platform, you agree to be
          bound by these Terms of Use. If you do not agree to these terms, please do not use the service.
        </p>

        <section>
          <h2 className="text-base font-semibold text-white mb-2">1. Acceptance of Terms</h2>
          <p>
            By creating an account, accessing, or using ActionSports.World, you acknowledge that you have
            read, understood, and agree to be bound by these Terms of Use and our{' '}
            <Link to="/privacy" className="text-[#4a9eed] hover:underline">Privacy Policy</Link>.
            These terms apply to all users of the platform, including registered members and visitors.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white mb-2">2. Eligibility</h2>
          <p>
            You must be at least 13 years of age to use this service. By registering, you represent that
            you meet this age requirement. If you are under 18, you should review these terms with a
            parent or guardian.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white mb-2">3. Account Responsibilities</h2>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>You are responsible for maintaining the confidentiality of your account credentials</li>
            <li>You are responsible for all activity that occurs under your account</li>
            <li>You must provide accurate information when registering (valid email, unique username)</li>
            <li>You must not share your account or allow others to access it</li>
            <li>You must notify us immediately of any unauthorized use of your account</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white mb-2">4. Acceptable Use</h2>
          <p>When using ActionSports.World, you agree not to:</p>
          <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
            <li>Post false, misleading, or fraudulent session data</li>
            <li>Upload photos that are obscene, offensive, or infringe on the rights of others</li>
            <li>Harass, abuse, or threaten other users through comments or other interactions</li>
            <li>Impersonate other users or misrepresent your identity</li>
            <li>Attempt to gain unauthorized access to other users' accounts or data</li>
            <li>Use automated tools, bots, or scrapers to access the platform without permission</li>
            <li>Interfere with or disrupt the service, servers, or connected networks</li>
            <li>Manipulate leaderboards through fake sessions or artificial activity</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white mb-2">5. User Content</h2>
          <p>
            You retain ownership of the content you post, including session data, photos, comments, and
            spot reviews. By posting content on ActionSports.World, you grant us a non-exclusive,
            royalty-free license to display, distribute, and store that content as necessary to operate
            the platform.
          </p>
          <p className="mt-2">
            We reserve the right to remove any content that violates these terms or is otherwise
            objectionable, without prior notice.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white mb-2">6. Third-Party Integrations</h2>

          <h3 className="text-sm font-medium text-white/80 mt-3 mb-1">Garmin Connect</h3>
          <p>
            If you connect your Garmin account, you authorize ActionSports.World to access your Garmin
            surf activity data. This connection is governed by both these terms and Garmin's own terms
            of service. You may disconnect your Garmin account at any time. We are not responsible for
            the availability or accuracy of data provided by Garmin.
          </p>

          <h3 className="text-sm font-medium text-white/80 mt-3 mb-1">Weather Data Providers</h3>
          <p>
            Ocean conditions, forecasts, and tide data are provided by third-party services (StormGlass
            and Open-Meteo). This data is provided "as is" and we make no guarantees regarding its
            accuracy, completeness, or timeliness.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white mb-2">7. Safety Disclaimer</h2>
          <p className="font-medium text-white/80">
            Ocean activities including surfing are inherently dangerous. ActionSports.World is an
            informational and logging platform only.
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
            <li>Surf condition data, forecasts, and spot information are for reference only and should not be relied upon as the sole basis for safety decisions</li>
            <li>Always check local conditions in person before entering the water</li>
            <li>Surf within your ability level and be aware of local hazards</li>
            <li>We are not liable for any injuries, damages, or losses resulting from decisions made based on information provided by this platform</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white mb-2">8. Intellectual Property</h2>
          <p>
            The ActionSports.World name, logo, design, and software are the property of H-Consult.
            You may not copy, modify, distribute, or reverse-engineer any part of the platform without
            written permission.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white mb-2">9. Limitation of Liability</h2>
          <p>
            ActionSports.World is provided on an "as is" and "as available" basis without warranties
            of any kind, either express or implied. To the fullest extent permitted by law, we disclaim
            all warranties including fitness for a particular purpose, merchantability, and non-infringement.
          </p>
          <p className="mt-2">
            In no event shall ActionSports.World or H-Consult be liable for any indirect, incidental,
            special, consequential, or punitive damages, including loss of data, arising out of your
            use of or inability to use the service.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white mb-2">10. Account Termination</h2>
          <p>
            We reserve the right to suspend or terminate your account at any time if you violate these
            terms. You may also request deletion of your account by contacting us. Upon termination,
            your right to use the service ceases immediately.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white mb-2">11. Changes to These Terms</h2>
          <p>
            We may revise these terms at any time by posting the updated version on this page and
            updating the "Last updated" date. Continued use of the platform after changes constitutes
            acceptance of the revised terms.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white mb-2">12. Governing Law</h2>
          <p>
            These terms shall be governed by and construed in accordance with applicable laws, without
            regard to conflict of law provisions.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white mb-2">13. Contact</h2>
          <p>
            If you have questions about these Terms of Use, please contact us through the platform.
          </p>
        </section>
      </div>
    </div>
  )
}
