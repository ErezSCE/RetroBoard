import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';

/**
 * ColumnList component allows viewing, renaming, adding, and deleting columns for a session.
 * Props:
 *  - sessionId: number | string (required)
 */
interface ColumnListProps {
  sessionId: string | number;
}

export default function ColumnList({ sessionId }: ColumnListProps) {
  const [columns, setColumns] = useState([]);
  const [newTitle, setNewTitle] = useState('');

  // Fetch columns on mount or when sessionId changes
  useEffect(() => {
    if (!sessionId) return;
    const fetch = async () => {
      try {
        const res = await axios.get('/columns', { params: { sessionId } });
        setColumns(res.data);
      } catch (err) {
        console.error('Failed to fetch columns', err);
      }
    };
    fetch();
  }, [sessionId]);

  const handleRename = async (id, newTitle) => {
    try {
      const res = await axios.put(`/columns/${id}`, { title: newTitle });
      setColumns((prev) =>
        prev.map((col) => (col.id === id ? { ...col, title: res.data.title } : col))
      );
    } catch (err) {
      console.error('Failed to rename column', err);
    }
  };

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    try {
      const res = await axios.post('/columns', {
        sessionId: Number(sessionId),
        title: newTitle.trim(),
      });
      setColumns((prev) => [...prev, res.data]);
      setNewTitle('');
    } catch (err) {
      console.error('Failed to add column', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/columns/${id}`);
      setColumns((prev) => prev.filter((col) => col.id !== id));
    } catch (err) {
      // If backend indicates column contains cards, ask for confirmation
      if (err.response && err.response.status === 400) {
        const confirmDelete = window.confirm(
          'Column contains cards; are you sure you want to delete it?'
        );
        if (confirmDelete) {
          try {
            await axios.delete(`/columns/${id}`);
            setColumns((prev) => prev.filter((col) => col.id !== id));
          } catch (e) {
            console.error('Failed to delete column after confirmation', e);
          }
        }
      } else {
        console.error('Failed to delete column', err);
      }
    }
  };

  return (
    <div>
      <h2>Columns</h2>
      <ul data-testid="column-list">
        {columns.map((col) => (
          <li key={col.id} data-testid="column-item">
            <input
              type="text"
              value={col.title}
              onChange={(e) => {
                const updatedTitle = e.target.value;
                setColumns((prev) =>
                  prev.map((c) => (c.id === col.id ? { ...c, title: updatedTitle } : c))
                );
              }}
              onBlur={(e) => {
                // Always attempt rename on blur to ensure updates are sent.
                handleRename(col.id, e.target.value);
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
    </div>
  );
}
