'use client';

import { useState, useEffect } from 'react';
import { useThemeStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Monitor, Download, Upload } from 'lucide-react';
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import type { ExportData } from '@/types';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { theme, setTheme } = useThemeStore();
  const qc = useQueryClient();
  const router = useRouter();

  const handleExport = async () => {
    try {
      const data = await api.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `linkvault-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data: ExportData = JSON.parse(text);
      const result = await api.importData({ links: data.links });
      alert(`Imported: ${result.imported}, Skipped: ${result.skipped}, Errors: ${result.errors}`);
      qc.invalidateQueries({ queryKey: ['links'] });
      qc.invalidateQueries({ queryKey: ['collections'] });
    } catch {
      alert('Invalid file format');
    }
    e.target.value = '';
  };

  return (
    <div className="p-6 max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your preferences
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Theme</h2>
        <div className="flex gap-3">
          {[
            { value: 'light', icon: Sun, label: 'Light' },
            { value: 'dark', icon: Moon, label: 'Dark' },
            { value: 'system', icon: Monitor, label: 'System' },
          ].map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              onClick={() => setTheme(value as any)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
                theme === value
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border hover:border-border/80'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Data Management</h2>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export Data (JSON)
          </Button>
          <label>
            <Button variant="outline" asChild>
              <span>
                <Upload className="w-4 h-4 mr-2" />
                Import Data (JSON)
              </span>
            </Button>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Account</h2>
        <Button
          variant="destructive"
          onClick={() => {
            api.setToken(null);
            router.push('/login');
          }}
        >
          Logout
        </Button>
      </section>
    </div>
  );
}
