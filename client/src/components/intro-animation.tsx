import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, BarChart3, FileText, CheckCircle } from 'lucide-react';

interface IntroAnimationProps {
  onComplete: () => void;
}

export function IntroAnimation({ onComplete }: IntroAnimationProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showContent, setShowContent] = useState(true);

  const steps = [
    {
      icon: FileText,
      title: "ContractAI",
      subtitle: "Legal-Tech Risk Analysis Platform"
    },
    {
      icon: Shield,
      title: "AI-Powered Analysis",
      subtitle: "Advanced contract risk detection"
    },
    {
      icon: BarChart3,
      title: "Smart Insights",
      subtitle: "Comprehensive risk scoring"
    },
    {
      icon: CheckCircle,
      title: "Ready",
      subtitle: "Let's analyze your contracts"
    }
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        setTimeout(() => {
          setShowContent(false);
          setTimeout(onComplete, 500);
        }, 1000);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [currentStep, onComplete]);

  return (
    <AnimatePresence>
      {showContent && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 flex items-center justify-center z-50"
        >
          <div className="text-center">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex flex-col items-center space-y-6"
            >
              {/* Icon */}
              <motion.div
                initial={{ rotate: -10 }}
                animate={{ rotate: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="p-6 bg-blue-600 text-white rounded-full shadow-2xl"
              >
                {React.createElement(steps[currentStep].icon, { size: 48 })}
              </motion.div>

              {/* Title */}
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-3xl font-bold text-gray-900 dark:text-white"
              >
                {steps[currentStep].title}
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="text-lg text-gray-600 dark:text-gray-300 max-w-md"
              >
                {steps[currentStep].subtitle}
              </motion.p>

              {/* Progress Dots */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.3 }}
                className="flex space-x-2 mt-8"
              >
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                      index <= currentStep
                        ? 'bg-blue-600'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                ))}
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}