'use client';
import * as React from "react"
import { PieChart } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

/**
 * 仪表板组件，展示翻译系统的核心指标和统计信息
 */
const Dashboard: React.FC = () => {
  return (
    <div>
      {/* 仪表板的主要内容区域 */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* 翻译进度卡片 */}
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

        {/* 活跃项目数卡片 */}
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

        {/* 团队成员数卡片 */}
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

      {/* 最近活动卡片 */}
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

      {/* 项目统计卡片 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Project Statistics</CardTitle>
          <CardDescription>Overview of translation statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <PieChart className="h-48 w-48 text-gray-400" />
            {/* 注意：实际项目中应替换为真实的数据可视化图表组件 */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;