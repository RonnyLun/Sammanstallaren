import React from 'react';
import { FlowCard } from '../components/FlowCard';
import type { FlowConfig } from '../types/config';
import flowConfigs from '../config/flows.json';

interface HomePageProps {
  onCardClick: (flow: FlowConfig) => void;
}

const colorSchemes = ['purple', 'blue', 'green', 'gray'] as const;

export function HomePage({ onCardClick }: HomePageProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Välj typ av dokument att sammanställa</h2>
        <p className="text-gray-600">
          Välj den typ av dokument du vill skapa. Varje dokument har olika fält och krav som måste fyllas i.
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        {flowConfigs.map((flow, index) => (
          <FlowCard
            key={flow.id}
            flow={flow}
            onClick={() => onCardClick(flow)}
            colorScheme={colorSchemes[index % colorSchemes.length]}
          />
        ))}
      </div>
    </div>
  );
}