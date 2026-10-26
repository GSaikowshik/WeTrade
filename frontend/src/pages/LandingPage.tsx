
import React from 'react';
import { Link } from 'react-router-dom';
import type { User } from '../types';

interface LandingPageProps {
  user?: User | null;
  onOpenAuth?: (mode?: 'login' | 'register') => void;
}

const markets = [
  {
    number: '01',
    name: 'Indian Stocks',
    subtitle: 'START CLOSE TO HOME',
    description:
      'Explore Indian companies, understand market movements, and practise your trading strategies with virtual money.',
    tags: ['NSE', 'BSE', 'NIFTY 50'],
    symbol: '₹',
    color: 'emerald',
    examples: [
      { name: 'RELIANCE', price: '₹1,250.00', change: '+1.82%', up: true },
      { name: 'TCS', price: '₹3,420.00', change: '+0.94%', up: true },
      { name: 'INFY', price: '₹1,480.00', change: '-0.36%', up: false },
    ],
  },
  {
    number: '02',
    name: 'US Stocks',
    subtitle: 'THINK BEYOND BORDERS',
    description:
      'Discover global companies, explore price movements, and learn how international markets work.',
    tags: ['NASDAQ', 'NYSE', 'GLOBAL'],
    symbol: '$',
    color: 'blue',
    examples: [
      { name: 'AAPL', price: '$225.00', change: '+1.24%', up: true },
      { name: 'NVDA', price: '$142.00', change: '+2.18%', up: true },
      { name: 'TSLA', price: '$330.00', change: '-0.71%', up: false },
    ],
  },
  {
    number: '03',
    name: 'Crypto',
    subtitle: 'EXPLORE DIGITAL ASSETS',
    description:
      'Get familiar with crypto price movements and practise your strategy without putting real money at risk.',
    tags: ['BTC', 'ETH', 'DIGITAL ASSETS'],
    symbol: '₿',
    color: 'violet',
    examples: [
      { name: 'BTC', price: '$67,200', change: '+2.42%', up: true },
      { name: 'ETH', price: '$2,540', change: '+1.16%', up: true },
      { name: 'SOL', price: '$148.00', change: '-0.82%', up: false },
    ],
  },
];

const benefits = [
  {
    number: '01',
    icon: '◈',
    title: 'Start with virtual money',
    description:
      'Get a virtual starting balance and learn how buying and selling work without depositing real cash.',
  },
  {
    number: '02',
    icon: '↗',
    title: 'Make your own moves',
    description:
      'Practise entries, exits and portfolio decisions in a simulated trading environment.',
  },
  {
    number: '03',
    icon: '◎',
    title: 'Learn from every trade',
    description:
      'Review your portfolio, track your performance and build better trading habits over time.',
  },
];

const Sparkline: React.FC<{ down?: boolean }> = ({ down }) => (
  <svg
    viewBox="0 0 100 34"
    className="h-9 w-24"
    fill="none"
    aria-hidden="true"
  >
    <path
      d={
        down
          ? 'M2 8 L13 12 L23 7 L34 18 L45 14 L56 23 L68 18 L79 28 L98 25'
          : 'M2 28 L13 22 L23 25 L34 12 L45 17 L56 8 L68 14 L79 5 L98 8'
      }
      stroke={down ? '#F97373' : '#08B58A'}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const LandingPage: React.FC<LandingPageProps> = ({ user, onOpenAuth }) => {
  return (
    <div className="min-h-screen overflow-hidden bg-white text-slate-900">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur-xl">
        <nav className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400 text-xl font-black text-slate-950 shadow-sm">
              W
            </span>
            <span>
              <span className="block text-xl font-extrabold tracking-tight">
                WeTrade
              </span>
              <span className="block text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-600">
                Learn by doing
              </span>
            </span>
          </Link>

          <div className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#markets" className="transition hover:text-emerald-600">
              Markets
            </a>
            <a href="#how-it-works" className="transition hover:text-emerald-600">
              How it works
            </a>
            <a href="#why-wetrade" className="transition hover:text-emerald-600">
              Why WeTrade
            </a>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 sm:inline-flex">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {user.email}
                </span>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5 hover:bg-emerald-400"
                >
                  Dashboard <span aria-hidden="true">→</span>
                </Link>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onOpenAuth?.('login')}
                  className="rounded-full px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuth?.('register')}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5 hover:bg-emerald-400"
                >
                  Open Demo <span aria-hidden="true">↗</span>
                </button>
              </>
            )}
          </div>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="relative">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(16,185,129,0.10),transparent_55%)]" />

          <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-24 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10 lg:py-24">
            <div className="max-w-2xl">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-800">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                YOUR FIRST STEP INTO THE MARKETS
              </div>

              <h1 className="text-5xl font-semibold leading-[1.07] tracking-[-0.055em] text-slate-900 sm:text-6xl lg:text-[76px]">
                The market is your classroom.
                <span className="mt-2 block text-emerald-500">
                  Your money stays yours.
                </span>
              </h1>

              <p className="mt-7 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
                Learn to trade Indian stocks first, explore US markets next,
                and discover crypto — all in one place, with virtual money
                instead of real financial risk.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                {user ? (
                  <Link
                    to="/dashboard"
                    className="inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-emerald-500 px-7 text-base font-bold text-slate-950 shadow-xl shadow-emerald-500/20 transition hover:-translate-y-1 hover:bg-emerald-400"
                  >
                    Go to Dashboard <span aria-hidden="true">→</span>
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => onOpenAuth?.('register')}
                    className="inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-emerald-500 px-7 text-base font-bold text-slate-950 shadow-xl shadow-emerald-500/20 transition hover:-translate-y-1 hover:bg-emerald-400"
                  >
                    Start practising for free <span aria-hidden="true">→</span>
                  </button>
                )}
                <a
                  href="#markets"
                  className="inline-flex min-h-14 items-center justify-center rounded-full border border-slate-200 bg-white px-7 text-base font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Explore the markets
                </a>
              </div>

              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-500">
                <span className="flex items-center gap-2">
                  <span className="text-emerald-600">✓</span> Virtual money only
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-emerald-600">✓</span> Practise at your pace
                </span>
              </div>
            </div>

            {/* Portfolio preview */}
            <div className="relative mx-auto w-full max-w-[540px]">
              <div className="absolute -inset-5 rounded-[40px] bg-emerald-200/30 blur-3xl" />

              <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-200/70 sm:p-7">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Your practice portfolio
                    </p>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                      ₹1,00,000
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      Example virtual starting balance
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-2xl text-emerald-600">
                    ↗
                  </div>
                </div>

                <div className="mt-7 rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-700">
                      Portfolio journey
                    </span>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500">
                      Sample view
                    </span>
                  </div>

                  <svg
                    viewBox="0 0 440 150"
                    className="mt-5 w-full"
                    fill="none"
                    role="img"
                    aria-label="Illustrative portfolio performance chart"
                  >
                    <defs>
                      <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity=".22" />
                        <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {[25, 60, 95, 130].map((y) => (
                      <line
                        key={y}
                        x1="0"
                        y1={y}
                        x2="440"
                        y2={y}
                        stroke="#E2E8F0"
                        strokeDasharray="4 6"
                      />
                    ))}
                    <path
                      d="M0 112 C25 108 30 118 55 96 S90 108 115 81 S155 90 185 64 S225 82 250 57 S285 69 315 44 S355 61 380 30 S415 42 440 18 L440 150 L0 150 Z"
                      fill="url(#areaFill)"
                    />
                    <path
                      d="M0 112 C25 108 30 118 55 96 S90 108 115 81 S155 90 185 64 S225 82 250 57 S285 69 315 44 S355 61 380 30 S415 42 440 18"
                      stroke="#10B981"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    <circle cx="440" cy="18" r="5" fill="#10B981" stroke="white" strokeWidth="3" />
                  </svg>

                  <div className="mt-2 flex justify-between text-[10px] font-medium text-slate-400">
                    <span>START</span>
                    <span>LEARN</span>
                    <span>PRACTISE</span>
                    <span>IMPROVE</span>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-slate-100 p-4">
                    <p className="text-xs text-slate-500">Virtual cash</p>
                    <p className="mt-2 text-lg font-bold">₹1,00,000</p>
                    <div className="mt-3 h-1.5 rounded-full bg-emerald-100">
                      <div className="h-full w-full rounded-full bg-emerald-400" />
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-100 p-4">
                    <p className="text-xs text-slate-500">Real money at risk</p>
                    <p className="mt-2 text-lg font-bold text-emerald-600">₹0</p>
                    <p className="mt-2 text-xs text-slate-400">Simulated trading</p>
                  </div>
                </div>
              </div>

              <div className="absolute -left-4 top-28 hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-xl sm:block lg:-left-12">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 font-bold text-orange-600">
                    ₹
                  </span>
                  <div>
                    <p className="text-xs text-slate-500">Market focus</p>
                    <p className="text-sm font-bold text-slate-800">India first</p>
                  </div>
                </div>
              </div>

              <div className="absolute -right-3 bottom-16 hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-xl sm:block lg:-right-8">
                <p className="text-xs font-medium text-slate-500">Learn by doing</p>
                <p className="mt-1 text-sm font-bold text-slate-800">
                  Every trade teaches
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Market strip */}
        <section className="border-y border-slate-100 bg-slate-50/80">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-5 py-5 text-sm text-slate-500 sm:gap-x-12 sm:px-8">
            <span className="font-semibold text-slate-700">One learning platform.</span>
            <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Indian stocks</span>
            <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-blue-500" /> US stocks</span>
            <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-violet-500" /> Crypto</span>
          </div>
        </section>

        {/* Markets */}
        <section id="markets" className="scroll-mt-24 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-600">
                YOUR WORLD OF MARKETS
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                Start local. Think global.
              </h2>
              <p className="mt-5 leading-7 text-slate-600">
                Build your confidence one market at a time, with a virtual
                portfolio designed for learning.
              </p>
            </div>

            <div className="mt-14 grid gap-6 lg:grid-cols-3">
              {markets.map((market) => (
                <article
                  key={market.number}
                  className={`group relative overflow-hidden rounded-[26px] border p-6 transition duration-300 hover:-translate-y-1 hover:shadow-xl ${
                    market.color === 'emerald'
                      ? 'border-emerald-200 bg-emerald-50/60 hover:shadow-emerald-100'
                      : market.color === 'blue'
                      ? 'border-blue-100 bg-blue-50/50 hover:shadow-blue-100'
                      : 'border-violet-100 bg-violet-50/50 hover:shadow-violet-100'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-bold tracking-[0.15em] text-slate-500">
                      {market.number} / {market.subtitle}
                    </span>
                    <span
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl font-bold shadow-sm ${
                        market.color === 'emerald'
                          ? 'text-emerald-600'
                          : market.color === 'blue'
                          ? 'text-blue-600'
                          : 'text-violet-600'
                      }`}
                    >
                      {market.symbol}
                    </span>
                  </div>

                  <h3 className="mt-7 text-2xl font-bold tracking-tight text-slate-900">
                    {market.name}
                  </h3>
                  <p className="mt-3 min-h-[84px] text-sm leading-6 text-slate-600">
                    {market.description}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {market.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/90 bg-white/80 px-3 py-1.5 text-[10px] font-bold tracking-wider text-slate-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-6 overflow-hidden rounded-2xl border border-white bg-white/90 p-4">
                    {market.examples.map((asset, index) => (
                      <div
                        key={asset.name}
                        className={`flex items-center justify-between gap-2 py-3 ${
                          index < market.examples.length - 1
                            ? 'border-b border-slate-100'
                            : ''
                        }`}
                      >
                        <div>
                          <p className="text-sm font-bold text-slate-800">
                            {asset.name}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {asset.price}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Sparkline down={!asset.up} />
                          <span
                            className={`text-xs font-semibold ${
                              asset.up ? 'text-emerald-600' : 'text-red-500'
                            }`}
                          >
                            {asset.change}
                          </span>
                        </div>
                      </div>
                    ))}
                    <p className="mt-2 text-[10px] leading-4 text-slate-400">
                      Illustrative examples only — not live market prices.
                    </p>
                  </div>

                  <Link
                    to="/dashboard"
                    className={`mt-6 inline-flex items-center gap-2 text-sm font-bold transition group-hover:gap-3 ${
                      market.color === 'emerald'
                        ? 'text-emerald-700'
                        : market.color === 'blue'
                        ? 'text-blue-700'
                        : 'text-violet-700'
                    }`}
                  >
                    Explore in the demo <span aria-hidden="true">→</span>
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Why WeTrade */}
        <section id="why-wetrade" className="bg-slate-950 py-20 text-white sm:py-28">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-20">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-400">
                A SAFER PLACE TO START
              </p>
              <h2 className="mt-5 text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
                Confidence comes from practice.
                <span className="text-emerald-400"> Not guesswork.</span>
              </h2>
              <p className="mt-6 leading-8 text-slate-400">
                Real markets can feel intimidating when you are just starting.
                WeTrade gives you a simulated environment to learn the basics,
                experiment with ideas, and understand your decisions first.
              </p>
              <Link
                to="/dashboard"
                className="mt-8 inline-flex items-center gap-3 rounded-full bg-emerald-400 px-6 py-3.5 font-bold text-slate-950 transition hover:bg-emerald-300"
              >
                Try the trading demo <span aria-hidden="true">↗</span>
              </Link>
            </div>

            <div id="how-it-works" className="scroll-mt-24 space-y-4">
              {benefits.map((benefit) => (
                <div
                  key={benefit.number}
                  className="flex gap-5 rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-emerald-400/40 hover:bg-white/[0.06] sm:p-6"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/10 text-2xl text-emerald-400">
                    {benefit.icon}
                  </div>
                  <div>
                    <p className="text-xs font-bold tracking-widest text-emerald-400">
                      STEP {benefit.number}
                    </p>
                    <h3 className="mt-2 text-lg font-bold">{benefit.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-5 py-20 sm:px-8 sm:py-28">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[32px] bg-emerald-400 px-6 py-14 text-center sm:px-12 sm:py-20">
            <div className="pointer-events-none absolute -right-12 -top-24 h-72 w-72 rounded-full border-[40px] border-white/15" />
            <div className="pointer-events-none absolute -bottom-36 -left-12 h-72 w-72 rounded-full border-[40px] border-white/15" />
            <div className="relative mx-auto max-w-2xl">
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-950/70">
                YOUR JOURNEY STARTS HERE
              </p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-5xl">
                Make your first move. Not your first mistake.
              </h2>
              <p className="mx-auto mt-5 max-w-xl leading-7 text-emerald-950/80">
                Explore the markets, practise your strategy and start learning
                with virtual money.
              </p>
              {user ? (
                <Link
                  to="/dashboard"
                  className="mt-8 inline-flex items-center justify-center gap-3 rounded-full bg-slate-950 px-7 py-4 font-bold text-white shadow-lg transition hover:-translate-y-1 hover:bg-slate-800"
                >
                  Enter WeTrade <span aria-hidden="true">→</span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => onOpenAuth?.('register')}
                  className="mt-8 inline-flex items-center justify-center gap-3 rounded-full bg-slate-950 px-7 py-4 font-bold text-white shadow-lg transition hover:-translate-y-1 hover:bg-slate-800"
                >
                  Open Free Demo <span aria-hidden="true">→</span>
                </button>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 sm:px-8 md:flex-row md:items-center md:justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400 font-black text-slate-950">
              W
            </span>
            <span className="font-extrabold tracking-tight">WeTrade</span>
          </Link>

          <p className="max-w-2xl text-xs leading-5 text-slate-500">
            WeTrade is a virtual trading and financial learning project.
            Trading activity and balances are simulated and do not represent
            actual investments. Example prices and charts on this page are
            illustrative, not live market data. Virtual trading does not
            guarantee future results.
          </p>

          {user ? (
            <Link
              to="/dashboard"
              className="shrink-0 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Dashboard →
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => onOpenAuth?.('register')}
              className="shrink-0 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Open demo →
            </button>
          )}
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
