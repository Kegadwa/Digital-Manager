import { ThemeToggle } from "@/components/ThemeToggle";
import { CommandMenu } from "./CommandMenu";
import { useNotifications } from "@/store/useAppStore";
import { formatDistanceToNow } from "date-fns";
import { CheckSquare, Activity, DollarSign, Info, Bell, Search, User, LogOut, Settings as SettingsIcon, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import Link from "next/link";

export function TopNav() {
  const { notifications, markAsRead, clearAll } = useNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;
  return (
    <header className="h-16 border-b border-border/60 bg-card/60 backdrop-blur-2xl flex items-center px-3 sm:px-4 lg:px-6 gap-2 sm:gap-4 sticky top-0 z-30">
      <SidebarTrigger className="shrink-0 transition-transform duration-300 active:scale-90" />

        <CommandMenu />

      <div className="flex-1" />

      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative transition-transform active:scale-90" aria-label="Notifications">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2">
                  <span className="ping-dot relative block w-2 h-2 rounded-full bg-primary" />
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80 rounded-xl border-border/60 backdrop-blur-2xl bg-popover/90 p-0 overflow-hidden" align="end">
            <div className="p-4 border-b border-border/60 flex items-center justify-between">
              <h3 className="font-semibold text-sm">Notifications</h3>
              {unreadCount > 0 && <Button variant="ghost" className="h-auto p-0 text-[10px] text-primary" onClick={clearAll}>Clear all</Button>}
            </div>
            <div className="max-h-[350px] overflow-y-auto">
              {notifications.length === 0 && (
                <div className="py-12 text-center text-muted-foreground">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-xs">No new notifications</p>
                </div>
              )}
              {notifications.map((n) => {
                const Icon = n.type === "task" ? CheckSquare : n.type === "project" ? Activity : n.type === "finance" ? DollarSign : Info;
                return (
                  <DropdownMenuItem 
                    key={n.id} 
                    className="p-4 cursor-pointer focus:bg-muted/50 border-b border-border/40 last:border-0 flex gap-3 items-start"
                    onClick={() => markAsRead(n.id)}
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-none mb-1">{n.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-2">{formatDistanceToNow(new Date(n.timestamp))} ago</p>
                    </div>
                    {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />}
                  </DropdownMenuItem>
                );
              })}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

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
