import React, { useState } from 'react';
import axios from 'axios';

export interface VotingItem {
  id: number | string;
  type: 'card' | 'cluster';
  title: string;
}

interface VotingPanelProps {
  sessionId: number | string;
  participantId: number | string;
  voteBudget?: number; // defaults to 5 if not provided
  items: VotingItem[];
}

/**
 * VotingPanel component displays the remaining vote budget for a participant and
 * allows voting on provided items (cards or clusters). It enforces the budget
 * client‑side and calls the backend `/votes` endpoint.
 */
export default function VotingPanel({
  sessionId,
  participantId,
  voteBudget = 5,
  items,
}: VotingPanelProps) {
  const [remaining, setRemaining] = useState<number>(voteBudget);
  const [error, setError] = useState<string>('');

  const handleVote = async (item: VotingItem) => {
    if (remaining <= 0) return;
    try {
      const response = await axios.post('/votes', {
        participantId: Number(participantId),
        sessionId: Number(sessionId),
        targetType: item.type,
        targetId: Number(item.id),
        voteCount: 1,
      });
      if (response.status === 201) {
        setRemaining((prev) => prev - 1);
        setError('');
      }
    } catch (err: any) {
      // Backend returns 400 with error message when budget exceeded
      if (err.response && err.response.status === 400) {
        setError(err.response.data?.error || 'Vote budget exceeded');
      } else {
        setError('Failed to cast vote');
      }
    }
  };

  return (
    <div data-testid="voting-panel">
      <h3>Remaining votes: {remaining}</h3>
      {error && <p style={{ color: 'red' }} data-testid="error-msg">{error}</p>}
      <ul>
        {items.map((item) => (
          <li key={item.id} data-testid="voting-item">
            <span>{item.title} ({item.type})</span>
            <button
              onClick={() => handleVote(item)}
              disabled={remaining <= 0}
              data-testid="vote-button"
            >
              Vote
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
