import React from 'react';
import { Construction } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, description }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <Construction className="w-8 h-8 text-slate-400" />
      </div>
      <h2 className="text-lg font-bold text-slate-700 mb-2">{title}</h2>
      <p className="text-sm text-slate-500 max-w-sm">{description}</p>
      <span className="mt-4 text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">Próximamente — F4.2</span>
    </div>
  );
};
