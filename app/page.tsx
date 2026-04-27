import Me from "./components/me";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center">
      <div className="w-full max-w-3xl">
        <Me />
      </div>
    </main>
  );
}
