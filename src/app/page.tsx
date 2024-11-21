import { redirect } from "next/navigation";

export default function Home() {
  redirect("/welcome"); // 自动跳转到 /welcome 页面
  return null;
}
