<template>
	<view class="content">
		<view class="h1">今天天气</view>
		
		<view class="p1">{{weather.cityName}} {{weather.type}} {{weather.fx}} {{weather.fl}}</view>
		<view class="p1">日期:{{weather.ymd}} {{weather.week}}</view>
		<view class="p1">当前温度:{{weather.wendu}}</view>
		<view class="p1">{{weather.high}}</view>
		<view class="p1">{{weather.low}}</view>
		<view class="p1">湿度:{{weather.shidu}}</view>
		<view class="p1">空气质量:{{weather.quality}}</view>
		<view class="p1">PM2.5:{{weather.pm25}}</view>
		<view class="p1">感冒指数:{{weather.ganmao}}</view>
		<view class="h1">未来天气</view>
		<view class="p1" v-for="(item,i) in weatherForecast" :key="i">
			<text>
				{{i+1}}.日期:{{item.ymd}} {{item.week}} {{item.type}} {{item.high}} {{item.low}} {{item.fx}} {{item.fl}}
			</text>
		</view>
		
	</view>
</template>

<script>
	import _city from '../../common/_city.json';
	import commonVar from '../../common/common.js';
	import amap from '../../common/amap-wx.js';
	
	export default {
		data() {
			return {
				loading: false,
				amapPlugin:null,
				cityName:'',
				cityCode:'',
				weather:{
					cityName:'',
					shidu:'',
					pm25:'',
					quality:'',
					wendu:'',
					ganmao:'',
					type:'',
					high:'',
					low:'',
					fx:'',
					fl:'',
					ymd:'',
					week:'',
					forecast:[
						/* {
							"date": "11",
							"sunrise": "05:43",
							"high": "高温 17.0℃",
							"low": "低温 7.0℃",
							"sunset": "18:43",
							"aqi": 83,
							"ymd": "2019-04-11",
							"week": "星期四",
							"fx": "北风",
							"fl": "<3级",
							"type": "阴",
							"notice": "不要被阴云遮挡住好心情"
						} */
					]
				}
			};
		},
		computed:{
			weatherForecast(){
				//console.log('weatherForecast',this.weather);
				if(this.weather.forecast&&this.weather.forecast.length>0){
					return this.weather.forecast.slice(1);
				}
				return [];
			}
		},
		onLoad(option) {
			this.amapPlugin = new amap.AMapWX({  
				key: commonVar.amapWxKey 
			});  
			this.getRegeo(()=>{this.loadWeather();});
			//this.loadWeather();
		},
		onReady(){
			//console.log('_city',_city);
		},
		methods:{
			changeHeadBg(e){
				console.log('changeHeadBg',e);
			},
			getRegeo(fn){
				let _this=this;
				uni.showLoading({  
					title: '获取地址信息中'  
				});  
				this.amapPlugin.getRegeo({  
					success: (data) => {  
						console.log('当前地址信息',data,data[0].name);
						let addressObj=data[0]||{};//addressObj.name//latitude,longitude  
						let regeocodeData=addressObj.regeocodeData||{};
						let addressComponent=regeocodeData.addressComponent||{};
						let city=addressComponent.city;//广州市
						let country=addressComponent.country;//中国
						let district=addressComponent.district;//越秀区
						let province=addressComponent.province;//广东省
						_this.cityName = addressComponent.city;
						_this.cityCode=_this.findCityCode(_this.cityName);
						console.log(_this.cityCode,_this.cityName);
						uni.hideLoading();  
						!!fn&&fn();
					},
					fail:function(info){
						console.log('fail',info);
						uni.hideLoading(); 
						uni.showModal({
							title:'提示',
							content:info.errMsg
						});
					}
				});  
			},
			findCityCode(cityName){
				for(let i=0,len=_city.length;i<len;i++){
					if(cityName.indexOf(_city[i].city_name)>-1){
						return _city[i].city_code;
					}
				}
				return _city[0].city_code;
			},
			loadWeather(){
				let _this=this;
				//let cityCode=_city[0].city_code;//天津 101030100
				let url='http://t.weather.sojson.com/api/weather/city/'+_this.cityCode;
				_this.loading=true;
				uni.showLoading({
					title: '加载中'
				});
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
						console.log('request',url,'res',res.data.status,res);
						if(res.data.status!=200){
							uni.showModal({
								title:'提示',
								content:res.data.message
							});
						}
						_this.weather=res.data.data;
						_this.weather.cityName=res.data.cityInfo.city;
						if(!!_this.weather.forecast && !!_this.weather.forecast[0]){
							_this.weather.type=_this.weather.forecast[0].type;
							_this.weather.high=_this.weather.forecast[0].high;
							_this.weather.low=_this.weather.forecast[0].low;
							_this.weather.fx=_this.weather.forecast[0].fx;
							_this.weather.fl=_this.weather.forecast[0].fl;
							_this.weather.ymd=_this.weather.forecast[0].ymd;
							_this.weather.week=_this.weather.forecast[0].week;
						}
					},
					fail() {
						
					},
					complete() {
						req=null;
						_this.loading=false;
						uni.hideLoading();
					}
				});
				//req.abort();//中断请求
			}
		}
	}
</script>

<style lang="less" scoped>
	.content{
		padding: 16upx;
	}
	.h1{
		font-size: 36upx;
		padding: 20upx 0upx;
	}
	.p1{
		font: 28upx;
		padding: 4upx;
	}
</style>
