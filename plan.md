# Development Plan - Dynamic Crawling Service (DCS)

This document outlines the development plan for the Dynamic Crawling Service, based on the PRD and LLD.

## High-Level Timeline

- **Sprint 1 (1 week):** Project Setup & Database
- **Sprint 2 (2 weeks):** Project & Chatbot APIs
- **Sprint 3 (2 weeks):** Frontend Dashboard & Chatbot UI
- **Sprint 4 (1 week):** Scheduling & Execution Engine
- **Sprint 5 (1 week):** Data API & Finalization

---

## Sprint 1: Project Setup & Database

- **Goal:** Set up the Next.js project and configure the database with Prisma.
- **Duration:** 1 week

| Task ID  | Description                                                    | Priority | Estimate |
| :------- | :------------------------------------------------------------- | :------- | :------- |
| **T-01** | **Setup Next.js Project**                                      | Must     | 2 days   |
|          | - Initialize Next.js 16+ project with TypeScript               |          |          |
|          | - Set up Tailwind CSS and shadcn/ui                            |          |          |
|          | - Configure ESLint, Prettier, and Husky                        |          |          |
| **T-02** | **Prisma & Database Setup**                                    | Must     | 2 days   |
|          | - Set up Prisma with SQLite for local development              |          |          |
|          | - Define the database schema in `schema.prisma`                |          |          |
|          | - Set up PostgreSQL for the server environment                 |          |          |
| **T-03** | **Basic Crawler Service**                                      | Must     | 1 day    |
|          | - Implement a basic `crawlerService.ts` in the `lib` directory |          |          |
|          | - Use Puppeteer to open a URL and extract data                 |          |          |

---

## Sprint 2: Project & Chatbot APIs

- **Goal:** Implement the core API endpoints for managing projects and interacting with the chatbot using Next.js API Routes.
- **Duration:** 2 weeks

| Task ID  | Description                                                                      | Priority | Estimate |
| :------- | :------------------------------------------------------------------------------- | :------- | :------- |
| **T-05** | **Project CRUD API**                                                             | Must     | 3 days   |
|          | - Implement Next.js API routes for `POST, GET, PUT, DELETE /api/projects`        |          |          |
|          | - Use Prisma for all database operations                                         |          |          |
|          | - Add unit and integration tests                                                 |          |          |
| **T-06** | **User Authentication**                                                          | Must     | 2 days   |
|          | - Implement user authentication (e.g., with NextAuth.js)                         |          |          |
|          | - Protect project API routes                                                     |          |          |
| **T-07** | **Chatbot API - Selector Suggestion**                                            | Must     | 3 days   |
|          | - Implement `POST /api/chatbot/suggest-selector` as a Next.js API route          |          |          |
|          | - Integrate with an LLM to get selector suggestions                              |          |          |
| **T-08** | **Chatbot API - Sample Crawl**                                                   | Must     | 2 days   |
|          | - Implement `POST /api/projects/{projectId}/sample-crawl` as a Next.js API route |          |          |
|          | - Use the `crawlerService` to perform a sample crawl                             |          |          |

---

## Sprint 3: Frontend Dashboard & Chatbot UI

- **Goal:** Build the user-facing web application using Next.js, shadcn/ui, and Tailwind CSS.
- **Duration:** 2 weeks

| Task ID  | Description                                                               | Priority | Estimate |
| :------- | :------------------------------------------------------------------------ | :------- | :------- |
| **T-09** | **Setup Frontend Project**                                                | Must     | 1 day    |
|          | - Initialize Next.js project with TypeScript, Tailwind CSS, and shadcn/ui |          |          |
|          | - Set up basic project structure and Zustand for state management         |          |          |
| **T-10** | **Project Dashboard UI**                                                  | Must     | 4 days   |
|          | - Create UI to list, view, and manage projects using shadcn/ui components |          |          |
|          | - Integrate with the backend Project API                                  |          |          |
| **T-11** | **Chatbot UI**                                                            | Must     | 5 days   |
|          | - Create the conversational UI for the chatbot using shadcn/ui components |          |          |
|          | - Integrate with the backend Chatbot API                                  |          |          |

---

## Sprint 4: Scheduling & Execution Engine

- **Goal:** Implement the automated crawling engine using GCP services.
- **Duration:** 1 week

| Task ID  | Description                                                              | Priority | Estimate |
| :------- | :----------------------------------------------------------------------- | :------- | :------- |
| **T-12** | **Pub/Sub Integration**                                                  | Must     | 2 days   |
|          | - Set up Cloud Pub/Sub                                                   |          |          |
|          | - Create a service to publish crawling jobs to a topic                   |          |          |
| **T-13** | **Cloud Run Crawler**                                                    | Must     | 2 days   |
|          | - Create a new Cloud Run service for the crawling engine                 |          |          |
|          | - This service will subscribe to the Pub/Sub topic                       |          |          |
| **T-14** | **Cloud Scheduler Integration**                                          | Must     | 1 day    |
|          | - Set up Cloud Scheduler to trigger jobs based on the project's schedule |          |          |

---

## Sprint 5: Data API & Finalization

- **Goal:** Implement the data access API and prepare for launch.
- **Duration:** 1 week

| Task ID  | Description                                                     | Priority | Estimate |
| :------- | :-------------------------------------------------------------- | :------- | :------- |
| **T-15** | **Data Access API**                                             | Must     | 2 days   |
|          | - Implement `GET /data/{projectId}`                             |          |          |
|          | - Implement API key authentication                              |          |          |
| **T-16** | **Logging and Monitoring**                                      | Should   | 1 day    |
|          | - Set up centralized logging (e.g., using Google Cloud Logging) |          |          |
| **T-17** | **End-to-End Testing**                                          | Must     | 2 days   |
|          | - Perform thorough end-to-end testing of the entire user flow   |          |          |
| **T-18** | **Deployment**                                                  | Must     | 1 day    |
|          | - Deploy the application to production                          |          |          |
