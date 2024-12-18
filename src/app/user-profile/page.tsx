// src/app/user-profile/page.tsx

"use client";
import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import UserAvatar from "@/components/shared/UserAvatar";
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
import { User, Globe, ChevronRight, PieChart } from "lucide-react"; // Ensure ChevronRight and PieChart icons are imported
import Link from 'next/link'; // Import Link component
import ProjectCard from "@/components/shared/ProjectCard"; // Import ProjectCard component

// Define language options
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

// Define Project and ProfileData types
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

interface ActivityLog {
  id: number;
  project: string; // Project name
  user: string;
  action: string;
  timestamp: string;
  details: string;
}

export default function UserProfile() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // New state to track the active tab
  const [activeTab, setActiveTab] = useState<string>("overview");

  // Temporary states for editing
  const [editBio, setEditBio] = useState("");
  const [editNativeLanguage, setEditNativeLanguage] = useState("");
  const [editPreferredLanguages, setEditPreferredLanguages] = useState<string[]>([]);

  // Error message state
  const [errorMessage, setErrorMessage] = useState("");

  // Define valid language codes
  const validLanguageCodes = languageOptions.map((lang) => lang.code.toLowerCase());

  // Project activity logs state
  const [projectActivities, setProjectActivities] = useState<{ [projectName: string]: ActivityLog[] }>({});

  // Function to fetch activity logs
  const fetchActivityLogs = useCallback(async (projectName: string, authToken: string): Promise<ActivityLog[]> => {
    try {
      const response = await fetch(
        `http://localhost:8000/activity_logs?project_name=${encodeURIComponent(projectName)}&page_length=3&ordering=desc`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${authToken}`, // Use Token for authentication
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.results;
      } else {
        console.error(`Failed to fetch activities for project ${projectName}`);
        return [];
      }
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      return [];
    }
  }, []);

  useEffect(() => {
    const authToken = localStorage.getItem("authToken") || "";
    if (!authToken) {
      console.error("No authentication token found.");
      setErrorMessage("认证信息丢失，请重新登录。");
      return;
    }

    // Fetch user profile
    fetch("http://localhost:8000/profile", {
      method: "GET",
      credentials: "include", // Include Cookies
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${authToken}`, // Use Token for authentication
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
      .then(async (data: ProfileData) => {
        setProfileData(data);
        setEditBio(data.bio || "");
        setEditNativeLanguage(data.native_language || "");
        setEditPreferredLanguages(data.preferred_languages || []);
        setErrorMessage(""); // Clear any previous error messages

        // Combine all projects
        const allProjects = [...data.managed_projects, ...data.translated_projects];

        // Fetch activity logs for each project
        const activitiesPromises = allProjects.map(async (project) => {
          const activities = await fetchActivityLogs(project.name, authToken);
          return { projectName: project.name, activities };
        });

        const activitiesResults = await Promise.all(activitiesPromises);

        // Build the projectActivities map
        const activitiesMap: { [projectName: string]: ActivityLog[] } = {};
        activitiesResults.forEach(({ projectName, activities }) => {
          activitiesMap[projectName] = activities;
        });

        setProjectActivities(activitiesMap);
      })
      .catch((err) => {
        console.error("Error fetching profile:", err);
        setErrorMessage(err.message || "获取用户资料时出错");
      });
  }, [fetchActivityLogs]);

  const handleEdit = () => {
    setIsEditing(true);
    setErrorMessage(""); // Clear error message
  };

  const handleCancel = () => {
    if (profileData) {
      setEditBio(profileData.bio || "");
      setEditNativeLanguage(profileData.native_language || "");
      setEditPreferredLanguages(profileData.preferred_languages || []);
    }
    setIsEditing(false);
    setErrorMessage(""); // Clear error message
  };

  const handleSave = () => {
    if (!profileData) return;

    // Frontend validation
    const nativeLangValid = validLanguageCodes.includes(editNativeLanguage.toLowerCase());
    const preferredLangsValid = editPreferredLanguages.every((lang) =>
      validLanguageCodes.includes(lang.toLowerCase())
    );

    if (!nativeLangValid || !preferredLangsValid) {
      setErrorMessage("请输入规范的偏好语言格式，例如：“en,zh-hans”。");
      // Do not send request to backend
      return;
    }

    const updatedData = {
      bio: editBio,
      native_language: editNativeLanguage.toLowerCase(),
      preferred_languages: editPreferredLanguages.map((lang) => lang.toLowerCase()),
    };

    const authToken = localStorage.getItem("authToken") || "";
    if (!authToken) {
      console.error("No authentication token found.");
      setErrorMessage("认证信息丢失，请重新登录。");
      return;
    }

    // Send PUT request to update user profile
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
      .then(async (data: ProfileData) => {
        setProfileData(data);
        setIsEditing(false);
        setErrorMessage(""); // Clear any error messages

        // Update project activity logs
        const allProjects = [...data.managed_projects, ...data.translated_projects];
        const activitiesPromises = allProjects.map(async (project) => {
          const activities = await fetchActivityLogs(project.name, authToken);
          return { projectName: project.name, activities };
        });

        const activitiesResults = await Promise.all(activitiesPromises);
        const activitiesMap: { [projectName: string]: ActivityLog[] } = {};
        activitiesResults.forEach(({ projectName, activities }) => {
          activitiesMap[projectName] = activities;
        });

        setProjectActivities(activitiesMap);
      })
      .catch((err) => {
        console.error("Update failed:", err);
        setErrorMessage("保存失败: " + (err.message || "未知错误"));
        // Do not reset input fields, allow user to continue editing
      });
  };

  if (!profileData) {
    return <div className="container mx-auto p-4">加载中...</div>;
  }

  // Handle progress bar
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

  // Display different badges based on accepted_entries
  function getAcceptedEntriesBadge(entries: number) {
    if (entries < 50) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-300 inline-flex items-center">
          Bronze
        </Badge>
      );
    } else if (entries < 200) {
      return (
        <Badge className="bg-gray-100 text-gray-800 border border-gray-300 inline-flex items-center">
          Silver
        </Badge>
      );
    } else if (entries < 500) {
      return (
        <Badge className="bg-yellow-200 text-yellow-900 border border-yellow-400 inline-flex items-center">
          Gold
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-blue-100 text-blue-800 border border-blue-300 inline-flex items-center">
          Diamond
        </Badge>
      );
    }
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="flex flex-row items-center gap-4">
          {/* Use shared UserAvatar component */}
          <UserAvatar username={profileData.username} size="lg" />
          <div className="flex-1">
            <div className="flex flex-col">
              {/* Display username and badge */}
              <div className="flex items-center">
                <CardTitle className="text-2xl font-bold">
                  {profileData.username}
                </CardTitle>
                <span className="ml-2">
                  {getAcceptedEntriesBadge(profileData.accepted_entries)}
                </span>
              </div>
              {/* Display User ID and Email */}
              <CardDescription>User ID: {profileData.id}</CardDescription>
              <CardDescription>Email: {profileData.email}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Display error message */}
          {errorMessage && (
            <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
              {errorMessage}
            </div>
          )}

          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value)}
            defaultValue="overview"
          >
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="contributions">Contributions</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              {/* Languages Tab has been removed */}
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4 mt-6">
              <div className="grid gap-4">
                {/* Bio */}
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

                {/* Native Language */}
                <div className="flex items-center mb-2 mt-4">
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

                {/* Preferred Languages */}
                <div className="flex items-center mb-2 mt-4">
                  <Globe className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Preferred Languages:</span>
                </div>
                {isEditing ? (
                  <div className="flex flex-col gap-2">
                    {languageOptions.map((lang) => (
                      <label key={lang.code} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={editPreferredLanguages.includes(lang.code)}
                          onChange={(e) => {
                            const isChecked = e.target.checked;
                            setEditPreferredLanguages((prev) =>
                              isChecked
                                ? [...prev, lang.code]
                                : prev.filter((code) => code !== lang.code)
                            );
                          }}
                        />
                        <span>{`${lang.code} - ${lang.name}`}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {profileData.preferred_languages && profileData.preferred_languages.length > 0
                      ? profileData.preferred_languages
                          .map((code) => {
                            const lang = languageOptions.find((lang) => lang.code === code);
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

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                  <div
                    className={`h-2.5 rounded-full ${getAcceptedEntriesLevel(
                      profileData.accepted_entries
                    ).color}`}
                    style={{
                      width: `${Math.min((profileData.accepted_entries / 5000) * 100, 100)}%`,
                    }}
                  />
                </div>

                {/* Level and Level Info */}
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
              {Object.keys(projectActivities).length === 0 ? (
                <p className="text-sm text-gray-500">No project activities available.</p>
              ) : (
                Object.entries(projectActivities).map(([projectName, activities]) => (
                  <ProjectCard key={projectName} projectName={projectName} activities={activities} />
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter>
          {activeTab === "overview" && (
            isEditing ? (
              <div className="flex gap-4">
                <Button variant="secondary" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>Save</Button>
              </div>
            ) : (
              <Button onClick={handleEdit}>Edit Profile</Button>
            )
          )}
        </CardFooter>
      </Card>
    </div>
  );
}