import { AuthForm } from "@/components/auth-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | OptiScreen",
  description: "Sign in to access your OptiScreen diagnostic dashboard.",
};

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
