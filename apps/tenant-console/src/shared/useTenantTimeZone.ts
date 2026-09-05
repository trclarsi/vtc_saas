import { useTenant } from "./useTenant";

const DEFAULT_TIME_ZONE = "Africa/Dakar";

export function useTenantTimeZone(): string {
  return useTenant()?.timeZone ?? DEFAULT_TIME_ZONE;
}
