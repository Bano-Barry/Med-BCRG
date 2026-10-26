import React from 'react';
import { Pill, Clock } from 'lucide-react';

export const PharmaciePage: React.FC = () => {
  return (
    <div className="h-[80vh] flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-12 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center max-w-lg text-center">
        <div className="relative">
          <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <Pill className="w-12 h-12 text-emerald-500" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center border-4 border-white shadow-sm">
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-slate-800 mb-3">Module Pharmacie</h1>
        <p className="text-slate-500 text-lg mb-8 leading-relaxed">
          Cette section est en cours de développement. Elle vous permettra bientôt de gérer le stock de médicaments, les alertes de péremption et les délivrances.
        </p>
        
        <div className="inline-flex items-center gap-2 px-6 py-3 bg-slate-50 border border-slate-200 text-slate-700 rounded-full font-medium shadow-sm">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          Bientôt disponible...
        </div>
      </div>
    </div>
  );
};
