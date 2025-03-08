"use client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { extractFileIdFromUrl, fetchFigmaProject } from "@/lib/figma-api"
import type { FigmaProject } from "@/types/figma"

const formSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
  projectUrl: z.string().min(1, "Project URL is required").url("Please enter a valid URL"),
})

interface ProjectUrlFormProps {
  onProjectLoaded: (project: FigmaProject) => void
  onError: (error: string) => void
  setIsLoading: (isLoading: boolean) => void
}

export default function ProjectUrlForm({ onProjectLoaded, onError, setIsLoading }: ProjectUrlFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      apiKey: "",
      projectUrl: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      const fileId = extractFileIdFromUrl(values.projectUrl)
      if (!fileId) {
        throw new Error("Invalid Figma URL. Could not extract file ID.")
      }

      const project = await fetchFigmaProject(fileId, values.apiKey)
      onProjectLoaded(project)
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to load Figma project")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="apiKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Figma API Key</FormLabel>
              <FormControl>
                <Input placeholder="Enter your Figma API key" {...field} type="password" />
              </FormControl>
              <FormDescription>You can find your API key in your Figma account settings.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="projectUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Figma Project URL</FormLabel>
              <FormControl>
                <Input placeholder="https://www.figma.com/file/..." {...field} />
              </FormControl>
              <FormDescription>Paste the full URL of your Figma file.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          Connect to Figma
        </Button>
      </form>
    </Form>
  )
}

