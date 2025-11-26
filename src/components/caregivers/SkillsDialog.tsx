import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Award, Plus, X, Star } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface SkillsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caregiverId: string;
  caregiverName: string;
  onUpdate?: () => void;
}

export const SkillsDialog = ({
  open,
  onOpenChange,
  caregiverId,
  caregiverName,
  onUpdate,
}: SkillsDialogProps) => {
  const [careTypes, setCareTypes] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      fetchCareTypes();
      fetchCaregiverSkills();
    }
  }, [open, caregiverId]);

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

  const fetchCaregiverSkills = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("caregiver_skills")
      .select(`
        *,
        care_types(code, name, category)
      `)
      .eq("caregiver_id", caregiverId);

    if (error) {
      toast.error("Failed to load skills");
    } else {
      setSkills(data || []);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Delete existing skills
      await supabase
        .from("caregiver_skills")
        .delete()
        .eq("caregiver_id", caregiverId);

      // Insert new skills
      if (skills.length > 0) {
        const skillsData = skills.map((skill) => ({
          caregiver_id: caregiverId,
          care_type_code: skill.care_type_code,
          proficiency_level: skill.proficiency_level || "intermediate",
          years_experience: skill.years_experience || 0,
          is_certified: skill.is_certified || false,
        }));

        const { error } = await supabase
          .from("caregiver_skills")
          .insert(skillsData);

        if (error) throw error;
      }

      toast.success("Skills updated successfully");
      onUpdate?.();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update skills");
    } finally {
      setSaving(false);
    }
  };

  const addSkill = (careTypeCode: string) => {
    const careType = careTypes.find(ct => ct.code === careTypeCode);
    if (!careType || skills.some(s => s.care_type_code === careTypeCode)) return;

    setSkills(prev => [...prev, {
      care_type_code: careTypeCode,
      care_types: careType,
      proficiency_level: "intermediate",
      years_experience: 0,
      is_certified: false,
    }]);
  };

  const removeSkill = (careTypeCode: string) => {
    setSkills(prev => prev.filter(s => s.care_type_code !== careTypeCode));
  };

  const updateSkill = (careTypeCode: string, field: string, value: any) => {
    setSkills(prev => prev.map(s => 
      s.care_type_code === careTypeCode 
        ? { ...s, [field]: value }
        : s
    ));
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
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Skills & Certifications - {caregiverName}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Current Skills */}
              {skills.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">Current Skills</h3>
                  {skills.map((skill) => (
                    <div key={skill.care_type_code} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium flex items-center gap-2">
                          {skill.care_types?.name}
                          {skill.is_certified && (
                            <Badge variant="secondary" className="gap-1">
                              <Star className="h-3 w-3 fill-current" />
                              Certified
                            </Badge>
                          )}
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSkill(skill.care_type_code)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label className="text-xs">Proficiency</Label>
                          <Select
                            value={skill.proficiency_level}
                            onValueChange={(value) => updateSkill(skill.care_type_code, "proficiency_level", value)}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="beginner">Beginner</SelectItem>
                              <SelectItem value="intermediate">Intermediate</SelectItem>
                              <SelectItem value="advanced">Advanced</SelectItem>
                              <SelectItem value="expert">Expert</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label className="text-xs">Years Experience</Label>
                          <Input
                            type="number"
                            min="0"
                            className="h-9"
                            value={skill.years_experience || 0}
                            onChange={(e) => updateSkill(skill.care_type_code, "years_experience", parseInt(e.target.value) || 0)}
                          />
                        </div>
                        
                        <div>
                          <Label className="text-xs">Certified</Label>
                          <Select
                            value={skill.is_certified ? "yes" : "no"}
                            onValueChange={(value) => updateSkill(skill.care_type_code, "is_certified", value === "yes")}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="yes">Yes</SelectItem>
                              <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Skills */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase">
                  Add Skills
                </h3>
                {groupedEntries.map(([category, types]) => (
                  <div key={category} className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground">{category}</h4>
                    <div className="flex flex-wrap gap-2">
                      {types.map((type) => {
                        const hasSkill = skills.some(s => s.care_type_code === type.code);
                        return (
                          <Badge
                            key={type.code}
                            variant={hasSkill ? "secondary" : "outline"}
                            className={`cursor-pointer hover:scale-105 transition-transform px-3 py-1.5 ${
                              hasSkill ? "opacity-50" : ""
                            }`}
                            onClick={() => !hasSkill && addSkill(type.code)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            {type.name}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Skills"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
