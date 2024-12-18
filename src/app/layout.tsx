import localFont from "next/font/local";
import "./globals.css"; // 引入全局样式
import RootLayoutServer, { metadata } from './RootLayout.server';
import RootLayoutClient from './RootLayout.client';
import { ThemeProvider } from "@/context/ThemeContext";

// 字体加载
const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

// 根布局组件
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RootLayoutServer>
      <ThemeProvider>
        <RootLayoutClient>{children}</RootLayoutClient>
      </ThemeProvider>
    </RootLayoutServer>
  );
}
