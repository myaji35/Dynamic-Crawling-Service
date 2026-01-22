# GEMINI.md - Dynamic Crawling Service (DCS)

## Project Overview

This project aims to build a **Dynamic Crawling Service (DCS)**, an AI chatbot-based platform that allows non-technical users to create, manage, and schedule web crawling tasks through a simple conversational interface. The service will translate natural language inputs into technical crawling configurations (JSON), abstracting away complexities like CSS Selectors and cron jobs.

The primary goal is to empower users like data analysts, marketers, and researchers to collect web data without needing to write any code.

### Core Features:

- **Project Management Dashboard:** A web interface to monitor the status of all crawling projects.
- **AI-based Chatbot Wizard:** A conversational interface to guide users through project setup.
- **AI Selector Recommendation:** The chatbot will analyze a given URL and suggest CSS selectors for the data fields the user wants to extract.
- **Sample Crawling & Confirmation:** Users can test the generated configuration and confirm its accuracy before activating the project.
- **Dynamic Schema Support:** The backend will be able to handle different data structures for each project.
- **Scheduled & Distributed Execution:** A scalable backend to run crawling tasks at scheduled intervals.
- **Data API:** A secure API to access the collected data.

## Proposed Technical Stack

- **Framework:** Next.js 16+ with TypeScript
- **Frontend:**
  - **UI:** React with shadcn/ui
  - **Styling:** Tailwind CSS
  - **State Management:** Zustand
- **Backend:**
  - **API:** Next.js API Routes
  - **Crawling Engine:** Puppeteer or Playwright (running in a separate serverless environment)
- **Database:**
  - **Local:** SQLite
  - **Server:** PostgreSQL
- **GCP Services:**
  - **Scheduling:** Cloud Scheduler
  - **Task Queuing:** Cloud Pub/Sub
  - **Execution Environment:** Cloud Run or Cloud Functions for the crawling engine.

## High-Level Development Plan

This is a suggested plan to start the development of the project, based on the features in the PRD.

1.  **T-01: Basic Project Setup & Backend Foundation**
    - Set up a new Node.js project.
    - Implement a basic web server (e.g., with Express).
    - Define the initial data models for Projects and Crawling jobs.
    - Set up a connection to Firestore.

2.  **T-02: Implement a Basic Crawler**
    - Create a service that can take a URL and a set of CSS selectors, and return the extracted data.
    - Use Puppeteer or Playwright for this.

3.  **T-03: Develop the AI Chatbot Wizard (Core Logic)**
    - Implement the backend logic for the chatbot, handling the conversation flow.
    - Integrate with a large language model (LLM) to understand user input and generate responses.
    - Implement the AI Selector Recommendation feature.

4.  **T-04: Build the Frontend Dashboard**
    - Create the project management dashboard.
    - Implement the UI for the chatbot wizard.

5.  **T-05: Integrate Backend and Frontend**
    - Connect the frontend to the backend APIs.
    - Ensure the chatbot conversation correctly creates a project configuration.

6.  **T-06: Implement Scheduling and Execution Engine**
    - Integrate with Cloud Scheduler, Pub/Sub, and Cloud Run/Functions to enable scheduled crawling.

7.  **T-07: Develop the Data API**
    - Implement the secure API to access the collected data.

8.  **T-08: Testing and Deployment**
    - Write unit and integration tests.
    - Set up a CI/CD pipeline for deployment.

## Active Technologies

- TypeScript 5.x, Node.js 20.x (LTS) (001-ai-chatbot-crawling-system)

## Recent Changes

- 001-ai-chatbot-crawling-system: Added TypeScript 5.x, Node.js 20.x (LTS)
