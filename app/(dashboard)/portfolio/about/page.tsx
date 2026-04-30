"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/PageHeader";
import { usePortfolio } from "@/store/useAppStore";
import { toast } from "sonner";
import { User, Save, RefreshCw } from "lucide-react";

export default function PortfolioAboutPage() {
  const { about, setAbout } = usePortfolio();
  const [draft, setDraft] = useState({ short: "", full: "", detailed: "" });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (about) {
      setDraft(about);
    }
  }, [about]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      setAbout(draft);
      toast.success("Bio updated successfully");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="About & Bio"
        description="Manage the biographical content for your portfolio website."
      />

      <div className="grid gap-6 max-w-4xl">
        <Card className="shadow-ios border-border/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="w-5 h-5 text-primary" />Biography Details</CardTitle>
            <CardDescription>This information appears in the Hero and About sections of your portfolio.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Short Bio (Hero Hook)</label>
              <Textarea 
                placeholder="A one-sentence summary of what you do..." 
                value={draft.short} 
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDraft({ ...draft, short: e.target.value })}
                rows={2}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Full Bio (About Section)</label>
              <Textarea 
                placeholder="A comprehensive introduction to your professional background..." 
                value={draft.full} 
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDraft({ ...draft, full: e.target.value })}
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Detailed/Secondary Bio</label>
              <Textarea 
                placeholder="Additional details about your philosophy or approach..." 
                value={draft.detailed} 
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDraft({ ...draft, detailed: e.target.value })}
                rows={4}
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleSave} disabled={isSaving} className="min-w-[120px]">
                {isSaving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/10">
          <CardContent className="p-6">
            <h4 className="text-sm font-bold mb-2">Live Preview Tip</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              These fields are synchronized with your portfolio's data layer. Once saved, they will be reflected on the live site upon the next data fetch. Use clear, professional language that highlights your unique value proposition.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
