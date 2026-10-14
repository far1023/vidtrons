/**
 * All UI text for the display and admin (Indonesian).
 * No text literals in markup: components read from here.
 */
export const labels = {
  halaman: {
    judul: "Layar Informasi Lobby Bappeda",
    deskripsi: "Layar informasi digital lobby Bappeda",
  },
  header: {
    nama: "Nama Instansi",
    slogan: "Slogan",
    logo: "Logo instansi",
  },
  waktu: {
    judul: "Waktu",
    hari: "Hari",
    tanggal: "Tanggal",
    jam: "--:--",
    cuaca: "Cuaca",
    sholat: "Jadwal Sholat",
  },
  sholat: {
    subuh: "Subuh",
    dzuhur: "Dzuhur",
    ashar: "Ashar",
    maghrib: "Maghrib",
    isya: "Isya",
    azan: "Memasuki waktu solat",
    menjelang: "Menjelang Azan",
    sedangAzan: "Memasuki waktu solat",
  },
  promo: {
    judul: "Promo",
  },
  video: {
    judul: "Video",
  },
  pengumuman: {
    judul: "Pengumuman",
    kosong: "Belum ada pengumuman aktif saat ini",
  },
  agenda: {
    judul: "Agenda Kegiatan",
    kosong: "Tidak ada agenda untuk 7 hari ke depan",
  },
  runningText: {
    placeholder: "Informasi berjalan",
    pemisah: "•",
  },
} as const
