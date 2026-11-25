// English is the source of truth for message keys; other locales must match its shape.
const en = {
  common: {
    brand: "Mello",
    language: "العربية",
  },
  nav: {
    home: "Home",
    account: "Account",
    newIn: "New in",
    shop: "Shop",
    ourStory: "Our story",
    search: "Search",
    bag: "Bag",
    menu: "Menu",
  },
  home: {
    title: "Mello",
    tagline: "Our store is coming soon.",
    shopNow: "Shop now",
    hero: {
      eyebrow: "New season",
      headlineStart: "Pieces made to ",
      headlineEm: "fit you",
      headlineEnd: ", stitch by stitch",
      shop: "Shop the collection",
      newArrivals: "New arrivals",
      noteDelivery: "Free delivery in Cairo",
      noteReturns: "Easy returns",
      noteCod: "Cash on delivery",
      logoAlt: "Needle, women's wear",
      labelAlt: "Needle leather label, Made in Egypt",
    },
    products: {
      eyebrow: "Just in",
      title: "New arrivals",
      viewAll: "View all",
      fromPrice: "From {price}",
      soldOut: "Sold out",
      colors: "Colors",
      sizes: "Sizes",
      photoOf: "Photo {n} of {total}",
      error: "We couldn't load the products.",
      retry: "Try again",
      empty: "New pieces are coming soon.",
    },
  },
};

export default en;
export type Messages = typeof en;
