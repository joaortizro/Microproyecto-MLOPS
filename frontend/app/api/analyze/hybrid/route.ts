import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const backendBaseUrl = (process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");

  if (!backendBaseUrl) {
    return NextResponse.json(
      {
        detail:
          "Missing backend URL. Set API_BASE_URL (preferred) or NEXT_PUBLIC_API_BASE_URL in the environment.",
      },
      { status: 500 }
    );
  }

  const response = await fetch(`${backendBaseUrl}/analyze/hybrid`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const raw = await response.text();
  let data: unknown = {};
  try {
    data = raw ? (JSON.parse(raw) as unknown) : {};
  } catch {
    data = { detail: raw || "Upstream returned a non-JSON response." };
  }

  return NextResponse.json(data, { status: response.status });
}
