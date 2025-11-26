import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import apiClient from "@/services/api";
import { Deal } from "../types";
import { DealColumn } from "./DealColumn";
import { getStageLabel } from "../utils/dealUtils";

interface DealPipelineProps {
  deals: Deal[];
  onDealMoved: () => void;
}

export const DealPipeline = ({ deals, onDealMoved }: DealPipelineProps) => {
  const [draggedDeal, setDraggedDeal] = useState<string | null>(null);

  const handleDragStart = (dealId: string) => {
    setDraggedDeal(dealId);
  };

  const handleDragEnd = () => {
    setDraggedDeal(null);
  };

  const handleDrop = async (e: React.DragEvent, newStage: string) => {
    e.preventDefault();
    if (!draggedDeal) return;

    try {
      await apiClient.patch(`/deals/${draggedDeal}/`, {
        stage: newStage
      });

      toast.success("Deal déplacé avec succès !");
      onDealMoved();
    } catch (error: any) {
      console.error('Error moving deal:', error);
      toast.error(error.response?.data?.error || "Erreur lors du déplacement du deal");
    } finally {
      setDraggedDeal(null);
    }
  };

  const groupedDeals = {
    prospection: deals.filter((d) => d.stage === "prospection"),
    negociation: deals.filter((d) => d.stage === "negociation"),
    gagne: deals.filter((d) => d.stage === "gagne"),
    perdu: deals.filter((d) => d.stage === "perdu"),
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {Object.entries(groupedDeals).map(([stage, stageDeals]) => (
        <DealColumn
          key={stage}
          stage={stage}
          stageLabel={getStageLabel(stage)}
          deals={stageDeals}
          draggedDeal={draggedDeal}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDrop={handleDrop}
        />
      ))}
    </div>
  );
};