import {finite} from './data-utils.js';

export const heroStates = [
 {key:'workStudy',label:'Töötab ja õpib',color:'#60c3ae'},
 {key:'workOnly',label:'Töötab, ei õpi',color:'#b7d7df'},
 {key:'studyOnly',label:'Õpib, ei tööta',color:'#f0c674'},
 {key:'neet',label:'Ei tööta ega õpi',color:'#ef8f82'}
];

// Largest remainders keep the waffle at exactly 100 squares, including source rounding to 99.9/100.1.
// The legend always shows the unmodified published percentages.
export function allocateSquares(values){
 if(!values.length||values.some(v=>!finite(v)||v<0))return null;
 const total=values.reduce((a,b)=>a+b,0);if(total<=0)return null;
 const exact=values.map(v=>v/total*100),counts=exact.map(Math.floor);
 const order=exact.map((v,i)=>({i,remainder:v-counts[i]})).sort((a,b)=>b.remainder-a.remainder||a.i-b.i);
 for(let remaining=100-counts.reduce((a,b)=>a+b,0),i=0;i<remaining;i++)counts[order[i].i]++;
 return counts;
}

export function mountHeroTimeline(rows){
 const $=id=>document.getElementById(id),grid=$('hero-dots'),panel=$('hero-timeline');
 if(!grid||!panel)return;
 const observations=rows.filter(r=>allocateSquares(heroStates.map(s=>r[s.key]))!==null).sort((a,b)=>a.year-b.year);
 if(!observations.length)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),slider=$('hero-year-slider'),button=$('hero-play');
 const first=observations[0].year,last=observations.at(-1).year;
 let index=reduced.matches?observations.length-1:0,playing=!reduced.matches,inView=false,timer=null;
 slider.min=first;slider.max=last;$('hero-first-year').textContent=first;$('hero-last-year').textContent=last;
 const squares=Array.from({length:100},()=>{const dot=document.createElement('span');dot.className='dot';return dot});grid.replaceChildren(...squares);
 const format=v=>v.toLocaleString('et-EE',{minimumFractionDigits:1,maximumFractionDigits:1});
 const flagged=r=>heroStates.some(s=>r.flags?.[s.key]?.includes('b'));
 const breaks=observations.filter(flagged).map(r=>r.year);
 $('hero-break-years').textContent=breaks.join(', ');
 function clear(){if(timer!==null)clearTimeout(timer);timer=null}
 function syncButton(){button.textContent=playing?'Paus':index===observations.length-1?'Esita uuesti':'Esita';button.setAttribute('aria-pressed',String(playing));panel.dataset.playing=String(playing)}
 function render(announce=false){
  const r=observations[index],counts=allocateSquares(heroStates.map(s=>r[s.key]));let cursor=0;
  for(let i=0;i<heroStates.length;i++){const state=heroStates[i];for(let n=0;n<counts[i];n++){const square=squares[cursor++];square.style.backgroundColor=state.color;square.dataset.state=state.key}$("hero-value-"+state.key).textContent=format(r[state.key])+'%'}
  $('hero-year').textContent=r.year;slider.value=r.year;slider.setAttribute('aria-valuetext',String(r.year));panel.dataset.year=r.year;
  const description=r.year+'. aasta. '+heroStates.map(s=>s.label+': '+format(r[s.key])+' protsenti').join('; ')+'.';
  grid.setAttribute('aria-label',description);if(announce)$('hero-announcement').textContent=description;
  const isBreak=flagged(r),hasLowReliability=heroStates.some(s=>r.flags?.[s.key]?.includes('u'));
  $('hero-year-note').textContent=isBreak?(r.year===2021?'2021 · ETU metoodika muutus':r.year+' · Eurostat märgib aegrea katkestust'):hasLowReliability?'Allikas märgib madalat usaldusväärsust.':'Üks ruut ≈ 1% noortest · aastakeskmine';
  $('hero-year-note').classList.toggle('is-break',isBreak);syncButton();
 }
 function schedule(){
  clear();if(!playing||!inView||document.visibilityState==='hidden')return;
  timer=setTimeout(()=>{timer=null;if(index<observations.length-1){index++;if(index===observations.length-1)playing=false;render(!playing)}else{playing=false;syncButton()}schedule()},flagged(observations[index])?2600:1500);
 }
 button.addEventListener('click',()=>{playing=!playing;if(playing&&index===observations.length-1)index=0;render(true);schedule()});
 slider.addEventListener('input',()=>{playing=false;const year=Number(slider.value);index=observations.reduce((best,r,i)=>Math.abs(r.year-year)<Math.abs(observations[best].year-year)?i:best,0);render(true);schedule()});
 document.addEventListener('visibilitychange',schedule);
 reduced.addEventListener('change',()=>{if(reduced.matches){playing=false;syncButton();schedule()}});
 const observer=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting&&entries[0].intersectionRatio>=.15;schedule()},{threshold:[0,.15]});observer.observe(grid);
 window.addEventListener('pagehide',clear);window.addEventListener('pageshow',schedule);
 render();schedule();
}
