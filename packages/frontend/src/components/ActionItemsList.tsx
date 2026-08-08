import React, { useEffect, useState } from 'react';
import axios from 'axios';

export interface ActionItem {
  id: number;
  sessionId: number;
  source_type: 'card' | 'cluster';
  source_id: number;
  title: string;
  ownerParticipantId: number | null;
  due_date: string | null; // ISO date string
  status: string;
}

interface ActionItemsListProps {
  sessionId: number;
}

export default function ActionItemsList({ sessionId }: ActionItemsListProps) {
  const [items, setItems] = useState<ActionItem[]>([]);
  const [error, setError] = useState<string>('');

  // Load action items on mount or when sessionId changes
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await axios.get('/action-items', { params: { sessionId } });
        setItems(res.data);
        setError('');
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load action items');
      }
    };
    fetchItems();
  }, [sessionId]);

  const markDone = async (id: number) => {
    try {
      const res = await axios.put(`/action-items/${id}`, { status: 'closed' });
      // Update the specific item in state
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, status: res.data.status } : it))
      );
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update action item');
    }
  };

  return (
    <div data-testid="action-items-list">
      <h2>Action Items</h2>
      {error && <p data-testid="error-msg" style={{ color: 'red' }}>{error}</p>}
      <ul>
        {items.map((item) => (
          <li key={item.id} data-testid="action-item">
            <h3>{item.title}</h3>
            <p>Owner: {item.ownerParticipantId !== null ? item.ownerParticipantId : 'Unassigned'}</p>
            <p>Due: {item.due_date ? item.due_date : 'None'}</p>
            <p>Status: {item.status}</p>
            <button
              onClick={() => markDone(item.id)}
              disabled={item.status === 'closed'}
              data-testid={`mark-done-button-${item.id}`}
            >
              Mark as Done
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
