
import type {ReactNode} from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';

import style from './status.module.css';

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Loader } from 'lucide-react';

// Define the type for a single status item
interface StatusItem {
  id: string;
  name: string;
  status: 'up' | 'down' | 'warning';
  message?: string;
}

// Define the type for the overall health check result from NestJS Terminus
interface HealthCheckResult {
  status: 'ok' | 'error' | 'shutting_down';
  info: Record<string, { status: 'up' }>;
  error: Record<string, { status: 'down'; message?: string }>;
  details: Record<string, { status: 'up' | 'down'; [key: string]: any }>;
}

const Statuses: React.FC = () => {
  const [statuses, setStatuses] = useState<StatusItem[]>([]);
  const [overallStatus, setOverallStatus] = useState<'ok' | 'degraded' | 'critical' | 'unknown'>('unknown');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealthStatus = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('https://edupub.social/health');
        
        if (!response.ok) {
          let errorMessage = `HTTP error! status: ${response.status}`;
          if (response.status === 503) {
            errorMessage = `Service Unavailable (503): A dependency is currently unavailable.`;
          }
          // Note: The previous version commented out the throw new Error.
          // For robust error handling, it's generally good to throw if the response is not OK.
          // For this example, we'll proceed to try parsing JSON even on non-OK,
          // but a real app might handle this more strictly.
          // throw new Error(errorMessage);
        }

        const data: HealthCheckResult = await response.json();

        if (data.status === 'ok') {
          setOverallStatus('ok');
        } else if (data.status === 'error') {
          setOverallStatus('critical');
        } else if (data.status === 'shutting_down') {
          setOverallStatus('degraded');
        } else {
          setOverallStatus('unknown');
        }

        const fetchedStatuses: StatusItem[] = Object.entries(data.details).map(([key, value]) => {
          let itemStatus: 'up' | 'down' | 'warning' = 'up';
          let itemMessage: string | undefined = undefined;

          if (value.status === 'down') {
            itemStatus = 'down';
            if (data.error && data.error[key] && data.error[key].message) {
              itemMessage = data.error[key].message;
            } else if (value.message) {
                itemMessage = value.message;
            }
          } else if (value.status === 'up') {
            itemStatus = 'up';
          }

          return {
            id: key,
            name: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
            status: itemStatus,
            message: itemMessage,
          };
        });
        setStatuses(fetchedStatuses);

      } catch (e: any) {
        console.error("Failed to fetch health status:", e);
        setError(`Failed to load status: ${e.message}`);
        setOverallStatus('critical');
      } finally {
        setLoading(false);
      }
    };

    fetchHealthStatus();
  }, []);

  const renderStatusItem = (item: StatusItem) => {
    let icon;
    let textColorClass;
    let bgColorClass;

    switch (item.status) {
      case 'up':
        icon = <CheckCircle size={20} />;
        textColorClass = style.statusUpText;
        bgColorClass = style.statusUpBg;
        break;
      case 'down':
        icon = <XCircle size={20} />;
        textColorClass = style.statusDownText;
        bgColorClass = style.statusDownBg;
        break;
      case 'warning':
        icon = <AlertCircle size={20} />;
        textColorClass = style.statusWarningText;
        bgColorClass = style.statusWarningBg;
        break;
      default:
        icon = null;
        textColorClass = style.statusDefaultText;
        bgColorClass = style.statusDefaultBg;
    }

    return (
      <div
        key={item.id}
        className={`${style.statusItem} ${bgColorClass}`}
      >
        <span className={`${textColorClass} ${style.statusIcon}`}>{icon}</span>
        <div>
          <p className={style.statusName}>{item.name}</p>
          <p className={`${style.statusMessage} ${textColorClass}`}>
            Status: {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            {item.message && <span className={style.statusDetailMessage}>({item.message})</span>}
          </p>
        </div>
      </div>
    );
  };

  let overallStatusText;
  let overallStatusColorClass;
  let overallStatusBgClass;

  switch (overallStatus) {
    case 'ok':
      overallStatusText = 'Operational';
      overallStatusColorClass = style.overallStatusOkText;
      overallStatusBgClass = style.overallStatusOkBg;
      break;
    case 'degraded':
      overallStatusText = 'Degraded Performance';
      overallStatusColorClass = style.overallStatusDegradedText;
      overallStatusBgClass = style.overallStatusDegradedBg;
      break;
    case 'critical':
      overallStatusText = 'Major Outage';
      overallStatusColorClass = style.overallStatusCriticalText;
      overallStatusBgClass = style.overallStatusCriticalBg;
      break;
    case 'unknown':
    default:
      overallStatusText = 'Unknown';
      overallStatusColorClass = style.overallStatusUnknownText;
      overallStatusBgClass = style.overallStatusUnknownBg;
  }

  const dependenciesStatuses = statuses.filter(status => !['Database'].includes(status.id));
  const column2Statuses = statuses.filter(status => ['Database'].includes(status.id));

  return (
    <div className={style.container}>
      {/* Overall System Status */}
      <div className={`${style.overallStatusCard} ${overallStatusBgClass}`}>
        <h1 className={`${style.overallStatusTitle} ${overallStatusColorClass}`}>
          Overall System Status: {overallStatusText}
        </h1>
        <p className={`${style.overallStatusDescription} ${overallStatusColorClass}`}>
          {loading ? (
            <span className={style.loadingText}>
              <Loader size={24} className={style.loaderIcon} /> Loading status...
            </span>
          ) : error ? (
            <span className={style.errorText}>{error}</span>
          ) : overallStatus === 'ok' ? (
            'All systems are operational.'
          ) : overallStatus === 'degraded' ? (
            'Some systems are experiencing degraded performance.'
          ) : (
            'One or more major systems are experiencing an outage.'
          )}
        </p>
      </div>

      {/* Two Columns for Individual Statuses */}
      <div className={style.columnsWrapper}>
        {/* Column 1 */}
        <div className={style.column}>
          <h2 className={style.columnTitle}>Core Services</h2>
          {loading ? (
            <div className={style.loadingMessage}>Loading service statuses...</div>
          ) : error ? (
            <div className={style.errorMessage}>Error loading services.</div>
          ) : column2Statuses.length === 0 ? (
            <div className={style.noStatusesMessage}>No service statuses available.</div>
          ) : (
            column2Statuses.map(renderStatusItem)
          )}
        </div>

        {/* Column 2 */}
        <div className={style.column}>
          <h2 className={style.columnTitle}>System Resources</h2>
          {loading ? (
            <div className={style.loadingMessage}>Loading service statuses...</div>
          ) : error ? (
            <div className={style.errorMessage}>Error loading services.</div>
          ) : statuses.length === 0 ? (
            <div className={style.noStatusesMessage}>No service statuses available.</div>
          ) : (
            dependenciesStatuses.map(renderStatusItem)
          )}
        </div>
      </div>
    </div>
  );
};

export default function StatusPage(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`System Status`}
      description="Description will go into a meta tag in <head />">
      <main>
        <Statuses />
      </main>
    </Layout>
  );
}