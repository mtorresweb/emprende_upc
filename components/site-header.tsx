"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { LayoutDashboard, LogOut, Sparkles, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/emprendimientos", label: "Emprendimientos" },
  { href: "/formacion", label: "Formación" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <span>Emprende UPC</span>
          </div>
          <nav className="ml-6 hidden items-center gap-4 md:flex">
            {links.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative inline-flex items-center pb-2 text-sm font-medium transition-colors",
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {link.label}
                  {isActive && (
                    <span className="pointer-events-none absolute -bottom-1.5 left-1/2 h-[3px] w-10 -translate-x-1/2 rounded-full bg-primary" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {status === "authenticated" && session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 rounded-full border border-border/60 bg-secondary p-0 hover:bg-secondary/80"
                  aria-label="Menú de usuario"
                >
                  <Avatar>
                    <AvatarImage alt="Avatar" src={(session.user as any).avatarKey || undefined} />
                    <AvatarFallback>
                      {session.user.name?.[0] || session.user.email?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="bottom"
                align="end"
                sideOffset={8}
                className="w-48 rounded-lg border border-border/70 bg-card p-2 shadow-lg dark:bg-card/95"
              >
                <DropdownMenuItem
                  asChild
                  className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-primary/15 focus:bg-primary/15 focus:text-foreground focus-visible:outline-none"
                >
                  <Link href="/panel" className="flex w-full items-center gap-3">
                    <LayoutDashboard className="h-4 w-4 text-primary" />
                    <span className="text-sm">Panel</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  asChild
                  className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-primary/15 focus:bg-primary/15 focus:text-foreground focus-visible:outline-none"
                >
                  <Link href="/perfil" className="flex w-full items-center gap-3">
                    <User className="h-4 w-4 text-primary" />
                    <span className="text-sm">Perfil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuItem
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-destructive hover:bg-destructive/15 focus:bg-destructive/15 focus:text-destructive focus-visible:outline-none"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  <LogOut className="h-4 w-4" />
                  <span className="text-sm">Salir</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Ingresar</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/registro">Registrar</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
