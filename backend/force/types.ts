export interface User {
  id: number;
  email: string;
  name: string;
  roleDescription?: string;
  targetProfile?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface SkillAssessment {
  id: number;
  userId: number;
  skillId: string;
  area: string;
  name: string;
  targetLevel: number;
  currentLevel: number;
  examples?: string;
  recommendedResources?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GrowthItem {
  id: number;
  userId: number;
  type: 'course' | 'book' | 'habit' | 'mission';
  title: string;
  description: string;
  link?: string;
  status: 'pending' | 'in_progress' | 'done';
  createdAt: Date;
  updatedAt: Date;
}

export interface ReflectionEntry {
  id: number;
  userId: number;
  content: string;
  type: 'general' | 'weekly_review' | 'mental_model';
  createdAt: Date;
}

export interface MentalModel {
  name: string;
  explanation: string;
  newPerspective: string;
  keyInsight: string;
  practicalAction: string;
}

export interface MentalModelSession {
  id: number;
  userId: number;
  prompt: string;
  models: MentalModel[];
  createdAt: Date;
}

export interface RoleProfile {
  archetype: string;
  skillAreas: SkillArea[];
}

export interface SkillArea {
  area: string;
  skills: Skill[];
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  targetLevel: number;
}
