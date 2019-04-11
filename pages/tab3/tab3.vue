<template>
	<view class="pageBox" :style="bgStyle">
		<view class="blur"></view>
		<view class="contentBox">
			<view class="songName">{{songName}}</view>
			<view class="author">{{author}}</view>
			<view class="imgBox">
				<image @tap="play" :class="playState?'zhuan':''" v-if="!!songimgurl" :src="songimgurl" ></image>
			</view>
			<view class="tipsTxt">点击封面图片可暂停/播放</view>
			<picker class="pickerBox" @change="bindPickerChange" :value="picker.index" :range="picker.array"><!-- 下面的节点不能换行，不然ios有奇怪bug -->
				<view class="picker" v-if="picker.index>0">
					～～<text>{{picker.array[picker.index]}}</text>后暂停音乐～～
				</view><view class="picker" v-else>
					@点击这里<text>{{picker.array[picker.index]}}</text>时间计时@
				</view>
			</picker>
		</view>
		
		
	</view>
</template>

<script>
	//qq音乐api接口
	let topByRandomUrl = 'https://c.y.qq.com/v8/fcg-bin/fcg_v8_toplist_cp.fcg?g_tk=5381&uin=0&format=json&inCharset=utf-8&outCharset=utf-8%C2%ACice=0&platform=h5&needNewCode=1&tpl=3&page=detail&type=top&topid=36&_=1520777874472';//随机推荐歌曲列表请求地址
	let getImgUrl=function(albumid){//获取歌曲图片封面请求地址
		return `http://imgcache.qq.com/music/photo/album_300/${albumid%100}/300_albumpic_${albumid}_0.jpg`;
	};//"http://imgcache.qq.com/music/photo/album_300/%i/300_albumpic_%i_0.jpg";//图片封面通过albumid拼接； albumid%100, albumid
	let getSongTokenUrl=function(songmid){//获取歌曲token请求地址
		return `https://c.y.qq.com/base/fcgi-bin/fcg_music_express_mobile3.fcg?format=json205361747&platform=yqq&cid=205361747&songmid=${songmid}&filename=C400${songmid}.m4a&guid=126548448`;
	};//https://c.y.qq.com/base/fcgi-bin/fcg_music_express_mobile3.fcg?format=json205361747&platform=yqq&cid=205361747&songmid=003lghpv0jfFXG&filename=C400003lghpv0jfFXG.m4a&guid=126548448
	//songmid可以从歌曲信息中取到，filename根据songmid生成。比如，songmid是003lghpv0jfFXG，则filename就是前缀加上C400，后缀加上.m4a，即C400003lghpv0jfFXG.m4a。其他字段format、platform、cid、guid可以写死，但都是必须的。
	let getSongPlayUrl=function(songmid,token){ //获取歌曲播放地址
		return `http://ws.stream.qqmusic.qq.com/C400${songmid}.m4a?fromtag=0&guid=126548448&vkey=${token}`;
	} //url的path就是上文中用到的filename。参数中的几个字段都是必须的：guid要和请求token时使用的guid保持一致，vkey即token中的vkey字段，fromtag随意指定一个整数，可以写死为0。

	let innerAudioContext = '';
	export default {
		data() {
			return {		
				songList:[],
				allmiao:0,
				nowmiao:0,
				playState:0,//当前播放状态 1播放 0暂停
				audioWay:1, //当前播放模式 1随机 0顺序
				playIndex:0,//当前播放列表的下标
				songmid:'',
				songToken:'',
				songimgurl:'',
				songName:'',
				picker:{
					index:0,
					array:['选择','1分钟','2分钟','5分钟','8分钟','10分钟','15分钟','20分钟','30分钟','40分钟','60分钟']
				},
				pickerTimer:null
			};
		},
		computed:{
			author(){
				if(!!!this.songList||!!!this.songList[this.playIndex]) return '';
				let singerAry=this.songList[this.playIndex].data.singer||[];
				let strAry=[];
				singerAry.forEach((item)=>{
					strAry.push(item.name);
				});
				return strAry.join(',');
			},
			bgStyle:function (){
				if(!!!this.songimgurl) return '';
				return 'background-image:url('+this.songimgurl+')';
			}
		},
		onLoad(option){
			this.getSongListData(()=>{
				this.readyPlay();
			});
		},
		onReady(){
			
		},
		destroyed(){
			try{
				innerAudioContext.destroy();
				innerAudioContext = '';
			}catch(err){}
			
		},
		methods:{
			getSongListData(fn){
				let _this=this;
				uni.showLoading({  
					title: '加载中'  
				});
				let req=uni.request({
					url:topByRandomUrl,
					data:{},
					method:'GET',
					header:{
						'custom-header':'xx',
						'content-type':'application/json'
					},
					dataType:'json',
					success(res) {
						//res.data,statusCode,header
						console.log('request',topByRandomUrl,'res',res);
						if(res.data.code!=0){
							uni.showModal({
								title:'提示',
								content:'请求歌曲列表失败code!=0'
							});
						}
						_this.songList=res.data.songlist||[];
						!!fn&&fn();
					},
					fail() {
						uni.showModal({
							title:'提示',
							content:'请求歌曲列表失败'
						});
					},
					complete() {
						req=null;
						uni.hideLoading();
					}
				});
			},
			getSongToken(fn){
				let _this=this;
				//先查看是否有缓存，是否过期
				if(!!_this.songList[_this.playIndex].data.token){
					if((new Date().getTime()-_this.songList[_this.playIndex].data.ceateTokenTime)<_this.songList[_this.playIndex].data.expiration*1000){//有效期内
						_this.songToken=_this.songList[_this.playIndex].data.token;
						!!fn&&fn();
						return ;
					}
				}
				
				let url=getSongTokenUrl(_this.songmid);
				/* uni.showLoading({  
					title: '加载中'  
				}); */
				let req=uni.request({
					url:url,
					data:{},
					method:'GET',
					header:{
						'custom-header':'xx',
						'content-type':'application/json'
					},
					dataType:'json',
					success(res) {
						//res.data,statusCode,header
						console.log('request',url,'res',res);
						if(res.data.code!=0){
							uni.showModal({
								title:'提示',
								content:'请求歌曲token失败code!=0'
							});
						}
						_this.songToken=res.data.data.items[0].vkey||'';
						_this.songList[_this.playIndex].data.ceateTokenTime=new Date().getTime();//毫秒
						_this.songList[_this.playIndex].data.expiration=res.data.expiration;//token有效时长 秒
						_this.songList[_this.playIndex].data.token=res.data.data.items[0].vkey||'';
						!!fn&&fn();
					},
					fail() {
						uni.showModal({
							title:'提示',
							content:'请求歌曲token失败'
						});
					},
					complete() {
						req=null;
						//uni.hideLoading();
					}
				});
			},
			readyPlay(){
				let _this=this;
				console.log('play:',this.songList[this.playIndex]);
				
				if(!!!_this.songList||_this.songList.length<=0){
					uni.showModal({
						title:'提示',
						content:'当前无歌曲可播放'
					});
					return 0;
				}
				//拿歌曲名
				this.songName=this.songList[this.playIndex].data.songname;
				//拿图片
				this.songimgurl=getImgUrl(this.songList[this.playIndex].data.albumid);
				console.log('songimgurl',this.songimgurl);
				//拿token
				this.songmid=this.songList[this.playIndex].data.songmid||'';
				this.getSongToken(()=>{
					//拿播放地址
					let playsrc=getSongPlayUrl(this.songmid,this.songToken);
					this.playInit(playsrc);
				});
				
				
			},
			playInit(playsrc){
				
				if(innerAudioContext){
					innerAudioContext.destroy();
					innerAudioContext = '';
					this.allmiao=0;
					this.nowmiao=0;
					//销毁====================
				}
				innerAudioContext = uni.createInnerAudioContext();
				innerAudioContext.src = playsrc;//当前播放地址
				innerAudioContext.autoplay = true;
				//获取时长
				let dura = setInterval(()=>{
					this.allmiao = Math.floor(innerAudioContext.duration);
					if(this.allmiao){
						clearInterval(dura);
					}
				});
				//监听事件
				innerAudioContext.onPlay(()=>{
					this.playFunc();
				});
				innerAudioContext.onPause(()=>{
					this.pauseFunc();
				});
				innerAudioContext.onTimeUpdate((e)=>{
					this.nowmiao = Math.floor(innerAudioContext.currentTime);
				});
				innerAudioContext.onEnded(()=>{
					this.nextPlay();
				});
				
			},
			playFunc(){
				this.playState=1;
			},
			pauseFunc(){
				this.playState= 0;
			},
			play(){
				if(!!!innerAudioContext) return;
				if(this.playState){
					//暂停
					innerAudioContext.pause()
				}else{
					//播放
					innerAudioContext.play()
				}
			},
			nextPlay(){
				if(this.audioWay==1){
					//随机
					this.playIndex = Math.floor(Math.random()*10)%this.songList.length;
				}else if(this.audioWay==0){
					//顺序
					if(this.playIndex >= (this.audioList.length-1)){
						this.playIndex = 0;
					}else{
						this.playIndex = this.playIndex+1;
					}
				}//单曲循环
				this.readyPlay();
			},
			bindPickerChange(e){
				this.picker.index=e.detail.value;
				
				clearTimeout(this.pickerTimer);
				this.pickerTimer=null;
				if(this.picker.index!=0){//选择了数值分钟
					if(this.playState==0){//当前暂停了
						this.play();
					}
					this.pickerTimer=setTimeout(()=>{
						this.playState=1;
						this.play();
						clearTimeout(this.pickerTimer);
						this.pickerTimer=null;
						this.picker.index=0;
						uni.showModal({
							title:'提示',
							content:'计时时间已到！'
						});
						
					},parseInt(this.picker.array[this.picker.index],10)*60*1000);
				}
			}
		}
	}
</script>

<style lang="less" scoped>
	.pageBox{
		position: fixed;
		right: 0;
		left: 0;
		width:100%;
		height:100%;
		background-position:center;
		background-repeat: no-repeat;
		background-size:cover;
		z-index: 0;
		.blur{
			position: fixed;
			z-index: 0;
			right: 0;
			left: 0;
			height: 100%;
			width: 100%;
			filter: blur(20upx);
			background: inherit;
		}
	}
	.contentBox{
		position: relative;
		z-index: 1;
		text-align: center;
	}
	.songName{
		margin-top: 50upx;
		margin-bottom: 20upx;
		font-size: 46upx;
		color:#ffffff;
		padding: 0upx 30upx;
		font-weight: bold;
		line-height:1;
	}
	.author{
		margin-bottom: 50upx;
		padding: 0upx 30upx;
		font-size: 34upx;
		color: #ffffff;
		line-height:1;
	}
	.imgBox{
		 margin: 25upx auto;
		 image{
			display: block;
			margin: 0 auto;
			width: 600upx;
			height: 600upx;
			border: solid 16upx rgba(0,0,0,.15);
			border-radius:50%;
			&.zhuan{
				-webkit-transform: scale(1);
				animation: rotation 8s linear infinite;
			}
		 }
	}
	.tipsTxt{
		color: #ffffff;
		font-size: 24upx;
		padding: 10upx 30upx;
	}
	.pickerBox{
		position: relative;
		z-index: 99;
	}
	.picker{
		display: inline-block;
		margin: 25upx auto;
		padding: 8upx 20upx;
		border-radius: 10upx;
		font-size: 30upx;
		color: #ffffff;
		background-color: rgba(0,0,0,.15);
		text{
			font-weight: bold;
		}
	}
</style>
