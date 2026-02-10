
export enum ToolType {
  SEO_Lighthouse = 'SEO_Lighthouse',
  GA4_KPI = 'GA4_KPI',
  EPIC_PRIORITY = 'EPIC_PRIORITY',
  SENTIMENT_ANALYSIS = 'SENTIMENT_ANALYSIS',
  RELEASE_REPORTING = 'RELEASE_REPORTING'
}

export interface ProjectContext {
  name: string;
  type: string;
  description: string;
}

export interface GA4Connection {
  isConnected: boolean;
  email?: string;
  propertyName?: string;
  propertyId?: string;
  lastSync?: string;
}

export interface GA4Property {
  name: string;
  displayName: string;
  propertyId: string;
  parent: string;
}

export interface KPI {
  kpi_name: string;
  description: string;
  formula: string;
  input_metrics: string;
  owner: string;
  business_goal_relation: string;
  north_star_alignment: string;
  selected?: boolean;
}

export interface KPIThreshold {
  kpi_name: string;
  target_value: number;
  warning_threshold: number;
  failure_threshold: number;
  threshold_type: '>' | '<';
  alert_priority: 'High' | 'Medium' | 'Low';
  alert_frequency: string;
}

export interface EpicStory {
  id: string;
  title: string;
  type: 'Epic' | 'Story';
  description: string;
  score?: number;
  bucket?: string;
  rice?: {
    reach: number;
    impact: number;
    confidence: number;
    effort: number;
  };
}

export interface LighthouseReport {
  url: string;
  device: 'Desktop' | 'Mobile';
  performance: number;
  accessibility: number;
  seo: number;
  lcp: number;
  recommendation: string;
}
