import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import ConfirmDialog from './ConfirmDialog';

interface Column {
  id: number;
  title: string;
  position: number;
}

interface ColumnListProps {
  sessionId: string | number;
}

export default function ColumnList({ sessionId }: ColumnListProps) {
  const [columns, setColumns] = useState<Column[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [editedTitles, setEditedTitles] = useState<Record<number, string>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const isMounted = useRef(true);

  // Fetch columns
  useEffect(() => {
    isMounted.current = true;
    if (!sessionId) return;
    const controller = new AbortController();
    const fetchColumns = async () => {
      setLoading(true);
      try {
        const res = await axios.get('/columns', { params: { sessionId } });
        if (isMounted.current) {
          setColumns(res.data);
          setError('');
        }
      } catch (err: any) {
        if (isMounted.current) {
          // If request was aborted, ignore error
          if (err.name !== 'CanceledError') {
            setError(err.response?.data?.error || 'Failed to load columns');
          }
        }
      } finally {
        if (isMounted.current) setLoading(false);
      }
    };
    fetchColumns();
    return () => {
      isMounted.current = false;
      controller.abort();
    };
  }, [sessionId]);

  const handleRename = async (id: number, newTitle: string) => {
    try {
      const res = await axios.put(`/columns/${id}`, { title: newTitle });
      setColumns((prev) =>
        prev.map((col) => (col.id === id ? { ...col, title: res.data.title } : col))
      );
      // clear edited title cache
      setEditedTitles((prev) => {
        const { [id]: _, ...rest } = prev;
        return rest;
      });
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to rename column');
      // Revert edited title to original on error
      setEditedTitles((prev) => {
        const { [id]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    const numericSessionId = Number(sessionId);
    if (Number.isNaN(numericSessionId)) {
      setError('Invalid session ID');
      return;
    }
    try {
      const res = await axios.post('/columns', {
        sessionId: numericSessionId,
        title: newTitle.trim(),
      });
      setColumns((prev) => [...prev, res.data]);
      setNewTitle('');
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add column');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`/columns/${id}`);
      setColumns((prev) => prev.filter((col) => col.id !== id));
      setError('');
    } catch (err: any) {
      if (err.response && err.response.status === 400) {
        // show confirmation modal
        setDeleteConfirmId(id);
      } else {
        setError(err.response?.data?.error || 'Failed to delete column');
      }
    }
  };

  const confirmDelete = async () => {
    if (deleteConfirmId !== null) {
      // Retry deletion after confirmation
      await handleDelete(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmId(null);
  };

  return (
    <div>
      <h2>Columns</h2>
      {loading && <p data-testid="loading">Loading columns...</p>}
      {error && <p data-testid="error" style={{ color: 'red' }}>{error}</p>}
      <ul data-testid="column-list">
        {columns.map((col) => (
          <li key={col.id} data-testid="column-item">
            <input
              type="text"
              value={editedTitles[col.id] ?? col.title}
              onChange={(e) => {
                const val = e.target.value;
                setEditedTitles((prev) => ({ ...prev, [col.id]: val }));
              }}
              onBlur={(e) => {
                const editedTitle = editedTitles[col.id] ?? e.target.value;
                if (editedTitle !== col.title) {
                  handleRename(col.id, editedTitle);
                }
              }}
            />
            <button onClick={() => handleDelete(col.id)} data-testid="delete-button">
              Delete
            </button>
          </li>
        ))}
      </ul>
      <div>
        <input
          type="text"
          placeholder="New column title"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          data-testid="new-column-input"
        />
        <button onClick={handleAdd} data-testid="add-button">
          Add Column
        </button>
      </div>
      {deleteConfirmId !== null && (
        <ConfirmDialog
          message="Column contains cards; are you sure you want to delete it?"
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}
    </div>
  );
}
