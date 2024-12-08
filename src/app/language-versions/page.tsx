"use client"; // 指定该文件为客户端组件

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext"; // 导入 useAuth 钩子v
import { useProject } from "@/context/ProjectContext";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft } from "lucide-react";

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


    // （等后端API接口包含语言之后再用下面的函数）
    const [languageVersions, setLanguageVersions] = useState<LanguageVersion[]>([]);
    const [loading, setLoading] = useState(true);
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
        fetchLanguageVersions();
    }, [fetchLanguageVersions]);

    /**
     * 启动翻译界面的函数
     * @param {string} languageCode - 目标语言代码
     */
    const handleStartTranslation = (languageCode: string) => {
        router.push(`/Entries?project_name=${encodeURIComponent(projectName)}&language_code=${encodeURIComponent(languageCode)}`);
    };

    return (
        <div className="container mx-auto p-4">
            {/* 返回按钮 */}
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to the project
            </Button>

            {/* 项目标题 */}
            <h1 className="text-2xl font-bold mb-6">Language Versions - {projectName}</h1>

            {/* 加载状态显示 */}
            {loading ? (
                <p>Loading language versions...</p>
            ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {languageVersions.map((version) => (
                        <Card key={version.code}>
                            <CardHeader>
                                <CardTitle>
                                    {version.name} ({version.code})
                                </CardTitle>
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
