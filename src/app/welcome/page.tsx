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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-400 overflow-auto">
      {/* 欢迎部分 */}
      <h1 className="text-5xl font-bold mb-8 text-white flex items-center text-center">
        <span>—— ——</span>
        <span className="mx-8">Welcome to TranslateOS</span>
        <span>—— ——</span>
      </h1>
      
      {/* 使用min-h代替固定高度，使内容可随屏幕大小自动扩展 */}
      <div className="bg-gray-100 text-gray-800 py-16 px-8 w-screen relative">
        <div className="text-center w-full max-w-screen-xl mx-auto">
          <h2 className="text-3xl font-semibold mt-0">{steps[currentStep].title}</h2>

          {/* 图片与说明部分，使用响应式布局 */}
          <div className="mt-8 flex flex-col items-center md:flex-row md:justify-center md:space-x-8">
            
            {/* 前一步的缩略图，只有在中等以上屏幕显示 */}
            {currentStep > 0 && (
              <img
                src={steps[currentStep - 1].image}
                alt={`Step ${currentStep}`}
                className="hidden md:block md:w-[300px] md:h-auto transform scale-90 opacity-50 transition-all duration-500 border-4 border-gray-300 rounded-lg"
              />
            )}
            
            {/* 当前步骤图片，响应式缩放 */}
            <img
              src={steps[currentStep].image}
              alt={`Step ${currentStep + 1}`}
              className="w-full max-w-[650px] h-auto transform scale-100 opacity-100 transition-all duration-500 border-4 border-gray-300 rounded-lg"
            />

            {/* 下一步的缩略图，只有在中等以上屏幕显示 */}
            {currentStep < steps.length - 1 && (
              <img
                src={steps[currentStep + 1].image}
                alt={`Step ${currentStep + 2}`}
                className="hidden md:block md:w-[300px] md:h-auto transform scale-90 opacity-50 transition-all duration-500 border-4 border-gray-300 rounded-lg"
              />
            )}
          </div>

          {/* 说明文本，增加padding防止与图片重叠 */}
          <p className="mt-8 text-xl px-4 max-w-3xl mx-auto">
            {steps[currentStep].description}
          </p>

          {/* 步骤控制按钮，放在正常文档流中，避免重叠 */}
          <div className="flex justify-center space-x-8 mt-8">
            {currentStep > 0 && (
              <Button
                variant="outline"
                className="w-36 text-gray-800 text-lg py-3"
                onClick={goToPreviousStep}
              >
                ← Previous
              </Button>
            )}
            {currentStep < steps.length - 1 && (
              <Button
                variant="outline"
                className="w-36 text-gray-800 text-lg py-3"
                onClick={goToNextStep}
              >
                Next →
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 登录和注册按钮平齐排列，使用flex布局并居中 */}
      <div className="flex flex-col md:flex-row space-y-8 md:space-y-0 md:space-x-8 mt-14 justify-center">
        <Button className="w-72 text-xl py-4">
          <Link href="/signin">Sign In</Link>
        </Button>
        <Button variant="outline" className="w-72 text-xl py-4">
          <Link href="/signup">Sign Up</Link>
        </Button>
      </div>

      <Button variant="secondary" className="w-72 mt-8 text-xl py-4">
        <Link href="/dashboard">Continue Without Login</Link>
      </Button>
    </div>
  );
}
