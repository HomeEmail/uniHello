<script>
	export default {
		//应用生命周期
		onLaunch: function () {
			console.log('App Launch')
		},
		onShow: function () {
			console.log('App Show')
		},
		onHide: function () {
			console.log('App Hide')
		},
		onUniNViewMessage:function(e){ //nvue页面传过来的消息
			console.log('onUniNViewMessage',e.data);
		},
		onError:function(err){ //捕获app error
			console.log(err);
		}
	}
</script>

<style lang="less">
	/*每个页面公共css */
	/* uni.css - 通用组件、模板样式库，可以当作一套ui库应用 */
	@import url("./common/uni.css");
	@import './common/common';
</style>
