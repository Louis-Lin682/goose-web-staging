export const SESSION_TIMEOUT_EVENT = "goose:session-timeout";

export const emitSessionTimeout = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(SESSION_TIMEOUT_EVENT));
};
