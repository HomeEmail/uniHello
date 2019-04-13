<template>
	<view class="pageBox" :style="bgStyle">
		<view class="blur"></view>
		<view class="contentBox">
			<view class="songName">{{songName}}</view>
			<view class="author">{{author}}</view>
			<view class="imgBox">
				<image @tap="play" :class="playState?'zhuan':''" v-if="!!songimgurl" :src="songimgurl" ></image>
			</view>
			<view class="tipsTxt"><!-- 点击封面图片可暂停/播放 --></view>
			<picker class="pickerBox" @change="bindPickerChange" :value="picker.index" :range="picker.array"><!-- 下面的节点不能换行，不然ios有奇怪bug -->
				<view class="picker" v-if="picker.index>0">
					～～<text>{{picker.array[picker.index]}}</text>后将暂停音乐～～
				</view><view class="picker" v-else>
					@点击这里<text>{{picker.array[picker.index]}}</text>时间计时@
				</view>
			</picker>
		</view>
		
		
	</view>
</template>

<script>
	import {topByRandomUrl,getImgUrl,getSongTokenUrl,getSongPlayUrl} from '../../common/apiurl.js';
	

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
				albumName:'',
				picker:{
					index:0,
					array:['选择','1分钟','2分钟','5分钟','8分钟','10分钟','15分钟','20分钟','30分钟','40分钟','60分钟']
				},
				pickerTimer:null,
				isPlayTimeout:0
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
				//this.readyPlay();
				this.nextPlay();
			});
		},
		onReady(){
			
		},
		destroyed(){
			
			// #ifdef H5||MP-ALIPAY||MP-TOUTIAO
			try{
				innerAudioContext.destroy();
				innerAudioContext = '';
			}catch(err){}
			// #endif
			
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
				//拿专辑名
				this.albumName=this.songList[this.playIndex].data.albumname;
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
				
				
				this.allmiao=0;
				this.nowmiao=0;
				
				// #ifdef H5||MP-ALIPAY||MP-TOUTIAO
				try{
					if(innerAudioContext){
						innerAudioContext.destroy(); //
						innerAudioContext = '';
						//销毁====================
					}
				}catch(err){}
				
				innerAudioContext = uni.createInnerAudioContext();//这个退出app就会停止播放
				innerAudioContext.autoplay = true;
				// #endif
				// #ifdef APP-PLUS||MP-WEIXIN||MP-BAIDU||APP-PLUS-NVUE
				try{
					if(innerAudioContext){
						innerAudioContext.stop();
					}
				}catch(e){
					//TODO handle the exception
				}
				innerAudioContext = uni.getBackgroundAudioManager(); //注意背景音乐无销毁事件destroy
				innerAudioContext.title=this.songName;
				innerAudioContext.epname=this.albumName;
				innerAudioContext.singer=this.author;
				innerAudioContext.coverImgUrl=this.songimgurl;
				innerAudioContext.webUrl=playsrc;
				innerAudioContext.onPrev(()=>{ //用户在系统音乐播放面板点击上一曲事件（iOS only）
					this.isPlayTimeout=0;
					this.upPlay();
				});
				innerAudioContext.onNext(()=>{ //用户在系统音乐播放面板点击下一曲事件（iOS only）
					this.isPlayTimeout=0;
					this.nextPlay();
				});
				// #endif
				
				innerAudioContext.src = playsrc;//当前播放地址
				
				/* //获取时长
				let dura = setInterval(()=>{
					this.allmiao = Math.floor(innerAudioContext.duration);
					if(this.allmiao){
						clearInterval(dura);
					}
				}); */
				//监听事件
				innerAudioContext.onPlay(()=>{
					this.playFunc();
				});
				innerAudioContext.onPause(()=>{
					this.pauseFunc();
				});
				innerAudioContext.onTimeUpdate((e)=>{
					this.allmiao = Math.floor(innerAudioContext.duration);
					this.nowmiao = Math.floor(innerAudioContext.currentTime);
				});
				innerAudioContext.onEnded(()=>{
					this.nextPlay();
				});
				innerAudioContext.onWaiting(()=>{
					//音频加载中事件，当音频因为数据不足，需要停下来加载时会触发
					//this.waitingLoad();
				});
				innerAudioContext.onCanplay(()=>{
					uni.hideLoading();
				});
				innerAudioContext.onError((res)=>{
					console.log(res.errMsg);
					console.log(res.errCode);
					uni.hideLoading();
					uni.showModal({
						title:'提示',
						content:'播放歌曲失败'+res.errCode+'||'+res.errMsg
					});
					
				});
				
			},
			playFunc(){
				uni.hideLoading();
				this.playState=1;
			},
			pauseFunc(){
				uni.hideLoading();
				this.playState= 0;
			},
			waitingLoad(){
				uni.showLoading({  
					title: '音频加载中'  
				});
			},
			play(){
				if(!!!innerAudioContext) return;
				if(!!this.isPlayTimeout){
					this.isPlayTimeout=0;//说明不是在时间到提示模式
					this.nextPlay();
					return 0;
				}
				
				if(this.playState){
					//暂停
					innerAudioContext.pause()
				}else{
					//播放
					innerAudioContext.play()
				}
			},
			nextPlay(){
				if(!!this.isPlayTimeout){
					if(this.isPlayTimeout>2){
						return 0;
					}
					this.isPlayTimeout++;
					this.playTimeout();//循环播放提示3次
					return 0;
				}
				
				if(this.audioWay==1){
					//随机
					this.playIndex = Math.floor(Math.random()*this.songList.length)%this.songList.length;
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
			upPlay(){
				if(this.audioWay==1){
					//随机
					this.playIndex = Math.floor(Math.random()*this.songList.length)%this.songList.length;
				}else if(this.audioWay==0){
					//顺序
					if(this.playIndex <= 0){
						this.playIndex = this.audioList.length-1;
					}else{
						this.playIndex = this.playIndex-1;
					}
				}//单曲循环
				this.readyPlay();
			},
			bindPickerChange(e){
				this.picker.index=e.detail.value;
				
				clearTimeout(this.pickerTimer);
				this.pickerTimer=null;
				if(this.picker.index!=0){//选择了数值分钟
					if(!!this.isPlayTimeout){
						this.isPlayTimeout=0;//说明不是在时间到提示模式
						this.nextPlay();
					}
					if(this.playState==0){//当前暂停了
						this.play();
					}
					
					this.pickerTimer=setTimeout(()=>{
						this.playState=1;
						this.play();
						clearTimeout(this.pickerTimer);
						this.pickerTimer=null;
						this.picker.index=0;
						uni.vibrateLong({
							success: function () {
								console.log('success');
							}
						});
						/* setTimeout(()=>{ //第二次震动没效果
							uni.vibrateLong({
								success: function () {
									console.log('success');
								}
							});
						},400); */
						
						this.isPlayTimeout=1;
						this.playTimeout();
						uni.showModal({
							title:'提示',
							content:'计时时间已到！'
						});
						
					},parseInt(this.picker.array[this.picker.index],10)*60*1000);
				}
			},
			playTimeout(){
				let url= 'http://gddx.sc.chinaz.com/Files/DownLoad/sound1/201502/5506.mp3?t='+(new Date().getTime());//'../../static/timeout.mp3?t=';
				this.playInit(url);
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
		display: inline-block;
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
