"use client";

import { useRouter } from "next/navigation";
import ActivityChart from "../components/dashboard/ActivityChart";
import AlertSummary from "../components/dashboard/AlertSummary";
import ElderlyMonitoringCard from "../components/dashboard/ElderlyMonitoringCard";
import EldersOverview from "../components/dashboard/EldersOverview";
import HealthSummary from "../components/dashboard/HealthSummary";
import ElderSelector from "../components/elderly/ElderSelector";
import Footer from "../components/layout/Footer";
import TopNav from "../components/layout/TopNav";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import InlineNotice from "../components/ui/InlineNotice";
import QueryStateScreen from "../components/ui/QueryStateScreen";
import { useElderCareQuery, useEldersOverviewQuery } from "../hooks/useElderCareQuery";
import { useElderRealtime } from "../hooks/useElderRealtime";
import { useSelectedElder } from "../hooks/useSelectedElder";
import { useUIStore } from "../store/useUIStore";

function Dashboard() {
  const router = useRouter();

  const selectedActivityDay = useUIStore((state) => state.selectedActivityDay);

  const setSelectedActivityDay = useUIStore((state) => state.setSelectedActivityDay);

  const selection = useSelectedElder();
  const monitoringQuery = useElderCareQuery(selection.selectedId, !selection.isLoading);
  const overviewQuery = useEldersOverviewQuery();
  useElderRealtime(monitoringQuery.data?.elderly.id);

  if (monitoringQuery.isPending || monitoringQuery.isError || !monitoringQuery.data) {
    return (
      <QueryStateScreen
        query={monitoringQuery}
        pendingMessage="Memuat dashboard..."
        errorTitle="Gagal Memuat Dashboard"
        errorFallbackMessage="Gagal mengambil data dashboard."
        emptyMessage="Data dashboard belum tersedia."
      />
    );
  }

  const { elderly, health, activityHistory, alert } = monitoringQuery.data;
  const hasElder = Boolean(elderly.id);
  const overview = overviewQuery.data ?? [];
  const hasMultiple = selection.elders.length > 1;
  const anyAlert = alert.hasAlert || overview.some((item) => item.alert.hasAlert);

  return (
    <div className="min-h-screen bg-paper">
      <TopNav hasNotification={anyAlert} />

      <main className="min-w-0">
        <div className="p-4 sm:p-6 lg:p-8">
          <section className="mb-8">
            <h1 className="font-serif text-2xl text-ink sm:text-3xl">Dashboard Monitoring</h1>

            <p className="mt-2 text-sm text-muted">
              Pantau kondisi kesehatan dan aktivitas lansia secara berkala.
            </p>
          </section>

          {!hasElder && (
            <InlineNotice variant="warning" className="mb-6">
              Belum ada lansia terdaftar, jadi data pemantauan belum tersedia. Daftarkan lansia dan
              perangkatnya untuk mulai memantau.
            </InlineNotice>
          )}

          {hasMultiple && overview.length > 0 && (
            <EldersOverview
              items={overview}
              selectedId={selection.selectedId}
              onSelect={selection.select}
              onViewDetail={(id) => router.push(`/elderly?lansia=${encodeURIComponent(id)}`)}
            />
          )}

          <ElderSelector
            elders={selection.elders}
            selectedId={selection.selectedId}
            onSelect={selection.select}
          />

          <HealthSummary health={health} />

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <ActivityChart
              activityHistory={activityHistory}
              selectedActivityDay={selectedActivityDay}
              onActivitySelect={setSelectedActivityDay}
            />

            <AlertSummary
              alert={alert}
              onViewDetail={() => router.push(`/elderly?lansia=${encodeURIComponent(elderly.id)}`)}
            />
          </section>

          {hasElder ? (
            <ElderlyMonitoringCard
              elderly={elderly}
              onViewDetail={() => router.push(`/elderly?lansia=${encodeURIComponent(elderly.id)}`)}
            />
          ) : (
            <section className="mt-6">
              <Card className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-serif text-lg text-ink">Lansia yang Dipantau</h2>
                  <p className="mt-1 text-sm text-muted">Belum ada lansia yang dipantau.</p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => router.push("/elderly/register")}
                >
                  Tambah Data Lansia
                </Button>
              </Card>
            </section>
          )}
        </div>

        <Footer />
      </main>
    </div>
  );
}

export default Dashboard;
