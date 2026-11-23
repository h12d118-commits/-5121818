/**
 * [2026 인공지능 기초] FreshShare AI - 초지역(Hyper-local) B2B 식재료 공유 마켓 데이터셋
 * 학생: 성신여자고등학교 20329 허가은
 * 
 * - 반경: 서울 성북구 동소문동/삼선동/동선동 골목 상권 (반경 500m ~ 1.5km)
 * - 대상: 동네 외식업 소상공인 (양식, 일식, 중식, 한식, 브런치/카페, 샐러드/포케 등)
 */

// 1. 참여 매장 마스터 데이터 (위도/경도 기반 거리 계산용)
window.STORE_DATABASE = [
  {
    id: "store_1",
    name: "비스트로 보노 (이탈리안)",
    category: "양식",
    owner: "김보노 셰프",
    address: "성북구 동소문로20길 14",
    lat: 37.5912,
    lng: 127.0168,
    phone: "02-921-1101",
    tagline: "자가제면 생면 파스타 & 화덕 피자 전문점",
    neededIngredients: ["생연어", "아보카도", "대파", "양송이버섯", "표고버섯", "리코타치즈"],
    rating: 4.9,
    dealCount: 38
  },
  {
    id: "store_2",
    name: "하루 스시앤롤 (일식당)",
    category: "일식",
    owner: "박하루 대표",
    address: "성북구 동소문로22길 8",
    lat: 37.5921,
    lng: 127.0182,
    phone: "02-923-4588",
    tagline: "당일 직송 숙성 사시미와 정통 초밥",
    neededIngredients: ["양파", "레몬", "루꼴라", "방울토마토", "쪽파", "생강"],
    rating: 4.8,
    dealCount: 45
  },
  {
    id: "store_3",
    name: "카페 앤 브런치 숲",
    category: "브런치/카페",
    owner: "이지은 대표",
    address: "성북구 삼선교로10길 21",
    lat: 37.5895,
    lng: 127.0145,
    phone: "02-744-8890",
    tagline: "유기농 통밀 샌드위치 & 핸드드립 커피",
    neededIngredients: ["생모짜렐라치즈", "바질", "루꼴라", "방울토마토", "아보카도", "생크림"],
    rating: 4.95,
    dealCount: 52
  },
  {
    id: "store_4",
    name: "그린데이 포케앤샐러드",
    category: "샐러드/포케",
    owner: "최그린 실장",
    address: "성북구 보문로34길 19",
    lat: 37.5905,
    lng: 127.0201,
    phone: "02-928-3321",
    tagline: "신선한 슈퍼푸드와 하와이안 포케볼",
    neededIngredients: ["생연어", "아보카도", "적양파", "어린잎채소", "오이", "레몬"],
    rating: 4.9,
    dealCount: 61
  },
  {
    id: "store_5",
    name: "중화요리 만리향",
    category: "중식",
    owner: "왕만리 조리장",
    address: "성북구 아리랑로4길 11",
    lat: 37.5938,
    lng: 127.0152,
    phone: "02-925-8822",
    tagline: "불맛 가득 정통 수타 짬뽕과 탕수육",
    neededIngredients: ["대파", "양파", "표고버섯", "다진마늘", "청경채", "오징어"],
    rating: 4.7,
    dealCount: 29
  },
  {
    id: "store_6",
    name: "성신가마솥 백반당",
    category: "한식",
    owner: "정성신 여사",
    address: "성북구 동선동1가 45-2",
    lat: 37.5919,
    lng: 127.0175,
    phone: "02-922-9904",
    tagline: "매일 바뀌는 12첩 집밥 가마솥 정식",
    neededIngredients: ["대파", "손질양파", "깐마늘", "표고버섯", "애호박", "소고기우둔살"],
    rating: 4.85,
    dealCount: 74
  },
  {
    id: "store_7",
    name: "버거앤프라이즈 락스버거",
    category: "수제버거",
    owner: "강로건 대표",
    address: "성북구 동소문로20다길 3",
    lat: 37.5928,
    lng: 127.0163,
    phone: "02-927-7750",
    tagline: "100% 소고기 수제 패티와 브리오슈 번",
    neededIngredients: ["체다치즈", "토마토", "양파", "로메인상추", "베이컨"],
    rating: 4.88,
    dealCount: 31
  },
  {
    id: "store_8",
    name: "도쿄 키친 심야식당",
    category: "이자카야/퓨전",
    owner: "윤도겸 셰프",
    address: "성북구 삼선교로16길 7",
    lat: 37.5882,
    lng: 127.0138,
    phone: "02-766-3199",
    tagline: "퇴근길 위로가 되는 꼬치구이와 나베",
    neededIngredients: ["생연어", "표고버섯", "대파", "숙주", "청경채", "우삼겹"],
    rating: 4.92,
    dealCount: 44
  }
];

// 2. 식재료 카테고리 간 상호 연관성 매트릭스 (AI 지식그래프 / 크로스 업종 호환성)
// 양식 재료가 브런치나 샐러드, 일식 재료가 포케나 이자카야와 어떻게 상호 융합될 수 있는지 수치화
window.CATEGORY_COMPATIBILITY = {
  "채소/손질채소": { "한식": 0.95, "중식": 0.95, "양식": 0.85, "일식": 0.80, "브런치/카페": 0.85, "샐러드/포케": 0.90, "수제버거": 0.85 },
  "해산물/어패류": { "일식": 1.0, "샐러드/포케": 0.95, "양식": 0.85, "이자카야/퓨전": 0.95, "중식": 0.75, "한식": 0.70, "브런치/카페": 0.50 },
  "유제품/치즈": { "양식": 1.0, "브런치/카페": 0.98, "수제버거": 0.90, "샐러드/포케": 0.85, "일식": 0.30, "한식": 0.35, "중식": 0.20 },
  "육류/손질정육": { "수제버거": 0.95, "한식": 0.95, "중식": 0.90, "양식": 0.88, "이자카야/퓨전": 0.90, "브런치/카페": 0.65, "샐러드/포케": 0.60 },
  "허브/향신료": { "양식": 1.0, "브런치/카페": 0.92, "샐러드/포케": 0.85, "일식": 0.60, "중식": 0.50, "한식": 0.40, "수제버거": 0.55 },
  "과일/가니쉬": { "브런치/카페": 1.0, "샐러드/포케": 0.95, "양식": 0.75, "일식": 0.70, "이자카야/퓨전": 0.65, "수제버거": 0.40, "한식": 0.30 }
};

// 3. 현재 실시간 등록된 신선 식재료 매물 데이터 (당일 남은 조리 전 1차 재료 & 손질 재료)
// 각 매물은 남은 마감 시간(hoursLeft)에 따라 AI 동적 할인율이 실시간 계산됩니다.
window.INITIAL_FOOD_ITEMS = [
  {
    id: "item_1",
    storeId: "store_1",
    storeName: "비스트로 보노 (이탈리안)",
    title: "당일 항공직송 최고급 생모짜렐라 & 부라타 치즈",
    category: "유제품/치즈",
    subCategory: "이탈리안 냉장 치즈",
    state: "미개봉 완제품 (냉장 보관)",
    quantity: "3.2kg (약 16개입)",
    originalPrice: 48000,
    unit: "3.2kg",
    registeredAt: "2026-11-20T11:30:00",
    deadlineHours: 3.5, // 3시간 30분 후 마감 (저녁 피크 전 직거래)
    description: "오늘 런치 코스용으로 들어온 특A급 이탈리아산 생모짜렐라입니다. 오늘 저녁 예약 변경으로 1박스가 그대로 남아 당일 사용하실 인근 브런치 카페나 수제버거집 점주님께 급처분합니다. 10분 내 픽업 가능합니다.",
    imageUrl: "https://images.unsplash.com/photo-1592417817098-8f3d6910985b?w=600&auto=format&fit=crop&q=80",
    storageTemp: "0~4℃ 냉장보관",
    expirationDate: "오늘 자정(24:00)까지 최상태 유지",
    tags: ["생모짜렐라", "부라타치즈", "브런치추천", "카프레제", "당일마감"]
  },
  {
    id: "item_2",
    storeId: "store_2",
    storeName: "하루 스시앤롤 (일식당)",
    title: "새벽 노량진 직송 프리미엄 슈페리어 생연어 필렛",
    category: "해산물/어패류",
    subCategory: "횟감용 손질 생선",
    state: "전문 셰프 1차 오로시 완료 (진공포장)",
    quantity: "2.8kg (가시·껍질 완벽 제거)",
    originalPrice: 72000,
    unit: "2.8kg",
    registeredAt: "2026-11-20T11:45:00",
    deadlineHours: 2.0, // 2시간 후 마감!
    description: "새벽 경매로 받은 노르웨이산 슈페리어급 생연어입니다. 점심 영업 후 횟감용 필렛 3덩이가 깔끔히 손질되어 진공포장 냉장 중입니다. 포케 전문점, 샐러드 매장, 혹은 양식당 연어스테이크용으로 즉시 투입 가능합니다.",
    imageUrl: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&auto=format&fit=crop&q=80",
    storageTemp: "-1~2℃ 빙온보관",
    expirationDate: "오늘 16:00 이전 수령 권장 (횟감 기준)",
    tags: ["생연어", "슈페리어연어", "손질완료", "포케전문점강추", "초시급"]
  },
  {
    id: "item_3",
    storeId: "store_5",
    storeName: "중화요리 만리향",
    title: "국내산 햇흙대파 세척 및 1차 절단 손질분",
    category: "채소/손질채소",
    subCategory: "주방 전처리 채소",
    state: "깨끗이 세척 후 파채·탕파용 2분할 (위생박스)",
    quantity: "8.5kg (대용량)",
    originalPrice: 28000,
    unit: "8.5kg",
    registeredAt: "2026-11-20T10:15:00",
    deadlineHours: 4.5,
    description: "가락시장에서 박스채로 떼와서 오늘 오전 위생실에서 깨끗하게 손질해 둔 국내산 특품 대파입니다. 국물이나 탕, 찌개, 볶음 요리 하시는 한식 백반집이나 샤브샤브집 사장님께서 가져가시면 주방 노동력 최소 1시간 이상 절약됩니다.",
    imageUrl: "https://images.unsplash.com/photo-1618164435735-413d3b066194?w=600&auto=format&fit=crop&q=80",
    storageTemp: "냉장보관",
    expirationDate: "오늘 영업 종료 전까지",
    tags: ["손질대파", "채소급처", "한식백반", "주방인건비절감", "국산채소"]
  },
  {
    id: "item_4",
    storeId: "store_3",
    storeName: "카페 앤 브런치 숲",
    title: "유기농 스위트 생바질 & 와일드 루꼴라 믹스",
    category: "허브/향신료",
    subCategory: "특수채소 및 허브",
    state: "산지직송 무농약 수경재배 (숨쉬는 채소팩)",
    quantity: "1.2kg (약 6팩)",
    originalPrice: 24000,
    unit: "1.2kg",
    registeredAt: "2026-11-20T12:00:00",
    deadlineHours: 1.5, // 1.5시간 마감임박!!
    description: "오늘 아침 스마트팜에서 도착한 향이 극상인 생바질과 루꼴라입니다. 바질페스토용, 마르게리따 피자용, 파스타 가니쉬로 최고입니다. 파스타집이나 피자 전문점 셰프님께서 쓰시면 최고의 풍미를 냅니다.",
    imageUrl: "https://images.unsplash.com/photo-1608686207856-001b95cf60ca?w=600&auto=format&fit=crop&q=80",
    storageTemp: "5~8℃ 신선보관",
    expirationDate: "오늘 15:00까지",
    tags: ["생바질", "루꼴라", "파스타용", "화덕피자", "초특가임박"]
  },
  {
    id: "item_5",
    storeId: "store_7",
    storeName: "버거앤프라이즈 락스버거",
    title: "대용량 손질 적양파 & 스위트 샬롯 슬라이스",
    category: "채소/손질채소",
    subCategory: "전처리 슬라이스 채소",
    state: "일정 두께 링 슬라이스 완료 (진공용기 4통)",
    quantity: "5.0kg",
    originalPrice: 19000,
    unit: "5.0kg",
    registeredAt: "2026-11-20T11:00:00",
    deadlineHours: 5.0,
    description: "버거 토핑용으로 아침에 균일하게 슬라이스해 둔 신선한 적양파와 샬롯입니다. 매운기를 찬물에 빼두어 아삭하고 달콤합니다. 샌드위치 매장, 샐러드집, 포케집에서 바로 사용하시기 딱 좋습니다.",
    imageUrl: "https://images.unsplash.com/photo-1580201092675-a0a6a6cafbb1?w=600&auto=format&fit=crop&q=80",
    storageTemp: "냉장밀폐",
    expirationDate: "오늘 자정까지",
    tags: ["적양파", "슬라이스양파", "샐러드용", "전처리완료"]
  },
  {
    id: "item_6",
    storeId: "store_6",
    storeName: "성신가마솥 백반당",
    title: "국내산 1등급 한우 양지·사태 손질 정육 (국거리/스튜용)",
    category: "육류/손질정육",
    subCategory: "1차 손질 소고기",
    state: "핏물 제거 및 깍둑썰기 손질 (진공포장)",
    quantity: "4.5kg",
    originalPrice: 95000,
    unit: "4.5kg",
    registeredAt: "2026-11-20T09:30:00",
    deadlineHours: 2.8,
    description: "오늘 가마솥 소고기무국 끓이고 남은 한우 1등급 정육입니다. 마장동 축산물시장에서 떼온 진짜 좋은 고기입니다. 인근 파스타집 비프 라구소스나 일식당 규동, 이자카야 스키야키, 쌀국수 육수용으로 넘기면 최고입니다.",
    imageUrl: "https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=600&auto=format&fit=crop&q=80",
    storageTemp: "-1~3℃ 냉장보관",
    expirationDate: "오늘 저녁 영업 전까지",
    tags: ["한우소고기", "라구소스추천", "국거리손질", "초특가", "마장동직송"]
  },
  {
    id: "item_7",
    storeId: "store_8",
    storeName: "도쿄 키친 심야식당",
    title: "강원도 평창산 생 표고버섯 & 느타리버섯 모둠",
    category: "채소/손질채소",
    subCategory: "특품 버섯류",
    state: "밑동 손질 완료 특A급 버섯 2상자",
    quantity: "4.0kg",
    originalPrice: 32000,
    unit: "4.0kg",
    registeredAt: "2026-11-20T11:10:00",
    deadlineHours: 4.0,
    description: "나베 요리용으로 산지에서 직송받은 알이 굵고 향이 진한 생 표고버섯입니다. 중식당 짬뽕/유산슬 재료나 양식당 버섯 크림 리조또, 한식 찌개용으로 최고의 가치를 냅니다.",
    imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80",
    storageTemp: "냉장보관",
    expirationDate: "오늘 22:00까지",
    tags: ["생표고버섯", "버섯리조또", "중식탕추천", "손질완료"]
  },
  {
    id: "item_8",
    storeId: "store_4",
    storeName: "그린데이 포케앤샐러드",
    title: "후숙 완벽 멕시코산 프리미엄 아보카도 (특대과)",
    category: "과일/가니쉬",
    subCategory: "후숙 완료 즉시사용 식재료",
    state: "즉시 썰어 쓸 수 있는 최적 후숙 상태 (특대과 20과)",
    quantity: "20개 (약 4.2kg)",
    originalPrice: 42000,
    unit: "20개",
    registeredAt: "2026-11-20T10:40:00",
    deadlineHours: 3.0,
    description: "오늘 당장 썰었을 때 가장 크리미하고 맛있는 완벽 후숙 아보카도입니다. 오늘 안 쓰면 과후숙되므로 인근 브런치 카페 아보카도 토스트나 버거집 아보카도 버거, 멕시칸 타코집에 원가 이하 급처합니다.",
    imageUrl: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=600&auto=format&fit=crop&q=80",
    storageTemp: "상온/냉장",
    expirationDate: "오늘 영업 마감 전 즉시 사용 추천",
    tags: ["완벽후숙", "아보카도", "브런치강추", "수제버거", "당일소진"]
  }
];

// 4. 시뮬레이션용 음성/사진 간편 등록 프리셋
window.PRESET_VOICE_SAMPLES = [
  {
    label: "양식 셰프 긴급 음성 등록",
    text: "오늘 점심 파스타 쓰고 남은 깐마늘이랑 페페론치노 3킬로그램 남았어요 유통기한 내일까지고 정상가 이만사천원인데 만원에 인근 한식집이나 중식당에 급처할게요",
    parsed: {
      title: "주방 1차 손질 통마늘 & 건페페론치노 믹스",
      category: "채소/손질채소",
      quantity: "3.0kg",
      originalPrice: 24000,
      deadlineHours: 3.0,
      storageTemp: "냉장보관",
      targetCategory: "한식, 중식"
    }
  },
  {
    label: "일식당 사장님 사진/음성 등록",
    text: "방금 손질 마친 횟감용 완도산 대광어 필렛 2킬로 있습니다 오늘 저녁 8시 전까지 포케집이나 이자카야 사장님 픽업하시면 40퍼센트 할인해 드립니다 원가 5만원입니다",
    parsed: {
      title: "완도산 대광어 횟감 필렛 (1차 탈피 및 가시제거 완료)",
      category: "해산물/어패류",
      quantity: "2.0kg",
      originalPrice: 50000,
      deadlineHours: 2.5,
      storageTemp: "0~2℃ 빙온냉장",
      targetCategory: "샐러드/포케, 이자카야/퓨전"
    }
  },
  {
    label: "브런치 카페 매니저 등록",
    text: "오늘 구운 유기농 샤워도우 브레드 10덩이랑 프랑스 고메 버터 1킬로 남았어요 밤 9시까지 폐기 전에 파스타집이나 와인바 점주님 삼만원짜리 만이천원에 가져가세요",
    parsed: {
      title: "당일 오븐 베이킹 천연발효 샤워도우 & 프랑스산 고메버터",
      category: "유제품/치즈",
      quantity: "10덩이 + 1.0kg",
      originalPrice: 30000,
      deadlineHours: 4.0,
      storageTemp: "상온/냉장",
      targetCategory: "양식, 이자카야/퓨전"
    }
  }
];
