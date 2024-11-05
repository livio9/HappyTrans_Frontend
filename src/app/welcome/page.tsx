import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Welcome() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-8">Welcome to TranslateOS</h1>
      <div className="space-y-4">
        <Button asChild className="w-64">
          <Link href="/signin">Sign In</Link>
        </Button>
        <Button asChild variant="outline" className="w-64">
          <Link href="/signup">Sign Up</Link>
        </Button>
      </div>
    </div>
  )
}