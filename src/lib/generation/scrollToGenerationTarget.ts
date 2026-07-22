export function scrollToGenerationTarget(target: { jobId: string; animationId?: string }) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const selector = target.animationId
        ? `[data-generation-animation="${target.animationId}"]`
        : `[data-generation-job="${target.jobId}"]`;
      document.querySelector(selector)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  });
}
