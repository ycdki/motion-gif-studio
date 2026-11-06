export function dimensions(image, size) {
  const ratio = Math.max(.4, Math.min(2.5, image.width / image.height));
  return ratio >= 1 ? [size, Math.round(size / ratio)] : [Math.round(size * ratio), size];
}
export function draw(ctx, image, phase, settings) {
  const w = ctx.canvas.width, h = ctx.canvas.height;
  ctx.clearRect(0, 0, w, h);
  if (settings.background !== 'transparent') {ctx.fillStyle = settings.background; ctx.fillRect(0, 0, w, h);}
  const t = phase * Math.PI * 2, strength = settings.intensity / 100, amp = settings.amplitude / 100;
  const elastic = settings.preset === 'elastic', bounce = settings.preset === 'bounce';
  const pulse = Math.sin(t), squash = (elastic ? .28 : bounce ? .12 : .04) * strength * pulse;
  const scale = Math.min(w * .64 / image.width, h * .64 / image.height);
  const iw = image.width * scale, ih = image.height * scale;
  ctx.save(); ctx.translate(w / 2 + Math.sin(t) * amp * w * (elastic ? .025 : bounce ? .015 : .10), h / 2 - Math.cos(t * (bounce ? 1 : 2)) * amp * h * .065);
  ctx.rotate(Math.sin(t) * amp * (elastic ? .035 : bounce ? .02 : .14)); ctx.scale(1 + squash, 1 - squash);
  // Horizontal strips create the soft, phase-shifted deformation in the reference.
  const strips = 128;
  for (let i = 0; i < strips; i++) {
    const y = i / strips, sh = image.height / strips;
    const bend = elastic ? Math.sin(t + y * Math.PI * 2) * Math.sin(y * Math.PI) * iw * .045 * strength : 0;
    ctx.drawImage(image, 0, i * sh, image.width, sh, -iw / 2 + bend, -ih / 2 + y * ih, iw, ih / strips + .35);
  }
  ctx.restore();
}
