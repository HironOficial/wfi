import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function TermsPage() {
  return (
    <div className="container py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl">Terms of Service</CardTitle>
          <CardDescription>Last updated: {new Date().toLocaleDateString()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="prose dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Agreement to Terms</h2>
              <p className="text-lg leading-relaxed mb-4">
                By using Open Nexus, you agree to these terms of service. Please read them carefully.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Content Ownership & Usage Rights</h2>
              <ul className="list-disc pl-6 space-y-2 text-lg">
                <li>Any content you download from Open Nexus becomes your full property</li>
                <li>You have complete freedom to use, modify, distribute, or sell your downloaded content</li>
                <li>No restrictions are placed on commercial or non-commercial usage of your downloads</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Disclaimer</h2>
              <ul className="list-disc pl-6 space-y-2 text-lg">
                <li>Open Nexus provides its services "as is" without any warranties</li>
                <li>We don't guarantee the accuracy, reliability, or availability of our services</li>
                <li>We're not responsible for any errors or interruptions in service</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Limitation of Liability</h2>
              <p className="text-lg leading-relaxed mb-2">We're not liable for any damages or losses resulting from:</p>
              <ul className="list-disc pl-6 space-y-2 text-lg">
                <li>Your use of our services</li>
                <li>Service interruptions or downtime</li>
                <li>Loss of data or content</li>
                <li>Any technical issues or errors</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">External Links</h2>
              <ul className="list-disc pl-6 space-y-2 text-lg">
                <li>We may provide links to third-party websites</li>
                <li>We don't endorse or control these external sites</li>
                <li>You visit third-party sites at your own risk</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Updates to Terms</h2>
              <ul className="list-disc pl-6 space-y-2 text-lg">
                <li>We may update these terms at any time</li>
                <li>Continued use of Open Nexus after changes means you accept the new terms</li>
                <li>We'll try to notify you of significant changes</li>
              </ul>
            </section>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 