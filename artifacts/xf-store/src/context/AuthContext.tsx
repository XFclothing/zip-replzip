import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase, Profile } from "@/lib/supabase";

export type Role = "user" | "worker" | "founder";

const FOUNDER_EMAILS = ["xfclothing@gmail.com", "xaviermalucha@gmail.com"];

export interface WorkerRecord {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  role: string;
  permissions: {
    view_orders: boolean;
    manage_orders: boolean;
    manage_tickets: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  role: Role;
  workerRecord: WorkerRecord | null;
  session: Session | null;
  loading: boolean;
  signUp: (name: string, email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<Role>("user");
  const [workerRecord, setWorkerRecord] = useState<WorkerRecord | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile(userId: string) {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (data) {
      setProfile(data as Profile);
    } else {
      // Profile missing — create it now and confirm it was written
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const name = authUser.user_metadata?.name || authUser.email?.split("@")[0] || "";
        const email = authUser.email || "";
        const { data: upserted } = await supabase
          .from("profiles")
          .upsert({ id: userId, name, email, shipping_address: null }, { onConflict: "id" })
          .select()
          .single();
        setProfile(
          upserted
            ? (upserted as Profile)
            : { id: userId, name, email, shipping_address: null, created_at: new Date().toISOString() }
        );
      }
    }
  }

  async function detectRole(email: string, userId: string) {
    if (FOUNDER_EMAILS.includes(email.toLowerCase())) {
      setRole("founder");
      setWorkerRecord(null);
      return;
    }
    const { data } = await supabase
      .from("admins")
      .select("*")
      .eq("email", email.toLowerCase())
      .single();
    if (data) {
      setRole("worker");
      const rec = data as WorkerRecord;
      if (!rec.permissions) {
        rec.permissions = { view_orders: true, manage_orders: false, manage_tickets: false };
      }
      setWorkerRecord(rec);
      // link user_id if not yet set
      if (!rec.user_id) {
        await supabase.from("admins").update({ user_id: userId }).eq("email", email.toLowerCase());
      }
    } else {
      setRole("user");
      setWorkerRecord(null);
    }
  }

  async function refreshProfile() {
    if (user) await fetchProfile(user.id);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        detectRole(session.user.email!, session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        detectRole(session.user.email!, session.user.id);
      } else {
        setProfile(null);
        setRole("user");
        setWorkerRecord(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signUp(name: string, email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) {
      if (error.message.toLowerCase().includes("sending") || error.message.toLowerCase().includes("smtp") || error.message.toLowerCase().includes("email")) {
        return { error: "Email confirmation could not be sent. In Supabase → Authentication → Settings, disable 'Enable email confirmations' to allow signup without email verification." };
      }
      return { error: error.message };
    }
    // Supabase returns an empty identities array when the email already exists
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      return { error: "An account with this email already exists. Please sign in instead." };
    }
    if (data.user) {
      // upsert handles both cases: trigger already created the row, or no trigger set up
      await supabase.from("profiles").upsert(
        { id: data.user.id, name, email, shipping_address: null },
        { onConflict: "id" }
      );
    }
    return { error: null };
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ user, profile, role, workerRecord, session, loading, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
