# Task Breakdown - Dynamic Crawling Service (DCS)

This file provides a detailed breakdown of all tasks required to build the Dynamic Crawling Service.

---

## Sprint 1: Project Setup & Database

### T-01: Setup Next.js Project

- **Priority:** Must
- **Estimate:** 2 days
- **Description:**
  - Initialize a new Next.js 16+ project with TypeScript.
  - Set up Tailwind CSS and configure it for the project.
  - Integrate shadcn/ui and set up the component structure.
  - Configure ESLint, Prettier, and Husky for code quality.

### T-02: Prisma & Database Setup

- **Priority:** Must
- **Estimate:** 2 days
- **Description:**
  - Set up Prisma as the ORM.
  - Configure Prisma to use SQLite for the local development environment.
  - Define the complete database schema (`User`, `Project`, `Run`, `Data`) in `prisma/schema.prisma`.
  - Generate the initial Prisma client.
  - Prepare the connection setup for a production PostgreSQL database.

### T-03: Basic Crawler Service

- **Priority:** Must
- **Estimate:** 1 day
- **Description:**
  - Implement a basic `crawlerService.ts` within the `src/lib` directory.
  - Create a function that uses Puppeteer to open a given URL and extract data based on a CSS selector.
  - This service will be called from Next.js API routes but will be designed to be portable to a serverless environment.

---

## Sprint 2: Project & Chatbot APIs

### T-05: Project CRUD API

- **Priority:** Must
- **Estimate:** 3 days
- **Description:**
  - Implement Next.js API routes for the following endpoints:
    - `POST /api/projects`
    - `GET /api/projects`
    - `GET /api/projects/{projectId}`
    - `PUT /api/projects/{projectId}`
    - `DELETE /api/projects/{projectId}`
  - Use the Prisma client for all database interactions.
  - Write unit and integration tests for the API routes.

### T-06: User Authentication

- **Priority:** Must
- **Estimate:** 2 days
- **Description:**
  - Integrate a user authentication solution like NextAuth.js.
  - Set up providers (e.g., Google, GitHub, or email/password).
  - Protect the project-related API routes to ensure only authenticated users can access their own data.

### T-07: Chatbot API - Selector Suggestion

- **Priority:** Must
- **Estimate:** 3 days
- **Description:**
  - Implement the `POST /api/chatbot/suggest-selector` API route.
  - The route will take a URL and a field name as input.
  - It will use the `crawlerService` to fetch the page's HTML and then pass it to an LLM to get a suggested CSS selector and sample data.

### T-08: Chatbot API - Sample Crawl

- **Priority:** Must
- **Estimate:** 2 days
- **Description:**
  - Implement the `POST /api/projects/{projectId}/sample-crawl` API route.
  - This route will use the `crawlerService` to perform a one-time crawl with the project's current configuration and return a sample of the extracted data.

---

## Sprint 3: Frontend Dashboard & Chatbot UI

### T-09: Setup Frontend Project

- **Priority:** Must
- **Estimate:** 1 day
- **Description:**
  - This task is mostly covered by T-01, but this is to ensure all frontend-specific setups are complete.
  - Confirm Next.js, TypeScript, Tailwind CSS, and shadcn/ui are correctly configured.
  - Set up Zustand for state management and create initial stores.

### T-10: Project Dashboard UI

- **Priority:** Must
- **Estimate:** 4 days
- **Description:**
  - Build the project dashboard UI using React and shadcn/ui components.
  - The UI should allow users to list, view, create, update, and delete their projects.
  - Style the components with Tailwind CSS.
  - Integrate with the backend Project API routes.

### T-11: Chatbot UI

- **Priority:** Must
- **Estimate:** 5 days
- **Description:**
  - Build the conversational UI for the chatbot wizard using React and shadcn/ui components.
  - The UI should guide the user through the process of creating a new crawling project.
  - Style the components with Tailwind CSS.
  - Integrate with the backend Chatbot API routes to get selector suggestions and run sample crawls.

---

## Sprint 4: Scheduling & Execution Engine

### T-12: Pub/Sub Integration

- **Priority:** Must
- **Estimate:** 2 days
- **Description:**
  - Set up a new Cloud Pub/Sub topic for crawling jobs.
  - Create a service in the backend to publish a message to the topic whenever a crawl needs to be executed.

### T-13: Cloud Run Crawler

- **Priority:** Must
- **Estimate:** 2 days
- **Description:**
  - Create a new, separate Cloud Run service that will act as the crawling engine.
  - This service will subscribe to the Pub/Sub topic and execute the crawl job described in the message.

### T-14: Cloud Scheduler Integration

- **Priority:** Must
- **Estimate:** 1 day
- **Description:**
  - Set up Cloud Scheduler to periodically call an endpoint on the backend that will check for projects that need to be crawled and publish jobs to Pub/Sub.

---

## Sprint 5: Data API & Finalization

### T-15: Data Access API

- **Priority:** Must
- **Estimate:** 2 days
- **Description:**
  - Implement the `GET /data/{projectId}` endpoint.
  - Implement API key-based authentication for this endpoint.

### T-16: Logging and Monitoring

- **Priority:** Should
- **Estimate:** 1 day
- **Description:**
  - Set up centralized logging for all services using Google Cloud Logging.
  - Create basic monitoring dashboards to track the health of the system.

### T-17: End-to-End Testing

- **Priority:** Must
- **Estimate:** 2 days
- **Description:**
  - Perform thorough end-to-end testing of the entire user flow, from creating a project with the chatbot to seeing the data collected by the scheduled crawler.

### T-18: Deployment

- **Priority:** Must
- **Estimate:** 1 day
- **Description:**
  - Deploy the backend API server and the frontend application to a production environment (e.g., using Cloud Run or another hosting service).
