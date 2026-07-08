export async function downloadExploreImage(imageUrl: string, filename = "lumina-explore.jpg"): Promise<void> {
  if (imageUrl.startsWith("data:")) {
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = filename;
    a.click();
    return;
  }

  const res = await fetch(imageUrl);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function copyExplorePrompt(prompt: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(prompt);
    return true;
  } catch {
    return false;
  }
}
