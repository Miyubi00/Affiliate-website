import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function ProtectedRoute({ children }) {
  const router = useRouter();
  const [isAuth, setIsAuth] = useState(null); // null = loading, true/false = sudah dicek

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (!loggedIn) {
      router.replace("/login");
    } else {
      setIsAuth(true);
    }
  }, [router]);

  if (isAuth === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a] text-white">
        Loading...
      </div>
    );
  }

  return <>{children}</>;
}
