const menuToggle=document.getElementById('menuToggle');
const mainNav=document.getElementById('mainNav');
menuToggle.addEventListener('click',()=>{const open=mainNav.classList.toggle('open');menuToggle.setAttribute('aria-expanded',String(open));menuToggle.setAttribute('aria-label',open?'Cerrar menú':'Abrir menú');});
mainNav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{mainNav.classList.remove('open');menuToggle.setAttribute('aria-expanded','false');}));
const progress=document.getElementById('scrollProgress');
function updateProgress(){const max=document.documentElement.scrollHeight-window.innerHeight;progress.style.width=`${max>0?window.scrollY/max*100:0}%`;}
window.addEventListener('scroll',updateProgress,{passive:true});updateProgress();
const sections=document.querySelectorAll('main section[id]');const navLinks=document.querySelectorAll('.main-nav a');
if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting)navLinks.forEach(link=>link.classList.toggle('active',link.getAttribute('href')===`#${entry.target.id}`));}),{rootMargin:'-35% 0px -55% 0px'});sections.forEach(section=>observer.observe(section));}
// 07:00 in Culiacán, UTC-07:00. Fixed offset makes the target unambiguous.
const launchAt=new Date('2026-12-02T07:00:00-07:00').getTime();
const units={days:document.getElementById('days'),hours:document.getElementById('hours'),minutes:document.getElementById('minutes'),seconds:document.getElementById('seconds')};
const status=document.getElementById('countdownStatus');
function tick(){let diff=launchAt-Date.now();if(diff<=0){Object.values(units).forEach(el=>el.textContent='00');status.textContent=diff<0?'LANZAMIENTO PROGRAMADO · HORA OBJETIVO SUPERADA':'¡ES MOMENTO DEL LANZAMIENTO!';return;}const d=Math.floor(diff/86400000);diff%=86400000;const h=Math.floor(diff/3600000);diff%=3600000;const m=Math.floor(diff/60000);const s=Math.floor(diff%60000/1000);units.days.textContent=String(d).padStart(2,'0');units.hours.textContent=String(h).padStart(2,'0');units.minutes.textContent=String(m).padStart(2,'0');units.seconds.textContent=String(s).padStart(2,'0');}
tick();setInterval(tick,1000);
// Optional synthesized low-frequency mission ambience; starts only after a user gesture.
const soundButton=document.getElementById('soundToggle');let audioContext=null,oscillators=[],gainNode=null,soundOn=false;
function startAmbience(){const AudioCtx=window.AudioContext||window.webkitAudioContext;if(!AudioCtx)return;audioContext=new AudioCtx();gainNode=audioContext.createGain();gainNode.gain.value=.0001;gainNode.connect(audioContext.destination);const a=audioContext.createOscillator(),b=audioContext.createOscillator();a.type='sawtooth';b.type='sine';a.frequency.value=46;b.frequency.value=54;const low=audioContext.createBiquadFilter();low.type='lowpass';low.frequency.value=115;a.connect(low);b.connect(low);low.connect(gainNode);a.start();b.start();gainNode.gain.setTargetAtTime(.035,audioContext.currentTime,.8);oscillators=[a,b];}
function stopAmbience(){if(!audioContext)return;gainNode.gain.setTargetAtTime(.0001,audioContext.currentTime,.25);const ctx=audioContext;setTimeout(()=>{oscillators.forEach(o=>{try{o.stop()}catch(e){}});ctx.close();audioContext=null;oscillators=[];},1100);}
soundButton.addEventListener('click',()=>{soundOn=!soundOn;if(soundOn){startAmbience();soundButton.setAttribute('aria-pressed','true');soundButton.innerHTML='<span class="sound-icon">♫</span> DESACTIVAR AMBIENTE DE MISIÓN';}else{stopAmbience();soundButton.setAttribute('aria-pressed','false');soundButton.innerHTML='<span class="sound-icon">♫</span> ACTIVAR AMBIENTE DE MISIÓN';}});
