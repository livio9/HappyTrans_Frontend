Please install react-textarea-autosize
```bash
npm install react-textarea-autosize
npm install @radix-ui/react-checkbox

```

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 开发提醒：
- 由于开发环境需要跨域请求，运行前检查是否在根目录下存在文件.env.local, 内容为：NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000，同时后端settings文件也需要作出相应修改。

-  界面逻辑介绍：
   -  Welcome界面，代码文件位于/src/app/welcome/page.tsx
   -  signin/signup,文件位于/src/app/signin/page.tsx和src/app/signup/page.tsx
   -  登陆之后进入进入主页面，主页面通过侧边栏可以切换到三个页面：
      -  Dashboard, 包含用户的个人主要信息，参与项目进度等等。位于/src/app/dashboard/page.tsx
      -  Projects， 包含所有的项目列表和用户参与的项目，提供项目搜索功能。管理员可以创建和管理项目。位于/src/app/projects/page.tsx
         -  进入某个项目后应保存项目上下文，进入语言选择界面，同时包含项目详细介绍、项目进度条等。选择语言后进入具体的词条界面，这个界面可以从browse-translations修改得到，截断显示所有的词条、tag和其翻译结果等信息，点击某一词条则跳转到具体的翻译界面。翻译界面为src/app/translation-interface下的page.tsx文件
      -  settings， 设置界面, 位于/src/app/settings/page.tsx


- 功能代码说明：
  - /src/app/components文件夹是在前端页面渲染的组件，这部分在绘制页面的时候会解决无需担心。
  - /src/app/context文件夹是用于保存需要的上下文环境。
    - AuthContext.js保存的是用户信息相关，在登陆后会进行保存，在需要用户信息验证的页面使用import { useAuth } from "@/context/AuthContext";即可使用钩子获取保存的信息。具体使用方法可以参考Projects页面的实现。
    - ProjectContext.js保存的是当前浏览的项目相关信息，目前只保存的项目的name，在进入语言界面就可以根据项目名调用project-info来获取项目的具体信息（包括简介以及后续会添加的翻译进度等等）
    - 目前可预计的上下文还有语言上下文和词条上下文。


