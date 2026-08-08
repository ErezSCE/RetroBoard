import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import CreateSession from '../src/pages/CreateSession';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('CreateSession component', () => {
  it('renders form fields and creates a session', async () => {
    const mockUrl = 'http://localhost:3000/s/abc123';
    mockedAxios.post.mockResolvedValueOnce({ data: { url: mockUrl } });

    const { getByLabelText, getByText, queryByText } = render(<CreateSession />);

    // Fill out the form
    fireEvent.change(getByLabelText(/title/i), { target: { value: 'Sprint Retro' } });
    fireEvent.change(getByLabelText(/description/i), { target: { value: 'Team retrospective' } });
    fireEvent.change(getByLabelText(/date & time/i), { target: { value: '2023-12-31T12:00' } });

    fireEvent.click(getByText(/create session/i));

    // Wait for async actions
    await waitFor(() => expect(mockedAxios.post).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(queryByText('Shareable URL:')).toBeInTheDocument());
    expect(getByText(mockUrl)).toBeInTheDocument();
  });
});
