/**
 * @fileoverview Storage service for anonymous support groups
 * Handles user registration, group management, and post persistence
 */

import { User, SupportGroup, GroupPost, GroupTopicTemplate, GroupTopic } from '@/types/supportGroups';

const USER_STORAGE_KEY = 'grief-literacy-current-user';
const GROUPS_STORAGE_KEY = 'grief-literacy-support-groups';

// Predefined group topic templates
const GROUP_TEMPLATES: GroupTopicTemplate[] = [
  {
    topic: 'Loss of Parent',
    description: 'For those honoring a mother or father',
    icon: '🕊️',
  },
  {
    topic: 'Pet Loss Haven',
    description: 'Remembering our beloved companions',
    icon: '🐾',
  },
  {
    topic: 'Sudden Loss Sanctuary',
    description: 'Processing the unexpected',
    icon: '💔',
  },
  {
    topic: 'Pregnancy & Infant Loss',
    description: 'Honoring the smallest lives',
    icon: '👶',
  },
  {
    topic: 'Young Hearts Gathering',
    description: 'For young adults (18-35) on this journey',
    icon: '🌱',
  },
  {
    topic: 'Relationship Transitions',
    description: 'Grieving love that has changed',
    icon: '💫',
  },
  // Original templates
  {
    topic: 'Anxiety Support',
    description: 'A safe space to share experiences and coping strategies for anxiety',
    icon: '🌊',
  },
  {
    topic: 'Grief & Loss',
    description: 'Support for those navigating loss and the grieving process',
    icon: '🕊️',
  },
  {
    topic: 'Life Transitions',
    description: 'Navigate major life changes together with understanding peers',
    icon: '🌱',
  },
  {
    topic: 'Workplace Stress',
    description: 'Discuss and manage work-related stress and burnout',
    icon: '💼',
  },
  {
    topic: 'Relationship Challenges',
    description: 'Support for navigating relationship difficulties',
    icon: '💔',
  },
  {
    topic: 'General Wellness',
    description: 'Focus on overall mental health and wellbeing',
    icon: '🌟',
  },
  {
    topic: 'Creative Expression',
    description: 'Use creativity as a tool for healing and expression',
    icon: '🎨',
  },
];

class SupportGroupsService {
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Register a new user with an anonymous username
   */
  registerUser(username: string): User {
    const user: User = {
      id: this.generateId(),
      username: username.trim(),
      createdAt: new Date(),
      groupMemberships: [],
    };

    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    return user;
  }

  /**
   * Get the current user from local storage
   */
  getCurrentUser(): User | null {
    const data = localStorage.getItem(USER_STORAGE_KEY);
    if (!data) return null;

    const user = JSON.parse(data);
    // Convert date strings back to Date objects
    user.createdAt = new Date(user.createdAt);
    return user;
  }

  /**
   * Clear the current user (logout)
   */
  clearCurrentUser(): void {
    localStorage.removeItem(USER_STORAGE_KEY);
  }

  /**
   * Initialize groups if they don't exist
   */
  private initializeGroups(): void {
    const existing = localStorage.getItem(GROUPS_STORAGE_KEY);
    if (!existing) {
      // Create one initial group for each topic
      const initialGroups = GROUP_TEMPLATES.map(template => this.createGroup(template.topic));
      this.saveGroups(initialGroups);
    }
  }

  /**
   * Get all support groups
   */
  getAllGroups(): SupportGroup[] {
    this.initializeGroups();
    const data = localStorage.getItem(GROUPS_STORAGE_KEY);
    if (!data) return [];

    const groups = JSON.parse(data);
    // Convert date strings back to Date objects
    return groups.map((group: any) => ({
      ...group,
      createdAt: new Date(group.createdAt),
      posts: group.posts.map((post: any) => ({
        ...post,
        createdAt: new Date(post.createdAt),
      })),
    }));
  }

  /**
   * Get groups by topic
   */
  getGroupsByTopic(topic: string): SupportGroup[] {
    return this.getAllGroups().filter(g => g.topic === topic);
  }

  /**
   * Create a new group for a topic
   */
  private createGroup(topic: string): SupportGroup {
    let template = GROUP_TEMPLATES.find(t => t.topic === topic);
    
    // If template doesn't exist, create a dynamic one
    if (!template) {
      template = {
        topic: topic,
        description: `Support group for ${topic}`,
        icon: '🫂',
      };
    }

    return {
      id: this.generateId(),
      topic: template.topic,
      description: template.description,
      icon: template.icon,
      members: [],
      maxCapacity: 7,
      createdAt: new Date(),
      posts: [],
    };
  }

  /**
   * Save groups to local storage
   */
  private saveGroups(groups: SupportGroup[]): void {
    localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(groups));
  }

  /**
   * Join a group (with auto-creation if full)
   */
  joinGroup(groupId: string, userId: string): SupportGroup {
    const groups = this.getAllGroups();
    const group = groups.find(g => g.id === groupId);

    if (!group) throw new Error('Group not found');

    // Check if user is already a member
    if (group.members.includes(userId)) {
      return group;
    }

    // If group is full, create a new one and join that instead
    if (group.members.length >= group.maxCapacity) {
      const newGroup = this.createGroup(group.topic);
      newGroup.members.push(userId);
      groups.push(newGroup);
      this.saveGroups(groups);
      this.updateUserMemberships(userId, newGroup.id);
      return newGroup;
    }

    // Add user to the group
    group.members.push(userId);
    this.saveGroups(groups);
    this.updateUserMemberships(userId, groupId);
    return group;
  }

  /**
   * Leave a group
   */
  leaveGroup(groupId: string, userId: string): void {
    const groups = this.getAllGroups();
    const group = groups.find(g => g.id === groupId);

    if (!group) throw new Error('Group not found');

    group.members = group.members.filter(id => id !== userId);
    this.saveGroups(groups);
    this.removeUserMembership(userId, groupId);
  }

  /**
   * Update user's group memberships
   */
  private updateUserMemberships(userId: string, groupId: string): void {
    const user = this.getCurrentUser();
    if (user && user.id === userId) {
      if (!user.groupMemberships.includes(groupId)) {
        user.groupMemberships.push(groupId);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      }
    }
  }

  /**
   * Remove a group from user's memberships
   */
  private removeUserMembership(userId: string, groupId: string): void {
    const user = this.getCurrentUser();
    if (user && user.id === userId) {
      user.groupMemberships = user.groupMemberships.filter(id => id !== groupId);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    }
  }

  /**
   * Post a message to a group
   */
  postToGroup(groupId: string, userId: string, username: string, content: string): GroupPost {
    const groups = this.getAllGroups();
    const group = groups.find(g => g.id === groupId);

    if (!group) throw new Error('Group not found');
    if (!group.members.includes(userId)) throw new Error('User is not a member of this group');

    const post: GroupPost = {
      id: this.generateId(),
      groupId,
      authorId: userId,
      authorUsername: username,
      content: content.trim(),
      createdAt: new Date(),
    };

    group.posts.push(post);
    this.saveGroups(groups);
    return post;
  }

  /**
   * Get a specific group by ID
   */
  getGroup(groupId: string): SupportGroup | null {
    return this.getAllGroups().find(g => g.id === groupId) || null;
  }

  /**
   * Get user's groups
   */
  getUserGroups(userId: string): SupportGroup[] {
    return this.getAllGroups().filter(g => g.members.includes(userId));
  }

  /**
   * Get available group templates
   */
  getGroupTemplates(): GroupTopicTemplate[] {
    return GROUP_TEMPLATES;
  }

  /**
   * Get available groups for a topic (not full)
   */
  getAvailableGroupsForTopic(topic: string): SupportGroup[] {
    return this.getGroupsByTopic(topic).filter(g => g.members.length < g.maxCapacity);
  }

  /**
   * Create or join a group for a specific topic
   * This is a high-level method that handles all the logic
   */
  createOrJoinGroupForTopic(topic: string, userId: string): SupportGroup {
    console.log('createOrJoinGroupForTopic called:', topic, userId);
    
    const allGroups = this.getGroupsByTopic(topic);
    console.log('Found groups for topic:', allGroups.length);
    
    const availableGroups = allGroups.filter(g => g.members.length < g.maxCapacity);
    console.log('Available groups (not full):', availableGroups.length);
    
    if (availableGroups.length > 0) {
      // Join first available group
      console.log('Joining available group:', availableGroups[0].id);
      return this.joinGroup(availableGroups[0].id, userId);
    } else if (allGroups.length > 0) {
      // All groups are full, create a new one
      console.log('All groups full, creating new one via joinGroup');
      return this.joinGroup(allGroups[0].id, userId); // This will auto-create
    } else {
      // No groups exist, create the first one
      console.log('No groups exist, creating first group for topic:', topic);
      const newGroup = this.createGroup(topic);
      newGroup.members.push(userId);
      const groups = this.getAllGroups();
      groups.push(newGroup);
      this.saveGroups(groups);
      this.updateUserMemberships(userId, newGroup.id);
      console.log('Created new group:', newGroup.id, newGroup.topic);
      return newGroup;
    }
  }
}

export const supportGroupsService = new SupportGroupsService();
