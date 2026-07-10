/** Resolve relative app paths and fetch remote images as data URLs for video/img2img APIs. */
export async function urlToDataUrl(url: string): Promise<string> {
  if (url.startsWith("data:")) return url;

  const absolute =
    url.startsWith("http://") || url.startsWith("https://")
      ? url
      : `${window.location.origin}${url.startsWith("/") ? url : `/${url}`}`;

  const res = await fetch(absolute);
  if (!res.ok) throw new Error("Could not load image for animation");

  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read image for animation"));
    reader.readAsDataURL(blob);
  });
}
