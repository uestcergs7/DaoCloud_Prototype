/**
 * app.js — 主应用初始化
 * 数字滚动动画、图表初始化、蜂窝图渲染
 */

document.addEventListener('DOMContentLoaded', () => {

  // ============================================================
  // 1. 蜂窝图渲染
  // ============================================================
  function renderHoneycomb(filter = 'cluster') {
    const grid = document.getElementById('honeycombGrid');
    if (!grid) return;
    
    grid.innerHTML = ''; // 清空重新渲染

    let data = DashboardData.containerStats.honeycomb;
    if (filter === 'namespace') {
      // 命名空间：显示个位数的数据
      data = [
        { status: 'healthy', count: 6 },
        { status: 'good', count: 2 },
        { status: 'warning', count: 0 },
        { status: 'danger', count: 0 },
        { status: 'critical', count: 0 },
        { status: 'unknown', count: 0 }
      ];
    }

    const hexElements = [];
    data.forEach((item) => {
      for (let i = 0; i < item.count && hexElements.length < 40; i++) {
        hexElements.push(item.status || 'healthy');
      }
    });

    // 打乱排列让分布更自然
    for (let i = hexElements.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [hexElements[i], hexElements[j]] = [hexElements[j], hexElements[i]];
    }

    hexElements.forEach((cls, i) => {
      const hex = document.createElement('div');
      hex.className = `hex ${cls}`;
      hex.style.animationDelay = `${i * 20}ms`;
      grid.appendChild(hex);
    });
  }

  // ============================================================
  // 1.5. 容器统计视图切换与码表渲染
  // ============================================================
  function initContainerStatsToggles() {
    const btnHoneycomb = document.getElementById('btnHoneycomb');
    const btnGauge = document.getElementById('btnGauge');
    const honeycombView = document.getElementById('honeycombView');
    const gaugeView = document.getElementById('gaugeView');
    const filterSelect = document.getElementById('containerFilterSelect');
    let gaugeChartRendered = false;

    if (!btnHoneycomb || !btnGauge || !honeycombView || !gaugeView || !filterSelect) return;

    // 下拉框切换逻辑
    filterSelect.addEventListener('change', (e) => {
      const val = e.target.value; // 'cluster' or 'namespace'
      
      let total = 384, running = 315, other = 69;
      if (val === 'namespace') {
        total = 8; running = 6; other = 2;
      }
      
      // 更新蜂窝图底部数字
      const honeycombValues = honeycombView.querySelectorAll('.value');
      if (honeycombValues.length >= 3) {
        // 为了触发可能的数字滚动动画，我们直接改写 DOM
        // 这里只是简单更新，如果需要完整滚动动画，可以重构 animateCounters()
        honeycombValues[0].textContent = total;
        honeycombValues[1].textContent = running;
        honeycombValues[2].textContent = other;
      }

      // 更新码表视图数字
      document.getElementById('gaugeTotalValue').textContent = total;
      document.getElementById('gaugeRunningValue').textContent = running;
      document.getElementById('gaugeOtherValue').textContent = other;

      // 重新渲染图表
      renderHoneycomb(val);
      
      if (gaugeView.style.display !== 'none') {
        Charts.renderHalfDoughnutChart('containerGaugeChart', [running, other]);
      } else {
        gaugeChartRendered = false; // 下次切换回来时重绘
      }
    });

    btnHoneycomb.addEventListener('click', () => {
      btnHoneycomb.style.background = '#1a202c';
      btnHoneycomb.style.color = 'white';
      btnGauge.style.background = 'transparent';
      btnGauge.style.color = '#4a5568';
      honeycombView.style.display = 'block';
      gaugeView.style.display = 'none';
    });

    btnGauge.addEventListener('click', () => {
      btnGauge.style.background = '#1a202c';
      btnGauge.style.color = 'white';
      btnHoneycomb.style.background = 'transparent';
      btnHoneycomb.style.color = '#4a5568';
      honeycombView.style.display = 'none';
      gaugeView.style.display = 'flex';

      // 首次切换或数据变更后切换到码表视图时渲染图表
      if (!gaugeChartRendered) {
        const val = filterSelect.value;
        const running = val === 'namespace' ? 6 : 315;
        const other = val === 'namespace' ? 2 : 69;
        Charts.renderHalfDoughnutChart('containerGaugeChart', [running, other]);
        gaugeChartRendered = true;
      }
    });
  }

  // ============================================================
  // 2. 数字滚动动画
  // ============================================================
  function animateCounters() {
    const counters = document.querySelectorAll('[data-count]');
    counters.forEach(el => {
      const target = parseFloat(el.getAttribute('data-count'));
      const decimals = parseInt(el.getAttribute('data-decimals') || '0');
      const duration = 1000;
      const startTime = performance.now();

      function update(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = target * eased;

        if (decimals > 0) {
          el.textContent = current.toFixed(decimals);
        } else {
          el.textContent = Math.round(current);
        }

        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          if (decimals > 0) {
            el.textContent = target.toFixed(decimals);
          } else {
            el.textContent = target;
          }
        }
      }

      requestAnimationFrame(update);
    });
  }

  // ============================================================
  // 3. 折线图初始化（CPU / 内存）
  // ============================================================
  function initLineCharts() {
    Charts.renderLineChart('cpuChart', DashboardData.cpuUsage, {
      color: 'rgb(43, 108, 176)'
    });

    Charts.renderLineChart('memoryChart', DashboardData.memoryUsage, {
      color: 'rgb(43, 108, 176)'
    });
  }

  // ============================================================
  // 4. 资源用量环形图
  // ============================================================
  function initResourceCharts() {
    const { resourceUsage, gpuResourceUsage } = DashboardData;

    Charts.renderDoughnutChart('resCpu', resourceUsage.cpu.percent, {
      color: '#3182ce'
    });
    Charts.renderDoughnutChart('resMemory', resourceUsage.memory.percent, {
      color: '#3182ce'
    });
    Charts.renderDoughnutChart('resPods', resourceUsage.pods.percent, {
      color: '#ed8936'
    });
    Charts.renderDoughnutChart('resDisk', resourceUsage.disk.percent, {
      color: '#718096'
    });
    Charts.renderDoughnutChart('resGpu', gpuResourceUsage.gpu.percent, {
      color: '#6366f1'
    });
    Charts.renderDoughnutChart('resVram', gpuResourceUsage.vram.percent, {
      color: '#8b5cf6'
    });
  }

  // ============================================================
  // 5. GPU 仪表盘
  // ============================================================
  function initGaugeCharts() {
    const { gpuUtilization } = DashboardData;

    // 延迟一帧确保canvas尺寸正确
    requestAnimationFrame(() => {
      Charts.renderGaugeChart('gaugeAllocation', gpuUtilization.allocation.value);
      Charts.renderGaugeChart('gaugeCompute', gpuUtilization.computeUtilization.value);
      Charts.renderGaugeChart('gaugeMemAlloc', gpuUtilization.memoryAllocation.value);
      Charts.renderGaugeChart('gaugeMemUtil', gpuUtilization.memoryUtilization.value);
    });
  }

  // ============================================================
  // 6. AI 运维图表
  // ============================================================
  function initAICharts() {
    Charts.renderROIChart('aiRoiChart', DashboardData.aiROI);
    Charts.renderGuardrailChart('guardrailChart', DashboardData.guardrailInterventions);

    // Safety bar 动画
    setTimeout(() => {
      const safetyBar = document.getElementById('safetyBarFill');
      if (safetyBar) {
        safetyBar.style.width = DashboardData.aiSafetyScore + '%';
      }
    }, 500);
  }

  // ============================================================
  // 7. 卡片入场动画（使用 IntersectionObserver）
  // ============================================================
  function initEntranceAnimations() {
    const cards = document.querySelectorAll('.card-animate');
    
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.style.animationPlayState = 'running';
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });

      cards.forEach(card => {
        card.style.animationPlayState = 'paused';
        observer.observe(card);
      });
    }
  }

  // ============================================================
  // 8. Apps Popup Logic
  // ============================================================
  function initAppsPopup() {
    const moreBtns = document.querySelectorAll('.apps-more-btn');
    const popup = document.getElementById('appsPopup');
    const closeBtn = document.getElementById('appsPopupClose');
    const title = document.getElementById('appsPopupClusterName');
    const clusterCard = document.getElementById('clusterStatsCard');

    if (!popup || !clusterCard) return;

    moreBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const clusterName = btn.getAttribute('data-cluster') || 'network';
        if (title) title.textContent = clusterName;
        
        // Position the popup exactly covering the cluster stats card
        const rect = clusterCard.getBoundingClientRect();
        popup.style.display = 'block';
        popup.style.top = (rect.top + window.scrollY) + 'px';
        popup.style.left = (rect.left + window.scrollX) + 'px';
        popup.style.width = rect.width + 'px';
        popup.style.height = rect.height + 'px';
        
        // Ensure box-sizing doesn't add padding to the width/height
        popup.style.boxSizing = 'border-box';
      });
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        popup.style.display = 'none';
      });
    }

    // Don't auto-close when clicking inside the popup
    popup.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    document.addEventListener('click', (e) => {
      if (popup.style.display === 'block') {
        // If clicked outside both the popup and the trigger buttons, close it
        const isTrigger = Array.from(moreBtns).some(btn => btn.contains(e.target));
        if (!popup.contains(e.target) && !isTrigger) {
          popup.style.display = 'none';
        }
      }
    });
  }

  // ============================================================
  // 9. Model Costs Pagination & Sorting
  // ============================================================
  function initModelPagination() {
    const tbody = document.getElementById('modelCostTableBody');
    const prevBtn = document.getElementById('modelPrevBtn');
    const nextBtn = document.getElementById('modelNextBtn');
    const pageInfo = document.getElementById('modelPageInfo');
    
    if (!tbody || !prevBtn || !nextBtn || !pageInfo) return;

    let models = [...DashboardData.modelCosts.models];
    const pageSize = 10;
    let currentPage = 1;

    function renderPage(page) {
      const totalPages = Math.ceil(models.length / pageSize) || 1;
      tbody.innerHTML = '';
      const start = (page - 1) * pageSize;
      const end = Math.min(start + pageSize, models.length);
      const pageData = models.slice(start, end);

      pageData.forEach(m => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${m.name}</td>
          <td>${m.tokens}</td>
          <td>￥${m.cost.toFixed(2)}</td>
        `;
        tbody.appendChild(tr);
      });

      pageInfo.textContent = `${start + 1}-${end} of ${models.length}`;
      prevBtn.disabled = page === 1;
      nextBtn.disabled = page === totalPages;
    }

    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        renderPage(currentPage);
      }
    });

    nextBtn.addEventListener('click', () => {
      const totalPages = Math.ceil(models.length / pageSize) || 1;
      if (currentPage < totalPages) {
        currentPage++;
        renderPage(currentPage);
      }
    });

    // Sorting Logic
    let sortCol = null;
    let sortAsc = true;
    const ths = document.querySelectorAll('#modelCostCard th.sortable');
    
    ths.forEach(th => {
      th.addEventListener('click', () => {
        const col = th.dataset.sort;
        if (sortCol === col) {
          sortAsc = !sortAsc;
        } else {
          sortCol = col;
          sortAsc = true;
        }

        ths.forEach(t => t.classList.remove('asc', 'desc'));
        th.classList.add(sortAsc ? 'asc' : 'desc');

        models.sort((a, b) => {
          let valA = a[col];
          let valB = b[col];

          if (col === 'tokens') {
            valA = parseFloat(valA.replace('m', ''));
            valB = parseFloat(valB.replace('m', ''));
          }

          if (valA < valB) return sortAsc ? -1 : 1;
          if (valA > valB) return sortAsc ? 1 : -1;
          return 0;
        });

        currentPage = 1;
        renderPage(currentPage);
      });
    });

    // Initial render
    renderPage(1);
  }

  // ============================================================
  // 初始化所有
  // ============================================================
  renderHoneycomb();
  initContainerStatsToggles();
  animateCounters();
  initLineCharts();
  initResourceCharts();
  initGaugeCharts();
  initAICharts();
  initEntranceAnimations();
  initAppsPopup();
  initModelPagination();

});
