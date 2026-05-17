// ====================================================================
// ChatList - الشاشة الرئيسية الحديثة: نشطون + غرف الدردشة
// ====================================================================

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, type Friendship, type Profile, type Room } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";
import AppShell from "@/components/AppShell";
import UserAvatar from "@/components/UserAvatar";
import { Bell, Loader2, MessageCircle, Search } from "lucide-react";

export default function ChatList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeUsers, setActiveUsers] = useState<Profile[]>([]);
  const [friends, setFriends] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHome = async () => {
      if (!user) return;
      const onlineSince = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      const [roomsRes, usersRes, friendsRes] = await Promise.all([
        supabase
          .from("rooms")
          .select("*")
          .eq("is_active", true)
          .eq("status", "approved")
          .eq("is_dm", false)
          .order("created_at", { ascending: false }),
        supabase
          .from("profiles")
          .select("*")
          .gte("last_seen_at", onlineSince)
          .order("last_seen_at", { ascending: false })
          .limit(20),
        supabase
          .from("friendships")
          .select("*")
          .eq("status", "accepted")
          .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`),
      ]);

      const friendships = (friendsRes.data as Friendship[]) ?? [];
      const friendIds = friendships.map((f) => f.requester_id === user.id ? f.addressee_id : f.requester_id);
      const { data: friendProfiles } = friendIds.length
        ? await supabase.from("profiles").select("*").in("id", friendIds).order("last_seen_at", { ascending: false })
        : { data: [] as Profile[] };

      setRooms((roomsRes.data as Room[]) ?? []);
      setActiveUsers((usersRes.data as Profile[]) ?? []);
      setFriends((friendProfiles as Profile[]) ?? []);
      setLoading(false);
    };
    loadHome();
  }, [user]);

  const roomIds = useMemo(() => rooms.map((r) => r.id), [rooms]);
  const { counts } = useUnreadCounts(user?.id ?? null, roomIds);

  return (
    <AppShell>
      <div className="pt-1 anim-fade-in">
        <section className="flex items-center justify-between mb-4">
          <div className="px-4">
            <h1 className="text-3xl font-black leading-tight">دردشاتي</h1>
          </div>
          <div className="flex items-center gap-2 px-4">
            <button className="w-11 h-11 rounded-full glass-thick flex items-center justify-center shadow-glassy active:scale-95 transition" aria-label="بحث">
              <Search className="w-5 h-5" />
            </button>
            <button onClick={() => navigate("/notifications")} className="w-11 h-11 rounded-full glass-thick flex items-center justify-center shadow-glassy active:scale-95 transition" aria-label="الإشعارات">
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </section>

        <section className="mb-2">
          <div className="px-4 flex gap-4 overflow-x-auto pb-3 snap-x">
            {activeUsers.length === 0 ? (
              <div className="glass rounded-[2rem] px-5 py-4 text-xs text-muted-foreground min-w-full text-center">
                لا يوجد مستخدمون نشطون الآن
              </div>
            ) : activeUsers.map((p) => (
              <button key={p.id} className="snap-start shrink-0 flex flex-col items-center gap-2 active:scale-95 transition">
                <div className="relative rounded-full p-1 glass-thick anim-scale-in">
                  <UserAvatar src={p.avatar_url} name={p.display_name || p.username} size="lg" online ring />
                </div>
                <span className="text-[11px] font-semibold max-w-16 truncate">{p.display_name || p.username}</span>
              </button>
            ))}
          </div>
        </section>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <section className="bg-card rounded-t-[2.5rem] p-5 shadow-glassy min-h-[520px]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black">الدردشات</h2>
              <button onClick={() => navigate("/friends")} className="text-xs font-bold text-muted-foreground">الأصدقاء</button>
            </div>
            <div className="h-12 rounded-[1.35rem] bg-background/70 border border-border flex items-center gap-2 px-4 mb-4">
              <Search className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">ابحث في الدردشات</span>
            </div>

            <div className="space-y-2.5">
              {friends.map((friend) => (
                <button
                  key={friend.id}
                  onClick={async () => {
                    const { data, error } = await supabase.rpc("get_or_create_dm", { other_user_id: friend.id });
                    if (data && !error) navigate(`/chat/${data}`);
                    else navigate("/friends");
                  }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-[1.5rem] hover:bg-background/40 active:scale-[0.98] transition text-right"
                >
                  <UserAvatar src={friend.avatar_url} name={friend.display_name || friend.username} size="md" online={activeUsers.some((p) => p.id === friend.id)} />
                  <div className="flex-1 min-w-0">
                    <b className="text-sm truncate block">{friend.display_name || friend.username}</b>
                    <p className="text-[11px] text-muted-foreground truncate">ابدأ محادثة خاصة آمنة</p>
                  </div>
                  <span className="text-[9px] text-muted-foreground/70 shrink-0">
                    {new Date(friend.last_seen_at).toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </button>
              ))}

              {friends.length > 0 && rooms.length > 0 && <p className="text-[11px] text-muted-foreground pt-3 px-1">الغرف النشطة</p>}

              {rooms.map((room) => {
              const unread = counts[room.id] ?? 0;
              return (
                <button
                  key={room.id}
                  onClick={() => navigate(`/chat/${room.id}`)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-[1.5rem] hover:bg-background/40 active:scale-[0.98] transition text-right"
                >
                  <div className="relative shrink-0">
                    {room.cover_url ? (
                      <img src={room.cover_url} alt={room.name} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-base">
                        {room.name.charAt(0)}
                      </div>
                    )}
                    {room.is_closed && (
                      <span className="absolute -bottom-1 -left-1 text-[9px] bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded-md font-bold">
                        مغلق
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline gap-2">
                      <b className="text-sm truncate">{room.name}</b>
                      <small className="text-muted-foreground/60 text-[10px] shrink-0">
                        {new Date(room.created_at).toLocaleDateString("ar")}
                      </small>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 truncate">
                      {room.description || "اضغط للدخول"}
                    </p>
                  </div>
                  {unread > 0 && (
                    <span className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-destructive text-destructive-foreground text-[11px] font-bold flex items-center justify-center shrink-0">
                      {unread > 99 ? "99+" : unread}
                    </span>
                  )}
                </button>
              );
              })}
            </div>

            {friends.length === 0 && rooms.length === 0 && (
              <div className="text-center py-16">
                <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">لا توجد دردشات بعد</p>
                <button onClick={() => navigate("/rooms")} className="mt-4 text-sm font-semibold text-foreground underline">
                  تصفّح الغرف
                </button>
              </div>
            )}
          </section>
        )}
      </div>
    </AppShell>
  );
}
