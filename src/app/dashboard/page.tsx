'use client';
import * as React from "react"
import { useAuth } from "@/context/AuthContext";
import { Bell, ChevronDown, Globe, Home, PieChart, Settings, Users } from "lucide-react"
import Link from "next/link"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export default function Dashboard() {
  // 在组件的顶层调用钩子
  const { logout } = useAuth();

  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [isClient, setIsClient] = React.useState(false);

  // 确保客户端钩子只在客户端执行
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // 切换下拉框显示状态
  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleLogout = async () => {
    try {
      logout();
      // 在成功后清除用户会话或重定向
      window.location.href = "/signin" // 重定向到登录页

    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  }
  
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md">
        <div className="p-4">
          <h1 className="text-2xl font-bold text-gray-800">TranslateOS</h1>
        </div>
        <nav className="mt-3">
          <Link href="/dashboard" className="flex items-center px-4 py-2 text-gray-700 bg-gray-200">
            <Home className="mr-3 h-5 w-5" />
            Dashboard
          </Link>
          <Link href="/projects" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200">
            <Globe className="mr-3 h-5 w-5" />
            Projects
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
            <h2 className="text-2xl font-semibold text-gray-800">Settings</h2>
            <div className="flex items-center relative"> {/* 将容器设置为 relative 定位 */}
              <Avatar className="ml-4">
                <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <Button variant="ghost" className="ml-2" onClick={toggleDropdown}>
                John Doe
                <ChevronDown className="ml-2 h-4 w-4 z-20" /> {/* 增加z-index确保按钮在最上层 */}
              </Button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-20 w-48 bg-white shadow-lg rounded-md z-10"> {/* 下拉框的 z-index 设置为 10 */}
                  <ul className="space-y-2 p-2">
                    <li className="hover:bg-gray-200 rounded-md">
                      <Button
                        variant="ghost"
                        className="w-full text-left"
                        onClick={handleLogout}
                      >
                        Logout
                      </Button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Translation Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Translation Progress</CardTitle>
                <CardDescription>Overall progress across all projects</CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={65} className="w-full" />
                <p className="mt-2 text-sm text-gray-600">65% Complete</p>
              </CardContent>
            </Card>

            {/* Active Projects */}
            <Card>
              <CardHeader>
                <CardTitle>Active Projects</CardTitle>
                <CardDescription>Currently active translation projects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">12</div>
                <p className="text-sm text-gray-600">2 more than last month</p>
              </CardContent>
            </Card>

            {/* Team Members */}
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>Total number of translators and reviewers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">24</div>
                <p className="text-sm text-gray-600">5 new this month</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activities */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>Latest updates from your team</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                <li className="flex items-center">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src="/placeholder.svg?height=36&width=36" alt="User" />
                    <AvatarFallback>AS</AvatarFallback>
                  </Avatar>
                  <div className="ml-4">
                    <p className="text-sm font-medium">Alice Smith translated 50 strings in Project A</p>
                    <p className="text-sm text-gray-500">2 hours ago</p>
                  </div>
                </li>
                <li className="flex items-center">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src="/placeholder.svg?height=36&width=36" alt="User" />
                    <AvatarFallback>BJ</AvatarFallback>
                  </Avatar>
                  <div className="ml-4">
                    <p className="text-sm font-medium">Bob Johnson reviewed 30 translations in Project B</p>
                    <p className="text-sm text-gray-500">5 hours ago</p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Project Statistics */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Project Statistics</CardTitle>
              <CardDescription>Overview of translation statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-64">
                <PieChart className="h-48 w-48 text-gray-400" />
                {/* Note: Replace this with an actual chart component for real data visualization */}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}