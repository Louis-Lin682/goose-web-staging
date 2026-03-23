import type { ReactNode } from "react";

type AuthRequiredPromptProps = {
  title?: string;
  description?: string;
  actions?: ReactNode;
  onClose?: () => void;
  modal?: boolean;
};

const PromptCard = ({
  title = "請先登入或註冊",
  description = "完成登入後才可以前往結帳，這樣訂單資料與會員資訊才能正確對應。",
  actions,
}: Omit<AuthRequiredPromptProps, "onClose" | "modal">) => (
  <div className="w-full max-w-md rounded-[2rem] bg-white p-7 shadow-2xl">
    <p className="text-xs font-black uppercase tracking-[0.35em] text-orange-600">
      Members
    </p>
    <h2 className="mt-3 text-3xl font-black text-zinc-900">{title}</h2>
    <p className="mt-4 text-sm leading-7 text-zinc-500">{description}</p>

    {actions && <div className="mt-8 flex flex-col gap-3 sm:flex-row">{actions}</div>}
  </div>
);

export const AuthRequiredPrompt = ({
  title,
  description,
  actions,
  onClose,
  modal = false,
}: AuthRequiredPromptProps) => {
  if (!modal) {
    return (
      <PromptCard title={title} description={description} actions={actions} />
    );
  }

  return (
    <div className="fixed inset-0 z-[120] bg-black/50 px-6 py-8" onClick={onClose}>
      <div className="mx-auto flex h-full max-w-4xl items-center justify-center">
        <div onClick={(event) => event.stopPropagation()}>
          <PromptCard title={title} description={description} actions={actions} />
        </div>
      </div>
    </div>
  );
};
