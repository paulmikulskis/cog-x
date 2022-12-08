/* eslint-disable prettier/prettier */
import { z } from "zod"
import { HealthCheckBody } from "../server/integrated_functions/healthcheck"

export const exampleFunctionBody = z.object({
  miles: z.number(),
})

// IMPORTANT:
// add all functionats that you want to be call via the /scheduler endpoint HERE:
export const scheduleableFunctions = z.union([
  exampleFunctionBody,
  HealthCheckBody
  ]) // .. they will be imported later into the scheduler as acceptable bodies (security measure)

export const SchedulerBody = z.object({
  workflowName: z.string().min(3),
  user: z.string().optional(),
  cron: z.string(),
  functionName: z.string(),
  body: scheduleableFunctions,
  calls: z.record(z.string(), z.any()).optional()
})