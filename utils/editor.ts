export const calculateFontSizeFull = (text: string, width: number, height: number): number => {
  const padding = 0.01;
  const maxWidth = width * (1 - 2 * padding);
  const maxHeight = height * (1 - 2 * padding);

  let fontSize = maxHeight;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) return 12;

  while (fontSize > 1) {
    ctx.font = `${fontSize}px Arial`;
    const textWidth = ctx.measureText(text).width;
    if (textWidth <= maxWidth && fontSize <= maxHeight) break;
    fontSize -= 1;
  }
  return fontSize;
};



