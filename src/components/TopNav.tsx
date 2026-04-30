import { Bell, Search, User, LogOut, Settings as SettingsIcon, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import Link from "next/link";

export function TopNav() {
  const notifCount = 3;
  return (
    <header className="h-16 border-b border-border/60 bg-card/60 backdrop-blur-2xl flex items-center px-3 sm:px-4 lg:px-6 gap-2 sm:gap-4 sticky top-0 z-30">
      <SidebarTrigger className="shrink-0 transition-transform duration-300 active:scale-90" />

      <div className="flex-1 max-w-xl relative hidden sm:block">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
        <Input
          placeholder="Search across your workspace…"
          className="pl-10 pr-16 h-9 rounded-full bg-muted/50 border-transparent focus-visible:bg-background focus-visible:border-border transition-all"
        />
        <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden md:inline-flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground bg-background border border-border/60 rounded-md px-1.5 py-0.5">
          <Command className="w-2.5 h-2.5" />K
        </kbd>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <Button variant="ghost" size="icon" className="sm:hidden transition-transform active:scale-90" aria-label="Search">
          <Search className="w-5 h-5" />
        </Button>

        <Button variant="ghost" size="icon" className="relative transition-transform active:scale-90" aria-label="Notifications">
          <Bell className="w-5 h-5" />
          {notifCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2">
              <span className="ping-dot relative block w-2 h-2 rounded-full bg-primary" />
            </span>
          )}
        </Button>

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 transition-transform hover:scale-105 active:scale-95">
              <Avatar className="h-9 w-9 ring-1 ring-border/60">
                <AvatarFallback className="bg-gradient-to-br from-foreground to-foreground/70 text-background text-sm font-semibold">
                  KK
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 rounded-xl border-border/60 backdrop-blur-2xl bg-popover/90" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">Keith Kiptum</p>
                <p className="text-xs text-muted-foreground">kegdwa@gmail.com</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/portfolio" className="cursor-pointer w-full flex items-center">
                <User className="mr-2 h-4 w-4" />Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer w-full flex items-center">
                <SettingsIcon className="mr-2 h-4 w-4" />Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
