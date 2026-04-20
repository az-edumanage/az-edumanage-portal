import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, signal, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import * as d3 from 'd3';

interface StatCard {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: string;
  color: string;
  details: string;
}

@Component({
  selector: 'app-owner-overview',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './owner-overview.component.html',
  styleUrl: './owner-overview.component.css'})
export class OwnerOverviewComponent implements AfterViewInit, OnDestroy {
  @ViewChild('growthChart') growthChartContainer!: ElementRef;
  @ViewChild('revenueChart') revenueChartContainer!: ElementRef;

  private platformId = inject(PLATFORM_ID);
  timeRange = signal('30d');
  private resizeObserver!: ResizeObserver;

  stats: StatCard[] = [
    { label: 'Total Revenue', value: '$1.42M', change: '12.5%', trend: 'up', icon: 'payments', color: 'bg-indigo-600', details: '+$142k from last month' },
    { label: 'Active Tenants', value: '1,248', change: '8.2%', trend: 'up', icon: 'business', color: 'bg-indigo-600', details: '94 new this month' },
    { label: 'Avg. LTV', value: '$4,820', change: '3.1%', trend: 'up', icon: 'trending_up', color: 'bg-emerald-600', details: 'Lifetime value per center' },
    { label: 'Churn Rate', value: '1.2%', change: '0.4%', trend: 'down', icon: 'person_remove', color: 'bg-rose-600', details: 'Lowest in 6 months' }
  ];

  plans = [
    { name: 'Enterprise', value: '$640k', percentage: 45, dotColor: 'bg-indigo-500' },
    { name: 'Professional', value: '$498k', percentage: 35, dotColor: 'bg-blue-500' },
    { name: 'Starter', value: '$285k', percentage: 20, dotColor: 'bg-sky-400' }
  ];

  activities = [
    { id: 1, title: 'New Enterprise Tenant', description: 'Global Education Group joined.', time: '2 mins ago', icon: 'add_business' },
    { id: 2, title: 'System Update', description: 'v2.4.0 deployed to US-EAST-1.', time: '15 mins ago', icon: 'system_update' },
    { id: 3, title: 'High Usage Alert', description: 'Cairo Math Center exceeded storage.', time: '1 hour ago', icon: 'priority_high' },
    { id: 4, title: 'Billing Success', description: '1,142 invoices processed.', time: '3 hours ago', icon: 'check_circle' }
  ];

  services = [
    { name: 'API Gateway', uptime: 99.99 },
    { name: 'Database Cluster', uptime: 99.98 },
    { name: 'Storage Service', uptime: 100 }
  ];

  regions = [
    { name: 'Middle East', count: 542, percentage: 43 },
    { name: 'North America', count: 312, percentage: 25 },
    { name: 'Europe', count: 284, percentage: 22 },
    { name: 'Other', count: 110, percentage: 10 }
  ];

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.renderCharts();
      
      this.resizeObserver = new ResizeObserver(() => {
        this.renderCharts();
      });
      this.resizeObserver.observe(this.growthChartContainer.nativeElement);
    }
  }

  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  private renderCharts() {
    this.renderGrowthChart();
    this.renderRevenueChart();
  }

  private renderGrowthChart() {
    const element = this.growthChartContainer.nativeElement;
    d3.select(element).selectAll('*').remove();

    const width = element.clientWidth;
    const height = element.clientHeight;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };

    const svg = d3.select(element)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    interface ChartData {
      date: number;
      value: number;
      trial: number;
    }

    const data: ChartData[] = Array.from({ length: 30 }, (_, i) => ({
      date: i,
      value: 100 + Math.sin(i / 5) * 50 + i * 5,
      trial: 20 + Math.cos(i / 5) * 10 + i * 2
    }));

    const x = d3.scaleLinear()
      .domain([0, 29])
      .range([0, width - margin.left - margin.right]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value + d.trial) || 300])
      .range([height - margin.top - margin.bottom, 0]);

    // Area for Active
    const area = d3.area<ChartData>()
      .x(d => x(d.date))
      .y0(y(0))
      .y1(d => y(d.value))
      .curve(d3.curveBasis);

    svg.append('path')
      .datum(data)
      .attr('fill', 'rgba(99, 102, 241, 0.1)')
      .attr('d', area);

    // Line for Active
    const line = d3.line<ChartData>()
      .x(d => x(d.date))
      .y(d => y(d.value))
      .curve(d3.curveBasis);

    svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#6366f1')
      .attr('stroke-width', 3)
      .attr('d', line);

    // Line for Trial
    const trialLine = d3.line<ChartData>()
      .x(d => x(d.date))
      .y(d => y(d.trial))
      .curve(d3.curveBasis);

    svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#94a3b8')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4,4')
      .attr('d', trialLine);

    // Axes
    svg.append('g')
      .attr('transform', `translate(0,${height - margin.top - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d => `Day ${d}`))
      .attr('color', '#94a3b8')
      .select('.domain').remove();

    svg.append('g')
      .call(d3.axisLeft(y).ticks(5))
      .attr('color', '#94a3b8')
      .select('.domain').remove();
  }

  private renderRevenueChart() {
    const element = this.revenueChartContainer.nativeElement;
    d3.select(element).selectAll('*').remove();

    const width = element.clientWidth;
    const height = element.clientHeight;
    const radius = Math.min(width, height) / 2;

    const svg = d3.select(element)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    const data = this.plans;
    const color = d3.scaleOrdinal<string>()
      .domain(data.map(d => d.name))
      .range(['#6366f1', '#3b82f6', '#38bdf8']);

    const pie = d3.pie<typeof data[0]>()
      .value(d => d.percentage)
      .sort(null);

    const arc = d3.arc<d3.PieArcDatum<typeof data[0]>>()
      .innerRadius(radius * 0.7)
      .outerRadius(radius);

    const arcs = svg.selectAll('arc')
      .data(pie(data))
      .enter()
      .append('g');

    arcs.append('path')
      .attr('d', arc)
      .attr('fill', d => color(d.data.name))
      .attr('stroke', 'white')
      .style('stroke-width', '2px');

    // Center text
    svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.5em')
      .attr('class', 'text-slate-500 text-xs uppercase font-bold')
      .text('Total MRR');

    svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.8em')
      .attr('class', 'text-slate-900 dark:text-white text-2xl font-bold')
      .text('$1.42M');
  }
}
