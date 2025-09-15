import '@testing-library/jest-dom';

// Ensure screens use mock data paths when available
process.env.NEXT_PUBLIC_USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK || '1';

// Lightweight mocks for chart libraries to keep DOM simple in tests
jest.mock('react-chartjs-2', () => ({
  Line: (props: any) => {
    // expose labels length for sanity checks when needed
    return require('react').createElement('div', { 'data-testid': 'line-chart', 'data-labels': (props?.data?.labels || []).length });
  },
  Bar: (props: any) => {
    return require('react').createElement('div', { 'data-testid': 'bar-chart', 'data-labels': (props?.data?.labels || []).length });
  },
}));

jest.mock('chart.js', () => ({
  Chart: class {
    static register() { /* noop */ }
  },
  // Named exports used directly sometimes
  CategoryScale: class {},
  LinearScale: class {},
  BarElement: class {},
  LineElement: class {},
  PointElement: class {},
  Tooltip: class {},
  Legend: class {},
}));

// Polyfill ResizeObserver for headless UI usage in tests
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// @ts-ignore
global.ResizeObserver = global.ResizeObserver || MockResizeObserver;
