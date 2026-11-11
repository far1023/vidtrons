# Planning: Makro Ekonomi per Wilayah (region_id)

Status: DRAFT, menunggu persetujuan. Belum ada kode yang diubah.
Tugas terkait: T20 sampai T26 di `docs/TASKS.md`.

## 1. Tujuan

- Setiap baris `makro_ekonomi` menjadi angka milik satu wilayah: nasional, provinsi, atau kabupaten/kota.
- Grafik makro bisa difilter per wilayah, dan bisa membandingkan beberapa wilayah sekaligus.
- Saat banyak wilayah dipilih, tiap seri grafik memakai warna khas wilayahnya.
- `IndikatorChartCard` mengambil data lewat satu endpoint (multi-region), bukan dari data yang dilempar halaman.

## 2. Kondisi sekarang

- `db/schema.ts`: `makro_ekonomi` (judul, nilai, satuan, tahun, tren, urutan, is_active). Satu baris per (judul, tahun), tanpa wilayah.
- `lib/makro-ekonomi.ts`: `buildGrafikMakro()` mengelompokkan per `judul`; `Indikator.titik` hanya satu seri.
- `components/makro/indikator-chart-card.tsx`: menerima satu `Indikator`; satu warna tetap (`CHART_COLOR`), `Bar`/`Line` tunggal, tooltip dan label membaca `nilaiLabel`.

## 3. Keputusan: seed tabel `regions`

Rekomendasi: **seed lengkap nasional + 38 provinsi + seluruh kabupaten/kota (sekitar 550 baris), kode Kemendagri.** Ini tidak overkill: datanya statis, kecil (sekitar 50 KB), satu kali seed, dan tidak menambah beban query karena hasilnya masuk cache.

| Opsi            | Isi                                        | Catatan                                                                            |
| --------------- | ------------------------------------------ | ---------------------------------------------------------------------------------- |
| A (rekomendasi) | Nasional, 38 provinsi, 514 kab/kota        | Admin tidak perlu input wilayah manual; kode sesuai Kemendagri                     |
| B               | Hanya Nasional, Riau, dan kab/kota di Riau | Lebih ringan, tapi memaksa tambah wilayah manual lewat admin bila butuh pembanding |
| C               | Admin menginput semua wilayah sendiri      | Rawan salah kode; tidak disarankan                                                 |

Kode Kemendagri (Permendagri 72/2019 dan pembaruannya):

- Provinsi: 2 digit (`14` Riau).
- Kab/kota: `PP.KK` (`14.72` Kota Dumai).
- Nasional: baris khusus kode `00` (bukan kode Kemendagri; dipakai sebagai akar).

Sumber data: file JSON statis yang di-commit di `db/data/regions.json`, diambil dari repositori terbuka berbasis Kepmendagri (mis. `cahyadsn/wilayah`) lalu diverifikasi jumlahnya (38 provinsi, 514 kab/kota). Seed idempoten (`ON CONFLICT (kode) DO UPDATE`). Pemekaran provinsi baru (Papua) harus dicek ulang terhadap Kepmendagri terbaru saat seed dibuat.

## 4. Skema data

### Tabel baru `regions`

| Kolom       | Tipe                          | Catatan                                                |
| ----------- | ----------------------------- | ------------------------------------------------------ |
| `id`        | integer identity PK           |                                                        |
| `kode`      | varchar(10) unique not null   | `00`, `14`, `14.72`                                    |
| `nama`      | varchar(100) not null         | "Kota Dumai"                                           |
| `level`     | varchar(10) not null          | `nasional` / `provinsi` / `kabkota` (CHECK)            |
| `parent_id` | integer null, FK `regions.id` | provinsi menunjuk nasional, kab/kota menunjuk provinsi |
| `warna`     | varchar(32) null              | warna khas wilayah (hex), opsional                     |
| `is_active` | boolean default true          | wilayah nonaktif tidak muncul di filter                |
| timestamps  |                               | memakai helper `timestamps` yang ada                   |

Indeks: `parent_id`, `level`. Kolom `warna` diisi dahulu hanya untuk wilayah yang sering tampil (Nasional, Riau, Dumai, tetangga). Sisanya memakai palet cadangan (lihat bagian 6).

### Perubahan `makro_ekonomi`

- Tambah `region_id integer references regions(id) on delete restrict`.
- Langkah migrasi aman (tiga migrasi atau satu migrasi berurutan):
  1. Buat `regions` + seed.
  2. Tambah `region_id` NULLABLE, isi (backfill) semua baris lama.
  3. Ubah menjadi `NOT NULL`.
- Unique index `(region_id, lower(judul), tahun)` supaya data ganda tidak lolos. Sebelumnya cek duplikat lama (kode sekarang memilih id terbesar), bersihkan dahulu.
- Indeks `region_id`.
- Backfill: data lama diasumsikan milik **Kota Dumai (`14.72`)**. Lihat pertanyaan terbuka no. 1.

## 5. Backend (ikuti `docs/BACKEND.md`)

Alur: route, middleware, request, controller, service, model, resource. Tidak ada Server Action.

- Model: `region-model.ts` (list, find, ids), perluas `makro-model.ts` dengan filter `regionIds`.
- Schema zod (`lib/schemas/`): `region.ts` (admin: ubah `warna`, `is_active`), `makro.ts` ditambah `regionId` wajib.
- Endpoint publik baca:
  - `GET /api/makro?regionIds=1,2,3&tahun=5` : data grafik multi-wilayah. Validasi: maksimal 5 wilayah, `regionIds` angka, default = wilayah bawaan (Kota Dumai + Nasional).
  - `GET /api/regions?level=&parentId=&q=` : untuk pemilih wilayah (ringan, di-cache).
- Admin (with-auth): `PATCH /api/admin/regions/[id]` (warna, aktif); CRUD makro yang ada ditambah `regionId`.
- Cache (aturan proyek: jangan query DB tiap request):
  - Respons di-cache dengan tag `makro` dan `regions`; kunci cache memuat daftar `regionIds` yang diurutkan.
  - Service tulis (makro dan regions) memanggil `revalidateTag`.
  - Daftar `regions` hampir statis: cache panjang, tag `regions`.
- Resource (bentuk respons):

```ts
type GrafikMakroMulti = {
  tahunAwal: number
  tahunAkhir: number
  regions: { id: number; kode: string; nama: string; level: string; warna: string }[] // warna sudah final (cadangan terisi)
  indikator: {
    judul: string
    satuan: string
    jenisGrafik: "garis" | "batang"
    urutan: number
    seri: {
      regionId: number
      tahunTerbaru: number
      nilaiTerbaru: string
      delta: Delta | null
      titik: TitikData[]
    }[]
  }[]
}
```

- `lib/makro-ekonomi.ts` (helper murni) diubah: `buildGrafikMakro(rows, regions, jumlahTahun)` mengelompokkan per `judul`, lalu per `regionId`. Perilaku per seri (parse, delta, tren, tahun kosong) tetap. Indikator ditampilkan jika minimal satu seri punya data.

## 6. Warna per wilayah

- Sumber utama: `regions.warna`.
- Cadangan bila `warna` kosong: palet tetap 8 warna (di token CSS `--chart-region-1..8`, diperiksa kontrasnya terhadap latar), dipilih berdasarkan urutan wilayah dalam pilihan, bukan acak, agar stabil di antar render.
- Pasangan warna cadangan dihitung di service (bukan di komponen), sehingga respons selalu membawa `warna` final per wilayah.
- Admin: kolom warna di halaman wilayah memakai input warna sederhana (hex tervalidasi zod `^#[0-9a-fA-F]{6}$`).
- Kontras: kontras antar seri harus tetap terbaca; perlakuan tambahan untuk buta warna (bentuk titik berbeda atau pola garis putus) dipertimbangkan di T24 bila lebih dari 3 seri.

## 7. Frontend

### `IndikatorChartCard`

- Props baru: `indikator` berisi `seri[]` plus `regions` (peta id ke nama dan warna). Komponen tidak lagi menerima titik tunggal.
- Data dimuat lewat hook `use-makro-data` (SWR) yang memanggil `GET /api/makro?regionIds=...`; satu fetch untuk seluruh halaman, bukan satu per kartu.
- `ChartConfig` dibangun dinamis: satu key per `regionId` (`r{id}`), label = nama wilayah, color = `warna`.
- Bentuk data recharts: pivot per tahun: `{ tahun, r1: 5.2, r2: 4.9 }` (label teks di `payload`).
- Satu wilayah: tampilan seperti sekarang (angka besar, panah tren, label di titik).
- Banyak wilayah: satu `Line`/`Bar` per seri, dengan `ChartLegend` (shadcn chart) di bawah; angka besar diganti ringkasan per wilayah (nilai terbaru + delta per wilayah, ditandai dengan titik warna); label di titik hanya untuk seri pertama atau dimatikan jika lebih dari 2 seri agar tidak bertumpuk. Batang dikelompokkan (grouped).
- Domain sumbu Y dihitung dari gabungan semua seri.
- Tooltip menampilkan semua seri pada tahun itu, urut dari nilai terbesar.
- Alternatif teks `sr-only`: daftar per wilayah dan per tahun.

### Filter halaman makro

- Komponen `RegionFilter` (shadcn `popover` + `command` + `badge` chip; pasang lewat CLI dahulu). Pemilih bertingkat (nasional, provinsi, kab/kota) dengan pencarian nama; maksimal 5 pilihan.
- State tersimpan di query string (`?wilayah=14.72,00`) agar bisa dibagikan; memakai `kode`, bukan id internal.
- Halaman `/display` (TV pasif) tidak punya kontrol: memakai wilayah bawaan dari `setting` (key `makroWilayahDefault`, daftar kode) dan hanya menampilkan data terpilih. Tidak ada fitur baru di layar lobi di luar `docs/SPEC.md`. Perubahan ini perlu dicatat di SPEC.

## 8. Admin

- Halaman Wilayah (read-mostly): daftar + pencarian + ubah `warna` dan `is_active`. Kode dan nama tidak diubah dari UI (berasal dari seed).
- Form Makro Ekonomi: tambah pemilih wilayah (wajib) dan kolom wilayah di tabel; filter tabel per wilayah.
- Impor: opsional (di luar scope awal) impor CSV (kode wilayah, judul, tahun, nilai) untuk mengisi data banyak wilayah. Diusulkan sebagai tahap lanjutan karena tanpa impor, mengisi banyak wilayah lewat form akan lambat.

## 9. Tahapan (ditambahkan ke TASKS.md)

1. T20: Migrasi `regions` + `region_id` + seed wilayah + backfill (dev dahulu).
2. T21: Backend `regions` (model, schema, service, controller, route) + perluasan makro model/service dengan `regionIds`.
3. T22: `GET /api/makro` multi-wilayah dengan cache bertag + helper `buildGrafikMakro` multi-seri (uji unit parse dan pivot).
4. T23: Hook `use-makro-data` + refactor `IndikatorChartCard` ke multi-seri + warna wilayah + legenda.
5. T24: `RegionFilter` + sinkronisasi query string + wilayah bawaan untuk display.
6. T25: Admin: halaman Wilayah (warna), form Makro dengan wilayah.
7. T26: Verifikasi: `npm run build`, uji 1 wilayah vs 5 wilayah di 1366x768 dan 1920x1080, data kosong, wilayah tanpa data, cek biaya query Neon (tidak ada query per poll).

## 10. Risiko

- Backfill salah wilayah mengubah arti data lama. Mitigasi: cadangan tabel sebelum migrasi dan konfirmasi asumsi wilayah.
- Kualitas data seed Kemendagri (pemekaran terbaru). Mitigasi: hitung jumlah dan cek kode unik saat seed, tanggal sumber dicatat di `docs/PROGRESS.md`.
- HTTP driver Neon tidak punya transaksi interaktif: migrasi tiga langkah dijalankan sebagai migrasi terpisah, bukan transaksi.
- Banyak seri membuat kartu padat: batas 5 wilayah dan label titik dimatikan di atas 2 seri.
- Respons multi-wilayah lebih besar: dibatasi 5 wilayah x 5 tahun x jumlah indikator, jauh di bawah beban berarti.
