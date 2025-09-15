import { render, screen } from '@testing-library/react';
import CostAttributionSection from '@/app/screens/dashboard/cost/cost-attribution-section';
import type { CostAttribution } from '@/types/cost/cost';

describe('CostAttributionSection sub-screen', () => {
  it('prompts to select a tag when none active', () => {
    render(<CostAttributionSection activeTagKey="" activeDimKey="REGION" attrCoverage={null} />);
    expect(screen.getByText(/Select a Tag key/i)).toBeInTheDocument();
  });

  it('renders attribution tables and summary when data present', () => {
    const data: CostAttribution = {
      tagKey: 'Team',
      metric: 'UnblendedCost',
      unit: 'USD',
      granularity: 'DAILY',
      timePeriod: { start: '2025-09-01', end: '2025-09-12' },
      total: 200,
      attributed: 150,
      unaccounted: 50,
      breakdown: [
        { key: 'ML', amount: 100 },
        { key: 'Platform', amount: 50 },
      ],
    };

    render(<CostAttributionSection activeTagKey="Team" activeDimKey="REGION" attrCoverage={data} />);

    expect(screen.getByText(/Attributed \$150\.00 of \$200\.00/)).toBeInTheDocument();
    expect(screen.getByText('ML')).toBeInTheDocument();
    expect(screen.getByText('Platform')).toBeInTheDocument();
    expect(screen.getByText('Attributed')).toBeInTheDocument();
    expect(screen.getByText('Unaccounted')).toBeInTheDocument();
  });
});

