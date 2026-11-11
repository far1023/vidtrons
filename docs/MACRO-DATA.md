# Data Makro Ekonomi

Sumber: grafik garis (Kota Dumai, Riau, Nasional), tahun 2021-2025.

## Catatan umum

- `region` diisi nama wilayah. Petakan ke `regions.id` saat input. Pastikan ada region "Nasional" di tabel `regions`.
- Tahun 2021 adalah titik awal pada grafik, sehingga tidak ada pembanding. `tren` diisi `tetap` (**perlu dicek**; bisa diganti jika ada data 2020).
- Tren dihitung dibanding tahun sebelumnya. Nilai sama persis = `tetap`.
- `urutan` berurutan per region sesuai tahun (1 = 2021, dst.).
- `satuan` = `%` untuk indikator 1-3, `Indeks` untuk IPM dan Indeks Gini (indikator 4-5). `is_active` = `true`.

---

# 1. Laju Pertumbuhan Ekonomi

Aturan tren: nilai naik = `naik_positif`, nilai turun = `turun_negatif`.

## Kota Dumai

| region     | judul                    | nilai | satuan | tahun | tren          | urutan | is_active |
| ---------- | ------------------------ | ----- | ------ | ----- | ------------- | ------ | --------- |
| Kota Dumai | Laju Pertumbuhan Ekonomi | 5,98  | %      | 2021  | tetap         | 1      | false     |
| Kota Dumai | Laju Pertumbuhan Ekonomi | 6,36  | %      | 2022  | naik_positif  | 2      | false     |
| Kota Dumai | Laju Pertumbuhan Ekonomi | 6,05  | %      | 2023  | turun_negatif | 3      | false     |
| Kota Dumai | Laju Pertumbuhan Ekonomi | 5,02  | %      | 2024  | turun_negatif | 4      | false     |
| Kota Dumai | Laju Pertumbuhan Ekonomi | 5,55  | %      | 2025  | naik_positif  | 5      | true      |

## Riau

| region | judul                    | nilai | satuan | tahun | tren          | urutan | is_active |
| ------ | ------------------------ | ----- | ------ | ----- | ------------- | ------ | --------- |
| Riau   | Laju Pertumbuhan Ekonomi | 3,78  | %      | 2021  | tetap         | 1      | false     |
| Riau   | Laju Pertumbuhan Ekonomi | 4,55  | %      | 2022  | naik_positif  | 2      | false     |
| Riau   | Laju Pertumbuhan Ekonomi | 4,21  | %      | 2023  | turun_negatif | 3      | false     |
| Riau   | Laju Pertumbuhan Ekonomi | 3,52  | %      | 2024  | turun_negatif | 4      | false     |
| Riau   | Laju Pertumbuhan Ekonomi | 4,79  | %      | 2025  | naik_positif  | 5      | true      |

## Nasional

| region   | judul                    | nilai | satuan | tahun | tren          | urutan | is_active |
| -------- | ------------------------ | ----- | ------ | ----- | ------------- | ------ | --------- |
| Nasional | Laju Pertumbuhan Ekonomi | 3,69  | %      | 2021  | tetap         | 1      | false     |
| Nasional | Laju Pertumbuhan Ekonomi | 5,31  | %      | 2022  | naik_positif  | 2      | false     |
| Nasional | Laju Pertumbuhan Ekonomi | 5,05  | %      | 2023  | turun_negatif | 3      | false     |
| Nasional | Laju Pertumbuhan Ekonomi | 5,03  | %      | 2024  | turun_negatif | 4      | false     |
| Nasional | Laju Pertumbuhan Ekonomi | 5,11  | %      | 2025  | naik_positif  | 5      | true      |

---

# 2. Tingkat Kemiskinan

Aturan tren: nilai turun = `turun_positif`, nilai naik = `naik_negatif` (kemiskinan yang turun adalah hal positif).

## Kota Dumai

| region     | judul              | nilai | satuan | tahun | tren          | urutan | is_active |
| ---------- | ------------------ | ----- | ------ | ----- | ------------- | ------ | --------- |
| Kota Dumai | Tingkat Kemiskinan | 3,42  | %      | 2021  | tetap         | 1      | false     |
| Kota Dumai | Tingkat Kemiskinan | 3,20  | %      | 2022  | turun_positif | 2      | false     |
| Kota Dumai | Tingkat Kemiskinan | 3,21  | %      | 2023  | naik_negatif  | 3      | false     |
| Kota Dumai | Tingkat Kemiskinan | 3,14  | %      | 2024  | turun_positif | 4      | false     |
| Kota Dumai | Tingkat Kemiskinan | 3,08  | %      | 2025  | turun_positif | 5      | true      |

## Riau

| region | judul              | nilai | satuan | tahun | tren          | urutan | is_active |
| ------ | ------------------ | ----- | ------ | ----- | ------------- | ------ | --------- |
| Riau   | Tingkat Kemiskinan | 7,12  | %      | 2021  | tetap         | 1      | false     |
| Riau   | Tingkat Kemiskinan | 6,78  | %      | 2022  | turun_positif | 2      | false     |
| Riau   | Tingkat Kemiskinan | 6,68  | %      | 2023  | turun_positif | 3      | false     |
| Riau   | Tingkat Kemiskinan | 6,67  | %      | 2024  | turun_positif | 4      | false     |
| Riau   | Tingkat Kemiskinan | 6,16  | %      | 2025  | turun_positif | 5      | true      |

## Nasional

| region   | judul              | nilai | satuan | tahun | tren          | urutan | is_active |
| -------- | ------------------ | ----- | ------ | ----- | ------------- | ------ | --------- |
| Nasional | Tingkat Kemiskinan | 9,71  | %      | 2021  | tetap         | 1      | false     |
| Nasional | Tingkat Kemiskinan | 9,57  | %      | 2022  | turun_positif | 2      | false     |
| Nasional | Tingkat Kemiskinan | 9,36  | %      | 2023  | turun_positif | 3      | false     |
| Nasional | Tingkat Kemiskinan | 9,03  | %      | 2024  | turun_positif | 4      | false     |
| Nasional | Tingkat Kemiskinan | 8,47  | %      | 2025  | turun_positif | 5      | true      |

---

# 3. Tingkat Pengangguran Terbuka

Aturan tren: nilai turun = `turun_positif`, nilai naik = `naik_negatif` (pengangguran yang turun adalah hal positif).

## Kota Dumai

| region     | judul                        | nilai | satuan | tahun | tren          | urutan | is_active |
| ---------- | ---------------------------- | ----- | ------ | ----- | ------------- | ------ | --------- |
| Kota Dumai | Tingkat Pengangguran Terbuka | 6,29  | %      | 2021  | tetap         | 1      | false     |
| Kota Dumai | Tingkat Pengangguran Terbuka | 5,38  | %      | 2022  | turun_positif | 2      | false     |
| Kota Dumai | Tingkat Pengangguran Terbuka | 5,15  | %      | 2023  | turun_positif | 3      | false     |
| Kota Dumai | Tingkat Pengangguran Terbuka | 4,66  | %      | 2024  | turun_positif | 4      | false     |
| Kota Dumai | Tingkat Pengangguran Terbuka | 4,51  | %      | 2025  | turun_positif | 5      | true      |

## Riau

| region | judul                        | nilai | satuan | tahun | tren          | urutan | is_active |
| ------ | ---------------------------- | ----- | ------ | ----- | ------------- | ------ | --------- |
| Riau   | Tingkat Pengangguran Terbuka | 4,42  | %      | 2021  | tetap         | 1      | false     |
| Riau   | Tingkat Pengangguran Terbuka | 4,37  | %      | 2022  | turun_positif | 2      | false     |
| Riau   | Tingkat Pengangguran Terbuka | 4,23  | %      | 2023  | turun_positif | 3      | false     |
| Riau   | Tingkat Pengangguran Terbuka | 3,70  | %      | 2024  | turun_positif | 4      | false     |
| Riau   | Tingkat Pengangguran Terbuka | 4,16  | %      | 2025  | naik_negatif  | 5      | true      |

## Nasional

| region   | judul                        | nilai | satuan | tahun | tren          | urutan | is_active |
| -------- | ---------------------------- | ----- | ------ | ----- | ------------- | ------ | --------- |
| Nasional | Tingkat Pengangguran Terbuka | 6,49  | %      | 2021  | tetap         | 1      | false     |
| Nasional | Tingkat Pengangguran Terbuka | 5,86  | %      | 2022  | turun_positif | 2      | false     |
| Nasional | Tingkat Pengangguran Terbuka | 5,32  | %      | 2023  | turun_positif | 3      | false     |
| Nasional | Tingkat Pengangguran Terbuka | 4,91  | %      | 2024  | turun_positif | 4      | false     |
| Nasional | Tingkat Pengangguran Terbuka | 4,85  | %      | 2025  | turun_positif | 5      | true      |

---

# 4. Indeks Pembangunan Manusia

Aturan tren: nilai naik = `naik_positif`, nilai turun = `turun_negatif` (IPM yang naik adalah hal positif).

## Kota Dumai

| region     | judul                      | nilai | satuan | tahun | tren         | urutan | is_active |
| ---------- | -------------------------- | ----- | ------ | ----- | ------------ | ------ | --------- |
| Kota Dumai | Indeks Pembangunan Manusia | 74,75 | Poin   | 2021  | tetap        | 1      | false     |
| Kota Dumai | Indeks Pembangunan Manusia | 75,26 | Poin   | 2022  | naik_positif | 2      | false     |
| Kota Dumai | Indeks Pembangunan Manusia | 76,45 | Poin   | 2023  | naik_positif | 3      | false     |
| Kota Dumai | Indeks Pembangunan Manusia | 77,03 | Poin   | 2024  | naik_positif | 4      | false     |
| Kota Dumai | Indeks Pembangunan Manusia | 77,58 | Poin   | 2025  | naik_positif | 5      | true      |

## Riau

| region | judul                      | nilai | satuan | tahun | tren          | urutan | is_active |
| ------ | -------------------------- | ----- | ------ | ----- | ------------- | ------ | --------- |
| Riau   | Indeks Pembangunan Manusia | 73,89 | Poin   | 2021  | tetap         | 1      | false     |
| Riau   | Indeks Pembangunan Manusia | 75,45 | Poin   | 2022  | naik_positif  | 2      | false     |
| Riau   | Indeks Pembangunan Manusia | 74,95 | Poin   | 2023  | turun_negatif | 3      | false     |
| Riau   | Indeks Pembangunan Manusia | 75,67 | Poin   | 2024  | naik_positif  | 4      | false     |
| Riau   | Indeks Pembangunan Manusia | 76,31 | Poin   | 2025  | naik_positif  | 5      | true      |

## Nasional

| region   | judul                      | nilai | satuan | tahun | tren         | urutan | is_active |
| -------- | -------------------------- | ----- | ------ | ----- | ------------ | ------ | --------- |
| Nasional | Indeks Pembangunan Manusia | 73,16 | Poin   | 2021  | tetap        | 1      | false     |
| Nasional | Indeks Pembangunan Manusia | 73,77 | Poin   | 2022  | naik_positif | 2      | false     |
| Nasional | Indeks Pembangunan Manusia | 74,39 | Poin   | 2023  | naik_positif | 3      | false     |
| Nasional | Indeks Pembangunan Manusia | 75,02 | Poin   | 2024  | naik_positif | 4      | false     |
| Nasional | Indeks Pembangunan Manusia | 75,9  | Poin   | 2025  | naik_positif | 5      | true      |

---

# 5. Indeks Gini

Aturan tren: nilai turun = `turun_positif`, nilai naik = `naik_negatif` (ketimpangan yang turun adalah hal positif). Nilai sama persis = `tetap`.

## Kota Dumai

| region     | judul       | nilai | satuan | tahun | tren          | urutan | is_active |
| ---------- | ----------- | ----- | ------ | ----- | ------------- | ------ | --------- |
| Kota Dumai | Indeks Gini | 0,345 | Poin   | 2021  | tetap         | 1      | false     |
| Kota Dumai | Indeks Gini | 0,324 | Poin   | 2022  | turun_positif | 2      | false     |
| Kota Dumai | Indeks Gini | 0,310 | Poin   | 2023  | turun_positif | 3      | false     |
| Kota Dumai | Indeks Gini | 0,328 | Poin   | 2024  | naik_negatif  | 4      | false     |
| Kota Dumai | Indeks Gini | 0,321 | Poin   | 2025  | turun_positif | 5      | true      |

## Riau

| region | judul       | nilai | satuan | tahun | tren          | urutan | is_active |
| ------ | ----------- | ----- | ------ | ----- | ------------- | ------ | --------- |
| Riau   | Indeks Gini | 0,327 | Poin   | 2021  | tetap         | 1      | false     |
| Riau   | Indeks Gini | 0,323 | Poin   | 2022  | turun_positif | 2      | false     |
| Riau   | Indeks Gini | 0,324 | Poin   | 2023  | naik_negatif  | 3      | false     |
| Riau   | Indeks Gini | 0,307 | Poin   | 2024  | turun_positif | 4      | false     |
| Riau   | Indeks Gini | 0,304 | Poin   | 2025  | turun_positif | 5      | true      |

## Nasional

| region   | judul       | nilai | satuan | tahun | tren          | urutan | is_active |
| -------- | ----------- | ----- | ------ | ----- | ------------- | ------ | --------- |
| Nasional | Indeks Gini | 0,381 | Poin   | 2021  | tetap         | 1      | false     |
| Nasional | Indeks Gini | 0,381 | Poin   | 2022  | tetap         | 2      | false     |
| Nasional | Indeks Gini | 0,388 | Poin   | 2023  | naik_negatif  | 3      | false     |
| Nasional | Indeks Gini | 0,379 | Poin   | 2024  | turun_positif | 4      | false     |
| Nasional | Indeks Gini | 0,363 | Poin   | 2025  | turun_positif | 5      | true      |
