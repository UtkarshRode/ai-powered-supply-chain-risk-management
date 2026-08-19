AI Supply Chain Control Center

<p align="center">
  <strong>AI-powered operational intelligence for modern supply chains</strong>
</p>

<p align="center">
  Monitor orders, inventory, shipments, suppliers, exceptions, and supply-chain risk from one unified control center.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-61DAFB?logo=react&logoColor=white" alt="React">
  <img src="https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Database-PostgreSQL-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/ORM-Prisma-2D3748?logo=prisma&logoColor=white" alt="Prisma">
  <img src="https://img.shields.io/badge/Language-TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/API-REST-6E56CF" alt="REST API">
  <img src="https://img.shields.io/badge/Architecture-Event--Driven-8B5CF6" alt="Event Driven">
  <img src="https://img.shields.io/badge/Risk%20Analysis-Asynchronous-F59E0B" alt="Asynchronous Risk Analysis">
</p>

Overview

AI Supply Chain Control Center is a full-stack supply-chain operations platform designed to turn operational data into actionable risk intelligence.

Instead of treating orders, inventory, shipments, suppliers, and exceptions as isolated modules, the system connects them into a single operational workflow:

Orders
   │
   ├──────────────┐
   │              │
   ▼              ▼
Shipments      Inventory
   │              │
   └──────┬───────┘
          │
          ▼
   Exception Detection
          │
          ▼
     Risk Analysis
          │
          ├── Risk Score
          ├── Severity
          ├── Risk Factors
          └── Recommended Actions
          │
          ▼
   Operations Control Center

The application combines:

React + TypeScript frontend

Node.js + Express REST API

PostgreSQL database

Prisma ORM

Authentication and role-based authorization

Asynchronous background risk-analysis worker

Queue-based event processing

Automated exception detection

Risk scoring and recommendations

Key Capabilities

📦 Order Management

Monitor customer orders and their operational status.

The order workflow is connected to shipment and inventory information so that downstream operational problems can contribute to order-level risk.

🚚 Shipment Tracking

Track shipments using dedicated tracking records.

Shipment status changes can trigger downstream risk analysis:

Shipment Status Updated
          │
          ▼
      Risk Queue
          │
          ▼
    Risk Worker
          │
          ▼
  Risk Analysis Result

📊 Inventory Monitoring

The inventory module provides visibility into:

Product

Warehouse

Quantity

Reserved stock

Available stock

Inventory status

Available inventory is calculated from physical quantity and reserved quantity:

Available Stock = Quantity - Reserved

The system can identify inventory levels that fall below a warehouse/product warning threshold.

🏭 Supplier Management

Supplier records contain operational information such as:

Supplier name

Email

Phone

Reliability

Supplied products

Unit cost

Lead time

Supplier-product relationships allow the platform to associate products with sourcing information.

⚠️ Exception Management

The Exceptions module provides an operational queue for problems that require attention.

Supported exception scenarios include:

Low inventory

Shipment delays

Orders at risk

Other detected supply-chain exceptions

Each exception can contain:

Type

Severity

Risk score

Status

Creation timestamp

Risk description

Exceptions can be inspected and resolved directly from the control center.

🤖 AI Risk Analysis

The risk-analysis system evaluates multiple operational signals instead of looking at a single field in isolation.

Risk factors can include:

Inventory availability

Shipment delays

Supplier reliability

Order deadlines

Existing supply-chain exceptions

The resulting analysis contains:

Risk score

Severity

Risk factors

Recommended actions

Analysis history

Risk Scoring

Risk scores are represented on a 0–100 scale.

Score

Severity

Meaning

0–39

🟢 LOW

Low operational risk

40–69

🟡 MEDIUM

Moderate risk requiring monitoring

70–89

🟠 HIGH

Significant operational risk

90–100

🔴 CRITICAL

Immediate attention required

Example:

Risk Score: 75
Severity: HIGH

Risk Factors:
- Critical inventory shortage
- Delayed shipment
- Order identified as at risk

Recommended Actions:
- Replenish inventory
- Expedite delayed shipment
- Prioritize the affected order
- Escalate with supplier

The important part of the system is not only producing a number. The platform explains why the risk exists and provides operational actions that can be taken.

Exception Detection

The exception engine converts operational conditions into actionable exceptions.

For example:

Inventory
Quantity       = 100
Reserved       = 55
Available      = 45
Warning Level  = 2000

            ↓

LOW INVENTORY EXCEPTION
            ↓
Severity: CRITICAL
            ↓
Risk Analysis
            ↓
Recommended Action:
Replenish inventory

The system also avoids repeatedly creating the same unresolved inventory exception for the same product and warehouse.

This prevents a detection job from generating an uncontrolled number of duplicate exceptions.

Event-Driven Risk Analysis

A central part of the architecture is the asynchronous risk-analysis workflow.

When an important operational event occurs, the API can enqueue a risk-analysis job rather than performing the complete analysis inside the HTTP request.

┌──────────────────┐
│   React Client   │
└────────┬─────────┘
         │
         │ REST API
         ▼
┌──────────────────┐
│  Express Server  │
└────────┬─────────┘
         │
         │ Event
         ▼
┌──────────────────┐
│    Risk Queue    │
└────────┬─────────┘
         │
         │ Background Job
         ▼
┌──────────────────┐
│   Risk Worker    │
└────────┬─────────┘
         │
         │ Analysis
         ▼
┌──────────────────┐
│ Risk Factors +   │
│ Score + Actions  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│    Database      │
└──────────────────┘

This separation keeps the main API responsive while the heavier risk-analysis work is handled asynchronously.

Architecture

                         ┌──────────────────────────┐
                         │       React Client       │
                         │     TypeScript + Vite    │
                         └────────────┬─────────────┘
                                      │
                                      │ HTTP / REST
                                      ▼
                         ┌──────────────────────────┐
                         │      Express API         │
                         │       TypeScript         │
                         └────────────┬─────────────┘
                                      │
                         ┌────────────┴────────────┐
                         │                         │
                         │ Prisma                  │ Events
                         ▼                         ▼
              ┌─────────────────────┐   ┌─────────────────────┐
              │     PostgreSQL      │   │    Risk Queue       │
              │       Database      │   └──────────┬──────────┘
              └─────────────────────┘              │
                                                   │
                                                   ▼
                                      ┌─────────────────────────┐
                                      │     Risk Analysis       │
                                      │         Worker          │
                                      │      TypeScript         │
                                      └────────────┬────────────┘
                                                   │
                                                   │ Results
                                                   ▼
                                      ┌─────────────────────────┐
                                      │       PostgreSQL        │
                                      │ Risk Analysis History   │
                                      └─────────────────────────┘

Application Modules

Module

Purpose

Dashboard

Operational overview

Orders

Order monitoring and risk context

Shipments

Shipment tracking and status updates

Inventory

Warehouse stock monitoring

Suppliers

Supplier reliability and sourcing

Exceptions

Detection, investigation, and resolution

AI Risk Analysis

Risk scores, factors, actions, and history

Frontend

The frontend is implemented with:

React

TypeScript

Vite

CSS

The main application provides navigation across the operational modules and displays backend data through authenticated API requests.

The interface includes operational dashboards, tables, status indicators, filters, detail panels, risk scores, exception states, and action controls.

Backend

The backend is a TypeScript/Express REST API.

The server is organized into:

server/
└── src/
    ├── config/
    ├── controllers/
    ├── middleware/
    ├── queues/
    ├── routes/
    ├── services/
    ├── types/
    ├── utils/
    ├── app.ts
    └── server.ts

The backend follows a layered structure:

Route
  ↓
Middleware
  ↓
Controller
  ↓
Service
  ↓
Prisma
  ↓
PostgreSQL

This keeps HTTP handling, authorization, business logic, and persistence concerns separated.

Worker

The worker is responsible for asynchronous risk-analysis processing.

worker/
└── src/
    ├── config/
    ├── queues/
    ├── services/
    ├── workers/
    └── index.ts

The worker receives risk-analysis jobs and evaluates the relevant supply-chain information before persisting the resulting analysis.

Authentication & Authorization

The API uses authenticated requests and role-based authorization.

Protected operations can require specific roles such as:

ADMIN

MANAGER

Examples of protected administrative operations include:

Creating inventory

Updating inventory

Reserving inventory

Releasing inventory

Creating suppliers

Updating suppliers

Deleting suppliers

Running exception detection

Resolving exceptions

Read operations can be protected by authentication without requiring elevated permissions.

API Structure

The backend exposes REST endpoints grouped by business domain.

/api/auth
/api/customers
/api/orders
/api/products
/api/shipments
/api/inventory
/api/warehouses
/api/suppliers
/api/exceptions

Representative operations include:

GET    /api/inventory
GET    /api/inventory/:id
POST   /api/inventory
PUT    /api/inventory/:id

POST   /api/inventory/:id/reserve
POST   /api/inventory/:id/release

GET    /api/suppliers
GET    /api/suppliers/:id
POST   /api/suppliers
PUT    /api/suppliers/:id
DELETE /api/suppliers/:id

GET    /api/exceptions
GET    /api/exceptions/:id
POST   /api/exceptions/detect
PATCH  /api/exceptions/:id/resolve

The exact API contract is implemented in the route, controller, and service layers.

Database

The project uses PostgreSQL with Prisma ORM.

The database contains the core entities required to represent the supply-chain domain, including concepts such as:

Customer
Order
Product
Warehouse
Inventory
Supplier
SupplierProduct
Shipment
Exception
Risk Analysis

Prisma migrations are stored under:

server/prisma/migrations/

The Prisma schema is located at:

server/prisma/schema.prisma

Inventory Risk Example

A low-stock condition can flow through the complete platform:

Warehouse
   │
   └── Inventory
          │
          ├── Product: LAPTOP-001
          ├── Quantity: 100
          ├── Reserved: 55
          └── Available: 45
                    │
                    ▼
            Below Warning Level
                    │
                    ▼
          Exception Detection
                    │
                    ▼
          Inventory Shortage
                    │
                    ▼
             Risk Analysis
                    │
                    ├── Score
                    ├── Severity
                    ├── Factors
                    └── Actions

This connects the operational data layer to the intelligence layer.

Shipment Risk Example

A shipment status change can trigger risk analysis:

Shipment
   │
   ├── Tracking Number
   ├── Order
   ├── Customer
   ├── Supplier
   └── Status
          │
          ▼
  STATUS_UPDATED EVENT
          │
          ▼
      Risk Queue
          │
          ▼
      Risk Worker
          │
          ▼
   Risk Analysis

For a delayed shipment, the analysis can identify:

SHIPMENT_DELAY

and recommend actions such as:

Expedite the shipment

Monitor delivery

Escalate with the supplier

Prioritize the affected order

Exception Lifecycle

Exceptions follow a simple operational lifecycle:

                    ┌──────────┐
                    │ DETECTED │
                    └────┬─────┘
                         │
                         ▼
                    ┌──────────┐
                    │   OPEN   │
                    └────┬─────┘
                         │
                  Investigation
                         │
                         ▼
                    ┌──────────┐
                    │ RESOLVED │
                    └──────────┘

The UI provides separate visibility for open and resolved exceptions.

Project Structure

AI_Supply_Chain/
│
├── client/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── App.tsx
│   │   ├── App.css
│   │   ├── ExceptionPage.tsx
│   │   ├── ExceptionPage.css
│   │   ├── InventoryPage.tsx
│   │   ├── SupplierPage.tsx
│   │   └── ...
│   ├── package.json
│   └── vite.config.ts
│
├── server/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── queues/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── app.ts
│   │   └── server.ts
│   └── package.json
│
├── worker/
│   ├── src/
│   │   ├── config/
│   │   ├── queues/
│   │   ├── services/
│   │   ├── workers/
│   │   └── index.ts
│   └── package.json
│
├── docs/
├── .gitignore
└── README.md

Local Development

Prerequisites

Install the following before running the project:

Node.js

npm

PostgreSQL

Git

The asynchronous worker also requires the queue infrastructure configured for the project.

1. Clone the Repository

git clone https://github.com/UtkarshRode/ai-supply-chain-control-center.git
cd ai-supply-chain-control-center

2. Install Frontend Dependencies

cd client
npm install

3. Install Backend Dependencies

Open another terminal:

cd server
npm install

4. Install Worker Dependencies

Open another terminal:

cd worker
npm install

5. Configure Environment Variables

Create the required environment files from the environment variables expected by each application.

Do not commit secrets.

The repository ignores:

.env
.env.*

while allowing example environment files:

.env.example

A production deployment should provide secrets through the deployment platform rather than committing them to Git.

Running the Application

The application consists of three processes:

Frontend
Backend API
Risk Worker

Start each process using the scripts defined in its respective package.json.

Typical development layout:

Terminal 1 → client
Terminal 2 → server
Terminal 3 → worker

The frontend development server runs separately from the backend API.

The backend exposes a health endpoint:

GET /api/health

Example:

curl http://localhost:5000/api/health

Expected response:

{
  "success": true,
  "message": "AI Supply Chain API is running"
}

Development Workflow

A typical operational flow through the application is:

1. Create / inspect supply-chain data
              ↓
2. Monitor inventory, orders and shipments
              ↓
3. Update operational status
              ↓
4. Generate an event
              ↓
5. Queue risk-analysis job
              ↓
6. Worker performs analysis
              ↓
7. Risk score and factors are stored
              ↓
8. Exception is displayed in the control center
              ↓
9. Operator investigates the issue
              ↓
10. Exception is resolved

Example Operational Scenario

Consider a laptop shipment handled by a supplier.

Product
LAPTOP-001
        │
        ▼
Mumbai Central Warehouse
        │
        ▼
Available Inventory becomes critically low
        │
        ▼
Inventory Exception
        │
        ▼
Risk Analysis
        │
        ├── Inventory shortage
        ├── Shipment delay
        └── Order at risk
        │
        ▼
HIGH / CRITICAL RISK
        │
        ▼
Recommended Actions
        ├── Replenish inventory
        ├── Expedite shipment
        ├── Prioritize order
        └── Escalate with supplier

This demonstrates the main idea of the platform:

Operational events → detected exceptions → explainable risk → recommended action

Design Principles

Separation of Concerns

Routes, controllers, services, database access, and workers are separated into dedicated layers.

Explainable Risk

The system does not stop at a risk score. It surfaces the underlying factors and recommended actions.

Asynchronous Processing

Risk analysis is separated from the request-response path through a background worker.

Role-Based Operations

Sensitive mutations are protected by authentication and role-based authorization.

Duplicate Prevention

Exception detection is designed to avoid repeatedly creating the same unresolved inventory exception.

Operational Focus

The UI is designed around the decisions an operations user needs to make:

What is wrong?
Why is it risky?
How severe is it?
What should I do?
Has the issue been resolved?

Security Considerations

The repository is configured to avoid committing common secret and generated files.

Ignored files include:

node_modules/
.env
.env.*
dist/
build/
coverage/
.vscode/
*.log
.DS_Store

Production deployments should additionally use:

Strong secret values

HTTPS

Secure database credentials

Proper JWT configuration

Restricted database access

Production CORS configuration

Secure queue credentials

Environment-specific configuration

Current Status

The current implementation includes the core operational control-center workflow:

React frontend

TypeScript frontend

Express backend

PostgreSQL + Prisma

Authentication

Role-based authorization

Orders module

Shipments module

Inventory module

Supplier module

Exception module

Exception detection

Exception resolution

Risk-analysis worker

Queue-based risk-analysis processing

Risk scoring

Risk severity classification

Risk factors

Recommended actions

Risk-analysis history

Duplicate exception prevention

GitHub repository

Roadmap

Potential future improvements include:

Production deployment

Automated CI/CD pipeline

Automated test suite

API documentation with OpenAPI / Swagger

More advanced supplier-risk models

Demand forecasting

Inventory replenishment forecasting

Shipment ETA prediction

Notification and alert system

Real-time operational updates

Advanced analytics and trend visualizations

Model-based risk prediction using historical data

Audit logging

Production observability and monitoring

Why This Project?

Traditional supply-chain dashboards often show operational data without connecting the information into a decision-making workflow.

This project focuses on the connection:

DATA
 ↓
OPERATIONS
 ↓
EVENTS
 ↓
EXCEPTIONS
 ↓
RISK
 ↓
RECOMMENDATIONS
 ↓
ACTION

The goal is to provide an operations team with a single place to understand both the current state of the supply chain and the problems that require attention.

Technology Stack

Category

Technology

Frontend

React

Frontend Language

TypeScript

Frontend Build Tool

Vite

Backend

Node.js

API Framework

Express

Backend Language

TypeScript

Database

PostgreSQL

ORM

Prisma

Background Processing

TypeScript Worker

Queue

Redis / Queue infrastructure

Authentication

JWT-based authentication

API Style

REST

Version Control

Git + GitHub

Repository

GitHub:

AI Supply Chain Control Center

https://github.com/UtkarshRode/ai-supply-chain-control-center

Author

Utkarsh Rode

Built as a full-stack AI-oriented supply-chain operations and risk-intelligence project.

License

This project is licensed under the MIT License.

See LICENSE for details.

<p align="center">
  <strong>AI Supply Chain Control Center</strong>
  <br>
  From operational data to actionable risk intelligence.
</p>