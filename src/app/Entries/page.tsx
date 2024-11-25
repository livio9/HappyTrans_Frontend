"use client";
import { useAuth } from "@/context/AuthContext";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

//用于entries返回的数据结构中的msgstr数组
type msgstr = {
  msg: string;
  timestamp: string;
  user_id: string;
  id: string;
}

//用于entries返回的数据结构中的entry数组
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
//这两个LanguageData的区别在于第二个是从project_info返回的数据结构中的languages数组中取出的，第一个是从entries返回的数据结构中取出的
type ProjectLanguageData= {
  language_code: string;
  pot_creation_date: string;
  po_revision_date: string;
}
//用于project_info返回的数据结构
type ProjectData = {
  name: string;
  description: string;
  sorce_language: string;
  languages: ProjectLanguageData[];
  created_at: string;

};

type Entries = {
  project: string;
  languages: LanguageData[];
}

export default function ProjectDetails() {
  const { token } = useAuth(); // 使用认证上下文获取用户信息和认证令牌
  const searchParams = useSearchParams();
  const projectName = searchParams.get("project_name");
  const languageCode = searchParams.get("language_code");
  

  const [currentPage, setCurrentPage] = useState(1);
  const [currentLanguage, setCurrentLanguage] = useState(languageCode);
  const itemsPerPage = 10;

  const [entriesdata, setEntriesData] = useState<Entries>();
  const [projectData, setProjectData] = useState<ProjectData | null >(null);
  const [loading, setLoading] = useState<boolean>(true);

  // 搜索、排序和分页相关状态
  const [filteredEntries, setFilteredEntries] = useState<Entry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearchTerm, setAppliedSearchTerm] = useState("");
  const applySearch = () => {
    setAppliedSearchTerm(searchTerm);
  };

  // Add new state for sorting
  
  const [sortColumn, setSortColumn] = useState<string>("index");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/project-info?project_name=${encodeURIComponent(projectName!)}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${token}`, // 使用认证令牌
            },
          }
        );
        
        if (!response.ok) {
          throw new Error("Failed to fetch project data");
        }
        const data: ProjectData = await response.json();
        setProjectData(data); // 保存 projectData 到状态
      } catch (error) {
        console.error("Error fetching project data:", error);
      }
    };

    const fetchEntriesData = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/entries?project_name=${encodeURIComponent(
            projectName!
          )}&language_code=${encodeURIComponent(languageCode!)}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${token}`, // 使用认证令牌
            },
          }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch entries data");
        }
        const data: Entries = await response.json();
        console.log(data);
        setEntriesData(data); // 保存 entriesdata 到状态
        console.log("here is entriesdata");
        console.log(entriesdata);
      } catch (error) {
        console.error("Error fetching entries data:", error);
      }
    };

    const fetchData = async () => {
      setLoading(true);
      if (projectName && languageCode) {
        await fetchProjectData(); // 获取 project_info 数据
        await fetchEntriesData(); // 获取 entriesdata 数据
      } else {
        console.error("Missing project_name or language_code in URL.");
      }
      setLoading(false);
    };

    fetchData();
  }, [projectName, languageCode]);

  // Add a new function for handling sort
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Modify the sorting logic in the useEffect hook
  //修改筛选逻辑为使用appliedSearchTerm而不是动态更新searchTerm
  useEffect(() => {
    if (entriesdata && entriesdata.languages) {
      const languageData = entriesdata.languages.find(
        (lang) => lang.language_code === languageCode
      );

      if (languageData) {
        const searchFiltered = languageData.entries.filter(
          (entry) =>
            entry.msgid.toLowerCase().includes(appliedSearchTerm.toLowerCase()) ||
            entry.msgstr.some((str) =>
              str.msg.toLowerCase().includes(appliedSearchTerm.toLowerCase())
            )
        );

        const sorted = [...searchFiltered].sort((a, b) => {
          if (sortColumn === "index") {
            return sortDirection === "asc" ? a.index - b.index : b.index - a.index;
          } else if (sortColumn === "key") {
            return sortDirection === "asc" 
              ? a.references.localeCompare(b.references) 
              : b.references.localeCompare(a.references);
          } else if (sortColumn === "original") {
            return sortDirection === "asc" 
              ? a.msgid.localeCompare(b.msgid) 
              : b.msgid.localeCompare(a.msgid);
          } else if (sortColumn === "translation") {
            const aTranslation = a.msgstr[0]?.msg || "";
            const bTranslation = b.msgstr[0]?.msg || "";
            return sortDirection === "asc" 
              ? aTranslation.localeCompare(bTranslation) 
              : bTranslation.localeCompare(aTranslation);
          } else if (sortColumn === "updatedAt") {
            return sortDirection === "asc" 
              ? new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
              : new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
          }
          return 0;
        });

        setFilteredEntries(sorted);
      }
    }
  }, [entriesdata, appliedSearchTerm, sortColumn, sortDirection, languageCode]);

  // 分页
  const paginatedEntries = filteredEntries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!entriesdata?.languages[0].entries.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>No Entries Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No entries found for the selected language.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">{projectData?.name || projectName}</CardTitle>
          <p className="text-muted-foreground mt-2">{projectData?.description}</p>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-3">
          <div>
            <h2 className="text-lg font-semibold mb-2">Current Language</h2>
            <Select value={languageCode || undefined} onValueChange={(value) => console.log(value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {projectData?.languages.map((lang) => (
                  <SelectItem key={lang.language_code} value={lang.language_code}>
                    {lang.language_code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <h2 className="text-lg font-semibold mb-2">Translation Progress</h2>
            <Progress value={(filteredEntries.length / (projectData?.languages.length || 1)) * 100} className="w-full h-4" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Translations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
            <div className="relative md:w-2/3">
              <Input
                type="text"
                placeholder="Search translations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>
            <Button onClick={applySearch} variant="default" className="md:w-1/4">
              Search
            </Button>
          </div>

          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead className="w-[100px]">
                    Index
                    <Button variant="ghost" size="sm" onClick={() => handleSort("index")} className="ml-2">
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[270px]">
                    Key
                    <Button variant="ghost" size="sm" onClick={() => handleSort("key")} className="ml-2">
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[400px]">
                    Original
                    <Button variant="ghost" size="sm" onClick={() => handleSort("original")} className="ml-2">
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[400px]">
                    Translation
                    <Button variant="ghost" size="sm" onClick={() => handleSort("translation")} className="ml-2">
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    Updated At
                    <Button variant="ghost" size="sm" onClick={() => handleSort("updatedAt")} className="ml-2">
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedEntries.map((entry, index) => (
                  <TableRow key={entry.index} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{entry.index}</TableCell>
                    <TableCell className="font-mono text-sm">{entry.references}</TableCell>
                    <TableCell>{entry.msgid}</TableCell>
                    <TableCell>
                      {entry.msgstr.map((str) => (
                        <div key={str.id}>{str.msg}</div>
                      ))}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{new Date(entry.updated_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-6">
            <div className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredEntries.length)} of {filteredEntries.length} entries
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                aria-label="First page"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                aria-label="Last page"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}