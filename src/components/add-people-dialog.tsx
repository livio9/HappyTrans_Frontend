import * as React from "react"
import { Search } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/context/AuthContext"

interface User {
  id: number
  name: string
  username: string
  avatarUrl: string
}

interface AddPeopleDialogProps {
  projectName: string
  role: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function AddPeopleDialog({
  projectName,
  role,
  isOpen,
  onOpenChange,
}: AddPeopleDialogProps) {
  const { token } = useAuth()
  const [searchTerm, setSearchTerm] = React.useState("")
  const [searchResults, setSearchResults] = React.useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = React.useState<User[]>([])
  const [isLoading, setIsLoading] = React.useState(false)

  const handleSearch = async (value: string) => {
    setSearchTerm(value)
    if (!value.trim()) {
      setSearchResults([])
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user-list?start_id=0&length=10&username=${value}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${localStorage.getItem("authToken")}`,
        },
      })

      if (!response.ok) throw new Error("Failed to fetch users")

      const data = await response.json()
      const formattedUsers = data.results.map((user: any) => ({
        id: user.id,
        name: user.username,
        username: user.username,
        avatarUrl: user.avatar_url || '/placeholder.svg',
      }))
      setSearchResults(formattedUsers)
    } catch (error) {
      console.error("Error searching users:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUserClick = (user: User) => {
    setSelectedUsers((prev) => {
      const isSelected = prev.some((u) => u.id === user.id)
      if (isSelected) {
        return prev.filter((u) => u.id !== user.id)
      }
      return [...prev, user]
    })
  }

  const handleAddUsers = (addrole: string) => {
    selectedUsers.forEach((user) => {
      try {
          const response = fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/add-project-group-user?group=${role}&project_name=${projectName}&user_id=${user.id}`, {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
                  Authorization: `Token ${token}`,
              },
              
              })
      }
      catch (error) {
          console.error("Error adding users:", error)
      }
    })
    setSelectedUsers([])
    setSearchTerm("")
    setSearchResults([])
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[475px]">
        <DialogHeader>
          <DialogTitle>Add {role === "manager" ? "Manager" : "Translator"} to {projectName}</DialogTitle>
          <DialogDescription>
            Search by username
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <ScrollArea className="max-h-[300px] overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : searchResults.length > 0 ? (
            <div className="divide-y">
              {searchResults.map((user) => {
                const isSelected = selectedUsers.some((u) => u.id === user.id)
                return (
                  <button
                    key={user.id}
                    onClick={() => handleUserClick(user)}
                    className={`w-full flex items-center gap-3 p-3 hover:bg-accent text-left ${
                      isSelected ? "bg-accent" : ""
                    }`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatarUrl} alt={user.name} />
                      <AvatarFallback>{user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">
                        
                        {user.username} • Invite to be a {role === "manager" ? "Manager" : "Collaborator"}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          ) : searchTerm && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No users found
            </div>
          )}
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => handleAddUsers(role)}
            disabled={selectedUsers.length === 0}
          >
            Add to repository
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

