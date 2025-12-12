/**
 * @fileoverview Real-time message broadcast service for support groups
 * Uses Supabase Realtime Broadcast to sync messages across devices
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { GroupPost } from '@/types/supportGroups';

interface MessageCallbacks {
  onNewMessage?: (message: GroupPost) => void;
  onError?: (error: Error) => void;
}

class GroupMessageService {
  private channels: Map<string, RealtimeChannel> = new Map();
  private callbacks: Map<string, MessageCallbacks> = new Map();
  private isSubscribed: Map<string, boolean> = new Map();

  /**
   * Check if realtime messaging is available
   */
  isAvailable(): boolean {
    return isSupabaseConfigured;
  }

  /**
   * Subscribe to messages for a group
   */
  async subscribeToMessages(
    groupId: string,
    callbacks?: MessageCallbacks
  ): Promise<void> {
    if (!isSupabaseConfigured) {
      console.warn('GroupMessageService: Supabase not configured, realtime messages disabled');
      return;
    }

    // Unsubscribe from existing channel if any
    await this.unsubscribeFromMessages(groupId);

    // Store callbacks
    if (callbacks) {
      this.callbacks.set(groupId, callbacks);
    }

    console.log(`[GroupMessage] Creating channel for group ${groupId}`);

    // Create broadcast channel for this group's messages
    // Use broadcast with self: true so sender also receives their own messages (for confirmation)
    const channel = supabase.channel(`group-messages:${groupId}`, {
      config: {
        broadcast: {
          self: false, // Don't send to self, we already have the message locally
        },
      },
    });

    // Listen for broadcast messages
    channel
      .on('broadcast', { event: 'new-message' }, (payload) => {
        console.log('[GroupMessage] *** RECEIVED NEW MESSAGE ***:', payload);
        const message = payload.payload as GroupPost;
        // Convert date string back to Date object
        message.createdAt = new Date(message.createdAt);
        const cb = this.callbacks.get(groupId);
        cb?.onNewMessage?.(message);
      });

    // Subscribe to the channel
    channel.subscribe((status) => {
      console.log(`[GroupMessage] Subscription status for group ${groupId}:`, status);
      if (status === 'SUBSCRIBED') {
        console.log(`[GroupMessage] ✅ Successfully subscribed to messages for group ${groupId}`);
        this.isSubscribed.set(groupId, true);
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`[GroupMessage] ❌ Error subscribing to group ${groupId}`);
        this.isSubscribed.set(groupId, false);
        callbacks?.onError?.(new Error('Failed to subscribe to messages'));
      } else if (status === 'CLOSED') {
        console.log(`[GroupMessage] Channel closed for group ${groupId}`);
        this.isSubscribed.set(groupId, false);
      }
    });

    this.channels.set(groupId, channel);
  }

  /**
   * Broadcast a new message to all subscribers
   */
  async broadcastMessage(groupId: string, message: GroupPost): Promise<void> {
    if (!isSupabaseConfigured) {
      console.warn('GroupMessageService: Supabase not configured, cannot broadcast');
      return;
    }

    const channel = this.channels.get(groupId);
    if (!channel) {
      console.error(`[GroupMessage] No channel for group ${groupId}, creating one...`);
      return;
    }

    const isReady = this.isSubscribed.get(groupId);
    if (!isReady) {
      console.warn(`[GroupMessage] Channel not ready for group ${groupId}, waiting...`);
      // Wait a bit for subscription to complete
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`[GroupMessage] Broadcasting message to group ${groupId}:`, message);

    // Broadcast the message to all subscribers
    const result = await channel.send({
      type: 'broadcast',
      event: 'new-message',
      payload: message,
    });

    console.log(`[GroupMessage] Broadcast result for group ${groupId}:`, result);
  }

  /**
   * Unsubscribe from a group's messages
   */
  async unsubscribeFromMessages(groupId: string): Promise<void> {
    const channel = this.channels.get(groupId);
    if (channel) {
      await supabase.removeChannel(channel);
      this.channels.delete(groupId);
      this.callbacks.delete(groupId);
      console.log(`[GroupMessage] Unsubscribed from group ${groupId}`);
    }
  }

  /**
   * Unsubscribe from all groups
   */
  async unsubscribeFromAll(): Promise<void> {
    const groupIds = Array.from(this.channels.keys());
    await Promise.all(groupIds.map((id) => this.unsubscribeFromMessages(id)));
  }
}

// Export singleton instance
export const groupMessageService = new GroupMessageService();
