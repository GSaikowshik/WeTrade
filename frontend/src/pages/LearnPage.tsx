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
      icon: 'check_circle',
      content: [
        'Unrealized P&L (Paper Profit): The difference between what you paid (cost basis) and what your open positions are currently worth at the latest market price. This profit is not locked in until you sell.',
        'Realized P&L (Booked Profit): The net profit or loss generated after you exit a position, calculated as: Sale Proceeds minus Cost Basis minus Applicable Fees.',
        'In We Trade: Cost basis uses the Weighted Average Cost method for partial exits, guaranteeing strict mathematical consistency.',
      ],
    },
    {
      title: 'Bid, Ask, Spread, and Liquidity',
      icon: 'tune',
      content: [
        'The Bid is the highest price buyers are currently offering.',
        'The Ask is the lowest price sellers are currently requesting.',
        'The Spread is the difference between the Bid and Ask. Highly liquid stocks (like Reliance, TCS, Infosys) have narrow spreads (a few paise), making them cheap to trade.',
      ],
    },
    {
      title: 'Fees, Slippage, and Frictions',
      icon: 'warning',
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
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="font-label-sm text-label-sm text-primary uppercase font-semibold tracking-wider">
            Academy
          </span>
          <span className="text-text-tertiary">/</span>
          <span className="font-label-sm text-label-sm text-text-secondary uppercase tracking-wider">
            Curriculum
          </span>
        </div>
        <h1 className="font-headline-lg text-headline-lg text-text-primary">We Trade Academy</h1>
        <p className="font-body-sm text-body-sm text-text-secondary mt-1">
          Master the fundamentals of order execution, risk accounting, and market mechanics before risking capital.
        </p>
      </div>

      <div className="space-y-4">
        {topics.map((t, idx) => (
          <div
            key={idx}
            className="bg-surface-card border border-border-subtle rounded-xl p-5 shadow-sm space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[20px]">{t.icon}</span>
              </div>
              <h2 className="font-headline-sm text-headline-sm text-text-primary">{t.title}</h2>
            </div>

            <div className="space-y-2 pt-1 font-body-sm text-body-sm text-text-secondary leading-relaxed pl-11">
              {t.content.map((point, pIdx) => (
                <div key={pIdx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <p>{point}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default LearnPage;
