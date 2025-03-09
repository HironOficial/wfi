import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { KofiButton } from "@/components/kofi-button"

export default function AboutPage() {
  return (
    <div className="container py-8">
      <Card className="max-w-3xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold mb-2">About Open Nexus</CardTitle>
          <CardDescription className="text-lg">Building free and open-source tools for developers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="prose dark:prose-invert max-w-none">
            <div className="mb-8">
              <p className="text-lg leading-relaxed">
                At Open Nexus, we believe that powerful development tools should be accessible to everyone. Our mission is to
                create high-quality, open-source software that empowers developers and designers to work more efficiently.
              </p>
            </div>

            <div className="mb-8">
              <h3 className="text-2xl font-semibold mb-4">Our Commitment</h3>
              <p className="text-lg leading-relaxed">
                We are committed to keeping our tools free and open source. We believe that collaboration and transparency
                lead to better software, and that knowledge should be shared freely within the developer community.
              </p>
            </div>

            <div className="mb-8">
              <h3 className="text-2xl font-semibold mb-4">Why Free?</h3>
              <p className="text-lg leading-relaxed">
                While many similar tools are offered as paid services, we choose to keep our tools free because we believe
                that access to quality development tools shouldn't be limited by financial constraints. Our goal is to
                contribute positively to the open-source community and help developers focus on creating amazing products.
              </p>
            </div>

            <div className="mb-8">
              <h3 className="text-2xl font-semibold mb-4">Support Our Mission</h3>
              <p className="text-lg leading-relaxed">
                If you find our tools helpful and want to support our mission of keeping them free and continuously
                improving, consider buying us a coffee. Your support helps us maintain and enhance these tools while keeping
                them free for everyone.
              </p>

              <div className="flex justify-center py-6">
                <KofiButton />
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-2xl font-semibold mb-4">Get Involved</h3>
              <p className="text-lg leading-relaxed">
                Open Nexus is more than just a collection of tools - it's a community. We welcome contributions, feedback,
                and suggestions from developers like you. Together, we can build better tools for everyone.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 