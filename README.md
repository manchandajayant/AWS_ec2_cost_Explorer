# Elastic Observer - Technical Guide

[APP LIVE HERE](https://tracer-dashboard-orcin.vercel.app/)

## Introduction :

This document provides a technical overview of Elastic Observer, an EC2 Observability Prototype, built with Next.js and TypeScript.

<img width="1680" height="946" alt="over1" src="https://github.com/user-attachments/assets/802aafb1-56b3-421c-80f7-bc5d1b33d31a" />
<img width="1680" height="943" alt="over2" src="https://github.com/user-attachments/assets/05740dae-dc19-4e6f-9573-ed55b4e4b4ad" />
<img width="1680" height="946" alt="over3" src="https://github.com/user-attachments/assets/b94ad292-d360-4df4-915f-6e66308860b2" />

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

<pre> ```txt src/ ├── app/ │ ├── api/ – AWS & Mock API routes │ └── screens/ – Main pages: Overview, Cost Attributions, EC2 Table ├── components/ – Reusable UI components ├── context/ – Global state: CostContext, EC2Context, Filters └── utils/ – Helper functions (date utils, formatting) ``` </pre>

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
