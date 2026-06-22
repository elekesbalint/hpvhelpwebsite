export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      coupons: {
        Row: {
          id: string;
          code: string;
          discount_type: "percent" | "fixed";
          discount_value: number;
          description: string | null;
          min_order_amount: number | null;
          max_uses: number | null;
          max_uses_per_user: number | null;
          used_count: number;
          valid_from: string | null;
          expires_at: string | null;
          applies_to_sale_items: boolean;
          restricted_product_ids: string[] | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          discount_type: "percent" | "fixed";
          discount_value: number;
          description?: string | null;
          min_order_amount?: number | null;
          max_uses?: number | null;
          max_uses_per_user?: number | null;
          used_count?: number;
          valid_from?: string | null;
          expires_at?: string | null;
          applies_to_sale_items?: boolean;
          restricted_product_ids?: string[] | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          code?: string;
          discount_type?: "percent" | "fixed";
          discount_value?: number;
          description?: string | null;
          min_order_amount?: number | null;
          max_uses?: number | null;
          max_uses_per_user?: number | null;
          used_count?: number;
          valid_from?: string | null;
          expires_at?: string | null;
          applies_to_sale_items?: boolean;
          restricted_product_ids?: string[] | null;
          is_active?: boolean;
        };
        Relationships: [];
      };
      coupon_usage: {
        Row: {
          id: string;
          coupon_id: string;
          user_id: string;
          order_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          coupon_id: string;
          user_id: string;
          order_id: string;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
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
          subtitle: string | null;
          parent_id: string | null;
          vat_rate: number | null;
          discount_type: "percent" | "fixed" | null;
          discount_value: number | null;
          sort_order: number | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          subtitle?: string | null;
          parent_id?: string | null;
          vat_rate?: number | null;
          discount_type?: "percent" | "fixed" | null;
          discount_value?: number | null;
          sort_order?: number | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          subtitle?: string | null;
          parent_id?: string | null;
          vat_rate?: number | null;
          discount_type?: "percent" | "fixed" | null;
          discount_value?: number | null;
          sort_order?: number | null;
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
          sku: string | null;
          description: string | null;
          price: number;
          compare_at_price: number | null;
          sale_starts_at: string | null;
          sale_ends_at: string | null;
          vat_rate: number | null;
          discount_type: "percent" | "fixed" | null;
          discount_value: number | null;
          stock: number;
          sort_order: number | null;
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
          sku?: string | null;
          description?: string | null;
          price: number;
          compare_at_price?: number | null;
          sale_starts_at?: string | null;
          sale_ends_at?: string | null;
          vat_rate?: number | null;
          discount_type?: "percent" | "fixed" | null;
          discount_value?: number | null;
          stock?: number;
          sort_order?: number | null;
          is_active?: boolean;
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          category_id?: string | null;
          name?: string;
          slug?: string;
          sku?: string | null;
          description?: string | null;
          price?: number;
          compare_at_price?: number | null;
          sale_starts_at?: string | null;
          sale_ends_at?: string | null;
          vat_rate?: number | null;
          discount_type?: "percent" | "fixed" | null;
          discount_value?: number | null;
          stock?: number;
          sort_order?: number | null;
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
          coupon_code: string | null;
          total: number;
          currency: string;
          payment_provider: string | null;
          payment_reference: string | null;
          shipping_name: string | null;
          shipping_phone: string | null;
          shipping_address: string | null;
          shipping_email: string | null;
          shipping_method: string | null;
          tracking_number: string | null;
          shipping_carrier: string | null;
          pickup_point_id: string | null;
          pickup_point_name: string | null;
          pickup_point_address: string | null;
          pickup_point_provider: string | null;
          pickup_point_meta: Json | null;
          billing_name: string | null;
          billing_tax_number: string | null;
          billing_address: string | null;
          billing_company_contact: string | null;
          notes: string | null;
          natursoft_exported_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          status?: "pending" | "paid" | "fulfilled" | "cancelled" | "refunded";
          subtotal: number;
          discount?: number;
          coupon_code?: string | null;
          total: number;
          currency?: string;
          payment_provider?: string | null;
          payment_reference?: string | null;
          shipping_name?: string | null;
          shipping_phone?: string | null;
          shipping_address?: string | null;
          shipping_email?: string | null;
          shipping_method?: string | null;
          tracking_number?: string | null;
          shipping_carrier?: string | null;
          pickup_point_id?: string | null;
          pickup_point_name?: string | null;
          pickup_point_address?: string | null;
          pickup_point_provider?: string | null;
          pickup_point_meta?: Json | null;
          billing_name?: string | null;
          billing_tax_number?: string | null;
          billing_address?: string | null;
          billing_company_contact?: string | null;
          notes?: string | null;
          natursoft_exported_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: "pending" | "paid" | "fulfilled" | "cancelled" | "refunded";
          subtotal?: number;
          discount?: number;
          coupon_code?: string | null;
          total?: number;
          currency?: string;
          payment_provider?: string | null;
          payment_reference?: string | null;
          shipping_name?: string | null;
          shipping_phone?: string | null;
          shipping_address?: string | null;
          shipping_email?: string | null;
          shipping_method?: string | null;
          tracking_number?: string | null;
          shipping_carrier?: string | null;
          pickup_point_id?: string | null;
          pickup_point_name?: string | null;
          pickup_point_address?: string | null;
          pickup_point_provider?: string | null;
          pickup_point_meta?: Json | null;
          billing_name?: string | null;
          billing_tax_number?: string | null;
          billing_address?: string | null;
          billing_company_contact?: string | null;
          notes?: string | null;
          natursoft_exported_at?: string | null;
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
      admin_login_attempts: {
        Row: {
          id: string;
          email: string;
          ip: string | null;
          user_agent: string | null;
          success: boolean;
          reason: string | null;
          alert_sent: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          ip?: string | null;
          user_agent?: string | null;
          success?: boolean;
          reason?: string | null;
          alert_sent?: boolean;
          created_at?: string;
        };
        Update: {
          email?: string;
          ip?: string | null;
          user_agent?: string | null;
          success?: boolean;
          reason?: string | null;
          alert_sent?: boolean;
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
      restore_product_stock_for_order: {
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
