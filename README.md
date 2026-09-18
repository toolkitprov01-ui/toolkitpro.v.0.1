# Toolkit Pro

### Your Everyday Tool Companion

Toolkit Pro is a free online collection of useful everyday tools.

## Current status

- Core Node.js + Express backend is configured.
- Responsive frontend and tool workspace are included.
- 10 browser-side tools are implemented.
- PostgreSQL and Redis integration code is ready.
- **Production database/Redis credentials are not committed to this repository.** They must be supplied as deployment environment variables.

## Features

- Free online tools
- No signup required
- Mobile-friendly design
- Responsive interface
- English and Bengali support
- Fast and privacy-focused
- Progressive Web App (PWA) foundation

## Tool Categories

- Text Tools
- Developer Tools
- Image Tools
- Calculators
- Converters
- SEO Tools
- Security Tools
- File Tools
- Color Tools
- Utility Tools

## Implemented tools

1. Word Counter
2. Case Converter
3. JSON Formatter
4. Base64 Encoder / Decoder
5. URL Encoder / Decoder
6. Password Generator
7. UUID Generator
8. Percentage Calculator
9. Length Converter
10. Unix Timestamp

## Project

**Domain:** maptrcker.online

**Repository:** toolkitpro.v.0.1

## Local development

Requirements:

- Node.js 20+
- PostgreSQL (optional for fallback development)
- Redis (optional for fallback development)

Install dependencies:

```bash
npm install
```

Start the server:

```bash
npm start
```

The application serves the frontend from the `public/` directory.

## Environment variables

Copy `.env.example` to a local `.env` file and provide values when using PostgreSQL/Redis:

```env
PORT=3000
DATABASE_URL=
REDIS_URL=
CORS_ORIGIN=
```

Never commit real credentials or secrets to GitHub.

## Database setup

The SQL schema is in `scripts/schema.sql`.

The seed script creates the tools table when needed and synchronizes the registered tools:

```bash
npm run seed
```

For direct PostgreSQL initialization:

```bash
npm run db:init
```

These commands require a valid `DATABASE_URL`.

## API endpoints

- `GET /api/health` — application, database, and Redis status
- `GET /api/tools` — registered tools

## Deployment

The repository includes a `render.yaml` deployment configuration and a production-ready environment-variable pattern. Before deployment, configure the deployment platform with the real:

- `DATABASE_URL`
- `REDIS_URL`
- `CORS_ORIGIN`

Do not place these secrets inside source files.

## Development

Built with:

- HTML5
- CSS3
- Vanilla JavaScript
- Node.js
- Express
- PostgreSQL
- Redis

---

© Toolkit Pro
