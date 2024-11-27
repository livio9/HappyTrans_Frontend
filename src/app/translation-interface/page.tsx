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
import { useState } from "react";

type msgstr = {
  msg: string;
  timestamp: string;
  user_id: string;
  id: string;
};

type Entry = {
  comments: string;
  extracted_comments: string;
  flags: string;
  msgctxt: string | null;
  index: number;
  msgid: string;
  msgid_plural: string;
  msgstr: msgstr[];
  msgstr_plural: string;
  updated_at: string;
  selected_msgstr_index: number;
  references: string;
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
    [languageCode: string]: {
      previous: Entry | null;
      current: Entry;
      next: Entry | null;
    };
  };
};

// 定义翻译建议的类型
type TranslationSuggestion = {
  source: string; // 建议来源（如 DeepL、Google Translate）
  translation: string; // 建议的翻译文本
};

export default function TranslationInterface() {
  const { user, token } = useAuth(); // 使用用户上下文获取当前用户
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [strings, setStrings] = React.useState<Entry[]>([]); // 动态获取的翻译条目
  const [nearbyStrings, setNearbyStrings] = React.useState<(Entry | null)[]>([]); // 存储附近的字符串
  const [suggestions, setSuggestions] = React.useState<TranslationSuggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = React.useState("");
  const [currentTranslation, setCurrentTranslation] = useState<string>(""); // 当前文本框内容
  const [originalTranslation, setOriginalTranslation] = useState<string>(""); // 原始翻译内容


  // 从 URL 获取参数
  const searchParams = new URLSearchParams(window.location.search);
  const projectName = searchParams.get("project_name");
  const languageCode = searchParams.get("language_code");
  const index = searchParams.get("index");

  React.useEffect(() => {
    if (projectName && languageCode) {
      fetchEntriesData(projectName, languageCode);
    }
  }, [projectName, languageCode]);
  React.useEffect(() => {
    // 假设项目数据和语言数据已加载
    if (strings.length > 0) {
      setOriginalTranslation(strings[currentIndex]?.msgstr[0]?.msg || "");
      setCurrentTranslation(strings[currentIndex]?.msgstr[0]?.msg || "");
    }
  }, [currentIndex, strings]);

  // 获取项目翻译条目数据
  const fetchEntriesData = async (projectName: string, languageCode: string) => {
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
      const languageData = data.languages.find(
        (language) => language.language_code === languageCode
      );

      if (languageData) {
        setStrings(languageData.entries);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // 获取特定翻译条目的数据
  const fetchEntryData = async (projectName: string, languageCode: string, index: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/entry?project_name=${encodeURIComponent(
          projectName
        )}&language_code=${encodeURIComponent(languageCode)}&index=${encodeURIComponent(index)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
        }
      );

      if (response.ok) {
        const data: EntryData = await response.json();
        const { previous, current, next } = data.entries;
        
        // 将前后条目存入附近字符串状态
        setNearbyStrings([previous, current, next].filter(Boolean)); // 只保留有效条目
        setStrings([current]); // 只显示当前条目
      }
    } catch (error) {
      console.error(error);
    }
  };

  // 处理翻译内容变化
  const handleTranslationChange = (value: string) => {
    // const updatedStrings = [...strings];
    // updatedStrings[currentIndex].msgstr[updatedStrings[currentIndex].selected_msgstr_index].msg = value;
    // setStrings(updatedStrings);
  };

  const saveTranslation = async (msgstr: string) => {
    if (currentIndex < 0 || currentIndex >= strings.length) {
      throw new Error('Invalid currentIndex');
    }
    
    const index2 = strings[currentIndex]?.index;
    if (index2 === undefined || index2 < 0) {
      throw new Error('Invalid index value');
    }
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/update-entry`, // 后端接口 URL
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
          body: JSON.stringify({
            project_name: projectName,
            language_code: languageCode,
            index: strings[currentIndex]?.index,
            msgstr: msgstr,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save translation");
      }

      // 成功保存翻译，跳转到下一个条目
      setCurrentIndex((prevIndex) => Math.min(strings.length - 1, prevIndex + 1));
    } catch (error) {
      console.error("Error saving translation:", error);
    }
  };

  const handleSaveAndContinue = () => {
    
    if (currentTranslation !== originalTranslation) {
      // 检查文本是否变化，若有变化，保存并跳转
      saveTranslation(currentTranslation);
    } else {
      // 如果没有变化，则直接跳转到下一个条目
      setCurrentIndex((prevIndex) => Math.min(strings.length - 1, prevIndex + 1));
    }
  };

  const handleSaveAndStay = () => {
    if (currentTranslation !== originalTranslation) {
      // 检查文本是否变化，若有变化，保存当前翻译
      saveTranslation(currentTranslation);
    }
    // 如果没有变化，保持当前条目，不跳转
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
      handleTranslationChange(selectedSuggestion);
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
                <h2 className="text-lg font-semibold mb-2">Dutch</h2>
                <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
                  {strings[currentIndex]?.msgid}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <h2 className="text-lg font-semibold mb-2">English</h2>
                <Textarea
                  value={currentTranslation}
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
                  <Button variant="outline" onClick={handleSuggest}>Suggest</Button>
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
                  <Button onClick={handleSelectSuggestion}>Use Selected Suggestion</Button>
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
                {strings.map((str, index) => (
                  <tr key={str.index} className={index === currentIndex ? "bg-blue-100 dark:bg-blue-900" : ""}>
                    <td>{str.index}</td>
                    <td>{str.msgid}</td>
                    <td>{str.msgstr[0]?.msg}</td>
                    <td>
                      <Button variant="ghost" size="icon">
                        <Copy className="h-4 w-4" /> {/* 复制图标 */}
                      </Button>
                    </td>
                  </tr>
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