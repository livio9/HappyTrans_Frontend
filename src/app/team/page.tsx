import * as React from "react"
import { Globe, Home, Settings, ChevronDown, Users } from "lucide-react"
import Link from "next/link"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Team() {
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
          <Link href="/projects" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200">
            <Globe className="mr-3 h-5 w-5" />
            Projects
          </Link>
          <Link href="/team" className="flex items-center px-4 py-2 text-gray-700 bg-gray-200">
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
            <h2 className="text-2xl font-semibold text-gray-800">Team</h2>
            <div className="flex items-center">
              <Avatar className="ml-4">
                <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <Button variant="ghost" className="ml-2">
                John Doe
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Team Content */}
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">Team Members</h3>
            <Button>Invite Member</Button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { name: "Alice Smith", role: "Translator", avatar: "AS" },
              { name: "Bob Johnson", role: "Reviewer", avatar: "BJ" },
              { name: "Carol Williams", role: "Translator", avatar: "CW" },
              { name: "David Brown", role: "Project Manager", avatar: "DB" },
              { name: "Eva Davis", role: "Translator", avatar: "ED" },
              { name: "Frank Wilson", role: "Reviewer", avatar: "FW" },
            ].map((member, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Avatar className="mr-2">
                      <AvatarFallback>{member.avatar}</AvatarFallback>
                    </Avatar>
                    {member.name}
                  </CardTitle>
                  <CardDescription>{member.role}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">View Profile</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}