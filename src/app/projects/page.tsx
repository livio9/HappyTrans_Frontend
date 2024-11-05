import * as React from "react"
import { Globe, Home, Search, Settings, Users } from "lucide-react"
import Link from "next/link"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Projects() {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md">
        <div className="p-4">
          <h1 className="text-2xl font-bold text-gray-800">TranslateOS</h1>
        </div>
        <nav className="mt-4">
          <Link href="/dashboard" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200">
            <Home className="mr-3 h-5 w-5" />
            Dashboard
          </Link>
          <Link href="/projects" className="flex items-center px-4 py-2 text-gray-700 bg-gray-200">
            <Globe className="mr-3 h-5 w-5" />
            Projects
          </Link>
          <Link href="/team" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200">
            <Users className="mr-3 h-5 w-5" />
            Team
          </Link>
          <Link href="/settings" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200">
            <Settings className="mr-3 h-5 w-5" />
            Settings
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between px-8 py-4">
            <h2 className="text-2xl font-semibold text-gray-800">Projects</h2>
            <div className="flex items-center">
              <Avatar className="ml-4">
                <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Projects Content */}
        <div className="p-8">
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input type="text" placeholder="Search projects..." className="pl-10" />
            </div>
          </div>

          <Tabs defaultValue="to-translate">
            <TabsList>
              <TabsTrigger value="to-translate">To Translate</TabsTrigger>
              <TabsTrigger value="in-progress">In Progress</TabsTrigger>
            </TabsList>
            <TabsContent value="to-translate">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((project) => (
                  <Card key={project}>
                    <CardHeader>
                      <CardTitle>Project {project}</CardTitle>
                      <CardDescription>Awaiting translation</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600">0% Complete</p>
                      <Link href="/project-overview">
                        <Button className="mt-4">In Detail</Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="in-progress">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((project) => (
                  <Card key={project}>
                    <CardHeader>
                      <CardTitle>Project {project}</CardTitle>
                      <CardDescription>In  progress</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600">50% Complete</p>
                      <Button className="mt-4">Continue Translating</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}