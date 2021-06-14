var ativo=false;
var audio = null;
var radioAtiva="http://jbmedia-edge1.cdnstream.com/1power?aw_0_req.gdpr=true";
var radioAtivaNome="Power";
var radios = [
	{"nome":"Power","url":"http://jbmedia-edge1.cdnstream.com/1power?aw_0_req.gdpr=true"},
	{"nome":"Hot Jamz","url":"http://jbmedia-edge1.cdnstream.com/hot108?aw_0_req.gdpr=true"},
	{"nome":"DEFJAY","url":"http://icepool.silvacast.com/DEFJAY.mp3"},
	{"nome":"BIGFM RAP US","url":"http://streams.bigfm.de/bigfm-usrap-128-aac?usid=0-0-L-A-A-06"},
	{"nome":"Hotmixradio Hip Hop","url":"http://streamingads.hotmixradio.fm/hotmixradio-hiphop-128.mp3"},
	{"nome":"Generation Hip Hop","url":"http://gene-wr10.ice.infomaniak.ch/gene-wr10.mp3"},
	{"nome":".997 HH/RNB","url":"http://7609.live.streamtheworld.com/977_JAMZ_SC"},
	{"nome":"FM Old School","url":"http://uplink.181.fm:8068/"},
	{"nome":"FM The Beat (HH/RNB)","url":"http://uplink.181.fm:8054/"},
	{"nome":"FM The Box (Urban)","url":"http://uplink.181.fm:8024/"},
	{"nome":"Mango Radio","url":"https://mangoradio.stream.laut.fm/mangoradio?t302=2020-04-21_13-36-24&uuid=8cd318e1-b11f-43fa-93e9-73c7ed5aa004"},
	{"nome":"Antena1","url":"https://stream.antena1.com.br/stream5"},	
	
];

window.audioStates = {};

if (localStorage.getItem("radios")) {
	radios=JSON.parse(localStorage.getItem("radios"));
}
if (localStorage.getItem("radioAtiva")) {
	radioAtiva=localStorage.getItem("radioAtiva");
}
if (localStorage.getItem("radioAtivaNome")) {
	radioAtivaNome=localStorage.getItem("radioAtivaNome");
}

chrome.browserAction.onClicked.addListener(function(tab) {

  if (ativo){
	  ativo=false;
	  if (audio!=null)
		  audio.pause();
  }else{
	ativo=true;
	tocarRadio(radioAtiva);

  }
  atualizaIcone();
  montaMenu();
});

function atualizaIcone(){
  if (ativo){
	chrome.browserAction.setIcon({ path:"debuggerPause.png"});
    chrome.browserAction.setTitle({title:"Pausar rádio "+radioAtivaNome});  
  }else{
	  chrome.browserAction.setIcon({path:"debuggerContinue.png"});
	  chrome.browserAction.setTitle({title:"Tocar rádio "+radioAtivaNome});
  }
  
}

function montaMenu(){
	chrome.contextMenus.removeAll();
	var pai=undefined;
	if (radios.length+2>chrome.contextMenus.ACTION_MENU_TOP_LEVEL_LIMIT){
		chrome.contextMenus.create({
			  id: "__",
			  enabled:false,
			  title: "Tocando agora: "+radioAtivaNome,
			  contexts: ["browser_action"]
		});
		chrome.contextMenus.create({
		  id: "#",
		  title: "Lista de Radios",
		  contexts: ["browser_action"]
		});
		pai="#";
	}
	for (var i=0;i<radios.length;i++){
		var url = radios[i].url;
		var aux=false;
		if (url===radioAtiva)
			aux=true;
		chrome.contextMenus.create({
			  parentId: pai,
			  id: ""+i,
			  type:"radio",
			  checked:aux,
			  title: radios[i].nome,
			  contexts: ["browser_action"]
		});
	}
	
	
	chrome.contextMenus.create({
		  id: "+",
		  title: "Incluir Radio",
		  contexts: ["browser_action"]
	});
	chrome.contextMenus.create({
		  id: "=",
		  enabled:false,
		  title: "Volume: "+audio?.volume.toFixed(1)+" Ctrl+Shift+0 e Ctrl+Shift+9 ",
		  contexts: ["browser_action"]
	});
	chrome.contextMenus.create({
		  id: "-",
		  enabled:false,
		  title: "Próxima rádio: Ctrl+Shift+8 ",
		  contexts: ["browser_action"]
	});//DJB-28/12/2020
}
chrome.commands.onCommand.addListener(function(command) {
	console.log('Command:', command);
	if (command==="volumeMais"){
		if (audio!=null){
			if (audio.volume<1)
				audio.volume=audio.volume+0.1;
		}
		montaMenu();
	}
	if (command==="volumeMenos"){
		if (audio!=null){
			if (audio.volume>0.1)
				audio.volume=audio.volume-0.1;
		}
		montaMenu();
	}
	
	if (command==="proximaRadio"){
		if (audio!=null){
			audio.pause();
			tocaProximaradio();
		}
		montaMenu();
	}
	
	if (command==="volumeMaisAba"){
		volumeAba('+');
	}
	if (command==="volumeMenosAba"){
		volumeAba('-');
	}
		
});
function tocaProximaradio(){//DJB-28/12/2020
	for (var i=0;i<radios.length;i++){
		var url = radios[i].url;
		var aux=false;
		if (url===radioAtiva){
			if (i==radios.length-1)
				chamatocar(radios[0].url,radios[0].nome);
			else
				chamatocar(radios[i+1].url,radios[i+1].nome);
			break;
		}
	}
}
function volumeAba(comando){
	var constraints = {
           audio: true,
           video: false,
           audioConstraints: {mandatory:{chromeMediaSource: 'tab'}}
    };
	//precisa ver se tem como fazer aceitar os atalhos direto, sem precisar interagir com a aba (já que activeTab exige isso)
	//precisa ajustar pra armazenar as abas num array, pra evitar o erro:  Cannot capture a tab with an active stream.
	chrome.tabCapture.capture(constraints,function(stream){
		console.log(stream);
		
		var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
		var gainNode = audioCtx.createGain();
		gainNode.gain.value = 0.5;
		var currGain = gainNode.gain.value;
		var source;
		source = audioCtx.createMediaStreamSource(stream);
		source.connect(gainNode);
		gainNode.connect(audioCtx.destination);
		
		if (comando=='-'){
			if (currGain>0.1){
				currGain-=0.1;
				gainNode.gain.setValueAtTime(currGain, audioCtx.currentTime+1);
			}
		}else{
			currGain+=0.1;
			gainNode.gain.setValueAtTime(currGain, audioCtx.currentTime+1);
		}
	});
}
chrome.contextMenus.onClicked.addListener(function (info){
	console.log(info);
	if (info.menuItemId==="+"){
		var url = prompt("Qual a url do stream da radio?","");
		if (url){
			var nome=prompt("Informe um nome para a radio","");
			if (nome){
			}else
				nome=url;
			var o = new Object();
			o.nome=nome;
			o.url=url;
			radios.push(o);
			localStorage.setItem("radios", JSON.stringify(radios));
			montaMenu();
		}
	}else
		chamatocar(radios[info.menuItemId].url,radios[info.menuItemId].nome)
});

function chamatocar(url,nome){
	radioAtiva=url;
	radioAtivaNome=nome;
	tocarRadio(url);
	montaMenu();
	atualizaIcone();
	localStorage.setItem("radioAtiva", radioAtiva);
	localStorage.setItem("radioAtivaNome", radioAtivaNome);
	
}
function tocarRadio(url){
	if (audio==null){
		audio = new Audio(url);
		audio.volume=0.5;
	}else{ 
		audio.pause();
		audio.src=url;
		audio.load();
	}
	if (ativo)
		audio.play();
}
montaMenu();
atualizaIcone();