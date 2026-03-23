import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { AdminActionLoadingOverlay } from "./AdminActionLoadingOverlay";
import { useAuth } from "../context/useAuth";
import { getAdminUsers, updateUserRole } from "../lib/admin-users";
import type { AdminUserEntry, UserRole } from "../types/auth";

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

const roleLabels: Record<UserRole, string> = {
  CUSTOMER: "一般會員",
  ADMIN: "管理員",
};

const roleOptions: UserRole[] = ["CUSTOMER", "ADMIN"];

export const AdminMembers = () => {
  const { isAuthReady, isAuthenticated, user } = useAuth();
  const [members, setMembers] = useState<AdminUserEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

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

        setError(fetchError instanceof Error ? fetchError.message : "會員資料載入失敗。");
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

  const handleRoleChange = async (userId: string, role: UserRole) => {
    setUpdatingUserId(userId);
    setError(null);

    try {
      await Promise.all([
        updateUserRole(userId, { role }),
        wait(MIN_ACTION_LOADING_MS),
      ]);
      setMembers((currentMembers) =>
        currentMembers.map((member) =>
          member.id === userId ? { ...member, role } : member,
        ),
      );
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "更新會員角色失敗。");
    } finally {
      setUpdatingUserId(null);
    }
  };

  if (!isAuthReady) {
    return (
      <main className="min-h-screen bg-white px-6 pb-24 pt-40">
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-zinc-100 bg-zinc-50 px-8 py-16 text-center">
          <p className="text-sm text-zinc-500">載入管理權限中...</p>
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
          <h1 className="mt-4 text-4xl font-black tracking-tight text-zinc-900 md:text-6xl">
            請先登入管理員帳號
          </h1>
          <p className="mt-4 text-sm leading-7 text-zinc-500">
            後台僅限管理員查看，請先登入後再進入會員管理頁。
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
          <h1 className="mt-4 text-4xl font-black tracking-tight text-zinc-900 md:text-6xl">
            目前沒有後台權限
          </h1>
          <p className="mt-4 text-sm leading-7 text-zinc-500">
            請使用管理員帳號登入後，再查看會員管理頁。
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-6 pb-24 pt-40 lg:h-full lg:overflow-hidden lg:pb-10 lg:pt-5">
      {updatingUserId && (
        <AdminActionLoadingOverlay title="會員角色更新中..." />
      )}

      <div className="mx-auto max-w-6xl lg:flex lg:h-full lg:flex-col">
        <div className="shrink-0">
        <div className="mb-12 flex flex-col gap-6 border-b border-zinc-100 pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.4em] text-orange-600">
              Admin
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-zinc-900 md:text-6xl">
              會員管理
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-500">
              這裡可以查看站上會員名單、訂單數量與目前角色，並直接調整管理員權限。
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
            會員資料載入中...
          </div>
        ) : members.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-zinc-200 bg-zinc-50 px-8 py-16 text-center">
            <p className="text-2xl font-bold text-zinc-900">目前還沒有會員資料</p>
            <p className="mt-3 text-sm text-zinc-500">
              等前台有會員註冊後，這裡就會開始顯示會員名單。
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {members.map((member) => {
              const isUpdating = updatingUserId === member.id;

              return (
                <article
                  key={member.id}
                  className="rounded-[2rem] border border-zinc-100 bg-white p-5 shadow-sm md:p-6"
                >
                  <div className="grid gap-5 lg:grid-cols-[1.1fr_0.8fr_0.55fr]">
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.32em] text-orange-600">
                          Member
                        </p>
                        <h2 className="mt-2 text-2xl font-black text-zinc-900">
                          {member.name}
                        </h2>
                      </div>

                      <div className="grid gap-3 text-sm text-zinc-500 md:grid-cols-2">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.28em] text-zinc-400">
                            電話
                          </p>
                          <p className="mt-2 font-semibold text-zinc-900">{member.phone}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.28em] text-zinc-400">
                            Email
                          </p>
                          <p className="mt-2 break-all font-semibold text-zinc-900">
                            {member.email}
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
                        更新角色後，該會員下次重新整理或重新登入時就會套用新的後台權限。
                      </p>
                    </div>

                    <div className="flex flex-col justify-between gap-4 rounded-3xl border border-zinc-100 px-5 py-5">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.28em] text-zinc-400">
                          角色切換
                        </p>
                        <select
                          value={member.role}
                          disabled={isUpdating}
                          onChange={(event) =>
                            void handleRoleChange(
                              member.id,
                              event.target.value as UserRole,
                            )
                          }
                          className="mt-3 h-11 w-full rounded-full border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 outline-none transition-colors focus:border-orange-400 disabled:cursor-not-allowed disabled:bg-zinc-100"
                        >
                          {roleOptions.map((role) => (
                            <option key={role} value={role}>
                              {roleLabels[role]}
                            </option>
                          ))}
                        </select>
                      </div>

                      <Button
                        type="button"
                        disabled
                        className="h-11 rounded-full bg-zinc-900 text-sm text-white opacity-100 disabled:cursor-default disabled:bg-zinc-900"
                      >
                        {isUpdating ? "更新中..." : "角色即時更新"}
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        </div>
      </div>
    </main>
  );
};
