"use client"
import * as React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Translation = {
  key: string
  english: string
  chinese: string
}

export default function BrowseTranslations() {
  const [currentPage, setCurrentPage] = React.useState(1)
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("asc")
  const itemsPerPage = 10

  const translations: Translation[] = [
    { key: "app.55J3j", english: "Subscribed successfully!", chinese: "订阅成功！" },
    { key: "app.08ZQZZ", english: "Notifications have been blocked. Please update your notification permissions and try again.", chinese: "通知已被阻止。请更新您的通知权限并重试。" },
    { key: "app.0Mbf4A", english: "Change Group", chinese: "更改组" },
    { key: "app.0aO9Nm", english: "Your invite could not be found.", chinese: "找不到您的邀请。" },
    { key: "app.3zjIGZ", english: "Successfully updated profile.", chinese: "成功更新个人资料。" },
    { key: "app.47FYwb", english: "Cancel", chinese: "取消" },
    { key: "app.5JcXdV", english: "Create Account", chinese: "创建账户" },
    { key: "app.5sg7KC", english: "Password", chinese: "密码" },
    { key: "app.7L86Z5", english: "Member", chinese: "成员" },
    { key: "app.7Lfwtm", english: "An unexpected error occurred while logging in", chinese: "登录时发生意外错误" },
    { key: "app.7tSUe8", english: "Back to login", chinese: "返回登录" },
    { key: "app.858KSI", english: "Successfully unsubscribed from notifications.", chinese: "成功取消订阅通知。" },
    { key: "app.AyGauy", english: "Login", chinese: "登录" },
    { key: "app.Azs7Bx", english: "Access was denied", chinese: "访问被拒绝" },
    { key: "app.C81/uG", english: "Logout", chinese: "登出" },
  ]

  const sortedTranslations = [...translations].sort((a, b) => {
    if (sortOrder === "asc") {
      return a.key.localeCompare(b.key)
    } else {
      return b.key.localeCompare(a.key)
    }
  })

  const paginatedTranslations = sortedTranslations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(sortedTranslations.length / itemsPerPage)

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Browse Translations</h1>
      <div className="flex justify-end mb-4">
        <Select value={sortOrder} onValueChange={(value: "asc" | "desc") => setSortOrder(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort order" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Ascending</SelectItem>
            <SelectItem value="desc">Descending</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Key</TableHead>
            <TableHead>English</TableHead>
            <TableHead>Chinese</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedTranslations.map((translation) => (
            <TableRow key={translation.key}>
              <TableCell>{translation.key}</TableCell>
              <TableCell>{translation.english}</TableCell>
              <TableCell>{translation.chinese}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex justify-between items-center mt-4">
        <div>
          Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, sortedTranslations.length)} of {sortedTranslations.length} entries
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}