const DUNE_IMAGE = require("../assets/images/featured/featured-1.jpg");
const INTERSTELLAR_IMAGE = require("../assets/images/featured/featured-2.jpg");
const TRENDING_IMAGE = require("../assets/images/trending/trending-3.jpg");

export const NOTIFICATION_SECTIONS = [
  {
    id: "today",
    label: "Today",
    items: [
      {
        id: "notif-dune",
        title: "Dune",
        subtitle: "Sci-fi | Adventure | Family",
        status: "Just released",
        image: DUNE_IMAGE,
        unread: true,
        type: "movie",
      },
      {
        id: "notif-interstellar",
        title: "Interstellar",
        subtitle: "Sci-fi | Adventure | Family",
        status: "Recently added",
        image: INTERSTELLAR_IMAGE,
        unread: false,
        type: "movie",
      },
      {
        id: "notif-beyond",
        title: "Beyond the Bar",
        subtitle: "Workplace",
        status: "Recently added",
        image: TRENDING_IMAGE,
        unread: false,
        type: "series",
      },
    ],
  },
  {
    id: "yesterday",
    label: "Yesterday",
    items: [
      {
        id: "notif-walter",
        title: "My Life with the Walter Boys",
        subtitle: "Drama",
        status: "Recently added",
        image: TRENDING_IMAGE,
        unread: false,
        type: "series",
      },
      {
        id: "notif-bon",
        title: "Bon Appétit, Your Majesty",
        subtitle: "Drama",
        status: "Recently added",
        image: INTERSTELLAR_IMAGE,
        unread: false,
        type: "series",
      },
      {
        id: "notif-beyond-y",
        title: "Beyond the Bar",
        subtitle: "Workplace",
        status: "Recently added",
        image: DUNE_IMAGE,
        unread: false,
        type: "series",
      },
    ],
  },
];
