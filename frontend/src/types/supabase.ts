export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          role: "customer" | "admin";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          role?: "customer" | "admin";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string | null;
          full_name?: string | null;
          role?: "customer" | "admin";
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          category_id: string | null;
          name: string;
          slug: string;
          description: string | null;
          price: number;
          compare_at_price: number | null;
          stock: number;
          is_active: boolean;
          image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id?: string | null;
          name: string;
          slug: string;
          description?: string | null;
          price: number;
          compare_at_price?: number | null;
          stock?: number;
          is_active?: boolean;
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          category_id?: string | null;
          name?: string;
          slug?: string;
          description?: string | null;
          price?: number;
          compare_at_price?: number | null;
          stock?: number;
          is_active?: boolean;
          image_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          status: "pending" | "paid" | "fulfilled" | "cancelled" | "refunded";
          subtotal: number;
          discount: number;
          total: number;
          currency: string;
          payment_provider: string | null;
          payment_reference: string | null;
          shipping_name: string | null;
          shipping_phone: string | null;
          shipping_address: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          status?: "pending" | "paid" | "fulfilled" | "cancelled" | "refunded";
          subtotal: number;
          discount?: number;
          total: number;
          currency?: string;
          payment_provider?: string | null;
          payment_reference?: string | null;
          shipping_name?: string | null;
          shipping_phone?: string | null;
          shipping_address?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: "pending" | "paid" | "fulfilled" | "cancelled" | "refunded";
          subtotal?: number;
          discount?: number;
          total?: number;
          currency?: string;
          payment_provider?: string | null;
          payment_reference?: string | null;
          shipping_name?: string | null;
          shipping_phone?: string | null;
          shipping_address?: string | null;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          product_name: string;
          unit_price: number;
          quantity: number;
          line_total: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          product_name: string;
          unit_price: number;
          quantity: number;
          line_total: number;
          created_at?: string;
        };
        Update: {
          product_id?: string | null;
          product_name?: string;
          unit_price?: number;
          quantity?: number;
          line_total?: number;
        };
        Relationships: [];
      };
      app_settings: {
        Row: { key: string; value: Json; updated_at: string };
        Insert: { key: string; value: Json; updated_at?: string };
        Update: { value?: Json; updated_at?: string };
        Relationships: [];
      };
      admin_actions: {
        Row: {
          id: string;
          admin_user_id: string;
          action_type: string;
          entity_type: string;
          entity_id: string;
          meta: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_user_id: string;
          action_type: string;
          entity_type: string;
          entity_id: string;
          meta?: Json | null;
          created_at?: string;
        };
        Update: {
          action_type?: string;
          entity_type?: string;
          entity_id?: string;
          meta?: Json | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      decrement_product_stock_for_order: {
        Args: { p_order_id: string };
        Returns: void;
      };
    };
    Enums: {
      order_status: "pending" | "paid" | "fulfilled" | "cancelled" | "refunded";
    };
    CompositeTypes: Record<string, never>;
  };
};
