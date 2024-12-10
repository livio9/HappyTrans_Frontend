'use client';
import * as React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

// 定义完整的语言选项
const languageOptions = [
  { code: "en", name: "English" },
  { code: "zh-hans", name: "简体中文" },
  { code: "zh-hant", name: "繁體中文" },
  { code: "es", name: "Español" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
  { code: "it", name: "Italiano" },
  { code: "ja", name: "日本語" },
  { code: "ko", name: "한국어" },
  { code: "ru", name: "Русский" },
  { code: "ar", name: "العربية" },
  { code: "pt", name: "Português" },
  { code: "hi", name: "हिन्दी" },
  { code: "tr", name: "Türkçe" },
  { code: "pl", name: "Polski" },
  { code: "nl", name: "Nederlands" },
  { code: "sv", name: "Svenska" },
  { code: "no", name: "Norsk" },
  { code: "da", name: "Dansk" },
];

const SettingsPage: React.FC = () => {
  // 个人资料设置状态
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");

  // 通知设置状态
  const [emailNotifications, setEmailNotifications] = useState<boolean>(false);
  const [pushNotifications, setPushNotifications] = useState<boolean>(false);

  // 语言设置状态
  const [primaryLanguage, setPrimaryLanguage] = useState<string>("");
  const [secondaryLanguages, setSecondaryLanguages] = useState<string>("");
  const [languageError, setLanguageError] = useState<string>("");
  const [isLanguageSaving, setIsLanguageSaving] = useState<boolean>(false);
  const [languageSuccessMessage, setLanguageSuccessMessage] = useState<string>("");

  // 通用错误消息状态
  const [errorMessage, setErrorMessage] = useState<string>("");

  // 获取用户资料（个人资料和通知设置）
  useEffect(() => {
    const authToken = localStorage.getItem("authToken") || "";
    if (!authToken) {
      console.error("No authentication token found.");
      setErrorMessage("认证信息丢失，请重新登录。");
      return;
    }

    // 获取个人资料和通知设置
    fetch("http://localhost:8000/profile", {
      method: "GET",
      credentials: "include", // 包含Cookies
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Token ${authToken}`, // 使用Token进行认证
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          const contentType = res.headers.get("Content-Type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await res.json();
            throw new Error(errorData.error || "未知错误");
          } else {
            const text = await res.text();
            throw new Error(`意外的响应格式: ${text}`);
          }
        }
        return res.json();
      })
      .then((data) => {
        // 设置用户资料
        setUsername(localStorage.getItem("username") || ""); // 从 localStorage 获取用户名
        setEmail(data.email || "");

        // 设置通知设置
        setEmailNotifications(data.email_notifications || false);
        setPushNotifications(data.push_notifications || false);

        // 设置语言设置
        setPrimaryLanguage(data.native_language || "");
        setSecondaryLanguages(data.preferred_languages.join(", ") || "");

        setErrorMessage("");
      })
      .catch((err) => {
        console.error("Error fetching profile:", err);
        setErrorMessage(err.message || "获取用户资料时出错");
      });
  }, []);

  // 处理语言设置保存
  const handleSaveLanguages = () => {
    if (isLanguageSaving) return; // 防止重复提交

    setIsLanguageSaving(true);
    setLanguageError("");
    setLanguageSuccessMessage("");

    const authToken = localStorage.getItem("authToken") || "";
    if (!authToken) {
      console.error("No authentication token found.");
      setLanguageError("认证信息丢失，请重新登录。");
      setIsLanguageSaving(false);
      return;
    }

    // 前端验证
    const validLanguageCodes = languageOptions.map((lang) => lang.code.toLowerCase());
    const primaryLangValid = validLanguageCodes.includes(primaryLanguage.toLowerCase());

    // 验证偏好语言格式
    const secondaryLangsArray = secondaryLanguages
      .split(",")
      .map((lang) => lang.trim().toLowerCase());
    const secondaryLangsValid = secondaryLangsArray.every((lang) =>
      validLanguageCodes.includes(lang)
    );

    if (!primaryLangValid || !secondaryLangsValid) {
      setLanguageError("请输入规范的偏好语言格式，例如：“en,zh-hans”。");
      setIsLanguageSaving(false);
      return;
    }

    const updatedData = {
      native_language: primaryLanguage,
      preferred_languages: secondaryLangsArray,
    };

    // 发送请求保存修改后的语言设置
    fetch("http://localhost:8000/profile", {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Token ${authToken}`,
      },
      body: JSON.stringify(updatedData),
    })
      .then(async (res) => {
        if (!res.ok) {
          const contentType = res.headers.get("Content-Type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await res.json();
            throw new Error(errorData.error || "未知错误");
          } else {
            const text = await res.text();
            throw new Error(`意外的响应格式: ${text}`);
          }
        }
        return res.json();
      })
      .then(() => {
        setLanguageSuccessMessage("语言设置已保存");
        setIsLanguageSaving(false);
      })
      .catch((err) => {
        console.error("Error saving languages:", err);
        setLanguageError("保存失败: " + (err.message || "未知错误"));
        setIsLanguageSaving(false);
      });
  };

  return (
    <div className="container mx-auto p-4">
      {/* 个人资料设置部分 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>Manage your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 用户名显示 */}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              readOnly
              placeholder="Username (Cannot be changed)"
            />
          </div>
          {/* 邮箱显示 */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              readOnly
              placeholder="Email (Cannot be changed)"
            />
          </div>
        </CardContent>
      </Card>

      {/* 通知设置部分 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>Manage your notification preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 邮件通知开关 */}
          <div className="flex items-center justify-between">
            <Label htmlFor="email-notifications">Email Notifications</Label>
            <Switch
              id="email-notifications"
              checked={emailNotifications}
              onCheckedChange={(checked) => setEmailNotifications(checked)}
            />
          </div>
          {/* 推送通知开关 */}
          <div className="flex items-center justify-between">
            <Label htmlFor="push-notifications">Push Notifications</Label>
            <Switch
              id="push-notifications"
              checked={pushNotifications}
              onCheckedChange={(checked) => setPushNotifications(checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* 语言设置部分 */}
      <Card>
        <CardHeader>
          <CardTitle>Language Settings</CardTitle>
          <CardDescription>Set your native and preferred languages</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 母语选择框 */}
          <div className="space-y-2">
          <Label htmlFor="native-language">Native Language</Label>
        <select
          id="native-language"
          value={primaryLanguage}
          onChange={(e) => setPrimaryLanguage(e.target.value)}
          className="w-full p-2 border rounded"
        >
          {languageOptions.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>

      {/* 偏好语言输入框 */}
      <div className="space-y-2">
        <Label htmlFor="preferred-languages">Preferred Languages</Label>
        <Input
          id="preferred-languages"
          type="text"
          value={secondaryLanguages}
          onChange={(e) => setSecondaryLanguages(e.target.value)}
          placeholder="Use comma to separate multiple languages"
        />
        {languageError && <p className="text-red-500 text-sm">{languageError}</p>}
        {languageSuccessMessage && <p className="text-green-500 text-sm">{languageSuccessMessage}</p>}
      </div>

      {/* 保存按钮 */}
      <Button onClick={handleSaveLanguages} disabled={isLanguageSaving}>
        {isLanguageSaving ? "Saving..." : "Save Languages"}
      </Button>
    </CardContent>
  </Card>
</div>
); };

export default SettingsPage;