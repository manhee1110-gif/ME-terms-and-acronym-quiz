// Lessons 2-4 are data-driven so the instructor can later trim or reorder
// individual items without changing the shared game engine.
const item = (term, full, meaning, description = '') => ({term, full, meaning, description});

function choices(items, index, field) {
  const answer = items[index][field];
  const distractors = [];
  for (let offset = 1; distractors.length < 3; offset++) {
    const candidate = items[(index + offset) % items.length][field];
    if (candidate !== answer && !distractors.includes(candidate)) distractors.push(candidate);
  }
  const correct = index % 4;
  const options = [...distractors];
  options.splice(correct, 0, answer);
  return {options, correct};
}

function makeQuestions(items, chapter, prefix) {
  return items.map((entry, index) => {
    const field = index % 2 ? 'meaning' : 'full';
    const {options, correct} = choices(items, index, field);
    const ask = field === 'full'
      ? `${entry.term}과 연결되는 정확한 영어 표현 또는 표준 약어는?`
      : `${entry.term}의 의미로 가장 알맞은 것은?`;
    const detail = entry.description || `${entry.term}은(는) ${entry.full}을(를) 뜻한다.`;
    return {
      id: `${prefix}-${String(index + 1).padStart(2, '0')}`,
      chapter, term: entry.term, full: entry.full, meaning: entry.meaning,
      line: detail,
      translation: `${entry.term}: ${entry.meaning}`,
      ask, options, correct,
      hint: `${entry.term}의 핵심은 “${entry.full}”이야. 문맥에서는 ${entry.meaning}(으)로 사용해.`,
      good: `“Correct. ${entry.term}, ${entry.full}.”`,
      bad: `“약어와 기능을 다시 연결하게. ${entry.term}의 핵심 단서를 확인해.”`
    };
  });
}

function makeDrills(items, chapter, prefix, limit = 16) {
  return items.slice(0, limit).map((entry, index) => ({
    id: `${prefix}-drill-${String(index + 1).padStart(2, '0')}`,
    term: entry.term, chapter,
    listen: `${entry.full}.`,
    listenFocus: `${entry.full}의 각 핵심어를 순서대로 들어 보세요.`,
    frame: entry.full.split(/\s+/).map((word, i) => i === 0 ? word : '___').join(' / '),
    keyPhrases: entry.full.split(/[,/]/).map(value => value.trim()).filter(Boolean),
    write: `${entry.meaning}에 해당하는 군사용어 또는 약어를 사용해 짧은 영어 문장으로 보고하세요.`,
    required: [entry.term],
    model: `${entry.term} is confirmed.`,
    writeHint: `${entry.full}의 머리글자 또는 수업에서 배운 표준 표현을 떠올려 보세요.`,
    minWords: 3
  }));
}

const lesson2Briefing = [
  item('COP','Common Operational Picture','공통작전상황도','Everyone uses the same operational display to maintain shared situational awareness.'),
  item('CUB',"Commander’s Update Brief",'지휘관 최신화보고','Staff and subordinate commanders give the commander their assessment of current operations.'),
  item('BUB','Battle Update Brief','전투상황보고','The staff updates the commander on current operations, upcoming events, and required decisions.'),
  item('COA','Course of Action','방책','The staff develops a scheme or sequence of activities to accomplish the mission.'),
  item('Confirmation Brief','Confirmation Briefing','임무확인보고','A subordinate immediately explains how the order was understood.'),
  item('Backbrief','Backbriefing','임무수행계획보고','A subordinate explains how the mission will be executed.'),
  item('Debrief','Debriefing','결과보고','Personnel review what happened and extract information after an event.'),
  item('AAR','After-Action Review','사후검토','Participants analyze performance during or after training to improve future performance.'),
  item('Battle Rhythm','Battle Rhythm','지휘통제주기','A deliberate cycle of command, staff, and unit activities synchronizes operations.'),
  item('TOP SECRET','Top Secret','1급 비밀','Unauthorized disclosure could cause exceptionally grave damage to national security.'),
  item('SECRET','Secret','2급 비밀','Unauthorized disclosure could cause serious damage to national security.'),
  item('CONFIDENTIAL','Confidential','3급 비밀','Unauthorized disclosure could cause damage to national security.')
];

const lesson2Prowords = [
  item('THIS IS','This transmission is from the station that follows.','여기는'),
  item('CALL SIGN','The group that follows is a call sign.','호출부호명'),
  item('RADIO CHECK','Request a check of signal strength and readability.','감명도 여하'),
  item('OVER','My transmission has ended and a response is required.','이상'),
  item('OUT','My transmission has ended and no response is expected.','끝'),
  item('BREAK','Separate this part of the message from the next part.','구분'),
  item('MESSAGE','A message that requires recording is about to follow.','다음은 전보'),
  item('CORRECT','What you transmitted is correct.','정확함'),
  item('AFFIRMATIVE','Yes, or that is correct.','예 / 정확함'),
  item('NEGATIVE','No.','아님'),
  item('SAY AGAIN','Repeat your last transmission.','재송바람'),
  item('I SAY AGAIN','I am repeating my transmission.','재송함'),
  item('READ BACK','Repeat this transmission exactly as received.','복창바람'),
  item('I READ BACK','The following is my exact repetition of your transmission.','복창함'),
  item('WRONG','Your last transmission was incorrect.','틀렸음'),
  item('COPY','I received the information. No action is implied.','수신완료'),
  item('ROGER','I received your last transmission satisfactorily.','잘 받았음'),
  item('WILCO','I received, understood, and will comply.','수신했고 따르겠음'),
  item('CORRECTION','I made an error and will continue from the last correct word.','정정'),
  item('WORDS TWICE','Transmit each phrase or code group twice.','두 번씩'),
  item('RELAY TO','Transmit this message to the addressee that follows.','중계바람'),
  item('I SPELL','I will spell the next word phonetically.','풀어서 송신함'),
  item('WAIT','I must pause for a few seconds.','잠시 대기'),
  item('SPEAK SLOWER','Reduce the speed of transmission.','천천히 송신바람')
];

const lesson2Chapters = [
  {id:'briefing',name:'브리핑 체계',place:'전투지휘소',time:'08:30',nameEn:'MAJ PARKER',nameKo:'파커 소령',role:'Battle Staff Officer',sprite:0,callout:'회의 이름만 들어도 누가 누구에게 무엇을 보고하는지 판단해야 한다.',clear:'Briefing Terms 완료',clearLine:'“Good. 이제 무전망의 표준 절차어를 확인하지.”',intro:'브리핑 종류와 비밀등급을 구분하는 단계.'},
  {id:'radio-basic',name:'무전 개시·종료',place:'통신실',time:'11:10',nameEn:'SFC RIVERA',nameKo:'리베라 중사',role:'Communications NCO',sprite:1,callout:'OVER와 OUT을 섞는 순간 무전망이 꼬인다.',clear:'Basic Prowords 완료',clearLine:'“Readable. 이제 재송과 정정을 처리하게.”',intro:'무전 개시, 응답, 종료에 쓰는 proword 단계.'},
  {id:'radio-repair',name:'재송·정정·확인',place:'전방관측소',time:'14:30',nameEn:'CPT HAYES',nameKo:'헤이스 대위',role:'Fire Support Officer',sprite:2,callout:'잘못 들은 좌표는 다시 묻고 정확히 복창한다.',clear:'2차시 학습 임무 완료',clearLine:'“Solid copy. Radio procedure complete.”',intro:'통신 오류를 수정하고 메시지를 확인하는 단계.'}
];

const lesson2Questions = [
  ...makeQuestions(lesson2Briefing,0,'l2-brief'),
  ...makeQuestions(lesson2Prowords.slice(0,10),1,'l2-basic'),
  ...makeQuestions(lesson2Prowords.slice(10),2,'l2-repair')
];

export const lessonTwo = {
  id:'lesson-2',number:2,available:true,titleKo:'브리핑 약어와 무전 절차어',titleEn:'BRIEFINGS · PROWORDS',
  description:`브리핑 12개 · Prowords 24개 · 총 ${lesson2Questions.length}문항`,footer:'2차시 · Briefings & Prowords',
  chapters:lesson2Chapters,questions:lesson2Questions,
  drills:[...makeDrills(lesson2Briefing,0,'l2b',8),...makeDrills(lesson2Prowords.slice(0,8),1,'l2p1',8),...makeDrills(lesson2Prowords.slice(8,16),2,'l2p2',8)],
  sourceNote:'강의 슬라이드 「Military Terms and Abbreviations 2」와 2차시 생도용 학습지를 기준으로 구성했습니다.'
};

const lesson3Operational = [
  item('BMNT','Beginning of Morning Nautical Twilight','해상박명초'),item('EENT','End of Evening Nautical Twilight','해상박명종'),
  item('CONUS','Continental United States','미국 본토'),item('OCONUS','Outside the Continental United States','미 대륙 외 지역'),
  item('KTO','Korean Theater of Operations','한국작전전구'),item('AO','Area of Operations','작전지역'),item('AOI','Area of Interest','관심지역'),
  item('FEBA','Forward Edge of Battle Area','전투지역전단'),item('FLOT','Forward Line of Own Troops','전선 부대진출선'),
  item('OP','Observation Post','관측소'),item('CP','Command Post','지휘소'),item('RP','Release Point','분진점'),item('RLY','Rally Point','재집결지점'),
  item('SOP','Standard Operating Procedure','표준운영절차'),item('ROE','Rules of Engagement','교전규칙'),item('IED','Improvised Explosive Device','급조폭발물'),
  item('CBRN','Chemical, Biological, Radiological, and Nuclear','화생방'),item('QRF','Quick Reaction Force','신속대응부대'),item('UAV','Unmanned Aerial Vehicle','무인항공기'),
  item('EPW','Enemy Prisoner of War','적 포로'),item('AWOL','Absent Without Leave','탈영 / 무단이탈'),
  item('CASEVAC','Casualty Evacuation','부상자 후송'),item('MEDEVAC','Medical Evacuation','의무 후송'),item('LOC','Line of Communication','병참선'),
  item('MSR','Main Supply Route','주보급로'),item('ASR','Alternative Supply Route','예비보급로'),item('Ammo','Ammunition','탄약'),
  item('Class I','Subsistence items','1종 보급품: 식량'),item('Class II','Clothing','2종 보급품: 피복'),item('Class III','Petroleum, oil, and lubricants','3종 보급품: 유류'),
  item('Class IV','Construction and barrier materials','4종 보급품: 건설·장애물 자재'),item('Class V','Ammunition and explosives','5종 보급품: 탄약·폭발물'),
  item('Class VI','Personal items','6종 보급품: 개인물품'),item('Class VII','Major end items','7종 보급품: 주요 완제품'),
  item('Class VIII','Medical materiel and supplies','8종 보급품: 의무물자'),item('Class IX','Repair parts','9종 보급품: 수리부속'),item('Class X','Miscellaneous supplies','10종 보급품: 기타물자')
];

const lesson3Organizations = [
  item('U.S. Army','Ground forces','미 육군'),item('U.S. Navy','Maritime operations and forward-deployed naval power','미 해군'),
  item('U.S. Air Force','Air and space capability','미 공군'),item('U.S. Marine Corps','Amphibious and ground combat operations','미 해병대'),
  item('U.S. Coast Guard','Maritime law enforcement, safety, and rescue','미 해안경비대'),item('U.S. Space Force','Global space operations','미 우주군'),
  item('Infantry','IN','보병'),item('Armor','AR','기갑'),item('Aviation','AV','항공'),item('Air Defense Artillery','AD','방공'),
  item('Field Artillery','FA','포병'),item('Corps of Engineers','EN','공병'),item('Military Police Corps','MP','군사경찰'),item('Chemical Corps','CM','화학'),
  item('Military Intelligence Corps','MI','정보'),item('Signal Corps','SC','통신'),item('Adjutant General Corps','AG','부관'),item('Finance Corps','FI','재정'),
  item('Logistics','LG','군수'),item('Transportation Corps','TC','수송'),item('Ordnance Corps','OD','병기'),item('Quartermaster Corps','QM','병참'),
  item('Medical Service Corps','MS','의정'),item('Cyber Corps','CY','사이버')
];

const lesson3RanksUnits = [
  item('Private','PV1 / E-1','이병'),item('Private','PV2 / E-2','이병'),item('Private First Class','PFC / E-3','일병'),item('Specialist','SPC / E-4','상병'),
  item('Corporal','CPL / E-4','상병 / 부사관'),item('Sergeant','SGT / E-5','병장'),item('Staff Sergeant','SSG / E-6','하사'),
  item('Sergeant First Class','SFC / E-7','중사'),item('Master Sergeant','MSG / E-8','상사'),item('First Sergeant','1SG / E-8','선임상사'),
  item('Sergeant Major','SGM / E-9','원사'),item('Command Sergeant Major','CSM / E-9','주임원사'),
  item('Warrant Officer 1','WO1 / W-1','준위'),item('Chief Warrant Officer 2','CW2 / W-2','선임준위 2'),item('Chief Warrant Officer 3','CW3 / W-3','선임준위 3'),
  item('Chief Warrant Officer 4','CW4 / W-4','선임준위 4'),item('Chief Warrant Officer 5','CW5 / W-5','선임준위 5'),
  item('Second Lieutenant','2LT / O-1','소위'),item('First Lieutenant','1LT / O-2','중위'),item('Captain','CPT / O-3','대위'),item('Major','MAJ / O-4','소령'),
  item('Lieutenant Colonel','LTC / O-5','중령'),item('Colonel','COL / O-6','대령'),item('Brigadier General','BG / O-7','준장'),item('Major General','MG / O-8','소장'),
  item('Lieutenant General','LTG / O-9','중장'),item('General','GEN / O-10','대장'),item('General of the Army','GA','원수'),
  item('Team / Crew','No amplifier','조'),item('Squad','●','분대'),item('Section','●●','반'),item('Platoon / Detachment','●●●','소대 / 파견대'),
  item('Company','I','중대'),item('Battalion','II','대대'),item('Regiment','III','연대'),item('Brigade','X','여단'),item('Division','XX','사단'),
  item('Corps','XXX','군단'),item('Theater Army','XXXX','전구군'),item('Army Group','XXXXX','집단군')
];

const lesson3Chapters = [
  {id:'operational',name:'작전용어',place:'작전상황실',time:'08:10',nameEn:'SGM MILLER',nameKo:'밀러 원사',role:'Operations Sergeant Major',sprite:0,callout:'시간·지역·전투·지속지원 용어를 COP에 반영한다.',clear:'Operational Terms 완료',clearLine:'“Good. 이제 미군 조직표로 이동하게.”',intro:'작전용어와 보급종류를 식별하는 단계.'},
  {id:'organizations',name:'군종·병과',place:'인사회의실',time:'11:20',nameEn:'MAJ LEWIS',nameKo:'루이스 소령',role:'Personnel Officer',sprite:1,callout:'군종과 병과의 임무를 구분해 적임자를 편성한다.',clear:'Service & Branches 완료',clearLine:'“Roster confirmed. 계급과 부대 규모를 확인하지.”',intro:'미군 6개 군종과 육군 병과를 구분하는 단계.'},
  {id:'ranks-units',name:'계급·부대 규모',place:'지휘관실',time:'14:10',nameEn:'COL DAVIS',nameKo:'데이비스 대령',role:'Brigade Commander',sprite:2,callout:'계급장과 부대 기호가 틀리면 지휘관계도 틀린다.',clear:'3차시 학습 임무 완료',clearLine:'“Order of battle confirmed.”',intro:'미 육군 계급과 부대제대 기호를 연결하는 단계.'}
];

const lesson3Questions = [
  ...makeQuestions(lesson3Operational,0,'l3-ops'),
  ...makeQuestions(lesson3Organizations,1,'l3-org'),
  ...makeQuestions(lesson3RanksUnits,2,'l3-rank')
];

export const lessonThree = {
  id:'lesson-3',number:3,available:true,titleKo:'작전용어와 미 육군 조직',titleEn:'TERMS · BRANCHES · RANKS',
  description:'101문항 문제은행에서 매회 15문항 랜덤 도전',footer:'3차시 · Operational Terms & Organization',
  classroomQuestionLimit:15,
  chapters:lesson3Chapters,questions:lesson3Questions,
  drills:[...makeDrills(lesson3Operational,0,'l3o',8),...makeDrills(lesson3Organizations,1,'l3b',6),...makeDrills(lesson3RanksUnits,2,'l3r',8)],
  sourceNote:'강의 슬라이드 「Military Terms and Abbreviations 3」과 3차시 생도용 학습지를 기준으로 구성했습니다.'
};

const lesson4Common = [
  item('IAW','In Accordance With','~에 의거'),item('IOT','In Order To','~하기 위하여'),item('IVO','In Vicinity Of','~의 부근'),
  item('ILO','In Lieu Of','~대신에'),item('O/O','On Order','의명'),item('TBD','To Be Determined','미정 / 추후 결정'),
  item('NLT','No Later Than','늦어도 ~까지'),item('ETA','Estimated Time of Arrival','예상도착시간'),item('ETD','Estimated Time of Departure','예상출발시간')
];

const lesson4Staff = [
  item('G','General Staff','장관급 이상 지휘관의 참모'),item('J','Joint Staff','합동부대 참모'),item('C','Combined Staff','연합부대 참모'),item('S','Small-unit Staff','대대·연대·여단 참모'),
  item('1','Personnel','인사'),item('2','Intelligence','정보'),item('3','Operations','작전'),item('4','Logistics','군수'),item('5','Plans','기획'),
  item('6','Signal','통신'),item('8','Financial Management','재정'),item('9','Civil Affairs Operations','민군작전')
];

const lesson4Leaders = [
  item('CG','Commanding General','지휘관 / 장군'),item('DCG','Deputy Commanding General','부지휘관 / 장군'),item('CoS','Chief of Staff','참모장'),
  item('LNO','Liaison Officer','연락장교'),item('CO / CDR','Commanding Officer / Commander','지휘관'),item('XO','Executive Officer','대대 선임장교')
];

const lesson4Chapters = [
  {id:'common',name:'작전문장 약어',place:'계획실',time:'08:40',nameEn:'CPT GARCIA',nameKo:'가르시아 대위',role:'Plans Officer',sprite:0,callout:'한 줄의 OPORD에서 시간·목적·위치를 정확히 읽는다.',clear:'Common Abbreviations 완료',clearLine:'“Good. 이제 참모부호를 해독하게.”',intro:'자주 쓰는 작전문장 약어를 문맥에 적용하는 단계.'},
  {id:'staff',name:'참모부호',place:'참모회의실',time:'11:30',nameEn:'LTC MORGAN',nameKo:'모건 중령',role:'Chief of Staff',sprite:1,callout:'G·J·C·S와 숫자가 결합해 부대와 기능을 나타낸다.',clear:'Staff Codes 완료',clearLine:'“Staff map complete. 마지막은 지휘부 약어다.”',intro:'참모 유형과 기능번호를 조합하는 단계.'},
  {id:'leaders',name:'지휘부 직책',place:'지휘부',time:'14:40',nameEn:'BG THOMPSON',nameKo:'톰슨 준장',role:'Commanding General',sprite:2,callout:'누가 지휘하고 누가 조정하는지 직책 약어로 판단한다.',clear:'4차시 학습 임무 완료',clearLine:'“All staff positions confirmed. Mission complete.”',intro:'지휘관·부지휘관·참모장·연락장교 직책을 구분하는 단계.'}
];

const lesson4Questions = [
  ...makeQuestions(lesson4Common,0,'l4-common'),
  ...makeQuestions(lesson4Staff,1,'l4-staff'),
  ...makeQuestions(lesson4Leaders,2,'l4-lead')
];

export const lessonFour = {
  id:'lesson-4',number:4,available:true,titleKo:'작전약어와 참모조직',titleEn:'ABBREVIATIONS · STAFF',
  description:`자주 쓰는 약어·참모부호·지휘부 직책 총 ${lesson4Questions.length}문항`,footer:'4차시 · Abbreviations & Staff Organization',
  chapters:lesson4Chapters,questions:lesson4Questions,
  drills:[...makeDrills(lesson4Common,0,'l4a',9),...makeDrills(lesson4Staff,1,'l4s',6),...makeDrills(lesson4Leaders,2,'l4l',6)],
  sourceNote:'강의 슬라이드 「Military Terms and Abbreviations 4」와 4차시 생도용 학습지를 기준으로 구성했습니다.'
};
