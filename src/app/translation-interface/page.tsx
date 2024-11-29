// translation-interface.tsx
// 提供一个翻译工作界面，允许用户查看源文本、编辑翻译、导航翻译条目，以及使用翻译建议。

"use client"; // 指定该文件为客户端组件，确保在客户端渲染

import * as React from "react";
import { Button } from "@/components/ui/button"; // 导入自定义按钮组件
import { Textarea } from "@/components/ui/textarea"; // 导入自定义多行文本输入组件
import { Progress } from "@/components/ui/progress"; // 导入自定义进度条组件
import { Card, CardContent } from "@/components/ui/card"; // 导入自定义卡片组件
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // 导入自定义标签页组件
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Copy } from "lucide-react"; // 导入图标组件
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"; // 导入自定义对话框组件
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // 导入自定义单选按钮组组件
import { Label } from "@/components/ui/label"; // 导入自定义标签组件
import { useAuth } from "@/context/AuthContext"; // 导入用户上下文钩子
import { useProject } from "@/context/ProjectContext"; // 导入项目上下文钩子
import { useSearchParams ,useRouter} from "next/navigation";// 导入路由钩子和查询参数钩子
import { useState, useEffect, useRef } from 'react';
// 辅助函数：从 Cookie 中获取 CSRF token
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(";").shift() || null;
  }
  return null;
}

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
  index: number; // 索引
  msgid: string;  // 源文本
  msgid_plural: string; // 复数形式的源文本
  msgstr: msgstr[]; // 翻译文本
  msgstr_plural: string; // 复数形式的翻译文本
  updated_at: string; // 更新时间
  selected_msgstr_index: number; // 选择的翻译文本索引
  references: string; // 引用
};

type LanguageData = {
  language_code: string;
  entries: Entry[];
};

type Entries = {
  project: string;
  languages: LanguageData[];
};

type EntryData = {
  project: string;
  entries: {
    previous: { [languageCode: string]: Entry } | null;
    current: { [languageCode: string]: Entry };
    next: { [languageCode: string]: Entry } | null;
  };
};

// 定义翻译建议的类型
type TranslationSuggestion = {
  source: string; // 建议来源（如 DeepL、Google Translate）
  translation: string; // 建议的翻译文本
};

export default function TranslationInterface() {

  const router = useRouter();//用于跳转
  const searchParams = useSearchParams();
  // 从 URL 获取参数
  const projectName = searchParams.get("project_name");
  const languageCode = searchParams.get("language_code");
  const indexParam = searchParams.get("index");
  const index1 = indexParam ? parseInt(indexParam) - 1 : 0;
  // const index1 = searchParams.get("index");

  const { user, token } = useAuth(); // 使用用户上下文获取当前用户
  
  const [currentIndex, setCurrentIndex] = useState(index1); // 使用初始的 index1
  const [strings, setStrings] = useState<Entry[]>([]); // 动态获取的翻译条目
  const [nearbyStrings, setNearbyStrings] = useState<(Entry | null)[]>([]); // 存储附近的字符串
  const [currentTranslation, setCurrentTranslation] = useState<string>(""); // 当前文本框内容

  const [suggestions, setSuggestions] = React.useState<TranslationSuggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = React.useState("");
  
  const fetchedEntries = useRef(false); // 标记 entries 是否已加载，用来避免多次请求

  useEffect(() => {
    console.log("useEffect triggered", { projectName, languageCode, index1, strings, currentIndex });
  
    if (projectName && languageCode) {
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
            setStrings(languageData.entries); // 更新 strings
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

      // 获取当前词条数据
      const fetchEntryData = async () => {
        console.log("Fetching entry data for index:", currentIndex);
  
        if (strings.length > 0 && currentIndex < strings.length) {
          try {
            const response = await fetch(
              `${process.env.NEXT_PUBLIC_API_BASE_URL}/entry?project_name=${encodeURIComponent(
                projectName
              )}&language_code=${encodeURIComponent(languageCode)}&index=${encodeURIComponent(
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
  
            const { previous, current, next } = data.entries;
            console.log("Previous, current, next entries:", { previous, current, next });
  
            setNearbyStrings([
              previous?.[languageCode] || null,
              current[languageCode],
              next?.[languageCode] || null, // 只取第一个元素
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
      if (strings.length > 0 && currentIndex < strings.length) {
        const currentEntry = strings[currentIndex];
        console.log("Current entry:", currentEntry);
        length = currentEntry?.msgstr.length;
        setCurrentTranslation(currentEntry?.msgstr[length-1]?.msg || ""); // 设置当前翻译文本
      } else {
        console.log("Strings not yet loaded or currentIndex is invalid.");
      }
    } else {
      console.log("Project name or language code is missing");
    }
  }, [projectName, languageCode, currentIndex, strings]); // 依赖 currentIndex 和 strings，确保数据更新后执行
  
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
    router.push(`/translation?project_name=${projectName}&language_code=${languageCode}&index=${currentIndex + 2}`); // 使用router跳转
  };

  // 处理保存但不跳转
  const handleSaveAndStay = async () => {
    await updateTranslation(currentTranslation); // 保存当前翻译
  };


  // 处理翻译建议
  const handleSuggest = async () => {
    // 模拟获取翻译建议
    const mockSuggestions = [
      { source: "DeepL", translation: "Administrator" },
      { source: "Google Translate", translation: "Manager" },
      { source: "ChatGPT", translation: "Supervisor" },
    ];
    setSuggestions(mockSuggestions);
  };

  const handleSelectSuggestion = () => {
    if (selectedSuggestion) {
      setCurrentTranslation(selectedSuggestion);
    }
  };

  const progress = ((currentIndex + 1) / strings.length) * 100;
  

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow p-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">{projectName}  / {languageCode} / Translate</div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentIndex(0)} disabled={currentIndex === 0}>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))} disabled={currentIndex === 0}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">{currentIndex + 1} / {strings.length}</span>
            <Button variant="outline" size="icon" onClick={() => setCurrentIndex(Math.min(strings.length - 1, currentIndex + 1))} disabled={currentIndex === strings.length - 1}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setCurrentIndex(strings.length - 1)} disabled={currentIndex === strings.length - 1}>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
          <Progress value={progress} className="w-64" />
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-auto p-4">
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <h2 className="text-lg font-semibold mb-2">Source</h2>
                <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
                  {strings[currentIndex]?.msgid || "No source text available"}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <h2 className="text-lg font-semibold mb-2">Translation</h2>
                <Textarea
                  value={currentTranslation || ""}
                  onChange={(e) => setCurrentTranslation(e.target.value)} // 更新文本框内容
                  rows={4}
                  className="w-full"
                />
              </CardContent>
            </Card>
            <div className="flex space-x-2">
            <Button onClick={handleSaveAndContinue}>
              Save and Continue
            </Button>
            <Button variant="outline" onClick={handleSaveAndStay}>
              Save and Stay
            </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" >Suggest</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Translation Suggestions</DialogTitle>
                    <DialogDescription>
                      Choose a translation suggestion from the options below.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <RadioGroup value={selectedSuggestion} onValueChange={setSelectedSuggestion}>
                        {suggestions.map((suggestion, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <RadioGroupItem value={suggestion.translation} id={`suggestion-${index}`} />
                            <Label htmlFor={`suggestion-${index}`}>
                              <span className="font-semibold">{suggestion.source}:</span> {suggestion.translation}
                            </Label>
                          </div>
                        ))}
                    </RadioGroup>
                  </div>
                  <Button>Use Selected Suggestion</Button>
                </DialogContent>
              </Dialog>
              <Button variant="outline">Skip</Button>
            </div>
          </div>
        </main>
        <aside className="w-80 bg-white dark:bg-gray-800 overflow-auto p-4 border-l border-gray-200 dark:border-gray-700">
          <Tabs defaultValue="glossary">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="glossary">Glossary</TabsTrigger>
              <TabsTrigger value="info">String Info</TabsTrigger>
            </TabsList>
            <TabsContent value="glossary">
              <p className="text-sm text-gray-600 dark:text-gray-400">No relevant strings found in the glossary.</p>
            </TabsContent>
            <TabsContent value="info">
              <div className="space-y-2">
                <p><strong>Key:</strong> {strings[currentIndex]?.msgid}</p>
                <p><strong>String added:</strong> 1 year ago</p>
                <p><strong>Last updated:</strong> 1 year ago</p>
                <p><strong>Source string added:</strong> 3 years ago</p>
                <p><strong>Translation file:</strong> apps/werkplek-reservering/i18n/en.json, string 1 of 1</p>
              </div>
            </TabsContent>
          </Tabs>
        </aside>
      </div>
      <footer className="bg-white dark:bg-gray-800 p-4 border-t border-gray-200 dark:border-gray-700">
        <Tabs defaultValue="nearby">
          <TabsList>
            <TabsTrigger value="nearby">Nearby Strings</TabsTrigger>
            <TabsTrigger value="similar">Similar Keys</TabsTrigger>
            <TabsTrigger value="other">Other Languages</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
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
                {nearbyStrings.filter(entry => entry !=null ).map((entry, idx) => (
                  entry && (
                    <tr key={idx}>
                      <td>{entry.references}</td>
                      <td>{entry.msgid}</td>
                      <td>{entry.msgstr[entry.msgstr.length-1]?.msg || "No translation"}</td>
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
          <TabsContent value="similar">Similar keys content</TabsContent> {/* 相似键内容 */}
          <TabsContent value="other">Other languages content</TabsContent> {/* 其他语言内容 */}
          <TabsContent value="history">History content</TabsContent> {/* 历史内容 */}
          <TabsContent value="comment">
            <div className="p-2">
              {/* <p>{strings[currentIndex].comments || "No comments available."}</p> 显示注释内容 */}
            </div>
          </TabsContent>
        </Tabs>
      </footer>
    </div>
  );
}
