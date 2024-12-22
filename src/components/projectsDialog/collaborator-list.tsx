import * as React from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Trash2, UserPlus } from 'lucide-react'
import { AddPeopleDialog } from "./add-people-dialog"
import { useAuth } from "@/context/AuthContext"
import UserAvatar from "@/components/shared/UserAvatar"; // 引入共享的 UserAvatar 组件

interface User {
  id: number;
  username: string;
  role: string;
  avatarUrl: string;
}

interface CollaboratorListProps {
  isadmin: boolean;
  ismanager: boolean;
  type: "managers" | "translators"
  projectName: string
}

export function CollaboratorList({
  isadmin,
  ismanager,
  type,
  projectName,
}: CollaboratorListProps) {
  const { token } = useAuth()
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set())
  const [filterTerm, setFilterTerm] = React.useState("")
  const [isAddPeopleOpen, setIsAddPeopleOpen] = React.useState(false)
  const [collaborators, setCollaborators] = React.useState<User[]>([])
  const [shouldFetch, setShouldFetch] = React.useState(true);

  React.useEffect(() => {
    const fetchCollaborators = async () => {
      try{
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/project-info?project_name=${projectName}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${localStorage.getItem("authToken")}`,
          },
        })
  
        if (!response.ok) throw new Error("Failed to fetch collaborators")
  
        const data  = await response.json()
        const coldata: User[] = type === "managers" ? data.managers : data.translators
        setCollaborators(coldata)
      }
      catch (error) {
        console.error(error)
      }
    }
    fetchCollaborators();
    setShouldFetch(false);  // 重置标记
    console.log("shouldFetch2", shouldFetch)
  }, [  shouldFetch])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(collaborators.map(c => c.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelect = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedIds)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedIds(newSelected)
  }

  const filteredCollaborators = React.useMemo(() => {
    if (!filterTerm) return collaborators
    return collaborators.filter(
      (collaborator) =>
        
        collaborator.username.toLowerCase().includes(filterTerm.toLowerCase())
    )
  }, [collaborators, filterTerm])

  const handleRemoveCollaborator = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/remove-project-group-user?group=${type}&project_name=${projectName}&user_id=${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
      })
      if (!response.ok) throw new Error("Failed to remove collaborator")

      setCollaborators((prev) => prev.filter((c) => c.id !== id))
      setShouldFetch(true);  // 设置标记，触发 useEffect 请求
    } catch (error) {
      console.error(error)
    }
  }

  const handleRemoveSelectedCollaborator = async () => {
    selectedIds.forEach(async (id) => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/remove-project-group-user?group=${type}&project_name=${projectName}&user_id=${id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
        })
        if (!response.ok) throw new Error("Failed to remove collaborator")

        setCollaborators((prev) => prev.filter((c) => c.id !== id))
        setShouldFetch(true);  // 设置标记，触发 useEffect 请求
      } catch (error) {
        console.error(error)
      }
    })
    setSelectedIds(new Set())
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">{type === "managers" ? "Project Managers" : "Translators"}</h4>
        {(isadmin || (ismanager && type === "translators")) && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => setIsAddPeopleOpen(true)}
            >
              <UserPlus className="h-4 w-4" />
              Add people
            </Button>
          </div>
        )}
      </div>
      
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search collaborators..."
          value={filterTerm}
          onChange={(e) => setFilterTerm(e.target.value)}
          className="pl-8"
        />
      </div>

      {filteredCollaborators.length === 0 ? (
        <div className="p-4 text-center text-sm text-muted-foreground">No available {type === "managers" ? "Managers" : "Translators"}</div>
        ) : (
      <div className="rounded-md border">
        <div className="border-b p-4">
          <div className="flex justify-between items-center">
            {(isadmin || type === "translators") && (<Checkbox
              checked={selectedIds.size === filteredCollaborators.length}
              onCheckedChange={handleSelectAll}
              aria-label="Select all"
            />)}
            {(isadmin || (ismanager && type === "translators")) && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveSelectedCollaborator()}
                className="ml-auto text-muted-foreground hover:text-foreground"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            
          </div>
        </div>
        <div className="max-h-30 overflow-y-auto">
          {filteredCollaborators.map((collaborator) => (
            <div key={collaborator.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                {(isadmin || type === "translators") && (<Checkbox
                  checked={selectedIds.has(collaborator.id)}
                  onCheckedChange={(checked) => handleSelect(collaborator.id, checked as boolean)}
                  aria-label={`Select ${collaborator.username}`}
                />)}
                {/* <Avatar className="h-8 w-8">
                  <AvatarImage src={collaborator.avatarUrl} alt={collaborator.username} />
                  <AvatarFallback>{collaborator.username[0].toUpperCase()}</AvatarFallback>
                  
                </Avatar> */}
                <UserAvatar 
                        username={collaborator.username || "U"} 
                        size="sm"  // 使用小尺寸
                    />
                <div>
                  <div className="font-medium">{collaborator.username}</div>
                  <div className="text-sm text-muted-foreground">
                    User ID: {collaborator.id}
                  </div>
                </div>
              </div>
              {(isadmin || (ismanager && type === "translators")) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveCollaborator(collaborator.id)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>)}

      <AddPeopleDialog
        projectName={projectName}
        role={type}
        setShouldFetch={setShouldFetch}
        isOpen={isAddPeopleOpen}
        onOpenChange={setIsAddPeopleOpen}
      />
    </div>
  )
}