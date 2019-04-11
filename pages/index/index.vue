<template>
	<view class="content">
        <image class="logo zhuan" src="/static/logo.png"></image>
		<view>
            <text class="title">{{title}}</text>
        </view>
		<view class="uni-title uni-common-mt">
			flex-direction:row<text>\n横向布局</text>
		</view>
		<view class="uni-flex uni-row">
			<view class="flex-item uni-bg-red">A</view>
			<view class="flex-item uni-bg-green">B</view>
			<view class="flex-item uni-bg-blue">C</view>
		</view>
		<view class="uni-title uni-common-mt">
			flex-direction: column
			<text>\n纵向布局</text>
		</view>
		<view class="uni-flex uni-column">
			<view class="flex-item flex-item-V uni-bg-red">A</view>
			<view class="flex-item flex-item-V uni-bg-green">B</view>
			<view class="flex-item flex-item-V uni-bg-blue">C</view>
		</view>
		
		<view class="marginTop40">选择：</view>
		<picker @change="bindPickerChange" :value="picker.index" :range="picker.array">
			<view class="picker">
				当前选择：{{picker.array[picker.index]}}
			</view>
		</picker>
		<view class="marginTop40">
			<text>radio:</text>
			<radio-group class="radio-group" @change="radioChange">
				<label class="radio" v-for="(item, index) in radio.items" :key="item.value">
					<radio :value="item.value" :checked="item.value==radio.value"/> {{item.name}}
				</label>
			</radio-group>
		</view>
		<view>1sdfsdfs</view>
		<view>1232sdfsdfs</view>
		<view>2sdf232sdfs</view>
		<view>3sdf42sdfs</view>
		<view>4sd42fsdfs</view>
		<view class="btn-warpper">
			<!-- #ifdef APP-PLUS -->
			<button type="primary" @tap="gotoPageHandler">去nvue页面12</button>
			<button type="default" @tap="setNavColorByNative">通过native设置APP导航条颜色</button>
			<!-- #endif -->
			<button type="default" @tap="setNavColorByUniApi">通过uni api设置APP导航条颜色</button>
			<button type="primary" loading="true">页面主操作 Loading</button>
		</view>
		
		
	</view>
</template>

<script>
	export default {
		data() {
			return {
				title: '你好哇!',
				picker:{
					index:0,
					array:['A','B','C']
				},
				radio:{
					value:'CHN',
					items:[
						{name: '美国', value: 'USA'},
						{name: '中国', value: 'CHN'},
						{name: '巴西', value: 'BRA'}
					]
				},
				navOldBg:true
			}
		},
		//页面生命周期
		onLoad(option) { //监听页面加载，其参数为上个页面传递的数据，参数类型为Object（用于页面传参） //option为object类型，会序列化上个页面传递的参数
// 			uni.setNavigationBarColor({
// 				frontColor: '#ffffff',
// 				backgroundColor: '#ff0000'
// 			});
			switch(uni.getSystemInfoSync().platform){
				case 'android':
				   console.log('运行Android上')
				   break;
				case 'ios':
				   console.log('运行iOS上')
				   break;
				default:
				   console.log('运行在开发者工具上（各种小程序的开发者工具上）')
				   break;
			};
			
			let pages = getCurrentPages();
			let page = pages[pages.length - 1];
			console.log('当前页面的路由 page.route',page.route);//当前页面的路由
			// #ifdef APP-PLUS
			//条件编译：app
			let currentWebview = page.$getAppWebview();
			console.log('获得当前webview的id',currentWebview.id);//获得当前webview的id
			
// 			currentWebview.setStyle({//设置当前webview的style
// 				titleNView:{
// 					titleText:"test app",
// 					buttons:[ //这样要写全button个数和设置
// 						{badgeText:"12"}
// 					]
// 				}
// 			});

			let titleObj = currentWebview.getStyle().titleNView;  
// 			if (!titleObj.buttons) {  
// 				return;  
// 			}
			
			titleObj.titleText='nativeApp1';
			if(!!titleObj.buttons[1]){
				titleObj.buttons[1].badgeText="12";
				titleObj.buttons[1].color='#666666';
			}
			
			currentWebview.setStyle({titleNView:titleObj});

			// #endif
			
			
			console.log('index.vue onLoad');
		},
		onShow(){ //监听页面显示		
		},
		onHide(){ //监听页面隐藏	
		},
		onReady(){ //监听页面初次渲染完成	
			
		},
		onUnload(){},
		onPullDownRefresh(){},//监听用户下拉动作，一般用于下拉刷新
		onReachBottom(){},//页面上拉触底事件的处理函数	
		onPageScroll(){},//监听页面滚动，参数为Object	
		onNavigationBarButtonTap(e){ //监听原生标题栏按钮点击事件，参数为 按钮 Object	
			console.log('监听原生标题栏按钮点击事件，参数为Object	');
			console.log(e.index,e);
			//通过index来判断点击来哪个按钮
			if(e.index===1){
// 				for(let k in e){
// 					console.log(k,'=',e[k]);
// 				}
			}
		},
		methods: {
			bindPickerChange(e){
				console.log('picker',e);
				this.picker.index=e.detail.value;
			},
			radioChange(e){
				console.log('radio old',this.radio.value,'new',e.detail.value,e);
				this.radio.value=e.detail.value;
			},
			gotoPageHandler(e){
				console.log('gotoPage',e);
				uni.navigateTo({
					url:'../testNvue/testNvue',
					success() {
						
					},
					fail() {
						
					},
					complete() {
						
					}
				});
			},
			setNavColorByNative(e){
				//改变颜色 backgroundColor
				// #ifdef APP-PLUS
				let pages = getCurrentPages();
				let page = pages[pages.length - 1];
				const currentWebview = page.$getAppWebview();
				let titleObj = currentWebview.getStyle().titleNView;  
				titleObj.backgroundColor='#F0AD4E';
				currentWebview.setStyle({titleNView:titleObj});
				// #endif
				console.log('改变颜色 backgroundColor');
			},
			setNavColorByUniApi(e){
				this.navOldBg=!this.navOldBg;
				uni.setNavigationBarColor({
					frontColor:this.navOldBg?'#000000':'#ffffff',//只支持黑白
					backgroundColor:this.navOldBg?'#f8f8f8':'#ff0000'
				});
			}
		}
	}
</script>

<style lang="less" scoped>
	.content {
		/* text-align: center; */
		/* height: 400upx; */
		/* padding-bottom: 60upx; */
		padding: 16upx;
	}
	.flex-item {
		width: 33.3%;
		height: 200upx;
		text-align: center;
		line-height: 200upx;
	}

	.flex-item-V {
		width: 100%;
		height: 150upx;
		text-align: center;
		line-height: 150upx;
	}
	
	.btn-warpper{padding: 20upx;}
    .logo{
        height: 200upx;
        width: 200upx;
        /* margin-top: 200upx; */
    }
	.title {
		font-size: 36upx;
		color: #8f8f94;
	}
	
	.zhuan{
		// -webkit-transform: rotate(360deg);
		animation: rotation 8s linear infinite;
	}
</style>
