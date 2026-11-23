/**
 * [2026 인공지능 기초] FreshShare AI - 메인 프론트엔드 UI 컨트롤러 & 인터랙션 엔진
 * 제작: 성신여자고등학교 20329 허가은
 */

document.addEventListener("DOMContentLoaded", () => {
  // 1. 전역 상태 관리
  const state = {
    stores: window.STORE_DATABASE || [],
    foodItems: [...(window.INITIAL_FOOD_ITEMS || [])],
    compatibility: window.CATEGORY_COMPATIBILITY || {},
    engine: null,

    currentStoreId: "store_1", // 기본: 비스트로 보노 (이탈리안)
    currentStore: null,

    maxRadius: 1500, // 기본 1.5km
    selectedCategory: "전체",
    sortBy: "ai-match",

    notifications: [],
    radarAnimId: null,
    radarAngle: 0,

    activeDealItem: null,
    dealTimerId: null,
    dealSecondsRemaining: 1800 // 30분 = 1800초
  };

  // 2. DOM 요소 캐싱
  const els = {
    storeSelect: document.getElementById("current-store-select"),
    btnNotificationBell: document.getElementById("btn-notification-bell"),
    notiBadge: document.getElementById("noti-count-badge"),
    notiDropdown: document.getElementById("noti-dropdown"),
    notiList: document.getElementById("noti-list-container"),
    btnOpenAiDoc: document.getElementById("btn-open-ai-doc"),

    // 필터 & 정렬
    radiusTabs: document.querySelectorAll("#radius-tabs .btn-filter-chip"),
    categoryTabs: document.querySelectorAll("#category-tabs .btn-category-chip"),
    sortSelect: document.getElementById("sort-select"),
    feedStatusText: document.getElementById("feed-status-text"),
    itemCountLabel: document.getElementById("item-count-label"),
    foodCardsGrid: document.getElementById("food-cards-container"),

    // 모달 트리거
    btnVoiceModal: document.getElementById("btn-voice-modal"),
    btnVisionModal: document.getElementById("btn-vision-modal"),
    btnRadarModal: document.getElementById("btn-toggle-radar-modal"),

    // 음성 모달
    modalVoice: document.getElementById("modal-voice"),
    btnMicStart: document.getElementById("btn-mic-start"),
    micAnimationBox: document.getElementById("mic-animation-box"),
    voiceStatusText: document.getElementById("voice-status-text"),
    voicePresetList: document.getElementById("voice-preset-list"),
    voiceRecognizedText: document.getElementById("voice-recognized-text"),
    voiceExtractedPreview: document.getElementById("voice-extracted-preview"),
    resItemName: document.getElementById("res-item-name"),
    resItemCat: document.getElementById("res-item-cat"),
    resItemQty: document.getElementById("res-item-qty"),
    resItemPrice: document.getElementById("res-item-price"),
    btnConfirmVoiceRegister: document.getElementById("btn-confirm-voice-register"),

    // 사진 모달
    modalVision: document.getElementById("modal-vision"),
    visionDropzone: document.getElementById("vision-dropzone"),
    visionFileInput: document.getElementById("vision-file-input"),
    visionPreviewImg: document.getElementById("vision-preview-img"),
    dropzonePlaceholder: document.getElementById("dropzone-placeholder"),
    samplePhotoBtns: document.querySelectorAll(".sample-photo-btn"),
    visionAnalysisBox: document.getElementById("vision-analysis-box"),
    visionStatusText: document.getElementById("vision-status-text"),
    visionResultDetails: document.getElementById("vision-result-details"),
    btnConfirmVisionRegister: document.getElementById("btn-confirm-vision-register"),

    // 레이더 맵 모달
    modalRadar: document.getElementById("modal-radar"),
    radarCanvas: document.getElementById("radarMapCanvas"),

    // 직거래 모달
    modalDeal: document.getElementById("modal-deal"),
    dealVoucher: document.getElementById("deal-voucher-container"),
    dealCountdown: document.getElementById("deal-countdown-timer"),
    dealProgressBar: document.getElementById("deal-timer-progress"),
    btnCompleteDeal: document.getElementById("btn-complete-deal-pickup"),

    // AI 원리 모달
    modalAiDoc: document.getElementById("modal-ai-doc"),

    // 캔버스
    pricingCurveCanvas: document.getElementById("pricingCurveCanvas")
  };

  // 임시 보관용 파싱 결과
  let tempVoiceParsed = null;
  let tempVisionParsed = null;

  // Web Audio API 효과음 발생기
  function playBeep(freq = 600, duration = 0.12, type = "sine") {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // AudioContext 비활성화 환경 무시
    }
  }

  function playSuccessChord() {
    playBeep(523.25, 0.2); // C5
    setTimeout(() => playBeep(659.25, 0.2), 80); // E5
    setTimeout(() => playBeep(783.99, 0.35), 160); // G5
  }

  // =========================================================================
  // 1. 애플리케이션 초기화
  // =========================================================================
  function initApp() {
    state.engine = new FreshShareAIEngine(state.stores, state.foodItems, state.compatibility);
    state.currentStore = state.stores.find(s => s.id === state.currentStoreId) || state.stores[0];

    populateStoreSelector();
    populateVoicePresets();
    generateInitialNotifications();
    drawDynamicPricingCurve();

    bindEvents();
    renderFeed();
  }

  // 매장 셀렉터 옵션 생성
  function populateStoreSelector() {
    els.storeSelect.innerHTML = "";
    state.stores.forEach(s => {
      const opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = `${s.name} (${s.category})`;
      if (s.id === state.currentStoreId) opt.selected = true;
      els.storeSelect.appendChild(opt);
    });
  }

  // 음성 프리셋 리스트 채우기
  function populateVoicePresets() {
    const samples = window.PRESET_VOICE_SAMPLES || [];
    els.voicePresetList.innerHTML = "";
    samples.forEach(sample => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "voice-preset-btn";
      btn.innerHTML = `<strong>🗣️ ${sample.label}</strong><br><small style="color:var(--text-dim);">${sample.text}</small>`;
      btn.addEventListener("click", () => {
        applyVoiceSample(sample);
      });
      els.voicePresetList.appendChild(btn);
    });
  }

  // =========================================================================
  // 2. 피드 렌더링 및 AI 스마트 매칭 계산
  // =========================================================================
  function renderFeed() {
    if (!state.engine || !state.currentStore) return;

    // AI 엔진으로 현재 점주를 위한 반경 내 매물 도출
    let recommendations = state.engine.getRecommendationsForStore(state.currentStore, state.maxRadius);

    // 카테고리 필터
    if (state.selectedCategory !== "전체") {
      recommendations = recommendations.filter(item => item.category === state.selectedCategory);
    }

    // 정렬
    if (state.sortBy === "ai-match") {
      recommendations.sort((a, b) => b.matchInfo.compositeScore - a.matchInfo.compositeScore);
    } else if (state.sortBy === "urgency") {
      recommendations.sort((a, b) => (a.deadlineHours || 5) - (b.deadlineHours || 5));
    } else if (state.sortBy === "distance") {
      recommendations.sort((a, b) => a.matchInfo.distanceMeter - b.matchInfo.distanceMeter);
    } else if (state.sortBy === "price-asc") {
      recommendations.sort((a, b) => a.dynamicPricing.salePrice - b.dynamicPricing.salePrice);
    }

    // 텍스트 라벨 갱신
    els.feedStatusText.innerHTML = `현재 <strong>${state.currentStore.name}</strong> (${state.currentStore.category}) 셰프님을 위해 AI가 엄선한 직거래 추천 식재료입니다.`;
    els.itemCountLabel.textContent = recommendations.length;

    // 카드 그리드 렌더링
    els.foodCardsGrid.innerHTML = "";

    if (recommendations.length === 0) {
      els.foodCardsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: var(--text-dim);">
          <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
          <h3 style="font-size: 1.25rem; color: var(--text-main); margin-bottom: 0.5rem;">현재 조건에 맞는 직거래 매물이 없습니다</h3>
          <p>반경을 1.5km로 넓히시거나 카테고리 필터를 '전체'로 변경해 보세요.</p>
        </div>
      `;
      return;
    }

    recommendations.forEach((item, idx) => {
      const card = createFoodCardElement(item, idx);
      els.foodCardsGrid.appendChild(card);
    });
  }

  // 개별 식재료 카드 DOM 생성
  function createFoodCardElement(item, index) {
    const card = document.createElement("article");
    card.className = "food-card";
    card.style.animation = `fadeIn 0.3s ease forwards ${index * 0.05}s`;

    const matchInfo = item.matchInfo;
    const pricing = item.dynamicPricing;
    const distanceMeter = matchInfo.distanceMeter;
    const walkMinutes = Math.max(2, Math.round(distanceMeter / 75)); // 보행 속도 환산

    // 태그 HTML
    const tagsHtml = (item.tags || [])
      .slice(0, 3)
      .map(t => `<span class="tag-badge">#${t}</span>`)
      .join("");

    card.innerHTML = `
      <div class="card-top-image">
        <img src="${item.imageUrl}" alt="${item.title}" class="card-img" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80'">
        <div class="card-gradient-overlay"></div>
        <div class="badge-ai-match" title="AI 다기준 스마트 매칭 적합도">
          <span>⚡</span>
          <span>${matchInfo.matchProbability}% 매칭</span>
        </div>
        <div class="badge-distance" title="도보 직거래 가능 거리">
          <span>🚶 도보 ${walkMinutes}분 (${distanceMeter}m)</span>
        </div>
      </div>

      <div class="card-body">
        <div class="card-store-row">
          <span class="card-store-name">🏪 ${item.storeName}</span>
          <span class="card-cat-badge">${item.category}</span>
        </div>

        <h3 class="card-title" title="${item.title}">${item.title}</h3>

        <div class="card-tags-row">
          ${tagsHtml}
        </div>

        <!-- AI 매칭 사유 배너 -->
        <div class="ai-match-reason-box">
          <span>💡</span>
          <div>
            <strong>AI 매칭 포인트:</strong> ${matchInfo.matchReason}
          </div>
        </div>

        <p class="card-desc-snippet">${item.description}</p>

        <!-- 동적 가격 박스 -->
        <div class="dynamic-pricing-box">
          <div class="pricing-timer-row">
            <span class="badge-urgency ${pricing.statusClass}">
              ${pricing.statusLabel}
            </span>
            <span style="color:var(--text-dim); font-size:0.75rem;">
              ⏳ 마감까지 약 ${item.deadlineHours}시간
            </span>
          </div>

          <div class="pricing-numbers-row">
            <div>
              <span class="price-original">${pricing.originalPrice.toLocaleString()}원</span>
              <div style="font-size:0.75rem; color:var(--text-dim); margin-top:2px;">
                수량: <strong>${item.quantity}</strong>
              </div>
            </div>
            <div style="text-align: right;">
              <span class="price-discount-rate">${pricing.discountRate}%</span>
              <span class="price-current">${pricing.salePrice.toLocaleString()}</span>
              <span class="price-unit">원</span>
            </div>
          </div>
        </div>

        <div class="card-action-bar">
          <button type="button" class="btn-deal-pickup" data-item-id="${item.id}">
            <span>🤝</span>
            <span>30분 내 직거래 픽업</span>
          </button>
          <button type="button" class="btn-show-map" data-item-id="${item.id}" title="위치 레이더 보기">
            <span>🗺️</span>
          </button>
        </div>
      </div>
    `;

    // 픽업 신청 이벤트 바인딩
    card.querySelector(".btn-deal-pickup").addEventListener("click", () => {
      openDealModal(item);
    });

    // 레이더 맵 보기 이벤트 바인딩
    card.querySelector(".btn-show-map").addEventListener("click", () => {
      openRadarModal(item);
    });

    return card;
  }

  // =========================================================================
  // 3. AI 핀포인트 알림 센터
  // =========================================================================
  function generateInitialNotifications() {
    if (!state.engine || !state.currentStore) return;

    // 현재 매장에 올 만한 핀포인트 알림 선별
    state.notifications = [];
    state.foodItems.forEach(item => {
      const seller = state.stores.find(s => s.id === item.storeId);
      if (!seller || seller.id === state.currentStore.id) return;

      const evalRes = state.engine.evaluateMatchingPair(item, seller, state.currentStore);
      if (evalRes && evalRes.isPinpointTarget) {
        state.notifications.push({
          id: `noti_${item.id}`,
          item,
          seller,
          evalRes,
          timeText: "방금 전"
        });
      }
    });

    updateNotificationBadge();
    renderNotificationList();
  }

  function updateNotificationBadge() {
    els.notiBadge.textContent = state.notifications.length;
    els.notiBadge.style.display = state.notifications.length > 0 ? "flex" : "none";
  }

  function renderNotificationList() {
    els.notiList.innerHTML = "";
    if (state.notifications.length === 0) {
      els.notiList.innerHTML = `
        <div style="text-align:center; padding: 2rem 1rem; color:var(--text-dim); font-size:0.85rem;">
          현재 도착한 새로운 핀포인트 알림이 없습니다.
        </div>
      `;
      return;
    }

    state.notifications.forEach(noti => {
      const card = document.createElement("div");
      card.className = "noti-card-item";
      card.innerHTML = `
        <div class="noti-card-top">
          <span class="noti-store-name">🏪 ${noti.seller.name}</span>
          <span class="noti-prob-badge">성사율 ${noti.evalRes.matchProbability}%</span>
        </div>
        <div class="noti-item-title">${noti.item.title}</div>
        <div class="noti-reason">
          📍 ${noti.evalRes.distanceMeter}m 도보 직거래 • ${noti.evalRes.matchReason}
        </div>
      `;

      card.addEventListener("click", () => {
        els.notiDropdown.classList.remove("open");
        openDealModal({
          ...noti.item,
          matchInfo: noti.evalRes,
          dynamicPricing: state.engine.calculateDynamicPrice(noti.item.originalPrice, noti.item.deadlineHours),
          sellerStore: noti.seller
        });
      });

      els.notiList.appendChild(card);
    });
  }

  // =========================================================================
  // 4. 동적 가격 할인율 곡선 Canvas 렌더링
  // =========================================================================
  function drawDynamicPricingCurve() {
    const canvas = els.pricingCurveCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // 배경 그리드 라인
    ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
    ctx.lineWidth = 1;
    for (let x = 40; x < width; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 15);
      ctx.lineTo(x, height - 25);
      ctx.stroke();
    }
    for (let y = 20; y < height - 20; y += 30) {
      ctx.beginPath();
      ctx.moveTo(35, y);
      ctx.lineTo(width - 15, y);
      ctx.stroke();
    }

    // 축 텍스트
    ctx.fillStyle = "#64748b";
    ctx.font = "10px sans-serif";
    ctx.fillText("원가 100%", 2, 25);
    ctx.fillText("50%", 15, (height - 25) / 2 + 10);
    ctx.fillText("30%", 15, height - 28);
    ctx.fillText("마감 0h (폐기)", 35, height - 8);
    ctx.fillText("2h", width / 2 - 20, height - 8);
    ctx.fillText("6h 전 (초기)", width - 70, height - 8);

    // 비선형 동적 가격 곡선 그리기
    // X축: 0시간(왼쪽) ~ 6시간(오른쪽)
    // Y축: 30% (아래쪽) ~ 100% (위쪽)
    const paddingX = 45;
    const paddingY = 20;
    const plotW = width - paddingX - 20;
    const plotH = height - paddingY - 30;

    ctx.beginPath();
    for (let i = 0; i <= 100; i++) {
      const tRatio = i / 100; // 0 (마감) ~ 1 (6시간 전)
      const hours = tRatio * 6.0;
      // PriceRatio = 0.30 + 0.38 * (1 - e^(-0.45 * hours))
      const priceRatio = 0.30 + 0.38 * (1 - Math.exp(-0.45 * hours)); // 0.30 ~ 0.68

      const px = paddingX + tRatio * plotW;
      const py = height - 25 - (priceRatio * plotH);

      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }

    // 그라디언트 스트로크
    const grad = ctx.createLinearGradient(paddingX, 0, width, 0);
    grad.addColorStop(0, "#ef4444"); // 마감 임박 레드
    grad.addColorStop(0.4, "#f59e0b"); // 골든타임 옐로
    grad.addColorStop(1, "#10b981"); // 초기 그린

    ctx.strokeStyle = grad;
    ctx.lineWidth = 3;
    ctx.stroke();

    // 현재 추천 평균 포인트 (2.5시간 지점) 하이라이트 점
    const curHours = 2.5;
    const curTRatio = curHours / 6.0;
    const curPriceRatio = 0.30 + 0.38 * (1 - Math.exp(-0.45 * curHours));
    const curX = paddingX + curTRatio * plotW;
    const curY = height - 25 - (curPriceRatio * plotH);

    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(curX, curY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 2;
    ctx.stroke();

    // 툴팁 텍스트
    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 10px sans-serif";
    ctx.fillText("현재 동네 평균 (원가의 48% 처분)", curX - 60, curY - 10);
  }

  // =========================================================================
  // 5. 초지역 실시간 레이더 맵 Canvas 애니메이션
  // =========================================================================
  function openRadarModal(targetItem = null) {
    els.modalRadar.classList.add("open");
    els.modalRadar.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    startRadarAnimation(targetItem);
  }

  function startRadarAnimation(focusItem = null) {
    if (state.radarAnimId) cancelAnimationFrame(state.radarAnimId);

    const canvas = els.radarCanvas;
    const ctx = canvas.getContext("2d");
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const maxRadiusPx = Math.min(cx, cy) - 30;

    function renderRadar() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1) 동심원 (500m, 1000m, 1500m)
      const r500 = (500 / 1500) * maxRadiusPx;
      const r1000 = (1000 / 1500) * maxRadiusPx;
      const r1500 = maxRadiusPx;

      ctx.lineWidth = 1;

      // 500m (도보 5분 권역)
      ctx.strokeStyle = "rgba(16, 185, 129, 0.4)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(cx, cy, r500, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#10b981";
      ctx.font = "10px sans-serif";
      ctx.fillText("500m (도보 5분)", cx + r500 - 35, cy - 6);

      // 1000m
      ctx.strokeStyle = "rgba(245, 158, 11, 0.3)";
      ctx.beginPath();
      ctx.arc(cx, cy, r1000, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#f59e0b";
      ctx.fillText("1.0km", cx + r1000 - 25, cy - 6);

      // 1500m
      ctx.strokeStyle = "rgba(6, 182, 212, 0.3)";
      ctx.beginPath();
      ctx.arc(cx, cy, r1500, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#06b6d4";
      ctx.fillText("1.5km (최대)", cx + r1500 - 30, cy - 6);
      ctx.setLineDash([]);

      // 십자 기준선
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.beginPath();
      ctx.moveTo(cx, cy - maxRadiusPx);
      ctx.lineTo(cx, cy + maxRadiusPx);
      ctx.moveTo(cx - maxRadiusPx, cy);
      ctx.lineTo(cx + maxRadiusPx, cy);
      ctx.stroke();

      // 2) 회전하는 레이더 스캔 빔 (Sweep Beam)
      state.radarAngle += 0.025;
      const beamEndAngle = state.radarAngle;
      const beamStartAngle = beamEndAngle - 0.4;

      const beamGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxRadiusPx);
      beamGrad.addColorStop(0, "rgba(16, 185, 129, 0.35)");
      beamGrad.addColorStop(1, "rgba(16, 185, 129, 0.0)");

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, maxRadiusPx, beamStartAngle, beamEndAngle);
      ctx.closePath();
      ctx.fillStyle = beamGrad;
      ctx.fill();

      // 3) 참여 매장 노드 핀 렌더링
      state.stores.forEach(st => {
        const isCurrent = st.id === state.currentStore.id;
        const dist = state.engine.calculateDistance(state.currentStore.lat, state.currentStore.lng, st.lat, st.lng);
        const ratio = Math.min(1.0, dist / 1500);

        // 좌표 계산 (위도차/경도차를 캔버스 극좌표로 투영)
        const dLat = (st.lat - state.currentStore.lat) * 111000;
        const dLng = (st.lng - state.currentStore.lng) * 88000;
        const angle = Math.atan2(dLat, dLng);
        const radiusPx = isCurrent ? 0 : Math.max(25, ratio * maxRadiusPx);

        const nx = cx + radiusPx * Math.cos(angle);
        const ny = cy - radiusPx * Math.sin(angle); // Y축 반전

        if (isCurrent) {
          // 중심 매장 (파란색)
          ctx.fillStyle = "#3b82f6";
          ctx.beginPath();
          ctx.arc(nx, ny, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = "#93c5fd";
          ctx.font = "bold 11px sans-serif";
          ctx.fillText(`★ 내 매장: ${st.name}`, nx + 10, ny + 4);
        } else {
          const isTargetStore = focusItem && focusItem.storeId === st.id;

          if (isTargetStore) {
            // 직거래 대상 매장 연결선
            ctx.strokeStyle = "rgba(16, 185, 129, 0.8)";
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(nx, ny);
            ctx.stroke();
            ctx.setLineDash([]);
          }

          // 노드 원
          ctx.fillStyle = isTargetStore ? "#10b981" : "#64748b";
          ctx.beginPath();
          ctx.arc(nx, ny, isTargetStore ? 6 : 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = isTargetStore ? "#34d399" : "#94a3b8";
          ctx.font = isTargetStore ? "bold 11px sans-serif" : "10px sans-serif";
          ctx.fillText(`${st.name} (${dist}m)`, nx + 8, ny + 3);
        }
      });

      state.radarAnimId = requestAnimationFrame(renderRadar);
    }

    renderRadar();
  }

  function stopRadarAnimation() {
    if (state.radarAnimId) {
      cancelAnimationFrame(state.radarAnimId);
      state.radarAnimId = null;
    }
  }

  // =========================================================================
  // 6. AI 음성 간편 등록 로직
  // =========================================================================
  function applyVoiceSample(sample) {
    els.voiceRecognizedText.value = sample.text;
    parseAndDisplayVoiceText(sample.text);
  }

  function parseAndDisplayVoiceText(text) {
    if (!text || text.trim() === "") return;

    tempVoiceParsed = state.engine.parseVoiceInput(text);
    if (!tempVoiceParsed) return;

    els.resItemName.textContent = tempVoiceParsed.detectedIngredient;
    els.resItemCat.textContent = tempVoiceParsed.category;
    els.resItemQty.textContent = tempVoiceParsed.quantity;
    els.resItemPrice.textContent = `${tempVoiceParsed.dynamicPrice.salePrice.toLocaleString()}원 (${tempVoiceParsed.dynamicPrice.discountRate}% 할인)`;

    els.voiceExtractedPreview.style.display = "block";
    els.btnConfirmVoiceRegister.removeAttribute("disabled");
    playBeep(880, 0.1);
  }

  // Web Speech API 마이크 토글
  let recognition = null;
  let isRecording = false;

  function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      els.voiceStatusText.textContent = "브라우저 음성인식 미지원 환경입니다. 위 현장 시뮬레이션 버튼을 이용해 주세요.";
      return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = "ko-KR";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      isRecording = true;
      els.micAnimationBox.classList.add("recording");
      els.voiceStatusText.textContent = "듣고 있습니다... 말씀해 주세요 (예: '대파 5kg 남았어 2만원에 급처할게')";
      playBeep(440, 0.15);
    };

    recognition.onresult = (event) => {
      const speechText = event.results[0][0].transcript;
      els.voiceRecognizedText.value = speechText;
      parseAndDisplayVoiceText(speechText);
    };

    recognition.onerror = (event) => {
      console.warn("음성 인식 오류:", event.error);
      els.voiceStatusText.textContent = "음성 인식이 취소되었습니다. 프리셋을 선택하시거나 다시 마이크를 눌러주세요.";
      stopRecording();
    };

    recognition.onend = () => {
      stopRecording();
    };
  }

  function toggleSpeech() {
    if (!recognition) {
      initSpeechRecognition();
      if (!recognition) return;
    }

    if (isRecording) {
      recognition.stop();
      stopRecording();
    } else {
      try {
        recognition.start();
      } catch (err) {
        console.warn("Speech start error:", err);
      }
    }
  }

  function stopRecording() {
    isRecording = false;
    els.micAnimationBox.classList.remove("recording");
    els.voiceStatusText.textContent = "음성 분석이 완료되었습니다. 아래 등록 버튼을 눌러주세요.";
  }

  // 음성 매물 최종 등록
  function confirmVoiceRegistration() {
    if (!tempVoiceParsed) return;

    const newItem = {
      id: `item_custom_${Date.now()}`,
      storeId: state.currentStore.id,
      storeName: state.currentStore.name,
      title: tempVoiceParsed.title,
      category: tempVoiceParsed.category,
      subCategory: "AI 음성 등록 재료",
      state: "당일 1차 손질 완료 (신선 냉장)",
      quantity: tempVoiceParsed.quantity,
      originalPrice: tempVoiceParsed.originalPrice,
      unit: tempVoiceParsed.quantity,
      registeredAt: new Date().toISOString(),
      deadlineHours: tempVoiceParsed.deadlineHours,
      description: tempVoiceParsed.description,
      imageUrl: "https://images.unsplash.com/photo-1618164435735-413d3b066194?w=600&auto=format&fit=crop&q=80",
      storageTemp: "0~5℃ 신선냉장",
      expirationDate: "오늘 자정까지",
      tags: tempVoiceParsed.tags
    };

    // 데이터셋에 추가
    state.foodItems.unshift(newItem);
    state.engine.foodItems = state.foodItems;

    // 인근 타겟 매장 핀포인트 알림 발송 시뮬레이션
    const targets = state.engine.findPinpointTargetStores(newItem, state.currentStore);
    const topTargets = targets.filter(t => t.isPinpointTarget).slice(0, 3);

    playSuccessChord();
    closeAllModals();

    // 등록 성공 안내 및 알림 발송 토스트
    const targetNames = topTargets.map(t => t.buyerStore.name).join(", ");
    alert(`🎉 [AI 판매카드 등록 완료]\n\n품목: ${newItem.title}\n동적 판매가: ${tempVoiceParsed.dynamicPrice.salePrice.toLocaleString()}원 (${tempVoiceParsed.dynamicPrice.discountRate}% 할인)\n\n⚡ [AI 핀포인트 알림 즉시 발송]:\n반경 1.5km 내 최적 거래 점주 (${targetNames || "인근 매장 점주님들"})에게 핀포인트 푸시 알림이 발송되었습니다! 30분 내 픽업 연결 예정입니다.`);

    renderFeed();
  }

  // =========================================================================
  // 7. AI 사진 분석 등록 로직
  // =========================================================================
  function handleImageSelected(srcUrl) {
    els.visionPreviewImg.src = srcUrl;
    els.visionPreviewImg.style.display = "block";
    els.dropzonePlaceholder.style.display = "none";
    els.visionAnalysisBox.style.display = "block";
    els.visionStatusText.textContent = "Vision AI 색상 및 엣지 분광 분석 중...";
    els.visionResultDetails.style.display = "none";
    els.btnConfirmVisionRegister.setAttribute("disabled", "true");

    playBeep(550, 0.1);

    const tempImg = new Image();
    tempImg.crossOrigin = "anonymous";
    tempImg.src = srcUrl;
    tempImg.onload = () => {
      state.engine.analyzeImageUpload(tempImg).then(result => {
        tempVisionParsed = result;
        els.visionStatusText.textContent = "✅ 식재료 비전 분류 완료!";
        els.visionResultDetails.innerHTML = `
          <div style="font-size:0.85rem; line-height:1.6; margin-top:0.5rem;">
            <div><strong>분석 품목:</strong> ${result.name}</div>
            <div><strong>카테고리:</strong> ${result.category} (신뢰도 ${(result.confidence * 100).toFixed(1)}%)</div>
            <div><strong>예상 수량/원가:</strong> ${result.estimatedQuantity} / ${result.estimatedOriginalPrice.toLocaleString()}원</div>
            <div style="color:var(--accent-amber); font-weight:700;">
              <strong>AI 동적 할인가:</strong> ${result.dynamicPricing.salePrice.toLocaleString()}원 (${result.dynamicPricing.discountRate}% 즉시할인)
            </div>
            <div style="color:var(--text-dim); font-size:0.78rem; margin-top:0.3rem;">${result.analysisReport}</div>
          </div>
        `;
        els.visionResultDetails.style.display = "block";
        els.btnConfirmVisionRegister.removeAttribute("disabled");
        playSuccessChord();
      });
    };
  }

  function confirmVisionRegistration() {
    if (!tempVisionParsed) return;

    const newItem = {
      id: `item_vision_${Date.now()}`,
      storeId: state.currentStore.id,
      storeName: state.currentStore.name,
      title: `[Vision AI 자동식별] ${tempVisionParsed.name}`,
      category: tempVisionParsed.category,
      subCategory: "AI 비전 자동분석 재료",
      state: "전문 주방 1차 손질 완료 (진공/위생포장)",
      quantity: tempVisionParsed.estimatedQuantity,
      originalPrice: tempVisionParsed.estimatedOriginalPrice,
      unit: tempVisionParsed.estimatedQuantity,
      registeredAt: new Date().toISOString(),
      deadlineHours: tempVisionParsed.deadlineHours,
      description: `[비전 AI 이미지 분석으로 자동 등록된 식재료입니다]\n색상 분광 분석 신뢰도 ${(tempVisionParsed.confidence * 100).toFixed(1)}%로 분류되었으며, 당일 마감 전 인근 매장과 30분 내 직거래하기 위해 동적 할인가로 즉시 등록되었습니다.`,
      imageUrl: els.visionPreviewImg.src,
      storageTemp: tempVisionParsed.storageTemp,
      expirationDate: "오늘 영업 마감 전까지",
      tags: tempVisionParsed.tags
    };

    state.foodItems.unshift(newItem);
    state.engine.foodItems = state.foodItems;

    playSuccessChord();
    closeAllModals();

    alert(`📸 [사진 분석 판매카드 등록 완료]\n\n${newItem.title}이(가) 등록되었습니다.\n동네 사장님들에게 실시간 핀포인트 알림이 전달되었습니다!`);
    renderFeed();
  }

  // =========================================================================
  // 8. 30분 직거래 픽업 매칭 모달 & 카운트다운 타이머
  // =========================================================================
  function openDealModal(item) {
    state.activeDealItem = item;
    const pricing = item.dynamicPricing;
    const seller = item.sellerStore || state.stores.find(s => s.id === item.storeId) || state.stores[0];
    const matchInfo = item.matchInfo || state.engine.evaluateMatchingPair(item, seller, state.currentStore);

    const distMeter = matchInfo ? matchInfo.distanceMeter : 450;
    const walkMin = Math.max(3, Math.round(distMeter / 75));

    // CO2 저감량 및 폐기 절감액 계산
    const wasteCostSaved = Math.round(pricing.originalPrice * 0.25); // 폐기 비용 방어
    const carbonSavedKg = (Math.random() * 3.5 + 1.5).toFixed(1);

    els.dealVoucher.innerHTML = `
      <div class="voucher-row">
        <span style="color:var(--text-dim);">거래 식재료</span>
        <strong>${item.title}</strong>
      </div>
      <div class="voucher-row">
        <span style="color:var(--text-dim);">수량 / 규격</span>
        <span>${item.quantity} (${item.state})</span>
      </div>
      <div class="voucher-row">
        <span style="color:var(--text-dim);">판매 매장</span>
        <span><strong>${seller.name}</strong> (${seller.phone})</span>
      </div>
      <div class="voucher-row">
        <span style="color:var(--text-dim);">픽업 장소</span>
        <span>${seller.address} (도보 ${walkMin}분 • ${distMeter}m)</span>
      </div>
      <div class="voucher-row">
        <span style="color:var(--text-dim);">보관 상태</span>
        <span style="color:var(--accent-green-light);">${item.storageTemp}</span>
      </div>
      <div class="voucher-row">
        <span style="color:var(--text-dim);">정상 원가</span>
        <span style="text-decoration:line-through; color:var(--text-muted);">${pricing.originalPrice.toLocaleString()}원</span>
      </div>
      <div class="voucher-row total">
        <span style="color:var(--accent-amber);">30분 직거래 할인가</span>
        <span style="color:var(--accent-amber); font-size:1.2rem;">${pricing.salePrice.toLocaleString()}원 (${pricing.discountRate}% 할인)</span>
      </div>
      <div style="margin-top:0.75rem; padding-top:0.6rem; border-top:1px dashed rgba(255,255,255,0.1); font-size:0.78rem; color:var(--text-dim);">
        🌱 <strong>ESG 탄소·폐기물 절감:</strong> 점주 폐기비용 약 ${wasteCostSaved.toLocaleString()}원 절감 • 온실가스 ${carbonSavedKg}kg CO₂ 저감 효과
      </div>
    `;

    // 30분 카운트다운 타이머 시작
    startDealTimer();

    els.modalDeal.classList.add("open");
    els.modalDeal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    playSuccessChord();
  }

  function startDealTimer() {
    if (state.dealTimerId) clearInterval(state.dealTimerId);
    state.dealSecondsRemaining = 1800; // 30분

    function updateTimerDisplay() {
      const min = Math.floor(state.dealSecondsRemaining / 60);
      const sec = state.dealSecondsRemaining % 60;
      els.dealCountdown.textContent = `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;

      const progress = (state.dealSecondsRemaining / 1800) * 100;
      els.dealProgressBar.style.width = `${progress}%`;

      if (state.dealSecondsRemaining <= 0) {
        clearInterval(state.dealTimerId);
        els.dealCountdown.textContent = "00:00 (시간 만료)";
      } else {
        state.dealSecondsRemaining--;
      }
    }

    updateTimerDisplay();
    state.dealTimerId = setInterval(updateTimerDisplay, 1000);
  }

  // =========================================================================
  // 9. 이벤트 리스너 바인딩
  // =========================================================================
  function bindEvents() {
    // 매장 변경
    els.storeSelect.addEventListener("change", (e) => {
      state.currentStoreId = e.target.value;
      state.currentStore = state.stores.find(s => s.id === state.currentStoreId);
      generateInitialNotifications();
      renderFeed();
      playBeep(700, 0.08);
    });

    // 알림 벨 클릭 토글
    els.btnNotificationBell.addEventListener("click", (e) => {
      e.stopPropagation();
      els.notiDropdown.classList.toggle("open");
      playBeep(600, 0.08);
    });

    document.addEventListener("click", (e) => {
      if (!els.notiDropdown.contains(e.target) && e.target !== els.btnNotificationBell) {
        els.notiDropdown.classList.remove("open");
      }
    });

    // 반경 필터 칩
    els.radiusTabs.forEach(chip => {
      chip.addEventListener("click", () => {
        els.radiusTabs.forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        state.maxRadius = parseInt(chip.getAttribute("data-radius"), 10);
        renderFeed();
        playBeep(650, 0.08);
      });
    });

    // 카테고리 필터 칩
    els.categoryTabs.forEach(chip => {
      chip.addEventListener("click", () => {
        els.categoryTabs.forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        state.selectedCategory = chip.getAttribute("data-cat");
        renderFeed();
        playBeep(650, 0.08);
      });
    });

    // 정렬 셀렉터
    els.sortSelect.addEventListener("change", (e) => {
      state.sortBy = e.target.value;
      renderFeed();
    });

    // 모달 열기 버튼들
    els.btnVoiceModal.addEventListener("click", () => {
      els.modalVoice.classList.add("open");
      document.body.style.overflow = "hidden";
    });

    els.btnVisionModal.addEventListener("click", () => {
      els.modalVision.classList.add("open");
      document.body.style.overflow = "hidden";
    });

    els.btnRadarModal.addEventListener("click", () => {
      openRadarModal();
    });

    els.btnOpenAiDoc.addEventListener("click", () => {
      els.modalAiDoc.classList.add("open");
      document.body.style.overflow = "hidden";
    });

    // 모달 닫기 공통
    document.querySelectorAll("[data-close]").forEach(btn => {
      btn.addEventListener("click", () => {
        const modalId = btn.getAttribute("data-close");
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove("open");
        document.body.style.overflow = "";
        stopRadarAnimation();
      });
    });

    // 오버레이 클릭 시 닫기
    document.querySelectorAll(".modal-overlay").forEach(overlay => {
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
          overlay.classList.remove("open");
          document.body.style.overflow = "";
          stopRadarAnimation();
        }
      });
    });

    // 음성 인식 버튼
    els.btnMicStart.addEventListener("click", toggleSpeech);

    // 음성 텍스트 직접 입력 시 자동 파싱
    els.voiceRecognizedText.addEventListener("input", (e) => {
      parseAndDisplayVoiceText(e.target.value);
    });

    // 음성 최종 등록
    els.btnConfirmVoiceRegister.addEventListener("click", confirmVoiceRegistration);

    // 사진 드롭존 클릭
    els.visionDropzone.addEventListener("click", () => {
      els.visionFileInput.click();
    });

    els.visionFileInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = (re) => {
          handleImageSelected(re.target.result);
        };
        reader.readAsDataURL(e.target.files[0]);
      }
    });

    // 샘플 사진 버튼 클릭
    els.samplePhotoBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const src = btn.getAttribute("data-img");
        handleImageSelected(src);
      });
    });

    // 사진 최종 등록
    els.btnConfirmVisionRegister.addEventListener("click", confirmVisionRegistration);

    // 픽업 완료 버튼
    els.btnCompleteDeal.addEventListener("click", () => {
      if (state.dealTimerId) clearInterval(state.dealTimerId);
      playSuccessChord();
      alert("🎉 픽업 완료 확인!\n\n동네 식재료 직거래가 성공적으로 완료되었습니다.\n원가 절감과 음식물 쓰레기 감축에 동참해 주셔서 감사합니다!");
      closeAllModals();
    });

    // ESC 키로 모달 닫기
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeAllModals();
      }
    });
  }

  function closeAllModals() {
    document.querySelectorAll(".modal-overlay").forEach(m => m.classList.remove("open"));
    document.body.style.overflow = "";
    stopRadarAnimation();
  }

  // 앱 시동
  initApp();
});
