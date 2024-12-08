'use client';
import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

const SettingsPage: React.FC = () => {
  return (
    <div>
      {/* 个人资料设置部分 */}
      <Card className="mb-6">
        <CardHeader>
          {/* 标题 */}
          <CardTitle>Profile Settings</CardTitle>
          {/* 描述 */}
          <CardDescription>Manage your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 姓名输入框 */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label> {/* 标签 */}
            <Input id="name" defaultValue="John Doe" /> {/* 默认值为示例姓名 */}
          </div>
          {/* 邮箱输入框 */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label> {/* 标签 */}
            <Input id="email" type="email" defaultValue="john.doe@example.com" /> {/* 默认值为示例邮箱 */}
          </div>
          {/* 提交按钮 */}
          <Button>Update Profile</Button>
        </CardContent>
      </Card>

      {/* 通知设置部分 */}
      <Card className="mb-6">
        <CardHeader>
          {/* 标题 */}
          <CardTitle>Notification Settings</CardTitle>
          {/* 描述 */}
          <CardDescription>Manage your notification preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 邮件通知开关 */}
          <div className="flex items-center justify-between">
            <Label htmlFor="email-notifications">Email Notifications</Label> {/* 标签 */}
            <Switch id="email-notifications" /> {/* 开关 */}
          </div>
          {/* 推送通知开关 */}
          <div className="flex items-center justify-between">
            <Label htmlFor="push-notifications">Push Notifications</Label> {/* 标签 */}
            <Switch id="push-notifications" /> {/* 开关 */}
          </div>
        </CardContent>
      </Card>

      {/* 语言设置部分 */}
      <Card>
        <CardHeader>
          {/* 标题 */}
          <CardTitle>Language Settings</CardTitle>
          {/* 描述 */}
          <CardDescription>Set your preferred languages</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 主语言选择 */}
          <div className="space-y-2">
            <Label htmlFor="primary-language">Primary Language</Label> {/* 标签 */}
            <select id="primary-language" className="w-full p-2 border rounded">
              <option>English</option> {/* 英语 */}
              <option>Spanish</option> {/* 西班牙语 */}
              <option>French</option> {/* 法语 */}
              <option>German</option> {/* 德语 */}
            </select>
          </div>
          {/* 次语言选择（多选） */}
          <div className="space-y-2">
            <Label htmlFor="secondary-languages">Secondary Languages</Label> {/* 标签 */}
            <select id="secondary-languages" multiple className="w-full p-2 border rounded">
              <option>English</option> {/* 英语 */}
              <option>Spanish</option> {/* 西班牙语 */}
              <option>French</option> {/* 法语 */}
              <option>German</option> {/* 德语 */}
              <option>Italian</option> {/* 意大利语 */}
              <option>Portuguese</option> {/* 葡萄牙语 */}
            </select>
          </div>
          {/* 提交按钮 */}
          <Button>Save Language Settings</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;