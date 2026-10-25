import React from 'react';

export const LearnPage: React.FC = () => {
  const topics = [
    {
      title: 'Market Orders vs. Limit Orders',
      icon: 'trending_up',
      color: '#00E676',
      content: [
        'A Market Order executes immediately at the best available current market price. It guarantees fill speed, but not exact price (subject to slippage).',
        'A Limit Order lets you specify the maximum price you are willing to pay (on a buy) or the minimum price you are willing to receive (on a sell). It only fills if the market reaches your target price.',
        'In We Trade: Market orders execute against the mark price with a realistic 0.05% slippage simulation. Limit orders remain in PENDING status until market conditions satisfy the limit.',
      ],
    },
    {
      title: 'Realized vs. Unrealized Profit & Loss (P&L)',
      icon: 'monitoring',
      color: '#00F0FF',
      content: [
        'Unrealized P&L (Paper Profit): The difference between what you paid (cost basis) and what your open positions are currently worth at the latest market price. This profit is not locked in until you sell.',
        'Realized P&L (Booked Profit): The net profit or loss generated after you exit a position, calculated as: Sale Proceeds minus Cost Basis minus Applicable Fees.',
        'In We Trade: Cost basis uses the Weighted Average Cost method for partial exits, guaranteeing strict mathematical consistency.',
      ],
    },
    {
      title: 'Bid, Ask, Spread, and Liquidity',
      icon: 'swap_horiz',
      color: '#3B82F6',
      content: [
        'The Bid is the highest price buyers are currently offering.',
        'The Ask is the lowest price sellers are currently requesting.',
        'The Spread is the difference between the Bid and Ask. Highly liquid stocks (like Reliance, TCS, Infosys) have narrow spreads (a few paise), making them cheap to trade.',
      ],
    },
    {
      title: 'Fees, Slippage, and Frictions',
      icon: 'receipt_long',
      color: '#FFB800',
      content: [
        'In real trading, trading is not free: brokerage, exchange turnover fees, Securities Transaction Tax (STT), and regulatory charges reduce your net returns.',
        'We Trade models these costs explicitly: ₹20 (or 0.03%) flat brokerage plus 0.05% statutory turnover charges, deducted atomically from your virtual cash balance upon fill.',
        'Learning to account for fees is essential for developing disciplined risk management.',
      ],
    },
    {
      title: 'Simulation Invariants & Non-Brokerage Disclosure',
      icon: 'verified_user',
      color: '#00E676',
      content: [
        'We Trade is strictly an educational practice tool. All funds, balances, order fills, and portfolios are virtual simulations.',
        'No real exchange connections, payment gateways, or live money deposits are supported or promised.',
        'Simulated trading performance does not guarantee future results in live financial markets with real capital.',
      ],
    },
  ];

  return (
    <div className="flex flex-col w-full pb-14 space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#00E676] font-semibold">
              We Trade Academy
            </span>
            <span className="text-white/20">/</span>
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Curriculum &amp; Knowledge Base
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Market Learning Guide
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Master the mechanics of order execution, slippage models, cost-basis accounting, and trade discipline.
          </p>
        </div>

        <div className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono font-semibold text-slate-300">
          5 Core Modules
        </div>
      </div>

      {/* Topics Stack */}
      <div className="space-y-4">
        {topics.map((topic, i) => (
          <div
            key={i}
            className="glass-card rounded-2xl p-6 flex flex-col space-y-4 hover:border-white/20 transition-all group"
          >
            <div className="flex items-center gap-3.5 pb-3 border-b border-white/5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-inner"
                style={{
                  backgroundColor: `${topic.color}15`,
                  color: topic.color,
                  border: `1px solid ${topic.color}30`,
                }}
              >
                <span className="material-symbols-outlined text-[22px]">{topic.icon}</span>
              </div>
              <h2 className="text-base font-bold text-white tracking-tight group-hover:text-[#00E676] transition-colors">
                {topic.title}
              </h2>
            </div>
            <div className="space-y-2.5 text-xs leading-relaxed text-slate-300">
              {topic.content.map((paragraph, idx) => (
                <p key={idx} className="flex items-start gap-2.5">
                  <span className="text-[#00E676] font-mono font-bold mt-0.5">•</span>
                  <span>{paragraph}</span>
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
