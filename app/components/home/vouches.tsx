import Panel from "@/app/components/panel";
import { vouches } from "@/app/lib/vouches";

export default function Vouches() {
  return (
    <Panel name="vouches" className="p-4">
      <ul className="flex flex-col gap-2 text-sm px-2">
        {vouches.map(({ name, url, blurb }) => (
          <li key={url} className="flex gap-2 text-muted">
            <span className="text-border-accent shrink-0 select-none">›</span>
            <span>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-accent transition-colors"
              >
                {name}
              </a>
              {blurb && <span> - {blurb}</span>}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
