import { AuthForm } from "@/components/auth-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account | OptiScreen",
  description: "Create your OptiScreen account for clinical-grade cataract screening.",
};

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}
