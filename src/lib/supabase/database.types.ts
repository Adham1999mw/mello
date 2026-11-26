/**
 * Database types for Supabase, matching supabase/migrations.
 *
 * Written in the same shape as `supabase gen types typescript`, so you can
 * replace this file with the generated one after changing the schema:
 *   npx supabase gen types typescript --project-id <project-ref> > src/lib/supabase/database.types.ts
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

/** reviews.status: only "approved" reviews are public (20261129000000_reviews.sql). */
export type ReviewStatus = "pending" | "approved" | "rejected";
/** list_reviews(sort): newest first by default. */
export type ReviewSort = "newest" | "highest" | "lowest";

/** Care symbols allowed by products_care_icons_check (20261128000000_product_specs.sql). */
export type CareIcon =
  | "wash_30"
  | "wash_40"
  | "hand_wash"
  | "no_wash"
  | "no_bleach"
  | "no_tumble_dry"
  | "tumble_dry_low"
  | "dry_flat"
  | "line_dry"
  | "iron_low"
  | "iron_medium"
  | "no_iron"
  | "dry_clean"
  | "no_dry_clean";

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
          // Added by 20261126000000_lookbook_feature_image.sql
          feature_image_url: string | null;
          feature_image_alt_ar: string | null;
          feature_image_alt_en: string | null;
          feature_image_fit: "cover" | "contain";
          // Added by 20261128000000_product_specs.sql
          fabric_ar: string | null;
          fabric_en: string | null;
          fabric_weight_gsm: number | null;
          origin_ar: string | null;
          origin_en: string | null;
          care_ar: string | null;
          care_en: string | null;
          care_icons: CareIcon[];
          model_height_cm: number | null;
          model_size_code: string | null;
          delivery_note_ar: string | null;
          delivery_note_en: string | null;
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
          feature_image_url?: string | null;
          feature_image_alt_ar?: string | null;
          feature_image_alt_en?: string | null;
          feature_image_fit?: "cover" | "contain";
          fabric_ar?: string | null;
          fabric_en?: string | null;
          fabric_weight_gsm?: number | null;
          origin_ar?: string | null;
          origin_en?: string | null;
          care_ar?: string | null;
          care_en?: string | null;
          care_icons?: CareIcon[];
          model_height_cm?: number | null;
          model_size_code?: string | null;
          delivery_note_ar?: string | null;
          delivery_note_en?: string | null;
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
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string | null;
          phone?: string | null;
        };
        Relationships: [];
      };
      addresses: {
        Row: {
          id: number;
          user_id: string;
          label: string | null;
          recipient_name: string;
          phone: string;
          governorate: string;
          city: string;
          street: string;
          building: string | null;
          floor: string | null;
          apartment: string | null;
          landmark: string | null;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id?: string;
          label?: string | null;
          recipient_name: string;
          phone: string;
          governorate: string;
          city: string;
          street: string;
          building?: string | null;
          floor?: string | null;
          apartment?: string | null;
          landmark?: string | null;
          is_default?: boolean;
        };
        Update: {
          label?: string | null;
          recipient_name?: string;
          phone?: string;
          governorate?: string;
          city?: string;
          street?: string;
          building?: string | null;
          floor?: string | null;
          apartment?: string | null;
          landmark?: string | null;
          is_default?: boolean;
        };
        Relationships: [];
      };
      // Added by 20261128000000_product_specs.sql: exactly one row (id = true).
      store_settings: {
        Row: {
          id: true;
          delivery_ar: string;
          delivery_en: string;
          free_shipping_threshold: number | null;
          cairo_days_min: number;
          cairo_days_max: number;
          other_days_min: number;
          other_days_max: number;
          exchange_days: number;
          cod_enabled: boolean;
          updated_at: string;
        };
        // RLS allows no inserts: the row is created by the migration.
        Insert: never;
        Update: {
          delivery_ar?: string;
          delivery_en?: string;
          free_shipping_threshold?: number | null;
          cairo_days_min?: number;
          cairo_days_max?: number;
          other_days_min?: number;
          other_days_max?: number;
          exchange_days?: number;
          cod_enabled?: boolean;
        };
        Relationships: [];
      };
      // Added by 20261129000000_reviews.sql. user_id is not readable (column privileges),
      // so it is left out of Row. Customers insert product_id + rating + body only.
      reviews: {
        Row: {
          id: number;
          product_id: number;
          display_name: string | null;
          rating: number;
          body: string;
          is_verified: boolean;
          status: ReviewStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          product_id: number;
          rating: number;
          body: string;
        };
        Update: {
          rating?: number;
          body?: string;
          // Admins only (the trigger ignores these for customers)
          status?: ReviewStatus;
          is_verified?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
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
          // Added by 20261126000000_lookbook_feature_image.sql
          feature_image_url: string | null;
          feature_image_alt_ar: string | null;
          feature_image_alt_en: string | null;
          feature_image_fit: string | null;
        };
        Relationships: [];
      };
      // Added by 20261129000000_reviews.sql: approved reviews only, one row per active product.
      product_review_stats: {
        Row: {
          product_id: number | null;
          slug: string | null;
          review_count: number | null;
          avg_rating: number | null;
          count_5: number | null;
          count_4: number | null;
          count_3: number | null;
          count_2: number | null;
          count_1: number | null;
          verified_count: number | null;
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
      // Added by 20261129000000_reviews.sql
      list_reviews: {
        Args: { product_slug: string; sort?: ReviewSort; page?: number; page_size?: number };
        Returns: {
          id: number;
          display_name: string | null;
          rating: number;
          body: string;
          is_verified: boolean;
          created_at: string;
          total_count: number;
        }[];
      };
      my_review: {
        Args: { product_slug: string };
        Returns: {
          id: number;
          rating: number;
          body: string;
          status: ReviewStatus;
          created_at: string;
          updated_at: string;
        }[];
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

type PublicSchema = Database["public"];
export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];
export type Views<T extends keyof PublicSchema["Views"]> = PublicSchema["Views"][T]["Row"];
