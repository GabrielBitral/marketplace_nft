export type ScenarioName = "connection-interrupted" | "network-unavailable" | "out-of-order" | "payment-refused" | "quote-changed" | "slow-quote" | "stale-events" | "timeout-after-order" | "variable-latency";

const delays: Record<string, number> = {
  "slow-quote": 1_600,
  "out-of-order:first": 500,
  "out-of-order:next": 60,
};

export const getScenario = (headers: Headers) => headers.get("x-kurio-scenario") as ScenarioName | null;

export const waitForScenario = async (scenario: ScenarioName | null, key?: string) => {
  const delay = scenario === "out-of-order"
    ? delays[`out-of-order:${key === "first" ? "first" : "next"}`]
    : scenario ? delays[scenario] : undefined;
  if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
};

export const isUnavailableScenario = (scenario: ScenarioName | null) => scenario === "network-unavailable";
