import type { Elderly } from "../../types/elderCare";

interface ElderlyProfileProps {
  elderly: Elderly;
}

function ElderlyProfile({ elderly }: ElderlyProfileProps) {
  return (
    <section
      className="mb-8 flex flex-col gap-6 border-b border-border pb-8 sm:flex-row sm:items-start sm:justify-between"
      aria-label="Profil lansia"
    >
      <div className="flex items-start gap-5">
        <div
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-accent/25 bg-accent/10 font-serif text-2xl text-accent-dark"
          aria-hidden="true"
        >
          BS
        </div>

        <div>
          <h1 className="font-serif text-3xl text-ink sm:text-4xl">{elderly.name}</h1>

          <p className="mt-2 text-sm text-muted">
            {elderly.age} tahun, dipantau melalui wearable dan kamera CCTV.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="inline-flex items-center gap-2 text-sm text-ink-soft">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  elderly.monitoringStatus === "Aktif" ? "bg-safe" : "bg-muted"
                }`}
                aria-hidden="true"
              />
              Monitoring {elderly.monitoringStatus}
            </span>

            <span className="inline-flex items-center gap-2 text-sm text-ink-soft">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  elderly.wearableStatus === "Terhubung" ? "bg-safe" : "bg-danger"
                }`}
                aria-hidden="true"
              />
              Wearable {elderly.wearableStatus}
            </span>
          </div>
        </div>
      </div>

      <div className="shrink-0 text-left sm:text-right">
        <p className="text-sm font-semibold text-ink-soft">{elderly.id}</p>

        <p className="mt-1 text-xs text-muted">Nomor identitas lansia</p>
      </div>
    </section>
  );
}

export default ElderlyProfile;
