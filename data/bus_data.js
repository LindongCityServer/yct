const busRoutes = {
    "101": {
        name: "101路",
        operator: "临东客运集团丰河公共汽车分公司",
        firstLastBus: {
            first: "05:30",
            last: "22:00"
        },
        fare: "2元",
        stations: [
            {name: "临东站"},
            {name: "中华路临中大街"},
            {name: "中华路青年大街"},
            {name: "府后街市场", oneWay:"down"},
            {name: "青年大街304巷", oneWay:"down"},
            {name: "中华路立交桥南", oneWay:"up"},
            {name: "市政府"},
            {name: "临东银行"},
            {name: "回南控股公司"},
            {name: "文景屯"},
            {name: "中华路文景西街"},
            {name: "天顺门"},
            {name: "临东职业技术学院"},
            {name: "建业街南运河北路"},
            {name: "虎山乐购"},
            {name: "老虎山"},
            {name: "建业街穗城路"},
            {name: "建业街草仓路"},
            {name: "花城广场地铁站"},
            {name: "市第一高中"},
            {name: "度假基地接待中心"},
            {name: "普济路湖西街"},
            {name: "青年大街普济路"},
            {name: "石桥子"}
        ]
    },
    "103": {
        name: "103路",
        operator: "临东客运集团丰河公共汽车分公司",
        firstLastBus: {
            first: "05:30",
            last: "22:00"
        },
        fare: "2元",
        stations: [
            {name: "临铁湖畔五星花园", status: "暂未启用"},
            {name: "水岸华庭"},
            {name: "国际度假基地"},
            {name: "市第一高中"},
            {name: "兰家车辆段"},
            {name: "花城广场地铁站"},
            {name: "建业街草仓路"},
            {name: "建业街穗城路"},
            {name: "老虎山"},
            {name: "虎山乐购"},
            {name: "建业街南运河北路"},
            {name: "临东职业技术学院"},
            {name: "天顺门"},
            {name: "中华路文景西街"},
            {name: "中华路彩塔街"},
            {name: "中华路立交桥南"},
            {name: "市政府"},
            {name: "市府广场"},
            {name: "新阳路地铁站"},
            {name: "航洋城北"},
            {name: "宣庆实验中学"},
            {name: "忌城街道"},
            {name: "新阳小区"},
            {name: "水庙"},
            {name: "新才中学"},
            {name: "出生点"},
            {name: "海港桥北"},
            {name: "大学城地铁站"},
            {name: "观景台南停车场"}
        ]
    },
    "104": {
        name: "104路",
        operator: "临东客运集团丰河公共汽车分公司",
        firstLastBus: {
            first: "05:30",
            last: "22:30"
        },
        fare: "2元",
        stations: [
            {name: "临东站西公交枢纽"},
            {name: "临新东路振工街"},
            {name: "胜利大街凌州大道"},
            {name: "临东站南（南一马路）"},
            {name: "临东站"},
            {name: "中华路临中大街"},
            {name: "中华路青年大街"},
            {name: "市电视台"},
            {name: "中华路彩塔街"},
            {name: "中华路文景西街"},
            {name: "中华路地铁站"},
            {name: "怒江中心东"},
            {name: "沙滩村渡轮码头"},
            {name: "重工公园"},
            {name: "海洋基地"},
            {name: "文化街新阳路"},
            {name: "出生点"}
        ]
    },
    "107": {
        name: "107路",
        operator: "临东客运集团丰河公共汽车分公司",
        firstLastBus: {
            first: "06:00",
            last: "23:00"
        },
        fare: "2元",
        stations: [
            {name: "临东站"},
            {name: "临东站北", oneWay: "down"},
            {name: "胜利大街建设大路", oneWay: "down"},
            {name: "南运河北路12号", oneWay: "down"},
            {name: "市二十二中", oneWay: "up"},
            {name: "中华路临中大街", oneWay: "up"},
            {name: "启航小区西门"},
            {name: "宣庆文化宫"},
            {name: "临房启航小区"},
            {name: "都湖国际南门"},
            {name: "穗城路建业街"},
            {name: "建业街穗城路"},
            {name: "建业街草仓路"},
            {name: "花城广场地铁站"},
            {name: "花城广场北"},
            {name: "精卫街花城路"},
            {name: "雨城广场"},
        ]
    },
    "118": {
        name: "118路",
        operator: "临东客运集团一分公司(天逸巴士)",
        firstLastBus: {
            first: "05:30",
            last: "22:00"
        },
        fare: "2元",
        stations: [
            {name: "出生点"},
            {name: "滨海立交北"},
            {name: "海洋基地地铁站"},
            {name: "滨海街兴岛路北"},
            {name: "重工公园"},
            {name: "精卫街市府大路"},
            {name: "精卫街地铁站"},
            {name: "职业技术学院东门"},
            {name: "南运河北路精卫街"},
            {name: "职业技术学院北门"},
            {name: "临医二院"},
            {name: "宣庆区政府"},
            {name: "金银桥南"},
            {name: "正阳街临东路"}
        ]
    },
    "124": {
        name: "124路",
        operator: "临东客运集团定制旅游客运分公司",
        firstLastBus: {
            first: "06:00",
            last: "22:00"
        },
        fare: "2元",
        stations: [
            {name: "度假基地接待中心"},
            {name: "一高中北"},
            {name: "普济路精卫街"},
            {name: "精卫街普济路"},
            {name: "精卫街桥"},
            {name: "精卫街花城路"},
            {name: "雨城广场"},
            {name: "坂田玖里江山"},
            {name: "职业技术学院东门"},
            {name: "精卫街地铁站"},
            {name: "精卫街市府大路"},
            {name: "沙坛村西"},
            {name: "莲昕"},
            {name: "李家坎"},
            {name: "航洋城北"},
            {name: "新阳路地铁站"},
            {name: "临东饭店"},
            {name: "外事大厦"}
        ]
    },
    "133": {
        name: "133路",
        operator: "临东地铁公共交通有限公司A区",
        firstLastBus: {
            first: "05:30",
            last: "23:00"
        },
        fare: "2元",
        stations: [
            {name: "临东站西公交枢纽"},
            {name: "临新东路振工街"},
            {name: "百鸟公园"},
            {name: "西丘办事处"},
            {name: "地铁大厦"},
            {name: "临中大街新阳路"},
            {name: "临中大街南五马路"},
            {name: "仁德医院东门"},
            {name: "仁德路临中大街"},
            {name: "公交仁德站"}
        ]
    },
    "138": {
        name: "138路",
        operator: "嘎联巴士（临东）有限公司",
        firstLastBus: {
            first: "06:30",
            last: "22:30"
        },
        fare: "2元",
        stations: [
            {name: "临东站"},
            {name: "中华路临中大街", oneWay:"down"},
            {name: "市电视台", oneWay:"down"},
            {name: "临东站北", oneWay:"up"},
            {name: "胜利大街建设大路", oneWay:"up"},
            {name: "南运河北路12号", oneWay:"up"},
            {name: "启航小区西门", oneWay:"up"},
            {name: "宣庆文化宫", oneWay:"up"},
            {name: "福佑车库"},
            {name: "中华路立交桥南"},
            {name: "市政府"},
            {name: "市府广场"},
            {name: "临东饭店"},
            {name: "李家坎"},
            {name: "宣庆足球场"},
            {name: "临东体育场西门"},
            {name: "临东体育场南门"},
            {name: "莲昕"},
            {name: "新阳小区北门"},
            {name: "沙坛村西"},
            {name: "重工公园"},
            {name: "滨海街兴岛路北"},
            {name: "兴岛楼停车场"},
            {name: "兴岛楼"},
            {name: "文化街新阳路"},
            {name: "出生点"},
            {name: "忌城路地铁站"},
            {name: "大学城地铁站"},
            {name: "观景台南停车场"}
        ]
    },
    "146": {
        name: "146路",
        operator: "临东安运集团安运公交公司",
        firstLastBus: {
            first: "05:30",
            last: "22:30"
        },
        fare: "2元",
        stations: [
            {name: "临东站南（南一马路）"},
            {name: "临东站北"},
            {name: "胜利大街建设大路"},
            {name: "南运河北路12号"},
            {name: "启航小区西门"},
            {name: "临房天玺苑"},
            {name: "中鼎大厦"},
            {name: "草仓路临中大街"},
            {name: "CT中心", note: "[北站台]"}
        ]
    },
    "152": {
        name: "152路",
        operator: "临东客运集团顺鑫巴士公司",
        firstLastBus: {
            first: "05:30",
            last: "22:00"
        },
        fare: "2元",
        stations: [
            {name: "市第一高中"},
            {name: "兰家车辆段"},
            {name: "花城广场地铁站"},
            {name: "会展中心"},
            {name: "来又来商场"},
            {name: "CT中心"},
            {name: "草仓路临中大街"},
            {name: "草仓路胜利大街"},
            {name: "翡翠池"},
            {name: "尚瑞翠鸟台"},
            {name: "两孔桥"},
            {name: "胜利大街建设大路"},
            {name: "临东站北"},
            {name: "临东站南（南一马路）"},
            {name: "市府大路胜利大街"},
            {name: "市府大路临中大街"},
            {name: "市政府西门"},
            {name: "临东饭店"},
            {name: "李家坎", oneWay: "up"},
            {name: "外事大厦", oneWay: "down"},
            {name: "临东游泳馆", oneWay: "up"},
            {name: "怒江街新阳路"},
            {name: "标识湾大桥北"},
            {name: "标识湾大桥南"},
            {name: "标识湾"},
            {name: "飞沙堰"},
            {name: "仁德路青年大街"},
            {name: "公交仁德站"}
        ]
    },
    "155": {
        name: "155路",
        operator: "临东临北巴士有限责任公司",
        firstLastBus: {
            first: "06:30",
            last: "20:30"
        },
        fare: "2元",
        stations: [
            {name: "临东北站"},
            {name: "北站路迎宾街"},
            {name: "北站路金阳大街"},
            {name: "金阳大街北站路"},
            {name: "临东银行北站支行"},
            {name: "九二六〇"},
            {name: "八九三〇"},
            {name: "八六〇〇"},
            {name: "八二〇〇"},
            {name: "市交通局"},
            {name: "临东出版集团"},
            {name: "金阳大街联合路"},
            {name: "铁建新苑"},
            {name: "金阳大街临北路"},
            {name: "人杰湖公园"},
            {name: "九二八商场"},
            {name: "莲池"},
            {name: "石桥子"},
            {name: "青年大街普济路"},
            {name: "兰家车辆段西"},
            {name: "CT中心"},
            {name: "草仓路临中大街"},
            {name: "草仓路胜利大街"},
            {name: "翡翠池"},
            {name: "尚瑞翠鸟台"},
            {name: "两孔桥"},
            {name: "瀚都国际"},
            {name: "兴工街建设大路"},
            {name: "兴工街小北三路"},
            {name: "兴龙苑西门"},
            {name: "临新东路振工街"},
            {name: "百鸟公园地铁站"},
            {name: "胜利大街南五马路"},
            {name: "仁德医院西门"},
            {name: "临医仁德医院"},
            {name: "仁德路临中大街"},
            {name: "公交仁德站"}
        ]
    },
    "171": {
        name: "171路",
        operator: "临东客运集团通运巴士运营管理服务中心",
        firstLastBus: {
            first: "04:30",
            last: "23:00"
        },
        fare: "2元",
        stations: [
            {name: "正阳街临东路"},
            {name: "金银桥南"},
            {name: "宣庆区政府"},
            {name: "临医二院"},
            {name: "职业技术学院北门"},
            {name: "南运河北路精卫街"},
            {name: "工农大桥西"},
            {name: "阅江街穗城路"},
            {name: "体育中心"},
            {name: "坂田客运港"},
            {name: "大剧院"},
            {name: "花城路精卫街"},
            {name: "精卫街桥"},
            {name: "精卫街普济路"},
            {name: "普济路精卫街"},
            {name: "一高中北"},
            {name: "市第一高中"},
            {name: "兰家车辆段"},
            {name: "花城广场地铁站"},
            {name: "花城广场"}
        ]
    },
    "172": {
        name: "172路",
        operator: "临东地铁公共交通有限公司A区",
        firstLastBus: {
            first: "05:30",
            last: "23:00"
        },
        fare: "2元",
        stations: [
            {name: "宣庆实验中学"},
            {name: "沙井村"},
            {name: "临东体育场西门"},
            {name: "沙坛村渡轮码头"},
            {name: "精卫街市府大路"},
            {name: "精卫街地铁站"},
            {name: "职业技术学院东门"},
            {name: "坂田玖里江山"},
            {name: "雨城广场"},
            {name: "精卫街花城路"},
            {name: "花城广场北"},
            {name: "花城广场地铁站"},
            {name: "花城广场"}
        ]
    },
    "178": {
        name: "178路",
        operator: "临东玖通客运有限公司",
        firstLastBus: {
            first: "06:00",
            last: "18:00"
        },
        fare: "2元",
        stations: [
            {name: "雪乡驾校"},
            {name: "彩虹小学"},
            {name: "雪乡消防队"},
            {name: "泉眼背西站"},
            {name: "卫生院东"},
            {name: "雪乡转盘"},
            {name: "汤庙子村"},
            {name: "雪乡东站特色街"}
        ]
    },
    "178S": {
        name: "178路支线",
        operator: "临东玖通客运有限公司",
        firstLastBus: {
            first: "06:30",
            last: "17:00"
        },
        fare: "2元",
        stations: [
            {name: "雪乡驾校"},
            {name: "彩虹小学"},
            {name: "雪乡消防队"},
            {name: "雪乡转盘北"},
            {name: "雪乡转盘"},
            {name: "雪村"}
        ]
    },
    "181": {
        name: "181路",
        operator: "临东临北巴士有限责任公司",
        firstLastBus: {
            first: "06:00",
            last: "20:00"
        },
        fare: "2元",
        stations: [
            {name: "青咀子"},
            {name: "碧湖实验小学"},
            {name: "高阳庄"},
            {name: "碧湖印园"},
            {name: "卑磷山公园"},
            {name: "财富商厦"},
            {name: "壁滩"},
            {name: "黄金大厦"},
            {name: "莲花池公园"},
            {name: "尚瑞墨华渚西"},
            {name: "万安街道办事处"},
            {name: "临港大街曙光路"},
            {name: "碧湖大桥北"},
            {name: "城海区医院"},
            {name: "城海客运站"}
        ]
    },
    "181S": {
        name: "181路支线",
        operator: "临东临北巴士有限责任公司",
        firstLastBus: {
            first: "定点班车",
            last: "定点班车"
        },
        fare: "2元",
        stations: [
            {name: "青咀子"},
            {name: "碧湖实验小学"},
            {name: "高阳庄"},
            {name: "碧湖印园"},
            {name: "卑磷山公园"},
            {name: "财富商厦"},
            {name: "壁滩"},
            {name: "黄金大厦"},
            {name: "莲花池公园"},
            {name: "尚瑞墨华渚西"},
            {name: "万安街道办事处"},
            {name: "临港大街曙光路"},
            {name: "碧湖大桥北"},
            {name: "城海区医院"},
            {name: "城海客运站"},
            {name: "碧湖南山"},
            {name: "五间房"}
        ]
    },
    "191": {
        name: "191路",
        operator: "嘎联巴士（临东）有限公司",
        firstLastBus: {
            first: "06:30",
            last: "22:24"
        },
        fare: "2元",
        stations: [
            {name: "花城广场"},
            {name: "会展中心", oneWay: "up"},
            {name: "科普公园东", oneWay: "up"},
            {name: "临房启航小区", oneWay:"up"},
            {name: "都湖国际南门"},
            {name: "穗城路建业街"},
            {name: "老虎山"},
            {name: "虎山乐购"},
            {name: "临医二院"},
            {name: "职业技术学院北门"},
            {name: "南运河北路精卫街"},
            {name: "职业技术学院东门"},
            {name: "禹城中学"},
            {name: "中华路地铁站"},
            {name: "怒江中心东"},
            {name: "临东体育场西门"},
            {name: "沙井村"},
            {name: "宣庆实验中学"},
            {name: "航洋城"},
            {name: "航洋城北"},
            {name: "仁德新村"},
            {name: "青年大街仁德路"},
            {name: "公交仁德站"}
        ]
    },
    "214": {
        name: "214路",
        operator: "临东客运集团一分公司(天逸巴士)",
        firstLastBus: {
            first: "05:30",
            last: "22:00"
        },
        fare: "2元",
        stations: [
            {name: "北站北广场", status: "暂未启用"},
            {name: "临东北站"},
            {name: "北站路迎宾街"},
            {name: "北站路金阳大街"},
            {name: "金阳大街北站路"},
            {name: "临东银行北站支行"},
            {name: "九二六〇"},
            {name: "八九三〇"},
            {name: "八六〇〇"},
            {name: "八二〇〇"},
            {name: "市交通局"},
            {name: "临东出版集团"},
            {name: "金阳大街联合路"},
            {name: "铁建新苑"},
            {name: "金阳大街临北路"},
            {name: "人杰湖公园"},
            {name: "九二八商场"},
            {name: "莲池"},
            {name: "石桥子"},
            {name: "青年大街普济路"},
            {name: "兰家车辆段西"},
            {name: "CT中心"},
            {name: "科普公园东"},
            {name: "临房启航小区"},
            {name: "金银库"},
            {name: "福佑车库"},
            {name: "中华路立交桥南"},
            {name: "市政府"},
            {name: "市府广场"},
            {name: "新阳路地铁站"},
            {name: "航洋城"},
            {name: "仁德新村"},
            {name: "青年大街仁德路"},
            {name: "青年桥北"},
            {name: "机场高速口"}
        ]
    },
    /*"216": {
        name: "216路",
        operator: "临东客运集团通运巴士运营管理服务中心",
        firstLastBus: {
            first: "04:30",
            last: "22:30"
        },
        fare: "2元",
        status: "规划",
        stations: [
            {name: "临东北站"},
            {name: "北站路金阳大街"},
            {name: "临东银行北站支行"},
            {name: "敬宾街"},
            {name: "市图书馆", status: "待定"},
            {name: "临东出版集团"},
            {name: "铁建新苑"},
            {name: "金阳大街联合路"},
            {name: "金阳大街临北路"},
            {name: "人杰湖公园"},
            {name: "莲池"},
            {name: "石桥子停车场"},
            {name: "青年大街普济路"},
            {name: "兰家车辆段西"},
            {name: "CT中心"},
            {name: "草仓路临中大街"},
            {name: "草仓路胜利大街"},
            {name: "翡翠池"},
            {name: "尚瑞翠䴖台"},
            {name: "两孔桥"},
            {name: "胜利大街建设大路"},
            {name: "临东站北"},
            {name: "临东站南(南一马路)"},
            {name: "凌州大道振工街"},
            {name: "凌州大道兴工街"},
            {name: "凌州大道锦工街"}
        ]
    },*/
    "235": {
        name: "235路",
        operator: "临东客运集团丰河公共汽车分公司",
        firstLastBus: {
            first: "06:00",
            last: "21:00"
        },
        fare: "2元",
        stations: [
            {name: "临东站北"},
            {name: "启航小区西门"},
            {name: "宣庆文化宫"},
            {name: "福佑车库"},
            {name: "市电视台"},
            {name: "府后街市场"},
            {name: "市政府西门"},
            {name: "市府广场"},
            {name: "临东银行"},
            {name: "加油站"},
            {name: "沙坛村轮渡码头"},
            {name: "回南办事处"},
            {name: "兴岛楼"},
            {name: "兴岛楼停车场"}
        ]
    },
    "238": {
        name: "238路",
        operator: "临东地铁公共交通有限公司A区",
        firstLastBus: {
            first: "05:30",
            last: "21:00"
        },
        fare: "2元",
        stations: [
            {name: "临东站西公交枢纽"},
            {name: "临新东路振工街"},
            {name: "胜利大街凌州大道", status: "已取消"},
            {name: "临东站南（南一马路）"},
            {name: "临东站北"},
            {name: "胜利大街建设大路"},
            {name: "南运河北路12号"},
            {name: "启航小区西门"},
            {name: "临房天玺苑"},
            {name: "中鼎大厦"},
            {name: "红岩门"},
            {name: "十里屯"},
            {name: "夏家村"},
            {name: "双池村"},
            {name: "赤炎谷"},
            {name: "北临线甘泉路"},
            {name: "环北家园"}
        ]
    },
    "241": {
        name: "241路",
        operator: "嘎联巴士（临东）有限公司",
        firstLastBus: {
            first: "05:30",
            last: "22:24"
        },
        fare: "2元",
        stations: [
            {name: "人杰湖公园"},
            {name: "莲池"},
            {name: "石桥子"},
            {name: "CT中心"},
            {name: "科普公园东"},
            {name: "临房启航小区"},
            {name: "福佑车库"},
            {name: "中华路立交桥南"},
            {name: "市政府"},
            {name: "市府广场"},
            {name: "新阳路地铁站"},
            {name: "航洋城"},
            {name: "仁德新村"},
            {name: "公交仁德站"}
        ]
    },
    "251": {
        name: "251路",
        operator: "临东客运集团顺鑫巴士公司",
        firstLastBus: {
            first: "06:00",
            last: "23:00"
        },
        fare: "2元",
        stations: [
            {name: "观景台街道办"},
            {name: "沙海绿洲"},
            {name: "临东交通大学"},
            {name: "大学城地铁站"},
            {name: "疏港公园"},
            {name: "疏港公园北"},
            {name: "滨海立交南"},
            {name: "滨海立交北"},
            {name: "海洋基地地铁站"},
            {name: "兴岛楼"},
            {name: "兴岛楼停车场"},
            {name: "滨海街兴岛路北"},
            {name: "重工公园"},
            {name: "精卫街市府大路"},
            {name: "精卫街地铁站"},
            {name: "禹城中学"},
            {name: "中华路建业街"},
            {name: "天顺门"},
            {name: "临东职业技术学院"},
            {name: "建业街南运河北路"},
            {name: "宣庆区政府"},
            {name: "金银库"},
            {name: "福佑车库"},
            {name: "市电视台"},
            {name: "市二十二中"},
            {name: "启航小区西门"},
            {name: "临房天玺苑"},
            {name: "中鼎大厦"},
            {name: "草仓路临中大街"},
            {name: "CT中心"},
            {name: "兰家车辆段西"},
            {name: "青年大街普济路"},
            {name: "石桥子"},
            {name: "莲池"},
            {name: "三家子"},
            {name: "自来水二厂"},
            {name: "临铁·北城新园"},
            {name: "青泽西"},
            {name: "北临线甘泉路"},
            {name: "临北路青年大街"},
            {name: "环北家园"}
        ]
    },
    "253": {
        name: "253路",
        operator: "回南控股临东客运有限责任公司",
        firstLastBus: {
            first: "06:00",
            last: "22:00"
        },
        fare: "2元",
        stations: [
            {name: "花城广场"},
            {name: "建业街草仓路"},
            {name: "建业街穗城路"},
            {name: "南风"},
            {name: "航运大厦"},
            {name: "坂田玖里江山"},
            {name: "职业技术学院东门"},
            {name: "精卫街地铁站"},
            {name: "精卫街市府大路"},
            {name: "沙坛村场站"},
            {name: "沙坛村东"},
            {name: "兴岛楼"},
            {name: "兴岛楼停车场"},
            {name: "海洋基地地铁站"},
            {name: "滨海立交北"},
            {name: "滨海立交南"},
            {name: "疏港公园北"},
            {name: "疏港公园"},
            {name: "大学城地铁站"},
            {name: "观景台南停车场"}
        ]
    },
    "287": {
        name: "287路",
        operator: "临东地铁公共交通有限公司",
        firstLastBus: {
            first: "06:00",
            last: "22:00"
        },
        fare: "2元",
        stations: [
            {name: "临东站"},
            {name: "中华路临中大街"},
            {name: "中华路青年大街"},
            {name: "中华路彩塔街"},
            {name: "中华路文景西街"},
            {name: "天顺门"},
            {name: "临东职业技术学院"},
            {name: "建业街南运河北路"},
            {name: "临医二院"},
            {name: "职业技术学院北门"},
            {name: "南运河北路精卫街"},
            {name: "工农大桥西"},
            {name: "工农大桥东"},
            {name: "曙光路西藏街"},
            {name: "曙光路青海街"},
            {name: "曙光路云南街"},
            {name: "曙光路甘肃街"},
            {name: "四川街曙光路"},
            {name: "四川街一号站"},
            {name: "四川街二号站"},
            {name: "新港路四川街"},
            {name: "新港桥"},
            {name: "新港路重庆街"},
            {name: "碧湖印园"},
            {name: "新港路贵州街"},
            {name: "新港路临港大街"},
            {name: "临港大街金山路"},
            {name: "碧湖中心"},
            {name: "尚瑞集团"},
            {name: "碧湖新城管委会"}
        ]
    },
    "288": {
        name: "288路",
        operator: "嘎联巴士（临东）有限公司",
        firstLastBus: {
            first: "06:30",
            last: "22:30"
        },
        fare: "2元",
        stations: [
            {name: "国际度假基地"},
            {name: "市第一高中"},
            {name: "兰家车辆段"},
            {name: "花城广场北"},
            {name: "精卫街花城路"},
            {name: "雨城广场"},
            {name: "坂田玖里江山"},
            {name: "南运河北路精卫街"},
            {name: "职业技术学院北门"},
            {name: "临医二院"},
            {name: "建业街南运河北路"},
            {name: "临东职业技术学院"},
            {name: "天顺门"},
            {name: "中华路地铁站"},
            {name: "怒江中心东"},
            {name: "临东体育场西门"},
            {name: "宣庆足球场"},
            {name: "李家坎"},
            {name: "临东饭店"},
            {name: "百鸟公园"},
            {name: "临新东路振工街"},
            {name: "临东站西公交枢纽"}
        ]
    },
    "310": {
        name: "310路",
        operator: "临东客运集团顺鑫巴士公司",
        firstLastBus: {
            first: "05:30",
            last: "22:00"
        },
        fare: "2元",
        stations: [
            {name: "怒江街一巷新阳路"},
            {name: "宣实后门", oneWay: "down"},
            {name: "宣庆实验中学", oneWay: "up", note: "清客"},
            {name: "沙井村"},
            {name: "临东体育场西门"},
            {name: "怒江中心东"},
            {name: "中华路地铁站"},
            {name: "中华路建业街"},
            {name: "禹城中学"},
            {name: "重工公园"},
            {name: "海洋公园"},
            {name: "文化街新阳路"},
            {name: "出生点"},
            {name: "忌城路地铁站"},
            {name: "疏港公园"},
            {name: "海港桥北"}
        ]
    },
    "310S": {
        name: "310路支线",
        operator: "临东客运集团顺鑫巴士公司",
        firstLastBus: {
            first: "07:00",
            last: "22:00"
        },
        note: "每天7:00、13:00、22:00发车",
        fare: "2元",
        stations: [
            {name: "怒江街一巷新阳路"},
            {name: "宣实后门", oneWay: "down"},
            {name: "宣庆实验中学", oneWay: "up", note: "清客"},
            {name: "沙井村"},
            {name: "临东体育场西门"},
            {name: "怒江中心东"},
            {name: "中华路地铁站"},
            {name: "中华路建业街"},
            {name: "禹城中学"},
            {name: "重工公园"},
            {name: "海洋公园"},
            {name: "文化街新阳路"},
            {name: "出生点"},
            {name: "忌城路地铁站"},
            {name: "大学城地铁站", oneWay: "down", note: "清客"},
            {name: "观景台南停车场"}
        ]
    },
    "323": {
        name: "323路",
        operator: "临东客运集团丰河公共汽车分公司",
        firstLastBus: {
            first: "06:30",
            last: "21:30"
        },
        fare: "2元",
        stations: [
            {name: "环北家园"},
            {name: "临北路青年大街"},
            {name: "人杰湖公园"},
            {name: "自来水二厂"},
            {name: "三家子"},
            {name: "九二八商场"},
            {name: "莲池"},
            {name: "石桥子"},
            {name: "青年大街普济路"},
            {name: "兰家车辆段西"},
            {name: "CT中心"},
            {name: "科普公园东"},
            {name: "临房启航小区"},
            {name: "宣庆文化宫"},
            {name: "启航小区西门"},
            {name: "市二十二中"},
            {name: "中华路青年大街"},
            {name: "市电视台"},
            {name: "中华路立交桥南"},
            {name: "市政府"},
            {name: "市府广场"},
            {name: "临东饭店"},
            {name: "李家坎"},
            {name: "临东体育场西门"}
        ]
    },
    "323K": {
        name: "323路区间",
        operator: "临东客运集团丰河公共汽车分公司",
        firstLastBus: {
            first: "06:30",
            last: "21:30"
        },
        fare: "2元",
        stations: [
            {name: "环北家园"},
            {name: "临北路青年大街"},
            {name: "人杰湖公园"},
            {name: "自来水二厂"},
            {name: "三家子"},
            {name: "九二八商场"},
            {name: "莲池"},
            {name: "石桥子"},
            {name: "青年大街普济路"},
            {name: "兰家车辆段西"},
            {name: "CT中心"}
        ]
    },
    "387": {
        name: "387路",
        operator: "临东客运集团顺鑫巴士公司",
        firstLastBus: {
            first: "07:00",
            last: "19:00"
        },
        fare: "2元",
        status: "规划",
        note: "将于2024年8月开通",
        stations: [
            {name: "李家坎客运站"},
            {name: "临东饭店"},
            {name: "新阳路地铁站"},
            {name: "仁德新村"},
            {name: "青年大街仁德路"},
            {name: "青年桥北"},
            {name: "远航路青年大街"},
            {name: "平山隧道南"},
            {name: "冰林道口"},
            {name: "雪乡农贸市场"},
            {name: "雪乡乡政府"},
            {name: "雪乡加油站"},
            {name: "雪乡转盘北"},
            {name: "雪乡总医院"}
        ]
    },
    "K801": {
        name: "K801路",
        operator: "临东雨城客运有限公司",
        firstLastBus: {
            first: "06:00",
            last: "20:00"
        },
        fare: "分段计价2-4元(以工农桥为界)",
        note: "前身为K601路",
        stations: [
            {name: "SB客运站南门"},
            {name: "中华路立交桥南"},
            {name: "福佑车库"},
            {name: "宣庆区政府"},
            {name: "临医二院"},
            {name: "曙光路贵州街"},
            {name: "尚瑞集团"},
            {name: "城海客运站"}
        ]
    },
    "V101": {
        name: "V101路",
        operator: "临东客运集团通运巴士运营管理服务中心",
        firstLastBus: {
            first: "07:00",
            last: "20:00"
        },
        fare: "2元",
        stations: [
            {name: "临东大学地铁站"},
            {name: "雪乡客运站"}
        ]
    },
    "V102": {
        name: "V102路",
        operator: "临东客运集团通运巴士运营管理服务中心",
        firstLastBus: {
            first: "05:30",
            last: "20:30"
        },
        fare: "2元",
        stations: [
            {name: "水关庄"},
            {name: "临北路地铁站"},
            {name: "临北路青年大街"},
            {name: "环北家园"}
        ]
    },
    "临东站东西专线": {
        name: "临东站东西专线",
        operator: "临东客运集团通运巴士运营管理服务中心",
        firstLastBus: {
            first: "06:00",
            last: "22:30"
        },
        fare: "2元",
        note: "单向环线运行",
        circularDirection: "clockwise",
        stations: [
            {name: "临东站西公交枢纽", oneWay: "down"},
            {name: "临东站北", oneWay: "down"},
            {name: "临东站", oneWay: "down"},
            {name: "临东站南（南一马路）", oneWay: "down"},
            {name: "临东站西公交枢纽", oneWay: "down"}
        ]
    },
    "环路": {
        name: "环路",
        operator: "临东地铁公共交通有限公司A区",
        firstLastBus: {
            first: "07:00",
            last: "19:00"
        },
        fare: "2元",
        stations: [
            {name: "临东站南（南一马路）"},
            {name: "胜利大街凌州大道"},
            {name: "百鸟公园"},
            {name: "西丘办事处"},
            {name: "地铁大厦"},
            {name: "通合物流场"},
            {name: "航洋城北"},
            {name: "宣庆实验中学"},
            {name: "宣庆足球场"},
            {name: "临东体育场南门"},
            {name: "新阳小区北门"},
            {name: "莲昕"},
            {name: "沙坛村西"},
            {name: "精卫街市府大路"},
            {name: "精卫街地铁站"},
            {name: "禹城中学"},
            {name: "中华路建业街"},
            {name: "天顺门"},
            {name: "临东职业技术学院"},
            {name: "建业街南运河北路"},
            {name: "虎山乐购"},
            {name: "老虎山"},
            {name: "建业街穗城路"},
            {name: "建业街草仓路"},
            {name: "会展中心"},
            {name: "来又来商场"},
            {name: "CT中心"},
            {name: "草仓路临中大街"},
            {name: "中鼎大厦"},
            {name: "临房天玺苑"},
            {name: "启航小区西门"},
            {name: "南运河北路12号"},
            {name: "胜利大街建设大路"},
            {name: "临东站北"}
        ],
        note: "上行为环二路，下行为环一路。线路于2022年8月开通。",
        routeType: "trunk"
    },
    "901": {
        name: "901路",
        operator: "临东客运集团有限公司/嘎联巴士（临东）有限公司",
        firstLastBus: {
            first: "05:40",
            last: "22:40"
        },
        fare: "2元",
        stations: [
            {name: "花城广场"},
            {name: "会展中心"},
            {name: "来又来"},
            {name: "文化宫北"},
            {name: "松山湖南"},
            {name: "来又来商场", oneWay: "down"},
            {name: "松山湖广场", oneWay: "up"},
        ]
    },
    "902": {
        name: "902路",
        operator: "临东客运集团有限公司/嘎联巴士（临东）有限公司",
        firstLastBus: {
            first: "05:05",
            last: "22:00"
        },
        fare: "2元",
        circularDirection: "counterclockwise",
        stations: [
            {name: "花城广场"},
            {name: "会展中心", oneWay: "down"},
            {name: "文化宫北", oneWay: "down"},
            {name: "华为", oneWay: "down"},
            {name: "花城广场西", oneWay: "up"},
            {name: "国美大厦", oneWay: "up"},
            {name: "东升大厦", oneWay: "up"},
            {name: "雨城广场", oneWay: "up"},
            {name: "唯品会大厦", oneWay: "up"},
            {name: "坂田城大厦", oneWay: "up"},
            {name: "华为公司", oneWay: "up"},
            {name: "南风"},
            {name: "玖里江山北门"},
            {name: "航运公司"},
            {name: "雨城广场"},
            {name: "XX公司"},
            {name: "花城广场北"},
            {name: "花城广场"}
        ]
    },
    "903": {
        name: "903路",
        operator: "临东客运集团有限公司/嘎联巴士（临东）有限公司",
        firstLastBus: {
            first: "05:05",
            last: "22:00"
        },
        fare: "2元",
        circularDirection: "counterclockwise",
        stations: [
            {name: "花城广场"},
            {name: "会展中心", oneWay: "down"},
            {name: "来又来", oneWay: "down"},
            {name: "文化宫北", oneWay: "down"},
            {name: "都湖国际", oneWay: "down"},
            {name: "松山湖广场", oneWay: "down"},
            {name: "来又来商场", oneWay: "down"},
            {name: "松山湖南", oneWay: "down"},
            {name: "花城广场西", oneWay: "up"},
            {name: "国美大厦", oneWay: "up"},
            {name: "东升大厦", oneWay: "up"},
            {name: "雨城广场", oneWay: "up"},
            {name: "唯品会大厦", oneWay: "up"},
            {name: "坂田城大厦", oneWay: "up"},
            {name: "华为公司",},
            {name: "玖里江山西门"},
            {name: "玖里江山南门"},
            {name: "玖里江山东门"},
            {name: "雨城广场南"},
            {name: "游泳馆东"},
            {name: "体育中心"},
            {name: "客运港站"},
            {name: "花城东路"},
            {name: "有轨清㘵"},
            {name: "XX公司"},
            {name: "花城广场北"},
            {name: "花城广场"}
        ]
    },
    "904": {
        name: "904路",
        operator: "临东客运集团有限公司/嘎联巴士（临东）有限公司",
        firstLastBus: {
            first: "05:15",
            last: "22:55"
        },
        fare: "2元",
        stations: [
            {name: "花城广场"},
            {name: "来又来"},
            {name: "铁西汽车城管理委员会"},
            {name: "汽车城停车场"},
        ]
    },
    "观光一线": {
        name: "观光一线",
        operator: "临东客运集团丰河公共汽车分公司",
        firstLastBus: {
            first: "07:00",
            last: "21:30"
        },
        fare: "5元",
        circularDirection: "clockwise",
        stations: [
            {name: "李家坎客运站", oneWay: "down"},
            {name: "市政府", oneWay: "down"},
            {name: "临东站", oneWay: "down"},
            {name: "CT中心", oneWay: "down"},
            {name: "会展中心", oneWay: "down"},
            {name: "老虎山", oneWay: "down"},
            {name: "天顺门", oneWay: "down"},
            {name: "中华路立交桥南", oneWay: "down"},
            {name: "市政府", oneWay: "down"},
            {name: "临东银行", oneWay: "down"},
            {name: "李家坎客运站", oneWay: "down"}
        ]
    },
};

export default busRoutes;
