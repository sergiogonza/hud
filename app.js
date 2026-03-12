const container = document.getElementById("three-container")


const YT_API_KEY = "AIzaSyB3HNhg3UJEoqmayKcJzFET9I2IDEXeYhE"


/* TRUSTED INTEL CHANNELS */
const trustedChannels = [
"CSIS",
"Atlantic Council",
"Royal United Services Institute",
"RUSI",
"Center for Strategic",
"Brookings",
"Council on Foreign Relations"
]

/* GLOBE */

const globe = Globe()(container)
.globeImageUrl(null)
.bumpImageUrl(null)
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


/* FEEDS QUE APARECEN EN EL GLOBO */
const globeFeeds = [
"https://resurgamhub.org/feed.xml",
"https://warontherocks.com/feed/",
"https://bills.parliament.uk/rss/allbills.rss",
"https://www.govinfo.gov/rss/bills.xml"
]



/* ACTOR KEYWORDS */

const actors = {

  china:["china","beijing","pla","ccp"],
  russia:["russia","kremlin","moscow"],
  usa:["united states","washington","pentagon"],
  iran:["iran","tehran","irgc"],
  nato:["nato"],
  eu:["european union","brussels"],
  northkorea:["north korea","pyongyang"],
  taiwan:["taiwan"],
  israel:["israel","idf","tel aviv"],
  uk:["united kingdom","britain","london"]

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
let intelEvents=[]

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

let text = (item.title || "") + " " + (item.description || "")

/* DETECTAR SI ES FEED DE INTELIGENCIA */

if(
item.feedSource.includes("warontherocks") ||
item.feedSource.includes("resurgamhub")
){
intelEvents.push({
title: item.title,
description: item.description
})
}

/* FECHA */

let year = new Date(item.pubDate || Date.now()).getFullYear()

/* ACTORES DETECTADOS */

let found = detectActors(text)

/* SI EL FEED DEBE IR AL GLOBO */

let showOnGlobe = globeFeeds.includes(item.feedSource)

/* SI NO SE DETECTA ACTOR → EVENTO ALEATORIO */

if(found.length === 0){

let randomLat = (Math.random()*140) - 70
let randomLng = (Math.random()*360) - 180

events.push({
year: year,
title: item.title,
desc: item.description,
img:
item.thumbnail ||
item.enclosure?.url ||
item.media?.content ||
null,
lat: randomLat,
lng: randomLng,
risk: riskScore(text),
tlp: tlpLevel(text),
prob: probabilityScore(text),
plaus: plausibilityScore(text),
source: item.link
})

renderFeedItem(item)
return
}

/* EVENTOS POR ACTOR */

found.forEach(actor=>{

let coords = geo[actor]
if(!coords) return

let risk = riskScore(text)
let tlp = tlpLevel(text)
let prob = probabilityScore(text)
let plaus = plausibilityScore(text)

renderFeedItem(item)

if(showOnGlobe){

events.push({
year: year,
title: item.title,
desc: item.description,
img:
item.thumbnail ||
item.enclosure?.url ||
item.media?.content ||
null,
lat: coords[0],
lng: coords[1],
risk: risk,
tlp: tlp,
prob: prob,
plaus: plaus,
source: item.link
})

}

})

}







/* LOAD FEEDS */

async function loadFeeds(){

  document.getElementById("intelFeed").innerHTML=""
  document.getElementById("cyberFeed").innerHTML=""
  document.getElementById("billsFeed").innerHTML=""


document.getElementById("feeds").innerText = feeds.length

for(const url of feeds){

try{

log("CONNECTING "+url)


const proxy = "https://api.allorigins.win/raw?url=" + encodeURIComponent(url)
const res = await fetch(proxy)


const xmlText = await res.text()

const parser = new DOMParser()
const xml = parser.parseFromString(xmlText,"text/xml")



const items = xml.querySelectorAll("item")

items.forEach(node=>{

const item={
title:node.querySelector("title")?.textContent,
description:node.querySelector("description")?.textContent,
link:node.querySelector("link")?.textContent,
pubDate:node.querySelector("pubDate")?.textContent,
thumbnail: node.querySelector("media\\:thumbnail")?.getAttribute("url"),
media: {
content: node.querySelector("media\\:content")?.getAttribute("url")
},
enclosure: {
url: node.querySelector("enclosure")?.getAttribute("url")
},
feedSource:url
}

processItem(item)

})




log("LOADED "+url)

}catch(e){

log("ERROR "+url)

}

}

renderEvents()
drawProspectiveMatrix()
loadIntelVideos()
buildLinkAnalysis()

}

/* RENDER EVENTS */

function renderEvents(){

document.getElementById("events").innerText=events.length

let totalRisk=events.reduce((s,e)=>s+e.risk,0)

document.getElementById("risk").innerText=totalRisk





globe.htmlElementsData(events)
.htmlElement(d => {

const el = document.createElement("div")
el.className = "map-hotspot"

el.style.width = "10px"
el.style.height = "10px"
el.style.borderRadius = "50%"
el.style.cursor = "pointer"

/* COLOR SEGUN TLP */

if(d.tlp === "RED"){
el.style.background = "rgba(255,60,60,0.65)"
el.style.boxShadow = "0 0 6px rgba(255,60,60,0.5)"
el.style.width="12px"
el.style.height="12px"
}

else if(d.tlp === "AMBER"){
el.style.background = "rgba(255,140,0,0.55)"
el.style.boxShadow = "0 0 5px rgba(255,140,0,0.45)"
el.style.width="10px"
el.style.height="10px"
}

else{
el.style.background = "rgba(255,255,255,0.18)"
el.style.boxShadow = "0 0 3px rgba(255,255,255,0.15)"
}

el.onclick = () => showPopup(d)

return el
})




globe.globeImageUrl(null)
globe.showAtmosphere(false)

const mat = globe.globeMaterial()
mat.color.set('#ffffff')
mat.opacity = 0.02
mat.transparent = true
mat.wireframe = true
mat.wireframeLinewidth = 0.3



globe
.globeCurvatureResolution(3)


globe.controls().autoRotate = true
globe.controls().autoRotateSpeed = 0.35




globe
.hexPolygonsData([])
.hexPolygonResolution(3)
.hexPolygonMargin(0.7)



globe
.showAtmosphere(true)
.atmosphereColor("rgba(255,255,255,0.15)")
.atmosphereAltitude(0.04)


}

/* POPUP */

function showPopup(d){

let popup=document.getElementById("eventPopup")

document.getElementById("popupTitle").innerText=d.title

let html=""


if(d.img){
html+=`<img src="${d.img}" class="popup-img">`
}

html+=`

<div class="popup-meta">

<div class="meta-row">
<span class="meta-label">TLP</span>
<span class="meta-value tlp-${d.tlp}">${d.tlp}</span>
</div>

<div class="meta-row">
<span class="meta-label">PROBABILITY</span>
<span class="meta-value">${d.prob}</span>
</div>

<div class="meta-row">
<span class="meta-label">PLAUSIBILITY</span>
<span class="meta-value">${d.plaus}</span>
</div>

</div>

<div class="popup-desc">
${(d.desc || "").replace(/<a[^>]*>(.*?)<\/a>/g,'$1')}
</div>

<a class="popup-link" href="${d.source}" target="_blank">
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
intelEvents.length = 0
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




ctx.fillStyle="#9fb3c8"
ctx.font="9px monospace"

/* Q1 */
ctx.fillText("ESCALATION SCENARIO", w*0.75, h*0.25 + 18)

/* Q2 */
ctx.fillText("STRATEGIC TENSION", w*0.25, h*0.25 + 18)

/* Q3 */
ctx.fillText("FLASHPOINT RISK", w*0.75, h*0.75 + 18)

/* Q4 */
ctx.fillText("LOW SIGNAL", w*0.25, h*0.75 + 18)




ctx.fillStyle="#8aa0b5"
ctx.font="8px monospace"

ctx.fillText("HIGH PLAUSIBILITY", w/2, 10)
ctx.fillText("LOW PLAUSIBILITY", w/2, h-6)

ctx.save()
ctx.translate(6,h/2)
ctx.rotate(-Math.PI/2)
ctx.fillText("LOW PROBABILITY",0,0)
ctx.restore()

ctx.save()
ctx.translate(w-6,h/2)
ctx.rotate(Math.PI/2)
ctx.fillText("HIGH PROBABILITY",0,0)
ctx.restore()


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

if(prob>=3 && plaus>=3) q1 += e.risk

else if(prob<3 && plaus>=3) q2 += e.risk

else if(prob>=3 && plaus<3) q3 += e.risk

else q4 += e.risk

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

if(item.link.includes("cisa") ||
   item.link.includes("sans") ||
   item.link.includes("cyber")){
container=document.getElementById("cyberFeed")
}

else if(item.link.includes("bill") ||
        item.link.includes("parliament") ||
        item.link.includes("govinfo")){
container=document.getElementById("billsFeed")
}

else{
container=document.getElementById("intelFeed")
}

if(!container) return

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







function filterByYear(year){

let filtered = events.filter(e=>e.year<=year)

globe.htmlElementsData(filtered)

drawProspectiveMatrix()

}



document.getElementById("timeline").addEventListener("input",e=>{

let year=e.target.value

filterByYear(year)

})





function getFeedKeywords(){

if(!events || events.length===0){
return "geopolitics intelligence briefing"
}

let text=""

events.slice(0,5).forEach(e=>{
text += " " + (e.title || "")
})

return text
}




async function loadIntelVideos(){

let query = getFeedKeywords()

log("YOUTUBE SEARCH: "+query)

try{

let url=`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&videoEmbeddable=true&maxResults=8&key=${YT_API_KEY}`

let res = await fetch(url)

let data = await res.json()

if(!data.items || data.items.length===0){
log("NO VIDEOS FOUND")
return
}

/* VIDEO PRINCIPAL (prioriza think tanks) */

let first=null

for(let v of data.items){

let channel=v.snippet.channelTitle

let trusted=trustedChannels.some(c =>
channel.toLowerCase().includes(c.toLowerCase())
)

if(trusted){
first=v.id.videoId
break
}

}

if(!first){
first=data.items[0].id.videoId
}

/* MOSTRAR VIDEO PRINCIPAL */

document.getElementById("mainVideo").innerHTML=
`
<iframe
src="https://www.youtube.com/embed/${first}"
allowfullscreen>
</iframe>
`

/* LISTA DE VIDEOS */

let html=""

data.items.forEach(v=>{

if(!v.id.videoId) return

let vid=v.id.videoId
let title=v.snippet.title
let thumb=v.snippet.thumbnails.medium.url
let channel=v.snippet.channelTitle

let trusted=trustedChannels.some(c =>
channel.toLowerCase().includes(c.toLowerCase())
)

if(!trusted) return

html+=`
<div class="video-item" onclick="playVideo('${vid}')">
<img src="${thumb}">
<div class="video-title">${title}</div>
<div class="video-channel">${channel}</div>
</div>
`

})

document.getElementById("videoList").innerHTML=html

}catch(e){

console.error(e)

log("YOUTUBE ERROR")

}

}




function playVideo(id){

document.getElementById("mainVideo").innerHTML=
`
<iframe
src="https://www.youtube.com/embed/${id}"
allowfullscreen>
</iframe>
`

}






function getTopIntelEvent(){

let intel = events.filter(e =>
e.source.includes("warontherocks") ||
e.source.includes("resurgamhub")
)

if(intel.length===0) return null

intel.sort((a,b)=>b.risk-a.risk)

return intel[0]

}



function buildLinkAnalysis(){

let event = getTopIntelEvent()

if(!event) return

let text = (event.title + " " + event.desc).toLowerCase()

let nodes=[]
let edges=[]

/* nodo central */

nodes.push({
id:1,
label:event.title.substring(0,40),
group:"event"
})

let id=2

for(let actor in actors){

actors[actor].forEach(k=>{

if(text.includes(k)){

nodes.push({
id:id,
label:actor.toUpperCase(),
group:"actor"
})

edges.push({
from:1,
to:id
})

id++

}

})

}

/* agregar tipo de evento */

if(event.risk>7){

nodes.push({
id:id,
label:"ESCALATION",
group:"risk"
})

edges.push({from:1,to:id})

}
else{

nodes.push({
id:id,
label:"TENSION",
group:"risk"
})

edges.push({from:1,to:id})

}

renderLinkGraph(nodes,edges)

}





function renderLinkGraph(nodes,edges){

var container = document.getElementById("mynetwork")

var data={
nodes:nodes,
edges:edges
}

var options={

layout:{
improvedLayout:true
},

physics:{
solver:"forceAtlas2Based",
stabilization:false
},

nodes:{
font:{
color:"#ffffff"
},
size:25
},

edges:{
color:"#9fb3c8"
},

groups:{

event:{
shape:"dot",
color:"#ff4e42",
size:30
},

actor:{
shape:"dot",
color:"#9fb3c8"
},

risk:{
shape:"dot",
color:"#ff9d00"
}

}

}

new vis.Network(container,data,options)

}
