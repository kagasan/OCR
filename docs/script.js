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
	//ここからフォームの情報
	var form = document.forms.fm;
	var wnum = parseInt(form.wnum.value)+1;
	var hnum = parseInt(form.hnum.value)+1;
	//ここまでフォームの情報
	
	//ここから画像準備
	var canvas = document.createElement("canvas");
	var ctx = canvas.getContext('2d');
	function GetColor(R,G,B){
		return "rgb("+R+","+G+","+B+")";
	}
	function DrawBox(x1, y1, x2, y2, color = GetColor(0,0,0), thickness = 0){
		if(thickness<=0){
			ctx.fillStyle = color;
			ctx.fillRect(x1,y1,x2-x1,y2-y1);
		}
		else{
			ctx.lineWidth = thickness;
			ctx.strokeStyle = color;
			ctx.strokeRect(x1,y1,x2-x1,y2-y1);
		}
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
	function DrawString(x, y, s, color = GetColor(0,0,0), size=16, font="メイリオ"){
		ctx.font = ""+size+"px"+" '"+font+"'";
		ctx.fillStyle = color;
		ctx.fillText(s,x,y+size);
	}
	canvas.width = 640;
	canvas.height = 480;
	DrawBox(0,0,canvas.width,canvas.height,GetColor(255,255,255));
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
	//ここまで画像準備
	
	
	//ここから上下左右赤線検出
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
	//ここまで上下左右赤線検出
	
	//ここから赤枠4スミを検出
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
	//ここまで赤枠4スミを検出
	
	//ここから配線検出
	//点1,2間をnに分割したときのid番目の座標(0,1,...,id,...,n-1)
	function idpos(p1, p2, n, id){
		var x = p1[0] + id*(p2[0]-p1[0])/(n-1);
		var y = p1[1] + id*(p2[1]-p1[1])/(n-1);
		var tmp = [x,y];
		return tmp;
	}
	var cct = [];//circuit
	for(var y = 0;y<hnum-1;y++){
		var l = idpos(UL,DL,hnum,y);
		var r = idpos(UR,DR,hnum,y);
		var tmp = [];
		for(var x = 0;x<wnum-1;x++){
			var tmp2 = [0,0];
			var u = idpos(UL,UR,wnum,x);
			var d = idpos(DL,DR,wnum,x);
			var p = intersection(l.concat(r),u.concat(d));
			//DrawCircle(p[0],p[1],5);
			if(y>0){//横方向
				var u2 = idpos(UL,UR,wnum,x+1);
				var d2 = idpos(DL,DR,wnum,x+1);
				var p2 = intersection(l.concat(r),u2.concat(d2));
				var cnt = 0;
				for(var i=0;i<20;i++){
					var p3 = idpos(p, p2, 20, i);
					for(var dx=parseInt(p3[0])-3;dx<=parseInt(p3[0])+3;dx++){
						for(var dy=parseInt(p3[1])-3;dy<=parseInt(p3[1])+3;dy++){
							var idx = (dx + dy * cw) * 4;
							if(data[idx]<150 && data[idx + 1]<150 && data[idx + 2]<150)cnt++;
						}
					}
					
				}
				tmp2[0]=parseInt(cnt*100/980);
			}
			if(x>0){//縦方向
				var l2 = idpos(UL,DL,hnum,y+1);
				var r2 = idpos(UR,DR,hnum,y+1);
				var p2 = intersection(l2.concat(r2),u.concat(d));
				var cnt = 0;
				for(var i=0;i<20;i++){
					var p3 = idpos(p, p2, 20, i);
					for(var dx=parseInt(p3[0])-3;dx<=parseInt(p3[0])+3;dx++){
						for(var dy=parseInt(p3[1])-3;dy<=parseInt(p3[1])+3;dy++){
							var idx = (dx + dy * cw) * 4;
							if(data[idx]<150 && data[idx + 1]<150 && data[idx + 2]<150)cnt++;
						}
					}
				}
				tmp2[1]=parseInt(cnt*100/980);
			}
			tmp.push(tmp2);
		}
		cct.push(tmp);
	}
	//ここまで配線検出
	
	//ここから画像に書き込み
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
	document.getElementById("ocr").innerHTML = "<img src='" + canvas.toDataURL() + "'></br>";
	//ここまで画像に書き込み
	
	
	//ここから回路書き込み
	canvas.width = (wnum-1)*50;
	canvas.height = (hnum-1)*50;
	DrawBox(0,0,canvas.width,canvas.height,GetColor(255,255,255));
	DrawBox(0,0,canvas.width,canvas.height,GetColor(255,0,0),3);
	
	for(var y = 0;y<hnum-1;y++){
		for(var x = 0;x<wnum-1;x++){
			//DrawString(x*50,y*50,""+cct[y][x][0]+","+cct[y][x][1],GetColor(0,0,0),8);
			if(cct[y][x][0]>20){//横方向
				DrawLine(x*50,y*50,(x+1)*50,y*50);
			}
			if(cct[y][x][1]>20){//縦方向
				DrawLine(x*50,y*50,x*50,(y+1)*50);
			}
		}
	}
	
	document.getElementById("circuit").innerHTML = "<img src='" + canvas.toDataURL() + "'></br>";
	//ここまで回路書き込み
}

//ここまで画像読み込みサンプル