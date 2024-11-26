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

// 定义翻译字符串的类型
type TranslationString = {
  id: string; // 字符串唯一标识符
  source: string; // 源文本
  target: string; // 目标翻译文本
  comments: string; // 注释
  index: number; // 字符串在列表中的索引
};

// 定义翻译建议的类型
type TranslationSuggestion = {
  source: string; // 建议来源（如 DeepL、Google Translate）
  translation: string; // 建议的翻译文本
};

export default function TranslationInterface() {
  const { user,token } = useAuth(); // 使用用户上下文获取当前用户
  const searchParams = useSearchParams(); // 使用查询参数钩子获取 URL 查询参数
  const projectName = searchParams.get("project_name");
  const languageCode = searchParams.get("language_code");
  const project = useProject(); // 使用项目上下文获取当前项目
  const router = useRouter(); // 使用路由钩子进行页面导航
  const [currentIndex, setCurrentIndex] = React.useState(0); // 当前显示的翻译字符串索引
  const [strings, setStrings] = React.useState<TranslationString[]>([]); // 存储所有翻译字符串的数组
  const [loading, setLoading] = React.useState(false); // 加载状态
  const [error, setError] = React.useState<string | null>(null); // 错误信息
  const [suggestions, setSuggestions] = React.useState<TranslationSuggestion[]>([]); // 存储翻译建议的数组
  const [selectedSuggestion, setSelectedSuggestion] = React.useState(""); // 用户选择的翻译建议

  // 当组件挂载或项目变化时，获取翻译条目
  React.useEffect(() => {
    if (!project || !project.languageCode) {
      // 如果没有选择项目或语言代码，重定向到项目列表页面
      router.push("/projects");
      return;
    }
    fetchEntries(project.name, project.languageCode); // 获取翻译条目
  }, [project]);

  /**
   * 获取翻译条目的函数
   * @param {string} projectName - 项目名称
   * @param {string} languageCode - 目标语言代码
   */
  const fetchEntries = async (projectName: string, languageCode: string) => {
    setLoading(true); // 设置加载状态为加载中
    setError(null); // 清除之前的错误信息
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/entries?project_name=${projectName}&language_code=${languageCode}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (response.ok) {
        const data = await response.json(); // 解析响应数据
        processEntriesData(data); // 处理翻译条目数据
      } else {
        setError("Failed to fetch entries"); // 设置错误信息
      }
    } catch (err: any) {
      setError("Error fetching entries: " + err.message); // 捕获并设置错误信息
    } finally {
      setLoading(false); // 结束加载状态
    }
  };

  /**
   * 处理翻译条目数据的函数
   * @param {any} data - 从 API 获取的原始数据
   */
  const processEntriesData = (data: any) => {
    const sourceLanguageCode = data.source_language_code; // 获取源语言代码
    const targetLanguageCode = data.language_code; // 获取目标语言代码

    const sourceLanguageData = data.languages.find(
      (lang: any) => lang.language_code === sourceLanguageCode
    );
    const targetLanguageData = data.languages.find(
      (lang: any) => lang.language_code === targetLanguageCode
    );

    if (!sourceLanguageData || !targetLanguageData) {
      setError("Source or target language data not found"); // 设置错误信息
      return;
    }

    // 创建目标语言条目的映射表
    const targetEntriesMap = new Map();
    targetLanguageData.entries.forEach((entry: any) => {
      targetEntriesMap.set(entry.msgid, entry);
    });

    // 结合源语言和目标语言的条目
    const combinedStrings = sourceLanguageData.entries.map((sourceEntry: any) => {
      const targetEntry = targetEntriesMap.get(sourceEntry.msgid);

      return {
        id: sourceEntry.references, // 使用引用作为 ID
        source: sourceEntry.msgid, // 源文本
        target: targetEntry ? targetEntry.msgstr : "", // 目标翻译文本
        comments: sourceEntry.comments || "", // 注释
        index: sourceEntry.index, // 索引
      };
    });

    setStrings(combinedStrings); // 设置翻译字符串数组
    setCurrentIndex(0); // 重置当前索引为第一个条目
  };

  /**
   * 处理翻译文本变化的函数
   * @param {string} value - 用户输入的翻译文本
   */
  const handleTranslationChange = (value: string) => {
    const updatedStrings = [...strings]; // 创建翻译字符串的副本
    updatedStrings[currentIndex].target = value; // 更新当前条目的翻译文本
    setStrings(updatedStrings); // 设置更新后的翻译字符串数组
  };

  /**
   * 处理导航按钮点击的函数
   * @param {"first" | "prev" | "next" | "last"} direction - 导航方向
   */
  const handleNavigation = (direction: "first" | "prev" | "next" | "last") => {
    switch (direction) {
      case "first":
        setCurrentIndex(0); // 跳转到第一个条目
        break;
      case "prev":
        setCurrentIndex(Math.max(0, currentIndex - 1)); // 跳转到前一个条目
        break;
      case "next":
        setCurrentIndex(Math.min(strings.length - 1, currentIndex + 1)); // 跳转到下一个条目
        break;
      case "last":
        setCurrentIndex(strings.length - 1); // 跳转到最后一个条目
        break;
    }
  };

  /**
   * 处理获取翻译建议的函数
   * 这里模拟调用翻译服务的 API 获取建议
   */
  const handleSuggest = async () => {
    // 模拟翻译建议数据
    const mockSuggestions = [
      { source: "DeepL", translation: "Suggestion 1" },
      { source: "Google Translate", translation: "Suggestion 2" },
      { source: "ChatGPT", translation: "Suggestion 3" },
    ];
    setSuggestions(mockSuggestions); // 设置翻译建议数组
  };

  /**
   * 处理选择翻译建议的函数
   */
  const handleSelectSuggestion = () => {
    if (selectedSuggestion) {
      handleTranslationChange(selectedSuggestion); // 应用选择的翻译建议
    }
  };

  const progress = ((currentIndex + 1) / strings.length) * 100; // 计算翻译进度百分比

  // 获取当前条目的附近条目，用于“Nearby Strings”标签
  const nearbyStrings = strings.slice(
    Math.max(0, currentIndex - 5),
    Math.min(strings.length, currentIndex + 6)
  );

  // 如果正在加载，显示加载状态
  if (loading) {
    return <div>Loading...</div>;
  }

  // 如果有错误，显示错误信息
  if (error) {
    return <div>Error: {error}</div>;
  }

  // 如果没有可翻译的字符串，显示提示信息
  if (strings.length === 0) {
    return <div>No strings available.</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
      {/* 返回按钮 */}
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ChevronLeft className="mr-2 h-4 w-4" />
        Back to Language Versions
      </Button>

      {/* 头部区域，包含导航按钮和进度条 */}
      <header className="bg-white dark:bg-gray-800 shadow p-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {project.name} / Translate ({project.languageCode}) {/* 显示项目名称和语言代码 */}
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-2">
            {/* 导航按钮 */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleNavigation("first")}
              disabled={currentIndex === 0} // 禁用条件：当前索引为第一个条目
            >
              <ChevronsLeft className="h-4 w-4" /> {/* 双向向左箭头图标 */}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleNavigation("prev")}
              disabled={currentIndex === 0} // 禁用条件：当前索引为第一个条目
            >
              <ChevronLeft className="h-4 w-4" /> {/* 向左箭头图标 */}
            </Button>
            <span className="text-sm font-medium">
              {currentIndex + 1} / {strings.length} {/* 显示当前条目和总条目数 */}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleNavigation("next")}
              disabled={currentIndex === strings.length - 1} // 禁用条件：当前索引为最后一个条目
            >
              <ChevronRight className="h-4 w-4" /> {/* 向右箭头图标 */}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleNavigation("last")}
              disabled={currentIndex === strings.length - 1} // 禁用条件：当前索引为最后一个条目
            >
              <ChevronsRight className="h-4 w-4" /> {/* 双向向右箭头图标 */}
            </Button>
          </div>
          {/* 进度条 */}
          <Progress value={progress} className="w-64" />
        </div>
      </header>

      {/* 主体区域，包含源文本和翻译文本的编辑区域 */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-auto p-4">
          <div className="space-y-4">
            {/* 源文本显示卡片 */}
            <Card>
              <CardContent className="p-4">
                <h2 className="text-lg font-semibold mb-2">Source</h2> {/* 源文本标题 */}
                <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
                  {strings[currentIndex].source} {/* 显示源文本内容 */}
                </div>
              </CardContent>
            </Card>
            {/* 翻译文本编辑卡片 */}
            <Card>
              <CardContent className="p-4">
                <h2 className="text-lg font-semibold mb-2">Translation</h2> {/* 翻译文本标题 */}
                <Textarea
                  value={strings[currentIndex].target} // 绑定翻译文本值
                  onChange={(e) => handleTranslationChange(e.target.value)} // 处理翻译文本变化
                  rows={4}
                  className="w-full"
                />
              </CardContent>
            </Card>
            {/* 操作按钮组 */}
            <div className="flex space-x-2">
              <Button>Save and Continue</Button> {/* 保存并继续按钮 */}
              <Button variant="outline">Save and Stay</Button> {/* 保存并停留按钮 */}
              {/* 翻译建议对话框 */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" onClick={handleSuggest}>
                    Suggest {/* 获取翻译建议按钮 */}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Translation Suggestions</DialogTitle> {/* 对话框标题 */}
                    <DialogDescription>
                      Choose a translation suggestion from the options below.
                    </DialogDescription> {/* 对话框描述 */}
                  </DialogHeader>
                  <div className="py-4">
                    {/* 翻译建议单选按钮组 */}
                    <RadioGroup
                      value={selectedSuggestion}
                      onValueChange={setSelectedSuggestion}
                    >
                      {suggestions.map((suggestion, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <RadioGroupItem
                            value={suggestion.translation}
                            id={`suggestion-${index}`}
                          />
                          <Label htmlFor={`suggestion-${index}`}>
                            <span className="font-semibold">{suggestion.source}:</span>{" "}
                            {suggestion.translation}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  <Button onClick={handleSelectSuggestion}>Use Selected Suggestion</Button> {/* 使用选中的建议按钮 */}
                </DialogContent>
              </Dialog>
              <Button variant="outline">Skip</Button> {/* 跳过按钮 */}
            </div>
          </div>
        </main>

        {/* 侧边栏区域，包含词汇表和字符串信息的标签页 */}
        <aside className="w-80 bg-white dark:bg-gray-800 overflow-auto p-4 border-l border-gray-200 dark:border-gray-700">
          <Tabs defaultValue="glossary">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="glossary">Glossary</TabsTrigger> {/* 词汇表标签 */}
              <TabsTrigger value="info">String Info</TabsTrigger> {/* 字符串信息标签 */}
            </TabsList>
            <TabsContent value="glossary">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No relevant strings found in the glossary.
              </p> {/* 词汇表内容，这里为示例 */}
            </TabsContent>
            <TabsContent value="info">
              <div className="space-y-2">
                <p>
                  <strong>Key:</strong> {strings[currentIndex].id} {/* 显示字符串的键 */}
                </p>
                <p>
                  <strong>Index:</strong> {strings[currentIndex].index} {/* 显示字符串的索引 */}
                </p>
                {/* 根据需要添加更多信息 */}
              </div>
            </TabsContent>
          </Tabs>
        </aside>
      </div>

      {/* 底部区域，包含附近字符串、相似键、其他语言、历史和注释的标签页 */}
      <footer className="bg-white dark:bg-gray-800 p-4 border-t border-gray-200 dark:border-gray-700">
        <Tabs defaultValue="nearby">
          <TabsList>
            <TabsTrigger value="nearby">Nearby Strings</TabsTrigger> {/* 附近字符串标签 */}
            <TabsTrigger value="similar">Similar Keys</TabsTrigger> {/* 相似键标签 */}
            <TabsTrigger value="other">Other Languages</TabsTrigger> {/* 其他语言标签 */}
            <TabsTrigger value="history">History</TabsTrigger> {/* 历史标签 */}
            <TabsTrigger value="comment">Comment</TabsTrigger> {/* 注释标签 */}
          </TabsList>
          <TabsContent value="nearby">
            {/* 附近字符串表格 */}
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left">Key</th>
                  <th className="text-left">Source</th>
                  <th className="text-left">Translation</th>
                  <th className="text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {nearbyStrings.map((str, index) => (
                  <tr
                    key={str.id}
                    className={
                      str.index === strings[currentIndex].index
                        ? "bg-blue-100 dark:bg-blue-900" // 高亮当前条目
                        : ""
                    }
                  >
                    <td>{str.id}</td> {/* 显示键 */}
                    <td>{str.source}</td> {/* 显示源文本 */}
                    <td>{str.target}</td> {/* 显示翻译文本 */}
                    <td>
                      {/* 复制翻译文本按钮 */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleTranslationChange(str.target)}
                      >
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
              <p>{strings[currentIndex].comments || "No comments available."}</p> {/* 显示注释内容 */}
            </div>
          </TabsContent>
        </Tabs>
      </footer>
    </div>
  );
}
