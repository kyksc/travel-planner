// 한국 행정구역 데이터
// 광역시(서울/부산/대구/인천/광주/대전/울산/세종/제주)는 하위 구역 없음
// 도(경기/강원/충북/충남/전북/전남/경북/경남)는 시·군 단위 선택

export const REGIONS = [
  { id: 'seoul', name: '서울', hasSubRegions: false },
  { id: 'busan', name: '부산', hasSubRegions: false },
  { id: 'daegu', name: '대구', hasSubRegions: false },
  { id: 'incheon', name: '인천', hasSubRegions: false },
  { id: 'gwangju', name: '광주', hasSubRegions: false },
  { id: 'daejeon', name: '대전', hasSubRegions: false },
  { id: 'ulsan', name: '울산', hasSubRegions: false },
  { id: 'sejong', name: '세종', hasSubRegions: false },
  { id: 'gyeonggi', name: '경기', hasSubRegions: true },
  { id: 'gangwon', name: '강원', hasSubRegions: true },
  { id: 'chungbuk', name: '충북', hasSubRegions: true },
  { id: 'chungnam', name: '충남', hasSubRegions: true },
  { id: 'jeonbuk', name: '전북', hasSubRegions: true },
  { id: 'jeonnam', name: '전남', hasSubRegions: true },
  { id: 'gyeongbuk', name: '경북', hasSubRegions: true },
  { id: 'gyeongnam', name: '경남', hasSubRegions: true },
  { id: 'jeju', name: '제주', hasSubRegions: false },
];

// 도별 시·군 목록
export const SUB_REGIONS = {
  gyeonggi: [
    '가평군', '고양시', '과천시', '광명시', '광주시', '구리시', '군포시',
    '김포시', '남양주시', '동두천시', '부천시', '성남시', '수원시', '시흥시',
    '안산시', '안성시', '안양시', '양주시', '양평군', '여주시', '연천군',
    '오산시', '용인시', '의왕시', '의정부시', '이천시', '파주시', '평택시',
    '포천시', '하남시', '화성시'
  ],
  gangwon: [
    '강릉시', '고성군', '동해시', '삼척시', '속초시', '양구군', '양양군',
    '영월군', '원주시', '인제군', '정선군', '철원군', '춘천시', '태백시',
    '평창군', '홍천군', '화천군', '횡성군'
  ],
  chungbuk: [
    '괴산군', '단양군', '보은군', '영동군', '옥천군', '음성군', '제천시',
    '증평군', '진천군', '청주시', '충주시'
  ],
  chungnam: [
    '계룡시', '공주시', '금산군', '논산시', '당진시', '보령시', '부여군',
    '서산시', '서천군', '아산시', '예산군', '천안시', '청양군', '태안군',
    '홍성군'
  ],
  jeonbuk: [
    '고창군', '군산시', '김제시', '남원시', '무주군', '부안군', '순창군',
    '完주군', '익산시', '임실군', '장수군', '전주시', '정읍시', '진안군'
  ].map(r => r === '完주군' ? '완주군' : r),
  jeonnam: [
    '강진군', '고흥군', '곡성군', '광양시', '구례군', '나주시', '담양군',
    '목포시', '무안군', '보성군', '순천시', '신안군', '여수시', '영광군',
    '영암군', '완도군', '장성군', '장흥군', '진도군', '함평군', '해남군',
    '화순군'
  ],
  gyeongbuk: [
    '경산시', '경주시', '고령군', '구미시', '군위군', '김천시', '문경시',
    '봉화군', '상주시', '성주군', '안동시', '영덕군', '영양군', '영주시',
    '영천시', '예천군', '울릉군', '울진군', '의성군', '청도군', '청송군',
    '칠곡군', '포항시'
  ],
  gyeongnam: [
    '거제시', '거창군', '고성군', '김해시', '남해군', '밀양시', '사천시',
    '산청군', '양산시', '의령군', '진주시', '창녕군', '창원시', '통영시',
    '하동군', '함안군', '함양군', '합천군'
  ]
};
