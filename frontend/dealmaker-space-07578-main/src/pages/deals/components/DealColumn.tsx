import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Deal } from "../types";
import { DealCard } from "./DealCard";

interface DealColumnProps {
  stage: string;
  stageLabel: string;
  deals: Deal[];
  draggedDeal: string | null;
  onDragStart: (dealId: string) => void;
  onDragEnd: () => void;
  onDrop: (e: React.DragEvent, newStage: string) => void;
}

export const DealColumn = ({
  stage,
  stageLabel,
  deals,
  draggedDeal,
  onDragStart,
  onDragEnd,
  onDrop
}: DealColumnProps) => {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div 
      className="space-y-4"
      onDragOver={handleDragOver}
      onDrop={(e) => onDrop(e, stage)}
    >
      <h3 className="font-semibold text-lg flex items-center gap-2">
        {stageLabel}
        <Badge variant="secondary">{deals.length}</Badge>
      </h3>
      <div className="space-y-3 min-h-[200px] p-2 rounded-lg transition-colors bg-muted/20">
        {deals.map((deal) => (
          <DealCard
            key={deal.id}
            deal={deal}
            draggedDeal={draggedDeal}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        ))}
        {deals.length === 0 && (
          <Card className="border-dashed bg-gray-50/50">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Aucun deal
              <p className="text-xs mt-1">Déposez un deal ici</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};