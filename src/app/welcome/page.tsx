"use client"

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Welcome() {
  const [currentStep, setCurrentStep] = useState(0);

  // 每个步骤的图片和说明
  const steps = [
    {
      title: "Step 1: Log In",
      description: "Start by logging in to your account.",
      image: "/image/1.PNG",
    },
    {
      title: "Step 2: Set Your Language in Settings",
      description: "Go to Settings and set up your preferred language.",
      image: "/image/2.PNG",
    },
    {
      title: "Step 3: View Project Information from Dashboard",
      description: "Go to your Dashboard to view and manage your projects.",
      image: "/image/3.PNG",
    },
    {
      title: "Step 4: Select a Project from Projects",
      description: "Go to Projects, choose a project, and enter it.",
      image: "/image/4.PNG",
    },
    {
      title: "Step 5: Choose a Language to Translate",
      description: "Inside the project, select the language you wish to translate.",
      image: "/image/5.PNG",
    },
    {
      title: "Step 6: Start Translating by Selecting a Term",
      description: "Select a term in the language interface to start translating.",
      image: "/image/6.PNG",
    },
    {
      title: "Step 7: Enter the Translation Interface and Begin Translating",
      description: "Now you're in the translation interface, ready to start your work.",
      image: "/image/7.PNG",
    },
  ];

  const goToNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-400 px-4">
      {/* 外层灰色容器，填充100%宽度 */}
      <div className="w-[70vw] bg-gray-400 p-4">

        {/* 欢迎部分 */}
        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-white flex items-center justify-center text-center">
          <span>—— ——</span>
          <span className="mx-4 md:mx-6">Welcome to TranslateOS</span>
          <span>—— ——</span>
        </h1>

        {/* 内层白色框，填充100%宽度，设置最大宽度以避免过宽 */}
        <div className="w-[60vw] bg-white text-gray-800 py-6 md:py-12 px-4 md:px-6 relative rounded-lg shadow-md mx-auto max-w-7xl">
          <div className="text-center w-full">
            <h2 className="text-xl md:text-2xl font-semibold">{steps[currentStep].title}</h2>

            {/* 图片与说明部分，使用响应式布局 */}
            <div className="mt-4 md:mt-6 flex flex-col items-center md:flex-row md:justify-center md:space-x-4">
              
              {/* 前一步的缩略图，只有在中等以上屏幕显示 */}
              {currentStep > 0 && (
                <img
                  src={steps[currentStep - 1].image}
                  alt={`Step ${currentStep}`}
                  className="hidden md:block w-1/4 max-w-[150px] h-auto transform scale-90 opacity-50 transition-all duration-300 border-2 border-gray-300 rounded-lg"
                />
              )}

              {/* 当前步骤图片，响应式缩放，并限制最大高度 */}
              <img
                src={steps[currentStep].image}
                alt={`Step ${currentStep + 1}`}
                className="w-full max-w-md h-auto transform scale-100 opacity-100 transition-all duration-300 border-2 border-gray-300 rounded-lg"
              />

              {/* 下一步的缩略图，只有在中等以上屏幕显示 */}
              {currentStep < steps.length - 1 && (
                <img
                  src={steps[currentStep + 1].image}
                  alt={`Step ${currentStep + 2}`}
                  className="hidden md:block w-1/4 max-w-[150px] h-auto transform scale-90 opacity-50 transition-all duration-300 border-2 border-gray-300 rounded-lg"
                />
              )}
            </div>

            {/* 说明文本，增加padding防止与图片重叠 */}
            <p className="mt-4 md:mt-6 text-sm md:text-base px-2 md:px-4 max-w-2xl mx-auto">
              {steps[currentStep].description}
            </p>

            {/* 步骤控制按钮，放在正常文档流中，避免重叠 */}
            <div className="flex justify-center space-x-2 md:space-x-4 mt-4 md:mt-6">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  className="px-3 py-2 md:px-4 md:py-3 text-sm md:text-base"
                  onClick={goToPreviousStep}
                >
                  ← Previous
                </Button>
              )}
              {currentStep < steps.length - 1 && (
                <Button
                  variant="outline"
                  className="px-3 py-2 md:px-4 md:py-3 text-sm md:text-base"
                  onClick={goToNextStep}
                >
                  Next →
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* 登录和注册按钮平齐排列，使用flex布局并居中 */}
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mt-6 md:mt-10 w-full max-w-2xl justify-center mx-auto">
          <Button className="w-full md:w-1/2 text-sm md:text-lg py-2 md:py-3">
            <Link href="/signin">Sign In</Link>
          </Button>
          <Button variant="outline" className="w-full md:w-1/2 text-sm md:text-lg py-2 md:py-3">
            <Link href="/signup">Sign Up</Link>
          </Button>
        </div>

        {/* 继续按钮居中，宽度适中 */}
        <div className="flex justify-center mt-4 md:mt-6">
          <Button variant="secondary" className="w-48 md:w-60 text-sm md:text-lg py-2 md:py-3">
            <Link href="public/projects">Continue Without Login</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
