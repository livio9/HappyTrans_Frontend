import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Welcome() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-8">Welcome to TranslateOS</h1>
      <div className="flex flex-col space-y-6 items-center">
        {/* 登录和注册按钮平齐排列 */}
        <div className="flex space-x-4">
          {/* 登录按钮 */}
          <Button asChild className="w-64">
            <Link href="/signin">Sign In</Link>
          </Button>
          {/* 注册按钮 */}
          <Button asChild variant="outline" className="w-64">
            <Link href="/signup">Sign Up</Link>
          </Button>
        </div>
        {/* 无需登录直接进入按钮 */}
        <Button asChild variant="secondary" className="w-64 mt-6">
          <Link href="/dashboard">Continue Without Login</Link>
        </Button>
      </div>
    </div>
  );
}
