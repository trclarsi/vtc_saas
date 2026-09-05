import { delay, http, HttpResponse } from "msw";
import type { Driver, Reservation, User, Vehicle } from "@vtc/types";
import { API_BASE_URL } from "../apiBase";
import { drivers, generateId, reservations, setTenant, tenant, users, vehicles } from "./data";

const url = (path: string) => `${API_BASE_URL}${path}`;

function now(): string {
  return new Date().toISOString();
}

// Delai volontaire sur les listes (pas les mutations) -- rend visibles les
// squelettes de chargement construits en Partie 2/7 au lieu de repondre
// instantanement comme le ferait rarement un vrai backend.
const LIST_DELAY_MS = 400;

export const handlers = [
  // --- Drivers (Doc 04 §5) ---
  http.get(url("/drivers"), async () => {
    await delay(LIST_DELAY_MS);
    return HttpResponse.json(drivers);
  }),
  http.get(url("/drivers/:id"), ({ params }) => {
    const driver = drivers.find((d) => d.id === params.id);
    return driver ? HttpResponse.json(driver) : new HttpResponse(null, { status: 404 });
  }),
  http.post(url("/drivers"), async ({ request }) => {
    const input = (await request.json()) as Pick<Driver, "firstName" | "lastName" | "phone"> &
      Partial<Pick<Driver, "email" | "licenseNumber">>;
    const driver: Driver = {
      id: generateId("drv"),
      tenantId: tenant.id,
      userId: null,
      email: null,
      avatarUrl: null,
      licenseNumber: null,
      ...input,
      validationStatus: "en_attente",
      availabilityStatus: "hors_ligne",
      licenseExpiresAt: null,
      archivedAt: null,
      createdAt: now(),
      updatedAt: now(),
    };
    drivers.unshift(driver);
    return HttpResponse.json(driver, { status: 201 });
  }),
  http.patch(url("/drivers/:id"), async ({ params, request }) => {
    const driver = drivers.find((d) => d.id === params.id);
    if (!driver) return new HttpResponse(null, { status: 404 });
    const patch = (await request.json()) as Partial<Driver>;
    Object.assign(driver, patch, { updatedAt: now() });
    return HttpResponse.json(driver);
  }),
  http.patch(url("/drivers/:id/validate"), ({ params }) => {
    const driver = drivers.find((d) => d.id === params.id);
    if (!driver) return new HttpResponse(null, { status: 404 });
    driver.validationStatus = "valide";
    driver.updatedAt = now();
    return HttpResponse.json(driver);
  }),
  http.patch(url("/drivers/:id/archive"), ({ params }) => {
    const driver = drivers.find((d) => d.id === params.id);
    if (!driver) return new HttpResponse(null, { status: 404 });
    driver.archivedAt = now();
    driver.updatedAt = now();
    return HttpResponse.json(driver);
  }),
  http.patch(url("/drivers/:id/unarchive"), ({ params }) => {
    const driver = drivers.find((d) => d.id === params.id);
    if (!driver) return new HttpResponse(null, { status: 404 });
    driver.archivedAt = null;
    driver.updatedAt = now();
    return HttpResponse.json(driver);
  }),
  http.patch(url("/drivers/:id/reject"), ({ params }) => {
    const driver = drivers.find((d) => d.id === params.id);
    if (!driver) return new HttpResponse(null, { status: 404 });
    driver.validationStatus = "rejete";
    driver.updatedAt = now();
    return HttpResponse.json(driver);
  }),

  // --- Vehicles (Doc 04 §6) ---
  http.get(url("/vehicles"), async () => {
    await delay(LIST_DELAY_MS);
    return HttpResponse.json(vehicles);
  }),
  http.get(url("/vehicles/:id"), ({ params }) => {
    const vehicle = vehicles.find((v) => v.id === params.id);
    return vehicle ? HttpResponse.json(vehicle) : new HttpResponse(null, { status: 404 });
  }),
  http.patch(url("/vehicles/:id"), async ({ params, request }) => {
    const vehicle = vehicles.find((v) => v.id === params.id);
    if (!vehicle) return new HttpResponse(null, { status: 404 });
    const patch = (await request.json()) as Partial<Vehicle>;
    Object.assign(vehicle, patch, { updatedAt: now() });
    return HttpResponse.json(vehicle);
  }),
  http.post(url("/vehicles"), async ({ request }) => {
    const input = (await request.json()) as Pick<Vehicle, "plateNumber" | "brand" | "model">;
    const vehicle: Vehicle = {
      id: generateId("veh"),
      tenantId: tenant.id,
      ...input,
      status: "disponible",
      currentDriverId: null,
      insuranceExpiresAt: null,
      inspectionExpiresAt: null,
      createdAt: now(),
      updatedAt: now(),
    };
    vehicles.unshift(vehicle);
    return HttpResponse.json(vehicle, { status: 201 });
  }),
  http.patch(url("/vehicles/:id/status"), async ({ params, request }) => {
    const vehicle = vehicles.find((v) => v.id === params.id);
    if (!vehicle) return new HttpResponse(null, { status: 404 });
    const { status } = (await request.json()) as { status: Vehicle["status"] };
    vehicle.status = status;
    vehicle.updatedAt = now();
    return HttpResponse.json(vehicle);
  }),
  http.patch(url("/vehicles/:id/assign-driver"), async ({ params, request }) => {
    const vehicle = vehicles.find((v) => v.id === params.id);
    if (!vehicle) return new HttpResponse(null, { status: 404 });
    const { driverId } = (await request.json()) as { driverId: string | null };
    // Un chauffeur ne conduit qu'un seul vehicule a la fois -- le retirer de
    // celui qu'il conduisait avant plutot que de laisser deux vehicules
    // pointer sur le meme chauffeur.
    if (driverId) {
      for (const v of vehicles) {
        if (v.id !== vehicle.id && v.currentDriverId === driverId) {
          v.currentDriverId = null;
          v.updatedAt = now();
        }
      }
    }
    vehicle.currentDriverId = driverId;
    vehicle.updatedAt = now();
    return HttpResponse.json(vehicle);
  }),

  // --- Reservations (Doc 04 §7) ---
  http.get(url("/reservations"), async () => {
    await delay(LIST_DELAY_MS);
    return HttpResponse.json(reservations);
  }),
  http.get(url("/reservations/:id"), ({ params }) => {
    const reservation = reservations.find((r) => r.id === params.id);
    return reservation ? HttpResponse.json(reservation) : new HttpResponse(null, { status: 404 });
  }),
  http.patch(url("/reservations/:id/cancel"), ({ params }) => {
    const reservation = reservations.find((r) => r.id === params.id);
    if (!reservation) return new HttpResponse(null, { status: 404 });
    reservation.status = "annulee" as Reservation["status"];
    reservation.statusChangedAt = now();
    reservation.updatedAt = now();
    return HttpResponse.json(reservation);
  }),

  // --- Users (Doc 04 §4) ---
  http.get(url("/users/me"), () => {
    const me = users.find((u) => u.id === "dev-user")!;
    return HttpResponse.json(me);
  }),
  http.patch(url("/users/me"), async ({ request }) => {
    const patch = (await request.json()) as Pick<User, "firstName" | "lastName" | "avatarUrl">;
    const me = users.find((u) => u.id === "dev-user");
    if (!me) return new HttpResponse(null, { status: 404 });
    Object.assign(me, patch, { updatedAt: now() });
    return HttpResponse.json(me);
  }),
  http.get(url("/users"), async () => {
    await delay(LIST_DELAY_MS);
    return HttpResponse.json(users);
  }),
  http.post(url("/users/invite"), async ({ request }) => {
    const input = (await request.json()) as { email: string; firstName: string; lastName: string };
    const user: User = {
      id: generateId("usr"),
      tenantId: tenant.id,
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      avatarUrl: null,
      status: "invite",
      createdAt: now(),
      updatedAt: now(),
    };
    users.unshift(user);
    return HttpResponse.json(user, { status: 201 });
  }),

  // --- Tenant (Doc 04 §3) ---
  http.get(url("/tenant"), () => HttpResponse.json(tenant)),
  http.patch(url("/tenant"), async ({ request }) => {
    const patch = (await request.json()) as Pick<
      typeof tenant,
      "name" | "currency" | "branding" | "timeZone" | "defaultPhonePrefix"
    >;
    const updated = { ...tenant, ...patch, updatedAt: now() };
    setTenant(updated);
    return HttpResponse.json(updated);
  }),
];
