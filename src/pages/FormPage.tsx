import React from 'react';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import { DynamicForm } from '../components/DynamicForm';
import type { FlowConfig } from '../types/config';

interface FormPageProps {
  flow: FlowConfig;
  onSubmit: (data: Record<string, any>) => void;
  onBack: () => void;
}

export function FormPage({ flow, onSubmit, onBack }: FormPageProps) {
  return (
    <div className="max-w-[1000px] mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-[#1D1D1B]">
          {flow.name}
        </h1>
        <button className="text-[#006EC2] hover:text-[#005DA3]">
          <HelpCircle className="w-6 h-6" />
        </button>
      </div>

      <div className="bg-white rounded-lg p-8">
        <DynamicForm flow={flow} onSubmit={onSubmit} />
      </div>

      <div className="flex justify-between mt-8">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center text-[#1D1D1B] hover:text-[#006EC2] transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Gå tillbaka
        </button>
      </div>
    </div>
  );
}