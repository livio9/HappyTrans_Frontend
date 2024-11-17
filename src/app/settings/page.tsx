'use client';
import * as React from "react"
import { useAuth } from "@/context/AuthContext";
import { Globe, Home, Settings, ChevronDown, Users } from "lucide-react"
import Link from "next/link"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export default function SettingsPage() {
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
          <Link href="/dashboard" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200">
            <Home className="mr-3 h-5 w-5" />
            Dashboard
          </Link>
          <Link href="/projects" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200">
            <Globe className="mr-3 h-5 w-5" />
            Projects
          </Link>
          <Link href="/settings" className="flex items-center px-4 py-2 text-gray-700 bg-gray-200">
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

        {/* Settings Content */}
        <div className="p-8">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>Manage your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" defaultValue="John Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="john.doe@example.com" />
              </div>
              <Button>Update Profile</Button>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Manage your notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <Switch id="email-notifications" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="push-notifications">Push Notifications</Label>
                <Switch id="push-notifications" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Language Settings</CardTitle>
              <CardDescription>Set your preferred languages</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="primary-language">Primary Language</Label>
                <select id="primary-language" className="w-full p-2 border rounded">
                  <option>English</option>
                  <option>Spanish</option>
                  <option>French</option>
                  <option>German</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondary-languages">Secondary Languages</Label>
                <select id="secondary-languages" multiple className="w-full p-2 border rounded">
                  <option>English</option>
                  <option>Spanish</option>
                  <option>French</option>
                  <option>German</option>
                  <option>Italian</option>
                  <option>Portuguese</option>
                </select>
              </div>
              <Button>Save Language Settings</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}