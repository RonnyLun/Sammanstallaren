import { useState, useCallback, useEffect } from 'react';
import { IntricClient } from '../lib/intric';
import type { FlowConfig, Step, InputField } from '../types/config';
import type { Session, FileUploadResponse } from '../types/intric';

interface StepState {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  error?: string;
  answer?: string;
  sessionId?: string;
}

interface UploadedFiles {
  [fieldId: string]: FileUploadResponse[];
}

export function useIntricFlow(flow: FlowConfig, formData: Record<string, any>) {
  const [client] = useState(() => new IntricClient());
  const [steps, setSteps] = useState<StepState[]>(() => 
    flow.steps.map(step => ({
      id: step.id,
      status: 'pending'
    }))
  );
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFiles>({});
  const [isUploading, setIsUploading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Upload all files once at the start
  const uploadFiles = useCallback(async () => {
    if (isUploading) return false;
    setIsUploading(true);

    try {
      const documentFields = flow.input.filter(
        (field): field is InputField & { type: 'DOCUMENT' } => field.type === 'DOCUMENT'
      );

      const allUploads: UploadedFiles = {};

      for (const field of documentFields) {
        const files = formData[field.id] as File[];
        if (!files?.length) continue;

        try {
          console.log(`Uploading files for ${field.name}...`);
          const uploadPromises = files.map(async file => {
            try {
              const response = await client.uploadFile(file);
              console.log(`Successfully uploaded file ${file.name}:`, response);
              return response;
            } catch (error) {
              console.error(`Failed to upload file ${file.name}:`, error);
              throw error;
            }
          });

          const uploadedFileResponses = await Promise.all(uploadPromises);
          allUploads[field.id] = uploadedFileResponses;
          
          console.log(`Successfully uploaded ${uploadedFileResponses.length} files for ${field.name}`);
        } catch (error) {
          console.error(`Failed to upload files for ${field.name}:`, error);
          throw new Error(`Failed to upload files for ${field.name}`);
        }
      }

      setUploadedFiles(allUploads);
      return true;
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, [client, flow.input, formData, isUploading]);

  // Get file IDs for a specific field
  const getFileIds = useCallback((fieldId: string): string[] => {
    const files = uploadedFiles[fieldId];
    if (!files?.length) {
      console.log(`No uploaded files found for field ${fieldId}`);
      return [];
    }
    const fileIds = files.map(f => f.id);
    console.log(`File IDs for field ${fieldId}:`, fileIds);
    return fileIds;
  }, [uploadedFiles]);

  // Prepare input for a step
  const prepareStepInput = useCallback((step: Step) => {
    const inputs = {
      text: '',
      fileIds: new Set<string>() // Use Set to avoid duplicate file IDs
    };

    for (const input of step.input) {
      if (input['flow-input-ref']) {
        const field = flow.input.find(f => f.id === input['flow-input-ref']);
        if (!field) continue;

        if (field.type === 'DOCUMENT') {
          const fieldFileIds = getFileIds(field.id);
          fieldFileIds.forEach(id => inputs.fileIds.add(id));
        } else {
          const value = formData[field.id];
          if (value) {
            inputs.text += `${field.name}: ${value}\n`;
          }
        }
      }
    }

    const result = {
      text: inputs.text.trim(),
      fileIds: Array.from(inputs.fileIds)
    };

    console.log(`Prepared input for step ${step.name}:`, result);
    return result;
  }, [flow.input, formData, getFileIds]);

  // Execute a single step
  const executeStep = useCallback(async (step: Step) => {
    try {
      setSteps(prev => prev.map(s => 
        s.id === step.id ? { ...s, status: 'running' } : s
      ));

      console.log(`Executing step ${step.name}...`);
      const { text, fileIds } = prepareStepInput(step);
      
      console.log(`Creating session for step ${step.name} with:`, {
        text,
        fileIds,
        assistantId: step.intricServiceId
      });

      // Create session with initial input
      const session = await client.createSession(step.intricServiceId, text, fileIds);
      
      console.log(`Session created successfully for step ${step.name}:`, session);
      setSteps(prev => prev.map(s => 
        s.id === step.id ? { 
          ...s, 
          status: 'completed',
          answer: session.answer,
          sessionId: session.id
        } : s
      ));

      return true;
    } catch (error) {
      console.error(`Failed to execute step ${step.name}:`, error);
      setSteps(prev => prev.map(s => 
        s.id === step.id ? { 
          ...s, 
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        } : s
      ));
      return false;
    }
  }, [client, prepareStepInput]);

  // Initialize by uploading files first
  useEffect(() => {
    if (!isInitialized && !isUploading) {
      uploadFiles()
        .then(() => {
          console.log('File upload completed successfully');
          setIsInitialized(true);
        })
        .catch(error => {
          console.error('Failed to upload files:', error);
          setSteps(prev => prev.map(s => ({
            ...s,
            status: 'error',
            error: 'Failed to upload files'
          })));
        });
    }
  }, [isInitialized, isUploading, uploadFiles]);

  // Execute steps sequentially after initialization
  useEffect(() => {
    const executeSteps = async () => {
      if (currentStepIndex >= flow.steps.length) return;

      try {
        const step = flow.steps[currentStepIndex];
        const success = await executeStep(step);

        if (success) {
          setCurrentStepIndex(prev => prev + 1);
        }
      } catch (error) {
        console.error('Step execution failed:', error);
      }
    };

    // Only start executing steps after initialization is complete
    if (isInitialized && !isUploading) {
      executeSteps();
    }
  }, [currentStepIndex, executeStep, flow.steps, isInitialized, isUploading]);

  const interactWithSession = useCallback(async (
    assistantId: string,
    sessionId: string,
    question: string
  ) => {
    return client.interactWithSession(assistantId, sessionId, question);
  }, [client]);

  return {
    steps,
    isComplete: currentStepIndex >= flow.steps.length && steps.every(s => s.status === 'completed'),
    hasError: steps.some(s => s.status === 'error'),
    interactWithSession
  };
}