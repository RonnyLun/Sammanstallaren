export interface InputField {
  id: string;
  name: string;
  hint?: string;
  mandatory: boolean;
  type: 'STRING' | 'TEXT' | 'DOCUMENT';
  cardinality: 'SINGLE_VALUED' | 'MULTIPLE_VALUED';
  passthrough?: boolean;
}

export interface StepInput {
  'flow-input-ref'?: string;
  'step-output-ref'?: string;
  name?: string;
}

export interface Step {
  id: string;
  order: number;
  name: string;
  intricServiceId: string;
  input: StepInput[];
}

export interface FlowConfig {
  id: string;
  municipalityId: string;
  name: string;
  description: string;
  inputPrefix: string;
  defaultTemplateId: string;
  input: InputField[];
  steps: Step[];
}