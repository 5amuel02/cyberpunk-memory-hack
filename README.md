# Hacker Training Hub // CYBERSEC SIMULATOR

🎮 **[PLAY LIVE DEMO HERE / MAINKAN SEKARANG](https://5amuel02.github.io/cyberpunk-memory-hack/)** 🎮

Platform mini-game interaktif berbasis web untuk melatih kemampuan komputasi dasar dengan balutan tema visual *Cyberpunk Hacker*. Sistem ini dibangun menggunakan arsitektur Single Page Application (SPA) murni dengan HTML, CSS, dan JavaScript tanpa framework tambahan.

## 🚀 Modul Pelatihan Saat Ini

### 1. MODULE 01: MEMORY BREACH
Uji ingatan jangka pendek visual Anda. 
* Tugas Anda adalah menemukan 8 pasang ikon teknologi tersembunyi (SVG) sebelum *Trace Timer* habis.
* **Fitur**: Sistem Level. Semakin tinggi levelnya, semakin singkat waktu yang diberikan untuk meretas (dikurangi 10 detik per level). Salah menebak akan mengurangi 2 detik.

### 2. MODULE 02: LOGIC OVERRIDE
Uji pemahaman Anda tentang aljabar Boolean dan gerbang logika komputer (Logic Gates).
* Anda akan diberikan input A (misal: 1), input B (misal: 0), dan nilai Target Output (misal: 1).
* Tugas Anda adalah memilih jenis Gerbang Logika yang benar (`AND`, `OR`, `XOR`, `NAND`, atau `NOR`) agar input menghasilkan output target.
* **Fitur**: 5 Tahapan berturut-turut (Stage) dengan batas waktu total 60 detik. Jawaban salah memberikan penalti 5 detik waktu dan mengakibatkan gangguan sistem (Screen Glitch).

## 🎛️ Fitur Sistem Tambahan
* **Sound Synthesizer (Web Audio API)**: Efek suara *retro* di-generate murni menggunakan fungsi frekuensi osilator JS untuk *immersion* yang maksimal (suara bleep, dengungan salah, dll).
* **Animasi CSS**: Menggunakan 3D Transform CSS untuk putaran kartu memori, keyframes untuk *Screen Glitch*, dan font berefek *Scanlines* CRT.

## 🎮 Cara Bermain
1. Buka file `index.html` menggunakan browser modern (Chrome/Edge/Firefox).
2. Klik tombol `INITIALIZE_SYSTEM` (untuk memberikan izin Web Audio API di browser).
3. Anda akan masuk ke Menu Utama. Silakan pilih modul simulasi mana yang ingin Anda latih.
4. Nikmati sensasi menjadi seorang peretas!
