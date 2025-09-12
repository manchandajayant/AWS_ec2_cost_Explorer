// test_str = """
// # Totals (last 30 days, daily)
// curl -s http://localhost:3000/api/cost/summary | jq

// # Breakdown by region (monthly)
// curl -s "http://localhost:3000/api/cost/breakdown?groupBy=REGION&granularity=MONTHLY" | jq

// # Breakdown by instance type, filtered to eu-north-1
// curl -s "http://localhost:3000/api/cost/breakdown?groupBy=INSTANCE_TYPE&filters=%7B%22REGION%22%3A%5B%22eu-north-1%22%5D%7D" | jq

// # Attribution by Team tag
// curl -s "http://localhost:3000/api/cost/attribution?tag=Team&start=2025-08-01&end=2025-09-11" | jq

// # List instance families seen by CE
// curl -s "http://localhost:3000/api/cost/dimensions?key=INSTANCE_FAMILY" | jq

// # List values for JobId tag
// curl -s "http://localhost:3000/api/cost/tags?key=JobId" | jq
// """
