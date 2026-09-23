import type { DashboardProvider } from '../types';
import { DataverseProvider } from './dataverseProvider';
import { DemoProvider } from './demoProvider';

export function isDynamicsHost(): boolean {
  return Boolean(window.parent?.Xrm?.Utility);
}

export function createDashboardProvider(): DashboardProvider {
  return isDynamicsHost() ? new DataverseProvider() : new DemoProvider();
}
