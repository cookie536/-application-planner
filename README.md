<img width="1586" height="992" alt="494a1e859488a00253f443b9c49583d7" src="https://github.com/user-attachments/assets/f5f27d42-18dd-470f-90ee-d25b0acaf932" /><img width="1586" height="992" alt="1a56e6a5ba76cff2bb5b1f44a3e45615" src="https://github.com/user-attachments/assets/561a94dd-c93c-4a99-8041-ee3681df2e00" /><img width="1586" height="992" alt="ef8f79b7ce8da0fd3020c761f932fd17" src="https://github.com/user-attachments/assets/6cb35bc3-d589-446c-926d-d8ca76d054a4" /><img width="1586" height="992" alt="8efa81d83a32f49321118fcbe5af1b02" src="https://github.com/user-attachments/assets/f85dff29-d6dd-45e1-aaac-374042b526d8" /><img width="1586" height="992" alt="ff6311b44395c5096b1fa2e1900262c4" src="https://github.com/user-attachments/assets/1029aed1-dfb2-454b-8342-bb49e53adb5f" /><img width="1586" height="992" alt="ff6311b44395c5096b1fa2e1900262c4" src="https://github.com/user-attachments/assets/c5be0ee8-4a96-4522-ba95-073015e90135" /><img width="1586" height="992" alt="28c0477cb9c57b7b1f768b7e55309632" src="https://github.com/user-attachments/assets/9d417a01-c22d-46ee-8edb-577342afc490" /><img width="1586" height="992" alt="289fc8c803e33786ea279ce82b99e1a1" src="https://github.com/user-attachments/assets/c9a09e6d-2c2e-4e64-a8c3-639cfb5208ba" /><img width="1586" height="992" alt="361616310a43d58aa10ce6b0e3b16a95" src="https://github.com/user-attachments/assets/40aed55d-1970-4d6c-9c93-c9aeb82d8a61" />









# Application Planner

A lightweight application management tool for graduate school applicants.

Application Planner helps users organize programs, deadlines, required materials, and application progress in one place — while exploring how AI can reduce the manual work of turning scattered admission information into actionable application data.

🔗 **Live Demo:** https://grad-application-planner.netlify.app

---

## Why I Built This

While preparing my own graduate school applications, I found that the hardest part was not simply keeping a checklist.

Information was scattered across university websites, program pages, PDFs, and application portals. For every program, I repeatedly had to figure out:

- When is the deadline?
- What documents are required?
- Which materials are optional or recommended?
- What have I already completed?
- What should I work on next?

The real problem gradually became clear:

> How can scattered, unstructured admission information be turned into a personal application plan?

Application Planner started as a simple application tracker and gradually evolved around this question.

---

## Features

### Application Dashboard

Manage multiple graduate applications in one place, including:

- University
- Program
- Country / Region
- Deadline
- Application status
- Required materials

### Materials Checklist

Track documents required for each application, such as:

- Personal Statement
- CV / Resume
- Transcript
- Recommendation Letters
- Language Test
- Passport / ID

### Timeline

View important application deadlines and milestones across different programs in one timeline.

### AI-assisted Information Extraction

Application Planner is also experimenting with AI-assisted extraction of admission information.

The current workflow is:

**University information → AI extraction → Structured fields → User review → Save**

The goal is to extract information such as:

- Deadlines
- Required documents
- Admission requirements
- Other application-related information

Because application deadlines and document requirements are high-stakes information, AI-generated results are reviewed by the user before being saved.

---

## AI: Current Status

The AI extraction feature is still experimental.

Current testing shows that extraction can become unreliable when:

- A page contains multiple deadlines
- Required, recommended, and optional documents appear together
- Admission information is long or poorly structured
- Different universities describe similar requirements differently

Instead of fully automating the process, the current design keeps the user in control of verification and final confirmation.

This project is also an experiment in a broader product question:

> Where should AI reduce manual work, and where should users retain control?

---

## Product Iteration

The first version of Application Planner focused mainly on manually managing applications and checklists.

After using it during my own application process, I realized that the more time-consuming problem happened **before** information entered the planner:

**Official website → Understand information → Identify what matters → Enter it into the planner**

This led me to shift the product toward:

**Unstructured information → Structured application data → Next actions**

AI extraction was introduced as an early attempt to reduce this gap.

---

## Tech Stack

- Next.js
- TypeScript
- React
- AI API
- Netlify
- Cursor / Codex

The project was built with an AI-assisted coding workflow.

My focus has been on defining the product, designing interactions, testing real use cases, identifying failures, and iterating on the experience while using AI coding tools to implement the product.

---

## Current Status

**V1 is live.**

🔗 https://grad-application-planner.netlify.app

Current development focuses on improving:

- AI extraction reliability
- Multiple-deadline handling
- Required / Recommended / Optional document classification
- User verification before data is saved
- Turning application information into clearer next actions

---

## About

Application Planner is an independent side project built from a problem I encountered during my own graduate application process.

It represents my first attempt to take a product through the full process of:

**Problem discovery → Product definition → MVP → Real-world use → Iteration → AI integration → Deployment**

The project is still evolving, but the goal is simple: build something that is genuinely useful in my own application process rather than a demo created only for a portfolio.
