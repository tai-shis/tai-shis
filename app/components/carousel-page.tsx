import Shell from "@/app/components/shell";
import Footer from "@/app/components/footer";

export type CarouselPageProps = {
  /** Screen-reader page heading. */
  title: string;
  /** One nav label per child slide, in the same order. */
  sections: string[];
  /** Replaces the copyright line at the start of the footer. */
  footerStart?: React.ReactNode;
  /** Shown centered in the footer on wider screens. */
  footerCenter?: React.ReactNode;
  children: React.ReactNode;
};

export default function CarouselPage({ title, sections, footerStart, footerCenter, children }: CarouselPageProps) {
  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col h-full px-4 py-8 gap-4">
      <h1 className="sr-only">{title}</h1>
      <Shell labels={sections}>{children}</Shell>
      <Footer sections={sections} start={footerStart} center={footerCenter} />
    </div>
  );
}
