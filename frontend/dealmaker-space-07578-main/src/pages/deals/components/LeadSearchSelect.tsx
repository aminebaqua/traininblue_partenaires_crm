import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AvailableRelation } from "../types";

interface LeadSearchSelectProps {
  leads: AvailableRelation[];
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  hasError?: boolean;
}

export const LeadSearchSelect = ({ 
  leads, 
  value, 
  onValueChange, 
  disabled = false,
  hasError = false 
}: LeadSearchSelectProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredLeads, setFilteredLeads] = useState<AvailableRelation[]>(leads);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredLeads(leads);
    } else {
      const filtered = leads.filter(lead =>
        lead.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.contact_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredLeads(filtered);
    }
  }, [searchTerm, leads]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const handleValueChange = (newValue: string) => {
    console.log('✅ Nouvelle valeur sélectionnée:', newValue);
    onValueChange(newValue);
    setSearchTerm('');
    setIsOpen(false);
  };

  const selectedLead = leads.find(lead => lead.id === value);

  return (
    <Select 
      value={value} 
      onValueChange={handleValueChange}
      disabled={disabled}
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <SelectTrigger className={hasError ? "border-red-500" : ""}>
        <SelectValue placeholder="Rechercher un lead...">
          {selectedLead ? (
            <div className="flex flex-col text-left">
              <span className="font-medium truncate">{selectedLead.contact_name}</span>
              <span className="text-xs text-muted-foreground truncate">
                {selectedLead.company_name}
              </span>
            </div>
          ) : (
            "Rechercher un lead..."
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-80">
        <div className="p-2 border-b space-y-2">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Rechercher par entreprise ou contact..."
              className="h-8 flex-1"
              value={searchTerm}
              onChange={handleSearchChange}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') {
                  e.preventDefault();
                }
              }}
            />
            {searchTerm && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  clearSearch();
                }}
              >
                ×
              </Button>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {filteredLeads.length} relation(s) trouvée(s)
          </div>
        </div>
        
        <div className="max-h-60 overflow-y-auto">
          {filteredLeads.length > 0 ? (
            filteredLeads.map((lead) => (
              <SelectItem 
                key={lead.id} 
                value={lead.id}
                className="cursor-pointer py-2"
                onClick={() => console.log('🖱️ Item cliqué:', lead.id)}
              >
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{lead.contact_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {lead.company_name}
                  </span>
                  {lead.email && (
                    <span className="text-xs text-muted-foreground truncate">
                      {lead.email}
                    </span>
                  )}
                </div>
              </SelectItem>
            ))
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <div>🚫</div>
              <div className="mt-1">
                {searchTerm ? `Aucune relation trouvée pour "${searchTerm}"` : 'Aucune relation disponible'}
              </div>
              {searchTerm && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearSearch();
                  }}
                >
                  Effacer la recherche
                </Button>
              )}
            </div>
          )}
        </div>
      </SelectContent>
    </Select>
  );
};