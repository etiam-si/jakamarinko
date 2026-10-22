import { Hono } from "hono";
import { type ConversionReport, ConversionReportQuery } from "@jakamarinko/api";
import { requireRole } from "../lib/auth";
import { validate } from "../lib/validate";
import { conversionReport } from "./report";

// The owner's report of where paying customers come from.
export const conversions = new Hono().get("/report", requireRole("owner"), validate("query", ConversionReportQuery), async (c) =>
  c.json<ConversionReport>(await conversionReport(c.req.valid("query"))),
);
