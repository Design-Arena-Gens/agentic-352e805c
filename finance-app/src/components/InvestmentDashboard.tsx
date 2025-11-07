'use client';

import { useMemo } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import type { ChartData, ChartOptions, TooltipItem } from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
);

type SectorAllocation = {
  name: string;
  weight: number;
  expectedReturn: number;
  thesis: string;
  vehicle: string;
};

type CalculatedAllocation = SectorAllocation & {
  amount: number;
};

const TOTAL_INVESTMENT = 150_000;

const BASE_ALLOCATIONS: SectorAllocation[] = [
  {
    name: 'Large-Cap Equity (Nifty 50)',
    weight: 0.23,
    expectedReturn: 0.11,
    thesis:
      'Core exposure to India’s market leaders; provides stability and participates in overall GDP growth.',
    vehicle: 'Nippon India Nifty 50 ETF (NIFTYBEES)',
  },
  {
    name: 'Banking & Financial Services',
    weight: 0.18,
    expectedReturn: 0.12,
    thesis:
      'Credit growth, financial inclusion, and rising interest income tailwinds fuel strong profitability.',
    vehicle: 'HDFC Nifty Bank ETF',
  },
  {
    name: 'Technology & Digital Transformation',
    weight: 0.17,
    expectedReturn: 0.14,
    thesis:
      'IT services and SaaS exports benefit from global tech spend and rupee depreciation over long horizons.',
    vehicle: 'ICICI Prudential Nifty IT ETF',
  },
  {
    name: 'Healthcare & Pharma',
    weight: 0.11,
    expectedReturn: 0.1,
    thesis:
      'Defensive growth from generic exports and domestic demand alongside innovation in specialty pharma.',
    vehicle: 'Nippon India Nifty Pharma ETF',
  },
  {
    name: 'Green Energy & Manufacturing',
    weight: 0.11,
    expectedReturn: 0.15,
    thesis:
      'Government incentives for renewables, EV supply chains, and manufacturing localization drive expansion.',
    vehicle: 'Mirae Asset Nifty EV & New Age Automotive ETF',
  },
  {
    name: 'International Diversifier (US Total Market)',
    weight: 0.1,
    expectedReturn: 0.09,
    thesis:
      'Offsets home-country bias and captures innovation-led growth from global leaders.',
    vehicle: 'Motilal Oswal S&P 500 Index Fund (Direct Growth)',
  },
  {
    name: 'Short-Term Debt & Cash Alternatives',
    weight: 0.1,
    expectedReturn: 0.065,
    thesis:
      'Provides liquidity buffer while earning better-than-savings yields; dampens overall volatility.',
    vehicle: 'Parag Parikh Liquid Fund (Direct Growth)',
  },
];

const PIE_COLORS = [
  '#2563eb',
  '#16a34a',
  '#9333ea',
  '#fb923c',
  '#ef4444',
  '#0891b2',
  '#facc15',
];

export default function InvestmentDashboard() {
  const allocations = useMemo(() => {
    const raw = BASE_ALLOCATIONS.map((item) => ({
      ...item,
      amount: TOTAL_INVESTMENT * item.weight,
    }));

    const totalRaw = raw.reduce((sum, item) => sum + item.amount, 0);
    const ratio = TOTAL_INVESTMENT / totalRaw;

    const initialState = { assigned: 0, items: [] as CalculatedAllocation[] };

    const result = raw.reduce(
      (state, item, index) => {
        const isLast = index === raw.length - 1;
        let amount = isLast
          ? TOTAL_INVESTMENT - state.assigned
          : Math.round(item.amount * ratio);

        if (!isLast && state.assigned + amount > TOTAL_INVESTMENT) {
          amount = TOTAL_INVESTMENT - state.assigned;
        }

        return {
          assigned: state.assigned + amount,
          items: [...state.items, { ...item, amount }],
        };
      },
      initialState,
    );

    return result.items;
  }, []);

  const totalWeight = BASE_ALLOCATIONS.reduce(
    (sum, item) => sum + item.weight,
    0,
  );

  const blendedReturn =
    BASE_ALLOCATIONS.reduce(
      (sum, item) => sum + item.weight * item.expectedReturn,
      0,
    ) / totalWeight;

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }),
    [],
  );

  const pieData = useMemo<ChartData<'pie'>>(
    () => ({
      labels: allocations.map((allocation) => allocation.name),
      datasets: [
        {
          label: 'Allocation (INR)',
          data: allocations.map((allocation) => allocation.amount),
          backgroundColor: PIE_COLORS,
          borderColor: '#0f172a',
          borderWidth: 1,
        },
      ],
    }),
    [allocations],
  );

  const pieOptions = useMemo<ChartOptions<'pie'>>(
    () => ({
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 16,
            color: '#0f172a',
          },
        },
        tooltip: {
          callbacks: {
            label: (context: TooltipItem<'pie'>) => {
              const value =
                typeof context.raw === 'number'
                  ? context.raw
                  : Number(context.raw ?? 0);

              const label = context.label ?? 'Total';

              return `${label}: ${currencyFormatter.format(value)}`;
            },
          },
        },
      },
    }),
    [currencyFormatter],
  );

  const projectionYears = Array.from({ length: 6 }, (_, index) => index);

  const projectionData = useMemo<ChartData<'line'>>(() => {
    const values = projectionYears.map((year) =>
      Math.round(TOTAL_INVESTMENT * (1 + blendedReturn) ** year),
    );

    return {
      labels: projectionYears.map((year) =>
        year === 0 ? 'Now' : `${year} yr`,
      ),
      datasets: [
        {
          label: 'Projected Value',
          data: values,
          fill: true,
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.15)',
          tension: 0.4,
          pointRadius: 3,
        },
      ],
    };
  }, [blendedReturn, projectionYears]);

  const projectionOptions = useMemo<ChartOptions<'line'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (context: TooltipItem<'line'>) => {
              const value =
                typeof context.raw === 'number'
                  ? context.raw
                  : Number(context.raw ?? 0);
              return currencyFormatter.format(value);
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: false,
          ticks: {
            callback: (value) => {
              const numericValue =
                typeof value === 'number' ? value : Number(value);
              return currencyFormatter.format(numericValue);
            },
          },
          grid: {
            color: 'rgba(148, 163, 184, 0.25)',
          },
        },
        x: {
          grid: {
            color: 'rgba(148, 163, 184, 0.15)',
          },
        },
      },
    }),
    [currencyFormatter],
  );

  const totalProjected = Math.round(
    TOTAL_INVESTMENT * (1 + blendedReturn) ** 5,
  );

  return (
    <div className="min-h-screen bg-slate-950 py-16 text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6">
        <header className="flex flex-col gap-3 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-10 shadow-xl shadow-slate-900/30">
          <p className="text-sm uppercase tracking-[0.35em] text-blue-400">
            Smart Allocation Blueprint
          </p>
          <h1 className="text-4xl font-semibold sm:text-5xl">
            INR&nbsp;1,50,000 Multi-Sector Investment Plan
          </h1>
          <p className="max-w-3xl text-lg text-slate-300">
            Diversified across high-conviction Indian sectors, thematic growth,
            international exposure, and a liquidity sleeve aimed at balancing
            growth with risk control. Ideal review cadence: rebalance every 12
            months or when allocations drift by more than 5%.
          </p>
          <div className="flex flex-wrap gap-6 text-sm text-slate-300">
            <div className="rounded-full border border-slate-700 px-4 py-2">
              Target corpus: {currencyFormatter.format(totalProjected)} in 5
              years (assumes {Math.round(blendedReturn * 100)}% CAGR)
            </div>
            <div className="rounded-full border border-slate-700 px-4 py-2">
              Liquidity reserve: 10% in low-volatility debt
            </div>
            <div className="rounded-full border border-slate-700 px-4 py-2">
              Rebalance trigger: &plusmn;5% drift
            </div>
          </div>
        </header>

        <section className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="rounded-3xl bg-slate-900/80 p-8 shadow-lg shadow-slate-900/40 backdrop-blur">
            <h2 className="text-2xl font-semibold text-white">
              Allocation by Sector
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Strategic weighting across secular themes. Hover to view INR
              values.
            </p>
            <div className="mt-8 flex min-h-[340px] items-center justify-center">
              <Pie data={pieData} options={pieOptions} />
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-3xl bg-slate-900/80 p-8 shadow-lg shadow-slate-900/40 backdrop-blur">
              <h2 className="text-2xl font-semibold text-white">
                5-Year Projection
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Based on weighted historical CAGR estimates; for scenario
                analysis only.
              </p>
              <div className="mt-6 h-64">
                <Line data={projectionData} options={projectionOptions} />
              </div>
            </div>

            <div className="rounded-3xl bg-slate-900/80 p-8 shadow-lg shadow-slate-900/40 backdrop-blur">
              <h3 className="text-xl font-semibold text-white">
                Signature ETF & Crypto Picks
              </h3>
              <div className="mt-4 flex flex-col gap-4 text-sm text-slate-300">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-blue-400">
                    ETF Focus
                  </p>
                  <p className="mt-1 text-lg font-semibold text-white">
                    Nippon India Nifty 50 ETF (NIFTYBEES)
                  </p>
                  <p className="mt-2 text-slate-400">
                    Low-cost way to mirror India’s flagship benchmark with deep
                    liquidity. Acts as the portfolio anchor and simplifies
                    rebalancing.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">
                    Crypto Satellite
                  </p>
                  <p className="mt-1 text-lg font-semibold text-white">
                    Bitcoin (BTC)
                  </p>
                  <p className="mt-2 text-slate-400">
                    Dominant store-of-value asset with institutional adoption
                    momentum. Limit to 3-5% of total net worth and rebalance
                    annually to manage volatility.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-slate-900/80 p-10 shadow-lg shadow-slate-900/40 backdrop-blur">
          <h2 className="text-2xl font-semibold text-white">
            Deployment Checklist
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Execute staggered entries to average out market levels. Suggested
            path: deploy 40% immediately, 30% over the next 3 months, and the
            remainder on market dips or scheduled SIP.
          </p>
          <div className="mt-8 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800 text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="py-3 pr-4">Sector &amp; Theme</th>
                  <th className="py-3 px-4">Allocation</th>
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4">Investment Thesis</th>
                  <th className="py-3 pl-4">Expected CAGR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {allocations.map((allocation) => (
                  <tr key={allocation.name}>
                    <td className="py-4 pr-4 font-medium text-white">
                      {allocation.name}
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-semibold text-blue-300">
                        {currencyFormatter.format(allocation.amount)}
                      </div>
                      <div className="text-xs text-slate-400">
                        {(allocation.weight * 100).toFixed(0)}% weight
                      </div>
                    </td>
                    <td className="py-4 px-4 text-blue-300">
                      {allocation.vehicle}
                    </td>
                    <td className="py-4 px-4 text-slate-300">
                      {allocation.thesis}
                    </td>
                    <td className="py-4 pl-4 text-emerald-400">
                      {(allocation.expectedReturn * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-3xl bg-slate-900/80 p-8 text-sm text-slate-400 shadow-lg shadow-slate-900/40 backdrop-blur">
          <h2 className="text-lg font-semibold text-white">
            Risk Guardrails &amp; Action Steps
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5">
            <li>
              Reassess sector weights annually against macro shifts (inflation,
              rate cycle, earnings revisions) and rebalance back to target
              weights.
            </li>
            <li>
              Use systematic investment plans (SIPs) for the equity-heavy
              sleeves to average entry points; lump sum only for debt bucket.
            </li>
            <li>
              Review ETF tracking error, expense ratios, and AUM quarterly to
              avoid slippage from low-liquidity products.
            </li>
            <li>
              For the crypto sleeve, custody via regulated exchange and enable
              2FA; rebalance if allocation exceeds 6% of portfolio value.
            </li>
            <li>
              This framework is educational, not personalised advice. Align with
              risk tolerance, tax profile, and consult a SEBI-registered
              advisor before execution.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
