import React from 'react';
import { observer } from 'mobx-react-lite';
import { store } from '../../models/store';
import { analyticsModel, TimeRange } from '../../models/AnalyticsModel';
import { BarChart, Clock, CheckCircle, X, ChevronDown, Filter } from 'lucide-react';
import './Analytics.css';
import { format, isSameDay } from 'date-fns';

const TimeRangeSelector = observer(() => {
    const ranges: { id: TimeRange; label: string }[] = [
        { id: 'current-week', label: 'Current work week' },
        { id: 'last-week', label: 'Last 7 days' }, // Simplified mapping for UI
        { id: 'last-2-weeks', label: 'Last 14 days' },
        { id: 'last-month', label: 'Last month' },
        { id: 'last-3-months', label: 'Last 3 months' },
    ];

    return (
        <div className="time-range-selector">
            {ranges.map(range => (
                <button
                    key={range.id}
                    className={`range-btn ${analyticsModel.selectedRange === range.id ? 'active' : ''}`}
                    onClick={() => analyticsModel.setRange(range.id)}
                >
                    {range.label}
                </button>
            ))}
        </div>
    );
});

const formatHours = (hours: number): string => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}:${m.toString().padStart(2, '0')}`;
};

const SimpleBarChart = ({
    data,
    showComparison = false
}: {
    data: {
        label: string;
        value: number; // Used for scale calculation (usually total height)
        value2?: number;
        color?: string;
        stackedValues?: { value: number; color: string; label: string }[];
    }[];
    showComparison?: boolean;
}) => {
    // Round max value up to nice number
    // For stacked, 'value' should represent the total height
    const allValues = data.flatMap(d => [d.value, d.value2 || 0]);
    let maxValue = Math.max(...allValues, 1);

    // Create grid lines (0%, 25%, 50%, 75%, 100%)
    const gridLines = [1, 0.75, 0.5, 0.25, 0];

    return (
        <div className="bar-chart-container">
            <div className="chart-grid-lines">
                {gridLines.map(percent => (
                    <div key={percent} className="grid-line">
                        <span>{formatHours(maxValue * percent)}</span>
                    </div>
                ))}
            </div>

            {data.map((item, idx) => (
                <div key={idx} className="bar-group" style={{
                    flexDirection: 'row',
                    alignItems: 'flex-end',
                    gap: showComparison ? '4px' : '0'
                }}>
                    {showComparison ? (
                        <>
                            {/* Estimated (Opacified) */}
                            <div
                                className="bar"
                                style={{
                                    height: `${((item.value2 || 0) / maxValue) * 100}%`,
                                    background: item.color,
                                    opacity: 0.3,
                                    width: '14px'
                                }}
                            >
                                <div className="bar-tooltip">Est: {formatHours(item.value2 || 0)}</div>
                            </div>
                            {/* Actual (Solid) */}
                            <div
                                className="bar"
                                style={{
                                    height: `${(item.value / maxValue) * 100}%`,
                                    background: item.color,
                                    width: '14px'
                                }}
                            >
                                <div className="bar-tooltip">Act: {formatHours(item.value)}</div>
                            </div>
                        </>
                    ) : item.stackedValues ? (
                        <div
                            className="bar stacked"
                            style={{
                                height: `${(item.value / maxValue) * 100}%`,
                                background: 'transparent',
                                display: 'flex',
                                flexDirection: 'column', // Reset to column for wrapper
                                position: 'relative'
                            }}
                        >
                            {/* Wrapper for segments to handle partial rounded corners and overflow */}
                            <div style={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column-reverse',
                                overflow: 'hidden',
                                borderRadius: '6px 6px 0 0'
                            }}>
                                {item.stackedValues.map((seg, sIdx) => (
                                    <div
                                        key={sIdx}
                                        style={{
                                            width: '100%',
                                            height: `${(seg.value / item.value) * 100}%`,
                                            backgroundColor: seg.color
                                        }}
                                    />
                                ))}
                            </div>

                            {/* Tooltip outside of overflow:hidden wrapper */}
                            <div className="bar-tooltip">
                                <div style={{ fontWeight: 600, marginBottom: '4px' }}>Total: {formatHours(item.value)}</div>
                                {item.stackedValues.map(s => (
                                    <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: s.color }}></span>
                                        {s.label}: {formatHours(s.value)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div
                            className="bar"
                            style={{
                                height: `${(item.value / maxValue) * 100}%`,
                                background: item.color === '#ffca3a'
                                    ? 'linear-gradient(180deg, #ffca3a 0%, #d4a71c 100%)'
                                    : item.color // default gradient in CSS
                            }}
                        >
                            <div className="bar-tooltip">{formatHours(item.value)}</div>
                        </div>
                    )}
                    <span className="bar-label">{item.label}</span>
                </div>
            ))}
        </div>
    );
};

export const Analytics = observer(() => {
    if (!store.isAnalyticsOpen) return null;

    const stats = analyticsModel.completionStats;
    const estVsAct = analyticsModel.actualVsEstimated;
    const brainDumpAge = analyticsModel.brainDumpAge;
    const labelStats = analyticsModel.tasksByLabel;
    const timeSpentByDayByLabel = analyticsModel.timeSpentByDayByLabel;
    const timeSpentByDay = analyticsModel.timeSpentByDay;

    // Determine label skip interval
    let skipInterval = 1;
    if (analyticsModel.selectedRange === 'last-month') {
        skipInterval = 2;
    } else if (analyticsModel.selectedRange === 'last-3-months') {
        skipInterval = 5;
    }

    // Function to process data with skipping logic
    const processChartData = (data: {
        date: Date,
        value: number,
        value2?: number,
        color?: string
        stackedValues?: { value: number; color: string; label: string }[]
    }[], color?: string) => {
        return data.map((d, index) => ({
            label: index % skipInterval === 0 ? format(d.date, 'MMM d') : '',
            value: Number(d.value.toFixed(1)),
            value2: d.value2 ? Number(d.value2.toFixed(1)) : undefined,
            color: d.color || color,
            stackedValues: d.stackedValues
        }));
    };

    // Prepare chart data for Stacked Time Chart (formerly Tasks Completed)
    const timeLabelChartData = processChartData(
        timeSpentByDayByLabel.map(d => {
            const total = d.segments.reduce((acc, s) => acc + s.value, 0);
            return {
                date: d.date,
                value: total,
                stackedValues: d.segments
            };
        }),
        undefined
    );

    // For estimated vs actual
    const timeChartData = processChartData(
        timeSpentByDay.map(d => ({
            date: d.date,
            value: d.actual,
            value2: d.estimated,
            color: d.dominantColor
        })),
        undefined
    );

    return (
        <div className="analytics-overlay">
            <div className="analytics-container">
                <header className="analytics-header">
                    <div className="analytics-title">
                        <BarChart size={28} color="#FF2D55" />
                        Analytics
                    </div>
                    <button className="analytics-close" onClick={() => store.toggleAnalytics()}>
                        <X size={20} />
                    </button>
                </header>

                <div className="analytics-controls">
                    <TimeRangeSelector />
                    <button className="filter-btn">
                        <Filter size={14} />
                        Filter
                    </button>
                </div>

                <div className="analytics-content">
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-header">
                                <CheckCircle size={16} />
                                Tasks completed
                            </div>
                            <div className="stat-value">
                                {stats.count}
                                <span style={{ fontSize: '20px', color: '#666', marginLeft: '8px' }}>
                                    ({Math.round(stats.totalDuration / 60)}h)
                                </span>
                            </div>
                            <div className="stat-tag positive">
                                100% vs last work week
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-header">
                                <Clock size={16} />
                                Actual vs Estimated
                            </div>
                            <div className="stat-subtext">
                                On average, you took {Math.abs(estVsAct.percentage)}% {estVsAct.message} to complete a task
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-header">
                                <BarChart size={16} />
                                Braindump average task age
                            </div>
                            <div className="stat-value">{brainDumpAge} <span style={{ fontSize: '24px' }}>days</span></div>
                            <div className="stat-tag positive">
                                No action needed
                            </div>
                        </div>
                    </div>

                    <div className="charts-grid">
                        <div className="chart-card">
                            <div className="chart-header">
                                <span className="chart-title">How you spent your time each day</span>
                            </div>
                            <SimpleBarChart data={timeLabelChartData} />
                        </div>

                        <div className="chart-card">
                            <div className="chart-header">
                                <span className="chart-title">Estimated (light) vs Actual (solid) Time</span>
                            </div>
                            <SimpleBarChart data={timeChartData} showComparison={true} />
                        </div>
                    </div>

                    <div className="label-table-container">
                        <div className="label-table-header">
                            <span className="chart-title">Your Tasks by Label</span>
                        </div>
                        <div className="table-wrapper">
                            <table className="analytics-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '20%' }}>Label</th>
                                        <th style={{ width: '30%' }}>% (by # of tasks)</th>
                                        <th style={{ width: '20px' }}>Tasks Completed</th>
                                        <th>Estimated Time</th>
                                        <th>Actual Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {labelStats.map(stat => (
                                        <tr key={stat.label}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                    <span className="label-dot" style={{ backgroundColor: stat.label === 'Unlabeled' ? '#E4D0AA' : store.getLabelColor(stat.label) }}></span>
                                                    {stat.label}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <span>{stat.percentage.toFixed(1)}%</span>
                                                    <div className="progress-bar-bg">
                                                        <div
                                                            className="progress-bar-fill"
                                                            style={{
                                                                width: `${stat.percentage}%`,
                                                                backgroundColor: stat.label === 'Unlabeled' ? '#E4D0AA' : store.getLabelColor(stat.label)
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{stat.completedCount}</td>
                                            <td>{Math.round(stat.estimatedTime / 60)}h {Math.round(stat.estimatedTime % 60)}m</td>
                                            <td>{Math.round(stat.actualTime / 60)}h {Math.round(stat.actualTime % 60)}m</td>
                                        </tr>
                                    ))}
                                    {labelStats.length === 0 && (
                                        <tr>
                                            <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#666' }}>
                                                No tasks found in this period
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="label-table-container">
                        <div className="label-table-header">
                            <span className="chart-title">Completed Tasks</span>
                        </div>
                        <div className="table-wrapper">
                            <table className="analytics-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '30%' }}>Task Description</th>
                                        <th style={{ width: '20%' }}>Label</th>
                                        <th>Estimated Time</th>
                                        <th>Actual Time</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {analyticsModel.completedTasksInPeriod.map(task => (
                                        <tr key={task.id}>
                                            <td>{task.title}</td>
                                            <td>
                                                {task.labelId ? (() => {
                                                    const label = store.getLabel(task.labelId);
                                                    return (
                                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                                            <span className="label-dot" style={{ backgroundColor: label ? label.color : '#666' }}></span>
                                                            {label ? label.name : 'Unknown Label'}
                                                        </div>
                                                    );
                                                })() : (
                                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                                        <span className="label-dot" style={{ backgroundColor: '#E4D0AA' }}></span>
                                                        Unlabeled
                                                    </div>
                                                )}
                                            </td>
                                            <td>{task.duration ? `${Math.round(task.duration)}m` : '-'}</td>
                                            <td>{task.actualDuration ? `${Math.round(task.actualDuration)}m` : '-'}</td>
                                            <td>{task.scheduledDate ? format(task.scheduledDate, 'M/d/yyyy') : '-'}</td>
                                        </tr>
                                    ))}
                                    {analyticsModel.completedTasksInPeriod.length === 0 && (
                                        <tr>
                                            <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#666' }}>
                                                No completed tasks in this period
                                            </td>
                                        </tr>
                                    )}
                                    {analyticsModel.completedTasksInPeriod.length > 0 && (
                                        <tr style={{ fontWeight: 600, borderTop: '2px solid #333' }}>
                                            <td colSpan={2}>Total</td>
                                            <td>
                                                {Math.floor(analyticsModel.completedTasksTotalStats.totalEstimated / 60)}h {analyticsModel.completedTasksTotalStats.totalEstimated % 60}m
                                            </td>
                                            <td>
                                                {Math.floor(analyticsModel.completedTasksTotalStats.totalActual / 60)}h {analyticsModel.completedTasksTotalStats.totalActual % 60}m
                                            </td>
                                            <td></td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});
