import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Heart, Plus, X } from "lucide-react";

interface CareNeedsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  onUpdate?: () => void;
}

export const CareNeedsDialog = ({
  open,
  onOpenChange,
  clientId,
  clientName,
  onUpdate,
}: CareNeedsDialogProps) => {
  const [careTypes, setCareTypes] = useState<any[]>([]);
  const [selectedCareTypes, setSelectedCareTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      fetchCareTypes();
      fetchClientCareNeeds();
    }
  }, [open, clientId]);

  const fetchCareTypes = async () => {
    const { data, error } = await supabase
      .from("care_types")
      .select("*")
      .eq("is_active", true)
      .order("category", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      toast.error("Failed to load care types");
    } else {
      setCareTypes(data || []);
    }
  };

  const fetchClientCareNeeds = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("client_care_needs")
      .select("care_type_code")
      .eq("client_id", clientId);

    if (error) {
      toast.error("Failed to load care needs");
    } else {
      setSelectedCareTypes(data?.map(cn => cn.care_type_code) || []);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Delete existing care needs
      await supabase
        .from("client_care_needs")
        .delete()
        .eq("client_id", clientId);

      // Insert new care needs
      if (selectedCareTypes.length > 0) {
        const careNeedsData = selectedCareTypes.map((code, idx) => ({
          client_id: clientId,
          care_type_code: code,
          priority: idx + 1,
        }));

        const { error } = await supabase
          .from("client_care_needs")
          .insert(careNeedsData);

        if (error) throw error;
      }

      toast.success("Care needs updated successfully");
      onUpdate?.();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update care needs");
    } finally {
      setSaving(false);
    }
  };

  const toggleCareType = (code: string) => {
    setSelectedCareTypes(prev =>
      prev.includes(code)
        ? prev.filter(c => c !== code)
        : [...prev, code]
    );
  };

  const groupedCareTypes = careTypes.reduce((acc, type) => {
    if (!acc[type.category]) {
      acc[type.category] = [];
    }
    acc[type.category].push(type);
    return acc;
  }, {} as Record<string, any[]>);
  
  const groupedEntries = Object.entries(groupedCareTypes) as [string, any[]][];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Care Needs - {clientName}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedEntries.map(([category, types]) => (
                <div key={category} className="space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase">
                    {category}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {types.map((type) => {
                      const isSelected = selectedCareTypes.includes(type.code);
                      return (
                        <Badge
                          key={type.code}
                          variant={isSelected ? "default" : "outline"}
                          className="cursor-pointer hover:scale-105 transition-transform px-3 py-1.5"
                          onClick={() => toggleCareType(type.code)}
                        >
                          {isSelected ? (
                            <X className="h-3 w-3 mr-1" />
                          ) : (
                            <Plus className="h-3 w-3 mr-1" />
                          )}
                          {type.name}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Care Needs"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
