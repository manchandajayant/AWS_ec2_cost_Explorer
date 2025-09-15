import { render, screen, within } from '@testing-library/react';
import Page from '@/app/screens/dashboard/ec2-table/ec2-tables';
import type { EC2InstanceDTO } from '@/types/ec2/EC2InstanceDTO';

const mockInstances: EC2InstanceDTO[] = [
  {
    region: 'us-east-1',
    instanceId: 'i-aaa',
    type: 'm5.large',
    state: 'running',
    launchTime: new Date().toISOString(),
    tags: { Team: 'ML' },
    vCPU: 2,
    RAM: 8,
    GPU: 0,
    pricePerHour: 0.096,
    estimatedCost: 10,
    uptimeHours: 100,
    cpuAvg7d: 12,
    memAvg7d: 18,
  },
  {
    region: 'us-west-2',
    instanceId: 'i-bbb',
    type: 'c6a.xlarge',
    state: 'running',
    launchTime: new Date().toISOString(),
    tags: { Team: 'Platform' },
    vCPU: 4,
    RAM: 8,
    GPU: 0,
    pricePerHour: 0.19,
    estimatedCost: 20,
    uptimeHours: 200,
    cpuAvg7d: 55,
    memAvg7d: 40,
  },
];

jest.mock('@/context/ec2-context', () => ({
  Ec2Provider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useEc2: () => ({
    instances: mockInstances,
    loading: false,
    error: null,
    refresh: jest.fn(),
    refreshUtilization: jest.fn(),
    regions: ['us-east-1', 'us-west-2'],
    instanceTypes: ['m5.large', 'c6a.xlarge'],
    teams: ['ML', 'Platform'],
    projects: [],
  }),
}));

describe('EC2 tables screen', () => {
  it('renders header and instance rows', () => {
    render(<Page />);

    const header = screen.getByText(/EC2 Instances/i);
    expect(header).toBeInTheDocument();

    // Find rows by instance type text
    expect(screen.getByText('m5.large')).toBeInTheDocument();
    expect(screen.getByText('us-east-1')).toBeInTheDocument();
    expect(screen.getByText('c6a.xlarge')).toBeInTheDocument();
    expect(screen.getByText('us-west-2')).toBeInTheDocument();
  });
});

