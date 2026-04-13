/** Presets for slug → label, images, icons. Navbar/footer categories load from `/api/categories` and merge these defaults. */

import { CATEGORY_SLUG_CARD_IMAGE, PART_IMAGE_POOLS } from "@/lib/partImages";

export const NAV_CATEGORIES = [
  {
    label: "Display / Touch",
    slug: "display",
    filter: "Display",
    blurb: "AMOLED, LCD & digitizers",
    image: CATEGORY_SLUG_CARD_IMAGE.display,
    icon: "◫",
  },
  {
    label: "Battery",
    slug: "battery",
    filter: "Battery",
    blurb: "Cells & BMS-safe packs",
    image: CATEGORY_SLUG_CARD_IMAGE.battery,
    icon: "⌁",
  },
  {
    label: "Charging Jack",
    slug: "charging-jack",
    filter: "Charging",
    blurb: "Ports, flexes & boards",
    image: CATEGORY_SLUG_CARD_IMAGE["charging-jack"],
    icon: "⎓",
  },
  {
    label: "Folder / Body",
    slug: "folder-body",
    filter: "Body",
    blurb: "Frames, glass & chassis",
    image: CATEGORY_SLUG_CARD_IMAGE["folder-body"],
    icon: "▢",
  },
  {
    label: "Speaker",
    slug: "speaker",
    filter: "Speaker",
    blurb: "Buzzers & earpieces",
    image: CATEGORY_SLUG_CARD_IMAGE.speaker,
    icon: "◎",
  },
  {
    label: "Camera",
    slug: "camera",
    filter: "Camera",
    blurb: "Front & rear modules",
    image: CATEGORY_SLUG_CARD_IMAGE.camera,
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
    image: PART_IMAGE_POOLS.display[2],
    icon: "⎔",
  },
];
