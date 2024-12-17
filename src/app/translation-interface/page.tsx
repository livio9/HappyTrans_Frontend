// translation-interface.tsx
// 提供一个翻译工作界面，允许用户查看源文本、编辑翻译、导航翻译条目，以及使用翻译建议。

"use client"; // 指定该文件为客户端组件，确保在客户端渲染

import * as React from "react";
import { Button } from "@/components/ui/button"; // 导入自定义按钮组件
import { Textarea } from "@/components/ui/textarea"; // 导入自定义多行文本输入组件
import { Progress } from "@/components/ui/progress"; // 导入自定义进度条组件
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // 导入自定义卡片组件
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // 导入自定义标签页组件
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Copy } from "lucide-react"; // 导入图标组件
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"; // 导入自定义对话框组件
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // 导入自定义单选按钮组组件
import { Label } from "@/components/ui/label"; // 导入自定义标签组件
import { useAuth } from "@/context/AuthContext"; // 导入用户上下文钩子
import { useProject } from "@/context/ProjectContext";  // 导入项目上下文钩子
import { useSearchParams ,useRouter} from "next/navigation";// 导入路由钩子和查询参数钩子
import { useState, useEffect, useRef, useMemo } from 'react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar"; // 导入自定义头像组件
import { Badge } from "@/components/ui/badge"; // 导入自定义徽章组件
import { motion } from 'framer-motion';
import { Separator } from "@/components/ui/separator"; // 导入自定义分隔符组件
import { ScrollArea } from "@/components/ui/scroll-area"; // 导入自定义滚动区域组件
import { formatDistanceToNow } from 'date-fns'
import { FixedSizeList as List } from "react-window"; // 导入固定大小列表组件,虚拟窗口提升性能

// Remove the misplaced CSS rule

// 辅助函数：从 Cookie 中获取 CSRF token
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(";").shift() || null;
  }
  return null;
}
// 定义翻译消息的类型, 与Entries中的基本一致，在这里不做详细注解
type msgstr = {
  msg: string;
  timestamp: string;
  user_id: string;
  id: string;
};

type Entry = {
  comments: string; // 注释
  extracted_comments: string; // 提取的注释
  flags: string; 
  msgctxt: string | null; // 上下文
  idx_in_language: number; // 索引
  msgid: string;  // 源文本
  msgid_plural: string; // 复数形式的源文本
  msgstr: msgstr[]; // 翻译文本
  msgstr_plural: string; // 复数形式的翻译文本
  updated_at: string; // 更新时间
  selected_msgstr_index: number; // 选择的翻译文本索引
  references: string; // 引用
  tag: [string]; // 标签
};

type LanguageData = {
  language_code: string;
  entries: Entry[];
};

type Entries = {
  project: string;
  languages: LanguageData[];
};

type EntryData = { // 定义附近字符串的返回数据类型
  project: string;
  entries: {
    previous: { [languageCode: string]: Entry } | null; // 前一个entry
    current: { [languageCode: string]: Entry }; // 当前entry
    next: { [languageCode: string]: Entry } | null; // 下一个entry
  };
};

// 定义翻译建议的类型
type TranslationSuggestion = {
  source: string; // 建议来源（如 DeepL、Google Translate）
  translation: string; // 建议的翻译文本
};

type Feedback = {
  id: number;
  title: string;
  user_seen_translation: string;
  user_expected_translation: string;
  remarks: string;
  created_at: string;
  project_name: string;
  language_code: string;
  idx_in_language: number;
}


function FeedbackItem({ feedback }: { feedback: Feedback }) {
  function formatTitle(title: string): string {
    const trimmedTitle = title.trim();
    const maxLength = 30;
    return trimmedTitle.length > maxLength
      ? `${trimmedTitle.slice(0, maxLength)}...`
      : trimmedTitle.charAt(0).toUpperCase() + trimmedTitle.slice(1).toLowerCase();
  }
  return (
    <motion.div
      key={feedback.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="mb-4 overflow-hidden border-l-4 border-l-primary">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback>{"t".toUpperCase()}</AvatarFallback>
              </Avatar>
              <CardTitle className="text-base font-semibold text-primary flex items-center space-x-2">
                <span>{formatTitle(feedback.title || "Untitled Feedback")}</span>
              </CardTitle>
            </div>
            <Badge variant="outline" className="text-xs">
              {formatDistanceToNow(new Date(feedback.created_at), { addSuffix: true })}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Seen translation:</p>
              <p className="bg-muted p-2 rounded-md">{feedback.user_seen_translation}</p>
            </div>
            <Separator />
            <div>
              <p className="text-muted-foreground mb-1">Expected translation:</p>
              <p className="bg-muted p-2 rounded-md">{feedback.user_expected_translation}</p>
            </div>
            <Separator />
            <div>
              <p className="text-muted-foreground mb-1">Remarks:</p>
              <p className="italic">{feedback.remarks}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function TranslationInterface() {

  const router = useRouter();//用于跳转
  const searchParams = useSearchParams();
  // 从 URL 获取参数
  const projectName = searchParams.get("project_name"); // 获取项目名称
  const languageCode = searchParams.get("language_code"); // 获取语言代码
  const indexParam = searchParams.get("idx_in_language"); // 获取索引参数
  const index1 = indexParam ? parseInt(indexParam) : 0; // 将索引参数转换为数字
  // const index1 = searchParams.get("idx_in_language");

  const { user, token, projectInProcess} = useAuth(); // 使用用户上下文获取当前用户
  const { project } = useProject(); // 使用项目上下文获取当前项目
  console.log("fetching project from useProject", project);
  
  const [currentIndex, setCurrentIndex] = useState(index1); // 使用初始的 index1
  const [strings, setStrings] = useState<Entry[]>([]); // 动态获取的翻译条目
  const [nearbyStrings, setNearbyStrings] = useState<(Entry | null)[]>([]); // 存储附近的字符串
  const [otherLanguagesEntry, setOtherLanguagesEntry] = useState<{ languageCode: string; entry: Entry }[]>([]); // 其他语言的词条
  const [currentTranslation, setCurrentTranslation] = useState<string>(""); // 当前文本框内容

  const [languageprocess, setLanguageProcess] = useState(0); // 进度条进度

  const [suggestions, setSuggestions] = React.useState<TranslationSuggestion[]>([]); // 翻译建议
  const [selectedSuggestion, setSelectedSuggestion] = React.useState(""); // 选定的翻译建议
  const [isSuggestDialogOpen, setIsSuggestDialogOpen] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);




  // 对于某个特定词条管理员从历史记录中选择翻译结果
  const [showSelectDialog, setShowSelectDialog] = useState(false); // 控制弹窗显示
  const [selectedMsgstrID, setSelectedMsgstrID] = useState<string>(""); // 选定的 msgstr
  
  const fetchedEntries = useRef(false); // 标记 entries 是否已加载，用来避免多次请求

  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);

  const [sourceLanguage, setSourceLanguage] = useState<string>("en"); // 源语言


  useEffect(() => {
    console.log("useEffect triggered", { projectName, languageCode, index1, strings, currentIndex });
  
    if (projectName && languageCode) { // 确保项目名称和语言代码存在
      const fetchProjectData = async () => {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/project?name=${encodeURIComponent(projectName)}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${token}`,
              },
            }
          );
  
          if (!response.ok) {
            throw new Error("Failed to fetch project data");
          }
          const data = await response.json();
          console.log("Fetched project data:", data);
          setSourceLanguage(data.source_language); // 设置源语言
        } catch (error) {
          console.error("Error fetching project data:", error);
        }
      }
      // 获取词条数据
      const fetchEntriesData = async () => {
        console.log("Fetching entries data...");
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/entries?project_name=${encodeURIComponent(
              projectName
            )}&language_code=${encodeURIComponent(languageCode)}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${token}`,
              },
            }
          );
  
          if (!response.ok) {
            throw new Error("Failed to fetch entries data");
          }
          const data: Entries = await response.json();
          console.log("Fetched entries data:", data);
  
          const languageData = data.languages.find(
            (language) => language.language_code === languageCode
          );
  
          if (languageData) {
            console.log("Found language data:", languageData);
            setStrings(languageData.entries); // 更新 strings为获取的词条数据
          } else {
            console.log(`No language data found for ${languageCode}`);
          }
        } catch (error) {
          console.error("Error fetching entries data:", error);
        }
      };

      // 仅在 entries 数据未加载时获取
      if (!fetchedEntries.current) {
        fetchEntriesData(); // 立即调用
        fetchedEntries.current = true; // 防止再次请求
      }

      // 获取相邻词条数据
      const fetchEntryData = async () => { 
        console.log("Fetching entry data for idx_in_language:", currentIndex);
  
        if (strings.length > 0 && currentIndex < strings.length) {
          try {
            const response = await fetch(
              `${process.env.NEXT_PUBLIC_API_BASE_URL}/entry?project_name=${encodeURIComponent(
                projectName
              )}&index=${encodeURIComponent(
                currentIndex
              )}`,
              {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Token ${token}`,
                },
              }
            );
  
            if (!response.ok) {
              throw new Error("Failed to fetch entry data");
            }
            const data: EntryData = await response.json();
            console.log("Fetched entry data:", data);
  
            const { previous, current, next } = data.entries; // 解构赋值
            console.log("successfuly fetched entry data");
            console.log("Previous, current, next entries:", { previous, current, next });

            const currentOtherLanguagesEntry = Object.entries(current).map(([languageCode, entry]) => ({ languageCode, entry }));
            
            setOtherLanguagesEntry(currentOtherLanguagesEntry); // 设置其他语言词条
            console.log("Other languages entries:", otherLanguagesEntry);
            setNearbyStrings([ // 设置附近字符串
              previous?.[languageCode] || null,
              current[languageCode],
              next?.[languageCode] || null, 
            ]);
            console.log("Nearby strings:", nearbyStrings);
          } catch (error) {
            console.error("Error fetching entry data:", error);
          }
        } else {
          console.log("No entries or invalid currentIndex for fetching entry data.");
        }
      };

      // 确保 `strings` 已经加载，才能获取当前词条数据
      if (strings.length > 0 && currentIndex >= 0) {
        console.log("Strings loaded, fetching entry data...");
        fetchEntryData();
      }
  
      // 获取并设置当前翻译文本
      if (strings.length > 0 && currentIndex < strings.length) { // 确保 strings 已加载且 currentIndex 有效
        const currentEntry = strings[currentIndex]; // 获取当前词条
        console.log("Current entry:", currentEntry);
        length = currentEntry?.msgstr.length; 
        setCurrentTranslation(currentEntry?.msgstr[currentEntry.selected_msgstr_index]?.msg || ""); // 设置当前翻译文本，若不存在被选中的翻译文本则为空
      } else {
        console.log("Strings not yet loaded or currentIndex is invalid.");
      }

      // 设置进度条进度
      const fetchLanguageInfo = async () => {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/language-info?project_name=${encodeURIComponent(
              projectName
            )}&language_code=${encodeURIComponent(languageCode)}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${token}`,
              },
            }
          );
  
          if (!response.ok) {
            throw new Error("Failed to fetch language info");
          }
          const data = await response.json();
          console.log("Fetched language info:", data);
          setLanguageProcess(data.selected_entries_ratio); // 设置进度条进度
        } catch (error) {
          console.error("Error fetching language info:", error);
        }
      };

      
      fetchLanguageInfo(); // 获取语言信息，主要目的是获取翻译进度

      // 获取反馈信息
      const fetchFeedback = async () => {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/feedbacks/by_entry?project_name=${encodeURIComponent(
              projectName
            )}&language_code=${encodeURIComponent(languageCode)}&idx_in_language=${currentIndex}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${token}`,
              },
            }
          );
  
          if (!response.ok) {
            throw new Error("Failed to fetch feedback");
          }
          const data = await response.json();
          console.log("Fetched feedback:", data);
          setFeedbacks(data.results); // 设置反馈信息
        } catch (error) {
          console.error("Error fetching feedback:", error);
        }
      };

      fetchFeedback(); // 获取反馈信息
      


    } else {
      console.log("Project name or language code is missing");
    }
  }, [projectName, languageCode, currentIndex, strings]); // 依赖 currentIndex 和 strings，确保数据更新后执行


  //判断用户是否有权限翻译
  console.log("user.managed_projects:", user?.managed_projects);
  const canTranslate =   (user && projectName && (projectInProcess?.includes(projectName)));


  // 处理保存翻译结果
  // 发送翻译更新请求
  const updateTranslation = async (newTranslation: string) => {
    const csrfToken = getCookie("csrftoken"); // 获取 CSRF token

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/update-entry?index=${currentIndex}&language_code=${languageCode}&msgstr=${encodeURIComponent(newTranslation)}&project_name=${projectName}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
            "X-CSRFTOKEN": csrfToken || "", // 添加 CSRF token
          },
        }
      );
  
      if (!response.ok) {
        throw new Error("Failed to update translation");
      }

      console.log("Translation updated successfully");
    } catch (error) {
      console.error("Error updating translation:", error);
    }
  };

  // 处理保存并跳转到下一个词条
  const handleSaveAndContinue = async () => {
    await updateTranslation(currentTranslation); // 保存当前翻译
    setCurrentIndex(currentIndex + 1); // 跳转到下一个词条
    router.push(`/translation-interface?project_name=${projectName}&language_code=${languageCode}&idx_in_language=${currentIndex + 2}`); // 使用router跳转
  };

  // 处理保存但不跳转
  const handleSaveAndStay = async () => {
    await updateTranslation(currentTranslation); // 保存当前翻译
  };

// 关于翻译建议的处理，现在还会实现相关功能。
  // 处理翻译建议
  const handleSuggest = async () => {
    setIsLoadingSuggestions(true);
    try {
      console.log("Fetching translation suggestions...");
      console.log("Current index:", currentIndex);
      console.log("Current string:", strings[currentIndex]?.msgid);
      console.log("Current language code:", languageCode);
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify({
          projectName: projectName,
          idx_in_project: currentIndex,
          // sourceLanguage: project.source_language,
          sourceLanguage: sourceLanguage, // 源语言为英文
          text: strings[currentIndex]?.msgid || '',
          // text: "Hello, world!", // 传递源文本
          targetLanguage: languageCode, // 根据需要调整目标语言，DeepL 需要大写
          // targetLanguage: "zh-CHS", // 目标语言为中文
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '获取翻译建议失败');
      }
  
      const data = await response.json();
  
      setSuggestions(data.suggestions); // 设置多个翻译建议
      setIsSuggestDialogOpen(true); // 打开 Dialog
    } catch (error) {
      console.error('获取翻译建议时出错:', error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };
  
  
  const handleSelectSuggestion = () => {
    if (selectedSuggestion) {
      setCurrentTranslation(selectedSuggestion);
      setIsSuggestDialogOpen(false);
    }
  };
  


  // 管理员选择某一翻译作为最终结果
  // 新的 select-msgstr API 调用函数
  const selectMsgstr = async (id: string) => {
    try {
      const csrfToken = getCookie("csrftoken"); // 获取 CSRF token
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/select-msgstr?entry_index=${currentIndex}&language_code=${languageCode}&msgstr_index=${encodeURIComponent(id)}&project=${projectName}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
            "X-CSRFTOKEN": csrfToken || "", // 添加 CSRF token
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to select msgstr");
      }
      console.log("msgstr selected successfully");
    } catch (error) {
      console.error("Error selecting msgstr:", error);
    }
  };

  const handleSelectHistory = (id: string) => { // 选择历史记录
    setSelectedMsgstrID(id);
    setShowSelectDialog(true); // 显示弹窗
  };

  const handleConfirmSelect = () => { // 确认选择翻译结果
    if (selectedMsgstrID) {
      selectMsgstr(selectedMsgstrID); // 执行 select-msgstr API 调用
    }
    setShowSelectDialog(false); // 关闭弹窗
  };

  const handleCancelSelect = () => { // 取消选择翻译结果弹窗
    setShowSelectDialog(false); // 关闭弹窗
  };



  //历史记录分页显示
  const [currentHisPage, setCurrentHisPage] = useState(1);//当前页码
  const itemsPerPage = 5; // 每页显示的条目数

  //分页数据
  const paginatedHistory = useMemo(() => {
    const startIndex = (currentHisPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return strings[currentIndex]?.msgstr.slice(startIndex, endIndex) || [];
  }, [strings, currentIndex, currentHisPage]);

  //总页数
  const totalPages = Math.ceil(strings[currentIndex]?.msgstr.length / itemsPerPage);

  /**
 * 跳转到项目页面
 */
  const handleProjectNavigation = () => {
    router.push("/projects");
  };
  /**
   * 跳转到语言版本
   */
  const handleProjectLanguage = () => {
    router.push(`/language-versions?project=${encodeURIComponent(projectName || "")}`);
  };
  /**
   * 跳转到词条页面
   */
  const handleProjectEntries = () => {
    router.push(`/Entries?project_name=${encodeURIComponent(projectName || "")}&language_code=${encodeURIComponent(languageCode || "")}`);
  };

  // 假设有一个字符串数组，代表每个词条的评论
  const hardcodedComments = [
    {
      id: "1",
      username: "Alice",
      content: "This is a great project! I learned a lot from it.",
      createdAt: "2024-12-01T12:34:56Z",
    },
    {
      id: "2",
      username: "Bob",
      content: "I agree with Alice. It's really insightful.",
      createdAt: "2024-12-02T09:30:00Z",
    },
    {
      id: "3",
      username: "Charlie",
      content: "Looking forward to seeing more updates on this topic!",
      createdAt: "2024-12-03T14:00:00Z",
    },
  ];


  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
      {/* 项目导航面包屑 */}
      <div className="flex items-center space-x-1 mb-6 text-sm text-gray-600">
        {/* Projects按钮 */}
        <Button
          variant="link"
          onClick={handleProjectNavigation}
          className="text-gray-800 font-semibold"
        >
          Projects
        </Button>
        {/* 分隔符 */}
        <span className="text-gray-400">/</span>
        {/* 当前项目按钮 */}
        <Button
          variant="link"
          onClick={handleProjectLanguage} 
          className="text-gray-800 font-semibold"
        >
          {projectName}
        </Button>
        {/* 分隔符 */}
        <span className="text-gray-400">/</span>
        {/* 当前项目语言按钮 */}
        <Button
          variant="link"
          onClick={handleProjectEntries}
          className="text-gray-800 font-semibold"
        >
          {languageCode}
        </Button>
        {/* 分隔符 */}
        <span className="text-gray-400">/</span>
        {/* 当前项目词条按钮 */}
        <Button
          variant="link"
          className="text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          entries
        </Button>
      </div>
      <header className="bg-white dark:bg-gray-800 shadow p-4"> {/* 页头，包括项目名称，语言项和跳转按钮等等 */}
        <div className="text-sm text-gray-600 dark:text-gray-400">{projectName}  / {languageCode} / Translate</div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-2">
            {/* 返回第一个词条 */}
            <Button variant="outline" size="icon" onClick={() => setCurrentIndex(0)} disabled={currentIndex === 0}>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            {/* 返回上一个词条 */}
            <Button variant="outline" size="icon" onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))} disabled={currentIndex === 0}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {/* 显示当前词条索引 */}  
            <span className="text-sm font-medium">{currentIndex + 1} / {strings.length}</span>
            {/* 跳转到下一个词条 */}
            <Button variant="outline" size="icon" onClick={() => setCurrentIndex(Math.min(strings.length - 1, currentIndex + 1))} disabled={currentIndex === strings.length - 1}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            {/* 跳转到最后一个词条 */}
            <Button variant="outline" size="icon" onClick={() => setCurrentIndex(strings.length - 1)} disabled={currentIndex === strings.length - 1}>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
          <Progress value={languageprocess} className="w-64" />
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-auto p-4">
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                {/* 源文本 */}
                <h2 className="text-lg font-semibold mb-2">Source</h2>
                <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
                  {strings[currentIndex]?.msgid || "No source text available"}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                {/* 翻译文本 */}
                <h2 className="text-lg font-semibold mb-2">Translation</h2>
                <p className="text-red-500">
                  {!canTranslate && "(You don't have permission to modify this project)"}
                </p>
                <Textarea
                  value={currentTranslation || ""}
                  onChange={(e) => setCurrentTranslation(e.target.value)} // 更新文本框内容
                  rows={4}
                  className="w-full"
                  disabled={!canTranslate} // 禁用翻译
                />
              </CardContent>
            </Card>
            <div className="flex space-x-2">
            
            <Button onClick={handleSaveAndContinue} disabled={!canTranslate || currentTranslation.length === 0}> {/* 保存并继续 */}
              Save and Continue
            </Button>
            <Button variant="outline" onClick={handleSaveAndStay} disabled={!canTranslate || currentTranslation.length === 0}> {/* 保存并停留 */}
              Save and Stay
            </Button>
            
            {/* 修改 Suggest 按钮，直接调用 handleSuggest */}
            <Button variant="outline" onClick={handleSuggest} disabled={isLoadingSuggestions}>
              {isLoadingSuggestions ? 'loading...' : 'Suggest'}
            </Button>
            {/* 翻译建议的 Dialog */}
            <Dialog open={isSuggestDialogOpen} onOpenChange={setIsSuggestDialogOpen}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Translation suggestions</DialogTitle>
                  <DialogDescription>
                    Select a translation suggestion from the options below.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <RadioGroup value={selectedSuggestion} onValueChange={setSelectedSuggestion}>
                    {suggestions.map((suggestion, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <RadioGroupItem value={suggestion.translation} id={`suggestion-${idx}`} />
                        <Label htmlFor={`suggestion-${idx}`}>
                          <span className="font-semibold">{suggestion.source}:</span> {suggestion.translation}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <Button onClick={handleSelectSuggestion} disabled={!selectedSuggestion}>
                  Use of selected Suggestion
                </Button>
              </DialogContent>
            </Dialog>

              {/* <Button variant="outline">Skip</Button> */}
            </div>
          </div>
        </main>
        {/* 侧边栏, 包括FeedBack和String info */}
        <aside className="w-80 bg-white dark:bg-gray-800 overflow-auto p-4 border-l border-gray-200 dark:border-gray-700 flex flex-col">
          <Tabs defaultValue="feedback" className="flex-1 flex flex-col">
            <div className="top-0 bg-white dark:bg-gray-800 z-10">
              <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                <TabsTrigger
                  value="feedback"
                  className="hover:bg-gray-200 dark:hover:bg-gray-600 data-[state=active]:bg-gray-300 dark:data-[state=active]:bg-gray-500"
                >
                  Feedbacks
                </TabsTrigger>
                <TabsTrigger
                  value="info"
                  className="hover:bg-gray-200 dark:hover:bg-gray-600 data-[state=active]:bg-gray-300 dark:data-[state=active]:bg-gray-500"
                >
                  String Info
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="feedback">
              <ScrollArea className="max-h-[calc(100vh-200px)]">
                {feedbacks.length > 0 ? (
                  feedbacks.map((feedback) => (
                    <FeedbackItem key={feedback.id} feedback={feedback} />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No feedback for this entry yet.</p>
                )}
              </ScrollArea>
            </TabsContent>
            <TabsContent value="info">
              <div className="space-y-2">
                <p><strong>Tag:</strong> {strings[currentIndex]?.tag}</p>
                <p><strong>Reference:</strong> {strings[currentIndex]?.references}</p>
                <p><strong>Last updated:</strong> {(strings[currentIndex]?.updated_at)}</p>
                <p><strong>Source string added:</strong> 3 years ago</p>
                <p><strong>String Location:</strong> The {strings[currentIndex]?.idx_in_language}th in the translation file </p>
              </div>
            </TabsContent>
          </Tabs>
        </aside>
      </div>
      {/* 页脚，包括附近字符串、相似键、其他语言、历史和评论等内容 */}
      <footer className="bg-white dark:bg-gray-800 p-4 border-t border-gray-200 dark:border-gray-700">
        <Tabs defaultValue="nearby">
          <TabsList>
            <TabsTrigger value="nearby">Nearby Strings</TabsTrigger>
            {/* <TabsTrigger value="similar">Similar Keys</TabsTrigger> */}
            <TabsTrigger value="other">Other Languages</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="comment">Comment</TabsTrigger>
          </TabsList>
          {/* 附近字符串内容 */}
          <TabsContent value="nearby">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left">Reference</th>
                  <th className="text-left">Source</th>
                  <th className="text-left">Translation</th>
                  <th className="text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {nearbyStrings.filter(entry => entry !=null && Object.keys(entry).length > 0).map((entry, idx) => (
                  entry && (
                    <tr key={idx}>
                      <td>{entry.references || ""}</td>
                      <td>{entry.msgid || ""}</td>
                      <td>{entry.selected_msgstr_index === -1 ? "" : entry.msgstr[entry.selected_msgstr_index]?.msg || "No translation"}</td>
                      <td>
                        <Button variant="ghost" size="icon">
                          <Copy className="h-4 w-4" /> {/* 复制图标 */}
                        </Button>
                      </td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          </TabsContent>

          {/* <TabsContent value="similar">Similar keys content</TabsContent> 相似键内容 */}

          <TabsContent value="other">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left">Language</th>
                  <th className="text-left">Translation</th>
                  <th className="text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {otherLanguagesEntry.map((entry, idx) => (
                  <tr key={idx}>
                    <td>{entry.languageCode}</td>
                    <td>{entry.entry.selected_msgstr_index === -1 ? "(No translation yet)" : entry.entry.msgstr[entry.entry.selected_msgstr_index]?.msg || "No translation"} </td>
                    <td>
                      <Button variant="ghost" size="icon">
                        <Copy className="h-4 w-4" /> {/* 复制图标 */}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TabsContent> {/* 其他语言内容 */}

          {/* 历史翻译结果 */}
          <TabsContent value="history">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left">User ID</th>
                  <th className="text-left">Translation</th>
                  <th className="text-left">Update At</th>
                  <th className="text-left">Actions</th>
                </tr>
              </thead>
            </table>
                {/* 历史记录列表, 同样适用虚拟列表分页展示 */}
              <div className="flex justify-end space-x-2">
                <List
                  height={200} // 设置列表高度
                  itemCount={paginatedHistory.length} // 设置列表项数
                  itemSize={40} // 设置列表项高度
                  width={"100%"} // 设置列表宽度
                >
                  {({ index, style }) => {
                    const item = paginatedHistory[index];
                    return (
                      <div
                        style={style} 
                        key={item.timestamp} 
                        className="flex items-center border-b hover:bg-muted/50"
                      >
                        <div className="w-[100px] font-medium pl-4">{item.user_id}</div> {/* 用户ID */}
                        <div className="w-[270px] font-mono text-sm">{item.msg}</div> {/* 翻译文本 */}
                        <div className="w-[400px]">{new Date(item.timestamp).toLocaleString()}</div> {/* 更新时间 */}
                        <div>
                        <Button variant="default" className="md:w-1/4" onClick={() => handleSelectHistory(item.id)}>  {/* 选择按钮 */}
                          Select it
                        </Button>
                        </div>
                        
                      </div>
                    );
                  }}
                </List>
              </div>
            {/* 分页控制 */}
            {/* 分页控制 */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-6">
              <div className="text-sm text-muted-foreground">
                Showing {(currentHisPage - 1) * itemsPerPage + 1} to {Math.min(currentHisPage * itemsPerPage, paginatedHistory.length)} of {paginatedHistory.length} entries
              </div>
              <div className="flex space-x-2">
                {/* 回到第一页 */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentHisPage(1)}
                  disabled={currentHisPage === 1}
                  aria-label="First page"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                {/* 上一页 */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentHisPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentHisPage === 1}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {/* 下一页 */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentHisPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentHisPage === totalPages}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                {/* 最后一页 */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentHisPage(totalPages)}
                  disabled={currentHisPage === totalPages}
                  aria-label="Last page"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* 确认选择当前翻译结果确认弹窗 */}
            {showSelectDialog && (
              <Dialog open={showSelectDialog} onOpenChange={setShowSelectDialog}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirm Selection</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to select this translation?
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex space-x-4 mt-4">
                    <Button variant="outline" onClick={handleCancelSelect}>Cancel</Button>
                    <Button onClick={handleConfirmSelect}>Confirm</Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </TabsContent> {/* 历史内容 */}

          <TabsContent value="comment">
            <div className="p-2">
              <h3 className="text-lg font-semibold mb-4">Comments</h3>
              {hardcodedComments.length === 0 ? (
                <p>No comments available.</p>
              ) : (
                hardcodedComments.map((comment) => (
                  <div key={comment.id} className="mb-4 p-4 border-b border-gray-300">
                    <div className="font-semibold">{comment.username}</div>
                    <div className="text-sm text-gray-500">{new Date(comment.createdAt).toLocaleString()}</div>
                    <p className="mt-2 text-gray-700">{comment.content}</p>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </footer>
       
      {/* 添加 ToastContainer */}
      {/* <ToastContainer /> */}
    
    </div>
  );
}
