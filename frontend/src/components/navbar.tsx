"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface NavbarProps {
  userEmail?: string;
}

export function Navbar({ userEmail }: NavbarProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#232B36] bg-[#12171F]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />
        <div className="flex items-center gap-4">
          {userEmail && (
            <span className="hidden font-mono text-xs tracking-wider text-[#8B96A5] sm:inline-block">
              {userEmail}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="gap-2 border border-[#232B36] bg-[#1A212B] text-xs font-mono tracking-wider text-[#E8ECF1] hover:border-[#2E3742] hover:bg-[#232B36]"
          >
            <LogOut className="h-3.5 w-3.5 text-[#8B96A5]" />
            <span>SIGN OUT</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
