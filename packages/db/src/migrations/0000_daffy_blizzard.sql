CREATE TABLE IF NOT EXISTS "oauth_states" (
	"state" text PRIMARY KEY NOT NULL,
	"code_verifier" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"shopify_customer_id" text NOT NULL,
	"shopify_company_gid" text NOT NULL,
	"active_location_gid" text,
	"caa_access_token" text NOT NULL,
	"caa_refresh_token" text,
	"caa_expires_at" integer NOT NULL,
	"shopify_cart_gid" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "buyers" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"company_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "role_assignments" (
	"buyer_id" text NOT NULL,
	"company_id" text NOT NULL,
	"permission" text NOT NULL,
	"granted_by" text NOT NULL,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "role_assignments_buyer_id_permission_pk" PRIMARY KEY("buyer_id","permission")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quote_lines" (
	"id" text PRIMARY KEY NOT NULL,
	"quote_id" text NOT NULL,
	"sku" text NOT NULL,
	"variant_id" text,
	"name" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price_cents" integer NOT NULL,
	"line_total_cents" integer NOT NULL,
	"notes" text,
	"attributes" jsonb,
	"position" numeric NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quotes" (
	"id" text PRIMARY KEY NOT NULL,
	"number" text NOT NULL,
	"status" text NOT NULL,
	"company_id" text NOT NULL,
	"location_id" text,
	"buyer_id" text NOT NULL,
	"currency" text NOT NULL,
	"subtotal_cents" integer NOT NULL,
	"total_cents" integer NOT NULL,
	"notes" text,
	"expires_at" timestamp with time zone,
	"shopify_draft_order_gid" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "shopping_list_items" (
	"id" text PRIMARY KEY NOT NULL,
	"list_id" text NOT NULL,
	"sku" text NOT NULL,
	"variant_id" text,
	"name" text NOT NULL,
	"quantity" integer NOT NULL,
	"notes" text,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "shopping_lists" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"owner_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_shared" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "approval_rules" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"subject_type" text NOT NULL,
	"threshold_cents" integer,
	"currency" text,
	"required_permission" text NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "approvals" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"subject_type" text NOT NULL,
	"subject_id" text NOT NULL,
	"state" text NOT NULL,
	"requested_by" text NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"decided_by" text,
	"decided_at" timestamp with time zone,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "company_settings" (
	"company_id" text PRIMARY KEY NOT NULL,
	"quote_default_expiry_days" integer DEFAULT 14 NOT NULL,
	"quote_mirror_to_draft_order" boolean DEFAULT true NOT NULL,
	"quote_allow_custom_expiry" boolean DEFAULT true NOT NULL,
	"shopping_list_default_is_shared" boolean DEFAULT false NOT NULL,
	"shopping_list_max_items" integer DEFAULT 500 NOT NULL,
	"shopping_list_max_lists_per_user" integer DEFAULT 50 NOT NULL,
	"display_name_override" text,
	"support_email" text,
	"logo_url" text,
	"default_location_id" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admin_audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"actor_id" text NOT NULL,
	"action" text NOT NULL,
	"subject_type" text NOT NULL,
	"subject_id" text NOT NULL,
	"before" jsonb,
	"after" jsonb,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
