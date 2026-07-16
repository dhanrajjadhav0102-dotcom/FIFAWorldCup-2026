import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App';
import { AuthProvider } from '../context/AuthContext';
import { AppDataProvider } from '../context/AppContext';
import * as AuthContext from '../context/AuthContext';

const renderApp = () => {
  return render(
    <AuthProvider>
      <AppDataProvider>
        <App />
      </AppDataProvider>
    </AuthProvider>
  );
};

beforeEach(() => {
  vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
    currentUser: null,
    login: vi.fn(),
    signup: vi.fn(),
    logout: vi.fn(),
    updateProfile: vi.fn(),
    loading: false
  });
});

describe('Operations Portal - Guest Tests', () => {
  it('renders landing page with correct primary headings', () => {
    renderApp();
    expect(screen.getByRole('heading', { name: /experience the game/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /explore stadium map/i })).toBeInTheDocument();
  });

  it('can view and close the guest map preview', async () => {
    renderApp();
    
    // Open guest map
    const openBtn = screen.getByRole('button', { name: /explore stadium map/i });
    fireEvent.click(openBtn);
    
    expect(screen.getByText(/log in to get full access to all stadium features/i)).toBeInTheDocument();
    
    // Close guest map and redirect to sign in
    const redirectBtn = screen.getByRole('button', { name: /^log in$/i });
    fireEvent.click(redirectBtn);
    
    expect(screen.getByRole('heading', { name: /experience the game/i })).toBeInTheDocument();
  });

  it('shows portal tabs for Fan, Volunteer, and Organizer', () => {
    renderApp();
    expect(screen.getByRole('button', { name: /fan portal/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /volunteer/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /organizer/i })).toBeInTheDocument();
  });
});

describe('Operations Portal - Authenticated Fan Dashboard Workflows', () => {
  beforeEach(() => {
    // Mock user session as Fan
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      currentUser: { id: 'fan-test-123', name: 'Dhanraj Fan', email: 'fan@example.com', role: 'fan', createdAt: '' },
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      updateProfile: vi.fn(),
      loading: false
    });
  });

  it('loads fan dashboard header and active portal tabs', async () => {
    renderApp();
    
    // Header check
    expect(screen.getByText('Dhanraj Fan')).toBeInTheDocument();
    expect(screen.getByText(/operations hub/i)).toBeInTheDocument();
    
    // Check navigation buttons for fan view
    expect(screen.getByRole('button', { name: /match hub/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /my tickets/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /food ordering/i })).toBeInTheDocument();
  });

  it('can navigate between dashboard pages and execute ticket booking flow', async () => {
    renderApp();
    
    // Go to My Tickets section
    const ticketsNavBtn = screen.getByRole('button', { name: /my tickets/i });
    fireEvent.click(ticketsNavBtn);
    
    expect(screen.getByText(/ticket wallet & interactive booking/i)).toBeInTheDocument();
    expect(screen.getByText(/active entry tickets/i)).toBeInTheDocument();
    
    // Open Quick Reservation modal
    const matchesListBtn = screen.getByRole('heading', { name: /quick reservation/i });
    expect(matchesListBtn).toBeInTheDocument();
  });

  it('can navigate and execute concession food ordering workflow', async () => {
    renderApp();
    
    // Go to Food Ordering section
    const foodNavBtn = screen.getByRole('button', { name: /food ordering/i });
    fireEvent.click(foodNavBtn);
    
    expect(screen.getByText(/food & beverage delivery service/i)).toBeInTheDocument();
    expect(screen.getByText(/stadium concession menu/i)).toBeInTheDocument();
    
    // Add item to basket
    const addBasketBtns = screen.getAllByRole('button', { name: /add to basket/i });
    expect(addBasketBtns.length).toBeGreaterThan(0);
    fireEvent.click(addBasketBtns[0]);
    
    // Check seat input delivery block is present
    const seatInput = screen.getByLabelText(/seat code for delivery/i);
    expect(seatInput).toBeInTheDocument();
    
    // Enter delivery seat code and place order
    fireEvent.change(seatInput, { target: { value: 'VIP-A4' } });
    const orderBtn = screen.getByRole('button', { name: /order concessions/i });
    expect(orderBtn).not.toBeDisabled();
    fireEvent.click(orderBtn);
  });
});

describe('Operations Portal - Authenticated Volunteer Workflows', () => {
  beforeEach(() => {
    // Mock user session as Volunteer
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      currentUser: { id: 'volunteer-test-123', name: 'Dhanraj Volunteer', email: 'volunteer@example.com', role: 'volunteer', createdAt: '' },
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      updateProfile: vi.fn(),
      loading: false
    });
  });

  it('loads volunteer workspace and duty shift modules', () => {
    renderApp();
    expect(screen.getByText('Dhanraj Volunteer')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /duty shifts/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /report incident/i })).toBeInTheDocument();
  });
});

describe('Operations Portal - Authenticated Organizer/Admin Workflows', () => {
  beforeEach(() => {
    // Mock user session as Admin
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      currentUser: { id: 'admin-test-123', name: 'Dhanraj Organizer', email: 'admin@example.com', role: 'admin', createdAt: '' },
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      updateProfile: vi.fn(),
      loading: false
    });
  });

  it('loads administrator workspace and analytics console', () => {
    renderApp();
    expect(screen.getByText('Dhanraj Organizer')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /analytics panel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /volunteer control/i })).toBeInTheDocument();
  });
});
