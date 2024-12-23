"use client"; // 指定该文件为客户端组件

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext"; // 导入 useAuth 钩子v
import { useProject } from "@/context/ProjectContext";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

interface LanguageVersion {
    code: string;
    name: string;
    progress: number; // 翻译进度百分比
}

export default function LanguageVersions() {
    const { user, token } = useAuth(); 
    const { project, fetchProjectInfo } = useProject();
    const router = useRouter();
    const searchParams = useSearchParams();
    const projectName = searchParams.get("project") || "";
    const isAdmin = user?.role === "admin" || false;


    // （等后端API接口包含语言之后再用下面的函数）
    const [languageVersions, setLanguageVersions] = useState<LanguageVersion[]>([]);
    const [loading, setLoading] = useState(true);
    // 导出项目
    const handleExportProject = async (languageCode: string) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/export-project?project_name=${projectName}&language_id=${languageCode}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Token ${token}`, // 确保传递认证令牌
                },
            });
            if (response.ok) {
                // 获取响应中的文件内容
                const blob = await response.blob(); // 获取文件的 Blob 对象

                // 创建一个 URL 对象来引用该 Blob 对象
                const fileURL = URL.createObjectURL(blob);

                // 创建一个隐藏的下载链接并点击它来下载文件
                const link = document.createElement("a");
                link.href = fileURL;
                const filename = `${projectName}.${languageCode}.po`;
                link.download = filename; // 设置下载的文件名
                document.body.appendChild(link); // 必须将链接添加到 DOM 中
                link.click(); // 模拟点击下载
                document.body.removeChild(link); // 点击后移除链接
                URL.revokeObjectURL(fileURL); // 清理 URL 对象
                console.log("Project exported successfully");
            } else {
                console.error("Failed to export project");
            }
        } catch (error) {
            console.error("Error exporting project:", error);
        }
    };

    // 获取语言版本信息
    const fetchLanguageVersions = useCallback(async () => {
        if (!projectName) return;
        setLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/project-info?project_name=${encodeURIComponent(projectName)}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Token ${token}`, // 确保传递认证令牌
                },
            });
            if (response.ok) {
                // console.log("Project info fetched successfully");
                // console.log(response.json());
                const data = await response.json();
                // 确保返回的数据中包含 languages
                const languages = data.languages || [];
                // 映射语言版本
                const formattedLanguages = languages.map((lang: { language_code: string; selected_entries_ratio?: number }) => { // fix： selected_entries_ratio 为翻译进度
                    // 语言代码与名称的映射
                    const languageNames: { [key: string]: string } = {
                        "zh-hans": "Simplified Chinese",
                        "en": "English",
                        // 需要支持更多语言时可扩展
                    };

                    // 计算进度（假定翻译进度逻辑）
                    const progress = lang.selected_entries_ratio ? lang.selected_entries_ratio : 0;

                    return {
                        code: lang.language_code, // 语言代码
                        name: languageNames[lang.language_code] || lang.language_code, // 语言名称或回退到代码
                        progress, // 翻译进度
                    };
                });

                setLanguageVersions(formattedLanguages); // 设置格式化后的语言版本
                
            } else {
                console.error("Failed to fetch language versions");
            }
        } catch (error) {
            console.error("Error fetching language versions:", error);
        } finally {
            setLoading(false);
        }
    }, [projectName, project]);

    // 组件挂载时获取语言版本信息
    useEffect(() => {
        console.log("user: ", user);
        console.log("token: ", token);
        if(!token) return;
        fetchLanguageVersions();
    }, [fetchLanguageVersions]);

    /**
     * 启动翻译界面的函数
     * @param {string} languageCode - 目标语言代码
     */
    const handleStartTranslation = (languageCode: string) => {
        router.push(`/Entries?project_name=${encodeURIComponent(projectName)}&language_code=${encodeURIComponent(languageCode)}`);
    };

    /**
    * 跳转到项目页面
    */
    const handleProjectNavigation = () => {
        router.push("/projects");
    };

    // 跳转到社区页面
    const handleCommunityNavigation = () => {
        router.push(`/community-forum?project=${encodeURIComponent(projectName)}`);
        // router.push("/community-forum?project_name=${encodeURIComponent(projectName)}"); 
    };

    return (
        <div className="container mx-auto p-4">
            {/* 项目导航面包屑 */}
            <div className="flex items-center space-x-1 mb-6 text-sm text-gray-600">
                {/* Projects按钮 */}
                <Button
                    variant="link"
                    onClick={handleProjectNavigation}
                    className="text-gray-500 font-semibold"
                >
                    Projects
                </Button>
                {/* 分隔符 */}
                <span className="text-gray-400">/</span>
                {/* 当前项目按钮 */}
                <Button
                    variant="link"
                    className="font-semibold text-gray-800 hover:text-blue-700 focus:outline-none"
                >
                    {projectName}
                </Button>
            </div>


            {/* 项目标题和按钮容器 */}
            <div className="flex items-center justify-between mb-6">
                {/* 项目标题 */}
                <h1 className="text-3xl font-bold mb-6">
                    Language Versions - {projectName}
                </h1>

                {/* Community按钮（放在标题右侧） */}
                <Button
                    onClick={handleCommunityNavigation}
                    className="text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-600 rounded-md py-2 px-6 shadow-sm transition-all duration-200"
                >
                    Go to Community
                </Button>
            </div>


            {/* 加载状态显示 */}
            {loading ? (
                <p>Loading language versions...</p>
            ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {languageVersions.map((version) => (
                        <Card key={version.code} >
                            <CardHeader>
                                <div className="flex flex-row items-center justify-between pb-1">
                                <CardTitle>
                                    {version.name} ({version.code})
                                </CardTitle>
                                {isAdmin && ( // 如果用户是管理员，显示下拉菜单
                                    <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">Open menu</span> {/* 无障碍标签 */}
                                        <MoreVertical className="h-4 w-4" /> {/* 更多操作图标 */}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onSelect={() => handleExportProject(version.code)}> {/* 导出项目 */}
                                            Export Project {/* 导出项目 */}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                                </div>

                                <CardDescription>Progress in translation</CardDescription>
                                
                            </CardHeader>
                            <CardContent>
                                {/* 翻译进度条 */}
                                <Progress value={version.progress} className="mb-4" />
                                <p>{version.progress}% Completion</p>
                                {/* 启动翻译按钮 */}
                                <Button onClick={() => handleStartTranslation(version.code)} className="mt-4">
                                    Start Translation
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}