import { vouches } from "@/app/lib/vouches";

export const home = {
  me: `### me

- Currently {{verb}} @ [rocky.systems](https://rocky.systems)
- Studying Computer Science @ [MRU](https://mtroyal.ca)
- Bragg Creek, Alberta
`,

  socials: `### socials

- email: [me@tai-shis.com](mailto:me@tai-shis.com)
- discord: bookychan
- github: [tai-shis](https://github.com/tai-shis)
- linkedin: [tai-shishiba](https://linkedin.com/in/tai-shishiba)
- instagram: [bookyc_](https://instagram.com/bookyc_)
`,

  about: `### about

I do computer things at Mount Royal University, previously working as a Research Assistant.
I typically build stuff in typescript, focusing on web development with react.
Soon™ to be diving into native developent as well as data science.

Aside from school, we do a little hobbymaxxing. Currently dabbling in mechanical keyboards, playing music, fashion, photography, and cooking.
I'd love to get into making my own clothes and homelabbing as well, but thats a future endeavor.

Im always up to chat about any of these things, so do reach out by socials or preferably through discord!
`,

  propaganda: `### propaganda

You should use **NixOS** :D

I daily drive NixOS on my Framework (which was my first linux distro), and the experience has been (mostly) smooth.
The main appeal for me is the completely reproducible configuration and environment, making setting up a project suuuuper clean.

By the way, you should also get a [Framework](https://frame.work) laptop.
The 13 Pro is soon to come...

Also, NixOS on the desktop is on the way. I'm just ~~lazy~~ :3c
`,

  vouches: `### vouches

${vouches.map(({ name, url, blurb }) => `- [${name}](${url})${blurb ? ` - ${blurb}` : ""}`).join("\n")}
`,
};
