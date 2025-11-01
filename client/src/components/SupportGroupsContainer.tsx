import * as React from 'react';
import { AnonymousRegistration } from '@/components/AnonymousRegistration';
import { GroupBrowser } from '@/components/GroupBrowser';
import { GroupView } from '@/components/GroupView';
import { MyGroups } from '@/components/MyGroups';
import { Button } from '@/components/ui/button';
import { supportGroupsService } from '@/services/SupportGroupsService';
import { User, SupportGroup } from '@/types/supportGroups';
import { LogOut, Home, Users } from 'lucide-react';

type View = 'my-groups' | 'browse' | 'group-detail';

export function SupportGroupsContainer() {
  const [user, setUser] = React.useState<User | null>(null);
  const [currentView, setCurrentView] = React.useState<View>('my-groups');
  const [selectedGroup, setSelectedGroup] = React.useState<SupportGroup | null>(null);

  React.useEffect(() => {
    // Check if user is already registered
    const existingUser = supportGroupsService.getCurrentUser();
    if (existingUser) {
      setUser(existingUser);
    }
  }, []);

  const handleRegistrationComplete = (newUser: User) => {
    setUser(newUser);
    setCurrentView('browse');
  };

  const handleJoinGroup = (group: SupportGroup) => {
    setSelectedGroup(group);
    setCurrentView('group-detail');
  };

  const handleViewGroup = (group: SupportGroup) => {
    setSelectedGroup(group);
    setCurrentView('group-detail');
  };

  const handleBackToGroups = () => {
    setSelectedGroup(null);
    setCurrentView('my-groups');
  };

  const handleBrowseGroups = () => {
    setCurrentView('browse');
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out? You can return anytime using this device.')) {
      supportGroupsService.clearCurrentUser();
      setUser(null);
      setCurrentView('my-groups');
      setSelectedGroup(null);
    }
  };

  const handleGoToMyGroups = () => {
    setCurrentView('my-groups');
    setSelectedGroup(null);
  };

  if (!user) {
    return <AnonymousRegistration onComplete={handleRegistrationComplete} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {/* Top Navigation Bar */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-800 dark:text-white">
                Support Groups
              </h1>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {user.username}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {currentView !== 'my-groups' && (
                <Button variant="outline" size="sm" onClick={handleGoToMyGroups}>
                  <Home className="h-4 w-4 mr-2" />
                  My Groups
                </Button>
              )}
              {currentView !== 'browse' && (
                <Button variant="outline" size="sm" onClick={handleBrowseGroups}>
                  <Users className="h-4 w-4 mr-2" />
                  Browse
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {currentView === 'my-groups' && (
          <MyGroups
            user={user}
            onViewGroup={handleViewGroup}
            onBrowseGroups={handleBrowseGroups}
          />
        )}

        {currentView === 'browse' && (
          <GroupBrowser
            user={user}
            onJoinGroup={handleJoinGroup}
          />
        )}

        {currentView === 'group-detail' && selectedGroup && (
          <GroupView
            group={selectedGroup}
            user={user}
            onBack={handleBackToGroups}
          />
        )}
      </main>
    </div>
  );
}
