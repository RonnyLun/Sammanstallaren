import React from 'react';
import { HomePage } from './pages/HomePage';
import { FormPage } from './pages/FormPage';
import { GeneratePage } from './pages/GeneratePage';
import { SavePage } from './pages/SavePage';
import { ProgressStepper } from './components/ProgressStepper';
import type { FlowConfig } from './types/config';

function App() {
  const [currentPage, setCurrentPage] = React.useState<'home' | 'form' | 'generate' | 'save'>('home');
  const [selectedFlow, setSelectedFlow] = React.useState<FlowConfig | null>(null);
  const [formData, setFormData] = React.useState<Record<string, any>>({});
  const [generatedSections, setGeneratedSections] = React.useState<{ title: string; answer: string }[]>([]);

  const steps = [
    { 
      number: 1, 
      label: 'Välj typ',
      status: currentPage === 'home' 
        ? 'active' 
        : currentPage === 'form' || currentPage === 'generate' || currentPage === 'save'
        ? 'completed'
        : 'inactive'
    },
    { 
      number: 2, 
      label: 'Lägg till uppgifter',
      status: currentPage === 'form'
        ? 'active'
        : currentPage === 'generate' || currentPage === 'save'
        ? 'completed'
        : 'inactive'
    },
    { 
      number: 3, 
      label: 'Sammanställa',
      status: currentPage === 'generate'
        ? 'active'
        : currentPage === 'save'
        ? 'completed'
        : 'inactive'
    },
    {
      number: 4,
      label: 'Spara dokument',
      status: currentPage === 'save' ? 'active' : 'inactive'
    }
  ];

  const handleFlowSelect = (flow: FlowConfig) => {
    setSelectedFlow(flow);
    setCurrentPage('form');
  };

  const handleFormSubmit = (data: Record<string, any>) => {
    setFormData(data);
    setCurrentPage('generate');
  };

  const handleGenerateComplete = (sections: { title: string; answer: string }[]) => {
    setGeneratedSections(sections);
    setCurrentPage('save');
  };

  const handleStartNew = () => {
    setSelectedFlow(null);
    setFormData({});
    setGeneratedSections([]);
    setCurrentPage('home');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F5F5]">
      <header className="bg-white border-b border-[#E5E5E5] sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-8 py-4">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-semibold text-[#1D1D1B]">Automatiska sammanställningar</h1>
            <p className="text-sm text-[#6E6E6E]">Sundsvalls Kommun</p>
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-[#E5E5E5] sticky top-[73px] z-40">
        <div className="max-w-5xl mx-auto px-8 py-4">
          <ProgressStepper steps={steps} />
        </div>
      </div>

      <main className="flex-grow">
        <div className="max-w-5xl mx-auto px-8 py-12">
          {currentPage === 'home' && (
            <HomePage onCardClick={handleFlowSelect} />
          )}
          {currentPage === 'form' && selectedFlow && (
            <FormPage 
              flow={selectedFlow}
              onSubmit={handleFormSubmit}
              onBack={() => setCurrentPage('home')}
            />
          )}
          {currentPage === 'generate' && selectedFlow && (
            <GeneratePage 
              flow={selectedFlow}
              formData={formData}
              onComplete={handleGenerateComplete}
              onBack={() => setCurrentPage('form')}
            />
          )}
          {currentPage === 'save' && selectedFlow && (
            <SavePage
              sections={generatedSections}
              flowName={selectedFlow.name}
              onBack={() => setCurrentPage('generate')}
              onStartNew={handleStartNew}
            />
          )}
        </div>
      </main>

      <footer className="bg-[#1D1D1B] text-white py-8">
        <div className="max-w-5xl mx-auto px-8">
          <div>
            <h4 className="font-semibold mb-2">Kontakt</h4>
            <a href="mailto:admin.exempel@sundsvall.se" className="text-[#E5E5E5] hover:text-white transition-colors">
              admin.exempel@sundsvall.se
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;