export function bindMediaCard(card, media) {
  if (!card || !media || !media.id) return;

  card.addEventListener("click", () => {
    const type = media.media_type;

    if (type === "tv") {
      window.location.href = `/series.html?id=${media.id}`;
    } else {
      window.location.href = `/movie.html?id=${media.id}`;
    }
  });
}
