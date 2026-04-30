import figlet from "figlet";

export default function Home() {
  const asciiText = figlet.textSync("tai-shis", { font: "Standard" });

  return (
    <main className="flex flex-1 flex-col items-center justify-center">
    </main>
  );
}
