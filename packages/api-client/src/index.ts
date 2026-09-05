import { HttpClient, type HttpClientConfig } from "./http";
import { createDriversResource } from "./resources/drivers";
import { createVehiclesResource } from "./resources/vehicles";
import { createReservationsResource } from "./resources/reservations";
import { createUsersResource } from "./resources/users";
import { createTenantResource } from "./resources/tenant";

export { ApiError } from "./http";
export type { HttpClientConfig } from "./http";

export function createApiClient(config: HttpClientConfig) {
  const http = new HttpClient(config);
  return {
    drivers: createDriversResource(http),
    vehicles: createVehiclesResource(http),
    reservations: createReservationsResource(http),
    users: createUsersResource(http),
    tenant: createTenantResource(http),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
