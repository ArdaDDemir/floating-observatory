import ClientScene from "@/components/ClientScene";
import GameHUD from "@/components/GameHUD";

export default function Home() {
  return (
    <main className="relative h-dvh max-h-dvh w-full overflow-hidden bg-black">
      <ClientScene />
      <GameHUD />
    </main>
  );
}
