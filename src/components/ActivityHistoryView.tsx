import React, { useState } from 'react';
import {
  AlertTriangle,
  BellOff,
  CheckCircle2,
  History,
  Layers,
  Trash2,
} from 'lucide-react';
import { ActivityLogEntry, AppSettings } from '../types/shulmode';
import { translations } from '../i18n/translations';

interface ActivityHistoryViewProps {
  logs: ActivityLogEntry[];
  settings: AppSettings;
  onClearLogs: () => void;
}

export const ActivityHistoryView: React.FC<ActivityHistoryViewProps> = ({
  logs,
  settings,
  onClearLogs,
}) => {
  const t = translations[settings.language];
  const isHe = settings.language === 'he';

  const [filter, setFilter] = useState<
    'ALL' | 'ACTIVATED' | 'DEACTIVATED' | 'ERROR'
  >('ALL');

  const filteredLogs = logs.filter((entry) => {
    if (filter === 'ALL') return true;
    if (filter === 'ERROR') {
      return entry.eventType === 'ERROR' || entry.eventType === 'PERMISSION';
    }
    return entry.eventType === filter;
  });

  const formatTimestamp = (ms: number) => {
    const d = new Date(ms);
    return d.toLocaleTimeString(isHe ? 'he-IL' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (ms: number) => {
    const d = new Date(ms);
    return d.toLocaleDateString(isHe ? 'he-IL' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-semibold text-slate-900 dark:text-white">
            {t.activityTitle}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            {t.activitySubtitle}
          </p>
        </div>

        {logs.length > 0 && (
          <button
            type="button"
            onClick={onClearLogs}
            className="min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 self-start sm:self-center whitespace-nowrap"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t.clearHistoryBtn}</span>
          </button>
        )}
      </div>

      {/* Interactive Filter Segmented Control */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-800 w-fit">
        {(
          [
            { id: 'ALL', label: t.filterAll },
            { id: 'ACTIVATED', label: t.filterActivations },
            { id: 'DEACTIVATED', label: t.filterDeactivations },
            { id: 'ERROR', label: t.filterErrors },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`min-h-[36px] px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              filter === tab.id
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Activity Timeline List */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <History className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t.noActivityYet}
            </p>
          </div>
        ) : (
          filteredLogs.map((entry) => (
            <div
              key={entry.id}
              className="p-4 sm:p-5 flex items-start justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    entry.eventType === 'ACTIVATED'
                      ? 'bg-slate-900 dark:bg-amber-500 text-amber-400 dark:text-slate-950'
                      : entry.eventType === 'DEACTIVATED'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      : entry.eventType === 'RULE_OVERLAP'
                      ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'
                      : 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400'
                  }`}
                >
                  {entry.eventType === 'ACTIVATED' && (
                    <BellOff className="w-4 h-4" />
                  )}
                  {entry.eventType === 'DEACTIVATED' && (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  {entry.eventType === 'RULE_OVERLAP' && (
                    <Layers className="w-4 h-4" />
                  )}
                  {(entry.eventType === 'ERROR' ||
                    entry.eventType === 'PERMISSION') && (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                </div>

                <div className="space-y-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    {entry.ruleName}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {entry.details}
                  </p>
                  {/* Unboxed Metadata with · separators */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono-tabular pt-0.5">
                    <span>{entry.triggerSource}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {formatDate(entry.timestamp)} {formatTimestamp(entry.timestamp)}
                    </span>
                    {entry.deactivatedAt && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>
                          {isHe ? 'כובה ב-' : 'Deactivated at'}{' '}
                          {formatTimestamp(entry.deactivatedAt)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
