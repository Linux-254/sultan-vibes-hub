export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      chat_messages: {
        Row: {
          body: string;
          created_at: string;
          id: string;
          user_id: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          id?: string;
          user_id: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          amount: number;
          checkout_request_id: string | null;
          created_at: string;
          currency: string;
          id: string;
          merchant_request_id: string | null;
          mpesa_receipt: string | null;
          phone: string | null;
          raw_callback: Json | null;
          reservation_id: string | null;
          status: Database["public"]["Enums"]["payment_status"];
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          amount: number;
          checkout_request_id?: string | null;
          created_at?: string;
          currency?: string;
          id?: string;
          merchant_request_id?: string | null;
          mpesa_receipt?: string | null;
          phone?: string | null;
          raw_callback?: Json | null;
          reservation_id?: string | null;
          status?: Database["public"]["Enums"]["payment_status"];
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          amount?: number;
          checkout_request_id?: string | null;
          created_at?: string;
          currency?: string;
          id?: string;
          merchant_request_id?: string | null;
          mpesa_receipt?: string | null;
          phone?: string | null;
          raw_callback?: Json | null;
          reservation_id?: string | null;
          status?: Database["public"]["Enums"]["payment_status"];
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "payments_reservation_id_fkey";
            columns: ["reservation_id"];
            isOneToOne: false;
            referencedRelation: "reservations";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          display_name: string | null;
          id: string;
          phone: string | null;
          social_links: Json | null;
          updated_at: string;
          user_type: string;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          display_name?: string | null;
          id: string;
          phone?: string | null;
          social_links?: Json | null;
          updated_at?: string;
          user_type?: string;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          phone?: string | null;
          social_links?: Json | null;
          updated_at?: string;
          user_type?: string;
        };
        Relationships: [];
      };
      reservations: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          created_at: string;
          deposit_amount: number;
          drinks: Record<string, unknown>[] | null;
          full_name: string;
          id: string;
          party_size: number;
          phone: string;
          reservation_date: string;
          reservation_time: string;
          special_requests: string | null;
          status: Database["public"]["Enums"]["reservation_status"];
          table_preference: string | null;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string;
          deposit_amount?: number;
          drinks?: Record<string, unknown>[] | null;
          full_name: string;
          id?: string;
          party_size: number;
          phone: string;
          reservation_date: string;
          reservation_time: string;
          special_requests?: string | null;
          status?: Database["public"]["Enums"]["reservation_status"];
          table_preference?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string;
          deposit_amount?: number;
          drinks?: Record<string, unknown>[] | null;
          full_name?: string;
          id?: string;
          party_size?: number;
          phone?: string;
          reservation_date?: string;
          reservation_time?: string;
          special_requests?: string | null;
          status?: Database["public"]["Enums"]["reservation_status"];
          table_preference?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      special_events: {
        Row: {
          created_at: string;
          created_by: string | null;
          description: string | null;
          djs: Record<string, unknown>[] | null;
          event_date: string;
          event_time: string | null;
          countdown_enabled: boolean;
          id: string;
          name: string;
          status: Database["public"]["Enums"]["event_status"];
          ticket_price: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          djs?: Record<string, unknown>[] | null;
          event_date: string;
          event_time?: string | null;
          countdown_enabled?: boolean;
          id?: string;
          name: string;
          status?: Database["public"]["Enums"]["event_status"];
          ticket_price?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          djs?: Record<string, unknown>[] | null;
          event_date?: string;
          event_time?: string | null;
          countdown_enabled?: boolean;
          id?: string;
          name?: string;
          status?: Database["public"]["Enums"]["event_status"];
          ticket_price?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      sos_incidents: {
        Row: {
          acknowledged_at: string | null;
          acknowledged_by: string | null;
          created_at: string;
          id: string;
          level: Database["public"]["Enums"]["sos_level"];
          location_lat: number | null;
          location_lng: number | null;
          note: string | null;
          resolution_note: string | null;
          resolved_at: string | null;
          resolved_by: string | null;
          share_location: boolean;
          status: Database["public"]["Enums"]["sos_status"];
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          acknowledged_at?: string | null;
          acknowledged_by?: string | null;
          created_at?: string;
          id?: string;
          level: Database["public"]["Enums"]["sos_level"];
          location_lat?: number | null;
          location_lng?: number | null;
          note?: string | null;
          resolution_note?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          share_location?: boolean;
          status?: Database["public"]["Enums"]["sos_status"];
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          acknowledged_at?: string | null;
          acknowledged_by?: string | null;
          created_at?: string;
          id?: string;
          level?: Database["public"]["Enums"]["sos_level"];
          location_lat?: number | null;
          location_lng?: number | null;
          note?: string | null;
          resolution_note?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          share_location?: boolean;
          status?: Database["public"]["Enums"]["sos_status"];
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      product_categories: {
        Row: {
          id: string;
          name: string;
          subtitle: string | null;
          icon: string | null;
          sort_order: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          subtitle?: string | null;
          icon?: string | null;
          sort_order?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          subtitle?: string | null;
          icon?: string | null;
          sort_order?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          name: string;
          brand: string;
          price: number;
          tag: string;
          description: string | null;
          image_url: string | null;
          active: boolean;
          sort_order: number;
          category_id: string | null;
          subcategory: string | null;
          stock: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          brand?: string;
          price?: number;
          tag?: string;
          description?: string | null;
          image_url?: string | null;
          active?: boolean;
          sort_order?: number;
          category_id?: string | null;
          subcategory?: string | null;
          stock?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          brand?: string;
          price?: number;
          tag?: string;
          description?: string | null;
          image_url?: string | null;
          active?: boolean;
          sort_order?: number;
          category_id?: string | null;
          subcategory?: string | null;
          stock?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      talent_roster: {
        Row: {
          id: string;
          username: string;
          stage_name: string;
          talent_type: string;
          status: string;
          bio: string | null;
          avatar_url: string | null;
          featured: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          username: string;
          stage_name: string;
          talent_type?: string;
          status?: string;
          bio?: string | null;
          avatar_url?: string | null;
          featured?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          stage_name?: string;
          talent_type?: string;
          status?: string;
          bio?: string | null;
          avatar_url?: string | null;
          featured?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      collabs: {
        Row: {
          id: string;
          slug: string;
          name: string;
          tagline: string | null;
          description: string | null;
          partner_type: string;
          logo_url: string | null;
          featured: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          tagline?: string | null;
          description?: string | null;
          partner_type?: string;
          logo_url?: string | null;
          featured?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          tagline?: string | null;
          description?: string | null;
          partner_type?: string;
          logo_url?: string | null;
          featured?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      site_events: {
        Row: {
          id: string;
          slug: string;
          title: string;
          event_date: string;
          image_url: string | null;
          tags: string[];
          djs: Record<string, unknown>[] | null;
          going_count: number;
          featured: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          event_date: string;
          image_url?: string | null;
          tags?: string[];
          djs?: Record<string, unknown>[] | null;
          going_count?: number;
          featured?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          event_date?: string;
          image_url?: string | null;
          tags?: string[];
          djs?: Record<string, unknown>[] | null;
          going_count?: number;
          featured?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      milestones: {
        Row: {
          id: string;
          date_label: string;
          title: string;
          body: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          date_label: string;
          title: string;
          body?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          date_label?: string;
          title?: string;
          body?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      recap_events: {
        Row: {
          id: string;
          name: string;
          event_date: string;
          cover_url: string | null;
          photo_count: number;
          video_count: number;
          bundle_price: number;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          event_date: string;
          cover_url?: string | null;
          photo_count?: number;
          video_count?: number;
          bundle_price?: number;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          event_date?: string;
          cover_url?: string | null;
          photo_count?: number;
          video_count?: number;
          bundle_price?: number;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      faqs: {
        Row: {
          id: string;
          question: string;
          answer: string;
          sort_order: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          question: string;
          answer: string;
          sort_order?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          question?: string;
          answer?: string;
          sort_order?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      trusted_partners: {
        Row: {
          id: string;
          name: string;
          logo_url: string | null;
          website_url: string | null;
          sort_order: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          logo_url?: string | null;
          website_url?: string | null;
          sort_order?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          logo_url?: string | null;
          website_url?: string | null;
          sort_order?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      recap_media: {
        Row: {
          id: string;
          recap_event_id: string;
          media_type: string;
          url: string;
          thumbnail_url: string | null;
          free_preview: boolean;
          unlock_price: number;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          recap_event_id: string;
          media_type?: string;
          url: string;
          thumbnail_url?: string | null;
          free_preview?: boolean;
          unlock_price?: number;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          recap_event_id?: string;
          media_type?: string;
          url?: string;
          thumbnail_url?: string | null;
          free_preview?: boolean;
          unlock_price?: number;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      parking_spots: {
        Row: {
          id: string;
          spot_number: string;
          spot_type: string;
          status: string;
          price: number;
          booked_by: string | null;
          booking_date: string | null;
          event_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          spot_number: string;
          spot_type?: string;
          status?: string;
          price?: number;
          booked_by?: string | null;
          booking_date?: string | null;
          event_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          spot_number?: string;
          spot_type?: string;
          status?: string;
          price?: number;
          booked_by?: string | null;
          booking_date?: string | null;
          event_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          user_id: string | null;
          order_type: string;
          status: string;
          total: number;
          ticket_number: string | null;
          delivery_name: string | null;
          delivery_phone: string | null;
          delivery_address: string | null;
          delivery_notes: string | null;
          delivery_time_preference: string | null;
          payment_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          order_type?: string;
          status?: string;
          total?: number;
          ticket_number?: string | null;
          delivery_name?: string | null;
          delivery_phone?: string | null;
          delivery_address?: string | null;
          delivery_notes?: string | null;
          delivery_time_preference?: string | null;
          payment_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          order_type?: string;
          status?: string;
          total?: number;
          ticket_number?: string | null;
          delivery_name?: string | null;
          delivery_phone?: string | null;
          delivery_address?: string | null;
          delivery_notes?: string | null;
          delivery_time_preference?: string | null;
          payment_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          name: string;
          quantity: number;
          unit_price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          name: string;
          quantity?: number;
          unit_price?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string | null;
          name?: string;
          quantity?: number;
          unit_price?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      site_images: {
        Row: {
          id: string;
          slot: string;
          url: string;
          alt: string | null;
          sort_order: number;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          slot: string;
          url: string;
          alt?: string | null;
          sort_order?: number;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          slot?: string;
          url?: string;
          alt?: string | null;
          sort_order?: number;
          active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      leads: {
        Row: {
          id: string;
          lead_type: string;
          name: string;
          email: string | null;
          phone: string | null;
          message: string | null;
          status: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          lead_type: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          message?: string | null;
          status?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          lead_type?: string;
          name?: string;
          email?: string | null;
          phone?: string | null;
          message?: string | null;
          status?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sos_responders: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          phone: string | null;
          role: string;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          phone?: string | null;
          role?: string;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          phone?: string | null;
          role?: string;
          active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      sos_notifications: {
        Row: {
          id: string;
          incident_id: string;
          responder_id: string;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          incident_id: string;
          responder_id: string;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          incident_id?: string;
          responder_id?: string;
          read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      is_staff: { Args: { _user_id: string }; Returns: boolean };
    };
    Enums: {
      app_role: "admin" | "crew" | "user";
      event_status: "draft" | "published" | "cancelled";
      payment_status: "pending" | "success" | "failed" | "refunded";
      reservation_status: "pending" | "approved" | "seated" | "cancelled" | "no_show";
      sos_level: "YELLOW" | "ORANGE" | "RED";
      sos_status: "open" | "acknowledged" | "resolved" | "false_alarm";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "crew", "user"],
      event_status: ["draft", "published", "cancelled"],
      payment_status: ["pending", "success", "failed", "refunded"],
      reservation_status: ["pending", "approved", "seated", "cancelled", "no_show"],
      sos_level: ["YELLOW", "ORANGE", "RED"],
      sos_status: ["open", "acknowledged", "resolved", "false_alarm"],
    },
  },
} as const;
