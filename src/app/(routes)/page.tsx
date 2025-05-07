"use client";

import React from "react";
import AuthForm from "@/app/components/auth/AuthForm";
import { useAuth } from "@/lib/auth/context";
import { redirect } from "next/navigation";

const LoginPage = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--google-blue)]"></div>
      </div>
    );
  }

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--google-light-grey)]">
      <AuthForm />
    </div>
  );
};

export default LoginPage;
