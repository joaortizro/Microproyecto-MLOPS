export type DemoRunStatus = "queued" | "running" | "completed" | "failed";

export type DemoRun = {
  id: string;
  model: string;
  dataset: string;
  status: DemoRunStatus;
  accuracy: number; // 0..1
  createdAt: string; // YYYY-MM-DD (demo)
};
