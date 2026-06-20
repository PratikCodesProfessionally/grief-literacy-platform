import * as React from 'react';
import { SessionData } from '../types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface SessionManagerProps {
  showRestorePrompt: boolean;
  sessionData: SessionData | null;
  onRestore: () => void;
  onDiscard: () => void;
}

export const SessionManager: React.FC<SessionManagerProps> = ({
  showRestorePrompt,
  sessionData,
  onRestore,
  onDiscard,
}) => {
  if (!showRestorePrompt || !sessionData) return null;

  const sessionAge = Date.now() - sessionData.sessionStartTime;
  const sessionAgeMinutes = Math.floor(sessionAge / 60000);
  const sessionAgeHours = Math.floor(sessionAge / 3600000);

  let timeString = '';
  if (sessionAgeMinutes < 60) {
    timeString = `${sessionAgeMinutes} minute${sessionAgeMinutes !== 1 ? 's' : ''} ago`;
  } else if (sessionAgeHours < 24) {
    timeString = `${sessionAgeHours} hour${sessionAgeHours !== 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(sessionAge / 86400000);
    timeString = `${days} day${days !== 1 ? 's' : ''} ago`;
  }

  return (
    <Dialog open={showRestorePrompt}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <DialogTitle>Restore Previous Session?</DialogTitle>
          </div>
          <DialogDescription>
            We found an incomplete mandala from {timeString}. Would you like to continue?
          </DialogDescription>
        </DialogHeader>

        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Mandala Template:
            </span>
            <span className="text-sm font-bold text-slate-900 dark:text-white capitalize">
              {sessionData.template}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Mood:</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white capitalize">
              {sessionData.mood}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Colors Used:
            </span>
            <div className="flex gap-1">
              {sessionData.colorsUsed.slice(0, 5).map((color, idx) => (
                <div
                  key={idx}
                  className="w-4 h-4 rounded border border-slate-300 dark:border-slate-600"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
              {sessionData.colorsUsed.length > 5 && (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  +{sessionData.colorsUsed.length - 5}
                </span>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="grid grid-cols-2 gap-2">
          <Button onClick={onDiscard} variant="outline">
            Start New
          </Button>
          <Button onClick={onRestore} className="bg-blue-600 hover:bg-blue-700">
            <CheckCircle className="w-4 h-4 mr-2" />
            Restore
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface CompletionDialogProps {
  isOpen: boolean;
  percentComplete: number;
  duration: number;
  colorsUsed: number;
  onClose: () => void;
  onArchive: () => void;
}

export const CompletionDialog: React.FC<CompletionDialogProps> = ({
  isOpen,
  percentComplete,
  duration,
  colorsUsed,
  onClose,
  onArchive,
}) => {
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;

  return (
    <Dialog open={isOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <DialogTitle>Mandala Complete!</DialogTitle>
          </div>
          <DialogDescription>Your mandala has been saved to your history.</DialogDescription>
        </DialogHeader>

        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-6 rounded text-center space-y-4">
          <div>
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Completion</div>
            <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
              {Math.round(percentComplete)}%
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Time Spent</div>
              <div className="font-bold text-slate-900 dark:text-white">
                {minutes}:{seconds.toString().padStart(2, '0')}
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Colors Used</div>
              <div className="font-bold text-slate-900 dark:text-white">{colorsUsed}</div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} variant="outline" className="flex-1">
            Close
          </Button>
          <Button onClick={onArchive} className="flex-1 bg-blue-600 hover:bg-blue-700">
            View History
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
