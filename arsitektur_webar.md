# Dokumen Arsitektur Teknis WebAR - Gelombang Elektromagnetik
**Fase:** Langkah 1 - Pengumpulan dan Desain Marker (Image Tracking)
**Platform Target:** Antigravity WebAR (Berbasis MindAR / A-Frame)

Dokumen ini merupakan acuan resmi bagi tim Frontend/Web Developer dalam mengonfigurasi mesin pelacakan Augmented Reality di peramban (browser). Harap ikuti standarisasi di bawah ini dengan teliti.

---

## 1. Standarisasi dan Optimasi Aset Marker (Pre-Processing)

Sebelum gambar marker diunggah ke *Target Manager*, pastikan aset mematuhi spesifikasi berikut untuk mengoptimalkan pembacaan *Computer Vision* (CV) dan mencegah *jitter* (getaran) saat rendering 3D.

- **Format & Resolusi**: 
  - Gunakan **PNG** (tanpa alpha channel/transparansi) atau **JPG** berkualitas tinggi.
  - Resolusi minimal **1024x1024 piksel**.
  - **300 DPI** untuk menjamin sinkronisasi dengan hasil cetakan fisik (LKPD).
- **Asimetri & Kontras**: 
  - Pastikan rasio kontras tinggi antara garis hitam pekat, *fiducial markers* (batas sudut), dan warna latar. Algoritma mengubah citra menjadi *grayscale*.
  - **DILARANG** menggunakan pola yang berulang secara simetris sempurna untuk mencegah mesin pelacak mengalami kebingungan orientasi.
- **Bounding Box**: 
  - Tetapkan rasio aspek statis (misalnya 1:1 atau 4:3).
  - Sediakan *padding* (ruang kosong) putih di luar garis tepi hitam sebesar **10-15%** (*quiet zone*) agar kamera dapat dengan mudah mendeteksi batas marker.

---

## 2. Registrasi Database dan Pemetaan Index (Target Manager)

Kompilasi ke-10 marker ke dalam database image tracking Antigravity. File output (misal: `targets.mind` atau `targets.patt`) akan memuat array marker.

### Pemetaan Index Array (0-9)
Routing pemuatan aset 3D harus mematuhi ID Index Array berikut secara ketat:

**Kategori Dasar Gelombang:**
- `Index 0` : Gelombang Transversal
- `Index 1` : Gelombang Longitudinal
- `Index 2` : Rapatan dan Renggangan

**Kategori Sifat & Prinsip Gelombang (Cahaya & Bunyi):**
- `Index 3` : Polarisasi
- `Index 4` : Interferensi Konstruktif
- `Index 5` : Interferensi Destruktif
- `Index 6` : Interferensi Celah Ganda

**Kategori Aplikasi Teknologi:**
- `Index 7` : Seismograf
- `Index 8` : Ultrasonografi (USG)
- `Index 9` : Kereta Maglev

> [!WARNING]
> **Validasi Output:** Pastikan setiap marker mendapatkan **Tracking Rating minimal 4 dari 5 bintang** di dasbor Antigravity. Jika rating di bawah 4, tolak dan kembalikan kepada desainer UI/UX untuk direvisi.

---

## 3. Inisialisasi Environment WebAR (Arsitektur Frontend)

Aplikasi dibangun di atas fondasi WebGL menggunakan **Three.js** / **A-Frame** yang didukung platform Antigravity.

- **Protokol Keamanan**: WebAR wajib berjalan di atas **HTTPS** untuk membuka akses API Kamera (`navigator.mediaDevices.getUserMedia`). (Gunakan sertifikat lokal saat pengembangan).
- **Manajemen Izin (Permission Handling)**:
  - Buat transisi UI/UX asinkron yang memicu prompt izin akses saat user menekan tombol "Mulai AR".
  - Buat *Error Handling Visual* (UI Block) jika user menolak akses kamera atau perangkat tidak memiliki dukungan WebRTC.
- **Asynchronous Loading**:
  - Muat file database marker (`.mind` / `.patt`) secara terpisah di *background* (sebaiknya menggunakan *Web Workers* atau proses asinkron non-blocking) untuk mencegah browser UI *freeze* saat inisialisasi awal.

---

## 4. Logika Pemetaan Event Trigger (Mapping Marker to Asset)

Konfigurasi event listener pada engine untuk mengelola siklus hidup (lifecycle) objek 3D (.gltf / .glb).

- **`targetFound` Event**: 
  - Dipicu saat pola dikenali. (Misal: Kamera mendeteksi Index 7, panggil fungsi render model 3D Seismograf).
  - Jalankan animasi *looping* HANYA ketika objek 3D sudah di-*load* dan terlihat penuh.
- **`targetLost` Event**: 
  - Gunakan *timeout delay* **500ms - 1000ms** sebelum menyembunyikan/menghancurkan aset 3D. Ini merupakan teknik *debounce* untuk mencegah objek berkedip (*flickering*) jika tangan pengguna gemetar.
- **State Management**:
  - Hanya **SATU** scene animasi kompleks yang boleh aktif secara bersamaan.
  - Jika 2 marker terdeteksi bersamaan (misal Index 4 dan 5), matikan animasi pada marker dengan *confidence score* lebih rendah untuk menghemat memori (*mobile optimization*).

---

## 5. UI Overlay dan Interaksi Data

Lapis UI HTML/CSS berada di atas kanvas WebGL dengan Z-Index yang lebih tinggi.

- **Infografis Pop-up**:
  - Munculkan toast/pop-up sementara saat `targetFound` terpicu. Contoh teks: *"Sistem mendeteksi model Ultrasonografi (USG) - Menginisiasi simulasi..."*
- **Persiapan DOM (Placeholder Tahap 2)**:
  - Sediakan area *container* kosong pada DOM untuk injeksi kontrol interaktif (Slider Range Input, dsb.).
  - Kontrol ini (pada tahap 2) akan mengontrol besaran fisika (Frekuensi, Amplitudo) secara *real-time binding* terhadap variabel animasi 3D.

---
*Dokumen ini merupakan standar baku dari arsitektur frontend proyek ini. Segala bentuk implementasi kode wajib merujuk pada standar yang ditetapkan di sini.*
