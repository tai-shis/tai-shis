import Panel from "@/app/components/panel";
import ImagePreview from "@/app/components/projects/image-preview";
import { ExternalLink } from "lucide-react";

interface ProjectTemplateProps {
  panelName: string;
  description: string;
  tags: string[];
  images?: string[];
  link?: string;
  school?: boolean;
  hackathon?: boolean;
  personal?: boolean;
  wip?: boolean;
}

export default function ProjectTemplate({ panelName, description, tags, images, link, school, hackathon, personal, wip }: ProjectTemplateProps) {
  return (
    <Panel name={panelName} className="p-4 relative">
      {link && (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-4 right-4 text-muted hover:text-accent transition-colors"
        >
          <ExternalLink size={18} />
        </a>
      )}
      <div className="px-2 flex flex-col gap-3">
        <p className="text-sm text-muted">{description}</p>
        <div className="flex flex-wrap gap-2">
          {wip && (
            <span className="text-sm text-sunset border border-sunset px-2 py-0.5">
              WIP
            </span>
          )}
          {personal && (
            <span className="text-sm text-accent border border-accent px-2 py-0.5">
              Personal Project
            </span>
          )}
          {school && (
            <span className="text-sm text-accent border border-accent px-2 py-0.5">
              School Project
            </span>
          )}
          {hackathon && (
            <span className="text-sm text-accent border border-accent px-2 py-0.5">
              Hackathon
            </span>
          )}
          {tags.map((tag) => (
            <span
              key={tag}
              className="text-sm text-muted border border-border px-2 py-0.5"
            >
              {tag}
            </span>
          ))}
        </div>
        {images && images.length > 0 && <ImagePreview images={images} />}
      </div>
    </Panel>
  );
}
