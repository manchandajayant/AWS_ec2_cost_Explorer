# Elastic Observer - Technical Guide

[APP LIVE HERE](https://tracer-dashboard-orcin.vercel.app/)

## Introduction :

This document provides a technical overview of Elastic Observer, an EC2 Observability Prototype, built with Next.js and TypeScript.

![Overview 1](./over1.png)  
![Overview 2](./over2.png)  
![Overview 3](./over3.png)

## Settings :

An AWS account with programmatic access (API Key and Secret)

Configured AWS IAM role with read-only permissions for EC2, CloudWatch, and Cost Explorer.

Configure Environment Variables:  
Create a `.env.local` file in the root of the project and add your AWS credentials.

```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=your_default_region

USE_MOCK=1
NEXT_PUBLIC_USE_MOCK=1
```

## REPOSITORY

**Repository Structure**
The main structure for our use case is built across

src/
├── app/
│ ├── api/ # AWS & Mock API routes
│ └── screens/ # Main pages: Overview, Cost Attributions, EC2 Table
├── components/ # Reusable UI components
├── context/ # Global state: CostContext, EC2Context, Filters
└── utils/ # Helper functions (date utils, formatting)

## DATA

**Note on mock data** :
To design a decent product system, a big part of this task was to understand how AWS handled cost explorer API and other ec2 instance realted API's. For this a solid set of data was really important. Rather than setup mock-data files, I setup a mock database system which mostly mimicked the AWS API barring some changes.

### How Mock Data Was Generated

The mock cost data is **deterministic** and designed to look realistic while mirroring AWS Cost Explorer’s shape.

-   **Instances** are loaded from `synthetic-ec2-data.json` with IDs, types, regions, tags, and launch times.
-   **Profiles** (`Idle`, `Under Utilized`, `Optimal`, `Over Utilized`) are inferred from instance family, tags, and a seeded random jitter.
-   **CPU, memory, uptime, and infra signals** (EBS type/size, NAT, ALB, Elastic IP) are generated per instance to simulate real usage.
-   **Daily/Monthly costs** are computed by iterating periods, capping hours by profile uptime, multiplying by hourly prices, and adding storage, network, and infra charges.
-   **Anomalies**: 15% of days are “spike days,” with compute cost multiplied 3×–7× to create realistic cost spikes.
-   **Filters and grouping** follow AWS Cost Explorer semantics for region, instance type, tags, and usage type.
-   All randomness is **seeded**, ensuring the same inputs always produce the same results.
