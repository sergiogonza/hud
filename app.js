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

terminal.insertAdjacentHTML("beforeend",
`<div class="terminal-line">${msg}</div>`)

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

text = text.toLowerCase()

let found = new Set()

for(let actor in actors){

actors[actor].forEach(k=>{

if(text.includes(k)){
found.add(actor)
}

})

}

return Array.from(found)

}

/* PROCESS ITEM */

function processItem(item){

let text=(item.title||"")+" "+(item.description||"")

let found=detectActors(text)

if(found.length===0)return

found.forEach(actor=>{

let coords=geo[actor]

if(!coords)return

let risk=riskScore(text)

let tlp=tlpLevel(text)

let prob=probabilityScore(text)

let plaus=plausibilityScore(text)

renderFeedItem(item)

events.push({

title:item.title,
desc:item.description,
img:item.thumbnail || item.enclosure?.link || null,

lat:coords[0],
lng:coords[1],

risk:risk,
tlp:tlp,

prob:prob,
plaus:plaus,

source:item.link

})

})

}

/* LOAD FEEDS */

async function loadFeeds(){

document.getElementById("feeds").innerText = feeds.length

for(const url of feeds){

try{

log("CONNECTING "+url)

const proxy = "https://api.rss2json.com/v1/api.json?rss_url="+encodeURIComponent(url)

const res = await fetch(proxy)

const data = await res.json()

if(!data.items) continue

data.items.forEach(item=>{
processItem(item)
})

log("LOADED "+url)

}catch(e){

log("ERROR "+url)

}

}

renderEvents()
drawProspectiveMatrix()

}

/* RENDER EVENTS */

function renderEvents(){

document.getElementById("events").innerText=events.length

let totalRisk=events.reduce((s,e)=>s+e.risk,0)

document.getElementById("risk").innerText=totalRisk

globe.pointsData(events)

.pointLat(d=>d.lat)
.pointLng(d=>d.lng)
.pointAltitude(d=>0.02 + d.risk*0.01)

.pointColor(d=>{
if(d.tlp==="RED") return "#ff2b2b"
if(d.tlp==="AMBER") return "#ff8c00"
if(d.tlp==="GREEN") return "#00ffa6"
return "#ffaa33"
})

.onPointClick(showPopup)


globe.globeImageUrl(null)
globe.showAtmosphere(false)

const mat = globe.globeMaterial()
mat.color.set('#ff4e42')
mat.wireframe = true

mat.wireframeLinewidth = 0.6

globe
.globeCurvatureResolution(4)


globe.controls().autoRotate = true
globe.controls().autoRotateSpeed = 0.35


}

/* POPUP */

function showPopup(d){

let popup=document.getElementById("eventPopup")

document.getElementById("popupTitle").innerText=d.title

let html=""

if(d.img){

html+=`<img src="${d.img}"
style="width:100%;
filter:grayscale(100%);
margin-bottom:10px">`

}

html+=`

<p>${d.desc}</p>

<div style="margin-top:10px">

TLP: ${d.tlp}<br>

Probability: ${d.prob}<br>

Plausibility: ${d.plaus}

</div>

<a href="${d.source}" target="_blank">
OPEN SOURCE
</a>

`

document.getElementById("popupContent").innerHTML=html

popup.style.display="block"

}

/* AUTO REFRESH */

setInterval(()=>{

log("REFRESHING FEEDS")

events.length = 0
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





function tlpLevel(text){

if(/nuclear|war|attack/i.test(text)) return "RED"

if(/cyber|military|threat/i.test(text)) return "AMBER"

if(/law|bill|policy/i.test(text)) return "GREEN"

return "CLEAR"

}




function probabilityScore(text){

let score=0

if(/war/i.test(text))score+=4
if(/conflict/i.test(text))score+=3
if(/sanctions/i.test(text))score+=2

return score
}

function plausibilityScore(text){

let score=0

if(/report|analysis/i.test(text))score+=3
if(/data|evidence/i.test(text))score+=3

return score
}








function drawProspectiveMatrix(){

const canvas = document.getElementById("prospectiveChart")
const ctx = canvas.getContext("2d")

const w = canvas.width
const h = canvas.height

ctx.clearRect(0,0,w,h)

ctx.strokeStyle="#ff4e42"
ctx.lineWidth=2

/* borde */

ctx.strokeRect(0,0,w,h)

/* linea vertical */

ctx.beginPath()
ctx.moveTo(w/2,0)
ctx.lineTo(w/2,h)
ctx.stroke()

/* linea horizontal */

ctx.beginPath()
ctx.moveTo(0,h/2)
ctx.lineTo(w,h/2)
ctx.stroke()

/* conteo cuadrantes */

let q1=0,q2=0,q3=0,q4=0

events.forEach(e=>{

let prob = e.prob || 2
let plaus = e.plaus || 2

if(prob>=3 && plaus>=3) q1++

else if(prob<3 && plaus>=3) q2++

else if(prob>=3 && plaus<3) q3++

else q4++

})

ctx.fillStyle="#ff4e42"
ctx.font="20px monospace"
ctx.textAlign="center"

/* Q1 */

ctx.fillText(q1, w*0.75, h*0.25)

/* Q2 */

ctx.fillText(q2, w*0.25, h*0.25)

/* Q3 */

ctx.fillText(q3, w*0.75, h*0.75)

/* Q4 */

ctx.fillText(q4, w*0.25, h*0.75)

/* etiquetas */

ctx.font="10px monospace"

ctx.fillText("PLAUSIBILITY ↑", w/2, 12)

ctx.save()
ctx.translate(12,h/2)
ctx.rotate(-Math.PI/2)
ctx.fillText("PROBABILITY →",0,0)
ctx.restore()

}


function closePopup(){
const popup=document.getElementById("eventPopup")
popup.style.display="none"
}




function renderFeedItem(item){

let container

if(item.link?.includes("cyber") || item.link?.includes("cisa")){
container=document.getElementById("cyberFeed")
}
else if(item.link?.includes("bill") || item.link?.includes("parliament")){
container=document.getElementById("billsFeed")
}
else{
container=document.getElementById("intelFeed")
}

const html=`
<div class="feed-item">
<div class="feed-title">${item.title}</div>
<a href="${item.link}" target="_blank">SOURCE</a>
</div>
`

container.insertAdjacentHTML("afterbegin",html)

if(container.children.length>5){
container.removeChild(container.lastChild)
}

}
