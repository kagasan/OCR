//ここから画像ファイル読み込み用
var img = new Image();

window.onload = function(){
	//ファイルを選択したときの処理を追加しておく
	document.getElementById("selectfile").addEventListener("change", 
		function(evt){
			var file = evt.target.files;
			var reader = new FileReader();
			reader.readAsDataURL(file[0]);
			reader.onload = function(){
				img.src = reader.result;
			}
		},
	false);
	
};
//ここまで画像ファイル読み込み用




function ocr(){
	//フォームの情報
	var form = document.forms.fm;
	var wnum = parseInt(form.wnum.value)+1;
	var hnum = parseInt(form.hnum.value)+1;
	
	var canvas = document.createElement("canvas");
	var ctx = canvas.getContext('2d');
	function GetColor(R,G,B){
		return "rgb("+R+","+G+","+B+")";
	}
	function DrawLine(x1, y1, x2, y2, color = GetColor(0,0,0), thickness = 1){
		ctx.lineWidth = thickness;
		ctx.strokeStyle=color;
		ctx.beginPath();
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);
		ctx.stroke();
	}
	function DrawCircle(x, y, r, color = GetColor(0,0,0), thickness = -1){
		if(thickness<=0){
			ctx.fillStyle = color;
			ctx.beginPath();
			ctx.arc(x, y, r, 0, Math.PI*2, true);
			ctx.fill();
		}
		else{
			ctx.strokeStyle=color;
			ctx.lineWidth = thickness;
			ctx.beginPath();
			ctx.arc(x, y, r, 0, Math.PI*2, false);
			ctx.stroke();
		}
	}
	canvas.width = 640;
	canvas.height = 480;
	ctx.fillStyle = "rgb(255,255,255)";
	ctx.fillRect(0,0,canvas.width,canvas.height);
	var iw = img.width;
	var ih = img.height;
	var cw = canvas.width;
	var ch = canvas.height;
	
	if(iw*ch/ih>cw){
		ctx.drawImage(img,0,ch/2-ih*cw/iw/2,cw,ih*cw/iw);
		iw = cw;
		ih = ih*cw/iw;
	}
	else{
		ctx.drawImage(img,cw/2-iw*ch/ih/2,0,iw*ch/ih,ch);
		iw = iw*ch/ih;
		ih = ch;
	}
	var Data = ctx.getImageData(0, 0, canvas.width, canvas.height);
	var data = Data.data;
	
	//x1,y1,x2,y2,score
	var L = 20;
	var UDLR = [
		[0,0,0,0,-1],
		[0,0,0,0,-1],
		[0,0,0,0,-1],
		[0,0,0,0,-1]
	];
	
	for(var y1 = 0;y1<ch/2;y1++){
		for(var y2 = y1-L;y2<y1+L;y2++){
			if(y2<0 || ch/2<=y2)continue;
			var cnt=0;
			for(var x=0;x<cw;x++){
				var y = parseInt(0.0 + y1+x*(y2-y1)/cw);
				var idx = (x + y * cw) * 4;
				if(data[idx]>150 && data[idx + 1]<100 && data[idx + 2]<100)cnt++;
			}
			if(cnt>UDLR[0][4])UDLR[0]=[0,y1,cw,y2,cnt];
		}
	}
	for(var y1 = ch/2;y1<ch;y1++){
		for(var y2 = y1-L;y2<y1+L;y2++){
			if(y2<ch/2 || ch<=y2)continue;
			var cnt=0;
			for(var x=0;x<cw;x++){
				var y = parseInt(0.0 + y1+x*(y2-y1)/cw);
				var idx = (x + y * cw) * 4;
				if(data[idx]>150 && data[idx + 1]<100 && data[idx + 2]<100)cnt++;
			}
			if(cnt>UDLR[1][4])UDLR[1]=[0,y1,cw,y2,cnt];
		}
	}
	for(var x1 = 0;x1<cw/2;x1++){
		for(var x2 = x1-L;x2<x1+L;x2++){
			if(x2<0 || cw/2<=x2)continue;
			var cnt = 0;
			for(var y=0;y<ch;y++){
				var x = parseInt(0.0+x1+y*(x2-x1)/ch);
				var idx = (x + y * cw) * 4;
				if(data[idx]>150 && data[idx + 1]<100 && data[idx + 2]<100)cnt++;
			}
			if(cnt>UDLR[2][4])UDLR[2]=[x1,0,x2,ch,cnt];
		}
	}
	for(var x1 = cw/2;x1<cw;x1++){
		for(var x2 = x1-L;x2<x1+L;x2++){
			if(x2<cw/2 || cw<=x2)continue;
			var cnt = 0;
			for(var y=0;y<ch;y++){
				var x = parseInt(0.0+x1+y*(x2-x1)/ch);
				var idx = (x + y * cw) * 4;
				if(data[idx]>150 && data[idx + 1]<100 && data[idx + 2]<100)cnt++;
			}
			if(cnt>UDLR[3][4])UDLR[3]=[x1,0,x2,ch,cnt];
		}
	}
	
	function intersection(p1, p2){
		var d1x = 0.0 + p1[2] - p1[0];
		var d1y = 0.0 + p1[3] - p1[1];
		var d1sz = Math.sqrt(d1x*d1x+d1y*d1y);
		d1x/=d1sz;
		d1y/=d1sz;
		
		var d2x = 0.0 + p2[2] - p2[0];
		var d2y = 0.0 + p2[3] - p2[1];
		var d2sz = Math.sqrt(d2x*d2x+d2y*d2y);
		d2x/=d2sz;
		d2y/=d2sz;
		
		var t = 1/(d2x*d1y-d1x*d2y)*((p1[0]-p2[0])*d1y-(p1[1]-p2[1])*d1x);
		var tmp = [p2[0]+t*d2x,p2[1]+t*d2y];
		return tmp;
	}
	
	var UL = intersection(UDLR[0],UDLR[2]);
	var UR = intersection(UDLR[0],UDLR[3]);
	var DL = intersection(UDLR[1],UDLR[2]);
	var DR = intersection(UDLR[1],UDLR[3]);
	
	for(var i=0;i<hnum;i++){
		DrawLine(
			UL[0]+i*(DL[0]-UL[0])/(hnum-1),UL[1]+i*(DL[1]-UL[1])/(hnum-1),
			UR[0]+i*(DR[0]-UR[0])/(hnum-1),UR[1]+i*(DR[1]-UR[1])/(hnum-1),
			(i==0 || i+1==hnum?GetColor(255,0,0):GetColor(0,0,255)),3
		);
	}
	for(var i=0;i<wnum;i++){
		DrawLine(
			UL[0]+i*(UR[0]-UL[0])/(wnum-1),UL[1]+i*(UR[1]-UL[1])/(wnum-1),
			DL[0]+i*(DR[0]-DL[0])/(wnum-1),DL[1]+i*(DR[1]-DL[1])/(wnum-1),
			(i==0 || i+1==wnum?GetColor(255,0,0):GetColor(0,0,255)),3
		);
	}
	
	
	var dataurl = canvas.toDataURL();
	document.getElementById("ocr").innerHTML = "<img src='" + dataurl + "'></br>";
	document.getElementById("circuit").innerHTML = "<img src='" + dataurl + "'></br>";
}

//ここまで画像読み込みサンプル