export interface Vouch {
  name: string;
  url: string;
  blurb?: string;
}

// Add a vouch by appending an entry. Rendered in the order written.
export const vouches: Vouch[] = [
  { name: "0xhckr.dev", url: "https://0xhckr.dev", blurb: "Mohammad Al-Ahdal" },
  { name: "matthew-hre.com", url: "https://matthew-hre.com", blurb: "Matthew Hrehirchuk" },
];
