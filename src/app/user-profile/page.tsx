"use client";
import * as React from "react";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Globe } from "lucide-react";

// 定义语言选项
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

// 定义项目和用户资料的数据类型
type Project = {
  id: number;
  name: string;
  description: string;
};

type ProfileData = {
  id: number;
  role: string;
  bio: string;
  native_language: string;
  preferred_languages: string[] | null;
  accepted_entries: number;
  managed_projects: Project[];
  translated_projects: Project[];
  username: string;
  email: string;
};

export default function UserProfile() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // 编辑时的临时状态
  const [editBio, setEditBio] = useState("");
  const [editNativeLanguage, setEditNativeLanguage] = useState("");
  const [editPreferredLanguages, setEditPreferredLanguages] = useState<string[]>([]);

  // 错误消息状态
  const [errorMessage, setErrorMessage] = useState("");

  // 定义有效的语言代码列表
  const validLanguageCodes = languageOptions.map((lang) => lang.code.toLowerCase());

  // 颜色列表，用于头像背景（选择柔和的颜色）
  const avatarColors = [
    "#F44336", // 红色
    "#E91E63", // 粉色
    "#9C27B0", // 紫色
    "#673AB7", // 深紫
    "#3F51B5", // 印度蓝
    "#2196F3", // 蓝色
    "#03A9F4", // 浅蓝
    "#00BCD4", // 青色
    "#009688", // 青绿色
    "#4CAF50", // 绿色
    "#8BC34A", // 浅绿色
    "#CDDC39", // 黄绿色
    "#FFEB3B", // 黄色
    "#FFC107", // 琥珀色
    "#FF9800", // 橙色
    "#FF5722", // 深橙
    "#795548", // 棕色
    "#9E9E9E", // 灰色
    "#607D8B", // 蓝灰色
  ];

  // 根据用户名生成颜色
  const getAvatarColor = (username: string): string => {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % avatarColors.length;
    return avatarColors[index];
  };

  // 获取显示的首字母
  const getInitials = (username: string): string => {
    if (!username) return "";
    const names = username.trim().split(" ");
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    } else {
      return (
        names[0].charAt(0).toUpperCase() +
        names[names.length - 1].charAt(0).toUpperCase()
      );
    }
  };

  useEffect(() => {
    const authToken = localStorage.getItem("authToken") || "";
    if (!authToken) {
      console.error("No authentication token found.");
      setErrorMessage("认证信息丢失，请重新登录。");
      return;
    }

    // 获取用户资料
    fetch("http://localhost:8000/profile", {
      method: "GET",
      credentials: "include", // 包含Cookies
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${authToken}`, // 使用Token进行认证
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
      .then((data: ProfileData) => {
        setProfileData(data);
        setEditBio(data.bio || "");
        setEditNativeLanguage(data.native_language || "");
        setEditPreferredLanguages(data.preferred_languages || []);
        setErrorMessage(""); // 清除任何之前的错误消息
      })
      .catch((err) => {
        console.error("Error fetching profile:", err);
        setErrorMessage(err.message || "获取用户资料时出错");
      });
  }, []);

  const handleEdit = () => {
    setIsEditing(true);
    setErrorMessage(""); // 清除错误消息
  };

  const handleCancel = () => {
    if (profileData) {
      setEditBio(profileData.bio || "");
      setEditNativeLanguage(profileData.native_language || "");
      setEditPreferredLanguages(profileData.preferred_languages || []);
    }
    setIsEditing(false);
    setErrorMessage(""); // 清除错误消息
  };

  const handleSave = () => {
    if (!profileData) return;

    // 前端验证
    const nativeLangValid = validLanguageCodes.includes(
      editNativeLanguage.toLowerCase()
    );
    const preferredLangsValid = editPreferredLanguages.every((lang) =>
      validLanguageCodes.includes(lang.toLowerCase())
    );

    if (!nativeLangValid || !preferredLangsValid) {
      setErrorMessage("请输入规范的偏好语言格式，例如：“en,zh-hans”。");
      // 不发送请求到后端
      return;
    }

    const updatedData = {
      bio: editBio,
      native_language: editNativeLanguage.toLowerCase(),
      preferred_languages: editPreferredLanguages.map((lang) =>
        lang.toLowerCase()
      ),
    };

    const authToken = localStorage.getItem("authToken") || "";
    if (!authToken) {
      console.error("No authentication token found.");
      setErrorMessage("认证信息丢失，请重新登录。");
      return;
    }

    // 发送PUT请求更新用户资料
    fetch("http://localhost:8000/profile", {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${authToken}`,
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
      .then((data) => {
        setProfileData(data);
        setIsEditing(false);
        setErrorMessage(""); // 清除任何错误消息
      })
      .catch((err) => {
        console.error("Update failed:", err);
        setErrorMessage("保存失败: " + (err.message || "未知错误"));
        // 不重置输入字段，允许用户继续编辑
      });
  };

  if (!profileData) {
    return <div className="container mx-auto p-4">加载中...</div>;
  }

  // 处理头像背景颜色和显示的首字母
  const avatarColor = getAvatarColor(profileData.username);

  // 处理进度条
  function getAcceptedEntriesLevel(entries: number) {
    if (entries < 50) {
      return { level: "Bronze Medal", color: "bg-yellow-600" };
    } else if (entries < 200) {
      return { level: "Silver Medal", color: "bg-gray-400" };
    } else if (entries < 500) {
      return { level: "Gold Medal", color: "bg-yellow-500" };
    } else {
      return { level: "Diamond Medal", color: "bg-blue-600" };
    }
  }

  // 根据 accepted_entries 显示不同的徽章
  function getAcceptedEntriesBadge(entries: number) {
    if (entries < 50) {
      return <Badge className="bg-yellow-600 text-white">Bronze</Badge>;
    } else if (entries < 200) {
      return <Badge className="bg-gray-400 text-white">Silver</Badge>;
    } else if (entries < 500) {
      return <Badge className="bg-yellow-500 text-white">Gold</Badge>;
    } else {
      return <Badge className="bg-blue-600 text-white">Diamond</Badge>;
    }
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="w-24 h-24 flex-shrink-0">
            {/* 头像图片（如果有用户上传头像，可以替换路径） */}
            <AvatarImage
              src={
                profileData.username
                  ? `/avatars/${profileData.username}.png`
                  : "/placeholder.svg"
              }
              alt={profileData.username}
            />
            {/* 背景颜色和首字母显示 */}
            <AvatarFallback
              className="flex items-center justify-center bg-gray-500 text-white font-bold"
              style={{
                backgroundColor: avatarColor,
              }}
            >
              <span className="text-4xl">{getInitials(profileData.username)}</span>
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex flex-col">
              {/* 显示用户名 */}
              <CardTitle className="text-2xl font-bold">
                {profileData.username}
              </CardTitle>
              {/* 显示用户ID和邮箱 */}
              <CardDescription>User ID: {profileData.id}</CardDescription>
              <CardDescription>Email: {profileData.email}</CardDescription>
              {/* 显示徽章 */}
              <div className="flex items-center mt-2 text-sm text-muted-foreground space-x-2">
                <span>{getAcceptedEntriesBadge(profileData.accepted_entries)}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* 显示错误消息 */}
          {errorMessage && (
            <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
              {errorMessage}
            </div>
          )}

          <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-3 md:grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="languages">Languages</TabsTrigger>
              <TabsTrigger value="contributions">Contributions</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center mb-2">
                  <User className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Bio:</span>
                </div>
                {isEditing ? (
                  <textarea
                    className="border border-gray-300 p-2 rounded text-sm w-full"
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {profileData.bio}
                  </p>
                )}
              </div>
            </TabsContent>

            {/* Languages Tab */}
            <TabsContent value="languages" className="space-y-4">
              <div className="grid gap-4">
                {/* Native Language */}
                <div className="flex items-center mb-2">
                  <Globe className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Native Language:</span>
                </div>
                {isEditing ? (
                  <select
                    className="border border-gray-300 p-2 rounded text-sm w-full"
                    value={editNativeLanguage}
                    onChange={(e) => setEditNativeLanguage(e.target.value)}
                  >
                    <option value="">Select a language</option>
                    {languageOptions.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {`${lang.code} - ${lang.name}`}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {languageOptions.find(
                      (lang) => lang.code === profileData.native_language
                    )?.name || profileData.native_language}
                  </p>
                )}
              </div>

              <div className="grid gap-4">
                {/* Preferred Languages */}
                <div className="flex items-center mb-2">
                  <Globe className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Preferred Languages:</span>
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    className="border border-gray-300 p-2 rounded text-sm w-full"
                    placeholder="Use comma to separate multiple languages"
                    value={editPreferredLanguages.join(", ")}
                    onChange={(e) =>
                      setEditPreferredLanguages(
                        e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter((s) => s)
                      )
                    }
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {profileData.preferred_languages &&
                    profileData.preferred_languages.length > 0
                      ? profileData.preferred_languages
                          .map((code) => {
                            const lang = languageOptions.find(
                              (lang) => lang.code === code
                            );
                            return lang ? lang.name : code;
                          })
                          .join(", ")
                      : "None"}
                  </p>
                )}
              </div>
            </TabsContent>

            {/* Contributions Tab */}
            <TabsContent value="contributions" className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Accepted Entries:</span>
                  <span className="text-sm font-medium">
                    {profileData.accepted_entries}
                  </span>
                </div>

                {/* 进度条 */}
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                  <div
                    className={`h-2.5 rounded-full ${getAcceptedEntriesLevel(
                      profileData.accepted_entries
                    ).color}`}
                    style={{
                      width: `${(profileData.accepted_entries / 5000) * 100}%`,
                    }}
                  />
                </div>

                {/* Level 和 Level 信息 */}
                <div className="flex justify-end items-center">
                  <span className="text-sm font-medium mr-2">Level:</span>
                  <span className="text-sm font-medium">
                    {getAcceptedEntriesLevel(profileData.accepted_entries).level}
                  </span>
                </div>
              </div>
            </TabsContent>

            {/* Projects Tab */}
            <TabsContent value="projects" className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">To translate:</h3>
                {profileData.managed_projects.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No projects are waiting for translation yet.
                  </p>
                ) : (
                  profileData.managed_projects.map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm">{project.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {project.description}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium">In progress:</h3>
                {profileData.translated_projects.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No projects are being translated yet.
                  </p>
                ) : (
                  profileData.translated_projects.map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm">{project.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {project.description}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter>
          {isEditing ? (
            <div className="flex gap-4">
              <Button variant="secondary" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save</Button>
            </div>
          ) : (
            <Button onClick={handleEdit}>Edit Profile</Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
