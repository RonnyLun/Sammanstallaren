import React from 'react';
import { Check } from 'lucide-react';

interface Step {
  number: number;
  label: string;
  status: 'completed' | 'active' | 'inactive';
}

interface ProgressStepperProps {
  steps: Step[];
}

export function ProgressStepper({ steps }: ProgressStepperProps) {
  return (
    <div className="flex items-start">
      {steps.map((step, index) => (
        <React.Fragment key={step.number}>
          <div className="flex flex-col items-center w-[40px]">
            <div
              className={`
                flex justify-center items-center w-10 h-10
                ${step.status === 'completed' 
                  ? 'bg-[#00733B] rounded-xl' 
                  : step.status === 'active'
                  ? 'bg-[#005595] rounded-xl'
                  : 'border-2 border-[#1C1C281A] rounded-xl'}
              `}
            >
              {step.status === 'completed' ? (
                <Check className="w-5 h-5 text-[#E1EFE9]" />
              ) : (
                <span className={`
                  font-bold text-base leading-6
                  ${step.status === 'active' ? 'text-[#E1ECF4]' : 'text-[#444450]'}
                `}>
                  {step.number}
                </span>
              )}
            </div>
            <span className={`
              text-base leading-6 text-center text-[#1F1F25] mt-1 w-[90px]
              ${step.status === 'active' ? 'font-bold' : 'font-normal'}
            `}>
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className="flex items-center h-10 flex-1 px-1">
              <div className="h-px w-full bg-[#1C1C281A] mt-5" />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}