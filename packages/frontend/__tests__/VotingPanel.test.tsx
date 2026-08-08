import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import VotingPanel, { VotingItem } from '../src/components/VotingPanel';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('VotingPanel component', () => {
  const sessionId = 1;
  const participantId = 42;
  const items: VotingItem[] = [
    { id: 101, type: 'card', title: 'Card A' },
    { id: 202, type: 'cluster', title: 'Cluster B' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays initial remaining votes and items', () => {
    render(
      <VotingPanel
        sessionId={sessionId}
        participantId={participantId}
        items={items}
      />
    );
    expect(screen.getByText(/Remaining votes: 5/)).toBeInTheDocument();
    items.forEach((it) => {
      expect(screen.getByText(new RegExp(it.title))).toBeInTheDocument();
    });
    const voteButtons = screen.getAllByTestId('vote-button');
    expect(voteButtons).toHaveLength(items.length);
    voteButtons.forEach((btn) => expect(btn).toBeEnabled());
  });

  it('casts a vote and decrements remaining count on success', async () => {
    mockedAxios.post.mockResolvedValueOnce({ status: 201, data: {} });
    render(
      <VotingPanel
        sessionId={sessionId}
        participantId={participantId}
        items={items}
      />
    );
    const firstVoteBtn = screen.getAllByTestId('vote-button')[0];
    fireEvent.click(firstVoteBtn);
    await waitFor(() => expect(mockedAxios.post).toHaveBeenCalledTimes(1));
    expect(screen.getByText(/Remaining votes: 4/)).toBeInTheDocument();
  });

  it('shows error message when backend rejects vote due to budget', async () => {
    mockedAxios.post.mockRejectedValueOnce({
      response: { status: 400, data: { error: 'Vote budget exceeded' } },
    });
    render(
      <VotingPanel
        sessionId={sessionId}
        participantId={participantId}
        items={items}
      />
    );
    const btn = screen.getAllByTestId('vote-button')[0];
    fireEvent.click(btn);
    await waitFor(() => expect(mockedAxios.post).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId('error-msg')).toHaveTextContent('Vote budget exceeded');
    // remaining votes should stay unchanged
    expect(screen.getByText(/Remaining votes: 5/)).toBeInTheDocument();
  });

  it('disables vote buttons when no remaining votes', async () => {
    // Simulate 5 successful votes
    mockedAxios.post.mockResolvedValue({ status: 201, data: {} });
    render(
      <VotingPanel
        sessionId={sessionId}
        participantId={participantId}
        items={items}
      />
    );
    const buttons = screen.getAllByTestId('vote-button');
    // Click first button 5 times
    for (let i = 0; i < 5; i++) {
      fireEvent.click(buttons[0]);
    }
    await waitFor(() => expect(screen.getByText(/Remaining votes: 0/)).toBeInTheDocument());
    buttons.forEach((btn) => expect(btn).toBeDisabled());
  });
});
