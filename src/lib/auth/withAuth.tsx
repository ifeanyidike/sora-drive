import React, { ComponentType, useEffect } from "react";
import { useAuth } from "./context";
import { useRouter } from "next/navigation";

export const withAuth = (Component: ComponentType<any>) => {
  const displayName = Component.displayName || Component.name || "Component";
  const AuthenticatedComponent = (props: any) => {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !user) {
        router.push("/");
      }
    }, [user, loading, router]);

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          Loading...
        </div>
      );
    }

    return user ? <Component {...props} /> : null;
  };
  AuthenticatedComponent.displayName = `withAuth(${displayName})`;
  return AuthenticatedComponent;
};
