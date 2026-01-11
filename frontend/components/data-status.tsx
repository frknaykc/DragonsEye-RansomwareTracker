'use client';

import { useState, useEffect } from 'react';
import { getDataStatus, DataStatus } from '@/lib/api';

export function DataStatusBadge() {
  const [status, setStatus] = useState<DataStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const fetchStatus = async () => {
    try {
      const data = await getDataStatus();
      setStatus(data);
      setUpdating(data.update_in_progress);
    } catch (error) {
      console.error('Failed to fetch status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Poll every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Poll more frequently when update is in progress
  useEffect(() => {
    if (updating) {
      const interval = setInterval(fetchStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [updating]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <div className="w-2 h-2 bg-zinc-500 rounded-full animate-pulse" />
        <span>Loading...</span>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  const freshnessColors = {
    fresh: 'bg-green-500',
    stale: 'bg-yellow-500',
    outdated: 'bg-red-500',
    missing: 'bg-gray-500',
  };

  const freshnessLabels = {
    fresh: 'Fresh',
    stale: 'Needs Update',
    outdated: 'Outdated',
    missing: 'No Data',
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg transition-colors border border-zinc-700/50"
      >
        <div className={`w-2 h-2 rounded-full ${freshnessColors[status.data_freshness]} ${updating ? 'animate-pulse' : ''}`} />
        <span className="text-sm text-zinc-300">
          {updating ? 'Updating...' : freshnessLabels[status.data_freshness]}
        </span>
        {status.victims.age_human && !updating && (
          <span className="text-xs text-zinc-500">
            ({status.victims.age_human} old)
          </span>
        )}
      </button>

      {showDetails && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-white">Data Status</h3>
            <button
              onClick={() => setShowDetails(false)}
              className="text-zinc-500 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3 text-sm">
            {/* Freshness Status */}
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Status</span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                status.data_freshness === 'fresh' ? 'bg-green-500/20 text-green-400' :
                status.data_freshness === 'stale' ? 'bg-yellow-500/20 text-yellow-400' :
                status.data_freshness === 'outdated' ? 'bg-red-500/20 text-red-400' :
                'bg-gray-500/20 text-gray-400'
              }`}>
                {freshnessLabels[status.data_freshness]}
              </span>
            </div>

            {/* Victims File */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Victims Data</span>
                <span className="text-zinc-300">{status.victims.age_human || 'N/A'}</span>
              </div>
              {status.victims.modified && (
                <p className="text-xs text-zinc-500 mt-0.5">
                  Last updated: {new Date(status.victims.modified).toLocaleString()}
                </p>
              )}
            </div>

            {/* Groups File */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Groups Data</span>
                <span className="text-zinc-300">{status.groups.age_human || 'N/A'}</span>
              </div>
              {status.groups.modified && (
                <p className="text-xs text-zinc-500 mt-0.5">
                  Last updated: {new Date(status.groups.modified).toLocaleString()}
                </p>
              )}
            </div>

            {/* Scheduler Status */}
            {status.scheduler && (
              <div className="pt-2 border-t border-zinc-700">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-zinc-400">Scheduler</span>
                  <span className={`text-xs ${
                    status.scheduler.status === 'idle' ? 'text-green-400' :
                    status.scheduler.status === 'updating' ? 'text-yellow-400' :
                    status.scheduler.status === 'error' ? 'text-red-400' :
                    'text-zinc-400'
                  }`}>
                    {status.scheduler.status || 'Unknown'}
                  </span>
                </div>
                {status.scheduler.message && (
                  <p className="text-xs text-zinc-500">{status.scheduler.message}</p>
                )}
              </div>
            )}

            <p className="text-xs text-zinc-500 text-center pt-2 border-t border-zinc-700">
              Auto-updates every hour via Tor
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

