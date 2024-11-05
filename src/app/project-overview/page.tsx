"use client"
import * as React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

type Component = {
  name: string
  translated: number
  total: number
  words: number
  characters: number
}

type Project = {
  name: string
  components: Component[]
}

export default function ProjectOverview() {
  const [searchTerm, setSearchTerm] = React.useState("")
  const project: Project = {
    name: "Appsemble",
    components: [
      { name: "Amersfoort workspaces", translated: 98, total: 100, words: 461, characters: 2862 },
      { name: "Appsemble", translated: 97, total: 100, words: 2096, characters: 13373 },
      { name: "barcode-scan", translated: 100, total: 100, words: 0, characters: 0 },
      { name: "chatgpt", translated: 100, total: 100, words: 0, characters: 0 },
      { name: "containers", translated: 100, total: 100, words: 0, characters: 0 },
      { name: "control-buttons", translated: 100, total: 100, words: 0, characters: 0 },
    ]
  }

  const filteredComponents = project.components.filter(component =>
    component.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{project.name}</h1>
      <Input
        type="text"
        placeholder="Search components..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4"
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Component</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Words</TableHead>
            <TableHead>Characters</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredComponents.map((component) => (
            <TableRow key={component.name}>
              <TableCell>{component.name}</TableCell>
              <TableCell>
                <div className="flex items-center">
                  <Progress value={(component.translated / component.total) * 100} className="w-full mr-2" />
                  <span>{Math.round((component.translated / component.total) * 100)}%</span>
                </div>
              </TableCell>
              <TableCell>{component.words}</TableCell>
              <TableCell>{component.characters}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button asChild variant="outline">
                    <Link href={`/browse-translations`}>Browse</Link>
                  </Button>
                  <Button asChild>
                    <Link href={`/translation-interface`}>Translate</Link>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}