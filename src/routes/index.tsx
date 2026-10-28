import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const HoorGame = lazy(() => import("@/game/CloudGate"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "حور تلعب و تتعلم — لعبة صيد الدجاج التعليمية" },
      { name: "description", content: "حور تلعب وتتعلم: مغامرة تعليمية للأطفال عبر ٢٢ مرحلة، مع أسئلة للتدريب وروضة القرآن وحفظ التقدم." },
      { property: "og:title", content: "حور تلعب و تتعلم — لعبة صيد الدجاج التعليمية" },
      { property: "og:description", content: "حور تلعب وتتعلم: مغامرة تعليمية للأطفال عبر ٢٢ مرحلة، مع أسئلة للتدريب وروضة القرآن وحفظ التقدم." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Loading() {
  return <div className="flex min-h-screen items-center justify-center text-2xl font-bold">...</div>;
}

function Index() {
  return (
    <ClientOnly fallback={<Loading />}>
      <Suspense fallback={<Loading />}>
        <HoorGame />
      </Suspense>
    </ClientOnly>
  );
}
