import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MoodOption {
  emoji: string;
  label: string;
  value: string;
  color: string;
}

interface MoodSelectorProps {
  title: string;
  description: string;
  moods: MoodOption[];
  selectedMood?: string;
  onMoodSelect: (mood: string) => void;
  onClose?: () => void;
  showCloseButton?: boolean;
}

export function MoodSelector({ 
  title, 
  description, 
  moods, 
  selectedMood, 
  onMoodSelect, 
  onClose,
  showCloseButton = true 
}: MoodSelectorProps) {
  return (
    <Card className="w-full max-w-md mx-auto border-purple-200 bg-purple-50 dark:bg-purple-900/20">
      <CardHeader className="text-center">
        <CardTitle className="text-purple-800 dark:text-purple-200">{title}</CardTitle>
        <CardDescription className="text-purple-600 dark:text-purple-300">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {moods.map((mood) => (
            <Button
              key={mood.value}
              variant="outline"
              className={cn(
                "h-20 flex-col space-y-2 transition-all duration-200 hover:scale-105",
                selectedMood === mood.value 
                  ? `border-2 ${mood.color} bg-opacity-20` 
                  : "border-gray-200 hover:border-purple-300"
              )}
              onClick={() => onMoodSelect(mood.value)}
            >
              <div className="text-2xl">{mood.emoji}</div>
              <div className="text-xs font-medium">{mood.label}</div>
            </Button>
          ))}
        </div>
        
        {showCloseButton && onClose && (
          <div className="flex justify-center pt-4">
            <Button variant="ghost" onClick={onClose} className="text-purple-600">
              Continue without sharing
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
