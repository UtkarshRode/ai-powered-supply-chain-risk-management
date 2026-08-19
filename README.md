AI Supply Chain Control Center

An AI-powered supply chain operations platform for monitoring orders, inventory, shipments, suppliers, exceptions, and operational risk from a unified control center.

The system combines a React frontend, TypeScript/Express backend, PostgreSQL database through Prisma, and an asynchronous risk-analysis worker to detect supply-chain problems and generate actionable risk insights.

Features

Secure authentication with role-based authorization

Supply-chain operations dashboard

Order management and tracking

Shipment tracking and status management

Inventory monitoring

Warehouse and product management

Supplier management

Automated exception detection

Exception resolution workflow

AI-driven supply-chain risk analysis

Risk scoring and severity classification

Risk factors and recommendations

Asynchronous background risk-analysis jobs

Risk-analysis history

Duplicate exception prevention

REST API architecture

Prisma ORM with database migrations

AI Risk Analysis

The platform evaluates multiple operational signals to estimate order and supply-chain risk.

Risk signals include:

Inventory availability

Shipment status and delays

Supplier reliability

Order deadlines

Active supply-chain exceptions

The system produces:

Risk score

Risk severity

Risk factors

Recommended actions

Analysis history

Risk severity is classified as:

Risk Score

Severity

0–39

LOW

40–69

MEDIUM

70–89

HIGH

90–100

CRITICAL

Exception Detection

The platform automatically detects operational exceptions such as:

Low inventory

Shipment delays

Supplier reliability problems

Orders at risk

Exceptions can be reviewed and resolved from the control center.

The detection system also prevents repeatedly creating the same unresolved inventory exception for the same product and warehouse.

Architecture

                    ┌─────────────────────────┐
                    │     React Frontend      │
                    │      TypeScript         │
                    └────────────┬────────────┘
                                 │
                                 │ REST API
                                 ▼
                    ┌─────────────────────────┐
                    │   Express API Server    │
                    │       TypeScript        │
                    └───────┬─────────┬───────┘
                            │         │
                     Prisma │         │ Redis / Queue
                            │         ▼
                            │   ┌───────────────┐
                            │   │ Risk Analysis │
                            │   │    Worker     │
                            │   └───────────────┘
                            │
                            ▼
                    ┌─────────────────────────┐
                    │      PostgreSQL         │
                    │        Database         │
                    └─────────────────────────┘

Tech Stack

Frontend

React

TypeScript

Vite

CSS

Backend

Node.js

Express

TypeScript

REST APIs

JWT authentication

Role-based authorization

Database

PostgreSQL

Prisma ORM

Prisma migrations

Background Processing

Node.js

TypeScript

Queue-based asynchronous risk analysis

Project Structure

AI_Supply_Chain/
│
├── client/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── App.css
│   │   ├── ExceptionPage.tsx
│   │   ├── ExceptionPage.css
│   │   ├── InventoryPage.tsx
│   │   └── SupplierPage.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── server/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   │
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── queues/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   │
│   └── package.json
│
├── worker/
│   ├── prisma/
│   ├── src/
│   │   ├── config/
│   │   ├── queues/
│   │   ├── services/
│   │   └── workers/
│   │
│   └── package.json
│
└── README.md

Core Workflow

Order Created
     │
     ▼
Inventory / Supplier / Shipment Monitoring
     │
     ▼
Operational Event
     │
     ├───────────────┐
     ▼               ▼
Exception       Risk Analysis Job
Detection             │
     │                ▼
     │          Risk Calculation
     │                │
     │                ▼
     └──────────► Risk Result
                       │
                       ▼
                Control Center
                       │
              ┌────────┴────────┐
              ▼                 ▼
        Risk Factors       Recommendations

Local Development

Prerequisites

Make sure the following are installed:

Node.js

npm

PostgreSQL

Git

Clone

git clone https://github.com/UtkarshRode/ai-supply-chain-control-center.git
cd ai-supply-chain-control-center

Backend

cd server
npm install

Create a .env file using the required environment variables.

Run database migrations:

npx prisma migrate dev

Start the backend:

npm run dev

The API runs on:

http://localhost:5000

Worker

Open another terminal:

cd worker
npm install
npm run dev

The worker processes asynchronous risk-analysis jobs.

Frontend

Open another terminal:

cd client
npm install
npm run dev

The frontend runs on the Vite development server.

Environment Variables

Never commit real credentials or secrets.

Example configuration:

DATABASE_URL=your_database_connection_string
JWT_SECRET=your_jwt_secret
REDIS_URL=your_redis_connection_string

Use .env.example to document required variables without exposing real credentials.

API Modules

The backend provides REST endpoints for:

Authentication

Customers

Products

Orders

Shipments

Inventory

Suppliers

Warehouses

Exceptions

Risk analysis

Protected endpoints require authentication, while administrative operations additionally use role-based authorization.

Background Risk Processing

Risk analysis is handled asynchronously rather than blocking the API request.

For example:

Shipment Status Updated
          │
          ▼
      Risk Queue
          │
          ▼
     Worker receives job
          │
          ▼
   Risk Analysis Service
          │
          ▼
   Risk Analysis Saved

This allows operational API requests to remain responsive while risk calculations are processed independently.

Exception Lifecycle

Operational Problem
        │
        ▼
Exception Detection
        │
        ▼
Open Exception
        │
        ▼
Review in Control Center
        │
        ▼
Resolve Exception

Risk Analysis Lifecycle

Shipment / Inventory / Supplier / Order Event
                    │
                    ▼
               Risk Queue
                    │
                    ▼
              Worker Process
                    │
                    ▼
             Risk Calculation
                    │
                    ▼
          Risk Score + Severity
                    │
                    ▼
          Factors + Recommendations
                    │
                    ▼
             Control Center

Validation

The project has been tested across the main operational workflows:

Authentication

Orders

Shipments

Inventory

Suppliers

Exceptions

Exception detection

Exception resolution

Risk analysis

Background risk-analysis jobs

Frontend, backend, and worker production builds complete successfully.

Security

The repository excludes:

Environment files

Node modules

Build output

Logs

Local editor configuration

Real credentials and secrets should never be committed to the repository.

Future Improvements

Potential future enhancements include:

Real-time WebSocket notifications

Advanced demand forecasting

Predictive supplier failure modeling

Route optimization

Automated replenishment recommendations

Historical risk trend visualization

Cloud deployment

Monitoring and observability

More advanced ML-based risk prediction

License

This project is available under the MIT License.

Author

Utkarsh Rode

GitHub:

https://github.com/UtkarshRode

Repository:

https://github.com/UtkarshRode/ai-supply-chain-control-center
