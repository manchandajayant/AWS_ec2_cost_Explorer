tracer_dashboard
================

AWS EC2 Instances Integration
-----------------------------

The Instances page now fetches real EC2 instances from your AWS account via a Next.js API route.

Environment variables (set for `next dev`/`next start`):
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_SESSION_TOKEN` (if using temporary creds)
- `AWS_REGION` (single region) or `AWS_REGIONS` (comma-separated, e.g. `us-east-1,us-west-2`)

API
- `GET /api/ec2/instances` returns `{ instances: Ec2Instance[] }` where each instance contains id, type, region, state, launchTime, project. CPU/RAM/GPU are placeholders (0) for now.

Notes
- Tag `Project` (or `project`/`Name`) populates the Project column.
- CPU/RAM/GPU and waste scoring can be wired to CloudWatch in a follow‑up.
