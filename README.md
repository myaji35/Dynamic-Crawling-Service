This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Database Setup

You have two options for the database:

#### Option 1: Local Docker PostgreSQL (Development)

```bash
# Start local PostgreSQL
npm run db:start

# Stop local PostgreSQL
npm run db:stop
```

#### Option 2: GCP Cloud SQL PostgreSQL (Shared across projects - Recommended)

```bash
# One-time setup
./scripts/setup-gcp-postgres.sh

# Start Cloud SQL Proxy
./scripts/start-gcp-db.sh

# Stop Cloud SQL Proxy
./scripts/stop-gcp-db.sh
```

📚 **Detailed GCP Setup Guide:** [docs/GCP_POSTGRESQL_SETUP.md](docs/GCP_POSTGRESQL_SETUP.md)

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3010](http://localhost:3010) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Testing

### E2E Tests with Playwright

This project includes comprehensive E2E tests using Playwright.

#### Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run tests in UI mode (recommended for development)
npm run test:e2e:ui

# Run tests with browser visible
npm run test:e2e:headed

# Run tests in debug mode
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

#### Test Setup

1. Create `.env.test` file:

```bash
cp .env.test.example .env.test
```

2. Fill in the required environment variables:

- `TEST_USER_EMAIL` - Clerk test account email
- `TEST_USER_PASSWORD` - Clerk test account password
- `TEST_USER_ID` - Test user ID
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key
- `CLERK_SECRET_KEY` - Clerk secret key
- `DATABASE_URL` - Test database URL

3. Install Playwright browsers:

```bash
npx playwright install chromium
```

#### Test Structure

```
tests/
├── e2e/
│   ├── auth/          # Authentication tests
│   ├── projects/      # Project CRUD tests
│   └── visual-builder/ # Visual Builder tests
├── pages/             # Page Object Models
├── fixtures/          # Test fixtures
└── utils/             # Test utilities
```

#### CI/CD

Tests run automatically on:

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

See `.github/workflows/playwright.yml` for CI configuration.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
