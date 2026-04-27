import About from "./components/about";
import Me from "./components/me";
import Socials from "./components/socials";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center">
      <div className="w-full max-w-3xl flex flex-col gap-4">
        <Me/>
        <Socials/>
        <About/>
      </div>
    </main>
  );
}
