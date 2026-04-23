export interface StatCard {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: string;
  color: string;
  details: string;
}

export interface RevenuePlan {
  name: string;
  value: string;
  percentage: number;
  dotColor: string;
}

export interface LiveActivity {
  id: number;
  title: string;
  description: string;
  time: string;
  icon: string;
}

export interface ServiceHealth {
  name: string;
  uptime: number;
}

export interface RegionDistribution {
  name: string;
  count: number;
  percentage: number;
}
