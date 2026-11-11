CREATE TABLE "regions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "regions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"kode" varchar(10) NOT NULL,
	"nama" varchar(100) NOT NULL,
	"level" varchar(10) NOT NULL,
	"parent_id" integer,
	"warna" varchar(32),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "regions_kode_unique" UNIQUE("kode"),
	CONSTRAINT "regions_level_check" CHECK ("regions"."level" in ('nasional', 'provinsi', 'kabkota'))
);
--> statement-breakpoint
ALTER TABLE "regions" ADD CONSTRAINT "regions_parent_id_regions_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."regions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "regions_parent_id_idx" ON "regions" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "regions_level_idx" ON "regions" USING btree ("level");--> statement-breakpoint
ALTER TABLE "makro_ekonomi" ADD COLUMN "region_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "makro_ekonomi" ADD CONSTRAINT "makro_ekonomi_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "makro_ekonomi_region_judul_tahun_uq" ON "makro_ekonomi" USING btree ("region_id",lower("judul"),"tahun");--> statement-breakpoint
CREATE INDEX "makro_ekonomi_region_id_idx" ON "makro_ekonomi" USING btree ("region_id");
