"use client"
import * as React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Copy, Check } from 'lucide-react'

type Translation = {
  key: string
  english: string
  translated: string
}

export default function ProjectDetails() {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("asc")
  const [currentLanguage, setCurrentLanguage] = React.useState("Spanish")
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null)
  const itemsPerPage = 10

  const projectName = "MyAwesomeApp"
  const projectDescription = "A revolutionary app that simplifies your daily tasks and boosts productivity."
  const totalTranslations = 100
  const translatedCount = 75

  const translations: Translation[] = [
    { key: "app.55J3j", english: "Subscribed successfully!", translated: "¡Suscrito con éxito!" },
    { key: "app.08ZQZZ", english: "Notifications have been blocked. Please update your notification permissions and try again.", translated: "Las notificaciones han sido bloqueadas. Por favor, actualice sus permisos de notificación e inténtelo de nuevo." },
    { key: "app.0Mbf4A", english: "Change Group", translated: "Cambiar Grupo" },
    { key: "app.0aO9Nm", english: "Your invite could not be found.", translated: "No se pudo encontrar su invitación." },
    { key: "app.3zjIGZ", english: "Successfully updated profile.", translated: "Perfil actualizado con éxito." },
    { key: "app.47FYwb", english: "Cancel", translated: "Cancelar" },
    { key: "app.5JcXdV", english: "Create Account", translated: "Crear Cuenta" },
    { key: "app.5sg7KC", english: "Password", translated: "Contraseña" },
    { key: "app.7L86Z5", english: "Member", translated: "Miembro" },
    { key: "app.7Lfwtm", english: "An unexpected error occurred while logging in", translated: "Ocurrió un error inesperado al iniciar sesión" },
    { key: "app.7tSUe8", english: "Back to login", translated: "Volver al inicio de sesión" },
    { key: "app.858KSI", english: "Successfully unsubscribed from notifications.", translated: "Se ha cancelado la suscripción a las notificaciones con éxito." },
    { key: "app.AyGauy", english: "Login", translated: "Iniciar sesión" },
    { key: "app.Azs7Bx", english: "Access was denied", translated: "Se denegó el acceso" },
    { key: "app.C81/uG", english: "Logout", translated: "Cerrar sesión" },
  ]

  const filteredTranslations = translations.filter(
    (translation) =>
      translation.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      translation.english.toLowerCase().includes(searchTerm.toLowerCase()) ||
      translation.translated.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const sortedTranslations = [...filteredTranslations].sort((a, b) => {
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

  const copyToClipboard = (key: string) => {
    navigator.clipboard.writeText(key)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{projectName}</h1>
        <p className="text-muted-foreground">{projectDescription}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <h2 className="text-lg font-semibold mb-2">Current Language</h2>
          <Select value={currentLanguage} onValueChange={setCurrentLanguage}>
            <SelectTrigger>
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Spanish">Spanish</SelectItem>
              <SelectItem value="French">French</SelectItem>
              <SelectItem value="German">German</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2">
          <h2 className="text-lg font-semibold mb-2">Translation Progress</h2>
          <Progress value={(translatedCount / totalTranslations) * 100} className="w-full" />
          <p className="text-sm text-muted-foreground mt-2">
            {translatedCount} out of {totalTranslations} strings translated ({Math.round((translatedCount / totalTranslations) * 100)}%)
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
        <Input
          type="text"
          placeholder="Search translations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="md:w-1/3"
        />
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

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Index</TableHead>
              <TableHead className="w-[150px]">Key</TableHead>
              <TableHead>English</TableHead>
              <TableHead>Translation</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTranslations.map((translation, index) => (
              <TableRow key={translation.key}>
                <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                <TableCell className="font-mono text-sm">{translation.key}</TableCell>
                <TableCell>{translation.english}</TableCell>
                <TableCell>{translation.translated}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(translation.key)}
                    aria-label={`Copy key ${translation.key}`}
                  >
                    {copiedKey === translation.key ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-sm text-muted-foreground">
          Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, sortedTranslations.length)} of {sortedTranslations.length} entries
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
  )
}