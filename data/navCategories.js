/** Presets for slug → label, images, icons. Navbar/footer categories load from `/api/categories` and merge these defaults. */

export const NAV_CATEGORIES = [
  {
    label: "Display / Touch",
    slug: "display",
    filter: "Display",
    blurb: "AMOLED, LCD & digitizers",
    image:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80",
    icon: "◫",
  },
  {
    label: "Battery",
    slug: "battery",
    filter: "Battery",
    blurb: "Cells & BMS-safe packs",
    image:
      "https://images.unsplash.com/photo-1601784555128-393f09b9b0a5?auto=format&fit=crop&w=400&q=80",
    icon: "⌁",
  },
  {
    label: "Charging Jack",
    slug: "charging-jack",
    filter: "Charging",
    blurb: "Ports, flexes & boards",
    image:
      "https://images.unsplash.com/photo-1583394837333-0879db6f85fa?auto=format&fit=crop&w=400&q=80",
    icon: "⎓",
  },
  {
    label: "Folder / Body",
    slug: "folder-body",
    filter: "Body",
    blurb: "Frames, glass & chassis",
    image:
      "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=400&q=80",
    icon: "▢",
  },
  {
    label: "Speaker",
    slug: "speaker",
    filter: "Speaker",
    blurb: "Buzzers & earpieces",
    image:
      "https://images.unsplash.com/photo-1556656793-08538906a9fa?auto=format&fit=crop&w=400&q=80",
    icon: "◎",
  },
  {
    label: "Camera",
    slug: "camera",
    filter: "Camera",
    blurb: "Front & rear modules",
    image:
      "https://images.unsplash.com/photo-1609091839311-5367944d3491?auto=format&fit=crop&w=400&q=80",
    icon: "◉",
  },
];

/** Quick shortcuts on home — Display, Battery, Folder, Touch. */
export const HOME_SHORTCUT_CATS = [
  NAV_CATEGORIES[0],
  NAV_CATEGORIES[1],
  NAV_CATEGORIES[3],
  {
    label: "Touch",
    slug: "display",
    filter: "Display",
    blurb: "Glass & digitizer stacks",
    image:
      "https://images.unsplash.com/photo-1592899677859-90f0c5d7c0c8?auto=format&fit=crop&w=400&q=80",
    icon: "⎔",
  },
];
