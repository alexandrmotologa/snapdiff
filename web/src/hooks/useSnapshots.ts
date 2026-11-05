import { useState, useEffect, useCallback } from 'react';
import type { RunManifest } from '../types.js';

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

  const approve = async (targetName: string, viewportName: string) => {
    try {
      setApproving(true);
      const res = await fetch('/api/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetName, viewportName })
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

  return {
    manifest,
    loading,
    running,
    approving,
    error,
    refresh: fetchManifest,
    approve,
    approveAll,
    runTests
  };
}
