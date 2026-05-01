import Panel from "../../panel";


export default function Preface() {
  return (
    <Panel name="preface" className="p-4 relative">
      <div className="px-2 flex flex-col text-sm text-muted gap-2">
        <p>
          I would definitely love to put all of my hobby stuff here, but I couldn&apos;t quite figure out how to style this section
          with all the goodies in a way that I was happy with, so theres another page for that.
        </p>
      </div>
    </Panel>
  );
}