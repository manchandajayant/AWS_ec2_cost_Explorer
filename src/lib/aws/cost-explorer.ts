import { CostExplorerClient, Expression, GetCostAndUsageCommand, GetCostAndUsageCommandInput, GetTagsCommand, GetTagsCommandInput, GroupDefinition } from "@aws-sdk/client-cost-explorer";
import { CostBreakdownResult, CostQuery, FilterClause, GroupKey } from "./Types/cost-explorer-types";

const ce = new CostExplorerClient({ region: process.env.AWS_COST_REGION || process.env.AWS_REGION || "us-east-1" });

function buildGroupDefinitions(keys: GroupKey[]): GroupDefinition[] {
    // allows a maximum of 2 group-by keys.
    return keys.slice(0, 2).map((k) => {
        if (k.startsWith("TAG:")) {
            const tagKey = k.split(":")[1];
            return { Type: "TAG", Key: tagKey };
        }
        return { Type: "DIMENSION", Key: k };
    });
}

/** Build a CE Expression (AND of simple dimension/tag filters) */
function buildExpression(filters?: FilterClause[]): Expression | undefined {
    if (!filters || filters.length === 0) return undefined;

    const parts: Expression[] = filters.map((f) => {
        if (f.type === "DIMENSION") {
            return {
                Dimensions: {
                    Key: f.key,
                    Values: f.values,
                },
            };
        }
        // TAG filter
        return {
            Tags: {
                Key: f.key,
                Values: f.values,
            },
        };
    });

    // If there's only one filter, it shouldn't be wrapped in an "And"
    if (parts.length === 1) return parts[0];

    return { And: parts };
}

/** * Paginated CE call for GetCostAndUsage.
 * This function handles pagination automatically, fetching all pages of results.
 */
export async function getCostAndUsageAll(query: CostQuery): Promise<CostBreakdownResult> {
    const { start, end, granularity, groupBy, filters, metrics = ["UnblendedCost"] } = query;

    const GroupBy = buildGroupDefinitions(groupBy);
    const Filter = buildExpression(filters);

    const inputBase: Omit<GetCostAndUsageCommandInput, "NextPageToken"> = {
        Granularity: granularity,
        TimePeriod: { Start: start, End: end },
        Metrics: metrics,
        GroupBy,
        Filter,
    };

    let NextPageToken: string | undefined = undefined;
    const allResults: CostBreakdownResult["ResultsByTime"] = [];

    try {
        do {
            const input: GetCostAndUsageCommandInput = { ...inputBase, NextPageToken };
            const command = new GetCostAndUsageCommand(input);
            const output = await ce.send(command);

            if (output.ResultsByTime) {
                allResults.push(...output.ResultsByTime);
            }
            NextPageToken = output.NextPageToken;
        } while (NextPageToken);

        return { ResultsByTime: allResults, GroupDefinitions: GroupBy };
    } catch (error) {
        console.error("Error fetching AWS Cost and Usage data:", error);
        throw new Error(`Failed to get cost and usage data: ${(error as Error).message}`);
    }
}

/** Small helper: turn CE group keys into a readable label string. */
export function formatGroupKey(keys?: string[]): string {
    if (!keys || keys.length === 0) return "Total";

    // For tags, CE returns like "team$ML", "project$RNA-Seq-Batch", or "team$" for untagged items
    if (keys.length === 1 && keys[0].includes("$")) {
        const [tag, val] = keys[0].split("$");
        // Return the value, or a placeholder for untagged resources
        return val || `Untagged ${tag}`;
    }

    return keys.join(" / ");
}

/**
 * List available cost allocation tag KEYS used in the account during the period.
 */
export async function getTagKeys(start: string, end: string, search?: string): Promise<string[]> {
    const input: GetTagsCommandInput = {
        TimePeriod: { Start: start, End: end },
        SearchString: search,
    };
    try {
        const output = await ce.send(new GetTagsCommand(input));
        return output.Tags || [];
    } catch (error) {
        console.error("Error fetching tag keys:", error);
        throw new Error(`Failed to get tag keys: ${(error as Error).message}`);
    }
}

/**
 * List VALUES for a specific tag key within the period.
 */
export async function getTagValues(tagKey: string, start: string, end: string, search?: string): Promise<string[]> {
    const input: GetTagsCommandInput = {
        TimePeriod: { Start: start, End: end },
        TagKey: tagKey,
        SearchString: search,
    };
    try {
        const output = await ce.send(new GetTagsCommand(input));
        return output.Tags || [];
    } catch (error) {
        console.error(`Error fetching values for tag ${tagKey}:`, error);
        throw new Error(`Failed to get tag values: ${(error as Error).message}`);
    }
}
