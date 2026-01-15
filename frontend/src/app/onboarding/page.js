// app/onboarding/page.js
"use client";
import { useState, useEffect, useRef } from "react";
import AnimatedBackground from "@/components/onboarding/AnimatedBackground";
import AnimatedFormCard from "@/components/onboarding/AnimatedFormCard";
import InformationPanel from "@/components/onboarding/InformationPanel";
import ProjectApplicationForm from "@/components/onboarding/ProjectApplicationForm";
import KYCVertification from "@/components/onboarding/KYCVertification";
import DocumentUpload from "@/components/onboarding/DocumentUpload";
import AuditorMatching from "@/components/onboarding/AuditorMatching";

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const containerRef = useRef();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const steps = [
    {
      id: 1,
      name: "Project",
      icon: "🏭",
      title: "Project Registration",
      subtitle: "Register your green energy project details",
    },
    {
      id: 2,
      name: "KYC",
      icon: "👤",
      title: "Identity Verification",
      subtitle: "Complete secure identity verification",
    },
    {
      id: 3,
      name: "Documents",
      icon: "📁",
      title: "Upload to Verify",
      subtitle: "Upload required project documentation",
    },
    {
      id: 4,
      name: "Auditor",
      icon: "🔍",
      title: "Verification Partner",
      subtitle: "Choose your audit partner",
    },
  ];

  const handleCardClick = (stepId) => {
    if (!isTransitioning) {
      setActiveStep(stepId);
      // Auto-open form for the clicked step
      setTimeout(() => setShowForm(true), 300);
    }
  };

  const handleStartForm = () => {
    setShowForm(true);
  };

  const nextStep = async () => {
    if (currentStep < steps.length && !isTransitioning) {
      setIsTransitioning(true);
      setShowForm(false);

      if (containerRef.current) {
        containerRef.current.style.transform = "rotateY(90deg) scale(0.9)";
        containerRef.current.style.opacity = "0";
      }

      await new Promise((resolve) => setTimeout(resolve, 400));

      setCurrentStep(currentStep + 1);
      setActiveStep(currentStep + 1);

      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.style.transform = "rotateY(0deg) scale(1)";
          containerRef.current.style.opacity = "1";
        }
        setIsTransitioning(false);
      }, 100);
    }
  };

  const prevStep = async () => {
    if (currentStep > 1 && !isTransitioning) {
      setIsTransitioning(true);
      setShowForm(false);

      if (containerRef.current) {
        containerRef.current.style.transform = "rotateY(-90deg) scale(0.9)";
        containerRef.current.style.opacity = "0";
      }

      await new Promise((resolve) => setTimeout(resolve, 400));

      setCurrentStep(currentStep - 1);
      setActiveStep(currentStep - 1);

      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.style.transform = "rotateY(0deg) scale(1)";
          containerRef.current.style.opacity = "1";
        }
        setIsTransitioning(false);
      }, 100);
    }
  };

  const renderForm = () => {
    switch (activeStep) {
      case 1:
        return <ProjectApplicationForm onNext={nextStep} />;
      case 2:
        return <KYCVertification onNext={nextStep} onBack={prevStep} />;
      case 3:
        return <DocumentUpload onNext={nextStep} onBack={prevStep} />;
      case 4:
        return <AuditorMatching onBack={prevStep} />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-700 to-gray-600 rounded-2xl animate-pulse mx-auto mb-4 flex items-center justify-center border border-gray-600">
            <span className="text-2xl">🌱</span>
          </div>
          <div className="text-white text-lg">Loading GreenXAiEDX...</div>
        </div>
      </div>
    );
  }

  const currentStepData = steps.find((step) => step.id === currentStep);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8 pt-20 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-600 rounded-xl flex items-center justify-center border border-gray-600">
              <span className="text-white font-bold text-lg">GX</span>
            </div>
            <h1 className="text-2xl font-bold text-white">
              Project Onboarding
            </h1>
          </div>
          <p className="text-gray-300 text-sm">
            Complete these 4 steps to start generating green credits
          </p>
        </div>

        {/* Horizontal Progress Steps - Improved */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center space-x-1 bg-gradient-to-br from-gray-800 to-gray-700 backdrop-blur-sm rounded-xl p-4 border border-gray-600 shadow-lg">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => !isTransitioning && handleCardClick(step.id)}
                  disabled={isTransitioning}
                  className={`
                    flex flex-col items-center px-6 py-3 rounded-lg transition-all duration-300 min-w-[120px] border
                    ${
                      currentStep >= step.id
                        ? "bg-gradient-to-br from-gray-700 to-gray-600 text-white border-gray-500 shadow-md"
                        : "bg-gradient-to-br from-gray-800 to-gray-700 text-gray-300 border-gray-600 hover:bg-gray-700"
                    }
                    ${isTransitioning ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                >
                  <span className="text-2xl mb-2">{step.icon}</span>
                  <span className="font-medium">{step.name}</span>
                  <span className="text-xs text-gray-400 mt-1">
                    Step {step.id}
                  </span>
                </button>
                {index < steps.length - 1 && (
                  <div
                    className={`
                    w-8 h-1 mx-2 rounded-full transition-all duration-300
                    ${currentStep > step.id ? "bg-gray-400" : "bg-gray-600"}
                  `}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content - Vertical Layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Side - Progress Overview */}
          <div className="lg:w-1/4">
            <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl border border-gray-600 p-6 shadow-lg">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center">
                <span className="mr-2">📊</span>
                Your Progress
              </h3>

              <div className="space-y-4 mb-8">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center space-x-3">
                    <div
                      className={`
                      w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold border
                      ${
                        currentStep > step.id
                          ? "bg-gradient-to-br from-gray-600 to-gray-500 text-white border-gray-500"
                          : currentStep === step.id
                          ? "bg-gradient-to-br from-gray-700 to-gray-600 text-white border-gray-400"
                          : "bg-gradient-to-br from-gray-800 to-gray-700 text-gray-400 border-gray-600"
                      }
                    `}
                    >
                      {step.id}
                    </div>
                    <div className="flex-1">
                      <div className="text-white text-sm font-medium">
                        {step.name}
                      </div>
                      <div className="text-gray-300 text-xs">{step.title}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Completion Status */}
              <div className="p-4 bg-gradient-to-br from-gray-700 to-gray-600 rounded-lg border border-gray-500">
                <div className="text-center">
                  <div className="text-white text-sm font-semibold mb-2">
                    {Math.round(((currentStep - 1) / steps.length) * 100)}%
                    Complete
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2 mb-1">
                    <div
                      className="bg-gradient-to-r from-gray-400 to-gray-300 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${((currentStep - 1) / steps.length) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="text-gray-300 text-xs">
                    {currentStep - 1} of {steps.length} steps completed
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Center - Main Card & Information */}
          <div className="lg:w-2/4">
            <div
              ref={containerRef}
              className="transition-all duration-500 ease-out transform w-full"
              style={{
                transformStyle: "preserve-3d",
                perspective: "1000px",
              }}
            >
              <div 
                onClick={() => handleCardClick(currentStepData.id)}
                className={`bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-600 rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 hover:border-gray-500 hover:shadow-xl ${
                  isTransitioning ? "opacity-50" : ""
                }`}
              >
                <div className="text-6xl mb-4">{currentStepData.icon}</div>
                <div className="text-white font-bold text-2xl mb-2">
                  {currentStepData.title}
                </div>
                <div className="text-gray-300 text-lg mb-6">
                  {currentStepData.subtitle}
                </div>
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-600 rounded-full border border-gray-500">
                  <span className="text-white font-bold text-2xl">{currentStepData.id}</span>
                </div>
                
                {/* Status indicator */}
                <div className="mt-8">
                  <div className="inline-flex items-center space-x-2 bg-gradient-to-br from-gray-700 to-gray-600 rounded-lg px-4 py-2 border border-gray-500">
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                    <span className="text-gray-200 text-sm">
                      Click to start Step {currentStepData.id}
                    </span>
                  </div>
                </div>
              </div>

              {/* Information Panel Below Card */}
              <div className="mt-8">
                <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl border border-gray-600 p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                    <span className="mr-2">ℹ️</span>
                    Step Information
                  </h3>
                  <div className="p-4 bg-gradient-to-br from-gray-700 to-gray-600 rounded-lg border border-gray-500 mb-4">
                    <div className="text-white font-medium text-lg mb-1">
                      {currentStepData.title}
                    </div>
                    <div className="text-gray-300 text-sm">
                      {currentStepData.subtitle}
                    </div>
                  </div>
                  <button
                    onClick={handleStartForm}
                    className="w-full bg-gradient-to-br from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white py-3 rounded-lg font-medium transition-all border border-gray-500"
                  >
                    Start This Step
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Instructions & Next Steps */}
          <div className="lg:w-1/4">
            <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl border border-gray-600 p-6 shadow-lg">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                <span className="mr-2">📋</span>
                Requirements
              </h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-gray-700 to-gray-600 rounded-full flex items-center justify-center border border-gray-500 mt-0.5">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <div className="text-gray-300 text-sm">
                    Valid government ID
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-gray-700 to-gray-600 rounded-full flex items-center justify-center border border-gray-500 mt-0.5">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <div className="text-gray-300 text-sm">
                    Project documentation
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-gray-700 to-gray-600 rounded-full flex items-center justify-center border border-gray-500 mt-0.5">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <div className="text-gray-300 text-sm">
                    Proof of project ownership
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-700 to-gray-600 rounded-lg border border-gray-500 p-4">
                <h4 className="text-white font-medium mb-2">Time to Complete</h4>
                <div className="text-gray-300 text-sm mb-2">~20-30 minutes</div>
                <div className="w-full bg-gray-600 rounded-full h-1">
                  <div className="w-3/4 bg-white h-1 rounded-full"></div>
                </div>
              </div>

              <div className="mt-6 text-center">
                <div className="text-gray-300 text-sm mb-2">
                  Need help? Contact support
                </div>
                <button className="text-white text-sm bg-gradient-to-br from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 px-4 py-2 rounded-lg border border-gray-500 transition-all">
                  Get Assistance
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl border border-gray-600 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {steps.find((s) => s.id === activeStep)?.title}
                  </h3>
                  <p className="text-gray-300 text-sm">
                    Step {activeStep} of {steps.length}
                  </p>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-600 rounded-lg flex items-center justify-center text-gray-300 hover:text-white transition-colors border border-gray-500"
                >
                  ✕
                </button>
              </div>
              {renderForm()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}