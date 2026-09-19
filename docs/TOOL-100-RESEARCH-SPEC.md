# Toolkit Pro — 100 High-Demand Tool Research Specification

Version: 2026.09.19.1

## Purpose

The first 100 tools are the product-quality priority set. They are not a simple feature-count exercise. Each tool must solve a concrete user job from input through verified output.

## Research evidence

Current August 2026 traffic signals support prioritising PDF/document conversion, image processing, file conversion, calculators, word counting and QR workflows:

- iLovePDF: 255.46M visits; Google organic 47.28%; Bangladesh 31.54M visits. Major keywords include JPG to PDF, PDF to Word and PDF to JPG.
- Smallpdf: 42.78M visits.
- Convertio: 22.41M visits; Google organic 52.85%.
- remove.bg: 80.36M visits.
- WordCounter: 14.22M visits; Bangladesh 4.15M visits.
- Calculator.net: 59.76M visits; Bangladesh 5.8M visits.
- QR Code Generator: 7.82M visits; Bangladesh 438K visits.
- CloudConvert supports 200+ formats and format-specific conversion options.

These are directional market signals, not a universal ranking of all tools.

## Mandatory production standard

Every priority tool must document:

1. User job / search intent
2. Valid and invalid inputs
3. Core algorithm or processing engine
4. Output contract
5. Output verification
6. Edge cases
7. Error recovery
8. Privacy/data handling
9. Browser/server/worker runtime
10. Mobile UX
11. Accessibility
12. Performance limits
13. Download/copy/export behavior
14. SEO landing-page intent
15. Functional test fixtures

A tool is not production-ready merely because its button works.

## Architecture rules

- Browser-first for text, JSON, hashing, colors, simple calculators and other local operations.
- Worker/API for large files, OCR, complex PDF conversion, video/audio and long-running jobs.
- Sensitive user files should be processed locally where practical.
- Worker jobs require retry, lease/visibility timeout, idempotency, failure recovery and cleanup before production-scale use.
- CORS-dependent browser tools must clearly disclose the limitation and use a server-side path when appropriate.

## 100-tool matrix

### PDF & Documents — 20

| # | Tool | Core user job | Key requirements | Runtime |
|---|---|---|---|---|
| 1 | JPG to PDF | images to printable PDF | multi-file ordering, page size, orientation, margins, quality | Browser/Worker |
| 2 | PNG to PDF | PNG collection to PDF | ordering, page sizing, transparency handling | Browser/Worker |
| 3 | PDF to JPG | PDF pages to images | DPI/quality, page selection, batch ZIP | Worker |
| 4 | PDF to PNG | PDF pages to PNG | DPI, transparency where supported, page selection | Worker |
| 5 | PDF to Word | editable document | layout preservation, fonts, tables, failure reporting | Worker |
| 6 | Word to PDF | print-ready PDF | page layout, fonts, metadata, verification | Worker |
| 7 | PDF Compressor | reduce file size | target size/quality, before-after metrics, verification | Browser/Worker |
| 8 | Merge PDF | combine PDFs | drag ordering, page counts, bookmarks/metadata policy | Browser/Worker |
| 9 | Split PDF | divide PDF | page ranges, every-N-pages, named outputs | Browser/Worker |
| 10 | Extract PDF Pages | keep selected pages | thumbnails, range parser, output validation | Browser/Worker |
| 11 | Rotate PDF | correct orientation | per-page/all-pages, preview, lossless handling | Browser/Worker |
| 12 | Delete PDF Pages | remove pages | page selection, preview, minimum-page validation | Browser/Worker |
| 13 | Reorder PDF Pages | rearrange pages | thumbnails, drag/drop, undo/reset | Browser/Worker |
| 14 | Protect PDF | add password/security | password policy, encryption mode, confirmation | Browser/Worker |
| 15 | Unlock PDF | remove permitted protection | password input, clear failure reason, security limits | Worker |
| 16 | PDF to Text | extract readable text | page selection, Unicode, extraction diagnostics | Browser/Worker |
| 17 | PDF OCR | scanned PDF to searchable text | language selection, confidence/error notice, output PDF/text | Worker |
| 18 | PDF Page Numbering | add page numbers | position, start number, range, preview | Browser/Worker |
| 19 | PDF Metadata Editor | edit document metadata | title/author/subject/keywords, preserve file integrity | Browser/Worker |
| 20 | PDF Watermark | watermark pages | text/image, opacity, position, page range | Browser/Worker |

### Image & File Conversion — 18

| # | Tool | Core user job | Key requirements | Runtime |
|---|---|---|---|---|
| 21 | Image Compressor | reduce image size | target size, quality, format, before-after comparison | Browser/Worker |
| 22 | Image Resizer | resize accurately | exact dimensions, aspect lock, batch, output format | Browser |
| 23 | Image Cropper | crop image | free/custom/aspect crop, preview, export | Browser |
| 24 | Background Remover | isolate subject | transparent output, quality preview, file limits | API/Worker |
| 25 | Image to Text/OCR | extract text from image | language, layout, copy/download, confidence notice | Worker |
| 26 | JPG to PNG | convert format | transparency caveat, quality, batch | Browser |
| 27 | PNG to JPG | convert format | background handling, quality, batch | Browser |
| 28 | JPG to WebP | web optimization | quality, dimensions, metadata policy | Browser |
| 29 | PNG to WebP | web optimization | transparency, quality, dimensions | Browser |
| 30 | WebP to JPG | compatibility conversion | background, quality, batch | Browser |
| 31 | WebP to PNG | lossless-compatible conversion | transparency, metadata policy | Browser |
| 32 | HEIC to JPG | device compatibility | batch, EXIF orientation, quality | Browser/Worker |
| 33 | HEIC to PNG | compatibility conversion | batch, orientation, transparency limitations | Browser/Worker |
| 34 | GIF to MP4 | convert animation | frame timing, loop policy, output size | Worker |
| 35 | MP4 to GIF | create GIF | trim, FPS, dimensions, palette/size controls | Worker |
| 36 | Video Compressor | reduce video size | codec/quality, target size, progress, verification | Worker |
| 37 | MP4 to MP3 | extract audio | bitrate, metadata, progress, output validation | Worker |
| 38 | Audio Compressor | reduce audio size | codec/bitrate, duration, progress | Worker |

### Developer & Data — 15

| # | Tool | Core user job | Key requirements | Runtime |
|---|---|---|---|---|
| 39 | JSON Formatter | readable JSON | parse diagnostics, line/column, pretty/minify | Browser |
| 40 | JSON Validator | validate JSON | precise error location, type diagnostics | Browser |
| 41 | JSON Tree Viewer | inspect large JSON | expand/collapse, search, path copy | Browser |
| 42 | JSON Minifier | compact JSON | validation before minify, output verification | Browser |
| 43 | JSON to CSV | tabular export | nested-field policy, quoted CSV, headers | Browser |
| 44 | CSV to JSON | parse CSV | quoted fields, escaped quotes, missing cells | Browser |
| 45 | XML Formatter | readable XML | parser errors, indentation, preserving content | Browser |
| 46 | XML Validator | validate XML | syntax error location, encoding caveats | Browser |
| 47 | Base64 Encoder/Decoder | encode/decode | Unicode and binary-safe modes, invalid input handling | Browser |
| 48 | URL Encoder/Decoder | encode URL components | component vs full URL mode, Unicode | Browser |
| 49 | JWT Decoder | inspect JWT | header/payload decoding, signature warning, no false verification claim | Browser |
| 50 | UUID Generator | generate identifiers | v4 generation, bulk mode, copy/download | Browser |
| 51 | Hash Generator | calculate hashes | SHA variants, text/file mode, known-vector tests | Browser |
| 52 | Regex Tester | test regular expressions | flags, matches, groups, error diagnostics | Browser |
| 53 | SQL Formatter | readable SQL | dialect notice, safe formatting, preserve strings/comments | Browser |

### Text & Writing — 10

| # | Tool | Core user job | Key requirements | Runtime |
|---|---|---|---|---|
| 54 | Word Counter | count writing | Unicode-aware words, chars, lines, sentences, reading time | Browser |
| 55 | Character Counter | count characters | spaces/no-spaces, Unicode semantics | Browser |
| 56 | Sentence Counter | count sentences | multilingual punctuation, abbreviations caveat | Browser |
| 57 | Reading Time Calculator | estimate reading time | configurable WPM, language caveat | Browser |
| 58 | Text Case Converter | change case | sentence/title/upper/lower/camel/snake/kebab | Browser |
| 59 | Remove Line Breaks | normalize pasted text | preserve paragraph policy, whitespace control | Browser |
| 60 | Find & Replace | bulk text editing | case/whole-word/regex modes, replacement count | Browser |
| 61 | Text Diff Checker | compare texts | additions/deletions, line/word modes, Unicode | Browser |
| 62 | Lorem Ipsum Generator | generate placeholder copy | word/paragraph count, deterministic reset | Browser |
| 63 | Grammar/Text Checker | identify writing issues | clear limitation, suggestions, privacy | Browser/API |

### Calculators & Converters — 10

| # | Tool | Core user job | Key requirements | Runtime |
|---|---|---|---|---|
| 64 | Percentage Calculator | percentage math | multiple modes, decimals, validation | Browser |
| 65 | Percentage Change | compare values | increase/decrease/zero-base handling | Browser |
| 66 | Age Calculator | calculate exact age | dates, leap years, next birthday | Browser |
| 67 | BMI Calculator | BMI from height/weight | unit conversion, category caveat | Browser |
| 68 | BMR Calculator | estimate BMR | formula selection, units, explanatory output | Browser |
| 69 | EMI Calculator | loan payment | rate, tenure, amortization table, totals | Browser |
| 70 | Simple Interest | interest calculation | principal/rate/time, units, formula transparency | Browser |
| 71 | Profit Margin | business margin | cost/revenue/profit modes, validation | Browser |
| 72 | Unit Converter | convert measurements | grouped units, precision, invalid-unit handling | Browser |
| 73 | Currency Converter | convert currencies | current-rate source, timestamp, stale-rate warning | API |

### SEO & Webmaster — 10

| # | Tool | Core user job | Key requirements | Runtime |
|---|---|---|---|---|
| 74 | SEO Analyzer | audit page HTML | metadata, headings, links, images, structured data, actionable findings | Browser |
| 75 | Meta Tag Generator | generate metadata | title/description/canonical/OG/Twitter, escaping | Browser |
| 76 | Meta Tag Analyzer | inspect metadata | duplicates, length guidance, canonical/robots/OG | Browser |
| 77 | Sitemap Generator | create sitemap | URL validation, dedupe, XML escaping, limits | Browser/Worker |
| 78 | Sitemap Validator | validate sitemap | XML parsing, loc validation, namespace/root checks | Browser |
| 79 | Robots.txt Generator | create rules | user-agent, allow/disallow, sitemap | Browser |
| 80 | Robots.txt Tester | test crawler access | user-agent matching, limitation disclosure | Browser |
| 81 | Schema Generator | generate JSON-LD | common schema types, validation, safe escaping | Browser |
| 82 | Schema Validator | inspect JSON-LD | syntax/context/type diagnostics, no false full-schema claim | Browser |
| 83 | SERP Preview | preview search result | title/description/path, truncation caveat, mobile/desktop modes | Browser |

### Security & Generators — 7

| # | Tool | Core user job | Key requirements | Runtime |
|---|---|---|---|---|
| 84 | Password Generator | create passwords | CSPRNG, guaranteed character sets, entropy estimate, no server upload | Browser |
| 85 | Password Strength Checker | assess password | local-only, entropy/heuristics, avoid storing password | Browser |
| 86 | SHA-256 Hash | hash data | text/file modes, known vectors, streaming for large files if possible | Browser |
| 87 | SHA-512 Hash | hash data | text/file modes, known vectors | Browser |
| 88 | Random String Generator | random IDs/text | CSPRNG, unbiased selection, charset/length controls | Browser |
| 89 | UUID Bulk Generator | bulk UUIDs | collision-safe generation, count limits, copy/download | Browser |
| 90 | QR Code Generator | generate scannable QR | content types, error correction, size/export, validation | Browser |

### Marketing / Productivity / Utility — 10

| # | Tool | Core user job | Key requirements | Runtime |
|---|---|---|---|---|
| 91 | URL Shortener | create short URLs | backend persistence, abuse controls, expiration/analytics policy | API |
| 92 | UTM Builder | build campaign URLs | URL validation, encoding, presets, copy | Browser |
| 93 | Email Signature Generator | create signature | responsive HTML, social links, copy/export | Browser |
| 94 | Username Generator | create usernames | constraints, uniqueness disclaimer, bulk mode | Browser |
| 95 | Random Picker | select random item | unbiased selection, list parsing, repeat policy | Browser |
| 96 | Date Difference Calculator | calculate date gap | inclusive/exclusive modes, leap years, units | Browser |
| 97 | Time Duration Calculator | calculate elapsed time | overnight spans, seconds/minutes/hours, validation | Browser |
| 98 | Time Zone Converter | convert local times | DST-aware timezone database, date/time handling | Browser |
| 99 | Color Picker / HEX-RGB | convert/select colors | HEX/RGB/HSL, validation, contrast helpers | Browser |
| 100 | CSS Gradient Generator | create CSS gradients | linear/radial, stops, angle, live preview, copy CSS | Browser |

## Release gates

### Gate A — research
Competitor workflow and user intent documented.

### Gate B — functional
Valid/invalid/edge-case fixtures pass.

### Gate C — UX
Desktop/mobile, loading, empty, error and success states are complete.

### Gate D — reliability
Output is verified; limitations are disclosed.

### Gate E — SEO
Unique intent-focused title, description, canonical, structured data and related-tool links.

### Gate F — production
Performance, security, privacy and runtime architecture are reviewed.

## First implementation wave

The first production wave should focus on the highest-confidence user jobs:

1. JPG → PDF
2. PDF → Word
3. PDF → JPG
4. PDF Compressor
5. Merge PDF
6. Split PDF
7. Image Compressor
8. Image Resizer
9. Background Remover
10. JPG → PNG
11. PNG → JPG
12. JSON Formatter
13. JSON Validator
14. Word Counter
15. Character Counter
16. Percentage Calculator
17. Age Calculator
18. Password Generator
19. QR Code Generator
20. SEO Analyzer

Do not expand the next wave until these workflows meet the production gates.
