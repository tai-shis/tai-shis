import ProjectTemplate from "@/app/components/projects/project-template";

export default function VendorReports() {
  return (
    <ProjectTemplate
      panelName="vendor-reports"
      description="Full-Stack internal web application for showing consignment vendors real-time visibility into their sales data."
      tags={["TypeScript", "React", "Next.js", "Neon Auth", "NeonDB", "Prisma", "TailwindCSS", "Square SDK", "Vercel", "Playwright", "Axiom", "Resend"]}
      images={[
        { src: "/vendor-reports/home.png", alt: "Vendor home screen with an order count history chart for the last 7 days" },
        { src: "/vendor-reports/orders.png", alt: "Vendor orders table listing date, item name, quantity, and subtotal" },
      ]}
      freelance={true}
      maintaining={true}
    />
  );
}
  