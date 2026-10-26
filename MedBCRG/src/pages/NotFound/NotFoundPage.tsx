import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="text-9xl font-bold text-slate-200">404</h1>
      <h2 className="text-2xl font-semibold text-slate-800 mt-4">Page introuvable</h2>
      <p className="text-slate-500 mt-2 max-w-md">
        La page que vous recherchez n'existe pas ou a été déplacée.
      </p>
      <Link
        to="/"
        className="mt-8 flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-sm shadow-sky-200"
      >
        <Home className="w-5 h-5" />
        <span>Retour au tableau de bord</span>
      </Link>
    </div>
  );
};
