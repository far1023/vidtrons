# Panduan Kiosk Mode & Auto-Start 24/7: Layar Informasi Videotron Lobby Bappeda

Dokumen ini berisi panduan teknis operasional untuk menyiapkan perangkat PC / Mini PC / TV Display agar dapat menyalakan dan menjalankan layar videotron (`/display`) secara otomatis, tanpa intervensi manusia (unattended), serta tahan terhadap pemadaman listrik dan gangguan jaringan selama 24 jam sehari, 7 hari seminggu.

---

## 1. Menjalankan Browser dalam Kiosk Mode

Mode Kiosk menjalankan peramban dalam layar penuh (fullscreen borderless), menyembunyikan bilah URL, tombol navigasi, menu konteks, serta menonaktifkan dialog eror peramban.

### A. Google Chrome
Buat pintasan (*shortcut*) atau skrip dengan target:
```batch
"C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk "http://localhost:3000/display" --noerrdialogs --disable-infobars --disable-translate --disable-pinch --autoplay-policy=no-user-gesture-required --check-for-update-interval=604800
```

### B. Microsoft Edge
Microsoft Edge telah terpasang bawaan di Windows 10/11:
```batch
"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --kiosk "http://localhost:3000/display" --edge-kiosk-type=fullscreen --no-first-run --noerrdialogs --disable-features=TranslateUI --autoplay-policy=no-user-gesture-required
```

### Penjelasan Parameter Penting:
- `--kiosk`: Mengunci tampilan dalam layar penuh absolut (tidak ada tombol tutup atau address bar).
- `--autoplay-policy=no-user-gesture-required`: **Sangat penting**. Mengizinkan video memutar secara otomatis (*muted autoplay*) tanpa memerlukan klik mouse pertama.
- `--noerrdialogs`: Mencegah munculnya pop-up *"Chrome did not shut down correctly. Restore pages?"* saat komputer mati mendadak karena listrik padam.
- `--disable-infobars`: Menyembunyikan bar peringatan peramban.
- `--disable-pinch`: Menonaktifkan gesture zoom jika layar mendukung sentuhan.

---

## 2. Skrip Otomatisasi Booting (Windows)

Buat berkas skrip batch bernama `start-videotron.bat` di direktori yang aman (misalnya `C:\Videotron\start-videotron.bat`):

```batch
@echo off
title Videotron Bappeda Auto-Launcher
echo Menunggu sistem jaringan dan layanan siap...
timeout /t 10 /nobreak >nul

:: Cek apakah server Next.js lokal atau URL produksi yang digunakan
set DISPLAY_URL=http://localhost:3000/display

echo Membuka Layar Kiosk Videotron...
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk "%DISPLAY_URL%" --noerrdialogs --disable-infobars --disable-translate --autoplay-policy=no-user-gesture-required

exit
```

---

## 3. Konfigurasi Auto-Start Saat Komputer Dinyalakan

### Langkah A: Konfigurasi Windows Auto-Login
Agar komputer tidak tertahan di layar login kata sandi saat dinyalakan:
1. Tekan `Win + R`, ketik `netplwiz`, lalu tekan Enter.
2. Hapus centang pada opsi *"Users must enter a user name and password to use this computer"*.
3. Klik *Apply*, lalu masukkan kredensial akun pengguna Windows tersebut.
*(Atau gunakan utilitas resmi Microsoft Sysinternals `Autologon.exe`)*.

### Langkah B: Masukkan Skrip ke Startup Windows
1. Tekan `Win + R`, ketik `shell:startup`, lalu tekan Enter.
2. Buat *Shortcut* dari berkas `start-videotron.bat` ke dalam folder Startup ini.

### Langkah C: Auto Power On (BIOS / UEFI)
Agar PC mini menyala secara otomatis ketika aliran listrik kantor menyala kembali setelah mati lampu:
1. Masuk ke menu BIOS/UEFI saat PC booting (biasanya tombol `Del` atau `F2`).
2. Masuk ke menu **Power Management** / **Chipset Settings**.
3. Cari pengaturan **AC Power Loss** / **Restore on AC Power Loss** / **State After Power Failure**.
4. Ubah nilainya menjadi **Power On** (atau **Always On**).

---

## 4. Pengaturan Sistem Windows untuk Operasional 24/7

Pastikan sistem operasi tidak mematikan monitor atau masuk ke mode tidur (*Sleep*):

1. **Power & Sleep**:
   - Buka *Settings > System > Power & Sleep*.
   - *Screen*: Setel ke **Never**.
   - *Sleep*: Setel ke **Never**.
2. **Screen Saver**:
   - Cari *Change Screen Saver* di menu Start, pastikan diatur ke **(None)**.
3. **Pembaruan Windows (Windows Update)**:
   - Atur *Active Hours* di *Settings > Windows Update > Advanced Options* menjadi jam operasional kerja (misalnya 06:00 – 19:00) agar komputer tidak melakukan restart pembaruan otomatis di jam pelayanan masyarakat.
4. **Sembunyikan Kursor Mouse**:
   - Pasang utilitas gratis seperti `AutoHideMouseCursor` jika kursor mouse tidak hilang secara otomatis.

---

## 5. Mekanisme Ketahanan 24/7 di Aplikasi

Aplikasi Layar Videotron Bappeda telah dilengkapi dengan pengamanan ketahanan bawaan:

1. **Midnight Memory Purge & Date Rollover (`useMidnightRefresh`)**:
   - Pada pukul 00:00 (tengah malam) waktu Kota Dumai (`Asia/Jakarta`), aplikasi secara otomatis mendeteksi pergantian tanggal kalender dan memuat ulang halaman secara bersih.
   - Ini menyegarkan memori peramban (*garbage collection*), memperbarui perhitungan jadwal sholat untuk hari yang baru, serta menyaring agenda kegiatan hari ini.
2. **Toleransi Media Rusak (Broken URL Resilience)**:
   - **Video**: Jika URL berkas video gagal diakses (404 / koneksi terputus), sistem secara otomatis melewatinya (*skip*) dan memutar video berikutnya dalam daftar putar. Jika seluruh video gagal, sistem masuk ke mode cooldown 30 detik untuk mencoba kembali saat koneksi pulih, tanpa membuat layar macet.
   - **Promo**: Jika gambar promosi rusak, gambar tersebut disembunyikan dan sistem tetap menampilkan spanduk yang valid atau gambar default. Terdapat cooldown retry 60 detik saat koneksi internet pulih.
   - **PANDU**: QR Code dan Logo memiliki fallback visual mandiri sehingga tidak pernah menampilkan ikon gambar silang/pecah di layar.
3. **Penanganan Jaringan Terputus & Pemulihan Cepat**:
   - Menggunakan 3 lapisan fallback data: **SWR Live Data -> In-Memory State -> LocalStorage Cache**.
   - Jika koneksi internet terputus, layar tidak akan pernah blank putih, melainkan tetap menampilkan data terakhir yang berhasil disimpan.
   - Saat koneksi internet kembali online, event `window.online` akan langsung memicu pengambilan data ulang secara otomatis.
