<template>
  <div class="login-page">
    <div class="login-header">🍶</div>
    <div class="login-title">酒友圈</div>
    <div class="login-sub">记录喝酒，排行比拼，认识酒友</div>

    <div class="login-form">
      <div style="padding:14px 0 8px;font-size:13px;color:#999;">请选择省份</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;">
        <div v-for="p in provinces" :key="p"
          class="region-chip" :class="{active: form.province===p}"
          @click="form.province=p">
          {{ p }}
        </div>
      </div>

      <div v-if="form.province" style="padding:0 0 8px;font-size:13px;color:#999;">请选择城市</div>
      <div v-if="form.province" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px;">
        <div v-for="c in cities" :key="c"
          class="region-chip" :class="{active: form.city===c}"
          @click="form.city=c">
          {{ c }}
        </div>
      </div>

      <input v-model="form.nickname" class="login-input" placeholder="给自己起个昵称" maxlength="20">
      <input v-model="form.phone" class="login-input" placeholder="输入手机号" type="tel" maxlength="11">

      <div class="login-btn" :class="{disabled: !canSubmit}" @click="handleLogin">
        {{ loading ? '登录中...' : '开始酒友圈' }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)

const form = ref({ phone: '', nickname: '', province: '', city: '' })

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
const cities = computed(() => citiesMap[form.value.province] || [])
const canSubmit = computed(() => form.value.phone.length === 11 && form.value.nickname && form.value.province && form.value.city)

async function handleLogin() {
  if (!canSubmit.value || loading.value) return
  loading.value = true
  try {
    // 先注册（用户输入手机号=登录逻辑合并）
    const res = await userStore.register(form.value)
    if (res?.code === 409) {
      // 已注册，走登录
      const loginRes = await userStore.login(form.value.phone)
      if (loginRes?.code !== 0) throw new Error('登录失败')
    } else if (res?.code !== 0) {
      throw new Error(res?.msg || '注册失败')
    }
    await userStore.fetchProfile()
    router.push('/')
  } catch (e) {
    console.error('登录失败:', e)
    alert('登录失败，请重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page { min-height: 100vh; background: linear-gradient(135deg,#1aad19,#0d8a0f); display: flex; flex-direction: column; align-items: center; padding-top: 80px; }
.login-header { font-size: 64px; margin-bottom: 16px; }
.login-title { font-size: 28px; font-weight: 700; color: #fff; margin-bottom: 8px; }
.login-sub { font-size: 14px; color: rgba(255,255,255,.8); margin-bottom: 40px; }
.login-form { background: #fff; border-radius: 16px 16px 0 0; width: 100%; padding: 0 24px; flex: 1; padding-top: 24px; }
.region-chip { padding: 7px 16px; border-radius: 20px; background: #f0f0f0; color: #666; font-size: 13px; cursor: pointer; border: 1px solid transparent; }
.region-chip.active { background: #e8f9e8; color: #1aad19; border-color: #1aad19; font-weight: 600; }
.login-input { border: none; border-bottom: 1px solid #f0f0f0; font-size: 15px; padding: 12px 0; width: 100%; background: transparent; margin-bottom: 4px; }
.login-input:focus { border-bottom-color: #1aad19; outline: none; }
.login-btn { background: #1aad19; color: #fff; text-align: center; padding: 14px; border-radius: 10px; font-size: 16px; font-weight: 600; margin-top: 20px; cursor: pointer; }
.login-btn.disabled { background: #a0d9a0; cursor: not-allowed; }
</style>
