import Link from "next/link";
import figlet from "figlet";
import Panel from "../../panel";
import AnimatedAscii from "./animated-ascii";

export default function CTA() {
  const asciiText = figlet.textSync("Hobbies", { font: "Standard" });

  return (
    <Panel name="call-to-action" className="p-4 relative">
      <p className="text-sm text-muted px-2">
        The page will be really cool, so click on the big ol&apos;
      </p>
      <div className="text-center">
        <Link href="/hobbies">
          <AnimatedAscii
            text={asciiText}
            className="text-muted leading-tight text-xs font-mono px-2 cursor-pointer hover:text-sunset transition-colors"
          />
        </Link>
      </div>
      <p className="text-sm text-muted px-2">
        button to go there. I promise it will be worth it.
      </p>
    </Panel>
  );
}
