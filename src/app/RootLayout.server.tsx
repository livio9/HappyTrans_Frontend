import { Metadata } from 'next';
import { AuthProvider } from '@/context/AuthContext';
import { ProjectProvider } from '@/context/ProjectContext';
import localFont from 'next/font/local';

// 页面元数据 (只能在服务器端定义)
export const metadata: Metadata = {
    title: 'TranslateOS',
    description: 'TranslateOS is a platform for translating open-source projects.',
};
// 字体加载
const geistSans = localFont({
    src: './fonts/GeistVF.woff',
    variable: '--font-geist-sans',
    weight: '100 900',
});
const geistMono = localFont({
    src: './fonts/GeistMonoVF.woff',
    variable: '--font-geist-mono',
    weight: '100 900',
});
export default function RootLayoutServer({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
            <head>
                <meta charSet="UTF-8" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1.0"
                />
                <title>TranslateOS</title>
            </head>
            <body>
                    <AuthProvider>
                        <ProjectProvider>
                                {children}
                        </ProjectProvider>
                    </AuthProvider>
            </body>
        </html>
    );
}
