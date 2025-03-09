import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ContactForm } from "@/components/contact-form"

export default function ContactPage() {
  return (
    <div className="container py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl">Contact Us</CardTitle>
          <CardDescription>Have a question or feedback? We'd love to hear from you.</CardDescription>
        </CardHeader>
        <CardContent>
          <ContactForm />
        </CardContent>
      </Card>
    </div>
  )
} 