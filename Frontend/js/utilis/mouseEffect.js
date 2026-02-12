/* ===== MOUSE MOVEMENT EFFECT ===== */
let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

function updateBackground() {
  targetX += (mouseX - targetX) * 0.05;
  targetY += (mouseY - targetY) * 0.05;
  
  const xPercent = (targetX / window.innerWidth) * 100;
  const yPercent = (targetY / window.innerHeight) * 100;
  
  document.body.style.background = `
    radial-gradient(
      600px circle at ${xPercent}% ${yPercent}%,
      rgba(59, 130, 246, 0.08),
      transparent 40%
    ),
    radial-gradient(
      800px circle at ${100 - xPercent}% ${100 - yPercent}%,
      rgba(59, 130, 246, 0.05),
      transparent 40%
    ),
    #000000
  `;
  
  requestAnimationFrame(updateBackground);
}

// Start animation
updateBackground();
