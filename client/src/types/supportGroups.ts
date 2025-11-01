/**
 * @fileoverview Type definitions for the anonymous support groups system
 */

export interface User {
  id: string;
  username: string;
  createdAt: Date;
  groupMemberships: string[]; // Array of group IDs
}

export interface GroupPost {
  id: string;
  groupId: string;
  authorId: string;
  authorUsername: string;
  content: string;
  createdAt: Date;
}

export interface SupportGroup {
  id: string;
  topic: string;
  description: string;
  icon: string;
  members: string[]; // Array of user IDs
  maxCapacity: number;
  createdAt: Date;
  posts: GroupPost[];
}

export type GroupTopic = 
  | 'Anxiety Support'
  | 'Grief & Loss'
  | 'Life Transitions'
  | 'Workplace Stress'
  | 'Relationship Challenges'
  | 'General Wellness'
  | 'Creative Expression';

export interface GroupTopicTemplate {
  topic: GroupTopic;
  description: string;
  icon: string;
}
