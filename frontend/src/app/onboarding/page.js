// app/onboarding/page.js
'use client';
import { useState, useEffect, useRef } from 'react';
import AnimatedBackground from '@/components/onboarding/AnimatedBackground';
import AnimatedFormCard from '@/components/onboarding/AnimatedFormCard';
import InformationPanel from '@/components/onboarding/InformationPanel';
import ProjectApplicationForm from '@/components/onboarding/ProjectApplicationForm';
import KYCVertification from '@/components/onboarding/KYCVertification';
import DocumentUpload from '@/components/onboarding/DocumentUpload';
import AuditorMatching from '@/components/onboarding/AuditorMatching';

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
    { id: 1, name: 'Project', icon: '🏭', title: 'Project Registration', subtitle: 'Register your green energy project details' },
    { id: 2, name: 'KYC', icon: '👤', title: 'Identity Verification', subtitle: 'Complete secure identity verification' },
    { id: 3, name: 'Documents', icon: '📁', title: 'Upload to Verify', subtitle: 'Upload required project documentation' },
    { id: 4, name: 'Auditor', icon: '🔍', title: 'Verification Partner', subtitle: 'Choose your audit partner' }
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
        containerRef.current.style.transform = 'rotateY(90deg) scale(0.9)';
        containerRef.current.style.opacity = '0';
      }

      await new Promise(resolve => setTimeout(resolve, 400));
      
      setCurrentStep(currentStep + 1);
      setActiveStep(currentStep + 1);
      
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.style.transform = 'rotateY(0deg) scale(1)';
          containerRef.current.style.opacity = '1';
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
        containerRef.current.style.transform = 'rotateY(-90deg) scale(0.9)';
        containerRef.current.style.opacity = '0';
      }

      await new Promise(resolve => setTimeout(resolve, 400));
      
      setCurrentStep(currentStep - 1);
      setActiveStep(currentStep - 1);
      
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.style.transform = 'rotateY(0deg) scale(1)';
          containerRef.current.style.opacity = '1';
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl animate-pulse mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl">🌱</span>
          </div>
          <div className="text-white text-lg">Loading GreenXchange...</div>
        </div>
      </div>
    );
  }

  const currentStepData = steps.find(step => step.id === currentStep);

  return (
    <div className="min-h-screen bg-black py-8 pt-20 relative overflow-hidden">
      <AnimatedBackground />
      
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Simple Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">GX</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Project Onboarding</h1>
          </div>
          <p className="text-gray-400 text-sm">Complete these 4 steps to start generating green credits</p>
        </div>

        {/* Progress Steps - Horizontal */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center space-x-2 bg-black/30 backdrop-blur-sm rounded-xl p-3 border border-gray-800">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => !isTransitioning && handleCardClick(step.id)}
                  disabled={isTransitioning}
                  className={`
                    flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 text-sm min-w-[100px] justify-center
                    ${currentStep >= step.id 
                      ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-md' 
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }
                    ${isTransitioning ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <span>{step.icon}</span>
                  <span className="font-medium">{step.name}</span>
                </button>
                {index < steps.length - 1 && (
                  <div className={`
                    w-6 h-1 mx-2 rounded-full transition-all duration-300
                    ${currentStep > step.id ? 'bg-emerald-500' : 'bg-gray-700'}
                  `} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Centered Animated Card at Top */}
        <div className="flex justify-center mb-12">
          <div
            ref={containerRef}
            className="transition-all duration-500 ease-out transform"
            style={{
              transformStyle: 'preserve-3d',
              perspective: '1000px'
            }}
          >
            <AnimatedFormCard
              title={currentStepData.title}
              subtitle={currentStepData.subtitle}
              icon={currentStepData.icon}
              stepNumber={currentStepData.id}
              isActive={!isTransitioning}
              onClick={() => handleCardClick(currentStepData.id)}
            />
          </div>
        </div>

        {/* Symmetrical Content Below - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Left Side - Project Information */}
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-gray-700 p-6">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-xl flex items-center justify-center mr-4">
                <span className="text-2xl">📋</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Project Information Required</h2>
                <p className="text-gray-400 text-sm">
                  We need details about your green energy project to create verifiable credits
                </p>
              </div>
            </div>

            <div className="mb-6">
              <button
                onClick={handleStartForm}
                className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white py-3 rounded-lg font-semibold text-base transition-all duration-300"
              >
                Start Filling Information
              </button>
            </div>

            <div className="border-t border-gray-800 pt-6">
              <h3 className="text-lg font-bold text-white mb-4">Information You'll Need</h3>
              
              <div className="space-y-6">
                {/* Item 1 */}
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-emerald-900/30 border border-emerald-500 rounded-lg flex items-center justify-center text-emerald-400 font-bold mr-3 flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">Project Name & Location</h4>
                    <p className="text-gray-400 text-sm mb-2">
                      Identify and locate your project for verification
                    </p>
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <p className="text-emerald-300 text-sm italic">
                        e.g., Rajasthan Solar Park, India
                      </p>
                    </div>
                  </div>
                </div>

                {/* Item 2 */}
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-emerald-900/30 border border-emerald-500 rounded-lg flex items-center justify-center text-emerald-400 font-bold mr-3 flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">Project Type & Capacity</h4>
                    <p className="text-gray-400 text-sm mb-2">
                      Determine credit type and environmental impact
                    </p>
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <p className="text-emerald-300 text-sm italic">
                        e.g., Solar Farm, 50MW capacity
                      </p>
                    </div>
                  </div>
                </div>

                {/* Item 3 */}
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-emerald-900/30 border border-emerald-500 rounded-lg flex items-center justify-center text-emerald-400 font-bold mr-3 flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">Expected Credits</h4>
                    <p className="text-gray-400 text-sm mb-2">
                      Estimate annual green credit generation
                    </p>
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <p className="text-emerald-300 text-sm italic">
                        e.g., 5,000 credits per year
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Onboarding Progress */}
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-gray-700 p-6">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
              <span className="text-emerald-400 mr-2">📊</span>
              Onboarding Progress
            </h3>
            
            {/* Progress Steps List */}
            <div className="space-y-4 mb-6">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center space-x-3">
                  <div className={`
                    w-10 h-10 rounded-xl flex items-center justify-center text-lg
                    ${currentStep > step.id 
                      ? 'bg-emerald-500 text-white' 
                      : currentStep === step.id
                      ? 'bg-cyan-500 text-white'
                      : 'bg-gray-700 text-gray-400'
                    }
                  `}>
                    {step.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium">{step.title}</div>
                        <div className="text-gray-400 text-sm">{step.subtitle}</div>
                      </div>
                      <div className={`
                        w-3 h-3 rounded-full
                        ${currentStep > step.id ? 'bg-emerald-500' : 
                          currentStep === step.id ? 'bg-cyan-500 animate-pulse' : 'bg-gray-600'
                        }
                      `} />
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`
                        ml-5 mt-2 h-4 w-0.5
                        ${currentStep > step.id ? 'bg-emerald-500' : 'bg-gray-700'}
                      `} />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Completion Stats */}
            <div className="bg-gray-800/50 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400 text-sm">Overall Progress</span>
                <span className="text-emerald-400 font-semibold">
                  {Math.round(((currentStep - 1) / steps.length) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${((currentStep - 1) / steps.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Helpful Tips */}
            <div className="border-t border-gray-800 pt-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                <span className="text-cyan-400 mr-2">💡</span>
                Helpful Tips
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <div className="text-white text-sm font-medium">Prepare Documents in Advance</div>
                    <div className="text-gray-400 text-xs">
                      Have your project plans, land ownership, and permits ready before starting
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <div className="text-white text-sm font-medium">Accurate Data Matters</div>
                    <div className="text-gray-400 text-xs">
                      Precise measurements lead to faster verification and accurate credit calculation
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <div className="text-white text-sm font-medium">Save Your Progress</div>
                    <div className="text-gray-400 text-xs">
                      You can save at any point and return later to complete the onboarding
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-gray-700 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white">{steps.find(s => s.id === activeStep)?.title}</h3>
                  <p className="text-gray-400 text-sm">Step {activeStep} of {steps.length}</p>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors"
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
