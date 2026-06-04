const DUNE_IMAGE = require("../assets/images/featured/featured-1.jpg");
const SCOOBY_IMAGE = require("../assets/images/trending/trending-4.jpg");

export const HISTORY_FILTER_OPTIONS = [
  { id: "done", label: "Done" },
  { id: "continue", label: "Continue" },
];

export const HISTORY_FEATURED = {
  id: "history-featured-dune",
  title: "Dune Final",
  imdb: "8.7/10",
  seasons: "12 Seasons",
  year: "2014",
  image: DUNE_IMAGE,
  categories: "Sci-fi | Adventure | Family",
  type: "movie",
  progress: 0.42,
};

const BASE_ITEMS = {
  dune: {
    id: "history-dune",
    title: "Dune",
    subtitle: "Sci-fi | Adventure | Family",
    image: DUNE_IMAGE,
    categories: "Sci-fi | Adventure | Family",
    type: "movie",
  },
  scooby: {
    id: "history-scooby",
    title: "S3 E1: Scooby Doo, where are you",
    subtitle: "Mystery",
    image: SCOOBY_IMAGE,
    categories: "Mystery",
    type: "series",
  },
};

export const HISTORY_SECTIONS = [
  {
    id: "today",
    label: "Today",
    items: [
      { ...BASE_ITEMS.dune, progress: 0.38, action: "continue" },
      { ...BASE_ITEMS.scooby, progress: 1, action: "watch_again" },
    ],
  },
  {
    id: "yesterday",
    label: "Yesterday",
    items: [
      { ...BASE_ITEMS.dune, progress: 0.62, action: "continue" },
      { ...BASE_ITEMS.scooby, progress: 0.28, action: "continue" },
    ],
  },
];

export function filterHistorySections(sections, filterId) {
  if (!filterId) {
    return sections;
  }

  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (filterId === "done") {
          return item.action === "watch_again" || item.progress >= 0.99;
        }

        if (filterId === "continue") {
          return item.action === "continue" || item.progress < 0.99;
        }

        return true;
      }),
    }))
    .filter((section) => section.items.length > 0);
}
