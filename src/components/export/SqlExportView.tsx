import React, { useState } from 'react';
import { Database, Download, Copy, Check } from 'lucide-react';
// Migration real aplicada no Supabase (embutida no build pelo Vite)
import migrationSql from '../../../supabase/migrations/20261028120000_corvexa_app.sql?raw';

export const SqlExportView: React.FC = () => {
  const sqlContent: string = migrationSql;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([sqlContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'corvexa_supabase_migration.sql';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-600" />
            <span>CORVEXA · Migração Supabase em uso pelo sistema</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tabelas, triggers de regras de negócio, auditoria, políticas RLS por perfil e dados iniciais. O modelo conceitual de 34 entidades está em supabase/reference/.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleCopy}
            className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado!' : 'Copiar SQL'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Baixar .SQL</span>
          </button>
        </div>
      </div>

      {/* SQL Editor / Viewer */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>corvexa_supabase_migration.sql</span>
          <span>PostgreSQL 15+ / Supabase DDL + RLS</span>
        </div>
        <pre className="p-4 text-xs font-mono text-emerald-400 overflow-x-auto max-h-[600px] leading-relaxed select-all">
          {sqlContent}
        </pre>
      </div>
    </div>
  );
};
