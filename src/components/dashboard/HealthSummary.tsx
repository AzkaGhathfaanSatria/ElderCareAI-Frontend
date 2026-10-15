import type { Health } from "../../types/elderCare";
import Badge from "../ui/Badge";
import { activityStatus, heartRateStatus, riskStatus, sleepStatus, valueOrDash } from "../../lib/healthStatus";
import Card from "../ui/Card";

interface HealthSummaryProps {
  health: Health;
}

function HealthSummary({ health }: HealthSummaryProps) {
  const hr = heartRateStatus(health.heartRate);
  const activity = activityStatus(health.activity);
  const sleep = sleepStatus(health.sleep);
  const risk = riskStatus(health.risk);

  return (
    <section
      className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      aria-label="Ringkasan kesehatan lansia"
    >
      <Card className="p-5">
        <p className="text-sm text-muted">Detak Jantung</p>

        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold text-ink">{valueOrDash(health.heartRate)}</p>

            <p className="mt-1 text-xs text-muted">{health.heartRateUnit}</p>
          </div>

          <Badge variant={hr.variant}>{hr.label}</Badge>
        </div>
      </Card>

      <Card className="p-5">
        <p className="text-sm text-muted">Aktivitas</p>

        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold text-ink">{health.activity}%</p>

            <p className="mt-1 text-xs text-muted">Hari ini</p>
          </div>

          <Badge variant={activity.variant}>{activity.label}</Badge>
        </div>
      </Card>

      <Card className="p-5">
        <p className="text-sm text-muted">Durasi Tidur</p>

        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold text-ink">{valueOrDash(health.sleep)}</p>

            <p className="mt-1 text-xs text-muted">{health.sleepUnit}</p>
          </div>

          <Badge variant={sleep.variant}>{sleep.label}</Badge>
        </div>
      </Card>

      <Card className="p-5">
        <p className="text-sm text-muted">Status Risiko</p>

        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="text-2xl font-bold text-ink">{health.risk}</p>

            <p className="mt-1 text-xs text-muted">Berdasarkan monitoring</p>
          </div>

          <Badge variant={risk.variant}>{risk.label}</Badge>
        </div>
      </Card>
    </section>
  );
}

export default HealthSummary;
