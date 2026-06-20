import * as React from 'react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Play, X, ChevronDown, ChevronUp } from 'lucide-react';

interface JavaScriptEditorProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  onCodeChange: (code: string) => void;
  onExecute: (code: string) => void;
  error: string | null;
  isExecuting?: boolean;
}

const EXAMPLE_SNIPPETS = [
  {
    name: 'Paint Random Petals',
    description: 'Fill random petals with random colors',
    code: `// Paint 10 random petals
for (let i = 0; i < 10; i++) {
  const petalIndex = Math.floor(mandala.random() * 12);
  const color = mandala.getColor(Math.floor(mandala.random() * 10));
  mandala.fillPetal(petalIndex, color);
}`,
  },
  {
    name: 'Fill by Pattern',
    description: 'Fill petals following a pattern',
    code: `// Fill every other petal
const colors = mandala.getPalette();
for (let i = 0; i < 12; i += 2) {
  mandala.fillPetal(i, colors[i % colors.length]);
}`,
  },
  {
    name: 'Gradient Effect',
    description: 'Create a gradient effect around the mandala',
    code: `// Create gradient effect
const palette = mandala.getPalette();
for (let i = 0; i < 12; i++) {
  const color = palette[Math.floor((i / 12) * palette.length)];
  mandala.fillPetal(i, color);
}`,
  },
  {
    name: 'Symmetric Pattern',
    description: 'Fill in a symmetric pattern',
    code: `// Symmetric pattern
const colors = mandala.getPalette();
for (let i = 0; i < 6; i++) {
  mandala.fillPetal(i, colors[0]);
  mandala.fillPetal(i + 6, colors[1]);
}`,
  },
  {
    name: 'Random Fill',
    description: 'Randomly fill entire mandala',
    code: `// Random fill mandala
const colors = mandala.getPalette();
for (let i = 0; i < 12; i++) {
  const color = colors[Math.floor(mandala.random() * colors.length)];
  mandala.fillPetal(i, color);
}`,
  },
  {
    name: 'Rainbow Pattern',
    description: 'Fill with rainbow colors',
    code: `// Rainbow effect
const colors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'];
for (let i = 0; i < 12; i++) {
  mandala.fillPetal(i, colors[i % colors.length]);
}`,
  },
  {
    name: 'Ring Fill',
    description: 'Fill all rings with a color',
    code: `// Fill rings
const color = mandala.getColor(0);
for (let i = 0; i < 5; i++) {
  mandala.fillRing(i, color);
}`,
  },
  {
    name: 'Alternating Rings',
    description: 'Alternate colors between rings',
    code: `// Alternating rings
const colors = mandala.getPalette();
for (let i = 0; i < 5; i++) {
  const color = colors[i % 2];
  mandala.fillRing(i, color);
}`,
  },
  {
    name: 'Checkerboard',
    description: 'Create a checkerboard pattern',
    code: `// Checkerboard pattern
const colors = mandala.getPalette();
for (let i = 0; i < 12; i++) {
  const colorIdx = (i % 2) * 2;
  mandala.fillPetal(i, colors[colorIdx]);
}`,
  },
  {
    name: 'Wave Pattern',
    description: 'Create a wave-like pattern',
    code: `// Wave pattern
const colors = mandala.getPalette();
for (let i = 0; i < 12; i++) {
  const offset = Math.floor((Math.sin(i * Math.PI / 6) + 1) * colors.length / 2);
  mandala.fillPetal(i, colors[offset % colors.length]);
}`,
  },
];

export const JavaScriptEditor: React.FC<JavaScriptEditorProps> = ({
  isOpen,
  onClose,
  code,
  onCodeChange,
  onExecute,
  error,
  isExecuting = false,
}) => {
  const [showExamples, setShowExamples] = React.useState(false);

  const handleSelectExample = (exampleCode: string) => {
    onCodeChange(exampleCode);
    setShowExamples(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Learn & Code - Mandala Editor</DialogTitle>
          <DialogDescription>
            Write JavaScript code to programmatically fill your mandala. Use the <code>mandala</code> object to interact with the drawing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Quick Reference */}
          <details className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded border border-blue-200 dark:border-blue-800">
            <summary className="cursor-pointer font-medium text-blue-900 dark:text-blue-100">
              📚 API Reference
            </summary>
            <div className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <div>
                <code className="bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded">
                  mandala.fillPetal(index, color)
                </code>
                - Fill a specific petal (0-11)
              </div>
              <div>
                <code className="bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded">
                  mandala.fillRing(index, color)
                </code>
                - Fill a specific ring (0-4)
              </div>
              <div>
                <code className="bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded">
                  mandala.fill(element, color)
                </code>
                - Fill any element by data-id
              </div>
              <div>
                <code className="bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded">
                  mandala.getColor(index)
                </code>
                - Get color at palette index
              </div>
              <div>
                <code className="bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded">
                  mandala.getPalette()
                </code>
                - Get all colors in current palette
              </div>
              <div>
                <code className="bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded">
                  mandala.random()
                </code>
                - Get random number 0-1
              </div>
            </div>
          </details>

          {/* Code Editor */}
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">
              Your Code
            </label>
            <textarea
              value={code}
              onChange={(e) => onCodeChange(e.target.value)}
              className="w-full h-64 p-3 font-mono text-sm bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-slate-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="// Write your mandala code here..."
              disabled={isExecuting}
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 p-3 rounded">
              <div className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">
                Error:
              </div>
              <div className="text-sm text-red-700 dark:text-red-300 font-mono break-words">
                {error}
              </div>
            </div>
          )}

          {/* Examples */}
          <button
            onClick={() => setShowExamples(!showExamples)}
            className="w-full flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded border border-purple-200 dark:border-purple-800 transition-colors"
          >
            <span className="font-medium text-purple-900 dark:text-purple-100">
              💡 Example Snippets ({EXAMPLE_SNIPPETS.length})
            </span>
            {showExamples ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {showExamples && (
            <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
              {EXAMPLE_SNIPPETS.map((snippet, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectExample(snippet.code)}
                  className="text-left p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  <div className="font-medium text-slate-900 dark:text-white text-sm">
                    {snippet.name}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {snippet.description}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={() => onExecute(code)}
              disabled={isExecuting || !code.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Play className="w-4 h-4 mr-2" />
              {isExecuting ? 'Executing...' : 'Execute Code'}
            </Button>
            <Button onClick={onClose} variant="outline" className="flex-1">
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
