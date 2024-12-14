'use client';
import * as React from "react";
import { PieChart } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import UserAvatar from "@/components/shared/UserAvatar"; // 引入 UserAvatar 组件

/**
 * 定义语言版本的接口
 */
interface LanguageVersion {
  code: string;
  name: string;
  progress: number;
}

/**
 * 定义活动日志的接口
 */
interface ActivityLog {
  id: number;
  project: string; // 项目名称
  user: string;
  action: string;
  timestamp: string;
  details: string;
}

const Dashboard: React.FC = () => {
  const [translationProgress, setTranslationProgress] = React.useState<number>(0);
  const [activeProjectsCount, setActiveProjectsCount] = React.useState<number>(0);
  const [languageVersions, setLanguageVersions] = React.useState<LanguageVersion[]>([]);
  const [recentActivities, setRecentActivities] = React.useState<ActivityLog[]>([]); // 新增状态变量
  const [projectActivities, setProjectActivities] = React.useState<{ [projectName: string]: ActivityLog[] }>({}); // 新增状态变量
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  // 从 localStorage 获取 Token
  const token = React.useMemo(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  }, []);

  /**
   * 获取用户的 Profile 信息，包括 managed_projects 和 translated_projects
   */
  const fetchProfile = React.useCallback(async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/profile`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Token ${token}` : '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      } else if (response.status === 401) {
        console.error("Unauthorized: Invalid or missing token.");
        setError("Unauthorized: Please log in again.");
        return null;
      } else {
        console.error("Failed to fetch profile");
        setError("Failed to fetch profile.");
        return null;
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setError("Error fetching profile.");
      return null;
    }
  }, [token]);

  /**
   * 获取项目的语言版本信息
   */
  const fetchLanguageVersions = React.useCallback(async (projectName: string): Promise<LanguageVersion[] | null> => {
    if (!projectName) return null;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/project-info?project_name=${encodeURIComponent(projectName)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Token ${token}` : '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const languages = data.languages || [];
        const languageVersions: LanguageVersion[] = languages.map((lang: { language_code: string; selected_entries_ratio?: number }) => {
          // 语言代码与名称的映射
          const languageNames: { [key: string]: string } = {
            "zh-hans": "Simplified Chinese",
            "en": "English",
            // 需要支持更多语言时可扩展
          };

          // 计算进度（假定 selected_entries_ratio 已经是百分比 0-100）
          const progress = typeof lang.selected_entries_ratio === 'number' ? lang.selected_entries_ratio : 0;

          return {
            code: lang.language_code, // 语言代码
            name: languageNames[lang.language_code] || lang.language_code, // 语言名称或回退到代码
            progress, // 翻译进度
          };
        });

        return languageVersions;
      } else if (response.status === 401) {
        console.error("Unauthorized: Invalid or missing token.");
        setError("Unauthorized: Please log in again.");
        return null;
      } else {
        console.error("Failed to fetch language versions");
        setError("Failed to fetch language versions.");
        return null;
      }
    } catch (error) {
      console.error("Error fetching language versions:", error);
      setError("Error fetching language versions.");
      return null;
    }
  }, [token]);

  /**
   * 获取所有项目的活动日志
   * @param projectName 项目名称
   */
  const fetchActivityLogs = React.useCallback(async (projectName: string): Promise<ActivityLog[]> => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/activity_logs?project_name=${encodeURIComponent(projectName)}&page_length=3&ordering=desc`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Token ${token}` : '',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.results;
      } else if (response.status === 401) {
        console.error("Unauthorized: Invalid or missing token.");
        setError("Unauthorized: Please log in again.");
        return [];
      } else {
        console.error(`Failed to fetch activities for project ${projectName}`);
        setError(`Failed to fetch activities for project ${projectName}.`);
        return [];
      }
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      setError("Error fetching activity logs.");
      return [];
    }
  }, [token]);

  /**
   * 初始化仪表板数据
   */
  const initializeDashboard = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const profileData = await fetchProfile();
    if (profileData) {
      const managed = Array.isArray(profileData.managed_projects) ? profileData.managed_projects : [];
      const translated = Array.isArray(profileData.translated_projects) ? profileData.translated_projects : [];
      const projects = [...managed, ...translated];

      // 计算唯一项目数
      const uniqueProjectIds = new Set(projects.map((p: any) => p.id).filter((id: any) => id));
      const uniqueProjectCount = uniqueProjectIds.size;
      setActiveProjectsCount(uniqueProjectCount);

      if (uniqueProjectCount === 0) {
        // 用户没有任何项目则翻译进度为0%
        setTranslationProgress(0);
        setLoading(false);
        return;
      }

      // 获取所有项目的语言版本信息
      const languageVersionsArray = await Promise.all(
        projects.map(async (proj: any) => {
          const projectName = (proj && typeof proj.name === 'string') ? proj.name : '';
          if (!projectName) {
            return null;
          }
          return await fetchLanguageVersions(projectName);
        })
      );

      // 合并所有语言版本信息，去除 null
      const allLanguageVersions: LanguageVersion[] = languageVersionsArray
        .flat()
        .filter((lang): lang is LanguageVersion => lang !== null);

      setLanguageVersions(allLanguageVersions);

      // 计算总翻译进度（取所有语言进度的平均值）
      if (allLanguageVersions.length > 0) {
        const totalProgress = allLanguageVersions.reduce((sum: number, lang: LanguageVersion) => sum + lang.progress, 0);
        const averageProgress = totalProgress / allLanguageVersions.length; // 假设 selected_entries_ratio 已是 0-100
        setTranslationProgress(averageProgress);
      } else {
        setTranslationProgress(0);
      }

      // 获取所有项目的活动日志
      const activitiesPromises = projects.map(async (proj: any) => {
        const projectName = (proj && typeof proj.name === 'string') ? proj.name : '';
        if (!projectName) {
          return { projectName: '', activities: [] };
        }
        const activities = await fetchActivityLogs(projectName);
        return { projectName, activities };
      });

      const activitiesResults = await Promise.all(activitiesPromises);

      // 合并所有活动日志，并附加项目名称
      const allActivities: ActivityLog[] = activitiesResults
        .filter(result => result.projectName)
        .flatMap(result => result.activities.map(activity => ({ ...activity, project: result.projectName })));

      // 按时间排序，取最新的三条
      const sortedActivities = allActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const latestThreeActivities = sortedActivities.slice(0, 3);

      setRecentActivities(latestThreeActivities);

      // 设置每个项目的最近三个活动
      const projectActivitiesMap = activitiesResults.reduce((acc, { projectName, activities }) => {
        if (projectName) {
          acc[projectName] = activities.slice(0, 3);
        }
        return acc;
      }, {} as { [projectName: string]: ActivityLog[] });

      setProjectActivities(projectActivitiesMap);
    }
    setLoading(false);
  }, [fetchProfile, fetchLanguageVersions, fetchActivityLogs]);

  React.useEffect(() => {
    initializeDashboard();
  }, [initializeDashboard]);

  const displayProgress = Number.isFinite(translationProgress) ? translationProgress.toFixed(2) : '0.00';

  return (
    <div>
      {/* 错误提示 */}
      {error && <p className="text-red-500">{error}</p>}

      {/* 加载状态 */}
      {loading && <p>Loading...</p>}

      {/* 仪表板的主要内容区域 */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* 翻译进度卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>Translation Progress</CardTitle>
            <CardDescription>Overall progress across all projects</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={Number.isFinite(translationProgress) ? translationProgress : 0} className="w-full" />
            <p className="mt-2 text-sm text-gray-600">{displayProgress}% Complete</p>
          </CardContent>
        </Card>

        {/* 活跃项目数卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>Active Projects</CardTitle>
            <CardDescription>Currently active translation projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeProjectsCount}</div>
            <p className="text-sm text-gray-600">Active projects you're involved in</p>
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

      {/* 动态获取的 Recent Activities 卡片 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
          <CardDescription>Latest updates across all your projects</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {recentActivities.length === 0 ? (
              <p className="text-sm text-gray-500">No recent activities available.</p>
            ) : (
              recentActivities.map((activity) => (
                <li key={activity.id} className="flex items-center">
                  <UserAvatar
                    username={activity.user}
                    size="sm"
                  />
                  <div className="ml-4">
                    <p className="text-sm font-medium">
                      <span className="font-semibold">{activity.user}</span> {activity.action} in <span className="font-semibold">{activity.project}</span>
                    </p>
                    <p className="text-sm text-gray-500">{activity.details}</p>
                    <p className="text-sm text-gray-400">{new Date(activity.timestamp).toLocaleString()}</p>
                  </div>
                </li>
              ))
            )}
          </ul>
        </CardContent>
      </Card>

      {/* 保留并完善的 Project Activities 卡片 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Project Activities</CardTitle>
          <CardDescription>Recent updates for each of your projects</CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(projectActivities).length === 0 ? (
            <p className="text-sm text-gray-500">No project activities available.</p>
          ) : (
            Object.entries(projectActivities).map(([projectName, activities]) => (
              <div key={projectName} className="mb-4">
                <h3 className="text-lg font-semibold mb-2">{projectName}</h3>
                {activities.length === 0 ? (
                  <p className="text-sm text-gray-500">No recent activities.</p>
                ) : (
                  <ul className="space-y-2">
                    {activities.map((activity) => (
                      <li key={activity.id} className="flex items-start">
                        <PieChart className="mt-1 mr-2 h-5 w-5 text-gray-500" />
                        <div>
                          <p className="text-sm">
                            <span className="font-semibold">{activity.user}</span> {activity.action}
                          </p>
                          <p className="text-xs text-gray-400">{new Date(activity.timestamp).toLocaleString()}</p>
                          <p className="text-xs text-gray-500">{activity.details}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
