import Panel from "@/app/components/panel";
import { Bullet, Divider } from "@/app/components/shared";

const education = [
  {
    institution: "Mount Royal University",
    location: "Calgary, AB",
    degree: "Bachelor of Science in Computer Science",
    date: "Sept. 2023 – Present",
    bullets: [
      "Dean's Honour Roll (6 consecutive semesters)",
      "President's Honour Roll (3 consecutive years)",
      "Cumulative GPA: 3.91 / 4.00",
      "Relevant Courses: Algorithms and Complexity, System Design, Introduction to Databases, Foundations: Software Engineering, Web Development for Computer Science, Computing Architecture and Machinery, Human-Computer Interaction",
    ],
  },
];

export default function Education() {
  return (
    <Panel name="education" className="p-4 relative">
      <div className="px-2 flex flex-col text-sm">
        {education.map((e, i) => (
          <div key={e.institution}>
            {i > 0 && <Divider />}
            <div className="flex justify-between items-baseline gap-2">
              <span className="font-bold text-muted group-hover:text-accent transition-colors">{e.institution}</span>
              <span className="text-muted">{e.location}</span>
            </div>
            <div className="flex justify-between items-baseline gap-2">
              <span className="text-muted">{e.degree}</span>
              <span className="text-muted">{e.date}</span>
            </div>
            <ul className="mt-2 flex flex-col gap-1">
              {e.bullets.map((b) => <Bullet key={b} text={b} />)}
            </ul>
          </div>
        ))}
      </div>
    </Panel>
  );
}
