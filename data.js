/* ==========================================================================
   [DATA STORAGE] Today Reflection 12대 정예 신학 내러티브 마스터 풀
   - 프레임워크: [역사적 딜레마] -> [신학자의 선언] -> [역사적 배경] -> [사역적 질문]
   ========================================================================== */

const masterTheologyNarratives = [
    {
        era: "초대 교부 시대 (Patristic Era)",
        author: "터툴리안 (Tertullian, c. 160–225)",
        work: "『이단자들에 대한 규정』",
        question: "로마라는 거대한 다원주의 제국 문화 속에서, 교회는 독자적 복음의 순수성을 지킬 것인가, 세상 철학과 타협할 것인가?",
        declaration: "“아테네가 예루살렘과 무슨 상관이 있으며, 아카데미가 교회와 무슨 상관이 있는가? 우리의 가르침은 솔로몬의 주랑에서 온 것이지 플라톤의 학원에서 온 것이 아니다.”",
        history: "당시 헬라 철학자들과 영지주의자들은 기독교를 단지 '플라톤 철학의 한 분파'로 희석시켜 로마 사회에 타협적으로 안착시키려 했습니다. 터툴리안의 일갈은 학문을 멸시한 것이 아니라, 복음의 십자가 사건이 세속 지적 프레임에 흡수되어 무력화되는 것을 막기 위한 신앙적 저항이었습니다.",
        contemporary: "알고리즘과 세속 자본주의 문화가 청년들의 세계관을 지배할 때, 우리는 복음의 '거룩한 낯섦'을 선포하고 있는가, 아니면 세상에 어필하기 위해 복음을 지나치게 길들였는가?"
    },
    {
        era: "고대 교부 성화론 (Patristic Theology)",
        author: "아우구스티누스 (Aurelius Augustinus, 354–430)",
        work: "『고백록 (Confessiones)』",
        question: "끝없는 욕망과 성취 속에서도 채워지지 않는 인간 영혼의 근원적 갈증과 불안은 어디서 비롯되는가?",
        declaration: "“주여, 주님께서는 우리를 주님을 향해 살도록 지으셨기에, 우리의 마음이 주님 안에서 안식을 얻기까지는 결코 참된 쉼을 얻을 수 없나이다.”",
        history: "로마 제국의 쇠퇴와 쾌락주의, 마니교의 이원론 속에서 방황하던 아우구스티누스는 인간이 피조물을 궁극적 안식처로 삼을 때 영혼의 분열과 불안이 시작됨을 절절히 고백했습니다.",
        contemporary: "‘도파민 중독’과 ‘인정 욕구’에 지쳐 번아웃을 겪는 현대 청년들에게, 우리는 일시적 힐링이 아닌 ‘창조주 하나님 안에서의 궁극적 쉼과 질서 잡힌 사랑(Ordo Amoris)’을 제시하고 있는가?"
    },
    {
        era: "초대 정통 기독론 (Patristic Christology)",
        author: "아타나시우스 (Athanasius of Alexandria, c. 296–373)",
        work: "『말씀의 성육신에 관하여』",
        question: "예수 그리스도는 단지 도덕적 모범이자 뛰어난 피조물인가, 아니면 참 하나님이신가?",
        declaration: "“그리스도께서 친히 인간이 되신 것은, 우리로 하여금 하나님의 신성한 성품에 참예하는 자가 되게 하려 하심이었다. 피조물은 피조물을 온전히 구원할 수 없다.”",
        history: "그리스도를 ‘가장 뛰어난 피조물’로 격하시키려 했던 아리우스주의에 맞서, 아타나시우스는 5번의 유배 생활을 견디며 삼위일체와 참된 성육신 신앙을 목숨 걸고 수호했습니다.",
        contemporary: "‘선한 도덕 교사 예수’ 혹은 ‘내 소원을 들어주는 조력자 예수’로 축소된 세속화된 신앙관 속에서, 우리는 우주를 창조하시고 육신을 입으신 ‘참 하나님 그리스도’의 영광을 선포하는가?"
    },
    {
        era: "중세 스콜라 신앙론 (Medieval Scholasticism)",
        author: "안셀무스 (Anselm of Canterbury, 1033–1109)",
        work: "『프로스로기온 (Proslogion)』",
        question: "신앙과 인간의 이성은 서로 배척하는 적대적 관계인가, 아니면 진리를 향해 함께 나아가는 동반자인가?",
        declaration: "“나는 이해하기 위해 믿는 것이지, 믿기 위해 이해하려 하지 않는다. 믿지 않는다면 결코 이해할 수 없기 때문이다 (Fides Quaerens Intellectum).”",
        history: "안셀무스는 신앙이 맹목적인 반지성주의가 아니라, 살아계신 하나님을 인격적으로 신뢰할 때 비로소 우주와 인간 존재에 대한 참된 지적 통찰과 이해가 열린다고 논증했습니다.",
        contemporary: "회의주의와 과학만능주의 속에서 신앙을 주저하는 세대에게, 우리는 덮어놓고 믿으라는 강요가 아니라 ‘믿음으로 시작하여 세상과 삶을 가장 명쾌하게 해석해내는 지성적 신앙’의 길을 보여주고 있는가?"
    },
    {
        era: "중세 수도원 영성 (Medieval Monasticism)",
        author: "클레르보의 베르나르 (Bernard of Clairvaux, 1090–1153)",
        work: "『하나님을 사랑하는 것에 관하여』",
        question: "의무감과 두려움에 사로잡힌 종교적 율법주의를 넘어, 인간은 어떻게 참된 영적 자유에 도달할 수 있는가?",
        declaration: "“하나님을 사랑해야 하는 이유는 하나님 그분 자신이시며, 그분을 사랑하는 분량은 한계 없이 끝없이 사랑하는 것이다.”",
        history: "제도화되고 세속화된 중세 교회의 권력 다툼 속에서, 베르나르는 그리스도와의 깊은 사랑의 연합과 십자가 묵상을 통해 영혼의 순결한 생명력을 회복하고자 했습니다.",
        contemporary: "사역의 성과와 과업 중심의 일상에 매몰되어 영적 메마름을 느끼는 목회자와 사역자들에게, 우리는 ‘사역의 열심 이전에 그리스도를 깊이 사랑하는 첫사랑의 자리’를 회복하고 있는가?"
    },
    {
        era: "종교개혁 십자가 신학 (Reformation Era)",
        author: "마르틴 루터 (Martin Luther, 1483–1546)",
        work: "『하이델베르크 논제』",
        question: "인간은 자신의 선행과 종교적 열심으로 죽음과 심판의 공포를 이겨낼 수 있는가? 참된 평안의 근거는 어디에 있는가?",
        declaration: "“영광의 신학자는 악을 선이라 부르고 선을 악이라 부른다. 그러나 십자가의 신학자는 사물을 있는 그대로 부른다. 참된 하나님은 번영의 정상에서가 아니라 십자가의 수치와 고난 속에서만 발견된다.”",
        history: "당시 로마 가톨릭 스콜라 신학은 인간의 이성과 업적을 쌓아 하나님께 도달할 수 있다는 '영광의 신학'을 가르쳤습니다. 루터는 인간의 의가 완전히 파산 선고를 받는 십자가 밑에서만 값없는 은혜가 시작된다고 선언했습니다.",
        contemporary: "자기계발과 '갓생' 강박에 짓눌려 끝없이 자신을 증명해야 하는 번아웃 세대 청년들에게, 우리는 또 다른 종교적 과업을 얹어주고 있는가, 아니면 십자가의 완전한 쉼을 선포하는가?"
    },
    {
        era: "종교개혁 개혁주의 (Reformed Classic)",
        author: "장 칼뱅 (John Calvin, 1509–1564)",
        work: "『기독교 강요 (Institutio Christianae Religionis)』",
        question: "인간은 어떻게 진정한 자기 자신을 알 수 있으며, 삶의 모든 영역에서 하나님의 주권을 어떻게 인정해야 하는가?",
        declaration: "“우리가 소유한 참되고 건전한 지혜의 총체는 두 부분으로 구성된다. 곧 하나님을 아는 지식과 우리 자신을 아는 지식이다. 사람은 하나님의 얼굴을 바라보기 전에는 결코 자신을 올바르게 알 수 없다.”",
        history: "칼뱅은 교회의 울타리를 넘어 정치, 경제, 문화 등 삶의 모든 일상이 하나님의 영광(Soli Deo Gloria)을 드러내는 거룩한 무대임을 선포하며 도시 제네바를 변화시켰습니다.",
        contemporary: "신앙을 단지 ‘주일 교회 안의 활동’으로 축소해버린 청년들에게, 우리는 그들의 월요일 일터와 전공 현장이 하나님 나라를 경작하는 ‘거룩한 소명의 장소’임을 일깨워주고 있는가?"
    },
    {
        era: "청교도 성화 신학 (Puritan Classic)",
        author: "존 오웬 (John Owen, 1616–1683)",
        work: "『신자 안의 죄 죽이기 (Mortification of Sin)』",
        question: "칭의를 얻은 신자는 어떻게 일상 속에서 여전히 끈질기게 역사하는 죄의 잔재와 싸워 승리할 수 있는가?",
        declaration: "“죄를 죽이라. 그렇지 않으면 죄가 당신을 죽일 것이다. 은혜는 죄를 가볍게 여기는 핑계가 아니라, 성령 안에서 죄의 뿌리를 뽑아내는 능력이다.”",
        history: "존 오웬은 사람의 도덕적 결단이나 율법적 억압이 아니라, 성령의 조명하심 속에서 내면의 은밀한 동기를 직면하고 복음의 능력으로 죄를 다루는 실질적인 성화의 원리를 제시했습니다.",
        contemporary: "습관적인 영적 무기력과 죄책감에 갇힌 청년들에게, 우리는 단순한 감정적 결단이 아닌 ‘성령 안에서 복음의 은혜로 죄를 다루는 구체적인 영적 원리’를 가르치고 있는가?"
    },
    {
        era: "대각성 부흥 신학 (Great Awakening)",
        author: "조나단 에드워즈 (Jonathan Edwards, 1703–1758)",
        work: "『신앙 감정론 (Religious Affections)』",
        question: "감정적 열광과 맹목적 흥분이 난무하는 영적 부흥의 시대에, 무엇이 성령의 참된 열매인가?",
        declaration: "“참된 신앙의 대부분은 거룩한 정서(Affections)에 있다. 하나님을 향한 참된 사랑은 그분의 성품의 탁월함 자체를 기뻐하는 것이지, 그분이 내게 주시는 유익 때문만이 아니다.”",
        history: "미국 1차 대각성 운동의 한복판에서, 에드워즈는 일시적인 감정적 흥분과 성령이 주시는 참된 영혼의 성향 변화를 성경적으로 엄밀히 분별해 냈습니다.",
        contemporary: "화려한 찬양과 감정적 카타르시스에 익숙한 청년 공동체 안에서, 우리는 일시적 감흥을 넘어 ‘하나님의 거룩하심을 진심으로 사모하고 삶을 바꾸는 참된 정서’를 길러내고 있는가?"
    },
    {
        era: "근대 저항 & 제자도 (Modern Resistance)",
        author: "디트리히 본회퍼 (Dietrich Bonhoeffer, 1906–1945)",
        work: "『나를 따르라 (The Cost of Discipleship)』",
        question: "국가 이데올로기와 세속 권력이 교회를 집어삼킬 때, 그리스도인은 순응할 것인가, 십자가를 지고 저항할 것인가?",
        declaration: "“값싼 은혜는 교회의 치명적인 원수다. 회개 없는 용서, 공동체적 규율 없는 세례, 십자가 없는 제자도다. 그리스도께서 사람을 부르실 때, 그분은 와서 죽으라고 명하신다.”",
        history: "독일 교회의 대다수가 히틀러 정권에 굴복할 때, 본회퍼는 타협 없는 고백교회를 지키고 불의에 저항하며 39세의 나이에 순교했습니다.",
        contemporary: "우리의 사역은 청년들에게 삶의 위로와 감정적 힐링만을 제공하는 '값싼 은혜'의 소비처인가, 아니면 세상의 주류 가치관을 거슬러 대가를 치르는 '참된 제자도'의 훈련장인가?"
    },
    {
        era: "20세기 문화 변증 (Modern Apologetics)",
        author: "C.S. 루이스 (C.S. Lewis, 1898–1963)",
        work: "『순전한 기독교 (Mere Christianity)』",
        question: "도덕적 상대주의와 실증주의가 팽배한 시대에, 그리스도인은 세속 지성인들에게 복음을 어떻게 설명할 것인가?",
        declaration: "“만일 내 안에 이 세상의 어떤 것으로도 만족시킬 수 없는 갈망이 존재한다면, 가장 확실한 설명은 내가 다른 세상을 위해 창조되었다는 사실이다.”",
        history: "옥스퍼드와 케임브리지의 영문학자였던 루이스는 2차 세계대전 중 BBC 라디오 방송을 통해 명쾌한 비유와 이성적 변증으로 기독교의 보편적 진리를 변호했습니다.",
        contemporary: "세상의 다원주의 논리에 주눅 든 청년들에게, 우리는 일상 언어로 기독교 세계관의 탁월함과 복음의 진리됨을 설득력 있게 증명해 주고 있는가?"
    },
    {
        era: "후기 현대 & 도심 선교 (Contemporary Apologetics)",
        author: "팀 켈러 (Timothy Keller, 1950–2023)",
        work: "『내가 만든 신 (Counterfeit Gods)』",
        question: "전통 종교를 거부하는 고학력·세속 도시인들의 마음속 깊은 갈망과 불안의 실체는 무엇인가?",
        declaration: "“우상이란 무엇인가? 하나님보다 더 중요한 그 어떤 것이다. 그것이 없으면 내 인생이 무의미하다고 느끼게 만드는 바로 그것이다. 복음은 종교적 도덕주의와 세속적 상대주의 둘 다를 파괴하는 제3의 길이다.”",
        history: "팀 켈러는 뉴욕 맨해튼 중심가에서 현대인들의 마음속 숨겨진 우상(성공, 인정, 권력, 관계)을 복음으로 해체하며 십자가의 은혜를 설득력 있게 변증했습니다.",
        contemporary: "청년들이 겪는 완벽주의, 불안, 관계의 상처 밑바닥에는 어떤 현대적 우상이 도사리고 있는가? 우리는 그 마음 깊은 곳을 복음의 렌즈로 진단해 주고 있는가?"
    }
];

/* 🗓️ 기본 일정 및 프로젝트 템플릿 */
const defaultWeekly = {
    mon: [{ id: 'w1', time: '10:00', text: '교역자 회의' }, { id: 'w2', time: '14:00', text: '광주 심방' }],
    tue: [{ id: 'w3', time: '19:30', text: '리더 1on1 미팅' }],
    wed: [{ id: 'w4', time: '19:30', text: '수요예배 인도' }],
    thu: [{ id: 'w5', time: '19:30', text: '마을장 모임' }],
    fri: [{ id: 'w6', time: '21:00', text: '청년금요기도회' }],
    sat: [{ id: 'w7', time: '14:00', text: '새가족 심방' }],
    sun: [{ id: 'w8', time: '09:00', text: '주일사역 준비' }, { id: 'w9', time: '14:00', text: '청년부 예배' }]
};

const defaultTodos = [
    { id: 't1', time: '14:00', cat: '사역', text: '주말 청년부 사역 세팅 검토', status: '진행' },
    { id: 't2', time: '16:00', cat: '심방', text: '청년 교구 심방 동선 확인', status: '진행' }
];

const defaultProjects = [
    {
        id: 'p1',
        title: '「순간의 말」 워크숍 기획',
        start: '2026.08.20',
        end: '2026.09.05',
        completed: false,
        subtasks: [
            { id: 'st1', text: '워크숍 템플릿 초안 완성', done: true },
            { id: 'st2', text: '안내 리플렛 출력 및 배포 준비', done: false }
        ]
    }
];

/* 🔗 사역 관련 링크 모음 (구글 시트에서 이관, 시트 자체의 분류 체계를 그대로 사용) */
const defaultLinks = [
    { id: 'lk1', cat: '청년교구', title: '청년교구 회의록(25-26년도)', url: 'https://docs.google.com/document/d/1BLATDTk58rrY_i0pqg8DnQS7t1nlmczKGe-AjAWX8Pk/edit?usp=sharing' },
    { id: 'lk2', cat: '청년교구', title: '2026 통합행정', url: 'https://docs.google.com/spreadsheets/d/1g084VU0cecemMB9mNF4zl8h-EIqTdjq9ZVUaeEVLrG4/edit?usp=sharing' },
    { id: 'lk3', cat: '청년교구', title: '청년교구 자료(2025년~)', url: 'https://drive.google.com/drive/folders/18S9uvJrhfXRBXXS3p-_grguRCySKB3H2?usp=drive_link' },
    { id: 'lk4', cat: '청년교구', title: '2026년 드림센터 식당이용', url: 'https://docs.google.com/spreadsheets/d/1_hyx37M5vBddn6CH-LEZaITXoHYUaFUIbh1SrDwbua0/edit?usp=sharing' },
    { id: 'lk5', cat: '청년교구', title: '장소신청링크', url: 'https://docs.google.com/forms/d/e/1FAIpQLSdVjumYQ-aypKV7SyqhcaVMsScVPdk1BkO7TYMtSeTHoPljFQ/viewform' },
    { id: 'lk6', cat: '청년교구', title: '2025 드림센터 장소사용신청 현황표', url: 'https://docs.google.com/spreadsheets/d/1V8ah975xqEhvpp-jwg-tP9CnuoqcPNLgzKBL2nZc-Gs/edit?usp=sharing' },
    { id: 'lk7', cat: '청년교구', title: '25년 1학기 드림센터 고정장소(확정)', url: 'https://docs.google.com/spreadsheets/d/1sL9_Nj5j1Mf8KbIfaZK4SGo76SQHCCd-TnuWnvmEBDM/edit?usp=sharing' },
    { id: 'lk8', cat: '청년교구', title: '부서보고서(인원출석)', url: 'https://drive.google.com/drive/u/0/folders/1OjUAOhbzKiFwubdh_lDHaXE4_d8pjn28' },
    { id: 'lk9', cat: '청년교구', title: '25 주일 기도회 참석자 명단(남교역자)', url: 'https://docs.google.com/spreadsheets/d/1mHHWJSwTVYgRAqJ42qaJBJB5oBiVWfiNm3Zh2giPfa8/edit?usp=sharing' },
    { id: 'lk10', cat: '청년교구', title: '2026년 새벽기도회', url: 'https://docs.google.com/spreadsheets/d/1HdzzyfHX-J5n8thaXCvKvW63u0OHkpNW-5wAsicAghM/edit?usp=sharing' },
    { id: 'lk11', cat: '청년교구', title: '2026년 주중 예배 교역자 안내봉사 배치표', url: 'https://docs.google.com/spreadsheets/d/1lQZfhZ0sY9oiLzUR5Gw5yaKPmgdq1BMkO9B9rw5SVsM/edit?usp=sharing' },
    { id: 'lk12', cat: '수련회', title: '수련회 통합시트', url: 'https://church-camp-dashboard.vercel.app/' },
    { id: 'lk13', cat: '청년금요기도회', title: '2026 청년금요기도회 시트', url: 'https://docs.google.com/spreadsheets/d/1spzKfbX8ryOxjB5GW5FJuIQZYxmeJW-qzdvIfx5bfm4/edit?usp=sharing' },
    { id: 'lk14', cat: '청년금요기도회', title: '청금 중보기도 모음🙏(응답)', url: 'https://docs.google.com/spreadsheets/d/1cLITy0aQD9RFyrSF2UZs_8M-fF9xf6XKW7CyT5eISPY/edit?usp=sharing' },
    { id: 'lk15', cat: '청년금요기도회', title: '청년금요기도회 찬양팀 조직도 및 라인업(2025)', url: 'https://docs.google.com/spreadsheets/d/15xSWm_-K3PMsg_KstYnO1zWmp135Qqkl/edit?usp=sharing&ouid=112826260056797498242&rtpof=true&sd=true' },
    { id: 'lk16', cat: '1청2팀', title: '[A] 2026년 상반기 - 1청년부 2팀', url: 'https://docs.google.com/spreadsheets/d/1RdtdhAbj0UHdZb3MLbZfivGd1qy8ysNdurqQ0uMQ7w8/edit?usp=sharing' },
    { id: 'lk17', cat: '1청2팀', title: '2025 1청2팀 리더십 기도제목', url: 'https://docs.google.com/spreadsheets/d/1uIaofxvPJZ8P-nN1hbCf2kiswVdDKfKuL8Rzu_EdVIE/edit?usp=sharing' },
    { id: 'lk18', cat: '1청2팀', title: '[1청2팀] 마을장 주요 공지', url: 'https://docs.google.com/document/d/173IlCPKf8Xz4uMRqztYh57oH9gWl0PcZcCl3Ta3uYC4/edit?usp=sharing' },
    { id: 'lk19', cat: '1청2팀', title: '1청 2팀 마을 배정할 귀한 청년들', url: 'https://docs.google.com/spreadsheets/d/1ZkEbNFrOEdWNq0I2KYNSIONLLsnwCfX5FyG7rO7l-WU/edit?usp=sharing' },
    { id: 'lk20', cat: '1청2팀', title: '2026 1청년부 2팀 회계', url: 'https://docs.google.com/spreadsheets/d/12xVF0Y-NMLzbPnWW3n--O1CET0Ydu4g1CGIR5FOZr8g/edit?usp=sharing' },
    { id: 'lk21', cat: '1청2팀', title: '2025 1청 2팀 하반기 계획', url: 'https://docs.google.com/spreadsheets/d/1aIAe2KMG8wSK04VYqiKU9UKBNnnoYX6KhrwK3PmSoRM/edit?usp=sharing' },
    { id: 'lk22', cat: '1청2팀', title: '1청 2팀 부서모임 내용/대본', url: 'https://docs.google.com/document/d/1Vcg0vkZJTUhr_B2RvzItmMTg1jegSygwTz3CW5wa33A/edit?usp=sharing' },
    { id: 'lk23', cat: '1청2팀', title: '1청년부 2팀 심방신청(응답)·원투원 일정 2026', url: 'https://docs.google.com/spreadsheets/d/19RlditVOp0P_ptwg1mryJE934x0gjV2uyDEOV-6dbhc/edit?usp=sharing' },
    { id: 'lk24', cat: '1청2팀', title: '1청 연합예배 큐시트', url: 'https://docs.google.com/spreadsheets/d/115q6e30n9nvA6yfJpztaj-x0gZgYq79qF_gZBVcKtlI/edit?usp=sharing' },
    { id: 'lk25', cat: '1청2팀', title: '2026 1청2팀 새가족 환영(응답)', url: 'https://docs.google.com/spreadsheets/d/15KVhpuKjd4gSKcoabI79VGmVhDzOEnbo-5yf6UYm1h8/edit?usp=sharing' },
    { id: 'lk26', cat: '1청2팀', title: '2026 1청2팀 오고싶은 순모임 설문(응답)', url: 'https://docs.google.com/spreadsheets/d/1V5FIa4kfsOTMBUKU272V06I5XEOn2Nv6Zrz-d5YiPh8/edit?usp=sharing' },
    { id: 'lk27', cat: '1청2팀', title: '2026 1청2팀 순장이 꿈꾸는 순모임(응답)', url: 'https://docs.google.com/spreadsheets/d/1utIyHbZvTGa8vqw9Efyb7JV-aTToo4ux0ujlk4V5T-8/edit?usp=sharing' },
    { id: 'lk28', cat: '1청2팀', title: '26-1 1청2팀 동아리 신청(응답)', url: 'https://docs.google.com/spreadsheets/d/1plT11bkz6ZzYP95fOBOQPKLlDbTrKHFtzZm8HzbuIIk/edit?usp=sharing' },
    { id: 'lk29', cat: '1청2팀', title: '26-1 1청2팀 양육반 신청(응답)', url: 'https://docs.google.com/spreadsheets/d/1qiWEJz-hUURwFhngncHk-d-dvC8o8InbvoNgBQG30kg/edit?usp=sharing' }
];
