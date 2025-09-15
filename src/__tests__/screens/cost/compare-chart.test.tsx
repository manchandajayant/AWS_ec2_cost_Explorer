import { render, screen } from '@testing-library/react';
import CompareChart from '@/app/screens/dashboard/cost/compare-chart';
import { CostViewSettingsProvider } from '@/app/screens/dashboard/cost/view-settings-context';

describe('CompareChart sub-screen', () => {
  it('renders line chart and shows future months banner', () => {
    const labels = ['REGION'];
    const datasets = [
      { label: '2099-01', data: [100] },
      { label: '2025-01', data: [80] },
    ];

    render(
      <CostViewSettingsProvider defaultChartType="line">
        <CompareChart labels={labels} datasets={datasets} colors={["#a", "#b"]} monthA={'2099-01'} monthB={'2025-01'} />
      </CostViewSettingsProvider>
    );

    expect(screen.getByText(/Future months are estimated/i)).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });
});

