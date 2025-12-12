/**
 * @fileoverview Real-time presence service for support groups
 * Uses Supabase Realtime Presence to track active members across devices
 * 
 * Key feature: Same user on multiple devices is counted as ONE member
 * This is achieved by using username as the presence key, not session/device ID
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface PresenceState {
  username: string;
  joinedAt: Date;
  deviceId: string;
}

interface GroupPresenceCallbacks {
  onMemberCountChange?: (count: number, members: string[]) => void;
  onMembersChange?: (members: PresenceState[]) => void;
  onError?: (error: Error) => void;
}

class GroupPresenceService {
  private channels: Map<string, RealtimeChannel> = new Map();
  private presenceStates: Map<string, Map<string, PresenceState>> = new Map();
  private callbacks: Map<string, GroupPresenceCallbacks> = new Map();
  private deviceId: string;

  constructor() {
    // Generate a unique device ID for this browser/device
    this.deviceId = this.getOrCreateDeviceId();
  }

  private getOrCreateDeviceId(): string {
    const storageKey = 'grief-platform-device-id';
    let deviceId = localStorage.getItem(storageKey);
    if (!deviceId) {
      deviceId = `device_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(storageKey, deviceId);
    }
    return deviceId;
  }

  /**
   * Check if realtime presence is available
   */
  isAvailable(): boolean {
    console.log('[GroupPresence] isAvailable check:', { isSupabaseConfigured });
    return isSupabaseConfigured;
  }

  /**
   * Join a group's presence channel
   * @param groupId The ID of the group to join
   * @param username The username of the current user (used for deduplication)
   * @param callbacks Optional callbacks for presence updates
   */
  async joinGroup(
    groupId: string,
    username: string,
    callbacks?: GroupPresenceCallbacks
  ): Promise<void> {
    console.log('[GroupPresence] joinGroup called:', { groupId, username, isSupabaseConfigured });
    
    if (!isSupabaseConfigured) {
      console.warn('GroupPresenceService: Supabase not configured, presence disabled');
      return;
    }

    // Leave existing channel for this group if any
    await this.leaveGroup(groupId);

    // Store callbacks
    if (callbacks) {
      this.callbacks.set(groupId, callbacks);
    }

    // Initialize presence state for this group
    this.presenceStates.set(groupId, new Map());

    // Create presence channel for this group
    const channel = supabase.channel(`group:${groupId}`, {
      config: {
        presence: {
          // Use username as the key - this ensures same user on multiple devices
          // is tracked as a single presence entry
          key: username,
        },
      },
    });

    // Track presence sync events
    channel
      .on('presence', { event: 'sync' }, () => {
        this.handlePresenceSync(groupId, channel);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log(`[GroupPresence] User ${key} joined group ${groupId}`, newPresences);
        this.handlePresenceSync(groupId, channel);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log(`[GroupPresence] User ${key} left group ${groupId}`, leftPresences);
        this.handlePresenceSync(groupId, channel);
      });

    // Subscribe to the channel
    const status = await channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Track our presence in the channel
        const presenceState: PresenceState = {
          username,
          joinedAt: new Date(),
          deviceId: this.deviceId,
        };

        const trackStatus = await channel.track(presenceState);
        console.log(`[GroupPresence] Tracked presence for ${username} in group ${groupId}:`, trackStatus);
      } else if (status === 'CHANNEL_ERROR') {
        callbacks?.onError?.(new Error('Failed to subscribe to presence channel'));
      }
    });

    this.channels.set(groupId, channel);
  }

  /**
   * Handle presence sync - count unique users (not devices)
   */
  private handlePresenceSync(groupId: string, channel: RealtimeChannel): void {
    const presenceState = channel.presenceState();
    const callbacks = this.callbacks.get(groupId);

    // presenceState is keyed by username (our presence key)
    // Each key may have multiple entries if user is on multiple devices
    // We want to count unique usernames only
    const uniqueUsernames = new Set<string>();
    const allMembers: PresenceState[] = [];

    for (const [username, presences] of Object.entries(presenceState)) {
      uniqueUsernames.add(username);
      // Get the most recent presence for this user
      // Supabase presence includes our custom data plus presence_ref
      const presenceArray = presences as unknown as Array<PresenceState & { presence_ref: string }>;
      const sortedPresences = presenceArray.sort(
        (a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()
      );
      if (sortedPresences.length > 0) {
        // Extract our PresenceState fields
        const { username: u, joinedAt, deviceId } = sortedPresences[0];
        allMembers.push({ username: u || username, joinedAt, deviceId });
      }
    }

    const memberCount = uniqueUsernames.size;
    const memberNames = Array.from(uniqueUsernames);

    console.log(`[GroupPresence] Group ${groupId} has ${memberCount} unique members:`, memberNames);

    // Notify via callbacks
    callbacks?.onMemberCountChange?.(memberCount, memberNames);
    callbacks?.onMembersChange?.(allMembers);
  }

  /**
   * Leave a group's presence channel
   */
  async leaveGroup(groupId: string): Promise<void> {
    const channel = this.channels.get(groupId);
    if (channel) {
      await channel.untrack();
      await supabase.removeChannel(channel);
      this.channels.delete(groupId);
      this.presenceStates.delete(groupId);
      this.callbacks.delete(groupId);
      console.log(`[GroupPresence] Left group ${groupId}`);
    }
  }

  /**
   * Get the current member count for a group
   */
  getMemberCount(groupId: string): number {
    const channel = this.channels.get(groupId);
    if (!channel) return 0;

    const presenceState = channel.presenceState();
    return Object.keys(presenceState).length;
  }

  /**
   * Get the list of unique members in a group
   */
  getMembers(groupId: string): string[] {
    const channel = this.channels.get(groupId);
    if (!channel) return [];

    const presenceState = channel.presenceState();
    return Object.keys(presenceState);
  }

  /**
   * Leave all groups (cleanup)
   */
  async leaveAllGroups(): Promise<void> {
    const groupIds = Array.from(this.channels.keys());
    await Promise.all(groupIds.map((groupId) => this.leaveGroup(groupId)));
  }
}

// Export singleton instance
export const groupPresenceService = new GroupPresenceService();
