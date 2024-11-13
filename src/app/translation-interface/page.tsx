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

type TranslationString = {
  id: string
  source: string
  target: string
}

type TranslationSuggestion = {
  source: string
  translation: string
}

export default function TranslationInterface() {
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [strings, setStrings] = React.useState<TranslationString[]>([
    { id: "app.app.roles.Beheerder", source: "Beheerder", target: "" },
    { id: "app.app.roles.Beheerder.description", source: "Beheerders van de gemeente", target: "Administrators of the municipality" },
    { id: "app.app.roles.Medewerker", source: "Medewerker", target: "Employee" },
    { id: "app.app.roles.Medewerker.description", source: "Medewerkers van de gemeente", target: "Employees of the municipality" },
  ])
  const [suggestions, setSuggestions] = React.useState<TranslationSuggestion[]>([])
  const [selectedSuggestion, setSelectedSuggestion] = React.useState("")

  const handleTranslationChange = (value: string) => {
    const updatedStrings = [...strings]
    updatedStrings[currentIndex].target = value
    setStrings(updatedStrings)
  }

  const handleNavigation = (direction: 'first' | 'prev' | 'next' | 'last') => {
    switch (direction) {
      case 'first':
        setCurrentIndex(0)
        break
      case 'prev':
        setCurrentIndex(Math.max(0, currentIndex - 1))
        break
      case 'next':
        setCurrentIndex(Math.min(strings.length - 1, currentIndex + 1))
        break
      case 'last':
        setCurrentIndex(strings.length - 1)
        break
    }
  }

  const handleSuggest = async () => {
    // Simulating API calls to translation services
    const mockSuggestions = [
      { source: "DeepL", translation: "Administrator" },
      { source: "Google Translate", translation: "Manager" },
      { source: "ChatGPT", translation: "Supervisor" },
    ]
    setSuggestions(mockSuggestions)
  }

  const handleSelectSuggestion = () => {
    if (selectedSuggestion) {
      handleTranslationChange(selectedSuggestion)
    }
  }

  const progress = ((currentIndex + 1) / strings.length) * 100

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow p-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">Appsemble / Amersfoort workspaces / English / Translate</div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={() => handleNavigation('first')} disabled={currentIndex === 0}>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => handleNavigation('prev')} disabled={currentIndex === 0}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">{currentIndex + 1} / {strings.length}</span>
            <Button variant="outline" size="icon" onClick={() => handleNavigation('next')} disabled={currentIndex === strings.length - 1}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => handleNavigation('last')} disabled={currentIndex === strings.length - 1}>
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
                <h2 className="text-lg font-semibold mb-2">Dutch</h2>
                <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
                  {strings[currentIndex].source}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <h2 className="text-lg font-semibold mb-2">English</h2>
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
                  <Button variant="outline" onClick={handleSuggest}>Suggest</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Translation Suggestions</DialogTitle>
                    <DialogDescription>
                      Choose a translation suggestion from the options below.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <RadioGroup value={selectedSuggestion} onValueChange={setSelectedSuggestion}>
                      {suggestions.map((suggestion, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <RadioGroupItem value={suggestion.translation} id={`suggestion-${index}`} />
                          <Label htmlFor={`suggestion-${index}`}>
                            <span className="font-semibold">{suggestion.source}:</span> {suggestion.translation}
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
              <p className="text-sm text-gray-600 dark:text-gray-400">No relevant strings found in the glossary.</p>
            </TabsContent>
            <TabsContent value="info">
              <div className="space-y-2">
                <p><strong>Key:</strong> {strings[currentIndex].id}</p>
                <p><strong>String added:</strong> 1 year ago</p>
                <p><strong>Last updated:</strong> 1 year ago</p>
                <p><strong>Source string added:</strong> 3 years ago</p>
                <p><strong>Translation file:</strong> apps/werkplek-reservering/i18n/en.json, string 1 of 1</p>
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
                  <th className="text-left">Dutch</th>
                  <th className="text-left">English</th>
                  <th className="text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {strings.map((str, index) => (
                  <tr key={str.id} className={index === currentIndex ? "bg-blue-100 dark:bg-blue-900" : ""}>
                    <td>{str.id}</td>
                    <td>{str.source}</td>
                    <td>{str.target}</td>
                    <td>
                      <Button variant="ghost" size="icon">
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
          <TabsContent value="comment">Comment content</TabsContent>
        </Tabs>
      </footer>
    </div>
  )
}