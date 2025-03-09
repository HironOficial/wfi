import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { KofiButton } from "@/components/kofi-button"

export default function AboutPage() {
  return (
    <div className="container py-8">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl">About Open Nexus</CardTitle>
          <CardDescription>Building free and open-source tools for developers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="prose dark:prose-invert">
            <p>
              At Open Nexus, we believe that powerful development tools should be accessible to everyone. Our mission is to
              create high-quality, open-source software that empowers developers and designers to work more efficiently.
            </p>

            <h3>Our Commitment</h3>
            <p>
              We are committed to keeping our tools free and open source. We believe that collaboration and transparency
              lead to better software, and that knowledge should be shared freely within the developer community.
            </p>

            <h3>Why Free?</h3>
            <p>
              While many similar tools are offered as paid services, we choose to keep our tools free because we believe
              that access to quality development tools shouldn't be limited by financial constraints. Our goal is to
              contribute positively to the open-source community and help developers focus on creating amazing products.
            </p>

            <h3>Support Our Mission</h3>
            <p>
              If you find our tools helpful and want to support our mission of keeping them free and continuously
              improving, consider buying us a coffee. Your support helps us maintain and enhance these tools while keeping
              them free for everyone.
            </p>

            <div className="flex justify-center py-4">
              <KofiButton />
            </div>

            <h3>Get Involved</h3>
            <p>
              Open Nexus is more than just a collection of tools - it's a community. We welcome contributions, feedback,
              and suggestions from developers like you. Together, we can build better tools for everyone.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 