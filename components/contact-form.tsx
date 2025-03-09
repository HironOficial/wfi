'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export function ContactForm() {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // Here you would typically handle the form submission
    // For now, we'll just show an alert
    alert('Thank you for your message! We will get back to you soon.')
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          placeholder="Your name"
          required
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="your.email@example.com"
          required
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject">Subject</Label>
        <Input
          id="subject"
          name="subject"
          placeholder="What is this regarding?"
          required
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          name="message"
          placeholder="Your message here..."
          required
          className="min-h-[150px] w-full"
        />
      </div>

      <Button type="submit" className="w-full">
        Send Message
      </Button>

      <div className="text-sm text-muted-foreground text-center mt-6">
        <p>You can also reach us at:</p>
        <p className="mt-2">
          Email: support@opennexus.dev
        </p>
      </div>
    </form>
  )
} 