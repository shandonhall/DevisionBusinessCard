export type OrganisationStatus = "draft" | "active" | "suspended" | "archived";

export type MembershipRole =
  | "organisation_admin"
  | "brand_admin"
  | "location_admin"
  | "employee";

export type CardLayoutId = "executive" | "corporate" | "modern";

export type EntityStatus = "draft" | "active" | "archived";

export type LocationType =
  | "branch"
  | "dealership"
  | "office"
  | "department"
  | "division"
  | "region"
  | "team";

export type EmployeeStatus = "draft" | "active" | "paused" | "archived";

export type CardPublicStatus = "draft" | "active" | "paused" | "archived";

export type CardSectionType =
  | "hero"
  | "contact_actions"
  | "about"
  | "social_links"
  | "custom_links"
  | "qr"
  | "exchange_details";

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
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          is_platform_admin: boolean;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          is_platform_admin?: boolean;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          is_platform_admin?: boolean;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      organisations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          legal_name: string | null;
          website: string | null;
          status: OrganisationStatus;
          default_brand_id: string | null;
          default_brand_kit_id: string | null;
          plan_id: string | null;
          white_label_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          legal_name?: string | null;
          website?: string | null;
          status?: OrganisationStatus;
          default_brand_id?: string | null;
          default_brand_kit_id?: string | null;
          plan_id?: string | null;
          white_label_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          legal_name?: string | null;
          website?: string | null;
          status?: OrganisationStatus;
          default_brand_id?: string | null;
          default_brand_kit_id?: string | null;
          plan_id?: string | null;
          white_label_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organisations_default_brand_kit_id_fkey";
            columns: ["default_brand_kit_id"];
            isOneToOne: false;
            referencedRelation: "brand_kits";
            referencedColumns: ["id"];
          },
        ];
      };
      brand_kits: {
        Row: {
          id: string;
          organisation_id: string;
          brand_id: string | null;
          name: string;
          primary_colour: string;
          secondary_colour: string;
          accent_colour: string;
          background_colour: string;
          surface_colour: string;
          text_colour: string;
          muted_text_colour: string;
          heading_font: string;
          body_font: string;
          button_radius: string;
          card_radius: string;
          border_style: string;
          shadow_style: string;
          background_style: string;
          logo_url: string | null;
          default_layout_id: CardLayoutId;
          custom_css_allowed: boolean;
          experience_preset: string | null;
          experience_config: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organisation_id: string;
          brand_id?: string | null;
          name?: string;
          primary_colour?: string;
          secondary_colour?: string;
          accent_colour?: string;
          background_colour?: string;
          surface_colour?: string;
          text_colour?: string;
          muted_text_colour?: string;
          heading_font?: string;
          body_font?: string;
          button_radius?: string;
          card_radius?: string;
          border_style?: string;
          shadow_style?: string;
          background_style?: string;
          logo_url?: string | null;
          default_layout_id?: CardLayoutId;
          custom_css_allowed?: boolean;
          experience_preset?: string | null;
          experience_config?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organisation_id?: string;
          brand_id?: string | null;
          name?: string;
          primary_colour?: string;
          secondary_colour?: string;
          accent_colour?: string;
          background_colour?: string;
          surface_colour?: string;
          text_colour?: string;
          muted_text_colour?: string;
          heading_font?: string;
          body_font?: string;
          button_radius?: string;
          card_radius?: string;
          border_style?: string;
          shadow_style?: string;
          background_style?: string;
          logo_url?: string | null;
          default_layout_id?: CardLayoutId;
          custom_css_allowed?: boolean;
          experience_preset?: string | null;
          experience_config?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brand_kits_organisation_id_fkey";
            columns: ["organisation_id"];
            isOneToOne: false;
            referencedRelation: "organisations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "brand_kits_brand_id_fkey";
            columns: ["brand_id"];
            isOneToOne: false;
            referencedRelation: "brands";
            referencedColumns: ["id"];
          },
        ];
      };
      brands: {
        Row: {
          id: string;
          organisation_id: string;
          name: string;
          slug: string;
          status: EntityStatus;
          website: string | null;
          logo_url: string | null;
          brand_kit_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organisation_id: string;
          name: string;
          slug: string;
          status?: EntityStatus;
          website?: string | null;
          logo_url?: string | null;
          brand_kit_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organisation_id?: string;
          name?: string;
          slug?: string;
          status?: EntityStatus;
          website?: string | null;
          logo_url?: string | null;
          brand_kit_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brands_organisation_id_fkey";
            columns: ["organisation_id"];
            isOneToOne: false;
            referencedRelation: "organisations";
            referencedColumns: ["id"];
          },
        ];
      };
      locations: {
        Row: {
          id: string;
          organisation_id: string;
          brand_id: string;
          parent_location_id: string | null;
          name: string;
          slug: string;
          type: LocationType;
          address: string | null;
          phone: string | null;
          email: string | null;
          website: string | null;
          timezone: string;
          status: EntityStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organisation_id: string;
          brand_id: string;
          parent_location_id?: string | null;
          name: string;
          slug: string;
          type?: LocationType;
          address?: string | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          timezone?: string;
          status?: EntityStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organisation_id?: string;
          brand_id?: string;
          parent_location_id?: string | null;
          name?: string;
          slug?: string;
          type?: LocationType;
          address?: string | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          timezone?: string;
          status?: EntityStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "locations_brand_id_fkey";
            columns: ["brand_id"];
            isOneToOne: false;
            referencedRelation: "brands";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "locations_organisation_id_fkey";
            columns: ["organisation_id"];
            isOneToOne: false;
            referencedRelation: "organisations";
            referencedColumns: ["id"];
          },
        ];
      };
      employees: {
        Row: {
          id: string;
          organisation_id: string;
          brand_id: string | null;
          location_id: string | null;
          user_id: string | null;
          first_name: string;
          last_name: string;
          display_name: string | null;
          job_title: string | null;
          department: string | null;
          email: string | null;
          mobile: string | null;
          whatsapp: string | null;
          linkedin_url: string | null;
          profile_photo_url: string | null;
          bio: string | null;
          status: EmployeeStatus;
          employee_reference: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organisation_id: string;
          brand_id?: string | null;
          location_id?: string | null;
          user_id?: string | null;
          first_name: string;
          last_name: string;
          display_name?: string | null;
          job_title?: string | null;
          department?: string | null;
          email?: string | null;
          mobile?: string | null;
          whatsapp?: string | null;
          linkedin_url?: string | null;
          profile_photo_url?: string | null;
          bio?: string | null;
          status?: EmployeeStatus;
          employee_reference?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organisation_id?: string;
          brand_id?: string | null;
          location_id?: string | null;
          user_id?: string | null;
          first_name?: string;
          last_name?: string;
          display_name?: string | null;
          job_title?: string | null;
          department?: string | null;
          email?: string | null;
          mobile?: string | null;
          whatsapp?: string | null;
          linkedin_url?: string | null;
          profile_photo_url?: string | null;
          bio?: string | null;
          status?: EmployeeStatus;
          employee_reference?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "employees_organisation_id_fkey";
            columns: ["organisation_id"];
            isOneToOne: false;
            referencedRelation: "organisations";
            referencedColumns: ["id"];
          },
        ];
      };
      cards: {
        Row: {
          id: string;
          organisation_id: string;
          employee_id: string;
          slug: string;
          public_status: CardPublicStatus;
          layout_id: CardLayoutId;
          brand_kit_id: string | null;
          page_title: string | null;
          meta_description: string | null;
          primary_cta_label: string | null;
          primary_cta_url: string | null;
          published_at: string | null;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organisation_id: string;
          employee_id: string;
          slug: string;
          public_status?: CardPublicStatus;
          layout_id?: CardLayoutId;
          brand_kit_id?: string | null;
          page_title?: string | null;
          meta_description?: string | null;
          primary_cta_label?: string | null;
          primary_cta_url?: string | null;
          published_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organisation_id?: string;
          employee_id?: string;
          slug?: string;
          public_status?: CardPublicStatus;
          layout_id?: CardLayoutId;
          brand_kit_id?: string | null;
          page_title?: string | null;
          meta_description?: string | null;
          primary_cta_label?: string | null;
          primary_cta_url?: string | null;
          published_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cards_employee_id_fkey";
            columns: ["employee_id"];
            isOneToOne: true;
            referencedRelation: "employees";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cards_organisation_id_fkey";
            columns: ["organisation_id"];
            isOneToOne: false;
            referencedRelation: "organisations";
            referencedColumns: ["id"];
          },
        ];
      };
      card_sections: {
        Row: {
          id: string;
          card_id: string;
          type: CardSectionType;
          sort_order: number;
          enabled: boolean;
          config_json: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          card_id: string;
          type: CardSectionType;
          sort_order?: number;
          enabled?: boolean;
          config_json?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          card_id?: string;
          type?: CardSectionType;
          sort_order?: number;
          enabled?: boolean;
          config_json?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "card_sections_card_id_fkey";
            columns: ["card_id"];
            isOneToOne: false;
            referencedRelation: "cards";
            referencedColumns: ["id"];
          },
        ];
      };
      card_slug_redirects: {
        Row: {
          id: string;
          organisation_id: string;
          card_id: string;
          from_slug: string;
          to_slug: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organisation_id: string;
          card_id: string;
          from_slug: string;
          to_slug: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organisation_id?: string;
          card_id?: string;
          from_slug?: string;
          to_slug?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "card_slug_redirects_card_id_fkey";
            columns: ["card_id"];
            isOneToOne: false;
            referencedRelation: "cards";
            referencedColumns: ["id"];
          },
        ];
      };
      memberships: {
        Row: {
          id: string;
          user_id: string;
          organisation_id: string;
          brand_id: string | null;
          location_id: string | null;
          role: MembershipRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          organisation_id: string;
          brand_id?: string | null;
          location_id?: string | null;
          role?: MembershipRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          organisation_id?: string;
          brand_id?: string | null;
          location_id?: string | null;
          role?: MembershipRole;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "memberships_organisation_id_fkey";
            columns: ["organisation_id"];
            isOneToOne: false;
            referencedRelation: "organisations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "memberships_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_platform_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_org_member: {
        Args: { target_org_id: string };
        Returns: boolean;
      };
      has_org_role: {
        Args: {
          target_org_id: string;
          allowed_roles: MembershipRole[];
        };
        Returns: boolean;
      };
      get_public_card: {
        Args: { org_slug: string; card_slug: string };
        Returns: Json;
      };
      resolve_public_card: {
        Args: { org_slug: string; card_slug: string };
        Returns: Json;
      };
      claim_employee_profile: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: {
      organisation_status: OrganisationStatus;
      membership_role: MembershipRole;
      entity_status: EntityStatus;
      location_type: LocationType;
      employee_status: EmployeeStatus;
      card_public_status: CardPublicStatus;
    };
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Organisation = Database["public"]["Tables"]["organisations"]["Row"];
export type Membership = Database["public"]["Tables"]["memberships"]["Row"];
export type BrandKit = Database["public"]["Tables"]["brand_kits"]["Row"];
export type Brand = Database["public"]["Tables"]["brands"]["Row"];
export type Location = Database["public"]["Tables"]["locations"]["Row"];
export type Employee = Database["public"]["Tables"]["employees"]["Row"];
export type Card = Database["public"]["Tables"]["cards"]["Row"];
export type CardSection = Database["public"]["Tables"]["card_sections"]["Row"];
export type CardSlugRedirect =
  Database["public"]["Tables"]["card_slug_redirects"]["Row"];
