import React, { useState, useEffect } from 'react';
import { ShieldCheck, Filter, Clock } from 'lucide-react';
import { AuditLog } from '../types';
import { fetchAuditLogs } from '../api';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLogs();
  }, [roleFilter]);

  async function loadLogs() {
    setLoading(true);
    try {
      const data = await fetchAuditLogs(roleFilter);
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <MedicalDisclaimer compact />

      {/* Header Card */}
      <div className="clinical-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
              GOVERNANCE & COMPLIANCE
            </span>
            <span className="text-xs text-slate-500">Immutable Audit Trail</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 mt-1 tracking-tight">System & Clinical Audit Logs</h1>
          <p className="text-xs text-slate-600 mt-0.5 max-w-2xl">
            Cryptographically timestamped logs tracking patient predictions, alerts, doctor feedback submissions, and model lifecycle actions.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 rounded bg-slate-50 border border-slate-300 text-slate-800 text-xs focus:outline-none"
          >
            <option value="ALL">All Roles</option>
            <option value="CLINICIAN">Clinician</option>
            <option value="RESEARCHER">Researcher</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
      </div>

      {/* Logs List Container */}
      <div className="clinical-card p-5">
        <div className="space-y-2.5">
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-500">Loading audit records...</div>
          ) : logs.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">No audit records matching criteria.</div>
          ) : (
            logs.map((log) => (
              <div
                key={log.log_id}
                className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded bg-cyan-50 border border-cyan-200 text-cyan-700 mt-0.5 shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-slate-900">{log.action}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-200 text-slate-700">
                        {log.user_role}
                      </span>
                      {log.record_id && (
                        <span className="text-slate-600 font-mono text-[11px]">
                          Target: <strong className="text-slate-900">{log.record_id}</strong>
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-600 mt-1 font-mono">
                      {JSON.stringify(log.details)}
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 font-mono sm:self-center self-end flex items-center gap-1 shrink-0">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{new Date(log.timestamp).toLocaleString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditLogsPage;
