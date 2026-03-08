export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      addiction_categories: {
        Row: {
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      addiction_guidance: {
        Row: {
          addiction_id: string
          created_at: string
          id: string
          prayer_text: string | null
          scripture: string | null
          steps: string | null
        }
        Insert: {
          addiction_id: string
          created_at?: string
          id?: string
          prayer_text?: string | null
          scripture?: string | null
          steps?: string | null
        }
        Update: {
          addiction_id?: string
          created_at?: string
          id?: string
          prayer_text?: string | null
          scripture?: string | null
          steps?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "addiction_guidance_addiction_id_fkey"
            columns: ["addiction_id"]
            isOneToOne: false
            referencedRelation: "addiction_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          admin_id: string
          content: string
          created_at: string
          id: string
          title: string
        }
        Insert: {
          admin_id: string
          content: string
          created_at?: string
          id?: string
          title: string
        }
        Update: {
          admin_id?: string
          content?: string
          created_at?: string
          id?: string
          title?: string
        }
        Relationships: []
      }
      bible_books: {
        Row: {
          book_order: number
          chapter_count: number
          id: string
          name: string
          testament: string
        }
        Insert: {
          book_order: number
          chapter_count: number
          id?: string
          name: string
          testament: string
        }
        Update: {
          book_order?: number
          chapter_count?: number
          id?: string
          name?: string
          testament?: string
        }
        Relationships: []
      }
      bible_chapters: {
        Row: {
          book_id: string
          chapter_number: number
          id: string
        }
        Insert: {
          book_id: string
          chapter_number: number
          id?: string
        }
        Update: {
          book_id?: string
          chapter_number?: number
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bible_chapters_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "bible_books"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_study_progress: {
        Row: {
          chapter_id: string
          id: string
          notes: string | null
          read_at: string
          reflection: string | null
          user_id: string
        }
        Insert: {
          chapter_id: string
          id?: string
          notes?: string | null
          read_at?: string
          reflection?: string | null
          user_id: string
        }
        Update: {
          chapter_id?: string
          id?: string
          notes?: string | null
          read_at?: string
          reflection?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bible_study_progress_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "bible_chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_deleted: boolean
          is_pinned: boolean
          room_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_deleted?: boolean
          is_pinned?: boolean
          room_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_deleted?: boolean
          is_pinned?: boolean
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          created_at: string
          group_id: string | null
          id: string
          name: string
          type: Database["public"]["Enums"]["chat_room_type"]
        }
        Insert: {
          created_at?: string
          group_id?: string | null
          id?: string
          name: string
          type?: Database["public"]["Enums"]["chat_room_type"]
        }
        Update: {
          created_at?: string
          group_id?: string | null
          id?: string
          name?: string
          type?: Database["public"]["Enums"]["chat_room_type"]
        }
        Relationships: [
          {
            foreignKeyName: "chat_rooms_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      fruits_exercises: {
        Row: {
          description: string | null
          exercise_text: string | null
          fruit_name: string
          id: string
          scripture_ref: string | null
        }
        Insert: {
          description?: string | null
          exercise_text?: string | null
          fruit_name: string
          id?: string
          scripture_ref?: string | null
        }
        Update: {
          description?: string | null
          exercise_text?: string | null
          fruit_name?: string
          id?: string
          scripture_ref?: string | null
        }
        Relationships: []
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      guidance_topics: {
        Row: {
          bible_verse: string | null
          content: string | null
          created_at: string
          id: string
          title: string
        }
        Insert: {
          bible_verse?: string | null
          content?: string | null
          created_at?: string
          id?: string
          title: string
        }
        Update: {
          bible_verse?: string | null
          content?: string | null
          created_at?: string
          id?: string
          title?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      plan_days: {
        Row: {
          chapter_id: string | null
          day_number: number
          id: string
          plan_id: string
        }
        Insert: {
          chapter_id?: string | null
          day_number: number
          id?: string
          plan_id: string
        }
        Update: {
          chapter_id?: string | null
          day_number?: number
          id?: string
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_days_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "bible_chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_days_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "study_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_progress: {
        Row: {
          completed_at: string
          day_id: string
          id: string
          plan_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          day_id: string
          id?: string
          plan_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          day_id?: string
          id?: string
          plan_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_progress_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "plan_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_progress_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "study_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      prayer_requests: {
        Row: {
          content: string
          created_at: string
          id: string
          is_approved: boolean
          is_pinned: boolean
          prayer_count: number
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_approved?: boolean
          is_pinned?: boolean
          prayer_count?: number
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_approved?: boolean
          is_pinned?: boolean
          prayer_count?: number
          user_id?: string
        }
        Relationships: []
      }
      prayer_responses: {
        Row: {
          created_at: string
          id: string
          message: string
          prayer_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          prayer_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          prayer_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prayer_responses_prayer_id_fkey"
            columns: ["prayer_id"]
            isOneToOne: false
            referencedRelation: "prayer_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          instagram_username: string | null
          last_login: string | null
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          instagram_username?: string | null
          last_login?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          instagram_username?: string | null
          last_login?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Relationships: []
      }
      study_groups: {
        Row: {
          chat_mode: Database["public"]["Enums"]["group_chat_mode"]
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          visibility: Database["public"]["Enums"]["group_visibility"]
        }
        Insert: {
          chat_mode?: Database["public"]["Enums"]["group_chat_mode"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          visibility?: Database["public"]["Enums"]["group_visibility"]
        }
        Update: {
          chat_mode?: Database["public"]["Enums"]["group_chat_mode"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          visibility?: Database["public"]["Enums"]["group_visibility"]
        }
        Relationships: []
      }
      study_plans: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          duration_days: number
          id: string
          title: string
          type: Database["public"]["Enums"]["study_plan_type"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_days: number
          id?: string
          title: string
          type?: Database["public"]["Enums"]["study_plan_type"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_days?: number
          id?: string
          title?: string
          type?: Database["public"]["Enums"]["study_plan_type"]
        }
        Relationships: []
      }
      support_contacts: {
        Row: {
          created_at: string
          id: string
          label: string
          type: Database["public"]["Enums"]["support_contact_type"]
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          type: Database["public"]["Enums"]["support_contact_type"]
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          type?: Database["public"]["Enums"]["support_contact_type"]
          url?: string
        }
        Relationships: []
      }
      testimonies: {
        Row: {
          content: string
          created_at: string
          id: string
          reviewed_by: string | null
          status: Database["public"]["Enums"]["testimony_status"]
          title: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["testimony_status"]
          title: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["testimony_status"]
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      user_addictions: {
        Row: {
          added_at: string
          addiction_id: string
          id: string
          user_id: string
        }
        Insert: {
          added_at?: string
          addiction_id: string
          id?: string
          user_id: string
        }
        Update: {
          added_at?: string
          addiction_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_addictions_addiction_id_fkey"
            columns: ["addiction_id"]
            isOneToOne: false
            referencedRelation: "addiction_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_fruit_progress: {
        Row: {
          fruit_id: string
          id: string
          logged_at: string
          reflection: string | null
          user_id: string
        }
        Insert: {
          fruit_id: string
          id?: string
          logged_at?: string
          reflection?: string | null
          user_id: string
        }
        Update: {
          fruit_id?: string
          id?: string
          logged_at?: string
          reflection?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_fruit_progress_fruit_id_fkey"
            columns: ["fruit_id"]
            isOneToOne: false
            referencedRelation: "fruits_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "user" | "admin"
      chat_room_type: "general" | "group" | "prayer"
      group_chat_mode: "open" | "broadcast"
      group_visibility: "public" | "private_visible" | "private_hidden"
      study_plan_type: "personal" | "global"
      support_contact_type: "whatsapp" | "instagram"
      testimony_status: "pending" | "approved" | "rejected"
      user_status: "pending_approval" | "approved" | "banned"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["user", "admin"],
      chat_room_type: ["general", "group", "prayer"],
      group_chat_mode: ["open", "broadcast"],
      group_visibility: ["public", "private_visible", "private_hidden"],
      study_plan_type: ["personal", "global"],
      support_contact_type: ["whatsapp", "instagram"],
      testimony_status: ["pending", "approved", "rejected"],
      user_status: ["pending_approval", "approved", "banned"],
    },
  },
} as const
