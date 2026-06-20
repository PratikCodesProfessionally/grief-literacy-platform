import * as React from 'react';
import { TemplateKey } from '../types';
import { Button } from '../../components/ui/button';

interface TemplateSelectorProps {
  activeTemplate: TemplateKey;
  onTemplateChange: (template: TemplateKey) => void;
}

const TEMPLATES: { key: TemplateKey; label: string; description: string }[] = [
  {
    key: 'traditional-floral',
    label: 'Traditional Floral',
    description: 'Classic mandala with petals and rings',
  },
  {
    key: 'dot-mandala',
    label: 'Dot Mandala',
    description: 'Mandala made of dots arranged in patterns',
  },
  {
    key: 'procedural',
    label: 'Procedural',
    description: 'Randomly generated unique mandala',
  },
  {
    key: 'geometric-sacred',
    label: 'Geometric Sacred',
    description: 'Sacred geometric shapes and patterns',
  },
  {
    key: 'organic-lotus',
    label: 'Organic Lotus',
    description: 'Lotus flower pattern mandala',
  },
];

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  activeTemplate,
  onTemplateChange,
}) => {
  return (
    <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
      <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">
        Mandala Templates
      </h3>

      <div className="grid grid-cols-1 gap-2">
        {TEMPLATES.map((template) => (
          <button
            key={template.key}
            onClick={() => onTemplateChange(template.key)}
            className={`p-3 rounded-lg text-left transition-all border-2 ${
              activeTemplate === template.key
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-700'
            }`}
          >
            <div className="font-medium text-slate-900 dark:text-white">{template.label}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">{template.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
};
