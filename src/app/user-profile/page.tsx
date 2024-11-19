import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDays, Mail, MapPin, MessageCircle, Star, ImportIcon as Translate, User, Globe, Briefcase, Award, TrendingUp } from 'lucide-react'

type Language = {
  name: string
  proficiency: "Native" | "Fluent" | "Advanced" | "Intermediate" | "Beginner"
}

type UserBadge = {
  name: string
  description: string
  color: "default" | "secondary" | "destructive" | "outline"
}

type UserProfile = {
  id: string
  avatar: string
  nickname: string
  fullName: string
  email: string
  location: string
  joinDate: string
  contributionValue: number
  badges: UserBadge[]
  bio: string
  translatedEntries: number
  commentsPosted: number
  projectsContributed: number
  languages: Language[]
  specializations: string[]
  topContributedProjects: { name: string; entries: number }[]
  recentActivity: { action: string; date: string }[]
  qualityScore: number
}

const userProfile: UserProfile = {
  id: "user123",
  avatar: "/placeholder.svg?height=128&width=128",
  nickname: "TranslationPro",
  fullName: "Alex Johnson",
  email: "alex.johnson@example.com",
  location: "San Francisco, CA",
  joinDate: "2022-03-15",
  contributionValue: 1250,
  badges: [
    { name: "Top Contributor", description: "Awarded to users in the top 1% of contributors", color: "default" },
    { name: "Language Expert", description: "Certified expert in multiple languages", color: "secondary" },
    { name: "Community Leader", description: "Recognized for outstanding community support", color: "destructive" },
    { name: "Quality Champion", description: "Consistently high translation quality scores", color: "outline" },
  ],
  bio: "Passionate about breaking language barriers and connecting cultures through translation. Specializing in technical and medical translations with 5+ years of experience.",
  translatedEntries: 500,
  commentsPosted: 75,
  projectsContributed: 12,
  languages: [
    { name: "English", proficiency: "Native" },
    { name: "Spanish", proficiency: "Fluent" },
    { name: "French", proficiency: "Advanced" },
    { name: "German", proficiency: "Intermediate" },
  ],
  specializations: ["Technical Documentation", "Medical", "Legal", "Software Localization"],
  topContributedProjects: [
    { name: "Medical Handbook Translation", entries: 150 },
    { name: "Tech Startup Website Localization", entries: 120 },
    { name: "Legal Document Translation", entries: 80 },
  ],
  recentActivity: [
    { action: "Translated 20 entries in 'Software UI Project'", date: "2023-05-18" },
    { action: "Reviewed 15 translations in 'Marketing Campaign'", date: "2023-05-17" },
    { action: "Commented on 5 discussions in 'Terminology Forum'", date: "2023-05-16" },
  ],
  qualityScore: 98.5,
}

function getBadgeLevel(contributionValue: number): string {
  if (contributionValue >= 1000) return "Gold"
  if (contributionValue >= 500) return "Silver"
  return "Bronze"
}

export default function UserProfile() {
  const badgeLevel = getBadgeLevel(userProfile.contributionValue)

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="w-24 h-24">
            <AvatarImage src={userProfile.avatar} alt={userProfile.nickname} />
            <AvatarFallback>{userProfile.nickname.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">{userProfile.nickname}</CardTitle>
                <CardDescription>{userProfile.fullName}</CardDescription>
                <div className="flex items-center mt-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 mr-1" />
                  {userProfile.location}
                </div>
              </div>
              <Badge variant="secondary" className="text-lg">
                {badgeLevel} Translator
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="contributions">Contributions</TabsTrigger>
              <TabsTrigger value="languages">Languages</TabsTrigger>
              <TabsTrigger value="badges">Badges</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Bio:</span>
                </div>
                <p className="text-sm text-muted-foreground">{userProfile.bio}</p>
              </div>
              <div className="grid gap-4">
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Email:</span>
                </div>
                <p className="text-sm text-muted-foreground">{userProfile.email}</p>
              </div>
              <div className="grid gap-4">
                <div className="flex items-center">
                  <CalendarDays className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Joined:</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {new Date(userProfile.joinDate).toLocaleDateString()}
                </p>
              </div>
              <div className="grid gap-4">
                <div className="flex items-center">
                  <Briefcase className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Specializations:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {userProfile.specializations.map((spec, index) => (
                    <Badge key={index} variant="outline">{spec}</Badge>
                  ))}
                </div>
              </div>
              <div className="grid gap-4">
                <div className="flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Recent Activity:</span>
                </div>
                <ul className="text-sm text-muted-foreground space-y-2">
                  {userProfile.recentActivity.map((activity, index) => (
                    <li key={index}>
                      {activity.action} - {new Date(activity.date).toLocaleDateString()}
                    </li>
                  ))}
                </ul>
              </div>
            </TabsContent>
            <TabsContent value="contributions" className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Contribution Value:</span>
                  <span className="text-sm font-medium">{userProfile.contributionValue}</span>
                </div>
                <Progress value={(userProfile.contributionValue / 1500) * 100} className="w-full" />
              </div>
              <div className="grid gap-4">
                <div className="flex items-center">
                  <Translate className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Translated Entries:</span>
                </div>
                <p className="text-sm text-muted-foreground">{userProfile.translatedEntries}</p>
              </div>
              <div className="grid gap-4">
                <div className="flex items-center">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Comments Posted:</span>
                </div>
                <p className="text-sm text-muted-foreground">{userProfile.commentsPosted}</p>
              </div>
              <div className="grid gap-4">
                <div className="flex items-center">
                  <Star className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Projects Contributed:</span>
                </div>
                <p className="text-sm text-muted-foreground">{userProfile.projectsContributed}</p>
              </div>
              <div className="grid gap-4">
                <div className="flex items-center">
                  <Award className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Quality Score:</span>
                </div>
                <p className="text-sm text-muted-foreground">{userProfile.qualityScore}%</p>
              </div>
              <div className="grid gap-4">
                <div className="flex items-center">
                  <Star className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Top Contributed Projects:</span>
                </div>
                <ul className="text-sm text-muted-foreground space-y-2">
                  {userProfile.topContributedProjects.map((project, index) => (
                    <li key={index}>
                      {project.name} - {project.entries} entries
                    </li>
                  ))}
                </ul>
              </div>
            </TabsContent>
            <TabsContent value="languages" className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center">
                  <Globe className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Languages:</span>
                </div>
                <ul className="text-sm text-muted-foreground space-y-2">
                  {userProfile.languages.map((lang, index) => (
                    <li key={index} className="flex justify-between">
                      <span>{lang.name}</span>
                      <Badge variant="outline">{lang.proficiency}</Badge>
                    </li>
                  ))}
                </ul>
              </div>
            </TabsContent>
            <TabsContent value="badges" className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center">
                  <span className="text-sm font-medium mr-2">Overall Badge:</span>
                  <Badge variant="secondary">{badgeLevel}</Badge>
                </div>
              </div>
              <div className="grid gap-4">
                <span className="text-sm font-medium">Earned Badges:</span>
                <div className="space-y-2">
                  {userProfile.badges.map((badge, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Badge variant={badge.color}>{badge.name}</Badge>
                      <span className="text-sm text-muted-foreground">{badge.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full">Edit Profile</Button>
        </CardFooter>
      </Card>
    </div>
  )
}