import type { Device } from "../../types/elderCare";
import Badge from "../ui/Badge";
import Card from "../ui/Card";

interface DeviceStatusProps {
  devices: Device[];
}

function DeviceStatus({ devices }: DeviceStatusProps) {
  return (
    <Card className="p-6">
      <header className="mb-4">
        <h2 className="font-serif text-lg text-ink">Status Perangkat</h2>

        <p className="mt-1 text-sm text-muted">Perangkat yang mengirimkan data monitoring.</p>
      </header>

      <div className="divide-y divide-border">
        {devices.map((device) => (
          <article
            key={device.id}
            className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0"
          >
            <div>
              <h3 className="text-sm font-semibold text-ink-soft">{device.name}</h3>

              <p className="mt-1 text-xs text-muted">{device.description}</p>
            </div>

            <Badge variant="success">{device.status}</Badge>
          </article>
        ))}
      </div>
    </Card>
  );
}

export default DeviceStatus;
