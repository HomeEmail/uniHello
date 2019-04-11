import Vue from 'vue'
import Vuex from 'vuex'
Vue.use(Vuex);

let state={
	hasLogin: false,
	loginProvider: "",
	openid: null,
};
let mutations={
	login(state, provider) {
		state.hasLogin = true;
		state.loginProvider = provider;
	},
	logout(state) {
		state.hasLogin = false
		state.openid = null
	},
	setOpenid(state, openid) {
		state.openid = openid
	}
};
let actions={
	// lazy loading openid
	getUserOpenId: async function ({
		commit,
		state
	}) {
		return await new Promise((resolve, reject) => {
			if (state.openid) {
				resolve(state.openid)
			} else {
				uni.login({
					success: (data) => {
						commit('login')
						setTimeout(function () { //模拟异步请求服务器获取 openid
							const openid = '123456789'
							console.log('uni.request mock openid[' + openid + ']');
							commit('setOpenid', openid)
							resolve(openid)
						}, 1000)
					},
					fail: (err) => {
						console.log('uni.login 接口调用失败，将无法正常使用开放接口等服务', err)
						reject(err)
					}
				})
			}
		})
	}
};

const store = new Vuex.Store({
    state,
    mutations,
    actions
});

export default store;