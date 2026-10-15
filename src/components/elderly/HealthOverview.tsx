import type { Health } from "../../types/elderCare";
import { activityStatus, heartRateStatus, riskStatus, sleepStatus, valueOrDash } from "../../lib/healthStatus";
import Badge from "../ui/Badge";
import Card from "../ui/Card";

interface HealthOverviewProps {
  health: Health;
}

function HealthOverview({ health }: HealthOverviewProps) {
  const hr = heartRateStatus(health.heartRate);
  const activity = activityStatus(health.activity);
  const sleep = sleepStatus(health.sleep);
  const risk = riskStatus(health.risk);

  return (
    <Card
      className="mb-6 grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4"
      aria-label="Ringkasan kondisi kesehatan lansia"
    >
      <div className="p-5">
        <p className="text-sm text-muted">Detak Jantung</p>

        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="font-serif text-3xl text-ink">{valueOrDash(health.heartRate)}</span>
          <span className="text-xs text-muted">{health.heartRateUnit}</span>
        </div>

        <Badge variant={hr.variant} className="mt-3">
          {hr.label}
        </Badge>
      </div>

      <div className="p-5">
        <p className="text-sm text-muted">Aktivitas</p>

        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="font-serif text-3xl text-ink">{health.activity}</span>
          <span className="text-xs text-muted">%, hari ini</span>
        </div>

        <Badge variant={activity.variant} className="mt-3">
          {activity.label}
        </Badge>
      </div>

      <div className="p-5">
        <p className="text-sm text-muted">Durasi Tidur</p>

        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="font-serif text-3xl text-ink">{valueOrDash(health.sleep)}</span>
          <span className="text-xs text-muted">{health.sleepUnit}</span>
        </div>

        <Badge variant={sleep.variant} className="mt-3">
          {sleep.label}
        </Badge>
      </div>

      <div className="p-5">
        <p className="text-sm text-muted">Tingkat Risiko</p>

        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="font-serif text-3xl text-ink">{health.risk}</span>
        </div>

        <Badge variant={risk.variant} className="mt-3">
          {risk.label}
        </Badge>
      </div>
    </Card>
  );
}

export default HealthOverview;
