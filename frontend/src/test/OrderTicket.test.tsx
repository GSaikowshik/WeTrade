import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OrderTicket } from '../components/OrderTicket';
import { Asset } from '../types';

describe('OrderTicket Component', () => {
  const mockAsset: Asset = {
    id: 1,
    symbol: 'INFY',
    name: 'Infosys Limited',
    asset_type: 'equity',
    market: 'IN',
    exchange: 'NSE',
    quote_currency: 'INR',
    current_price: 1880,
    change_24h: 1.5,
    high_24h: 1895,
    low_24h: 1860,
    volume_24h: 5000000,
    data_status: 'demo',
    last_updated_at: '2026-10-25T00:00:00Z',
  };

  it('renders asset information, simulation disclosures and estimated cost', () => {
    render(
      <OrderTicket
        asset={mockAsset}
        availableCash={100000}
        availablePositionQty={0}
        onClose={vi.fn()}
        onOrderSuccess={vi.fn()}
      />
    );

    expect(screen.getByText('INFY')).toBeInTheDocument();
    expect(screen.getByText('Infosys Limited')).toBeInTheDocument();
    expect(screen.getByText(/Simulated order/i)).toBeInTheDocument();
    expect(screen.getByText(/Estimated Fees/i)).toBeInTheDocument();
    expect(screen.getByText('Buy 1 INFY')).toBeInTheDocument();
  });

  it('updates estimated cost on quantity change', () => {
    render(
      <OrderTicket
        asset={mockAsset}
        availableCash={100000}
        availablePositionQty={0}
        onClose={vi.fn()}
        onOrderSuccess={vi.fn()}
      />
    );

    const qtyInput = screen.getByDisplayValue('1');
    fireEvent.change(qtyInput, { target: { value: '5' } });
    expect(screen.getByText('Buy 5 INFY')).toBeInTheDocument();
  });

  it('disables sell when user has 0 shares', () => {
    render(
      <OrderTicket
        asset={mockAsset}
        availableCash={100000}
        availablePositionQty={0}
        onClose={vi.fn()}
        onOrderSuccess={vi.fn()}
      />
    );

    const sellBtn = screen.getByText('Sell');
    fireEvent.click(sellBtn);

    expect(screen.getByText(/You do not hold enough shares of INFY to sell/i)).toBeInTheDocument();
  });
});
