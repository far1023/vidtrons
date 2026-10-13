CREATE TABLE "makro_ekonomi" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "makro_ekonomi_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"judul" varchar(100) NOT NULL,
	"nilai" varchar(50) NOT NULL,
	"satuan" varchar(20) DEFAULT '%' NOT NULL,
	"tahun" varchar(20) NOT NULL,
	"tren" varchar(10) DEFAULT 'tetap' NOT NULL,
	"urutan" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
