"use client";

import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useProject } from "@/context/ProjectContext"; // 引入 useProject 钩子

export default function ProjectOverview() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const { project, loading, error } = useProject(); // 从 ProjectContext 获取项目信息

  // 过滤组件列表
  const filteredComponents = project?.components?.filter((component: { name: string; translated: number; total: number; words: number; characters: number }) =>
    component.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 如果正在加载项目数据
  if (loading) return <p>Loading project information...</p>;
  
  // 如果加载项目数据时发生错误
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="container mx-auto p-4">
      {/* 显示项目名称 */}
      <h1 className="text-2xl font-bold mb-4">{project?.name}</h1>
      
      {/* 搜索输入框 */}
      <Input
        type="text"
        placeholder="Search components..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4"
      />
      
      {/* 组件表格 */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Component</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Words</TableHead>
            <TableHead>Characters</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredComponents?.map((component: { name: string; translated: number; total: number; words: number; characters: number }) => (
            <TableRow key={component.name}>
              <TableCell>{component.name}</TableCell>
              <TableCell>
                <div className="flex items-center">
                  <Progress value={(component.translated / component.total) * 100} className="w-full mr-2" />
                  <span>{Math.round((component.translated / component.total) * 100)}%</span>
                </div>
              </TableCell>
              <TableCell>{component.words}</TableCell>
              <TableCell>{component.characters}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button asChild variant="outline">
                    <Link href={`/browse-translations`}>Browse</Link>
                  </Button>
                  <Button asChild>
                    <Link href={`/translation-interface`}>Translate</Link>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
