"use client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { fetchFigmaProject } from "@/lib/figma-api"
import type { FigmaProject } from "@/types/figma"

const formSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
  fileId: z.string().min(1, "File ID is required"),
})

interface ApiKeyFormProps {
  onProjectLoaded: (project: FigmaProject) => void
  onError: (error: string) => void
  setIsLoading: (isLoading: boolean) => void
}

export default function ApiKeyForm({ onProjectLoaded, onError, setIsLoading }: ApiKeyFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      apiKey: "",
      fileId: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      const project = await fetchFigmaProject(values.fileId, values.apiKey)
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
          name="fileId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Figma File ID</FormLabel>
              <FormControl>
                <Input placeholder="Enter the Figma file ID" {...field} />
              </FormControl>
              <FormDescription>
                The file ID is the string after &quot;file/&quot; in your Figma file URL.
              </FormDescription>
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

