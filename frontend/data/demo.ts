import type { DemoRun } from "../types/demo";

export const DEMO_RUNS: DemoRun[] = [
  {
    id: "run_001",
    model: "RandomForest",
    dataset: "iris",
    status: "completed",
    accuracy: 0.96,
    createdAt: "2026-02-10",
  },
  {
    id: "run_002",
    model: "XGBoost",
    dataset: "wine",
    status: "running",
    accuracy: 0.0,
    createdAt: "2026-02-12",
  },
  {
    id: "run_003",
    model: "LogisticRegression",
    dataset: "breast-cancer",
    status: "queued",
    accuracy: 0.0,
    createdAt: "2026-02-15",
  },
  {
    id: "run_004",
    model: "SVM",
    dataset: "digits",
    status: "failed",
    accuracy: 0.0,
    createdAt: "2026-02-16",
  },
];
