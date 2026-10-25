import React from 'react';

export const LearnPage: React.FC = () => {
  const topics = [
    {
      title: 'Market Orders vs. Limit Orders',
      icon: 'trending_up',
      content: [
        'A Market Order executes immediately at the best available current market price. It guarantees fill speed, but not exact price (subject to slippage).',
        'A Limit Order lets you specify the maximum price you are willing to pay (on a buy) or the minimum price you are willing to receive (on a sell). It only fills if the market reaches your target price.',
        'In We Trade: Market orders execute against the mark price with a realistic 0.05% slippage simulation. Limit orders remain in PENDING status until market conditions satisfy the limit.',
      ],
    },
    {
      title: 'Realized vs. Unrealized Profit & Loss (P&L)',
      icon: 'monitoring',
      content: [
        'Unrealized P&L (Paper Profit): The difference between what you paid (cost basis) and what your open positions are currently worth at the latest market price. This profit is not locked in until you sell.',
        'Realized P&L (Booked Profit): The net profit or loss generated after you exit a position, calculated as: Sale Proceeds minus Cost Basis minus Applicable Fees.',
        'In We Trade: Cost basis uses the Weighted Average Cost method for partial exits, guaranteeing strict mathematical consistency.',
      ],
    },
    {
      title: 'Bid, Ask, Spread, and Liquidity',
      icon: 'swap_horiz',
      content: [
        'The Bid is the highest price buyers are currently offering.',
        'The Ask is the lowest price sellers are currently requesting.',
        'The Spread is the difference between the Bid and Ask. Highly liquid stocks (like Reliance, TCS, Infosys) have narrow spreads (a few paise), making them cheap to trade.',
      ],
    },
    {
      title: 'Fees, Slippage, and Frictions',
      icon: 'receipt_long',
      content: [
        'In real trading, trading is not free: brokerage, exchange turnover fees, Securities Transaction Tax (STT), and regulatory charges reduce your net returns.',
        'We Trade models these costs explicitly: ₹20 (or 0.03%) flat brokerage plus 0.05% statutory turnover charges, deducted atomically from your virtual cash balance upon fill.',
        'Learning to account for fees is essential for developing disciplined risk management.',
      ],
    },
    {
      title: 'Simulation Invariants & Non-Brokerage Disclosure',
      icon: 'verified_user',
      content: [
        'We Trade is strictly an educational practice tool. All funds, balances, order fills, and portfolios are virtual simulations.',
        'No real exchange connections, payment gateways, or live money deposits are supported or promised.',
        'Simulated trading performance does not guarantee future results in live financial markets with real capital.',
      ],
    },
  ];

  return (
    <div className="flex flex-col w-full pb-10 space-y-space-lg max-w-4xl mx-auto animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-space-sm pb-space-xs border-b border-surface-container-high/60">
        <div>
          <div className="flex items-center gap-space-xs mb-1">
            <span className="font-label-sm text-[11px] text-primary uppercase font-semibold tracking-wider">
              We Trade Academy
            </span>
            <span className="text-text-tertiary">/</span>
            <span className="font-label-sm text-[11px] text-text-secondary uppercase tracking-wider">
              Curriculum &amp; Knowledge Base
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg font-semibold text-text-primary tracking-tight">
            Market Learning Guide
          </h1>
          <p className="font-body-sm text-body-sm text-text-secondary text-xs mt-1">
            Master the fundamentals of order types, slippage, weighted cost-basis accounting, and disciplined risk management.
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-lg bg-surface-subtle border border-border-subtle text-xs font-semibold text-text-secondary">
          5 Core Modules
        </div>
      </div>

      {/* Topics Stack */}
      <div className="space-y-space-md">
        {topics.map((topic, i) => (
          <div
            key={i}
            className="p-space-md rounded-xl bg-surface-card shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-surface-container-high/60 flex flex-col space-y-3"
          >
            <div className="flex items-center gap-2.5 pb-2 border-b border-surface-container-low">
              <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[20px]">{topic.icon}</span>
              </div>
              <h2 className="font-headline-sm text-base text-text-primary font-semibold">
                {topic.title}
              </h2>
            </div>
            <div className="space-y-2 text-xs leading-relaxed text-text-secondary">
              {topic.content.map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
