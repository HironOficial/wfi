import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function PrivacyPage() {
  return (
    <div className="container py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl">Privacy Policy</CardTitle>
          <CardDescription>Last updated: {new Date().toLocaleDateString()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="prose dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Information Collection</h2>
              <p className="text-lg leading-relaxed mb-4">
                We collect minimal information to provide our services:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-lg">
                <li>Email address (optional, only if you choose to create an account)</li>
                <li>Asset extraction history (stored locally in your browser)</li>
                <li>Basic usage analytics to improve our service</li>
                <li>No personal data is required to use our core features</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Your Content & Data Rights</h2>
              <ul className="list-disc pl-6 space-y-2 text-lg">
                <li>All assets you extract belong entirely to you</li>
                <li>Your extracted assets are processed in real-time and not stored on our servers</li>
                <li>You can export or delete your extraction history at any time</li>
                <li>We do not claim any rights to your extracted assets</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. Local Storage & Cookies</h2>
              <ul className="list-disc pl-6 space-y-2 text-lg">
                <li>Most data is stored locally in your browser</li>
                <li>We use essential cookies only for basic app functionality</li>
                <li>No tracking cookies or third-party analytics</li>
                <li>You can clear local storage at any time through your browser</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. API Services</h2>
              <ul className="list-disc pl-6 space-y-2 text-lg">
                <li>We use Figma's API to extract assets from your designs</li>
                <li>Only necessary design data is transmitted to process your requests</li>
                <li>No personal information is shared with Figma beyond what's required for authentication</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
              <ul className="list-disc pl-6 space-y-2 text-lg">
                <li>We use HTTPS for secure communication between your browser and our servers</li>
                <li>Figma API communications are secured through their official authentication protocols</li>
                <li>Your data remains in your browser's local storage</li>
                <li>You can clear your local data at any time through your browser settings</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Third-Party Services</h2>
              <ul className="list-disc pl-6 space-y-2 text-lg">
                <li>We may link to external services</li>
                <li>We don't share your data with third parties</li>
                <li>External services have their own privacy policies</li>
                <li>Use external services at your discretion</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Privacy Policy Updates</h2>
              <ul className="list-disc pl-6 space-y-2 text-lg">
                <li>We'll notify you of significant changes</li>
                <li>Updates will be posted on this page</li>
                <li>Continued use means acceptance of changes</li>
              </ul>
            </section>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 