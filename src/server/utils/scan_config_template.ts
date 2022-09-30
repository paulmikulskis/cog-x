import { z } from "zod";
import { filterModes } from "./enums";
import { removalTypes } from "./enums";

export const ScanConfig = z.object({
  filter_mode: z.enum(filterModes),
  filter_subMode: z.string().optional(),
  removal_type: z.enum(removalTypes),
});

export const AuthConfig = z.object({
  uuid: z.string(),
  password: z.string(),
});
