/**
 * Haider Offline Messaging System - Root Application Component
 * Complete, functional, offline device-to-device messaging application
 * with private chats, group messaging, and iOS 26 Liquid Glass aesthetic.
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { SplashView } from './components/SplashView';
import { NavigationBar } from './components/NavigationBar';
import { HomeScreen } from './components/HomeScreen';
import { NearbyScreen } from './components/NearbyScreen';
import { GroupsScreen } from './components/GroupsScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { ChatScreen } from './components/ChatScreen';
import { CreateGroupModal } from './components/CreateGroupModal';
import { NewChatModal } from './components/NewChatModal';
import { GroupDetailModal } from './components/GroupDetailModal';
import { DiscoveredDevice, GroupChat } from './types';

function MainApp() {
  const {
    activeTab,
    currentChatId,
    currentChatType,
    closeChat,
    openPrivateChat,
    openGroupChat,
    groups,
    settings,
    stopScanning,
  } = useApp();

  const [showSplash, setShowSplash] = useState(true);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [activeGroupDetail, setActiveGroupDetail] = useState<GroupChat | null>(null);

  // Background Wallpaper Gradient
  const getWallpaperGradient = () => {
    switch (settings.wallpaper) {
      case 'grid':
        return 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950/60 via-[#060B18] to-cyan-950/40';
      case 'frosted':
        return 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/50 via-[#060B18] to-slate-950';
      case 'aurora':
        return 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-950/40 via-[#060B18] to-cyan-950/40';
      case 'cosmic':
      default:
        return 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/40 via-[#060B18] to-black';
    }
  };

  const currentGroup =
    currentChatType === 'group' ? groups.find((g) => g.id === currentChatId) : null;

  return (
    <div
      className={`min-h-screen text-slate-100 flex flex-col relative overflow-x-hidden ${getWallpaperGradient()} ${
        settings.fontSize === 'small'
          ? 'text-xs'
          : settings.fontSize === 'large'
          ? 'text-base'
          : 'text-sm'
      }`}
    >
      {/* Ambient background glows */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Splash Screen Animation with Skip Searching option */}
      {showSplash && (
        <SplashView
          onFinish={() => setShowSplash(false)}
          onSkip={() => {
            stopScanning();
            setShowSplash(false);
          }}
        />
      )}

      {/* Main Viewport Routing */}
      {currentChatId ? (
        <ChatScreen
          onBack={closeChat}
          onOpenGroupDetails={() => {
            if (currentGroup) {
              setActiveGroupDetail(currentGroup);
            }
          }}
        />
      ) : (
        <>
          {activeTab === 'chats' && (
            <HomeScreen
              onOpenCreateGroup={() => setShowCreateGroupModal(true)}
              onOpenNewChat={() => setShowNewChatModal(true)}
            />
          )}

          {activeTab === 'nearby' && (
            <NearbyScreen
              onStartChatWithPeer={(peer: DiscoveredDevice) => {
                openPrivateChat(peer);
              }}
            />
          )}

          {activeTab === 'groups' && (
            <GroupsScreen
              onOpenGroupChat={(group: GroupChat) => {
                openGroupChat(group);
              }}
            />
          )}

          {activeTab === 'settings' && <SettingsScreen />}

          {/* Persistent Floating iOS 26 Liquid Glass Navigation Bar */}
          <NavigationBar />
        </>
      )}

      {/* Global Modals */}
      <CreateGroupModal
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        onGroupCreated={(gId) => {
          const g = groups.find((item) => item.id === gId);
          if (g) openGroupChat(g);
        }}
      />

      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onSelectPeer={(peer) => openPrivateChat(peer)}
      />

      {activeGroupDetail && (
        <GroupDetailModal
          group={activeGroupDetail}
          onClose={() => setActiveGroupDetail(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
