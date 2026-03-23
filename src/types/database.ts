export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      waitlist: {
        Row: {
          id: string;
          email: string;
          referral_source: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          referral_source?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          referral_source?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          display_name: string;
          bio: string | null;
          avatar_url: string | null;
          location_name: string | null;
          location_point: unknown | null;
          interests: string[];
          is_onboarded: boolean;
          allow_dms: "everyone" | "mutual_only" | "nobody";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          bio?: string | null;
          avatar_url?: string | null;
          location_name?: string | null;
          location_point?: unknown | null;
          interests?: string[];
          is_onboarded?: boolean;
          allow_dms?: "everyone" | "mutual_only" | "nobody";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          bio?: string | null;
          avatar_url?: string | null;
          location_name?: string | null;
          location_point?: unknown | null;
          interests?: string[];
          is_onboarded?: boolean;
          allow_dms?: "everyone" | "mutual_only" | "nobody";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      follows: {
        Row: {
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: {
          follower_id?: string;
          following_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      posts: {
        Row: {
          id: string;
          user_id: string;
          image_url: string;
          caption: string | null;
          sighting_location_name: string | null;
          sighting_location_point: unknown | null;
          species_tags: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          image_url: string;
          caption?: string | null;
          sighting_location_name?: string | null;
          sighting_location_point?: unknown | null;
          species_tags?: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          image_url?: string;
          caption?: string | null;
          sighting_location_name?: string | null;
          sighting_location_point?: unknown | null;
          species_tags?: string[];
          created_at?: string;
        };
        Relationships: [];
      };
      likes: {
        Row: {
          user_id: string;
          post_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          post_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          post_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          participant_1: string;
          participant_2: string;
          last_message_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          participant_1: string;
          participant_2: string;
          last_message_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          participant_1?: string;
          participant_2?: string;
          last_message_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string | null;
          content: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id?: string | null;
          content: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string | null;
          content?: string;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: "new_follower" | "post_liked" | "new_message";
          actor_id: string | null;
          post_id: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: "new_follower" | "post_liked" | "new_message";
          actor_id?: string | null;
          post_id?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: "new_follower" | "post_liked" | "new_message";
          actor_id?: string | null;
          post_id?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
