/**
 * charts.js — 图表渲染模块
 * 使用 Chart.js 绘制各类图表 + 自定义 Canvas 绘制仪表盘
 */

const Charts = {

  // 通用颜色
  colors: {
    primary: '#2b6cb0',
    primaryLight: 'rgba(43, 108, 176, 0.15)',
    blue: '#3182ce',
    blueLight: 'rgba(49, 130, 206, 0.1)',
    orange: '#ed8936',
    orangeLight: 'rgba(237, 137, 54, 0.1)',
    green: '#38a169',
    gray: '#a0aec0',
    grayLight: '#e2e8f0',
    darkText: '#1a202c',
    gpu: '#6366f1',       // GPU 专属紫蓝色
    gpuLight: 'rgba(99, 102, 241, 0.15)',
    vram: '#8b5cf6',      // 显存紫色
    vramLight: 'rgba(139, 92, 246, 0.15)'
  },

  /**
   * 绘制折线图（CPU / 内存用量）
   */
  // Helper: convert any color to rgba
  _toRgba(color, alpha) {
    // Handle rgb() format
    if (color.startsWith('rgb(')) {
      return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
    }
    // Handle hex format
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return color;
  },

  renderLineChart(canvasId, data, options = {}) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, ctx.height || 160);
    const lineColor = options.color || this.colors.primary;
    gradient.addColorStop(0, this._toRgba(lineColor, 0.25));
    gradient.addColorStop(1, this._toRgba(lineColor, 0.02));

    return new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [{
          data: data.data,
          borderColor: lineColor,
          backgroundColor: options.fill !== false ? gradient : 'transparent',
          borderWidth: 2,
          fill: options.fill !== false,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: lineColor,
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1a202c',
            titleColor: '#fff',
            bodyColor: '#e2e8f0',
            cornerRadius: 8,
            padding: 10,
            displayColors: false
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#a0aec0', font: { size: 11 } },
            border: { display: false }
          },
          y: {
            grid: { color: 'rgba(0,0,0,0.04)' },
            ticks: { color: '#a0aec0', font: { size: 11 }, ...(options.yTicks || {}) },
            border: { display: false },
            ...(options.yScale || {})
          }
        },
        interaction: { intersect: false, mode: 'index' }
      }
    });
  },
  /**
   * 绘制半圆环形图（容器码表视图）
   */
  renderHalfDoughnutChart(canvasId, data, options = {}) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    // Destroy existing chart if present
    const existing = Chart.getChart(canvasId);
    if (existing) {
      existing.destroy();
    }

    return new Chart(ctx, {
      type: 'doughnut',
      data: {
        datasets: [{
          data: data,
          backgroundColor: options.colors || ['#68d391', '#ed8936'],
          borderWidth: 0,
          borderRadius: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '80%',
        rotation: -90,
        circumference: 180,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1a202c',
            cornerRadius: 8,
            displayColors: false
          }
        },
        animation: {
          animateRotate: true,
          duration: 1200,
          easing: 'easeOutQuart'
        }
      }
    });
  },

  /**
   * 绘制环形图（资源用量）
   */
  renderDoughnutChart(canvasId, percent, options = {}) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const mainColor = options.color || this.colors.primary;
    const trackColor = options.trackColor || '#edf2f7';

    return new Chart(ctx, {
      type: 'doughnut',
      data: {
        datasets: [{
          data: [percent, 100 - percent],
          backgroundColor: [mainColor, trackColor],
          borderWidth: 0,
          borderRadius: percent < 100 ? 6 : 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '72%',
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        },
        animation: {
          animateRotate: true,
          duration: 1200,
          easing: 'easeOutQuart'
        }
      },
      plugins: [{
        id: 'centerText',
        afterDraw(chart) {
          const { ctx: c, width, height } = chart;
          c.save();
          c.textAlign = 'center';
          c.textBaseline = 'middle';

          // 百分比
          c.font = `bold ${Math.min(width, height) * 0.22}px "Inter", sans-serif`;
          c.fillStyle = '#1a202c';
          c.fillText(`${percent}%`, width / 2, height / 2 - 6);

          // 标签
          c.font = `${Math.min(width, height) * 0.11}px "Inter", sans-serif`;
          c.fillStyle = '#a0aec0';
          c.fillText('已使用', width / 2, height / 2 + 16);

          c.restore();
        }
      }]
    });
  },

  /**
   * 绘制 GPU 利用率仪表盘（半圆 gauge）
   * 参考 gpu_utilization_ratio.png 的多色弧形设计
   */
  renderGaugeChart(canvasId, value, label) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const cx = w / 2;
    const cy = h * 0.72;
    const outerR = Math.min(w, h) * 0.42;
    const innerR = outerR * 0.65;
    const bandR = outerR * 1.12;

    // 动画
    const targetAngle = Math.PI + (value / 100) * Math.PI;
    let currentAngle = Math.PI;
    const startTime = performance.now();
    const duration = 1200;

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      currentAngle = Math.PI + eased * (value / 100) * Math.PI;

      ctx.clearRect(0, 0, w, h);
      drawGauge(ctx, cx, cy, outerR, innerR, bandR, w, h, currentAngle, value, eased);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    function drawGauge(ctx, cx, cy, outerR, innerR, bandR, w, h, angle, value, eased) {
      // 外部色带（背景）
      const bandSegments = [
        { start: Math.PI, end: Math.PI * 1.25, color: '#38a169' },       // 绿色 0-25%
        { start: Math.PI * 1.25, end: Math.PI * 1.5, color: '#ecc94b' },  // 黄色 25-50%
        { start: Math.PI * 1.5, end: Math.PI * 1.75, color: '#ed8936' },  // 橙色 50-75%
        { start: Math.PI * 1.75, end: Math.PI * 2, color: '#e53e3e' }     // 红色 75-100%
      ];

      // 绘制外圈色带
      bandSegments.forEach(seg => {
        ctx.beginPath();
        ctx.arc(cx, cy, bandR, seg.start, seg.end);
        ctx.lineWidth = 6;
        ctx.strokeStyle = seg.color;
        ctx.lineCap = 'butt';
        ctx.stroke();
      });

      // 背景弧（灰色轨道）
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, Math.PI, 2 * Math.PI);
      ctx.lineWidth = outerR - innerR;
      ctx.strokeStyle = '#edf2f7';
      ctx.lineCap = 'butt';
      ctx.stroke();

      // 值弧（渐变）
      if (angle > Math.PI) {
        const grad = ctx.createLinearGradient(cx - outerR, cy, cx + outerR, cy);
        grad.addColorStop(0, '#38a169');
        grad.addColorStop(0.4, '#ecc94b');
        grad.addColorStop(0.7, '#ed8936');
        grad.addColorStop(1, '#e53e3e');

        ctx.beginPath();
        ctx.arc(cx, cy, outerR, Math.PI, angle);
        ctx.lineWidth = outerR - innerR;
        ctx.strokeStyle = grad;
        ctx.lineCap = 'butt';
        ctx.stroke();
      }

      // 中心数字
      const displayValue = (value * eased).toFixed(1);
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // 根据值确定颜色
      let valueColor = '#38a169';
      if (value >= 75) valueColor = '#38a169'; // 高利用率显示绿色（好事）
      else if (value >= 50) valueColor = '#ecc94b';
      else valueColor = '#e53e3e';

      ctx.font = `bold ${outerR * 0.48}px "Inter", sans-serif`;
      ctx.fillStyle = valueColor;
      ctx.fillText(`${displayValue}%`, cx, cy - outerR * 0.08);

      ctx.restore();
    }

    requestAnimationFrame(animate);
  },

  /**
   * 绘制 AI ROI 面积折线图
   */
  renderROIChart(canvasId, data) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const existing = Chart.getChart(canvasId);
    if (existing) {
      existing.destroy();
    }

    const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 220);
    gradient.addColorStop(0, 'rgba(43, 108, 176, 0.2)');
    gradient.addColorStop(1, 'rgba(43, 108, 176, 0.01)');

    return new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [{
          data: data.data,
          borderColor: '#2b6cb0',
          backgroundColor: gradient,
          borderWidth: 2,
          fill: true,
          tension: 0.35,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: '#2b6cb0'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1a202c',
            cornerRadius: 8,
            callbacks: {
              label: (ctx) => `￥${ctx.parsed.y.toLocaleString()}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#a0aec0', font: { size: 10 } },
            border: { display: false }
          },
          y: {
            grid: { color: 'rgba(0,0,0,0.04)' },
            ticks: {
              color: '#a0aec0',
              font: { size: 10 },
              callback: v => v >= 1000 ? `${(v / 1000).toFixed(0)},000` : v
            },
            border: { display: false }
          }
        }
      }
    });
  },

  /**
   * 绘制护栏干预折线图
   */
  renderGuardrailChart(canvasId, data) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const existing = Chart.getChart(canvasId);
    if (existing) {
      existing.destroy();
    }

    return new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [{
          data: data.data,
          borderColor: '#2b6cb0',
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          fill: false,
          tension: 0,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: '#2b6cb0'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1a202c',
            cornerRadius: 8
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#a0aec0', font: { size: 10 }, maxTicksLimit: 6 },
            border: { display: false }
          },
          y: {
            grid: { color: 'rgba(0,0,0,0.04)' },
            ticks: { color: '#a0aec0', font: { size: 10 } },
            border: { display: false }
          }
        }
      }
    });
  }
};
