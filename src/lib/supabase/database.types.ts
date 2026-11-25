/**
 * Database types for Supabase, matching supabase/migrations.
 *
 * Written in the same shape as `supabase gen types typescript`, so you can
 * replace this file with the generated one after changing the schema:
 *   npx supabase gen types typescript --project-id <project-ref> > src/lib/supabase/database.types.ts
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13";
  };
  public: {
    Tables: {
      admins: {
        Row: { user_id: string; created_at: string };
        Insert: { user_id: string; created_at?: string };
        Update: { user_id?: string; created_at?: string };
        Relationships: [];
      };
      categories: {
        Row: {
          id: number;
          slug: string;
          name_ar: string;
          name_en: string;
          parent_id: number | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: never;
          slug: string;
          name_ar: string;
          name_en: string;
          parent_id?: number | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      colors: {
        Row: {
          id: number;
          slug: string;
          name_ar: string;
          name_en: string;
          hex: string;
          sort_order: number;
        };
        Insert: {
          id?: never;
          slug: string;
          name_ar: string;
          name_en: string;
          hex: string;
          sort_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["colors"]["Insert"]>;
        Relationships: [];
      };
      sizes: {
        Row: {
          id: number;
          code: string;
          name_ar: string;
          name_en: string;
          sort_order: number;
        };
        Insert: {
          id?: never;
          code: string;
          name_ar: string;
          name_en: string;
          sort_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["sizes"]["Insert"]>;
        Relationships: [];
      };
      products: {
        Row: {
          id: number;
          slug: string;
          category_id: number | null;
          name_ar: string;
          name_en: string;
          description_ar: string | null;
          description_en: string | null;
          is_active: boolean;
          is_featured: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: never;
          slug: string;
          category_id?: number | null;
          name_ar: string;
          name_en: string;
          description_ar?: string | null;
          description_en?: string | null;
          is_active?: boolean;
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      product_images: {
        Row: {
          id: number;
          product_id: number;
          color_id: number | null;
          url: string;
          alt_ar: string | null;
          alt_en: string | null;
          sort_order: number;
        };
        Insert: {
          id?: never;
          product_id: number;
          color_id?: number | null;
          url: string;
          alt_ar?: string | null;
          alt_en?: string | null;
          sort_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["product_images"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_images_color_id_fkey";
            columns: ["color_id"];
            isOneToOne: false;
            referencedRelation: "colors";
            referencedColumns: ["id"];
          },
        ];
      };
      product_variants: {
        Row: {
          id: number;
          product_id: number;
          color_id: number;
          size_id: number;
          sku: string;
          price: number;
          compare_at_price: number | null;
          stock: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: never;
          product_id: number;
          color_id: number;
          size_id: number;
          sku: string;
          price: number;
          compare_at_price?: number | null;
          stock?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_variants"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_variants_color_id_fkey";
            columns: ["color_id"];
            isOneToOne: false;
            referencedRelation: "colors";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_variants_size_id_fkey";
            columns: ["size_id"];
            isOneToOne: false;
            referencedRelation: "sizes";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      product_listing: {
        // Postgres can't prove view columns are non-null, so generated types mark them nullable.
        Row: {
          id: number | null;
          slug: string | null;
          name_ar: string | null;
          name_en: string | null;
          category_id: number | null;
          category_slug: string | null;
          is_featured: boolean | null;
          created_at: string | null;
          min_price: number | null;
          max_price: number | null;
          compare_at_price: number | null;
          total_stock: number | null;
          in_stock: boolean | null;
          cover_url: string | null;
          cover_alt_ar: string | null;
          cover_alt_en: string | null;
          color_slugs: string[] | null;
          size_codes: string[] | null;
          colors: Json | null;
          // Added by 20261125010000_listing_variants.sql
          variants: Json | null;
          images: Json | null;
          sizes: Json | null;
          default_color_slug: string | null;
          default_variant_id: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      is_admin: {
        Args: never;
        Returns: boolean;
      };
      admin_save_product: {
        Args: { product: Json; variants?: Json; images?: Json };
        Returns: number;
      };
      search_products: {
        Args: {
          category_slug?: string;
          colors?: string[];
          sizes?: string[];
          min_price?: number;
          max_price?: number;
          in_stock?: boolean;
          search?: string;
          featured?: boolean;
        };
        Returns: Database["public"]["Views"]["product_listing"]["Row"][];
        SetofOptions: {
          from: "*";
          to: "product_listing";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

type PublicSchema = Database["public"];
export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];
export type Views<T extends keyof PublicSchema["Views"]> = PublicSchema["Views"][T]["Row"];
