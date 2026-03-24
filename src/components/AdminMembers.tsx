import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { AdminActionLoadingOverlay } from "./AdminActionLoadingOverlay";
import { useAuth } from "../context/useAuth";
import {
  deleteAdminUser,
  getAdminUsers,
  updateAdminUser,
  updateUserRole,
} from "../lib/admin-users";
import type {
  AdminUserEntry,
  UpdateAdminUserPayload,
  UserRole,
} from "../types/auth";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const MIN_ACTION_LOADING_MS = 650;
const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

const isSyntheticLinePhone = (value: string | null | undefined) =>
  typeof value === "string" && value.trim().startsWith("line_");

const isSyntheticLineEmail = (value: string | null | undefined) =>
  typeof value === "string" && value.trim().toLowerCase().endsWith("@login.goose.local");

const formatMemberPhone = (value: string | null | undefined) =>
  isSyntheticLinePhone(value) ? "未填寫" : (value?.trim() || "未填寫");

const formatMemberEmail = (value: string | null | undefined) =>
  isSyntheticLineEmail(value) ? "未填寫" : (value?.trim() || "未填寫");

const roleLabels: Record<UserRole, string> = {
  CUSTOMER: "一般會員",
  ADMIN: "管理員",
};

const roleOptions: UserRole[] = ["CUSTOMER", "ADMIN"];

const inputClassName =
  "h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-orange-400";

type EditFormState = {
  name: string;
  phone: string;
  email: string;
  address: string;
};

const buildEditForm = (member: AdminUserEntry): EditFormState => ({
  name: member.name,
  phone: isSyntheticLinePhone(member.phone) ? "" : member.phone,
  email: isSyntheticLineEmail(member.email) ? "" : member.email,
  address: member.address ?? "",
});

export const AdminMembers = () => {
  const { isAuthReady, isAuthenticated, refreshUser, user } = useAuth();
  const [members, setMembers] = useState<AdminUserEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingTitle, setActionLoadingTitle] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<AdminUserEntry | null>(null);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const [deletingMember, setDeletingMember] = useState<AdminUserEntry | null>(null);

  useEffect(() => {
    if (!isAuthReady) {
      return;
    }

    if (!isAuthenticated || !user?.isAdmin) {
      setMembers([]);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const hydrateMembers = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await getAdminUsers();

        if (!isMounted) {
          return;
        }

        setMembers(response.users);
      } catch (fetchError) {
        if (!isMounted) {
          return;
        }

        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "載入會員資料失敗，請稍後再試。",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void hydrateMembers();

    return () => {
      isMounted = false;
    };
  }, [isAuthReady, isAuthenticated, user?.isAdmin]);

  const stats = useMemo(
    () => ({
      total: members.length,
      admins: members.filter((member) => member.role === "ADMIN").length,
      customers: members.filter((member) => member.role === "CUSTOMER").length,
      orders: members.reduce((sum, member) => sum + member.orderCount, 0),
    }),
    [members],
  );

  const runMemberAction = async <T,>(title: string, action: () => Promise<T>): Promise<T> => {
    setActionLoadingTitle(title);
    setError(null);

    try {
      const [result] = await Promise.all([action(), wait(MIN_ACTION_LOADING_MS)]);
      return result;
    } finally {
      setActionLoadingTitle(null);
    }
  };

  const handleRoleChange = async (userId: string, role: UserRole) => {
    try {
      await runMemberAction("更新會員角色中...", () => updateUserRole(userId, { role }));
      setMembers((currentMembers) =>
        currentMembers.map((member) =>
          member.id === userId ? { ...member, role } : member,
        ),
      );

      if (userId === user?.id) {
        await refreshUser();
      }
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "更新會員角色失敗，請稍後再試。",
      );
    }
  };

  const openEditModal = (member: AdminUserEntry) => {
    setEditForm(buildEditForm(member));
    setEditingMember(member);
    setError(null);
  };

  const handleEditFieldChange = <K extends keyof EditFormState>(
    field: K,
    value: EditFormState[K],
  ) => {
    setEditForm((currentForm) =>
      currentForm ? { ...currentForm, [field]: value } : currentForm,
    );
  };

  const handleSaveMember = async () => {
    if (!editingMember || !editForm) {
      return;
    }

    const payload: UpdateAdminUserPayload = {
      name: editForm.name.trim(),
      phone: editForm.phone.trim(),
      email: editForm.email.trim(),
      address: editForm.address.trim() || null,
    };

    try {
      const response = await runMemberAction("儲存會員資料中...", () =>
        updateAdminUser(editingMember.id, payload),
      );

      setMembers((currentMembers) =>
        currentMembers.map((member) =>
          member.id === editingMember.id ? response.user : member,
        ),
      );

      if (editingMember.id === user?.id) {
        await refreshUser();
      }

      setEditingMember(null);
      setEditForm(null);
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "儲存會員資料失敗，請稍後再試。",
      );
    }
  };

  const handleDeleteMember = async () => {
    if (!deletingMember) {
      return;
    }

    try {
      await runMemberAction("刪除會員中...", () => deleteAdminUser(deletingMember.id));
      setMembers((currentMembers) =>
        currentMembers.filter((member) => member.id !== deletingMember.id),
      );
      setDeletingMember(null);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "刪除會員失敗，請稍後再試。",
      );
    }
  };

  if (!isAuthReady) {
    return (
      <main className="min-h-screen bg-white px-6 pb-24 pt-40">
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-zinc-100 bg-zinc-50 px-8 py-16 text-center">
          <p className="text-sm text-zinc-500">正在驗證會員權限...</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-white px-6 pb-24 pt-40">
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-zinc-100 bg-zinc-50 px-8 py-16 text-center">
          <p className="text-xs font-black uppercase tracking-[0.4em] text-orange-600">
            Admin
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-900 md:text-5xl">
            請先登入管理員帳號
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-500">
            登入後即可管理會員資料、調整角色與查看訂單數量。
          </p>
        </div>
      </main>
    );
  }

  if (!user?.isAdmin) {
    return (
      <main className="min-h-screen bg-white px-6 pb-24 pt-40">
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-zinc-100 bg-zinc-50 px-8 py-16 text-center">
          <p className="text-xs font-black uppercase tracking-[0.4em] text-orange-600">
            Admin
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-900 md:text-5xl">
            這個頁面僅限管理員
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-500">
            目前登入帳號沒有管理權限，請切換管理員帳號後再查看。
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-6 pb-24 pt-40 lg:h-full lg:overflow-hidden lg:pb-10 lg:pt-5">
      {actionLoadingTitle && <AdminActionLoadingOverlay title={actionLoadingTitle} />}

      <div className="mx-auto max-w-6xl lg:flex lg:h-full lg:flex-col">
        <div className="shrink-0">
          <div className="mb-8 flex flex-col gap-4 border-b border-zinc-100 pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.4em] text-orange-600">
                Admin
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-900 md:text-5xl">
                會員管理
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
                快速查看會員資料、調整角色與編輯聯絡資訊，方便維護前後台帳號權限。
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 rounded-3xl bg-zinc-50 p-4 md:grid-cols-4">
              <div className="min-w-[96px] text-center">
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-zinc-400">
                  Members
                </p>
                <p className="mt-2 text-2xl font-black text-zinc-900">{stats.total}</p>
              </div>
              <div className="min-w-[96px] text-center">
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-zinc-400">
                  Admins
                </p>
                <p className="mt-2 text-2xl font-black text-zinc-900">{stats.admins}</p>
              </div>
              <div className="min-w-[96px] text-center">
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-zinc-400">
                  Customers
                </p>
                <p className="mt-2 text-2xl font-black text-zinc-900">{stats.customers}</p>
              </div>
              <div className="min-w-[96px] text-center">
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-zinc-400">
                  Orders
                </p>
                <p className="mt-2 text-2xl font-black text-zinc-900">{stats.orders}</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-[1.5rem] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-2">
          {isLoading ? (
            <div className="rounded-[2rem] border border-zinc-100 bg-zinc-50 px-8 py-16 text-center text-sm text-zinc-500">
              正在載入會員資料...
            </div>
          ) : members.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-zinc-200 bg-zinc-50 px-8 py-16 text-center">
              <p className="text-2xl font-bold text-zinc-900">目前沒有會員資料</p>
              <p className="mt-3 text-sm text-zinc-500">
                等有會員註冊或下單後，這裡就會出現對應資料。
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {members.map((member) => {
                const isCurrentUser = member.id === user.id;

                return (
                  <article
                    key={member.id}
                    className="rounded-[2rem] border border-zinc-100 bg-white p-5 shadow-sm md:p-6"
                  >
                    <div className="grid gap-5 lg:grid-cols-[1.1fr_0.8fr_0.7fr]">
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.32em] text-orange-600">
                            Member
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-3">
                            <h2 className="text-2xl font-black text-zinc-900">
                              {member.name}
                            </h2>
                            {member.isLineLinked && (
                              <span className="inline-flex items-center rounded-full bg-[#06C755]/10 px-3 py-1 text-xs font-bold text-[#06C755]">
                                LINE 已綁定
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="grid gap-3 text-sm text-zinc-500 md:grid-cols-2">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.28em] text-zinc-400">
                              電話
                            </p>
                            <p className="mt-2 font-semibold text-zinc-900">
                              {formatMemberPhone(member.phone)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.28em] text-zinc-400">
                              Email
                            </p>
                            <p className="mt-2 break-all font-semibold text-zinc-900">
                              {formatMemberEmail(member.email)}
                            </p>
                          </div>
                          <div className="md:col-span-2">
                            <p className="text-xs font-bold uppercase tracking-[0.28em] text-zinc-400">
                              地址
                            </p>
                            <p className="mt-2 font-semibold text-zinc-900">
                              {member.address?.trim() || "尚未建立收件地址"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.28em] text-zinc-400">
                              建立時間
                            </p>
                            <p className="mt-2 font-semibold text-zinc-900">
                              {formatDate(member.createdAt)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.28em] text-zinc-400">
                              訂單數量
                            </p>
                            <p className="mt-2 font-semibold text-zinc-900">
                              {member.orderCount}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-3xl bg-zinc-50 px-5 py-5">
                        <p className="text-xs font-bold uppercase tracking-[0.28em] text-zinc-400">
                          目前角色
                        </p>
                        <p className="mt-3 text-xl font-black text-zinc-900">
                          {roleLabels[member.role]}
                        </p>
                        <p className="mt-3 text-sm leading-7 text-zinc-500">
                          管理員可以查看後台資料與處理訂單，一般會員則只能使用前台功能。
                        </p>
                      </div>

                      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-zinc-100 px-5 py-5">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.28em] text-zinc-400">
                            角色設定
                          </p>
                          <select
                            value={member.role}
                            onChange={(event) =>
                              void handleRoleChange(member.id, event.target.value as UserRole)
                            }
                            className="mt-3 h-11 w-full rounded-full border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 outline-none transition-colors focus:border-orange-400"
                          >
                            {roleOptions.map((role) => (
                              <option key={role} value={role}>
                                {roleLabels[role]}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="grid gap-3">
                          <Button
                            type="button"
                            onClick={() => openEditModal(member)}
                            className="h-11 rounded-full bg-zinc-900 text-sm text-white hover:bg-zinc-800"
                          >
                            編輯會員資料
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDeletingMember(member)}
                            disabled={isCurrentUser}
                            className="h-11 rounded-full border-red-200 text-sm text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-400"
                          >
                            {isCurrentUser ? "目前登入者不可刪除" : "刪除會員"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {editingMember && editForm && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 px-6 py-8"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setEditingMember(null);
              setEditForm(null);
            }
          }}
        >
          <div className="w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-2xl md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-orange-600">
              Member
            </p>
            <h2 className="mt-3 text-3xl font-black text-zinc-900">編輯會員資料</h2>
            <p className="mt-4 text-sm leading-7 text-zinc-500">
              可直接更新會員姓名、電話、Email 與地址，方便後續結帳資料自動帶入。
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-zinc-900">
                  姓名
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(event) => handleEditFieldChange("name", event.target.value)}
                  className={inputClassName}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-zinc-900">
                  電話
                </label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(event) => handleEditFieldChange("phone", event.target.value)}
                  className={inputClassName}
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-zinc-900">
                  Email
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(event) => handleEditFieldChange("email", event.target.value)}
                  className={inputClassName}
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-zinc-900">
                  地址
                </label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(event) => handleEditFieldChange("address", event.target.value)}
                  placeholder="輸入完整地址"
                  className={inputClassName}
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                onClick={() => void handleSaveMember()}
                className="h-11 flex-1 rounded-full bg-zinc-900 text-sm text-white hover:bg-zinc-800"
              >
                儲存會員資料
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingMember(null);
                  setEditForm(null);
                }}
                className="h-11 flex-1 rounded-full border-zinc-200 text-sm text-zinc-900 hover:bg-zinc-100"
              >
                取消
              </Button>
            </div>
          </div>
        </div>
      )}

      {deletingMember && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 px-6 py-8"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setDeletingMember(null);
            }
          }}
        >
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-orange-600">
              Member
            </p>
            <h2 className="mt-3 text-2xl font-black text-zinc-900">確認刪除會員</h2>
            <p className="mt-4 text-sm leading-7 text-zinc-600">
              確定要刪除會員「{deletingMember.name}」嗎？刪除後將無法恢復，
              {deletingMember.isLineLinked
                ? "包含已綁定的 LINE 狀態也會一起清除。"
                : "請再次確認後再送出。"}
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                onClick={() => void handleDeleteMember()}
                className="h-11 flex-1 rounded-full bg-red-600 text-sm text-white hover:bg-red-700"
              >
                確認刪除
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeletingMember(null)}
                className="h-11 flex-1 rounded-full border-zinc-200 text-sm text-zinc-900 hover:bg-zinc-100"
              >
                取消
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
