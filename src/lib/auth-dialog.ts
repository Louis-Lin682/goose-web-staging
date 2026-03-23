export type AuthDialogMode = "login" | "register";

export type OpenAuthDialogDetail = {
  mode?: AuthDialogMode;
};

export const AUTH_DIALOG_EVENT = "goose:open-auth-dialog";

export const openAuthDialog = (detail: OpenAuthDialogDetail = {}) => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent<OpenAuthDialogDetail>(AUTH_DIALOG_EVENT, { detail }));
};
