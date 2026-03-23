'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

const steps = [
  { path: '/onboarding', label: 'إنشاء المنشأة' },
  { path: '/onboarding/business-type', label: 'نوع النشاط' },
  { path: '/onboarding/select-plan', label: 'اختيار الباقة' },
];

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Determine current step index
  const currentStepIndex = steps.findIndex(step => pathname === step.path || pathname.startsWith(step.path + '/'));
  const currentStep = Math.max(0, currentStepIndex);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Bar Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.path} className="flex items-center">
                {/* Step Circle */}
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300 ${
                    index <= currentStep
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-300 bg-gray-100 text-gray-400'
                  }`}
                >
                  {index < currentStep ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>

                {/* Step Label - Hide on mobile for steps after current */}
                <span
                  className={`hidden sm:block mr-2 text-sm font-medium transition-colors duration-300 ${
                    index <= currentStep ? 'text-gray-900' : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </span>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="w-16 sm:w-24 mx-2 h-0.5 bg-gray-200 overflow-hidden">
                    <div
                      className={`h-full bg-primary transition-all duration-500 ${
                        index < currentStep ? 'w-full' : 'w-0'
                      }`}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Progress Text */}
          <div className="text-center text-sm text-muted-foreground">
            الخطوة {currentStep + 1} من {steps.length}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
