import { useState, useCallback } from 'react';
import { AIFlowService, AIFlowSession, StepExecution } from '../lib/aiflow';

const aiflow = new AIFlowService();

interface FormData {
  arendenummer?: string;
  uppdrag?: string;
  forvaltning?: string;
  bakgrundsmaterial?: File[];
  styrdokument?: File[];
}

interface UseAIFlowReturn {
  session: AIFlowSession | null;
  loading: boolean;
  error: string | null;
  startGeneration: (formData: FormData) => Promise<void>;
  downloadDocument: () => Promise<void>;
}

export function useAIFlow(): UseAIFlowReturn {
  const [session, setSession] = useState<AIFlowSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startGeneration = useCallback(async (formData: FormData) => {
    setLoading(true);
    setError(null);
    
    try {
      // 1. Create session
      const newSession = await aiflow.createSession();
      setSession(newSession);

      // 2. Add input data
      const inputs: Record<string, string | File[]> = {};
      
      if (formData.arendenummer) inputs['arendenummer'] = formData.arendenummer;
      if (formData.uppdrag) inputs['uppdrag'] = formData.uppdrag;
      if (formData.forvaltning) inputs['forvaltning'] = formData.forvaltning;
      if (formData.bakgrundsmaterial) inputs['bakgrundsmaterial'] = formData.bakgrundsmaterial;
      if (formData.styrdokument) inputs['styrdokument'] = formData.styrdokument;

      const sessionWithInput = await aiflow.addInput(newSession.id, inputs);
      setSession(sessionWithInput);

      // 3. Run all steps
      const steps = ['arendet', 'bakgrund', 'overvaganden', 'juridik', 
                    'ekologisk', 'social', 'landsbygd'];
      
      for (const stepId of steps) {
        const stepExecution = await aiflow.runStep(newSession.id, stepId);
        
        // Poll for completion
        let currentExecution = stepExecution;
        while (currentExecution.state === 'RUNNING') {
          await new Promise(resolve => setTimeout(resolve, 1000));
          currentExecution = await aiflow.getStepStatus(newSession.id, stepId);
        }

        if (currentExecution.state === 'ERROR') {
          throw new Error(`Step ${stepId} failed: ${currentExecution.errorMessage}`);
        }

        setSession(prev => prev ? {
          ...prev,
          stepExecutions: {
            ...prev.stepExecutions,
            [stepId]: currentExecution
          }
        } : null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const downloadDocument = useCallback(async () => {
    if (!session) {
      setError('No active session');
      return;
    }

    try {
      setLoading(true);
      const blob = await aiflow.generateDocument(session.id);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Tjänsteskrivelse-${new Date().toISOString().split('T')[0]}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download document');
    } finally {
      setLoading(false);
    }
  }, [session]);

  return {
    session,
    loading,
    error,
    startGeneration,
    downloadDocument
  };
}