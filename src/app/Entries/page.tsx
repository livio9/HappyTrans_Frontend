"use client";
import { useAuth } from "@/context/AuthContext"; // 导入用户认证上下文钩子
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
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown } from 'lucide-react'

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
    return <div className="container mx-auto p-4">Loading...</div>;
  }

  if (!entriesdata?.languages[0].entries.length) {
    return <div className="container mx-auto p-4">No entries found for the selected language.</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{projectData?.name || projectName}</h1>
        <p className="text-muted-foreground">{projectData?.description}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <h2 className="text-lg font-semibold mb-2">Current Language</h2>
          <Select value={languageCode || undefined} onValueChange={(value) => console.log(value)}>
            <SelectTrigger>
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
          <Progress value={(filteredEntries.length / (projectData?.languages.length || 1)) * 100} className="w-full" />
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
      <Input
        type="text"
        placeholder="Search translations..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="md:w-2/3"
      />
      <Button onClick={applySearch} variant="default">
        Search
      </Button>
    
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[95px]">
                Index
                <Button variant="ghost" size="sm" onClick={() => handleSort("index")}>
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="w-[250px]">
                Key
                <Button variant="ghost" size="sm" onClick={() => handleSort("key")}>
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                Original
                <Button variant="ghost" size="sm" onClick={() => handleSort("original")}>
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                Translation
                <Button variant="ghost" size="sm" onClick={() => handleSort("translation")}>
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                Updated At
                <Button variant="ghost" size="sm" onClick={() => handleSort("updatedAt")}>
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedEntries.map((entry, index) => (
              <TableRow key={entry.index}>
                {/* <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell> */}
                <TableCell>{entry.index}</TableCell>
                <TableCell>{entry.references}</TableCell>
                <TableCell>{entry.msgid}</TableCell>
                <TableCell>
                  {entry.msgstr.map((str) => (
                    <div key={str.id}>{str.msg}</div>
                  ))}
                </TableCell>
                <TableCell>{new Date(entry.updated_at).toLocaleString()}</TableCell>
                
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
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
    </div>
  );
}