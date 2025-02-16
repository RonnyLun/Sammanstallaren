import React from 'react';
import type { FlowConfig, InputField } from '../types/config';
import { FileUpload } from './FileUpload';
import { AlertCircle } from 'lucide-react';

interface DynamicFormProps {
  flow: FlowConfig;
  onSubmit: (data: Record<string, any>) => void;
}

interface ValidationError {
  fieldId: string;
  message: string;
}

export function DynamicForm({ flow, onSubmit }: DynamicFormProps) {
  const [formData, setFormData] = React.useState<Record<string, any>>({});
  const [errors, setErrors] = React.useState<ValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const validateForm = (): ValidationError[] => {
    const newErrors: ValidationError[] = [];
    
    flow.input.forEach(field => {
      if (field.mandatory) {
        const value = formData[field.id];
        if (!value || (Array.isArray(value) && value.length === 0)) {
          newErrors.push({
            fieldId: field.id,
            message: 'Detta fält är obligatoriskt'
          });
        }
      }
      
      if (field.type === 'DOCUMENT' && formData[field.id]) {
        const files = Array.isArray(formData[field.id]) ? formData[field.id] : [formData[field.id]];
        files.forEach(file => {
          if (file.size > 2 * 1024 * 1024) {
            newErrors.push({
              fieldId: field.id,
              message: 'Filen är för stor (max 2MB)'
            });
          }
        });
      }
    });

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    setErrors(newErrors);
    
    if (newErrors.length === 0) {
      try {
        setIsSubmitting(true);
        await onSubmit(formData);
      } catch (error) {
        setErrors([{ 
          fieldId: 'form',
          message: 'Ett fel uppstod. Försök igen senare.'
        }]);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleInputChange = (field: InputField, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field.id]: value
    }));
    setErrors(prev => prev.filter(error => error.fieldId !== field.id));
  };

  const getFieldErrors = (fieldId: string) => {
    return errors.filter(error => error.fieldId === fieldId);
  };

  const renderField = (field: InputField) => {
    const fieldErrors = getFieldErrors(field.id);
    const hasError = fieldErrors.length > 0;

    const baseInputClasses = `
      w-full px-3 py-2 border rounded-lg transition-colors
      ${hasError 
        ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
        : 'border-[#E5E5E5] focus:border-[#006EC2] focus:ring-2 focus:ring-[#006EC2]/20'}
    `;

    const renderFieldContent = () => {
      switch (field.type) {
        case 'STRING':
          return (
            <input
              type="text"
              id={field.id}
              value={formData[field.id] || ''}
              onChange={(e) => handleInputChange(field, e.target.value)}
              placeholder={field.hint}
              required={field.mandatory}
              aria-invalid={hasError}
              aria-describedby={hasError ? `${field.id}-error` : undefined}
              className={baseInputClasses}
            />
          );
        
        case 'TEXT':
          return (
            <textarea
              id={field.id}
              value={formData[field.id] || ''}
              onChange={(e) => handleInputChange(field, e.target.value)}
              placeholder={field.hint}
              required={field.mandatory}
              rows={4}
              aria-invalid={hasError}
              aria-describedby={hasError ? `${field.id}-error` : undefined}
              className={`${baseInputClasses} resize-none`}
            />
          );
        
        case 'DOCUMENT':
          return (
            <FileUpload
              label={field.name}
              onChange={(files) => handleInputChange(field, files)}
              accept=".pdf,.doc,.docx"
              multiple={field.cardinality === 'MULTIPLE_VALUED'}
              error={hasError ? fieldErrors[0].message : undefined}
            />
          );
        
        default:
          return null;
      }
    };

    return (
      <div className="flex flex-col space-y-1">
        {renderFieldContent()}
        {hasError && (
          <div 
            id={`${field.id}-error`}
            className="text-sm text-red-500 flex items-center gap-1"
          >
            <AlertCircle className="w-4 h-4" />
            {fieldErrors[0].message}
          </div>
        )}
      </div>
    );
  };

  // Group and sort fields based on order and type
  const groupFields = () => {
    const sortedFields = [...flow.input].sort((a, b) => {
      // If both fields have order, sort by order
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      // If only one has order, prioritize the one with order
      if (a.order !== undefined) return -1;
      if (b.order !== undefined) return 1;
      // If neither has order, maintain original order
      return 0;
    });

    const textFields = sortedFields.filter(field => field.type === 'TEXT');
    const otherFields = sortedFields.filter(field => field.type !== 'TEXT');
    
    return {
      column1: [...otherFields.slice(0, Math.ceil(otherFields.length / 2))],
      column2: [...otherFields.slice(Math.ceil(otherFields.length / 2))],
      textFields
    };
  };

  const { column1, column2, textFields } = groupFields();

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      {errors.some(error => error.fieldId === 'form') && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <p>{errors.find(error => error.fieldId === 'form')?.message}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-6">
          {column1.map((field) => (
            <div key={field.id}>
              <label 
                htmlFor={field.id} 
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {field.name}
                {field.mandatory && <span className="text-red-500 ml-1" aria-label="obligatoriskt">*</span>}
              </label>
              {field.hint && (
                <p className="text-sm text-gray-500 mb-2">{field.hint}</p>
              )}
              {renderField(field)}
            </div>
          ))}
        </div>

        <div className="space-y-6">
          {column2.map((field) => (
            <div key={field.id}>
              <label 
                htmlFor={field.id} 
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {field.name}
                {field.mandatory && <span className="text-red-500 ml-1" aria-label="obligatoriskt">*</span>}
              </label>
              {field.hint && (
                <p className="text-sm text-gray-500 mb-2">{field.hint}</p>
              )}
              {renderField(field)}
            </div>
          ))}
        </div>
      </div>

      {textFields.length > 0 && (
        <div className="space-y-6">
          {textFields.map((field) => (
            <div key={field.id}>
              <label 
                htmlFor={field.id} 
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {field.name}
                {field.mandatory && <span className="text-red-500 ml-1" aria-label="obligatoriskt">*</span>}
              </label>
              {field.hint && (
                <p className="text-sm text-gray-500 mb-2">{field.hint}</p>
              )}
              {renderField(field)}
            </div>
          ))}
        </div>
      )}
      
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 bg-[#006EC2] text-white rounded-lg hover:bg-[#005DA3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Genererar...' : 'Generera skrivelse'}
        </button>
      </div>
    </form>
  );
}