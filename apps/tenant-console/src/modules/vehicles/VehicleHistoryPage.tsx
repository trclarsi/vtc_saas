import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download } from "lucide-react";
import { PageHeader, Card, DataTable, WaypointTracker, Button, ErrorState, TableSkeleton } from "@vtc/ui";
import type { Reservation } from "@vtc/types";
import { apiClient } from "../../api";
import { formatDateTime } from "../../shared/formatDateTime";
import { useTenantTimeZone } from "../../shared/useTenantTimeZone";
import { STATUS_LABELS } from "../reservations/reservationLabels";

// Echappe pour CSV (RFC 4180) -- entoure de guillemets si la valeur contient
// une virgule, un guillemet ou un retour a la ligne, double les guillemets internes.
function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  // BOM UTF-8 -- Excel (tres repandu chez nos utilisateurs) interprete mal
  // les accents francais sans lui, meme si le fichier est deja en UTF-8.
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// Miroir de DriverHistoryPage -- meme raisonnement : vue dediee plutot qu'une
// carte sur la fiche detail, pour ne pas la surcharger, et parce qu'un
// export n'a de sens que sur sa propre page.
export function VehicleHistoryPage() {
  const { id } = useParams<{ id: string }>();
  const timeZone = useTenantTimeZone();
  const { data: vehicle } = useQuery({
    queryKey: ["vehicles", id],
    queryFn: () => apiClient.vehicles.get(id!),
    enabled: !!id,
  });
  const { data: reservations, isLoading, isError, refetch } = useQuery({
    queryKey: ["reservations"],
    queryFn: apiClient.reservations.list,
  });

  const vehicleReservations = useMemo(
    () =>
      (reservations ?? [])
        .filter((r) => r.vehicleId === id)
        .sort((a, b) => b.scheduledStart.localeCompare(a.scheduledStart)),
    [reservations, id],
  );

  function handleDownload() {
    const rows: string[][] = [
      ["Départ", "Arrivée", "Statut"],
      ...vehicleReservations.map((r) => [
        formatDateTime(r.scheduledStart, timeZone),
        formatDateTime(r.scheduledEnd, timeZone),
        STATUS_LABELS[r.status].label,
      ]),
    ];
    downloadCsv(`historique-courses-${vehicle?.plateNumber ?? id}.csv`, rows);
  }

  return (
    <div>
      <Link
        to={`/vehicles/${id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-neutral hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {vehicle?.plateNumber ?? "Véhicule"}
      </Link>

      <PageHeader
        eyebrow="Historique"
        title={vehicle ? `Courses — ${vehicle.plateNumber}` : "Courses"}
        actions={
          <Button variant="secondary" onClick={handleDownload} disabled={vehicleReservations.length === 0}>
            <Download size={15} />
            Télécharger
          </Button>
        }
      />

      <Card>
        {isError ? (
          <ErrorState title="Impossible de charger l'historique" onRetry={() => refetch()} />
        ) : isLoading ? (
          <TableSkeleton columns={3} />
        ) : (
          <DataTable<Reservation>
            rows={vehicleReservations}
            emptyTitle="Aucune course"
            emptyHint="Ce véhicule n'a encore effectué aucune course."
            columns={[
              {
                header: "Départ",
                render: (r) => formatDateTime(r.scheduledStart, timeZone),
                sortKey: (r) => r.scheduledStart,
              },
              {
                header: "Arrivée",
                render: (r) => formatDateTime(r.scheduledEnd, timeZone),
                sortKey: (r) => r.scheduledEnd,
              },
              {
                header: "Statut",
                render: (r) => <WaypointTracker status={r.status} />,
                sortKey: (r) => r.status,
              },
            ]}
          />
        )}
      </Card>
    </div>
  );
}
