"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  CalendarDays,
  StickyNote,
  Settings,
  PieChart,
  FileText,
  User,
  Briefcase,
  GraduationCap,
  Award,

  Quote,
  Share2,
  CheckSquare,
  Folder,
  Code2,
  Palette,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const main = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Tasks", url: "/tasks", icon: CheckSquare },
  { title: "Projects", url: "/projects", icon: Folder },
  { title: "Finance", url: "/finance", icon: Wallet },
  { title: "Calendar", url: "/calendar", icon: CalendarDays },
  { title: "Notes", url: "/notes", icon: StickyNote },
  { title: "Files", url: "/files", icon: FileText },
];

const tools = [
  { title: "Analytics", icon: PieChart, url: "/analytics" },
];

const portfolio = [
  { title: "Projects", icon: Folder, url: "/portfolio/projects" },
  { title: "Design Projects", icon: Palette, url: "/portfolio/design" },
  { title: "Experience", icon: Briefcase, url: "/portfolio/experience" },
  { title: "Education", icon: GraduationCap, url: "/portfolio/education" },
  { title: "Certifications", icon: Award, url: "/portfolio/certifications" },
  { title: "Tools", icon: Code2, url: "/portfolio/tools" },
  { title: "Testimonials", icon: Quote, url: "/portfolio/testimonials" },
  { title: "Social", icon: Share2, url: "/portfolio/social" },
  { title: "About", icon: User, url: "/portfolio/about" },
];

const system = [
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = usePathname();

  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path);

  const navClass = (path: string) =>
    cn(
      "w-full transition-all duration-300 ease-spring rounded-xl flex items-center gap-3 py-2",
      collapsed ? "justify-center px-0" : "px-3",
      "active:scale-[0.97]",
      isActive(path)
        ? "bg-primary/10 text-primary font-medium"
        : "text-sidebar-foreground hover:bg-sidebar-accent hover:-translate-y-px"
    );

  const renderGroup = (items: typeof main, label: string) => (
    <SidebarGroup>
      {!collapsed && (
        <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60 px-2">
          {label}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild className="h-9" tooltip={item.title}>
                <Link href={item.url} className={navClass(item.url)}>
                  <item.icon className={cn("w-[17px] h-[17px] shrink-0 transition-transform duration-300 group-hover:scale-110", isActive(item.url) && "text-primary")} />
                  {!collapsed && <span className="text-[13px]">{item.title}</span>}
                  {!collapsed && isActive(item.url) && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary animate-breathe" />
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar/70 backdrop-blur-2xl">
      <SidebarContent className="p-3 gap-1.5">
        {/* Brand */}
        <div className={cn("flex items-center gap-2.5 px-2 py-3", collapsed && "justify-center px-0")}>
          <div className="w-9 h-9 rounded-2xl overflow-hidden shrink-0 shadow-ios">
            <Image src="/logo.png" alt="Digital Hub" width={36} height={36} className="w-full h-full object-cover" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="font-display font-semibold text-[15px] tracking-tight">Digital Hub</span>
              <span className="text-[10px] text-muted-foreground font-medium tracking-wide">Productivity OS</span>
            </div>
          )}
        </div>

        {navClass("/") && renderGroup(main, "Workspace")}
        {renderGroup(portfolio, "Portfolio")}
        {renderGroup(tools, "Insights")}
        {renderGroup(system, "System")}
      </SidebarContent>
    </Sidebar>
  );
}
