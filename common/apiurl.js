

//天气接口
const weatherBaseUrl='http://t.weather.sojson.com';
export let getWeatherUrl= (cityCode)=>{//天津 101030100
	return weatherBaseUrl+'/api/weather/city/'+cityCode;
};

//qq音乐api接口
const qqmusicBaseUrl='https://c.y.qq.com';
const qqmusicPlayUrlBase='http://ws.stream.qqmusic.qq.com';
const qqmusicImgUrlBase='http://imgcache.qq.com';

export let topByRandomUrl = qqmusicBaseUrl+'/v8/fcg-bin/fcg_v8_toplist_cp.fcg?g_tk=5381&uin=0&format=json&inCharset=utf-8&outCharset=utf-8%C2%ACice=0&platform=h5&needNewCode=1&tpl=3&page=detail&type=top&topid=36&_=1520777874472';//随机推荐歌曲列表请求地址
export let getImgUrl=function(albumid){//获取歌曲图片封面请求地址
	return `${qqmusicImgUrlBase}/music/photo/album_300/${albumid%100}/300_albumpic_${albumid}_0.jpg`;
};//"http://imgcache.qq.com/music/photo/album_300/%i/300_albumpic_%i_0.jpg";//图片封面通过albumid拼接； albumid%100, albumid
export let getSongTokenUrl=function(songmid){//获取歌曲token请求地址
	return `${qqmusicBaseUrl}/base/fcgi-bin/fcg_music_express_mobile3.fcg?format=json205361747&platform=yqq&cid=205361747&songmid=${songmid}&filename=C400${songmid}.m4a&guid=126548448`;
};//https://c.y.qq.com/base/fcgi-bin/fcg_music_express_mobile3.fcg?format=json205361747&platform=yqq&cid=205361747&songmid=003lghpv0jfFXG&filename=C400003lghpv0jfFXG.m4a&guid=126548448
//songmid可以从歌曲信息中取到，filename根据songmid生成。比如，songmid是003lghpv0jfFXG，则filename就是前缀加上C400，后缀加上.m4a，即C400003lghpv0jfFXG.m4a。其他字段format、platform、cid、guid可以写死，但都是必须的。
export let getSongPlayUrl=function(songmid,token){ //获取歌曲播放地址
	return `${qqmusicPlayUrlBase}/C400${songmid}.m4a?fromtag=0&guid=126548448&vkey=${token}`;
} //url的path就是上文中用到的filename。参数中的几个字段都是必须的：guid要和请求token时使用的guid保持一致，vkey即token中的vkey字段，fromtag随意指定一个整数，可以写死为0。