
import React, { useState, useEffect } from 'react';
import { CheckIcon } from './Icons';

interface StatusTimelineProps {
  steps: { key: string; label: string }[];
  history: { status: string; date: string }[];
}

const StatusTimeline: React.FC<StatusTimelineProps> = ({ steps, history = [] }) => {
  const historyMap = new Map(history.map(h => [h.status, h.date]));
  
  let activeStepIndex = -1;
  // This finds the last step in the `steps` array that has a corresponding entry in `history`.
  for (let i = steps.length - 1; i >= 0; i--) {
    if (historyMap.has(steps[i].key)) {
      activeStepIndex = i;
      break;
    }
  }

  const [isAnimated, setIsAnimated] = useState(false);

  useEffect(() => {
    // Reset and trigger animation when history changes (e.g., drawer opens with new order)
    setIsAnimated(false);
    const timer = setTimeout(() => {
        setIsAnimated(true);
    }, 100);
    return () => clearTimeout(timer);
  }, [history]);

  return (
    <div className="w-full pt-4">
      <div className="flex">
        {steps.map((step, index) => {
          const isCompleted = index <= activeStepIndex;
          const isActive = index === activeStepIndex;
          const isLastStep = index === steps.length - 1;

          return (
            <div key={step.key} className="flex-1 relative">
              <div className="flex flex-col items-center">
                {/* Node */}
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center z-10 transition-all duration-300 ease-in-out
                  ${(isCompleted && isAnimated) ? 'bg-blue-600 border-blue-600' : 'bg-white border-2 border-gray-300'}`}
                  style={{ transitionDelay: `${index * 150}ms` }}
                >
                  {isCompleted && (
                      <CheckIcon 
                          className="w-4 h-4 text-white transition-opacity duration-300" 
                          strokeWidth={3}
                          style={{ 
                              opacity: isAnimated ? 1 : 0,
                              transitionDelay: `${index * 150 + 200}ms`
                          }} 
                      />
                  )}
                </div>

                {/* Label */}
                <p className={`mt-2 text-center text-xs sm:text-sm whitespace-nowrap px-1
                  ${isActive ? 'font-bold text-gray-900' : 'font-medium text-gray-500'}`}
                >
                  {step.label}
                </p>
              </div>

              {/* Connector Line */}
              {!isLastStep && (
                <div
                  className={`absolute top-3 left-1/2 w-full h-1 bg-gray-300`}
                >
                   <div
                      className="h-full bg-blue-600 transition-all duration-500 ease-out"
                      style={{ 
                          width: isAnimated && isCompleted ? '100%' : '0%',
                          transitionDelay: `${index * 150}ms` 
                      }}
                  ></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StatusTimeline;
