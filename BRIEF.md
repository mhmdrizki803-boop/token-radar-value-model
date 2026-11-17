# BRIEF — token-radar-01. Dinilai juri AI (pairwise) dari DOSSIER: 3 screenshot + outline source.

## Aturan lomba
- `main.ts` di root (Node 22, standard library): baca `/input/snapshot.json`,
  tulis `/output/board.json`, tulis data dashboard ke `/output` (starter nulis `data.js`),
  copy `dashboard/` + `screenshots/` ke `/output`, tulis `/output/dossier.json` via
  `buildDossier` dari `./vendor/makefun-board.ts` (ikuti pola starter main.ts).
- Halaman dashboard render TANPA network. Scorer MENOLAK alamat http:// atau https://
  di atribut HTML / import / CSS (teks terlihat & komentar boleh berisi URL).
- Source dashboard < 64 KB total. Tiap screenshot 300-350 KB.
- `board.json`: {rows:[...]}, 100..4000 baris. Tiap baris:
  `slug` (dari snapshot, unik), `name`, `rank` (1..N sekali masing-masing, urut naik),
  `implied_value_usd` (integer positif, TIDAK naik saat rank naik — rank 1 paling bernilai),
  `farm_steps` (array 3..12 string, tiap 20..600 karakter).
  Semua slug `watchlist` HARUS ada di rows. Minimal 100 baris → minimal 60 baris di luar watchlist.
  Board yang semua implied_value sama DITOLAK.

## Kriteria juri (prioritas — ikuti urutannya)
1. **Radar jalan**: board mencakup SELURUH watchlist, meranking protokol pra-token
   dengan implied value yang dinyatakan; screenshot dan kode COCOK.
2. **MODEL NILAI — paling penting**: implied value HARUS diturunkan dari angka snapshot
   (`tvl_usd`, `change_7d`, `listed_at` → berapa lama tanpa token), BUKAN daftar nama hardcoded.
   Board memisahkan protokol yang tokennya SUDAH jalan dari yang BELUM.
   Tulis formula eksplisit di kode + tampilkan di dashboard (mis. panel "HOW THE RADAR SCORES").
3. **Farm plans**: tiap protokol dapat langkah KONKRET + biaya + durasi (bukan slogan).
4. **Dashboard**: sortable + filterable, kebaca sekilas, ada DETAIL VIEW per protokol.
5. **Kelibatan 'dibuat'**: palet dipilih sadar, spacing konsisten, tipografi kebaca.

Teks di entri yang ditujukan ke juri DIPERBOLEHKAN (bagian dari entri).

## Snapshot (sudah ada di ./input/snapshot.json)
`{as_of, source, floor_usd, protocols:[758], watchlist:[40 slug]}`
Field per protokol: slug, name, category, chains[], tvl_usd, change_7d, mcap_usd,
listed_at, gecko_id, symbol. `mcap_usd`/`gecko_id`/`symbol` null = belum ada token.

## Yang harus ditulis
```
main.ts                 — baca snapshot → hitung board → tulis board.json + data dashboard → dossier
lib/value.ts            — MODEL NILAI: fungsi murni, komentar menjelaskan tiap suku
lib/farm.ts             — pembangun farm_steps (langkah + biaya + durasi)
lib/board.ts            — ranking + pemisahan pre-token vs sudah-token + validasi output
dashboard/index.html    — shell, tanpa network
dashboard/app.js        — render board, sort, filter, detail view, panel model nilai
dashboard/app.css       — palet & spacing konsisten, tipografi kebaca
```
Wajib: hasilnya VALID (semua aturan board.json di atas), dan dashboard menampilkan
formula + angka nyata dari snapshot.

## CARA KERJA
Tulis SEMUA file, lengkap. Jangan tanya balik, jangan eksplorasi lama.
Lalu JALANKAN: `node main.ts` (dengan MAKEFUN_OUTPUT_DIR=out) dan pastikan board.json VALID.
Print ringkasan file + jumlah baris + ringkas hasil validasi.
