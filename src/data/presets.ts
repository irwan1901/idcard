import { CardTemplate } from '../types/card';

export const CARD_PRESETS: CardTemplate[] = [
  {
    id: 'preset-koperasi',
    name: 'Kartu Anggota Koperasi',
    category: 'koperasi',
    description: 'Kartu anggota koperasi simpan pinjam / serba usaha dengan lambang, chip EMV, QR verifikasi, dan ketentuan belakang.',
    orientation: 'landscape',
    dimensions: {
      width: 640,
      height: 400
    },
    fieldMappings: {
      nomor: 'Nomor_Anggota',
      nama: 'Nama_Lengkap',
      tipe: 'Jenis_Keanggotaan',
      tgl: 'Tanggal_Gabung',
      cabang: 'Cabang',
      status: 'Status',
      foto: 'Foto_URL',
      qr: 'QR_Verifikasi'
    },
    front: {
      background: {
        type: 'gradient',
        gradient: {
          from: '#064e3b', // deep emerald
          to: '#022c22',
          direction: 'to-br'
        },
        pattern: 'security',
        patternOpacity: 0.15
      },
      elements: [
        // Top golden accent bar
        {
          id: 'kop-accent-1',
          type: 'shape',
          name: 'Aksen Garis Emas',
          x: 0,
          y: 0,
          width: 100,
          height: 1.5,
          fillColor: '#f59e0b',
          zIndex: 1
        },
        // Logo / Emblem
        {
          id: 'kop-logo',
          type: 'logo',
          name: 'Emblem Koperasi',
          x: 5,
          y: 6,
          width: 9,
          height: 14,
          zIndex: 3
        },
        // Header Title
        {
          id: 'kop-head-1',
          type: 'text',
          name: 'Nama Koperasi',
          x: 16,
          y: 6,
          width: 78,
          height: 7,
          text: 'KOPERASI SIMPAN PINJAM MAKMUR MANDIRI',
          fontFamily: 'Outfit',
          fontSize: 15,
          fontWeight: '700',
          color: '#fef08a',
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          zIndex: 3
        },
        // Subtitle
        {
          id: 'kop-head-2',
          type: 'text',
          name: 'Badan Hukum',
          x: 16,
          y: 13,
          width: 78,
          height: 5,
          text: 'BH NO: 518/BH/KOP/DKUKM/2018 • WILAYAH PROVINSI',
          fontFamily: 'Plus Jakarta Sans',
          fontSize: 9,
          fontWeight: '500',
          color: '#a7f3d0',
          letterSpacing: 0.5,
          zIndex: 3
        },
        // Header Divider
        {
          id: 'kop-div-1',
          type: 'shape',
          name: 'Pemisah Header',
          x: 5,
          y: 20,
          width: 90,
          height: 0.5,
          fillColor: '#059669',
          zIndex: 2
        },
        // Member Photo
        {
          id: 'kop-photo',
          type: 'photo',
          name: 'Foto Anggota',
          x: 6,
          y: 27,
          width: 26,
          height: 48,
          photoShape: 'rounded',
          borderWidth: 2,
          borderColor: '#f59e0b',
          dynamicField: 'Foto_URL',
          zIndex: 4
        },
        // Chip
        {
          id: 'kop-chip',
          type: 'chip',
          name: 'Smart Chip EMV',
          x: 35,
          y: 28,
          width: 8,
          height: 10,
          zIndex: 4
        },
        // Badge Status
        {
          id: 'kop-badge',
          type: 'badge',
          name: 'Status Anggota',
          x: 46,
          y: 28,
          width: 25,
          height: 6,
          badgeText: 'ANGGOTA AKTIF',
          badgeBgColor: '#059669',
          badgeTextColor: '#ecfdf5',
          dynamicField: 'Status',
          zIndex: 4
        },
        // Field: Nomor Anggota
        {
          id: 'kop-nomor-lbl',
          type: 'text',
          name: 'Label Nomor',
          x: 35,
          y: 42,
          width: 45,
          height: 4,
          text: 'NOMOR ANGGOTA',
          fontFamily: 'Plus Jakarta Sans',
          fontSize: 8,
          fontWeight: '600',
          color: '#6ee7b7',
          zIndex: 3
        },
        {
          id: 'kop-nomor-val',
          type: 'text',
          name: 'Nilai Nomor',
          x: 35,
          y: 46,
          width: 45,
          height: 6,
          text: 'KOP-2024-0012',
          dynamicField: 'Nomor_Anggota',
          fontFamily: 'Fira Code',
          fontSize: 14,
          fontWeight: '700',
          color: '#ffffff',
          letterSpacing: 1,
          zIndex: 4
        },
        // Field: Nama
        {
          id: 'kop-nama-lbl',
          type: 'text',
          name: 'Label Nama',
          x: 35,
          y: 54,
          width: 45,
          height: 4,
          text: 'NAMA LENGKAP',
          fontFamily: 'Plus Jakarta Sans',
          fontSize: 8,
          fontWeight: '600',
          color: '#6ee7b7',
          zIndex: 3
        },
        {
          id: 'kop-nama-val',
          type: 'text',
          name: 'Nilai Nama',
          x: 35,
          y: 58,
          width: 45,
          height: 6,
          text: 'Bambang Supriyanto',
          dynamicField: 'Nama_Lengkap',
          fontFamily: 'Outfit',
          fontSize: 13,
          fontWeight: '700',
          color: '#fef08a',
          zIndex: 4
        },
        // Field: Cabang / Tipe
        {
          id: 'kop-info-val',
          type: 'text',
          name: 'Cabang & Tanggal',
          x: 35,
          y: 67,
          width: 45,
          height: 5,
          text: 'Anggota Utama • Cabang Jakarta Selatan',
          dynamicField: 'Cabang',
          fontFamily: 'Plus Jakarta Sans',
          fontSize: 9,
          fontWeight: '500',
          color: '#cbd5e1',
          zIndex: 3
        },
        // QR Code
        {
          id: 'kop-qr',
          type: 'qr',
          name: 'QR Otentikasi',
          x: 82,
          y: 53,
          width: 13,
          height: 22,
          dynamicField: 'QR_Verifikasi',
          codeData: 'https://koperasi.id/verify/KOP-2024-0012',
          zIndex: 4
        },
        // Hologram sticker
        {
          id: 'kop-holo',
          type: 'hologram',
          name: 'Hologram Keamanan',
          x: 83,
          y: 28,
          width: 10,
          height: 12,
          zIndex: 4
        },
        // Bottom ribbon
        {
          id: 'kop-foot-txt',
          type: 'text',
          name: 'Footer Teks',
          x: 5,
          y: 89,
          width: 90,
          height: 5,
          text: 'KARTU IDENTITAS RESMI ANGGOTA • DILINDUNGI HAK CIPTA',
          fontFamily: 'Plus Jakarta Sans',
          fontSize: 8,
          fontWeight: '600',
          textAlign: 'center',
          color: '#94a3b8',
          letterSpacing: 1,
          zIndex: 3
        }
      ]
    },
    back: {
      background: {
        type: 'gradient',
        gradient: {
          from: '#022c22',
          to: '#0f172a',
          direction: 'to-br'
        },
        pattern: 'dots',
        patternOpacity: 0.1
      },
      elements: [
        // Magnetic stripe
        {
          id: 'kop-mag-stripe',
          type: 'shape',
          name: 'Pita Magnetik',
          x: 0,
          y: 8,
          width: 100,
          height: 14,
          fillColor: '#0f172a',
          zIndex: 2
        },
        // Terms Header
        {
          id: 'kop-back-title',
          type: 'text',
          name: 'Judul Ketentuan',
          x: 6,
          y: 27,
          width: 58,
          height: 5,
          text: 'KETENTUAN KARTU ANGGOTA KOPERASI:',
          fontFamily: 'Outfit',
          fontSize: 9,
          fontWeight: '700',
          color: '#f59e0b',
          zIndex: 3
        },
        // Terms items
        {
          id: 'kop-back-t1',
          type: 'text',
          name: 'Aturan 1',
          x: 6,
          y: 33,
          width: 58,
          height: 14,
          text: '1. Kartu ini milik KSP Makmur Mandiri dan tidak boleh dipindahtangankan.\n2. Wajib dibawa saat RAT, simpan pinjam, dan transaksi usaha koperasi.\n3. Jika menemukan kartu ini harap kembalikan ke kantor cabang terdekat.',
          fontFamily: 'Plus Jakarta Sans',
          fontSize: 8,
          color: '#cbd5e1',
          zIndex: 3
        },
        // Office address
        {
          id: 'kop-back-addr',
          type: 'text',
          name: 'Alamat Kantor',
          x: 6,
          y: 50,
          width: 58,
          height: 10,
          text: 'Sekretariat: Gedung Koperasi Lt. 2, Jl. Jenderal Sudirman No. 88, Jakarta Selatan\nCall Center: (021) 7890-1234 | www.koperasimakmur.id',
          fontFamily: 'Plus Jakarta Sans',
          fontSize: 7.5,
          color: '#94a3b8',
          zIndex: 3
        },
        // Barcode at bottom left
        {
          id: 'kop-back-bar',
          type: 'barcode',
          name: 'Barcode Kartu',
          x: 6,
          y: 65,
          width: 48,
          height: 18,
          dynamicField: 'Nomor_Anggota',
          codeData: 'KOP-2024-0012',
          zIndex: 3
        },
        // Official Stamp
        {
          id: 'kop-back-stamp',
          type: 'stamp',
          name: 'Stempel Resmi',
          x: 68,
          y: 38,
          width: 14,
          height: 22,
          stampText: 'KSP MAKMUR MANDIRI',
          stampColor: '#dc2626',
          zIndex: 4
        },
        // Signature Line
        {
          id: 'kop-back-sign',
          type: 'signature',
          name: 'Tanda Tangan Ketua',
          x: 68,
          y: 50,
          width: 25,
          height: 20,
          signerName: 'H. Sudirman, M.M.',
          signerTitle: 'Ketua Pengurus Koperasi',
          zIndex: 3
        }
      ]
    }
  },
  {
    id: 'preset-pelajar',
    name: 'Kartu Tanda Pelajar',
    category: 'pelajar',
    description: 'Kartu identitas siswa/pelajar portrait dengan NISN, jurusan, barcode perpustakaan, lanyard hole, dan cap stempel kepala sekolah.',
    orientation: 'portrait',
    dimensions: {
      width: 400,
      height: 640
    },
    fieldMappings: {
      nisn: 'NISN',
      nama: 'Nama_Siswa',
      jurusan: 'Kelas_Jurusan',
      tahun: 'Tahun_Ajaran',
      darah: 'Golongan_Darah',
      tgl: 'Tanggal_Lahir',
      foto: 'Foto_Siswa',
      barcode: 'Barcode_ID'
    },
    front: {
      background: {
        type: 'gradient',
        gradient: {
          from: '#1e3a8a', // royal navy
          to: '#0f172a',
          direction: 'to-b'
        },
        pattern: 'dots',
        patternOpacity: 0.12
      },
      hasLanyardSlot: true,
      elements: [
        // Lanyard Punch Slot Indicator
        {
          id: 'pel-slot',
          type: 'slot',
          name: 'Lubang Tali Lanyard',
          x: 42,
          y: 2,
          width: 16,
          height: 3,
          zIndex: 5
        },
        // School Crest
        {
          id: 'pel-crest',
          type: 'logo',
          name: 'Logo Sekolah',
          x: 42,
          y: 8,
          width: 16,
          height: 10,
          zIndex: 3
        },
        // School Name Header
        {
          id: 'pel-school-1',
          type: 'text',
          name: 'Titel Kartu',
          x: 5,
          y: 19,
          width: 90,
          height: 3.5,
          text: 'KARTU TANDA PELAJAR',
          fontFamily: 'Outfit',
          fontSize: 14,
          fontWeight: '800',
          textAlign: 'center',
          color: '#60a5fa',
          letterSpacing: 1.5,
          zIndex: 3
        },
        {
          id: 'pel-school-2',
          type: 'text',
          name: 'Nama Sekolah',
          x: 5,
          y: 23,
          width: 90,
          height: 3.5,
          text: 'SMK NEGERI 1 INOVASI DIGITAL',
          fontFamily: 'Plus Jakarta Sans',
          fontSize: 11,
          fontWeight: '700',
          textAlign: 'center',
          color: '#ffffff',
          letterSpacing: 0.5,
          zIndex: 3
        },
        // Photo
        {
          id: 'pel-photo',
          type: 'photo',
          name: 'Pas Foto Siswa',
          x: 29,
          y: 29,
          width: 42,
          height: 31,
          photoShape: 'rounded',
          borderWidth: 3,
          borderColor: '#3b82f6',
          dynamicField: 'Foto_Siswa',
          zIndex: 4
        },
        // Security Hologram
        {
          id: 'pel-holo',
          type: 'hologram',
          name: 'Stiker Hologram',
          x: 62,
          y: 53,
          width: 12,
          height: 7,
          zIndex: 5
        },
        // Student Name
        {
          id: 'pel-name',
          type: 'text',
          name: 'Nama Siswa',
          x: 5,
          y: 62,
          width: 90,
          height: 5,
          text: 'Ahmad Faiz Fadlillah',
          dynamicField: 'Nama_Siswa',
          fontFamily: 'Outfit',
          fontSize: 16,
          fontWeight: '700',
          textAlign: 'center',
          color: '#ffffff',
          zIndex: 4
        },
        // NISN
        {
          id: 'pel-nisn',
          type: 'text',
          name: 'NISN Siswa',
          x: 5,
          y: 67.5,
          width: 90,
          height: 3.5,
          text: 'NISN: 0068492011',
          dynamicField: 'NISN',
          fontFamily: 'Fira Code',
          fontSize: 12,
          fontWeight: '600',
          textAlign: 'center',
          color: '#93c5fd',
          zIndex: 4
        },
        // Major / Class Pill
        {
          id: 'pel-jurusan',
          type: 'badge',
          name: 'Jurusan / Kelas',
          x: 15,
          y: 72.5,
          width: 70,
          height: 4.5,
          badgeText: 'XII Rekayasa Perangkat Lunak 1',
          badgeBgColor: '#1d4ed8',
          badgeTextColor: '#ffffff',
          dynamicField: 'Kelas_Jurusan',
          zIndex: 4
        },
        // Academic year & Blood type
        {
          id: 'pel-extra-info',
          type: 'text',
          name: 'Tahun Ajaran & Gol. Darah',
          x: 5,
          y: 78.5,
          width: 90,
          height: 3.5,
          text: 'T.A 2025/2026 • Gol. Darah: O',
          fontFamily: 'Plus Jakarta Sans',
          fontSize: 9,
          textAlign: 'center',
          color: '#cbd5e1',
          zIndex: 3
        },
        // Barcode for Library & Attendance
        {
          id: 'pel-barcode',
          type: 'barcode',
          name: 'Barcode Siswa',
          x: 10,
          y: 83.5,
          width: 80,
          height: 12,
          dynamicField: 'Barcode_ID',
          codeData: '0068492011',
          zIndex: 4
        }
      ]
    },
    back: {
      background: {
        type: 'gradient',
        gradient: {
          from: '#0f172a',
          to: '#1e293b',
          direction: 'to-b'
        },
        pattern: 'security',
        patternOpacity: 0.1
      },
      hasLanyardSlot: true,
      elements: [
        {
          id: 'pel-b-slot',
          type: 'slot',
          name: 'Lubang Tali Lanyard',
          x: 42,
          y: 2,
          width: 16,
          height: 3,
          zIndex: 5
        },
        {
          id: 'pel-b-title',
          type: 'text',
          name: 'Titel Tata Tertib',
          x: 5,
          y: 9,
          width: 90,
          height: 4,
          text: 'TATA TERTIB PENGGUNAAN KARTU',
          fontFamily: 'Outfit',
          fontSize: 11,
          fontWeight: '700',
          textAlign: 'center',
          color: '#60a5fa',
          letterSpacing: 0.8,
          zIndex: 3
        },
        {
          id: 'pel-b-rules',
          type: 'text',
          name: 'Isi Peraturan',
          x: 8,
          y: 15,
          width: 84,
          height: 32,
          text: '1. Kartu ini sah digunakan sebagai bukti identitas resmi siswa di lingkungan sekolah.\n2. Wajib dibawa setiap hari dan digunakan saat presensi serta peminjaman buku perpustakaan.\n3. Dilarang mencoret, merusak, atau meminjamkan kartu ini kepada pihak lain.\n4. Apabila kartu hilang, segera laporkan ke bagian Tata Usaha Sekolah.',
          fontFamily: 'Plus Jakarta Sans',
          fontSize: 8.5,
          color: '#cbd5e1',
          zIndex: 3
        },
        {
          id: 'pel-b-school-addr',
          type: 'text',
          name: 'Alamat Sekolah',
          x: 8,
          y: 49,
          width: 84,
          height: 8,
          text: 'Jl. Pendidikan Mandiri No. 12, Kota Bandung • Telp (022) 87654321\nWebsite: smkn1inovasi.sch.id',
          fontFamily: 'Plus Jakarta Sans',
          fontSize: 8,
          textAlign: 'center',
          color: '#94a3b8',
          zIndex: 3
        },
        // Headmaster Signature & Stamp
        {
          id: 'pel-b-stamp',
          type: 'stamp',
          name: 'Stempel Sekolah',
          x: 25,
          y: 60,
          width: 20,
          height: 14,
          stampText: 'SMKN 1 INOVASI',
          stampColor: '#2563eb',
          zIndex: 4
        },
        {
          id: 'pel-b-sign',
          type: 'signature',
          name: 'TTD Kepala Sekolah',
          x: 20,
          y: 65,
          width: 60,
          height: 18,
          signerName: 'Drs. H. Mulyadi, M.Pd.',
          signerTitle: 'NIP. 19740512 199903 1 002',
          zIndex: 3
        },
        // QR Code for digital student card verification
        {
          id: 'pel-b-qr',
          type: 'qr',
          name: 'QR Verifikasi',
          x: 37.5,
          y: 84,
          width: 25,
          height: 13,
          codeData: 'https://smkn1inovasi.sch.id/verify/0068492011',
          zIndex: 4
        }
      ]
    }
  },
  {
    id: 'preset-pegawai',
    name: 'Kartu Identitas Pegawai',
    category: 'pegawai',
    description: 'Corporate ID Card modern untuk karyawan kantor/BUMN dengan chip cerdas RFID, tingkat akses keamanan, NIP, dan gate QR pass.',
    orientation: 'portrait',
    dimensions: {
      width: 400,
      height: 640
    },
    fieldMappings: {
      nip: 'NIP',
      nama: 'Nama_Pegawai',
      jabatan: 'Jabatan',
      divisi: 'Divisi',
      email: 'Email_Kantor',
      akses: 'Akses_Level',
      masa: 'Masa_Berlaku',
      foto: 'Foto_Pegawai',
      qr: 'QR_Pass'
    },
    front: {
      background: {
        type: 'gradient',
        gradient: {
          from: '#0f172a',
          to: '#1e1b4b',
          direction: 'to-b'
        },
        pattern: 'grid',
        patternOpacity: 0.12
      },
      hasLanyardSlot: true,
      elements: [
        {
          id: 'peg-slot',
          type: 'slot',
          name: 'Slot Lanyard',
          x: 42,
          y: 2,
          width: 16,
          height: 3,
          zIndex: 5
        },
        // Company Brand
        {
          id: 'peg-logo',
          type: 'logo',
          name: 'Logo Perusahaan',
          x: 8,
          y: 7,
          width: 14,
          height: 8,
          zIndex: 3
        },
        {
          id: 'peg-company',
          type: 'text',
          name: 'Nama Perusahaan',
          x: 24,
          y: 7.5,
          width: 68,
          height: 4,
          text: 'PT NUSANTARA DIGITAL TECH',
          fontFamily: 'Outfit',
          fontSize: 12,
          fontWeight: '800',
          color: '#e2e8f0',
          letterSpacing: 1,
          zIndex: 3
        },
        {
          id: 'peg-sub',
          type: 'text',
          name: 'Sub-brand',
          x: 24,
          y: 11.5,
          width: 68,
          height: 3,
          text: 'OFFICIAL EMPLOYEE IDENTITY PASS',
          fontFamily: 'Plus Jakarta Sans',
          fontSize: 7.5,
          fontWeight: '600',
          color: '#818cf8',
          letterSpacing: 0.8,
          zIndex: 3
        },
        // Smart Chip EMV
        {
          id: 'peg-chip',
          type: 'chip',
          name: 'EMV RFID Chip',
          x: 8,
          y: 19,
          width: 12,
          height: 7,
          zIndex: 4
        },
        // Access Level Pill
        {
          id: 'peg-badge-access',
          type: 'badge',
          name: 'Level Akses',
          x: 45,
          y: 20,
          width: 47,
          height: 4.5,
          badgeText: 'LEVEL 4 - RESTRICTED',
          badgeBgColor: '#4338ca',
          badgeTextColor: '#e0e7ff',
          dynamicField: 'Akses_Level',
          zIndex: 4
        },
        // Employee Photo
        {
          id: 'peg-photo',
          type: 'photo',
          name: 'Foto Karyawan',
          x: 25,
          y: 28,
          width: 50,
          height: 33,
          photoShape: 'rounded',
          borderWidth: 3,
          borderColor: '#6366f1',
          dynamicField: 'Foto_Pegawai',
          zIndex: 4
        },
        // Hologram Security
        {
          id: 'peg-holo',
          type: 'hologram',
          name: 'Security Hologram',
          x: 65,
          y: 54,
          width: 12,
          height: 6,
          zIndex: 5
        },
        // Employee Name
        {
          id: 'peg-name',
          type: 'text',
          name: 'Nama Karyawan',
          x: 5,
          y: 63,
          width: 90,
          height: 5,
          text: 'Raden Arya Wibowo',
          dynamicField: 'Nama_Pegawai',
          fontFamily: 'Outfit',
          fontSize: 16,
          fontWeight: '700',
          textAlign: 'center',
          color: '#ffffff',
          zIndex: 4
        },
        // Job Title
        {
          id: 'peg-title',
          type: 'text',
          name: 'Jabatan Karyawan',
          x: 5,
          y: 68.5,
          width: 90,
          height: 4,
          text: 'Lead Cloud Infrastructure Architect',
          dynamicField: 'Jabatan',
          fontFamily: 'Plus Jakarta Sans',
          fontSize: 10.5,
          fontWeight: '600',
          textAlign: 'center',
          color: '#a5b4fc',
          zIndex: 4
        },
        // Division / Department
        {
          id: 'peg-div',
          type: 'text',
          name: 'Divisi',
          x: 5,
          y: 73,
          width: 90,
          height: 3.5,
          text: 'DevOps & Reliability Division',
          dynamicField: 'Divisi',
          fontFamily: 'Plus Jakarta Sans',
          fontSize: 9,
          textAlign: 'center',
          color: '#94a3b8',
          zIndex: 3
        },
        // NIP
        {
          id: 'peg-nip',
          type: 'text',
          name: 'NIP Karyawan',
          x: 5,
          y: 77.5,
          width: 90,
          height: 4,
          text: 'NIP: EMP-9028-ID',
          dynamicField: 'NIP',
          fontFamily: 'Fira Code',
          fontSize: 11,
          fontWeight: '600',
          textAlign: 'center',
          color: '#cbd5e1',
          zIndex: 4
        },
        // QR Code for Turnstile / Gate
        {
          id: 'peg-qr',
          type: 'qr',
          name: 'Gate Pass QR',
          x: 37,
          y: 83,
          width: 26,
          height: 14,
          dynamicField: 'QR_Pass',
          codeData: 'GATE-ID-EMP9028-SECURE-LVL4',
          zIndex: 4
        }
      ]
    },
    back: {
      background: {
        type: 'gradient',
        gradient: {
          from: '#1e1b4b',
          to: '#020617',
          direction: 'to-b'
        },
        pattern: 'dots',
        patternOpacity: 0.1
      },
      hasLanyardSlot: true,
      elements: [
        {
          id: 'peg-b-slot',
          type: 'slot',
          name: 'Slot Lanyard',
          x: 42,
          y: 2,
          width: 16,
          height: 3,
          zIndex: 5
        },
        {
          id: 'peg-b-terms',
          type: 'text',
          name: 'Kebijakan Perusahaan',
          x: 8,
          y: 12,
          width: 84,
          height: 30,
          text: 'KEBIJAKAN PENGGUNAAN:\n1. Kartu ini adalah tanda pengenal resmi pegawai dan properti PT Nusantara Digital Tech.\n2. Wajib dikenakan di seluruh area kerja kantor dan pusat data.\n3. Penemuan kartu ini dapat dikembalikan ke HR Department atau hubungi +62 21 5566 7788.\n4. Segala penyalahgunaan kartu akses akan diproses hukum.',
          fontFamily: 'Plus Jakarta Sans',
          fontSize: 8.5,
          color: '#cbd5e1',
          zIndex: 3
        },
        {
          id: 'peg-b-emergency',
          type: 'text',
          name: 'Kontak Darurat',
          x: 8,
          y: 44,
          width: 84,
          height: 6,
          text: 'EMERGENCY / BLOOD TYPE:\nBlood Group: O+ | Security Hotline: ext. 911',
          fontFamily: 'Fira Code',
          fontSize: 8,
          color: '#f87171',
          zIndex: 3
        },
        {
          id: 'peg-b-stamp',
          type: 'stamp',
          name: 'Stempel HR',
          x: 20,
          y: 53,
          width: 22,
          height: 14,
          stampText: 'PT NUSANTARA TECH',
          stampColor: '#4f46e5',
          zIndex: 4
        },
        {
          id: 'peg-b-sign',
          type: 'signature',
          name: 'TTD Direktur HR',
          x: 15,
          y: 59,
          width: 70,
          height: 18,
          signerName: 'Ir. Hendrawan Kusuma',
          signerTitle: 'VP People & Culture',
          zIndex: 3
        },
        {
          id: 'peg-b-barcode',
          type: 'barcode',
          name: 'Barcode Pegawai',
          x: 10,
          y: 81,
          width: 80,
          height: 14,
          dynamicField: 'NIP',
          codeData: 'EMP-9028-ID',
          zIndex: 3
        }
      ]
    }
  },
  {
    id: 'preset-developer',
    name: 'Developer Tech Badge',
    category: 'developer',
    description: 'ID Badge futuristik untuk developer, hacker, & tech event dengan PGP key, GitHub link, terminal theme, dan bio tags.',
    orientation: 'landscape',
    dimensions: {
      width: 640,
      height: 400
    },
    fieldMappings: {
      handle: 'Dev_Handle',
      nama: 'Full_Name',
      role: 'Primary_Role',
      stack: 'Tech_Stack',
      pgp: 'PGP_Key_Fingerprint',
      status: 'Status',
      foto: 'Avatar_URL',
      url: 'Web_URL'
    },
    front: {
      background: {
        type: 'gradient',
        gradient: {
          from: '#090d16',
          to: '#111827',
          direction: 'to-br'
        },
        pattern: 'grid',
        patternOpacity: 0.2
      },
      elements: [
        {
          id: 'dev-term-top',
          type: 'text',
          name: 'Terminal Header',
          x: 6,
          y: 6,
          width: 88,
          height: 6,
          text: '// SYSTEM_AUTHORIZATION_TOKEN [NODE_ID: ASIA-ID-01]',
          fontFamily: 'Fira Code',
          fontSize: 9.5,
          color: '#06b6d4',
          zIndex: 3
        },
        {
          id: 'dev-photo',
          type: 'photo',
          name: 'Avatar Developer',
          x: 6,
          y: 20,
          width: 24,
          height: 52,
          photoShape: 'square',
          borderWidth: 2,
          borderColor: '#06b6d4',
          dynamicField: 'Avatar_URL',
          zIndex: 4
        },
        {
          id: 'dev-badge-role',
          type: 'badge',
          name: 'Badge Status',
          x: 34,
          y: 20,
          width: 28,
          height: 6,
          badgeText: 'CORE CONTRIBUTOR',
          badgeBgColor: '#0e7490',
          badgeTextColor: '#ecfeff',
          dynamicField: 'Status',
          zIndex: 4
        },
        {
          id: 'dev-chip',
          type: 'chip',
          name: 'Crypto Chip',
          x: 64,
          y: 20,
          width: 8,
          height: 10,
          zIndex: 4
        },
        {
          id: 'dev-name',
          type: 'text',
          name: 'Nama Lengkap',
          x: 34,
          y: 32,
          width: 45,
          height: 7,
          text: 'Alexander Kevin',
          dynamicField: 'Full_Name',
          fontFamily: 'Syne',
          fontSize: 16,
          fontWeight: '700',
          color: '#ffffff',
          zIndex: 4
        },
        {
          id: 'dev-handle',
          type: 'text',
          name: 'GitHub Handle',
          x: 34,
          y: 40,
          width: 45,
          height: 5,
          text: '@alexander_code',
          dynamicField: 'Dev_Handle',
          fontFamily: 'Fira Code',
          fontSize: 11,
          color: '#38bdf8',
          zIndex: 4
        },
        {
          id: 'dev-role',
          type: 'text',
          name: 'Role Utama',
          x: 34,
          y: 48,
          width: 45,
          height: 5,
          text: 'Fullstack Platform Engineer',
          dynamicField: 'Primary_Role',
          fontFamily: 'Plus Jakarta Sans',
          fontSize: 10,
          color: '#cbd5e1',
          zIndex: 3
        },
        {
          id: 'dev-stack',
          type: 'text',
          name: 'Tech Stack',
          x: 34,
          y: 56,
          width: 45,
          height: 6,
          text: 'React / Next.js / Go / Kubernetes',
          dynamicField: 'Tech_Stack',
          fontFamily: 'Fira Code',
          fontSize: 8.5,
          color: '#a7f3d0',
          zIndex: 3
        },
        {
          id: 'dev-qr',
          type: 'qr',
          name: 'QR Profile',
          x: 81,
          y: 35,
          width: 14,
          height: 25,
          dynamicField: 'Web_URL',
          codeData: 'https://github.com/alexander_code',
          zIndex: 4
        },
        {
          id: 'dev-pgp',
          type: 'text',
          name: 'PGP Fingerprint',
          x: 6,
          y: 84,
          width: 88,
          height: 5,
          text: 'PGP KEY: 4F8A 9E21 C390 BA44 11FE • VERIFIED RSA 4096',
          dynamicField: 'PGP_Key_Fingerprint',
          fontFamily: 'Fira Code',
          fontSize: 8,
          color: '#64748b',
          zIndex: 3
        }
      ]
    },
    back: {
      background: {
        type: 'color',
        color: '#090d16',
        pattern: 'dots',
        patternOpacity: 0.1
      },
      elements: [
        {
          id: 'dev-b-title',
          type: 'text',
          name: 'Title Manifest',
          x: 8,
          y: 12,
          width: 84,
          height: 6,
          text: '// DEVELOPER PRIVILEGES & REPO ACCESS',
          fontFamily: 'Fira Code',
          fontSize: 10,
          fontWeight: '700',
          color: '#38bdf8',
          zIndex: 3
        },
        {
          id: 'dev-b-code',
          type: 'text',
          name: 'Code Snippet',
          x: 8,
          y: 22,
          width: 84,
          height: 42,
          text: 'const developer = {\n  status: "AUTHORIZED",\n  accessLevel: "CLUSTER_ADMIN",\n  capabilities: ["COMMIT_PRODUCTION", "DEPLOY_VERCEL", "MERGE_PR"],\n  verify: () => crypto.verifySignature(pgpKey)\n};',
          fontFamily: 'Fira Code',
          fontSize: 8.5,
          color: '#94a3b8',
          zIndex: 3
        },
        {
          id: 'dev-b-bar',
          type: 'barcode',
          name: 'Barcode Token',
          x: 8,
          y: 72,
          width: 84,
          height: 18,
          codeData: 'DEV-PASS-4F8A9E21',
          zIndex: 3
        }
      ]
    }
  }
];
