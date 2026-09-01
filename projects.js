// Edit this file to change the page title copy and the seeded project blocks.
// Blocks added or edited in the Admin pane are stored in this browser and
// override these seeds; clear them with localStorage.removeItem("portfolioArchive.projects.v1").
window.portfolioConfig = {
  name: "Neal Gillespie",
  kicker: "Personal website archive",
  headline: "A foundational index for digital work.",
  intro: "A living collection of experiments, websites, visual systems, and finished builds.",
  projectAccent: "violet",
  adminPassword: "admin-password",
  statusOptions: ["Featured", "Draft", "Ready for link", "Upcoming"],
  contacts: [
    { label: "Personal", value: "nealtgill@gmail.com", href: "mailto:nealtgill@gmail.com" },
    {
      label: "Free Knowledge Library",
      value: "freeknowledgelibrary@proton.me",
      href: "mailto:freeknowledgelibrary@proton.me",
    },
    { label: "Phone", value: "513-807-1705", href: "tel:+15138071705" },
  ],
};

window.portfolioProjects = [
  {
    title: "First Archive Project",
    url: "#",
    label: "Website",
    description: "Replace this with the project note or a one-line context blurb.",
    status: "Featured",
  },
  {
    title: "Visual Experiment",
    url: "#",
    label: "Prototype",
    description: "Use this block for a sketch, test build, gallery, or interactive page.",
    status: "Draft",
  },
  {
    title: "Launch Piece",
    url: "#",
    label: "Case file",
    description: "A more polished project can live here with a public URL attached.",
    status: "Ready for link",
  },
  {
    title: "Future Project",
    url: "#",
    label: "Placeholder",
    description: "Duplicate this object when you want another block in the archive.",
    status: "Upcoming",
  },
];
