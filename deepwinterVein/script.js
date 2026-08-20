document.addEventListener("DOMContentLoaded", () => {
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const lightboxClose = document.getElementById("lightbox-close");
  const lightboxOverlay = document.getElementById("lightbox-overlay");

  if (!lightbox || !lightboxImg || !lightboxClose || !lightboxOverlay) return;

  const images = document.querySelectorAll(".art-card img");

  const openLightbox = (src) => {
    lightboxImg.src = src;
    lightbox.classList.remove("hidden");
    requestAnimationFrame(() => lightbox.classList.add("open"));
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    lightbox.classList.remove("open");
    document.body.style.overflow = "";
    setTimeout(() => {
      lightbox.classList.add("hidden");
      lightboxImg.src = "";
    }, 200);
  };

  images.forEach((img) => {
    img.style.cursor = "pointer";
    img.addEventListener("click", () => openLightbox(img.src));
  });

  lightboxClose.addEventListener("click", closeLightbox);
  lightboxOverlay.addEventListener("click", closeLightbox);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !lightbox.classList.contains("hidden")) {
      closeLightbox();
    }
  });
});
