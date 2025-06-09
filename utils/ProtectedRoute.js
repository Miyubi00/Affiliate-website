import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function ProtectedRoute({ children }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
      } else {
        setSession(session);
      }
      setIsLoading(false);
    };

    getSession();
  }, [router]);

  if (isLoading) {
    return <div className="text-white p-4">Loading...</div>;
  }

  return session ? children : null;
}
