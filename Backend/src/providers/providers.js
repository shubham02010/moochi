export const providers = [
  {
    id: "vidzee",
    name: "Vidzee",
    movie: id => `https://player.vidzee.wtf/embed/movie/${id}`,
    series: (id, s, e) =>
      `https://player.vidzee.wtf/embed/tv/${id}/${s}/${e}`
  },
  {
    id: "vidfast",
    name: "VidFast",
    movie: id => `https://vidfast.pro/movie/${id}?autoPlay=true`,
    series: (id, s, e) =>
      `https://vidfast.pro/tv/${id}/${s}/${e}?autoPlay=true`
  },
  {
    id: "videasy",
    name: "VidEasy",
    movie: id => `https://player.videasy.net/movie/${id}`,
    series: (id, s, e) =>
      `https://player.videasy.net/tv/${id}/${s}/${e}`
  },
  {
    id: "111movies",
    name: "111Movies",
    movie: id => `https://111movies.com/movie/${id}`,
    series: (id, s, e) =>
      `https://111movies.com/tv/${id}/${s}/${e}`
  },
  {
    id: "vidlink",
    name: "VidLink",
    movie: id => `https://vidlink.pro/movie/${id}`,
    series: (id, s, e) =>
      `https://vidlink.pro/tv/${id}/${s}/${e}`
  },
  {
    id: "2embed",
    name: "2Embed",
    movie: id => `https://www.2embed.cc/embed/${id}`,
    series: (id, s, e) =>
      `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`
  },
  {
    id: "vidup",
    name: "VidUp",
    movie: id => `https://vidup.to/movie/${id}?autoPlay=true`,
    series: (id, s, e) =>
      `https://vidup.to/tv/${id}/${s}/${e}?autoPlay=true`
  },
  {
    id: "vidnest",
    name: "VidNest",
    movie: id => `https://vidnest.fun/movie/${id}`,
    series: (id, s, e) =>
      `https://vidnest.fun/tv/${id}/${s}/${e}`
  }
];
