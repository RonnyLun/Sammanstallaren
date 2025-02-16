import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { FlowConfig } from '../types/config';

interface FlowCardProps {
  flow: FlowConfig;
  onClick: () => void;
  colorScheme?: 'purple' | 'blue' | 'green' | 'gray';
}

const colorSchemes = {
  purple: {
    bg: 'bg-[#F8F2FF]',
    hover: 'hover:ring-purple-400',
    icon: 'bg-purple-600 group-hover:bg-purple-700'
  },
  blue: {
    bg: 'bg-[#F2F9FF]',
    hover: 'hover:ring-blue-400',
    icon: 'bg-blue-600 group-hover:bg-blue-700'
  },
  green: {
    bg: 'bg-[#F2FFF9]',
    hover: 'hover:ring-green-400',
    icon: 'bg-green-600 group-hover:bg-green-700'
  },
  gray: {
    bg: 'bg-white',
    hover: 'hover:ring-gray-400',
    icon: 'bg-gray-600 group-hover:bg-gray-700'
  }
};

export function FlowCard({ flow, onClick, colorScheme = 'blue' }: FlowCardProps) {
  const colors = colorSchemes[colorScheme];

  return (
    <button 
      onClick={onClick}
      className={`group ${colors.bg} p-6 rounded-lg text-left hover:ring-2 ${colors.hover} transition-all w-full`}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-semibold mb-2">{flow.name}</h3>
          <p className="text-gray-600">
            {flow.description}
          </p>
        </div>
        <div className={`p-2 rounded-full ${colors.icon} text-white`}>
          <ChevronRight className="w-5 h-5" />
        </div>
      </div>
    </button>
  );
}