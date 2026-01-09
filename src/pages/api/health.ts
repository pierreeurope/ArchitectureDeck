import type { NextApiRequest, NextApiResponse } from "next";

type HealthResponse = {
  status: "ok" | "error";
  timestamp: string;
  version: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthResponse>
) {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "0.1.0",
  });
}
