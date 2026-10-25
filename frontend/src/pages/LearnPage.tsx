import React from 'react';
import { HelpCircle, CheckCircle, AlertTriangle, ShieldCheck, TrendingUp } from 'lucide-react';

export const LearnPage: React.FC = () => {
  const topics = [
    {
      title: 'Market Orders vs. Limit Orders',
      icon: TrendingUp,
      content: [
        'A Market Order executes immediately at the best available current market price. It guarantees fill speed, but not exact price (subject to slippage).',
        'A Limit Order lets you specify the maximum price you are willing to pay (on a buy) or the minimum price you are willing to receive (on a sell). It only fills if the market reaches your target price.',
        'In We Trade: Market orders execute against the mark price with a realistic 0.05% slippage simulation. Limit orders remain in PENDING status until market conditions satisfy the limit.',
      ],
    },
    {
      title: 'Realized vs. Unrealized Profit & Loss (P&L)',
      icon: CheckCircle,
      content: [
        'Unrealized P&L (Paper Profit): The difference between what you paid (cost basis) and what your open positions are currently worth at the latest market price. This profit is not locked in until you sell.',
        'Realized P&L (Booked Profit): The net profit or loss generated after you exit a position, calculated as: Sale Proceeds minus Cost Basis minus Applicable Fees.',
        'In We Trade: Cost basis uses the Weighted Average Cost method for partial exits, guaranteeing strict mathematical consistency.',
      ],
    },
    {
      title: 'Bid, Ask, Spread, and Liquidity',
      icon: HelpCircle,
      content: [
        'The Bid is the highest price buyers are currently offering.',
        'The Ask is the lowest price sellers are currently requesting.',
        'The Spread is the difference between the Bid and Ask. Highly liquid stocks (like Reliance, TCS, Infosys) have narrow spreads (a few paise), making them cheap to trade.',
      ],
    },
    {
      title: 'Fees, Slippage, and Frictions',
      icon: AlertTriangle,
      content: [
        'In real trading, trading is not free: brokerage, exchange turnover fees, Securities Transaction Tax (STT), and regulatory charges reduce your net returns.',
        'We Trade models these costs explicitly: ₹20 (or 0.03%) flat brokerage plus 0.05% statutory turnover charges, deducted atomically from your virtual cash balance upon fill.',
        'Learning to account for fees is essential for developing disciplined risk management.',
      ],
    },
    {
      title: 'Simulation Invariants & Non-Brokerage Disclosure',
      icon: ShieldCheck,
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
        <h1 className="text-2xl font-bold text-white">Market Learning Guide</h1>
        <p className="text-xs text-slate-400 mt-1">
          Master the fundamentals of order execution, risk accounting, and market mechanics.
        </p>
      </div>

      <div className="space-y-4">
        {topics.map((topic, idx) => {
          const Icon = topic.icon;
          return (
            <div
              key={idx}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-white">{topic.title}</h2>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 pl-11">
                {topic.content.map((point, pIdx) => (
                  <li key={pIdx} className="leading-relaxed list-disc">
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
};
