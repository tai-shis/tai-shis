import { FaGithub, FaLinkedin, FaInstagram } from "react-icons/fa";
import Panel from "@/app/components/panel";
import CopyEmail from "@/app/components/copy-email";

const links = [
  { href: "https://github.com/tai-shis", icon: <FaGithub size={14} />, label: "GitHub" },
  { href: "https://linkedin.com/in/tai-shishiba", icon: <FaLinkedin size={14} />, label: "LinkedIn" },
  { href: "https://instagram.com/bookyc_", icon: <FaInstagram size={14} />, label: "Instagram" },
];

export default function Socials() {
  return (
    <Panel name="socials" className="p-4">
      <div className="flex flex-row justify-evenly">
        <CopyEmail email="you@example.com" />
        {links.map(({ href, icon, label }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
          >
            <span className="hidden sm:inline">{icon}</span> {label}
          </a>
        ))}
      </div>
    </Panel>
  );
}
