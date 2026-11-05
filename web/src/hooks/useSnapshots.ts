import { useState, useEffect, useCallback } from 'react';
import type { ColorScheme, HistoryRecord, RunManifest } from '../types.js';

export function useSnapshots() {
  const [manifest, setManifest] = useState<RunManifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchManifest = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/manifest');
      if (!res.ok) {
        if (res.status === 404) {
          setError('No test run manifest found. Run tests or capture baselines first.');
          setManifest(null);
          return;
        }
        throw new Error(`Failed to load manifest: ${res.statusText}`);
      }
      const data = await res.json();
      setManifest(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchManifest();
  }, [fetchManifest]);

  const approve = async (targetName: string, viewportName: string, colorScheme: ColorScheme = 'light') => {
    try {
      setApproving(true);
      const res = await fetch('/api/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetName, viewportName, colorScheme })
      });
      if (!res.ok) throw new Error('Approval request failed');
      const data = await res.json();
      if (data.manifest) {
        setManifest(data.manifest);
      } else {
        await fetchManifest();
      }
    } catch (err) {
      alert(`Approval error: ${(err as Error).message}`);
    } finally {
      setApproving(false);
    }
  };

  const approveAll = async () => {
    if (!confirm('Are you sure you want to approve all failed and new snapshots as baseline?')) {
      return;
    }
    try {
      setApproving(true);
      const res = await fetch('/api/approve-all', { method: 'POST' });
      if (!res.ok) throw new Error('Batch approval failed');
      const data = await res.json();
      if (data.manifest) {
        setManifest(data.manifest);
      } else {
        await fetchManifest();
      }
    } catch (err) {
      alert(`Batch approval error: ${(err as Error).message}`);
    } finally {
      setApproving(false);
    }
  };

  const runTests = async () => {
    try {
      setRunning(true);
      const res = await fetch('/api/run', { method: 'POST' });
      if (!res.ok) throw new Error('Run test request failed');
      const data = await res.json();
      if (data.manifest) {
        setManifest(data.manifest);
      } else {
        await fetchManifest();
      }
    } catch (err) {
      alert(`Test run error: ${(err as Error).message}`);
    } finally {
      setRunning(false);
    }
  };

  const fetchHistory = async (
    targetName: string,
    viewportName: string,
    colorScheme: ColorScheme = 'light'
  ): Promise<HistoryRecord[]> => {
    try {
      const res = await fetch(
        `/api/history/${targetName}/${viewportName}?colorScheme=${colorScheme}`
      );
      if (!res.ok) return [];
      const data = await res.json();
      return data.history || [];
    } catch {
      return [];
    }
  };

  const rollback = async (
    targetName: string,
    viewportName: string,
    historyFilePath: string,
    colorScheme: ColorScheme = 'light'
  ) => {
    try {
      setApproving(true);
      const res = await fetch('/api/history/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetName, viewportName, historyFilePath, colorScheme })
      });
      if (!res.ok) throw new Error('Rollback failed');
      await fetchManifest();
    } catch (err) {
      alert(`Rollback error: ${(err as Error).message}`);
    } finally {
      setApproving(false);
    }
  };

  const addMask = async (targetName: string, selector: string) => {
    try {
      const res = await fetch('/api/masks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetName, selector })
      });
      if (!res.ok) throw new Error('Failed to save mask selector');
      return true;
    } catch (err) {
      alert(`Error saving mask: ${(err as Error).message}`);
      return false;
    }
  };

  return {
    manifest,
    loading,
    running,
    approving,
    error,
    approve,
    approveAll,
    runTests,
    fetchHistory,
    rollback,
    addMask
  };
}
