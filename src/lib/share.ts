export async function shareCardToWhatsApp(
  elementId: string,
  fileName = "resumen-jornada.png",
): Promise<boolean> {
  if (typeof document === "undefined") {
    return false;
  }

  const node = document.getElementById(elementId);
  if (!node) {
    return false;
  }

  // Carga diferida: html-to-image solo se importa en el cliente al compartir,
  // evitando que entre en el bundle del servidor.
  const { toPng } = await import("html-to-image");

  const dataUrl = await toPng(node, { quality: 0.95, pixelRatio: 2 });
  const blob = await (await fetch(dataUrl)).blob();
  const file = new File([blob], fileName, { type: "image/png" });

  if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: "Resumen Enchepaitos Tournament",
    });
    return true;
  }

  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileName;
  link.click();
  return true;
}
