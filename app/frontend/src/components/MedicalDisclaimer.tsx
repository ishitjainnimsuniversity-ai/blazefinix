import React from 'react';
import { AlertCircle, ShieldAlert } from 'lucide-react';

interface MedicalDisclaimerProps {
  compact?: boolean;
}

export const MedicalDisclaimer: React.FC<MedicalDisclaimerProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-amber-50 border border-amber-200 text-slate-800 text-xs font-medium shadow-xs">
        <AlertCircle className="w-4 h-4 text-amber-800 shrink-0" />
        <span className="font-bold text-amber-950">CLINICAL NOTICE:</span>
        <span className="text-slate-800 font-medium">AI-generated risk assessment — not a final medical diagnosis. Clinical review required.</span>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200 text-slate-800 text-xs shadow-xs">
      <ShieldAlert className="w-4 h-4 text-amber-800 mt-0.5 shrink-0" />
      <div>
        <span className="font-bold text-amber-950">CLINICAL DECISION-SUPPORT NOTICE: </span>
        <span className="text-slate-800 font-medium">
          This software generates an AI-driven, research-grade risk assessment and does not produce a definitive medical diagnosis.
          All predictions, quantum probability outputs, and alert recommendations must be validated by a qualified healthcare professional before taking any clinical action.
        </span>
      </div>
    </div>
  );
};

