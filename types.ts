// --- ENUMS & TYPE ALIASES ---

export enum Tab {
  Feed = 'feed',
  Workout = 'workout',
  AI = 'ai',
  Messages = 'messages',
  Profile = 'profile',
  Videos = 'videos',
  Notifications = 'notifications',
  Friends = 'friends',
  Marketplace = 'marketplace',
}

export type CreateView = 
  | 'menu' 
  | 'post' 
  | 'photo' 
  | 'reel' 
  | 'workout' 
  | 'nutrition' 
  | 'live' 
  | 'story' 
  | 'feeling' 
  | 'tag' 
  | 'checkin' 
  | 'gif' 
  | 'lifeEvent' 
  | 'music';

export type PrivacySetting = 'public' | 'friends' | 'only me';
export type LifeEventType = 'work' | 'education' | 'relationship' | 'home';
export type NotificationType = 'like' | 'comment' | 'friend_request' | 'share';

// --- DATA INTERFACES ---

export interface User {
  id: string;
  name: string;
  username: string;
  profilePictureUrl: string;
  coverPhotoUrl?: string;
  bio: string;
  followers: number;
  following: number;
  age: number;
  gender: 'male' | 'female' | 'other';
}

export interface Media {
  id: string;
  type: 'image' | 'video';
  url: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  albumArtUrl: string;
}

export interface Comment {
  id: string;
  author: User;
  content: string;
  timestamp: string; // ISO string
  taggedUsers: User[];
}

export interface SocialPost {
  id:string;
  author: User;
  timestamp: string; // ISO string
  content: string;
  media: Media[];
  likes: string[]; // array of user IDs
  comments: Comment[];
  privacy: PrivacySetting;
  feeling?: string;
  location?: string;
  attachedMusic?: Song;
  backgroundColor?: string;
  sharedPost?: SocialPost;
  taggedUsers?: User[];
}

export interface Story {
  id: string;
  user: User;
  imageUrl: string;
}

export interface Schedule {
  day: string;
  session: string;
  startTime: string;
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string; // e.g., "10 reps" or "30 seconds"
  estimatedTime: number; // in seconds
  restTime: number; // in seconds
  notes: string;
  media: Media[];
  equipment?: string;
}

export interface WorkoutPlan {
  id: string;
  name: string;
  schedule: Schedule;
  notes: string;
  media: Media[];
  exercises: Exercise[];
  category: 'Strength' | 'Cardio' | 'Flexibility' | 'Mixed';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: number; // in minutes
  caloriesBurned: number;
  coach: User;
}

export interface NutritionSchedule {
    day: string;
    session: string;
    startTime: string;
}

export interface Meal {
    id: string;
    name: string;
    notes: string;
    media: Media[];
}

export interface NutritionPlan {
  id: string;
  name: string;
  schedule: NutritionSchedule;
  notes: string;
  media: Media[];
  meals: Meal[];
}

export interface CompletedSet {
    reps: number;
    weight: number;
}

export interface CompletedExercise {
    exerciseId: string;
    name: string;
    notes: string;
    sets: CompletedSet[];
}

export interface WorkoutSession {
    id: string;
    planId: string;
    planName: string;
    date: string; // ISO string
    duration: number; // in minutes
    planNotes: string;
    completedExercises: CompletedExercise[];
    progressMedia: Media[];
    caloriesBurned: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  recipientId: string;
  text: string;
  timestamp: string; // ISO string
  mediaUrl?: string;
  mediaType?: 'image' | 'audio';
}

export interface Notification {
  id: string;
  type: NotificationType;
  user: User;
  post?: SocialPost;
  timestamp: string; // ISO string
  isRead: boolean;
}

export interface MarketplaceListing {
  id: string;
  title: string;
  price: number;
  description: string;
  imageUrl: string;
  seller: User;
}

// --- AI GENERATED TYPES ---

export interface GeneratedExercise {
    name: string;
    reps: string;
    sets: number;
    instructions: string;
    imageUrl: string;
    equipment?: string;
    restAfter?: number; // in seconds
}

export interface GeneratedWorkoutPlan {
    estimatedTime: number;
    estimatedCalories: number;
    totalExercises: number;
    warmUp?: GeneratedExercise[];
    training: GeneratedExercise[];
    stretching?: GeneratedExercise[];
}