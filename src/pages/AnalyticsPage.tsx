import React, { useState, useEffect } from 'react';
import { apiFetchTasks, apiFetchCategories, ApiCategory } from '../services/apiService';
import { Task, WeeklyStat, CategoryStat } from '../types';

interface AnalyticsPageProps {
  userId: string;
}

const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

type PeriodType = 'week' | 'month' | 'custom';

function getLast7Days(): string[] {
  const result: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    result.push(d.toISOString().split('T')[0]);
  }
  return result;
}

function getLastMonth(): string[] {
  const result: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    result.push(d.toISOString().split('T')[0]);
  }
  return result;
}

function findCategory(categories: ApiCategory[], catId: string): ApiCategory {
  for (let i = 0; i < categories.length; i++) {
    if (categories[i].id === catId) return categories[i];
  }
  return { id: catId, label: catId, color: '#8b72be' };
}

interface DonutChartProps {
  stats: CategoryStat[];
  totalRate: number;
  categories: ApiCategory[];
}

function DonutChart({ stats, totalRate, categories }: DonutChartProps) {
  const size = 140;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 50;
  const stroke = 18;

  let total = 0;
  for (let i = 0; i < stats.length; i++) total += stats[i].totalCount;

  if (total === 0) {
    return <div className="empty-chart empty-chart-donut">Немає даних</div>;
  }

  const activeStats: CategoryStat[] = [];
  for (let i = 0; i < stats.length; i++) {
    if (stats[i].totalCount > 0) activeStats.push(stats[i]);
  }

  const circumference = 2 * Math.PI * radius;
  const segments: { stat: CategoryStat; dash: number; offset: number }[] = [];
  let currentOffset = 0;

  for (let i = 0; i < activeStats.length; i++) {
    const stat = activeStats[i];
    const dashLength = (stat.totalCount / total) * circumference;
    segments.push({ stat, dash: dashLength, offset: currentOffset });
    currentOffset += dashLength;
  }

  return (
    <div className="donut-row">
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size}>
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#ede9f5" strokeWidth={stroke} />
          {segments.map((seg) => {
            const cat = findCategory(categories, seg.stat.category);
            return (
              <circle
                key={seg.stat.category}
                cx={cx} cy={cy} r={radius}
                fill="none"
                stroke={cat.color}
                strokeWidth={stroke}
                strokeDasharray={`${seg.dash} ${circumference - seg.dash}`}
                strokeDashoffset={-seg.offset}
                transform={`rotate(-90 ${cx} ${cy})`}
              />
            );
          })}
        </svg>
        <div className="donut-center">
          <p className="donut-percent">{totalRate}%</p>
          <p className="donut-label">ефект.</p>
        </div>
      </div>

      <div className="donut-legend">
        {activeStats.map((stat) => {
          const cat = findCategory(categories, stat.category);
          const percent = Math.round((stat.totalCount / total) * 100);
          return (
            <div key={stat.category} className="donut-legend-item">
              <div className="donut-legend-dot" style={{ background: cat.color }} />
              <span className="donut-legend-text">{cat.label}</span>
              <span className="donut-legend-percent">{percent}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface BarStat {
  label: string;
  rate: number;
  hasData: boolean;
}

interface BarChartProps {
  bars: BarStat[];
  title: string;
}

function BarChart({ bars, title }: BarChartProps) {
  let anyData = false;
  for (let i = 0; i < bars.length; i++) {
    if (bars[i].hasData) { anyData = true; break; }
  }

  return (
    <div className="card">
      <p className="section-label">{title}</p>

      {!anyData ? (
        <div className="empty-chart">Немає даних за цей період</div>
      ) : (
        <div className="bar-chart-container">
          <div className="bar-chart-area">
            <div className="bar-grid-line" style={{ top: '0%' }} />
            <div className="bar-grid-line" style={{ top: '25%' }} />
            <div className="bar-grid-line" style={{ top: '50%' }} />
            <div className="bar-grid-line" style={{ top: '75%' }} />

            <div className="bar-axis-label" style={{ top: '-4px', left: '-4px' }}>100</div>
            <div className="bar-axis-label" style={{ top: 'calc(50% - 6px)', left: '-2px' }}>50</div>

            {bars.map((bar, i) => {
              let barClass = 'bar-rect empty';
              if (bar.hasData) {
                barClass = bar.rate < 50 ? 'bar-rect low' : 'bar-rect normal';
              }

              let barPercent = bar.rate;
              if (barPercent < 3 && bar.hasData) barPercent = 3;
              if (!bar.hasData) barPercent = 2;

              const labelClass = bar.rate < 50 ? 'bar-percent low' : 'bar-percent normal';

              return (
                <div key={i} className="bar-column">
                  {bar.hasData && (
                    <span className={labelClass} style={{ bottom: barPercent + '%' }}>
                      {bar.rate}%
                    </span>
                  )}
                  <div className={barClass} style={{ height: barPercent + '%' }} />
                </div>
              );
            })}
          </div>

          <div className="bar-labels-row">
            {bars.map((bar, i) => (
              <div key={i} className={`bar-label ${bar.hasData ? 'has-data' : 'no-data'}`}>
                {bar.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


export default function AnalyticsPage({ userId }: AnalyticsPageProps) {
  const [allTasks, setAllTasks]     = useState<Task[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [period, setPeriod]         = useState<PeriodType>('week');
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [inputFrom, setInputFrom]   = useState<string>('');
  const [inputTo, setInputTo]       = useState<string>('');
  const [appliedFrom, setAppliedFrom] = useState<string>('');
  const [appliedTo, setAppliedTo]     = useState<string>('');
  const [showCustom, setShowCustom] = useState<boolean>(false);

  useEffect(() => {
    apiFetchTasks().then(setAllTasks).catch(console.error);
    apiFetchCategories().then(setCategories).catch(console.error);
  }, []);

  function getDates(): string[] {
    if (period === 'week') return getLast7Days();
    if (period === 'month') return getLastMonth();
    if (period === 'custom' && appliedFrom && appliedTo) {
      const dates: string[] = [];
      const cur = new Date(appliedFrom);
      const end = new Date(appliedTo);
      while (cur <= end) {
        dates.push(cur.toISOString().split('T')[0]);
        cur.setDate(cur.getDate() + 1);
      }
      return dates;
    }
    return getLast7Days();
  }

  const dates = getDates();

  const filteredTasks: Task[] = [];
  for (let i = 0; i < allTasks.length; i++) {
    const task = allTasks[i];
    let inRange = false;
    for (let j = 0; j < dates.length; j++) {
      if (task.scheduledAt.startsWith(dates[j])) { inRange = true; break; }
    }
    if (inRange) filteredTasks.push(task);
  }

  const periodicStats: WeeklyStat[] = [];
  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    let dayTotal = 0;
    let dayCompleted = 0;
    for (let j = 0; j < filteredTasks.length; j++) {
      const t = filteredTasks[j];
      if (t.scheduledAt.startsWith(date)) {
        dayTotal++;
        if (t.isCompleted) dayCompleted++;
      }
    }
    const rate = dayTotal > 0 ? Math.round((dayCompleted / dayTotal) * 100) : 0;
    periodicStats.push({
      date,
      totalTasks: dayTotal,
      completedTasks: dayCompleted,
      completionRate: rate,
    });
  }

  const uniqueCategoryIds: string[] = [];
  for (let i = 0; i < filteredTasks.length; i++) {
    const cat = filteredTasks[i].category;
    if (uniqueCategoryIds.indexOf(cat) === -1) uniqueCategoryIds.push(cat);
  }

  const categoryStats: CategoryStat[] = [];
  for (let i = 0; i < uniqueCategoryIds.length; i++) {
    const catId = uniqueCategoryIds[i];
    let catTotal = 0;
    let catCompleted = 0;
    for (let j = 0; j < filteredTasks.length; j++) {
      const t = filteredTasks[j];
      if (t.category === catId) {
        catTotal++;
        if (t.isCompleted) catCompleted++;
      }
    }
    const pct = catTotal > 0 ? Math.round((catCompleted / catTotal) * 100) : 0;
    categoryStats.push({
      category: catId,
      completedCount: catCompleted,
      totalCount: catTotal,
      percentage: pct,
    });
  }

  const totalTasks = filteredTasks.length;
  let totalCompleted = 0;
  for (let i = 0; i < filteredTasks.length; i++) {
    if (filteredTasks[i].isCompleted) totalCompleted++;
  }
  const averageRate = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

  const barStats: BarStat[] = [];

  if (period === 'week' || (period === 'custom' && periodicStats.length <= 14)) {
    for (let i = 0; i < periodicStats.length; i++) {
      const stat = periodicStats[i];
      const label = period === 'week' ? DAY_LABELS[i] : stat.date.slice(5);
      barStats.push({
        label,
        rate: stat.completionRate,
        hasData: stat.totalTasks > 0,
      });
    }
  } else {
    let weekIdx = 1;
    for (let i = 0; i < periodicStats.length; i += 7) {
      const groupEnd = Math.min(i + 7, periodicStats.length);
      let groupTotal = 0;
      let groupCompleted = 0;
      for (let j = i; j < groupEnd; j++) {
        groupTotal += periodicStats[j].totalTasks;
        groupCompleted += periodicStats[j].completedTasks;
      }
      const weekRate = groupTotal > 0 ? Math.round((groupCompleted / groupTotal) * 100) : 0;
      barStats.push({
        label: 'Т' + weekIdx,
        rate: weekRate,
        hasData: groupTotal > 0,
      });
      weekIdx++;
    }
  }

  const trendPoints: { x: number; y: number; label: string; rate: number }[] = [];
  const svgW = 300;
  const svgH = 80;

  const barsWithData: BarStat[] = [];
  for (let i = 0; i < barStats.length; i++) {
    if (barStats[i].hasData) barsWithData.push(barStats[i]);
  }

  for (let i = 0; i < barsWithData.length; i++) {
    const x = barsWithData.length > 1 ? (i / (barsWithData.length - 1)) * svgW : svgW / 2;
    const y = svgH - (barsWithData[i].rate / 100) * svgH;
    trendPoints.push({ x, y, label: barsWithData[i].label, rate: barsWithData[i].rate });
  }

  let polyline = '';
  for (let i = 0; i < trendPoints.length; i++) {
    if (i > 0) polyline += ' ';
    polyline += trendPoints[i].x + ',' + trendPoints[i].y;
  }
  const area = `0,${svgH} ${polyline} ${svgW},${svgH}`;

  let periodLabel = 'Цей тиждень';
  if (period === 'month') periodLabel = 'Цей місяць';
  if (period === 'custom') periodLabel = 'Діапазон';

  function handlePeriod(p: PeriodType): void {
    setPeriod(p);
    setShowDropdown(false);
    setShowCustom(p === 'custom');

    if (p === 'custom') {
      if (!appliedFrom) {
        const today = new Date();
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        setInputFrom(weekAgo.toISOString().split('T')[0]);
        setInputTo(today.toISOString().split('T')[0]);
      }
    } else {
      setInputFrom('');
      setInputTo('');
      setAppliedFrom('');
      setAppliedTo('');
    }
  }

  function handleApply(): void {
    if (!inputFrom || !inputTo) return;
    if (new Date(inputFrom) > new Date(inputTo)) {
      alert('Дата "Від" має бути раніше за "До"');
      return;
    }
    setAppliedFrom(inputFrom);
    setAppliedTo(inputTo);
  }

  function handleClearDates(): void {
    setInputFrom('');
    setInputTo('');
    setAppliedFrom('');
    setAppliedTo('');
  }

  let hasUnapplied = false;
  if (period === 'custom' && inputFrom && inputTo) {
    if (inputFrom !== appliedFrom || inputTo !== appliedTo) hasUnapplied = true;
  }

  let chartTitle = 'Виконання по днях (%)';
  if (period === 'month' || (period === 'custom' && periodicStats.length > 14)) {
    chartTitle = 'Виконання по тижнях (%)';
  }

  return (
    <div className="page" style={{ overflowY: 'auto' }}>
      <div className="page-header">
        <h1 className="page-title">Аналітика продуктивності</h1>
        <div style={{ position: 'relative' }}>
          <button className="dropdown-button" onClick={() => setShowDropdown(!showDropdown)}>
            {periodLabel} ▾
          </button>

          {showDropdown && (
            <div className="dropdown-menu">
              <button
                onClick={() => handlePeriod('week')}
                className={`dropdown-item ${period === 'week' ? 'active' : ''}`}
              >
                Цей тиждень
              </button>
              <button
                onClick={() => handlePeriod('month')}
                className={`dropdown-item ${period === 'month' ? 'active' : ''}`}
              >
                Цей місяць
              </button>
              <button
                onClick={() => handlePeriod('custom')}
                className={`dropdown-item ${period === 'custom' ? 'active' : ''}`}
              >
                Діапазон
              </button>
            </div>
          )}
        </div>
      </div>

      {showCustom && (
        <div className="card" style={{ marginBottom: '14px' }}>
          <div className="date-row">
            <div className="date-input-wrapper">
              <label className="form-label">Від</label>
              <input
                type="date"
                value={inputFrom}
                onChange={(e) => setInputFrom(e.target.value)}
                className="input"
              />
            </div>
            <div className="date-input-wrapper">
              <label className="form-label">До</label>
              <input
                type="date"
                value={inputTo}
                onChange={(e) => setInputTo(e.target.value)}
                className="input"
              />
            </div>
            <button
              className="btn-primary"
              onClick={handleApply}
              disabled={!inputFrom || !inputTo}
            >
              Застосувати
            </button>
            {(inputFrom || inputTo) && (
              <button className="btn-secondary" onClick={handleClearDates}>
                Очистити
              </button>
            )}
          </div>
          {hasUnapplied && (
            <p className="alert-warning">⚠ Натисніть "Застосувати" щоб оновити дані</p>
          )}
          {period === 'custom' && !appliedFrom && (
            <p className="alert-info">💡 Поки не застосовано — показуємо останні 7 днів</p>
          )}
        </div>
      )}

      <div className="stats-grid-3">
        <div className="stat-card-primary">
          <p className="stat-label">Ефективність</p>
          <p className="stat-number">{averageRate}%</p>
        </div>
        <div className="card">
          <p className="stat-label-muted">Виконано</p>
          <p className="stat-number purple">{totalCompleted}</p>
          <p className="stat-sub">з {totalTasks} завдань</p>
        </div>
        <div className="card">
          <p className="stat-label-muted">За період</p>
          <p className="stat-number pink">{dates.length}</p>
          <p className="stat-sub">днів</p>
        </div>
      </div>

      <div className="charts-row">
        <BarChart bars={barStats} title={chartTitle} />

        <div className="card">
          <p className="section-label">Розподіл по категоріях</p>
          <DonutChart stats={categoryStats} totalRate={averageRate} categories={categories} />
        </div>
      </div>

      <div className="card">
        <p className="section-label">Тренд продуктивності (%)</p>
        {trendPoints.length === 0 ? (
          <div className="empty-chart empty-chart-small">Немає даних для побудови тренду</div>
        ) : (
          <>
            <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: '100%', height: '80px', overflow: 'visible' }}>
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b72be" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#8b72be" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polygon points={area} fill="url(#lineGrad)" />
              <polyline points={polyline} fill="none" stroke="#8b72be" strokeWidth="2" strokeLinejoin="round" />
              {trendPoints.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x} cy={p.y} r="4"
                  fill={p.rate < 50 ? '#e07b3f' : '#8b72be'}
                  stroke="#fff"
                  strokeWidth="1.5"
                />
              ))}
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
              {trendPoints.map((p, i) => (
                <span key={i} style={{ fontSize: '10px', color: '#b0a0c8' }}>{p.label}</span>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}