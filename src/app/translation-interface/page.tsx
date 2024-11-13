"use client"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Copy } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useProject } from "@/context/ProjectContext"
import { useRouter } from "next/navigation";

type TranslationString = {
  id: string
  source: string
  target: string
  comments: string
  index: number
}

type TranslationSuggestion = {
  source: string
  translation: string
}

export default function TranslationInterface() {
  const { project } = useProject()
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [strings, setStrings] = React.useState<TranslationString[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [suggestions, setSuggestions] = React.useState<TranslationSuggestion[]>([])
  const [selectedSuggestion, setSelectedSuggestion] = React.useState("")

  React.useEffect(() => {
    if (!project) {
      // 如果没有项目，您可能想要重定向或显示错误
      router.push("/") // 根据需要修改
      return
    }
    fetchEntries(project.name)
  }, [project])

  const fetchEntries = async (projectName: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/entries?project_name=${projectName}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      if (response.ok) {
        const data = await response.json()
        processEntriesData(data)
      } else {
        setError("Failed to fetch entries")
      }
    } catch (err: any) {
      setError("Error fetching entries: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  const processEntriesData = (data: any) => {
    const sourceLanguageCode = "zh-hans" // 根据需要修改
    const targetLanguageCode = "en" // 根据需要修改

    const sourceLanguageData = data.languages.find(
      (lang: any) => lang.language_code === sourceLanguageCode
    )
    const targetLanguageData = data.languages.find(
      (lang: any) => lang.language_code === targetLanguageCode
    )

    if (!sourceLanguageData || !targetLanguageData) {
      setError("Source or target language data not found")
      return
    }

    const targetEntriesMap = new Map()
    targetLanguageData.entries.forEach((entry: any) => {
      targetEntriesMap.set(entry.msgid, entry)
    })

    const combinedStrings = sourceLanguageData.entries.map((sourceEntry: any) => {
      const targetEntry = targetEntriesMap.get(sourceEntry.msgid)

      return {
        id: sourceEntry.references,
        source: sourceEntry.msgid,
        target: targetEntry ? targetEntry.msgstr : "",
        comments: sourceEntry.comments || "",
        index: sourceEntry.index,
      }
    })

    setStrings(combinedStrings)
    setCurrentIndex(0)
  }

  const handleTranslationChange = (value: string) => {
    const updatedStrings = [...strings]
    updatedStrings[currentIndex].target = value
    setStrings(updatedStrings)
  }

  const handleNavigation = (direction: "first" | "prev" | "next" | "last") => {
    switch (direction) {
      case "first":
        setCurrentIndex(0)
        break
      case "prev":
        setCurrentIndex(Math.max(0, currentIndex - 1))
        break
      case "next":
        setCurrentIndex(Math.min(strings.length - 1, currentIndex + 1))
        break
      case "last":
        setCurrentIndex(strings.length - 1)
        break
    }
  }

  const handleSuggest = async () => {
    // Simulating API calls to translation services
    const mockSuggestions = [
      { source: "DeepL", translation: "Suggestion 1" },
      { source: "Google Translate", translation: "Suggestion 2" },
      { source: "ChatGPT", translation: "Suggestion 3" },
    ]
    setSuggestions(mockSuggestions)
  }

  const handleSelectSuggestion = () => {
    if (selectedSuggestion) {
      handleTranslationChange(selectedSuggestion)
    }
  }

  const progress = ((currentIndex + 1) / strings.length) * 100

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  if (strings.length === 0) {
    return <div>No strings available.</div>
  }

  const nearbyStrings = strings.slice(
    Math.max(0, currentIndex - 5),
    Math.min(strings.length, currentIndex + 6)
  )

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow p-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {project.name} / Translate
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleNavigation("first")}
              disabled={currentIndex === 0}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleNavigation("prev")}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              {currentIndex + 1} / {strings.length}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleNavigation("next")}
              disabled={currentIndex === strings.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleNavigation("last")}
              disabled={currentIndex === strings.length - 1}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
          <Progress value={progress} className="w-64" />
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-auto p-4">
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <h2 className="text-lg font-semibold mb-2">Source</h2>
                <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
                  {strings[currentIndex].source}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <h2 className="text-lg font-semibold mb-2">Translation</h2>
                <Textarea
                  value={strings[currentIndex].target}
                  onChange={(e) => handleTranslationChange(e.target.value)}
                  rows={4}
                  className="w-full"
                />
              </CardContent>
            </Card>
            <div className="flex space-x-2">
              <Button>Save and Continue</Button>
              <Button variant="outline">Save and Stay</Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" onClick={handleSuggest}>
                    Suggest
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Translation Suggestions</DialogTitle>
                    <DialogDescription>
                      Choose a translation suggestion from the options below.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <RadioGroup
                      value={selectedSuggestion}
                      onValueChange={setSelectedSuggestion}
                    >
                      {suggestions.map((suggestion, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <RadioGroupItem
                            value={suggestion.translation}
                            id={`suggestion-${index}`}
                          />
                          <Label htmlFor={`suggestion-${index}`}>
                            <span className="font-semibold">{suggestion.source}:</span>{" "}
                            {suggestion.translation}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  <Button onClick={handleSelectSuggestion}>Use Selected Suggestion</Button>
                </DialogContent>
              </Dialog>
              <Button variant="outline">Skip</Button>
            </div>
          </div>
        </main>
        <aside className="w-80 bg-white dark:bg-gray-800 overflow-auto p-4 border-l border-gray-200 dark:border-gray-700">
          <Tabs defaultValue="glossary">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="glossary">Glossary</TabsTrigger>
              <TabsTrigger value="info">String Info</TabsTrigger>
            </TabsList>
            <TabsContent value="glossary">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No relevant strings found in the glossary.
              </p>
            </TabsContent>
            <TabsContent value="info">
              <div className="space-y-2">
                <p>
                  <strong>Key:</strong> {strings[currentIndex].id}
                </p>
                <p>
                  <strong>Index:</strong> {strings[currentIndex].index}
                </p>
                {/* 根据需要添加更多信息 */}
              </div>
            </TabsContent>
          </Tabs>
        </aside>
      </div>
      <footer className="bg-white dark:bg-gray-800 p-4 border-t border-gray-200 dark:border-gray-700">
        <Tabs defaultValue="nearby">
          <TabsList>
            <TabsTrigger value="nearby">Nearby Strings</TabsTrigger>
            <TabsTrigger value="similar">Similar Keys</TabsTrigger>
            <TabsTrigger value="other">Other Languages</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="comment">Comment</TabsTrigger>
          </TabsList>
          <TabsContent value="nearby">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left">Key</th>
                  <th className="text-left">Source</th>
                  <th className="text-left">Translation</th>
                  <th className="text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {nearbyStrings.map((str, index) => (
                  <tr
                    key={str.id}
                    className={
                      str.index === strings[currentIndex].index
                        ? "bg-blue-100 dark:bg-blue-900"
                        : ""
                    }
                  >
                    <td>{str.id}</td>
                    <td>{str.source}</td>
                    <td>{str.target}</td>
                    <td>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleTranslationChange(str.target)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TabsContent>
          <TabsContent value="similar">Similar keys content</TabsContent>
          <TabsContent value="other">Other languages content</TabsContent>
          <TabsContent value="history">History content</TabsContent>
          <TabsContent value="comment">
            <div className="p-2">
              <p>{strings[currentIndex].comments || "No comments available."}</p>
            </div>
          </TabsContent>
        </Tabs>
      </footer>
    </div>
  )
}
