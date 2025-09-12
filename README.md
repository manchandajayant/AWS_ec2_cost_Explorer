# Elastic Observer - Technical Guide

## Introduction :

This document provides a technical overview of Elastic Oberver, an EC2 Observability Prototype, built with Next.js, typescript.

![[Screenshot 2025-09-12 at 11.47.37 PM.png]]

![[Screenshot 2025-09-12 at 11.47.55 PM.png]]

![[Screenshot 2025-09-12 at 11.48.10 PM.png]]

## Settings :

An AWS account with programmatic access (API Key and Secret)

Configured AWS IAM role with read-only permissions for EC2, CloudWatch, and Cost Explorer.

Configure Environment Variables:
Create a .env.local file in the root of the project and add your AWS credentials.

AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=your_default_region

The above lets you run the code with AWS access keys, however the code also runs with a configured mock API for mock data, just make all the below keys as 1 for them to work in your .env.local file
USE_MOCK=1
NEXT_PUBLIC_USE_MOCK=1

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

## Core Components

### EC2 Instance Utilisation Table

This table provides a detailed, at-a-glance view of all running EC2 instances.

**Features:**

-   **Columns:** ID, Wastage Status, Instance Type, Region
-   **Sub-metrics:** CPU, RAM, GPU, Uptime, Memory, Cost/hour
-   **Visual cues:** Color-coded bars to indicate Idle, Under-utilized, Optimal, Over-utilized
-   **Sorting & Filtering:** By region, instance type, and utilisation status
-   **Waste Indicator:** Flags instances with consistently low CPU usage over long uptimes

**Creative Element:**  
I implemented a **utilisation score** using a simple heuristic that combines CPU usage, memory usage, and uptime coverage. This approach allows bioinformaticians to quickly spot cost-driving idle or oversized instances without performing manual calculations.

I initially considered applying an **unsupervised algorithm** such as k-means clustering to automatically group instances by utilization patterns. However, I decided against it, as clustering can introduce complexity and make the results less transparent without a strong, well-communicated rationale for how clusters are defined.

By using a heuristic-based scoring system, the classification should remain **interpretable and actionable**, helping users make confident infrastructure decisions with minimal cognitive overhead.

**INSTANCES TABLE VIEW**
![[Screenshot 2025-09-12 at 10.54.12 PM.png]]

**INSTANCES FILTER**
![[Screenshot 2025-09-12 at 11.06.19 PM.png]]

**INSTANCES SUB METRICS(CPU, MEMORY etc.)**
![[Screenshot 2025-09-12 at 11.06.45 PM.png]]

---

### Cost Attribution Panel

This panel helps users understand **how EC2 costs map back** to scientific jobs, teams, or infrastructure dimensions.

**Features:**

-   **Breakdowns:** Group costs by **Region**, **Instance Type**, **Usage Type**
-   **Views:** Toggle between **Bar** and **Line** charts for time-series or categorical comparison
-   **Comparison:** **Month-over-Month** comparison for the same grouping
-   **Filters:** Multi-select **Tag values** and **Dimension values** that persist across the panel
-   **Totals:** Clear separation of **Total**, **Attributed**, and **Unaccounted** cost for Tags

**Visual cues & anomaly handling:**

-   **Spikes:** Local spike detection highlights pronounced peaks (value > ~1.5× neighboring mean)
-   **Future estimates:** Future periods render as **dashed lines** or **outlined bars** with a banner note

**Totals explained:**

-   **Total** — Sum of all costs for the selected range and filters
-   **Attributed** — Portion matched to the selected **Tag key** (e.g., `Team`)
-   **Unaccounted** — Portion **without that tag**, surfacing data-hygiene gaps for chargeback/showback

**Why these metadata dimensions:**

Region-based deployments, usage types (such as CloudFront data transfers), and instance sizes are key drivers of cloud costs. These dimensions make it easier to pinpoint where optimizations can have the most impact — for example, consolidating workloads in fewer regions or right-sizing instance families.

Additionally, **Team** and **Project** tags could be assumed as critical for collaborative research environments, enabling teams to attribute costs to the right workflows or departments.

The UI intentionally limits grouping and filtering options to these key dimensions, helping users reach conclusions quickly without being overwhelmed by too many variables.

**COST ATTRIBUTION COMPONENT**
(Overview with line chart)
![[Screenshot 2025-09-12 at 11.13.29 PM.png]]

**COST ATTRIBUTION COMPONENT**
(Overview with bar chart)
![[Screenshot 2025-09-12 at 11.13.44 PM.png]]

**COST ATTRIBUTION COMPONENT**
(Overview with tag filters)
![[Screenshot 2025-09-12 at 11.14.04 PM.png]]

**COST ATTRIBUTION COMPONENT**
(Comparision with line chart)
![[Screenshot 2025-09-12 at 11.14.17 PM.png]]

---

### Live Cloud Cost Overview

This panel sits at the top of the dashboard and provides an overall summary to the user.

**Features:**  
This section is divided into two parts:

**First part shows:**

-   **KPIs:** Total Cost (MTD), Daily Burn (7-day average), Projected Monthly Spend
-   **Trend:** 7-day line chart of daily cost
-   **Anomaly Cues:** Highlights spikes (≥ ~2σ) with red points and a callout list of spike dates and amounts.
    -   Mean and standard deviation across the 7-day values are computed, and points with `(v - mean)/sd > 2` are flagged.
    -   Spikes are visually emphasised (larger red points) and listed in **SpikeCallouts**.

**Second part shows:**

-   **Risk Strip:** A compact bar chart of instance utilisation states (Idle / Under / Optimal / Over / Unknown), plus an alert summarising the count of potentially cost-driving instances (Idle + Under + Over).
-   **SpikeCallouts:** A lightweight anomaly panel listing outlier days so decision-makers can act quickly without combing through the entire chart.

These two elements were chosen to give the user a high-level, quick view of what might be going wrong.  
I used static data for the anomaly detection chart since neither the mock data nor the AWS data produced a clear spike during testing.

**OVERVIEW COMPONENT**
![[Screenshot 2025-09-12 at 11.30.26 PM.png]]
