export const chapters = [
  {id:'morning',name:'아침 점호',place:'행정실',time:'08:10',nameEn:'SGM MILLER',nameKo:'밀러 원사',role:'Sergeant Major',sprite:0,callout:'첫 출근. 가방을 내려놓기도 전에…',clear:'오전 일과 통과',clearLine:'“Okay. 이제 XO를 찾아가 봐.”',intro:'서류 한 장도 그냥 지나치지 않는 원사님.'},
  {id:'planning',name:'훈련 회의',place:'회의실',time:'10:00',nameEn:'XO MORGAN',nameKo:'모건 선임장교',role:'Executive Officer',sprite:1,callout:'화이트보드에는 알파벳과 숫자뿐이다.',clear:'훈련 일정 확인 완료',clearLine:'“Good. 다음은 증원부대 도착 일정을 확인해.”',intro:'시간과 일정 앞에서는 타협이 없는 선임장교.'},
  {id:'arrivals',name:'증원 준비',place:'작전과 사무실',time:'13:00',nameEn:'CPT GARCIA',nameKo:'가르시아 대위',role:'Captain · Operations',sprite:2,callout:'점심은 끝났다. 약어는 끝나지 않았다.',clear:'증원 준비 완료',clearLine:'“Nice. 이제 마지막 보고만 남았어.”',intro:'커피 한 잔과 약어 다섯 개를 동시에 건네는 동료.'},
  {id:'final',name:'마지막 보고',place:'지휘관실',time:'16:30',nameEn:'LTC HAYES',nameKo:'헤이스 중령',role:'Lieutenant Colonel · Commander',sprite:3,callout:'가방을 챙기려는 순간, “잠깐만.”',clear:'오늘의 업무 완료',clearLine:'“Good work. You are dismissed.”',intro:'퇴근 직전의 “한 가지만 더”를 담당하는 지휘관.'}
];

const q = (id,chapter,term,full,meaning,line,translation,ask,options,correct,hint,good,bad) => ({id,chapter,term,full,meaning,line,translation,ask,options,correct,hint,good,bad});
export const questions = [
 q('nlt',0,'NLT','No Later Than','늦어도 ~까지',
   'Welcome aboard. Be at the training brief NLT 0830.',
   '전입을 환영하네. 훈련 브리핑에 NLT 08:30으로 참석하게.',
   '언제까지 도착해야 할까?',
   ['08:30부터 출발한다.','늦어도 08:30까지 도착한다.','08:30 이후에 도착한다.','내일 08:30까지 도착한다.'],1,
   'Later는 더 늦게. No later than은 그 시각보다 늦지 않게, 즉 “늦어도 ~까지”라는 뜻이야.',
   '“On time. 좋은 출발이군.”','“내 시계랑 자네 시계는 다른 시간대인가?”'),
 q('cpx',0,'CPX','Command Post Exercise','지휘소연습',
   'Today is a CPX. The staff will practice command and control.',
   '오늘은 CPX야. 참모들은 지휘·통제를 연습하게 될 거야.',
   '어떤 훈련을 준비해야 할까?',
   ['전투체력 측정','야외기동훈련','지휘소연습','전투식량 시식회'],2,
   'CP는 Command Post, 즉 지휘소. Exercise는 훈련·연습이야.',
   '“Correct. 지도와 보고 자료를 준비하게.”','“체력단련은 나중에. 지금은 지휘소부터 찾게.”'),
 q('ftx',0,'FTX','Field Training Exercise','야외기동훈련',
   'Next week, the troops will go to the field for an FTX.',
   '다음 주에는 병력이 FTX를 위해 야외로 나갈 거야.',
   'FTX는 무엇일까?',
   ['야외기동훈련','지휘관 회의','온라인 교육','신체검사'],0,
   'Field = 야외, Training = 훈련. CPX와 함께 구별해 기억해 봐.',
   '“Right. 그날은 사무실 의자가 없을 거야.”','“사무실 의자는 이번 훈련에 참가하지 않네.”'),
 q('ufs',0,'UFS','Ulchi Freedom Shield','을지 자유의 방패 연습',
   'We are preparing for UFS, a ROK–U.S. combined exercise.',
   '우리는 한미 연합연습인 UFS를 준비하고 있어.',
   'UFS의 풀네임은?',
   ['Unit Field Support','United Forces School','Uniform Folding Session','Ulchi Freedom Shield'],3,
   'U는 Ulchi(을지), F는 Freedom, S는 Shield(방패).',
   '“Good. 첫 번째 관문은 통과했군.”','“제복 개는 연습도 필요하겠지만, 오늘은 연합연습이야.”'),
 q('cday',1,'C-Day','Deployment Commencement Day','전개 개시일',
   'The deployment begins on C-Day. Mark it on the schedule.',
   '전개는 C-Day에 시작해. 일정표에 표시해 줘.',
   'C-Day에 시작되는 것은?',
   ['전쟁 종료 협상','휴가','부대 전개','전면 동원'],2,
   'C-Day는 deployment가 시작되는 날. 교재에서는 Commencement Day로 풀어 설명해.',
   '“좋아. 증원부대 전개 일정부터 맞추자.”','“그 일정표에 휴가는 아직 없어.”'),
 q('dday',1,'D-Day','Day an operation commences','작전 개시일',
   'Our operation starts on D-Day. The rehearsal is on D minus one.',
   '작전은 D-Day에 시작하고, 예행연습은 D-1에 해.',
   'D-Day는 어떤 날일까?',
   ['전개가 끝나는 날','해당 작전이 시작되는 날','예행연습이 끝나는 날','반드시 6월 6일'],1,
   'D-Day는 해당 작전의 기준이 되는 개시일이야. 특정 역사적 날짜에만 쓰는 표현은 아니야.',
   '“Exactly. D-1은 그 하루 전이야.”','“역사시험은 다음에. 지금은 우리 작전의 기준일이야.”'),
 q('hhour',1,'H-Hour','Hour an operation commences','작전 개시시각',
   'H-Hour is 0600. Be ready before the operation begins.',
   'H-Hour는 06:00이야. 작전이 시작되기 전에 준비해.',
   '06:00에 무엇이 시작될까?',
   ['조식 배식','서류 접수','일과 종료','해당 작전'],3,
   'D는 Day, H는 Hour. H-Hour는 작전이 시작되는 기준시각이야.',
   '“Good. 이제 날짜와 시각이 다 맞았네.”','“아침 식사는 중요하지. 그런데 H는 Hungry가 아니야.”'),
 q('mday',1,'M-Day','Mobilization Day','동원 개시일',
   'Full mobilization begins on M-Day. Which entry should we use?',
   '전면 동원은 M-Day에 시작해. 일정표에 어떻게 적을까?',
   'M-Day의 의미는?',
   ['동원 개시일','작전 개시시각','회의 개시일','전개 종료일'],0,
   'Mobilization은 동원. M-Day를 C-Day·D-Day와 구별해 봐.',
   '“좋아. 이제 이 일정표를 믿고 쓸 수 있겠어.”','“M은 Monday가 아니야. 월요일만 동원하지는 않거든.”'),
 q('rsoi',2,'RSOI','Reception, Staging, Onward Movement, and Integration','증원전력 전개절차',
   'The incoming unit is going through RSOI before joining us.',
   '도착하는 부대는 우리와 합류하기 전에 RSOI를 거치고 있어.',
   '지금 준비하는 업무는?',
   ['신병의 영어 평가','비전투원 후송','증원부대의 도착·집결·이동·통합','훈련 뒤 사후검토'],2,
   'Reception → Staging → Onward Movement → Integration. 도착한 전력을 작전에 투입할 수 있게 준비하는 과정이야.',
   '“Exactly. 비행기에서 내렸다고 바로 준비가 끝나는 건 아니지.”','“커피부터 줄까? 먼저 도착한 부대가 어디로 가는지 보자.”'),
 q('tpfdd',2,'TPFDD','Time-Phased Force and Deployment Data','시차별 부대전개제원',
   'Please update the TPFDD with the unit’s deployment schedule.',
   '부대 전개 일정을 반영해서 TPFDD를 최신화해 줘.',
   '어떤 자료를 열어야 할까?',
   ['인원·장비가 언제, 어디로 전개되는지 정리한 자료','휴가 신청 명단','체력검정 결과표','식당 주간 메뉴'],0,
   '어떤 인원·장비가 언제, 어디로 전개되는지 담은 데이터야. 약어는 길지만, 여기서는 “전개 일정 자료”로 먼저 연결해 봐.',
   '“Perfect. 이 자료가 최신이어야 모두 제때 움직일 수 있어.”','“그 메뉴도 보고 싶지만, 지금 찾는 건 전개 일정이야.”'),
 q('eta',2,'ETA','Estimated Time of Arrival','예상 도착시각',
   'The convoy’s ETA is 1400. Let the receiving team know.',
   '차량 행렬의 ETA는 14:00이야. 인수팀에 알려 줘.',
   '인수팀에 무엇을 알려줄까?',
   ['14:00에 출발할 예정이다.','14:00에 훈련이 끝난다.','14:00까지 보고서를 낸다.','14:00에 도착할 예정이다.'],3,
   'Arrival = 도착. ETA는 Estimated Time of Arrival.',
   '“좋아. 14:00 도착 예정으로 전달해 줘.”','“출발을 기다릴까, 도착을 기다릴까? A를 다시 보자.”'),
 q('etd',2,'ETD','Estimated Time of Departure','예상 출발시각',
   'The bus’s ETD is 1500. Tell the passengers to get ready.',
   '버스의 ETD는 15:00이야. 탑승 인원에게 준비하라고 해 줘.',
   '15:00은 어떤 시각일까?',
   ['예상 도착시각','예상 출발시각','최종 제출시각','작전 개시시각'],1,
   'Departure = 출발. ETA의 A와 ETD의 D를 비교해 봐.',
   '“Right. 이제 도착과 출발을 바꿔 적지는 않겠네.”','“그렇게 안내하면 버스가 도착하기 전에 이미 떠나겠는데?”'),
 q('roc',3,'ROC Drill','Rehearsal of Concept Drill','작전계획 예행연습',
   'Before we execute the plan, we will conduct a ROC drill.',
   '계획을 실행하기 전에 ROC drill을 실시하겠네.',
   '어떤 활동을 준비해야 할까?',
   ['사후검토','병력 점호','작전계획 예행연습','장비 정비검사'],2,
   'Rehearsal은 예행연습. 계획을 실행하기 전에 각자 무엇을 할지 맞춰 보는 거야.',
   '“Good. 실제로 시작하기 전에 한 번 맞춰 봐야지.”','“아직 실행 전이야. 사후검토를 하기에는 조금 이르군.”'),
 q('neo',3,'NEO','Noncombatant Evacuation Operation(s)','비전투원 후송작전',
   'For the NEO exercise, we will practice moving noncombatants to safety.',
   'NEO 훈련에서는 비전투원을 안전한 곳으로 이동시키는 연습을 하겠네.',
   '이번 훈련의 대상은?',
   ['후송 대상 비전투원','전방으로 이동할 전투부대','정비를 기다리는 차량','예비 탄약'],0,
   'Noncombatant = 비전투원, Evacuation = 후송·대피. NEO를 증원부대 전개와 구별해 봐.',
   '“Correct. 전투에 참가하지 않는 사람들의 안전도 준비해야지.”','“전방으로 보내는 계획이 아니네. 안전한 곳으로 후송하는 거야.”'),
 q('defcon',3,'DEFCON','Defense Readiness Condition','방어준비태세',
   'In this exercise, DEFCON describes our level of defense readiness.',
   '이번 훈련에서 DEFCON은 우리의 방어준비 수준을 나타내네.',
   'DEFCON은 무엇을 나타낼까?',
   ['대북정보 감시태세','통신 감명도','예상 도착시각','방어준비태세'],3,
   'Defense Readiness에 주목해 봐. DEFCON은 방어준비태세를 나타내는 표현이야.',
   '“좋아. 마지막 한 가지만 더 확인하지.”','“감시태세와 준비태세가 섞였군. 아직 가방은 내려놓게.”'),
 q('watchcon',3,'WATCHCON','Watch Condition','대북정보 감시태세',
   'And WATCHCON? What kind of posture does it describe?',
   '그렇다면 WATCHCON은? 어떤 태세를 나타내나?',
   '퇴근 전 마지막 질문이다.',
   ['보급품 적재 상태','대북정보 감시태세','방어준비태세','차량 출발 준비'],1,
   'Watch = 지켜보다·감시하다. 교재에서 WATCHCON은 대북정보 감시태세로 설명해.',
   '“Good work today. You are dismissed.”','“나는 지금 자네의 퇴근 태세를 감시하고 있네. 다시 해보게.”')
];

export function freshState(){return {phase:'start',index:0,misses:0,firstTry:0,tries:0,selected:null,completed:0,showTranslation:false,seen:[],wrongIds:[]};}
export function current(s){return questions[Math.min(s.index,questions.length-1)];}
export function start(s){return {...freshState(),phase:'question',seen:[questions[0].id]};}
export function choose(s,option){
 if(s.phase!=='question'||!Number.isInteger(option)||option<0||option>3)return s;
 const item=current(s),right=option===item.correct;
 return {...s,selected:option,phase:right?'correct':'incorrect',tries:s.tries+1,
  misses:s.misses+(right?0:1),firstTry:s.firstTry+(right&&s.tries===0?1:0),
  completed:s.completed+(right?1:0),wrongIds:right?s.wrongIds:[...new Set([...s.wrongIds,item.id])]};
}
export function advance(s){
 if(s.phase==='start')return start(s);
 if(s.phase==='incorrect')return {...s,phase:'question',selected:null};
 if(s.phase==='correct'){
   if(s.index===questions.length-1)return {...s,phase:'ending'};
   if(questions[s.index+1].chapter!==current(s).chapter)return {...s,phase:'chapterClear'};
   return nextQuestion(s);
 }
 if(s.phase==='chapterClear')return nextQuestion(s);
 return s;
}
function nextQuestion(s){const i=s.index+1;return {...s,index:i,phase:'question',tries:0,selected:null,showTranslation:false,seen:[...new Set([...s.seen,questions[i].id])]};}
export function clockOut(s){const t=17*60+s.misses*5;return `${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`;}
export function endingLabel(s){return s.misses===0?'정시 퇴근의 전설':s.misses<=3?'조금 늦어도, 퇴근 성공':s.misses<=8?'오늘 배웠으면 됐다':'끈기의 연락장교';}
