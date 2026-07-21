CREATE TABLE "company" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"ticker" text NOT NULL,
	"exchange" text NOT NULL,
	"segment" text NOT NULL,
	"country" text NOT NULL,
	"industry_id" text,
	"description" text,
	"headquarters" text,
	"founded_year" integer,
	"website" text,
	"reporting_currency" text DEFAULT 'USD' NOT NULL,
	"created_at" text DEFAULT (now())::text NOT NULL,
	"updated_at" text DEFAULT (now())::text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financial_fact" (
	"id" serial PRIMARY KEY NOT NULL,
	"period_id" integer NOT NULL,
	"concept" text NOT NULL,
	"value" double precision NOT NULL,
	"source_id" text,
	"created_at" text DEFAULT (now())::text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financial_period" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"period_label" text NOT NULL,
	"period_type" text NOT NULL,
	"fiscal_year" integer NOT NULL,
	"fiscal_quarter" integer,
	"currency" text DEFAULT 'USD' NOT NULL,
	"unit" text DEFAULT 'millions' NOT NULL,
	"report_date" text,
	"source_id" text,
	"created_at" text DEFAULT (now())::text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "industry" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"sector" text NOT NULL,
	"description" text,
	"chain_order" integer,
	"created_at" text DEFAULT (now())::text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "industry_metric" (
	"id" serial PRIMARY KEY NOT NULL,
	"industry_id" text NOT NULL,
	"metric_key" text NOT NULL,
	"label" text NOT NULL,
	"kind" text DEFAULT 'price' NOT NULL,
	"observation_date" text NOT NULL,
	"value" double precision NOT NULL,
	"unit" text NOT NULL,
	"note" text,
	"source_id" text,
	"created_at" text DEFAULT (now())::text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "relationship" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_id" text NOT NULL,
	"to_id" text NOT NULL,
	"relation_type" text NOT NULL,
	"label" text,
	"note" text,
	"source_id" text,
	"created_at" text DEFAULT (now())::text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"name" text NOT NULL,
	"url" text,
	"retrieved_at" text,
	"note" text,
	"created_at" text DEFAULT (now())::text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "company" ADD CONSTRAINT "company_industry_id_industry_id_fk" FOREIGN KEY ("industry_id") REFERENCES "public"."industry"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_fact" ADD CONSTRAINT "financial_fact_period_id_financial_period_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."financial_period"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_fact" ADD CONSTRAINT "financial_fact_source_id_source_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."source"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_period" ADD CONSTRAINT "financial_period_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_period" ADD CONSTRAINT "financial_period_source_id_source_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."source"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "industry_metric" ADD CONSTRAINT "industry_metric_industry_id_industry_id_fk" FOREIGN KEY ("industry_id") REFERENCES "public"."industry"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "industry_metric" ADD CONSTRAINT "industry_metric_source_id_source_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."source"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relationship" ADD CONSTRAINT "relationship_from_id_company_id_fk" FOREIGN KEY ("from_id") REFERENCES "public"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relationship" ADD CONSTRAINT "relationship_to_id_company_id_fk" FOREIGN KEY ("to_id") REFERENCES "public"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relationship" ADD CONSTRAINT "relationship_source_id_source_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."source"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "company_ticker_idx" ON "company" USING btree ("ticker");--> statement-breakpoint
CREATE INDEX "company_industry_idx" ON "company" USING btree ("industry_id");--> statement-breakpoint
CREATE UNIQUE INDEX "financial_fact_period_concept_unq" ON "financial_fact" USING btree ("period_id","concept");--> statement-breakpoint
CREATE UNIQUE INDEX "financial_period_company_label_unq" ON "financial_period" USING btree ("company_id","period_label");--> statement-breakpoint
CREATE INDEX "financial_period_company_type_year_idx" ON "financial_period" USING btree ("company_id","period_type","fiscal_year");--> statement-breakpoint
CREATE UNIQUE INDEX "industry_metric_series_date_unq" ON "industry_metric" USING btree ("industry_id","metric_key","observation_date");--> statement-breakpoint
CREATE INDEX "industry_metric_industry_key_idx" ON "industry_metric" USING btree ("industry_id","metric_key");--> statement-breakpoint
CREATE UNIQUE INDEX "relationship_edge_unq" ON "relationship" USING btree ("from_id","to_id","relation_type");--> statement-breakpoint
CREATE INDEX "relationship_from_idx" ON "relationship" USING btree ("from_id");--> statement-breakpoint
CREATE INDEX "relationship_to_idx" ON "relationship" USING btree ("to_id");