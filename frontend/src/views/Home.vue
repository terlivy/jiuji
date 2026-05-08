<template>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <div class="header-back"></div>
      <div class="header-title">🏆 酒友圈</div>
      <div class="header-right"></div>
    </div>

    <!-- 地区切换 -->
    <div class="rank-header" @click="showRegion = true">
      <div style="display:flex;align-items:center;gap:4px;font-size:13px;background:rgba(255,255,255,.2);padding:4px 12px;border-radius:20px;">
        <span>{{ curRegion || '选择地区' }}</span>
        <span style="font-size:10px;">▼</span>
      </div>
    </div>

    <!-- 榜单切换 -->
    <div class="tabs">
      <div v-for="p in periods" :key="p.value"
        class="tab" :class="{active: period===p.value}"
        @click="period=p.value; fetchRankings()">
        {{ p.label }}
      </div>
    </div>

    <!-- 我的卡片 -->
    <div class="my-card" @click="$router.push('/profile')">
      <div class="avatar" style="background:rgba(255,255,255,.25);">
        {{ user?.avatar || '🍶' }}
      </div>
      <div class="flex-1" style="color:#fff;">
        <div style="font-size:17px;font-weight:700;">{{ user?.nickname }} <span class="level-badge">LV.{{ user?.level }}</span></div>
        <div style="font-size:12px;opacity:.8;">📍 {{ user?.province }}-{{ user?.city }}</div>
        <div style="font-size:12px;opacity:.9;margin-top:2px;">喝酒 {{ user?.total_drinks }} 次 · {{ user?.points }} 积分</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:28px;font-weight:700;color:#fff;">#{{ myRank || '-' }}</div>
        <div style="font-size:11px;opacity:.8;">我的排名</div>
      </div>
    </div>

    <!-- 排行列表 -->
    <div style="padding:12px;display:flex;flex-direction:column;gap:10px;">
      <div v-for="u in list" :key="u.id" class="rank-card" @click="$router.push('/user/'+u.id)">
        <div class="rank-num" :class="getRankClass(u.rank)">{{ u.rank }}</div>
        <div class="avatar">{{ u.avatar || '🍶' }}</div>
        <div class="flex-1" style="min-width:0;">
          <div style="font-size:15px;font-weight:600;display:flex;align-items:center;gap:5px;">
            {{ u.nickname }}
            <span v-if="u.level>=5" class="vip-badge">V</span>
          </div>
          <div class="text-sm text-gray" style="display:flex;gap:8px;flex-wrap:wrap;">
            <span>📍{{ u.province }}-{{ u.city }}</span>
            <span>💰{{ u.points }}积分</span>
          </div>
        </div>
        <div style="text-align:right;flex-shrink:0;">
          <div style="font-size:18px;font-weight:700;color:#1aad19;">{{ u.drink_count || 0 }}</div>
          <div class="text-xs text-gray">次</div>
        </div>
      </div>
      <div v-if="list.length === 0" style="text-align:center;padding:40px;color:#bbb;font-size:14px;">
        该地区暂无数据，成为第一个吧！
      </div>
    </div>

    <!-- 地区选择弹窗 -->
    <div class="modal-overlay" :class="{show: showRegion}" @click.self="showRegion=false">
      <div class="sheet">
        <div class="sheet-header">
          <div class="sheet-title">选择地区</div>
          <div class="sheet-close" @click="showRegion=false">×</div>
        </div>
        <div class="tabs" style="border-bottom:none;padding:0 20px;">
          <div class="tab" :class="{active: step===1}" style="flex:none;padding:10px 14px;">{{ selProvince||'请选择省份' }}</div>
          <div class="tab" :class="{active: step===2}" style="flex:none;padding:10px 14px;" v-if="selProvince">{{ selCity||'请选择城市' }}</div>
        </div>
        <div style="padding:12px 20px;max-height:40vh;overflow-y:auto;">
          <div v-if="step===1" v-for="p in provinces" :key="p"
            style="padding:10px 0;border-bottom:1px solid #f5f5f5;cursor:pointer;"
            :style="{color:selProvince===p?'#1aad19':'#333',fontWeight:selProvince===p?'600':'400'}"
            @click="selProvince=p; selCity=''; step=2">
            {{ p }}
          </div>
          <div v-if="step===2" v-for="c in cities" :key="c"
            style="padding:10px 0;border-bottom:1px solid #f5f5f5;cursor:pointer;"
            :style="{color:selCity===c?'#1aad19':'#333',fontWeight:selCity===c?'600':'400'}"
            @click="selCity=c; confirmRegion()">
            {{ c }}
          </div>
        </div>
      </div>
    </div>

    <!-- 底部导航 -->
    <BottomNav />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import api from '@/api'
import BottomNav from '@/components/BottomNav.vue'

const userStore = useUserStore()
const user = computed(() => userStore.user)
const list = ref([])
const myRank = ref(null)
const period = ref('total')
const showRegion = ref(false)
const step = ref(1)
const selProvince = ref('')
const selCity = ref('')

const curRegion = computed(() => {
  if (!selProvince.value) return user.value ? `${user.value.province}-${user.value.city}` : ''
  return selCity.value ? `${selProvince.value}-${selCity.value}` : selProvince.value
})

const provinces = [
  '北京市','上海市','天津市','重庆市',
  '广东省','浙江省','江苏省','四川省','山东省','河南省',
  '湖北省','湖南省','广东省','福建省','安徽省','江西省',
  '河北省','山西省','辽宁省','吉林省','黑龙江省',
  '陕西省','甘肃省','青海省','四川省','贵州省','云南省',
  '海南省','内蒙古','广西','西藏','宁夏','新疆','台湾省','香港','澳门'
]
const citiesMap = {
  '北京市':['北京市'],
  '上海市':['上海市'],
  '天津市':['天津市'],
  '重庆市':['重庆市'],
  '广东省':['广州市','深圳市','佛山市','东莞市','珠海市','中山市','惠州市','汕头市','湛江市','江门市'],
  '浙江省':['杭州市','宁波市','温州市','嘉兴市','湖州市','绍兴市','金华市','台州市','丽水市','衢州市'],
  '江苏省':['南京市','苏州市','无锡市','常州市','南通市','徐州市','连云港市','淮安市','盐城市','扬州市','镇江市','泰州市','宿迁市'],
  '四川省':['成都市','绵阳市','德阳市','南充市','宜宾市','泸州市','达州市','乐山市','内江市','自贡市','遂宁市','广安市','资阳市'],
  '山东省':['济南市','青岛市','烟台市','威海市','潍坊市','淄博市','临沂市','济宁市','泰安市','德州市','聊城市','滨州市','菏泽市'],
  '河南省':['郑州市','洛阳市','开封市','南阳市','新乡市','安阳市','焦作市','许昌市','平顶山市','商丘市'],
  '湖北省':['武汉市','宜昌市','襄阳市','荆州市','黄石市','十堰市','孝感市','荆门市','咸宁市'],
  '湖南省':['长沙市','株洲市','湘潭市','衡阳市','岳阳市','常德市','张家界市','益阳市','郴州市'],
  '福建省':['福州市','厦门市','泉州市','漳州市','莆田市','宁德市','三明市','南平市'],
  '安徽省':['合肥市','芜湖市','蚌埠市','马鞍山市','安庆市','淮北市','铜陵市','滁州市','池州市'],
  '江西省':['南昌市','九江市','赣州市','吉安市','宜春市','抚州市','上饶市','景德镇市'],
  '河北省':['石家庄市','唐山市','秦皇岛市','邯郸市','廊坊市','保定市','沧州市','衡水市'],
  '山西省':['太原市','大同市','运城市','长治市','晋城市','忻州市','临汾市','吕梁市'],
  '辽宁省':['沈阳市','大连市','鞍山市','抚顺市','本溪市','丹东市','锦州市','营口市'],
  '吉林省':['长春市','吉林市','四平市','辽源市','通化市','松原市'],
  '黑龙江省':['哈尔滨市','齐齐哈尔市','牡丹江市','佳木斯市','大庆市','鸡西市'],
  '陕西省':['西安市','宝鸡市','咸阳市','铜川市','渭南市','延安市','汉中市','榆林市'],
  '甘肃省':['兰州市','嘉峪关市','金昌市','白银市','天水市','武威市','张掖市'],
  '青海省':['西宁市','海东市','海南州','海北州'],
  '贵州省':['贵阳市','遵义市','六盘水市','安顺市','毕节市','铜仁市'],
  '云南省':['昆明市','曲靖市','玉溪市','保山市','红河州','大理州'],
  '海南省':['海口市','三亚市','三沙市','儋州市'],
  '内蒙古':['呼和浩特市','包头市','鄂尔多斯市','赤峰市','呼伦贝尔市'],
  '广西':['南宁市','柳州市','桂林市','梧州市','北海市','防城港市','钦州市'],
  '西藏':['拉萨市','日喀则市','林芝市','昌都市','那曲市'],
  '宁夏':['银川市','石嘴山市','吴忠市','固原市','中卫市'],
  '新疆':['乌鲁木齐市','克拉玛依市','吐鲁番市','哈密市','伊犁州'],
  '台湾省':['台北市','新北市','桃园市','台中市','台南市','高雄市'],
  '香港':['香港'],
  '澳门':['澳门'],
}
const cities = computed(() => citiesMap[selProvince.value] || [])

const periods = [{label:'总榜',value:'total'},{label:'月榜',value:'month'},{label:'周榜',value:'week'}]

async function fetchRankings() {
  const params = { period: period.value }
  if (selProvince.value) { params.province = selProvince.value; params.city = selCity.value; }
  const res = await api.getRankings(params)
  if (res.code === 0) { list.value = res.data.list; myRank.value = res.data.myRank; }
}

function getRankClass(rank) {
  if (rank === 1) return 'top1'
  if (rank === 2) return 'top2'
  if (rank === 3) return 'top3'
  return 'other'
}

function confirmRegion() {
  selProvince.value = selProvince.value
  selCity.value = selCity.value
  showRegion.value = false
  step.value = 1
  fetchRankings()
}

onMounted(async () => {
  if (!userStore.user) await userStore.fetchProfile()
  selProvince.value = user.value?.province || ''
  selCity.value = user.value?.city || ''
  fetchRankings()
})
</script>

<style scoped>
.my-card {
  background: linear-gradient(135deg,#1aad19,#179b16);
  border-radius: 12px; padding: 16px; margin: 12px;
  display: flex; align-items: center; gap: 12px;
  box-shadow: 0 2px 10px rgba(26,173,25,.25); cursor: pointer;
  color: #fff;
}
.rank-card {
  background: #fff; border-radius: 10px; padding: 14px;
  display: flex; align-items: center; gap: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,.06); cursor: pointer;
}
.rank-header {
  background: linear-gradient(135deg,#1aad19,#0d8a0f);
  padding: 14px 16px 10px; display: flex; justify-content: flex-end;
  color: #fff; cursor: pointer;
}
</style>
