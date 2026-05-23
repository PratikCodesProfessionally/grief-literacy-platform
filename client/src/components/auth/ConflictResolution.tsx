import React, { useEffect, useState } from 'react';
import { SyncService } from '../../services/SyncService';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

interface Conflict {
  id: string;
  entry_id: string;
  local_version: number;
  cloud_version: number;
  local_data: any;
  cloud_data: any;
  created_at: string;
}

interface ConflictResolutionProps {
  userId: string;
  onResolved?: () => void;
}

export const ConflictResolution: React.FC<ConflictResolutionProps> = ({ userId, onResolved }) => {
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [selectedConflict, setSelectedConflict] = useState<Conflict | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConflicts();
  }, [userId]);

  const loadConflicts = async () => {
    setLoading(true);
    const data = await SyncService.getConflicts(userId);
    setConflicts(data);
    setLoading(false);
  };

  const handleResolve = async (
    conflictId: string,
    strategy: 'keep_local' | 'keep_cloud' | 'merge'
  ) => {
    await SyncService.resolveConflict(conflictId, strategy);
    await loadConflicts();
    setSelectedConflict(null);
    onResolved?.();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (conflicts.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-600">
          <svg
            className="w-12 h-12 mx-auto text-green-500 mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="font-medium">No Sync Conflicts</p>
          <p className="text-sm mt-1">All your journal entries are in sync</p>
        </div>
      </Card>
    );
  }

  if (selectedConflict) {
    return (
      <Card className="p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Resolve Sync Conflict</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedConflict(null)}
            >
              Back to List
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Local Version */}
            <div className="border border-blue-300 rounded-lg p-4 bg-blue-50">
              <div className="flex items-center gap-2 mb-3">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span className="font-semibold text-blue-900">Local Version</span>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-gray-700">
                  <strong>Version:</strong> {selectedConflict.local_version}
                </p>
                <p className="text-gray-700">
                  <strong>Updated:</strong>{' '}
                  {new Date(selectedConflict.local_data.updatedAt).toLocaleString()}
                </p>
                <div className="mt-3 p-3 bg-white rounded border border-blue-200 max-h-40 overflow-y-auto">
                  <p className="text-gray-800 whitespace-pre-wrap">
                    {selectedConflict.local_data.content?.substring(0, 200)}
                    {selectedConflict.local_data.content?.length > 200 && '...'}
                  </p>
                </div>
              </div>
              <Button
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
                onClick={() => handleResolve(selectedConflict.id, 'keep_local')}
              >
                Keep Local Version
              </Button>
            </div>

            {/* Cloud Version */}
            <div className="border border-green-300 rounded-lg p-4 bg-green-50">
              <div className="flex items-center gap-2 mb-3">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                  />
                </svg>
                <span className="font-semibold text-green-900">Cloud Version</span>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-gray-700">
                  <strong>Version:</strong> {selectedConflict.cloud_version}
                </p>
                <p className="text-gray-700">
                  <strong>Updated:</strong>{' '}
                  {new Date(selectedConflict.cloud_data.updated_at).toLocaleString()}
                </p>
                <div className="mt-3 p-3 bg-white rounded border border-green-200 max-h-40 overflow-y-auto">
                  <p className="text-gray-800 whitespace-pre-wrap">
                    {selectedConflict.cloud_data.encrypted_content?.substring(0, 200)}
                    {selectedConflict.cloud_data.encrypted_content?.length > 200 && '...'}
                  </p>
                  <p className="text-xs text-gray-500 mt-2 italic">(Encrypted content preview)</p>
                </div>
              </div>
              <Button
                className="w-full mt-4 bg-green-600 hover:bg-green-700"
                onClick={() => handleResolve(selectedConflict.id, 'keep_cloud')}
              >
                Keep Cloud Version
              </Button>
            </div>
          </div>

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex gap-3">
              <svg
                className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="text-sm text-yellow-800">
                <p className="font-semibold">Choose Carefully</p>
                <p>The version you don't select will be permanently discarded.</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <svg
            className="w-6 h-6 text-orange-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Sync Conflicts Detected</h3>
            <p className="text-sm text-gray-600">
              {conflicts.length} {conflicts.length === 1 ? 'entry' : 'entries'} need your attention
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {conflicts.map((conflict) => (
            <div
              key={conflict.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    Entry from {new Date(conflict.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Local v{conflict.local_version} vs Cloud v{conflict.cloud_version}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setSelectedConflict(conflict)}
                >
                  Resolve
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
