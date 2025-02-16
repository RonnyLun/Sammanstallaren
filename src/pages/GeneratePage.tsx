import React from 'react';
import { ArrowLeft, HelpCircle, RefreshCw, AlertCircle, CheckCircle2, Save } from 'lucide-react';
import { useIntricFlow } from '../hooks/useIntricFlow';
import type { FlowConfig } from '../types/config';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface GeneratePageProps {
  flow: FlowConfig;
  formData: Record<string, any>;
  onComplete: (sections: { title: string; answer: string }[]) => void;
  onBack: () => void;
}

interface SectionState {
  id: string;
  title: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  error?: string;
  answer?: string;
  sessionId?: string;
  assistantId?: string;
  isRegenerating?: boolean;
}

export function GeneratePage({ flow, formData, onComplete, onBack }: GeneratePageProps) {
  const [sections, setSections] = React.useState<SectionState[]>(() =>
    flow.steps.map((step, index) => ({
      id: step.id,
      title: `${index + 1}. ${step.name}`,
      status: 'pending',
      assistantId: step.intricServiceId,
      isRegenerating: false
    }))
  );
  
  const [regenerateText, setRegenerateText] = React.useState<Record<string, string>>({});
  const { steps, isComplete, hasError, interactWithSession } = useIntricFlow(flow, formData);

  // Update sections when steps change
  React.useEffect(() => {
    setSections(prev => prev.map(section => {
      const step = steps.find(s => s.id === section.id);
      if (!step) return section;
      return {
        ...section,
        status: step.status,
        error: step.error,
        answer: step.answer,
        sessionId: step.sessionId,
        isRegenerating: false
      };
    }));
  }, [steps]);

  const handleRegenerate = async (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section || !section.sessionId || !section.assistantId) return;

    const regeneratePrompt = regenerateText[sectionId];
    if (!regeneratePrompt) return;

    try {
      // Set regenerating state
      setSections(prev => prev.map(s => 
        s.id === sectionId ? { ...s, isRegenerating: true } : s
      ));

      const question = `generera om ditt svar komplett, men med följande anvisning: ${regeneratePrompt}`;
      const response = await interactWithSession(section.assistantId, section.sessionId, question);

      setSections(prev => prev.map(s => 
        s.id === sectionId ? { 
          ...s, 
          status: 'completed',
          answer: response.answer,
          isRegenerating: false
        } : s
      ));

      // Clear the regenerate text input
      setRegenerateText(prev => ({ ...prev, [sectionId]: '' }));
    } catch (error) {
      setSections(prev => prev.map(s => 
        s.id === sectionId ? { 
          ...s, 
          status: 'error',
          error: error instanceof Error ? error.message : 'Ett fel uppstod',
          isRegenerating: false
        } : s
      ));
    }
  };

  const allSectionsComplete = sections.every(section => section.status === 'completed');

  const handleSaveClick = () => {
    const completedSections = sections
      .filter(section => section.status === 'completed' && section.answer)
      .map(section => ({
        title: section.title,
        answer: section.answer!
      }));

    onComplete(completedSections);
  };

  return (
    <div className="max-w-[1000px] mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-[#1D1D1B]">
          Genererar {flow.name.toLowerCase()}
        </h1>
        <button className="text-[#006EC2] hover:text-[#005DA3]">
          <HelpCircle className="w-6 h-6" />
        </button>
      </div>

      <div className="bg-white rounded-lg p-8 space-y-6">
        {sections.map((section) => (
          <div
            key={section.id}
            className="py-4 border-b border-[#E5E5E5] last:border-b-0"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[#1D1D1B] font-medium">{section.title}</h3>
              <div className="ml-4">
                {section.status === 'running' ? (
                  <div className="w-6 h-6">
                    <RefreshCw className="w-6 h-6 text-[#006EC2] animate-spin" />
                  </div>
                ) : section.status === 'completed' ? (
                  <div className="w-6 h-6 text-[#34C759]">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                ) : section.status === 'error' ? (
                  <div className="w-6 h-6 text-red-500">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                ) : (
                  <div className="w-6 h-6 bg-[#E5E5E5] rounded-full" />
                )}
              </div>
            </div>

            {section.status === 'running' && (
              <p className="text-sm text-[#6E6E6E] mt-1">
                Genererar del, detta kan ta en stund...
              </p>
            )}

            {section.error && (
              <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {section.error}
              </p>
            )}

            {section.answer && (
              <div className="mt-4 space-y-4">
                <div className={`prose prose-sm max-w-none transition-opacity duration-200 ${
                  section.isRegenerating ? 'opacity-50' : 'opacity-100'
                }`}>
                  {section.isRegenerating && (
                    <div className="flex items-center justify-center py-4 text-[#006EC2]">
                      <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                      <span>Genererar nytt svar...</span>
                    </div>
                  )}
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={{
                      h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mb-4" {...props} />,
                      h2: ({ node, ...props }) => <h2 className="text-xl font-bold mb-3" {...props} />,
                      h3: ({ node, ...props }) => <h3 className="text-lg font-bold mb-2" {...props} />,
                      h4: ({ node, ...props }) => <h4 className="text-base font-bold mb-2" {...props} />,
                      p: ({ node, ...props }) => <p className="mb-4 text-[#1D1D1B]" {...props} />,
                      ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4" {...props} />,
                      ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-4" {...props} />,
                      li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                      blockquote: ({ node, ...props }) => (
                        <blockquote className="border-l-4 border-[#E5E5E5] pl-4 italic mb-4" {...props} />
                      ),
                      code: ({ node, inline, ...props }) =>
                        inline ? (
                          <code className="bg-[#F5F5F5] px-1 rounded" {...props} />
                        ) : (
                          <code className="block bg-[#F5F5F5] p-4 rounded mb-4" {...props} />
                        ),
                    }}
                  >
                    {section.answer}
                  </ReactMarkdown>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={regenerateText[section.id] || ''}
                    onChange={(e) => setRegenerateText(prev => ({
                      ...prev,
                      [section.id]: e.target.value
                    }))}
                    disabled={section.isRegenerating}
                    placeholder="Skriv instruktioner för att generera om svaret..."
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#006EC2]/20 focus:border-[#006EC2] disabled:bg-gray-50 disabled:text-gray-500"
                  />
                  <button
                    onClick={() => handleRegenerate(section.id)}
                    disabled={!regenerateText[section.id] || section.isRegenerating}
                    className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                      section.isRegenerating
                        ? 'bg-[#E5E5E5] text-[#6E6E6E] cursor-not-allowed'
                        : 'bg-[#006EC2] text-white hover:bg-[#005DA3]'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <RefreshCw className={`w-4 h-4 ${section.isRegenerating ? 'animate-spin' : ''}`} />
                    {section.isRegenerating ? 'Genererar...' : 'Generera om'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
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

        {allSectionsComplete && (
          <button
            onClick={handleSaveClick}
            className="flex items-center gap-2 px-6 py-3 bg-[#006EC2] text-white rounded-lg hover:bg-[#005DA3] transition-colors"
          >
            <Save className="w-5 h-5" />
            Spara dokument
          </button>
        )}
      </div>
    </div>
  );
}