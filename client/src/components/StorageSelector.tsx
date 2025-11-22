import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Smartphone, 
  Cloud, 
  Shield, 
  Lock, 
  Wifi, 
  WifiOff, 
  HardDrive,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { StorageType } from '@/services/JournalStorageService';

interface StorageSelectorProps {
  onSelect: (type: StorageType) => void;
  currentSelection?: StorageType;
}

export function StorageSelector({ onSelect, currentSelection }: StorageSelectorProps) {
  const [expandedOption, setExpandedOption] = React.useState<StorageType | null>(null);

  const storageOptions = [
    {
      type: 'local' as StorageType,
      icon: Smartphone,
      color: 'from-amber-500 to-orange-600',
      bgColor: 'bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/30',
      title: 'Private & Offline',
      subtitle: 'Entries stay only on this device',
      features: [
        { icon: Lock, text: 'Complete privacy - never leaves your device' },
        { icon: WifiOff, text: 'Works offline always' },
        { icon: Shield, text: 'No account required' },
        { icon: HardDrive, text: 'Stored securely on your device' }
      ],
      pros: ['Maximum privacy', 'No internet needed', 'Instant access', 'No account setup'],
      cons: ['Device-specific', 'Manual backup needed', 'Lost if device fails'],
      recommended: 'Best for: Maximum privacy, offline writing, single-device users'
    },
    {
      type: 'cloud' as StorageType,
      icon: Cloud,
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/30',
      title: 'Secure & Accessible',
      subtitle: 'Access from any device with encryption',
      features: [
        { icon: Cloud, text: 'Access from phone, tablet, computer' },
        { icon: Shield, text: 'End-to-end encryption' },
        { icon: Wifi, text: 'Automatic backup' },
        { icon: Lock, text: 'You control the encryption key' }
      ],
      pros: ['Multi-device access', 'Automatic backup', 'Never lose entries', 'Sync across devices'],
      cons: ['Requires internet', 'Account required', 'Small monthly fee (optional)'],
      recommended: 'Best for: Multi-device users, wanting automatic backup'
    },
    {
      type: 'hybrid' as StorageType,
      icon: HardDrive,
      color: 'from-purple-500 to-pink-600',
      bgColor: 'bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/30',
      title: 'Best of Both',
      subtitle: 'Auto-backup with local priority',
      features: [
        { icon: Smartphone, text: 'Write offline, sync when ready' },
        { icon: Cloud, text: 'Automatic cloud backup' },
        { icon: Shield, text: 'Local-first for speed and privacy' },
        { icon: Lock, text: 'Choose which entries to sync' }
      ],
      pros: ['Works offline', 'Cloud backup', 'Fast access', 'Flexible sync'],
      cons: ['Slightly more complex', 'Requires occasional internet'],
      recommended: 'Best for: Users wanting both privacy and backup security'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          Where would you like to keep your journal?
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Choose how your entries are stored. You can change this anytime, and we'll help you migrate your entries.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {storageOptions.map((option) => {
          const Icon = option.icon;
          const isExpanded = expandedOption === option.type;
          const isSelected = currentSelection === option.type;

          return (
            <Card 
              key={option.type}
              className={`
                relative transition-all duration-300 cursor-pointer
                ${isSelected ? 'ring-4 ring-blue-500 shadow-2xl' : 'hover:shadow-xl'}
                ${option.bgColor}
              `}
              onClick={() => !isSelected && onSelect(option.type)}
            >
              {isSelected && (
                <div className="absolute -top-3 -right-3 bg-blue-500 text-white rounded-full p-2 shadow-lg">
                  <Check className="h-5 w-5" />
                </div>
              )}

              <CardHeader>
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${option.color} flex items-center justify-center mb-4 mx-auto`}>
                  <Icon className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-center text-xl">{option.title}</CardTitle>
                <CardDescription className="text-center">{option.subtitle}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Key Features */}
                <div className="space-y-2">
                  {option.features.map((feature, idx) => {
                    const FeatureIcon = feature.icon;
                    return (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <FeatureIcon className="h-4 w-4 mt-0.5 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{feature.text}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Learn More Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedOption(isExpanded ? null : option.type);
                  }}
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-2" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-2" />
                      Learn More
                    </>
                  )}
                </Button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="space-y-3 pt-3 border-t">
                    <div>
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Pros:</p>
                      <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                        {option.pros.map((pro, idx) => (
                          <li key={idx} className="flex items-start gap-1">
                            <span className="text-green-600">✓</span>
                            <span>{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Considerations:</p>
                      <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                        {option.cons.map((con, idx) => (
                          <li key={idx} className="flex items-start gap-1">
                            <span className="text-gray-400">•</span>
                            <span>{con}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Badge variant="outline" className="w-full justify-center text-xs py-1">
                      {option.recommended}
                    </Badge>
                  </div>
                )}

                {/* Select Button */}
                {!isSelected && (
                  <Button
                    className="w-full mt-4"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(option.type);
                    }}
                  >
                    Choose {option.title}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Comparison Table */}
      <Card className="bg-white/50 dark:bg-gray-900/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-center">Quick Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Feature</th>
                  <th className="text-center py-3 px-4">Private & Offline</th>
                  <th className="text-center py-3 px-4">Secure & Accessible</th>
                  <th className="text-center py-3 px-4">Best of Both</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 dark:text-gray-400">
                <tr className="border-b">
                  <td className="py-3 px-4">Privacy Level</td>
                  <td className="text-center">★★★★★</td>
                  <td className="text-center">★★★★☆</td>
                  <td className="text-center">★★★★★</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4">Multi-Device Access</td>
                  <td className="text-center">✗</td>
                  <td className="text-center">✓</td>
                  <td className="text-center">✓</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4">Works Offline</td>
                  <td className="text-center">✓</td>
                  <td className="text-center">Partial</td>
                  <td className="text-center">✓</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4">Automatic Backup</td>
                  <td className="text-center">Manual</td>
                  <td className="text-center">✓</td>
                  <td className="text-center">✓</td>
                </tr>
                <tr>
                  <td className="py-3 px-4">Internet Required</td>
                  <td className="text-center">Never</td>
                  <td className="text-center">Yes</td>
                  <td className="text-center">Optional</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Notice */}
      <div className="mt-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-full">
          <Shield className="h-4 w-4 text-blue-600" />
          <span className="text-sm text-blue-900 dark:text-blue-200">
            <strong>Your data is always encrypted.</strong> We never read your entries or share with third parties.
          </span>
        </div>
      </div>
    </div>
  );
}
