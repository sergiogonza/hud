const container = document.getElementById("three-container")

/* GLOBE */

const globe = Globe()(container)
.globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
.bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
.backgroundColor('rgba(0,0,0,0)')

/* RSS FEEDS */

const feeds = [

"https://isc.sans.edu/rssfeed.xml",
"https://warontherocks.com/feed/",
"https://www.cisa.gov/cybersecurity-advisories/all.xml",
"https://www.europarl.europa.eu/rss/doc/press-releases/en.xml",
"https://bills.parliament.uk/rss/allbills.rss",
"https://www.govinfo.gov/rss/bills.xml",
"https://www.govinfo.gov/rss/bills-enr.xml",
"https://www.federalreserve.gov/feeds/press_monetary.xml",
"https://resurgamhub.org/feed.xml"

]

/* ACTOR KEYWORDS */

const actors = {

china:["china","beijing"],
russia:["russia","kremlin"],
usa:["united states","washington"],
iran:["iran"],
nato:["nato"],
eu:["european union"],
northkorea:["north korea"]

}

/* GEO DATABASE */

const geo = {

china:[35,103],
russia:[61,105],
usa:[38,-97],
iran:[32,53],
nato:[50,10],
eu:[50,10],
northkorea:[40,127]

}

let events=[]

/* TERMINAL */

function log(msg){

let terminal=document.getElementById("terminal")

terminal.innerHTML+=`<div class="terminal-line">${msg}</div>`

terminal.scrollTop=terminal.scrollHeight

}

/* RISK SCORE */

function riskScore(text){

let score=0

if(text.match(/war|conflict|attack/i))score+=5
if(text.match(/nuclear/i))score+=8
if(text.match(/military/i))score+=4
if(text.match(/sanctions/i))score+=3

return score

}

/* DETECT ACTORS */

function detectActors(text){

let found=[]

for(let actor in actors){

actors[actor].forEach(k=>{
if(text.toLowerCase().includes(k))found.push(actor)
})

}

return found

}

/* PROCESS ITEM */

function processItem(item){

let text=(item.title||"")+" "+(item.contentSnippet||"")

let found=detectActors(text)

if(found.length===0)return

found.forEach(actor=>{

let coords=geo[actor]

if(!coords)return

let risk=riskScore(text)

events.push({

title:item.title,
desc:item.contentSnippet,
img:item.enclosure?.url,
lat:coords[0],
lng:coords[1],
risk:risk,
source:item.link

})

})

}

/* LOAD FEEDS */

async function loadFeeds(){

const parser=new RSSParser()

document.getElementById("feeds").innerText=feeds.length

for(const url of feeds){

try{

log("CONNECTING "+url)

const proxy="https://api.allorigins.win/raw?url="+encodeURIComponent(url)

const feed=await parser.parseURL(proxy)

feed.items.forEach(item=>{

processItem(item)

})

}catch(e){

log("ERROR "+url)

}

}

renderEvents()

}

/* RENDER EVENTS */

function renderEvents(){

document.getElementById("events").innerText=events.length

let totalRisk=events.reduce((s,e)=>s+e.risk,0)

document.getElementById("risk").innerText=totalRisk

globe.pointsData(events)

.pointLat(d=>d.lat)
.pointLng(d=>d.lng)
.pointAltitude(d=>d.risk/20)
.pointColor(d=> d.risk>6 ? "#ff4e42":"#ffb3ab")

.onPointClick(showPopup)

}

/* POPUP */

function showPopup(d){

let popup=document.getElementById("eventPopup")

document.getElementById("popupTitle").innerText=d.title

let html=""

if(d.img){

html+=`<img src="${d.img}" style="width:100%;filter:grayscale(100%);margin-bottom:10px">`

}

html+=`<p>${d.desc}</p>`

html+=`<a href="${d.source}" target="_blank">OPEN SOURCE</a>`

document.getElementById("popupContent").innerHTML=html

popup.style.display="block"

}

function closePopup(){

document.getElementById("eventPopup").style.display="none"

}

/* AUTO REFRESH */

setInterval(()=>{

log("REFRESHING FEEDS")

events=[]

loadFeeds()

},300000)

/* INITIAL LOAD */

loadFeeds()

/* PANEL DRAGGING */

let offsetX,offsetY,currentPanel

document.querySelectorAll(".draggable").forEach(panel=>{

const header=panel.querySelector(".panel-header")

header.addEventListener("mousedown",startDrag)

})

function startDrag(e){

currentPanel=e.target.closest(".draggable")

offsetX=e.clientX-currentPanel.offsetLeft
offsetY=e.clientY-currentPanel.offsetTop

document.addEventListener("mousemove",drag)
document.addEventListener("mouseup",stopDrag)

}

function drag(e){

if(!currentPanel)return

currentPanel.style.position="absolute"

currentPanel.style.left=(e.clientX-offsetX)+"px"
currentPanel.style.top=(e.clientY-offsetY)+"px"

}

function stopDrag(){

document.removeEventListener("mousemove",drag)
document.removeEventListener("mouseup",stopDrag)

currentPanel=null

}

/* MINIMIZE PANEL */

function minimizePanel(btn){

let panel=btn.closest(".draggable")

panel.classList.toggle("minimized")

}
