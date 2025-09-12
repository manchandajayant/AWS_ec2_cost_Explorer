// A standalone script to test the consistency of the mock cost API endpoints.
// To run: `node cost-api-test.mjs`

const BASE_URL = "http://localhost:3000/api/cost";
const MOCK_FLAG = "mock=1"; // Ensures we are always hitting the mock API

// --- Test Configuration ---
const TEST_PERIOD = {
    // A full month to test daily vs monthly granularity
    start: "2025-08-01",
    end: "2025-09-01",
};

// --- Helper Functions ---

// Replicates the buildQS function from your CostProvider for consistency
const buildQS = (params) =>
    Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join("&");

// A simple fetch wrapper
async function apiGet(path, params = {}) {
    const qs = buildQS(params);
    const url = `${BASE_URL}${path}?${MOCK_FLAG}&${qs}`;
    try {
        const res = await fetch(url);
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`HTTP ${res.status} on ${url} - ${text}`);
        }
        return await res.json();
    } catch (err) {
        console.error(`❌ Fetch failed for ${url}`, err);
        throw err;
    }
}

// Logging helpers for clear results
const log = {
    info: (msg) => console.log(`\nℹ️  ${msg}`),
    pass: (msg) => console.log(`✅ PASS: ${msg}`),
    fail: (msg, expected, actual) => {
        console.error(`❌ FAIL: ${msg}`);
        console.error(`   - Expected: ${expected}`);
        console.error(`   - Actual:   ${actual}`);
    },
};

// Helper for comparing floating point numbers
function areFloatsEqual(num1, num2, epsilon = 1e-5) {
    return Math.abs(num1 - num2) < epsilon;
}

// --- Main Test Runner ---

async function runTests() {
    console.log(`🚀 Starting Cost API consistency tests for ${TEST_PERIOD.start} to ${TEST_PERIOD.end}...`);

    // Test 1: Daily vs. Monthly Granularity
    log.info("Running Test 1: Daily vs. Monthly Summary Totals...");
    try {
        const monthlySummary = await apiGet("/summary", { ...TEST_PERIOD, granularity: "MONTHLY" });
        const dailySummary = await apiGet("/summary", { ...TEST_PERIOD, granularity: "DAILY" });

        const monthlyTotal = monthlySummary.total;
        const sumOfDailyTotals = dailySummary.byTime.reduce((sum, day) => sum + day.amount, 0);

        if (areFloatsEqual(monthlyTotal, sumOfDailyTotals)) {
            log.pass(`Monthly total matches the sum of daily totals. ($${monthlyTotal.toFixed(2)})`);
        } else {
            log.fail("Monthly total does NOT match the sum of daily totals.", monthlyTotal.toFixed(6), sumOfDailyTotals.toFixed(6));
        }
    } catch (e) { /* Error already logged by apiGet */ }


    // Test 2: Summary vs. Breakdown Total
    log.info("Running Test 2: Summary vs. Breakdown Totals...");
    try {
        const summary = await apiGet("/summary", { ...TEST_PERIOD, granularity: "MONTHLY" });
        const breakdown = await apiGet("/breakdown", { ...TEST_PERIOD, granularity: "MONTHLY", groupBy: "REGION" });

        const summaryTotal = summary.total;
        const sumOfBreakdownRows = breakdown.rows.reduce((sum, row) => sum + row.amount, 0);

        if (areFloatsEqual(summaryTotal, sumOfBreakdownRows)) {
            log.pass(`Summary total matches the sum of breakdown rows. ($${summaryTotal.toFixed(2)})`);
        } else {
            log.fail("Summary total does NOT match the sum of breakdown rows.", summaryTotal.toFixed(6), sumOfBreakdownRows.toFixed(6));
        }
    } catch (e) { /* Error already logged */ }


    // Test 3: Attribution Logic
    log.info("Running Test 3: Attribution Logic (total = attributed + unaccounted)...");
    try {
        const attribution = await apiGet("/attribution", { ...TEST_PERIOD, tag: "Team" });
        const { total, attributed, unaccounted } = attribution;
        const sumOfParts = attributed + unaccounted;

        if (areFloatsEqual(total, sumOfParts)) {
            log.pass(`Attribution total ($${total.toFixed(2)}) matches sum of parts ($${sumOfParts.toFixed(2)}).`);
        } else {
            log.fail("Attribution total does NOT match attributed + unaccounted.", total.toFixed(6), sumOfParts.toFixed(6));
        }
    } catch (e) { /* Error already logged */ }


    // Test 4: Dimension & Tag Coherency
    log.info("Running Test 4: Dimension and Tag values are coherent...");
    try {
        const regionDimension = await apiGet("/dimensions", { ...TEST_PERIOD, key: "REGION" });
        const regionBreakdown = await apiGet("/breakdown", { ...TEST_PERIOD, groupBy: "REGION" });
        const breakdownRegions = new Set(regionBreakdown.rows.map(r => r.keys[0]));
        const missingRegions = regionDimension.values.filter(v => !breakdownRegions.has(v));
        if (missingRegions.length === 0) {
            log.pass("All REGION dimension values appear in the breakdown data.");
        } else {
            log.fail("Some REGION dimension values are missing from breakdown data.", "[]", JSON.stringify(missingRegions));
        }
    } catch (e) { /* Error already logged */ }

    console.log("\n🏁 Tests complete.");
}

runTests();