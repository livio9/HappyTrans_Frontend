import './globals.css'; // 引入全局样式
import RootLayoutServer, { metadata } from './RootLayout.server';
import RootLayoutClient from './RootLayout.client';


// 根布局组件
export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <RootLayoutServer>
                <RootLayoutClient>{children}</RootLayoutClient>
        </RootLayoutServer>
    );
}
