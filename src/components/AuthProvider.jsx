import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return ctx;
}

async function fetchProfile() {
  const { data, error } = await supabase.rpc("get_own_profile");
  if (error) throw error;
  return Array.isArray(data) ? (data[0] ?? null) : data;
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const data = await fetchProfile();
      setProfile(data);
    } catch {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return undefined;
    }

    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        loadProfile();
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = useCallback(
    async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.session?.user) {
        throw new Error("Sessão não iniciada. Confirme seu e-mail e tente novamente.");
      }
      setUser(data.user);
      setLoading(false);
      loadProfile();
      return data;
    },
    [loadProfile]
  );

  const signUp = useCallback(
    async ({ nome, email, telefone, password, endereco }) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome,
            telefone,
            cep: endereco?.cep ?? null,
            logradouro: endereco?.logradouro ?? null,
            numero: endereco?.numero ?? null,
            bairro: endereco?.bairro ?? null,
            cidade: endereco?.cidade ?? null,
            lat: endereco?.lat ?? null,
            lng: endereco?.lng ?? null,
          },
        },
      });
      if (error) throw error;
      if (data.session?.user) {
        setUser(data.user);
        setLoading(false);
        loadProfile();
      }
      return data;
    },
    [loadProfile]
  );

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setProfile(null);
  }, []);

  const updateProfile = useCallback(
    async ({ nome, telefone, endereco }) => {
      if (!user) throw new Error("Usuário não autenticado");

      const payload = { nome, telefone };
      if (endereco) {
        payload.cep = endereco.cep;
        payload.logradouro = endereco.logradouro;
        payload.numero = endereco.numero;
        payload.bairro = endereco.bairro;
        payload.cidade = endereco.cidade;
        payload.lat = endereco.lat;
        payload.lng = endereco.lng;
      }

      const { error } = await supabase.from("profiles").update(payload).eq("id", user.id);
      if (error) throw error;

      const data = await fetchProfile();
      setProfile(data);
      return data;
    },
    [user]
  );

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      isConfigured: isSupabaseConfigured,
      signIn,
      signUp,
      signOut,
      updateProfile,
    }),
    [user, profile, loading, signIn, signUp, signOut, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
