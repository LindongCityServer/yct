// 内容数据
const contentData = [
    {
        title: '马年阔步行，|万事皆可期！',
        image: '#A61B29',
        link: '',
        date: '2026-02-17',
        releaseTime: '2026-02-17 00:00',
        expireDate: '2026-02-24',
        summary: '临东市服务器管理委员会祝各位在新春佳节心有所悦、业有所成！',
        category: '通知公告',
        showInBanner: false
    },
    {
        title: '服管会|发表|2025年|年度报告',
        image: '../data/content_banner/25报告头图.png',
        link: '/content/260215年度报告2025.html',
        date: '2026-02-16',
        releaseTime: '2026-02-15 18:00',
        summary: '丙午蛇年到来之际，临东市服务器管理委员会通过互联网发表了临东市服务器2025年年度报告。',
        category: '通知公告',
        showInBanner: true
    },
    {
        title: '临东|地图|搜索|征集标记点',
        image: '../data/content_banner/市府广场-升旗台卫星图像.png',
        link: '/map_search',
        date: '2025-08-16',
        summary:'欢迎为临东地图搜索投稿各类标记点！只需拖动或用键盘添加标记点，在右上角打开管理界面即可提交代码以供审核。标记点如被采纳将出现在地图搜索中，供所有玩家使用！',
        category: '通知公告',
        showInBanner: true
    },
    {
        title: '临东|地铁|调整|计费方式',
        image: '--metro-color',
        link: '/metro_map',
        date: '2025-06-15',
        summary:'15日起，临东地铁计费方式从分区计费改为按里程分段计费。新方案起步价为2元可乘坐的计费里程为6公里，之后每增加1元，可续乘的计费里程依次为4、4、7、7、10、10公里。调整后，起步价覆盖里程平均缩短1至2站距离，但目前全线网的最高票价仍维持3元不变。点击链接或页面顶部蓝色横幅可进入地铁线网图查询具体票价。',
        category: '地铁运营',
        showInBanner: false
    },
    {
        title: '服管会|呼吁|共同维护|线路|运营秩序',
        image: '../data/content_banner/服管会呼吁共同维护线路运营秩序.png',
        link: 'https://pd.qq.com/s/2b9byqcxs',
        date: '2025-03-08',
        summary: '本月新任轮值管理段冰峰就公交站牌规范化问题在群内发起讨论，引发玩家广泛热议。各方就站牌制作标准达成共识，共同推动公交线路规范化运营。',
        category: '通知公告',
        showInBanner: false
    },
    {
        title: '临东|推出|首枚|文化|纪念印章',
        image: '../data/content_banner/主题纪念章海报.png',
        link: 'https://pd.qq.com/g/58ocn0s744/post/B_e092aa67439105001441152186775804310X60',
        date: '2025-02-11',
        summary: '2月12日起，临东将正式推出首枚「文化纪念印章」，以记录每位玩家与服务器共同创造的回忆，现诚邀您参与这场跨越虚拟与现实的仪式！',
        category: '通知公告',
        showInBanner: true
    },
    {
        title: '临东|地铁|3号|线|延长线开工',
        image: '../data/content_banner/临东3号线延长线开工.png',
        link: '',
        date: '2025-04-03',
        summary: '临东地铁3号线东延线（图画湾—城海新港段）、西延线（云峰街—沙岭段）先后开工，预计完工后全线车站数量将增加至23座，并连通碧湖、市区、铁西、汽车城等地区。目前东延线高架段已完成铺线，新一批列车正在上线试测试。',
        category: '地铁运营',
        showInBanner: false
    },
    {
        title: '临东|地铁|北联|轨交展|云展厅',
        image: '/data/content_banner/北联轨交展展厅.png',
        link: '/content/250722.html',
        date: '2025-07-22',
        summary:'临东地铁确认参加2025北联第一届轨道交通展览会，点击链接立即进入临东地铁云展厅……',
        category: '地铁运营',
        showInBanner: true
    },
    {
        title: '临东|金桦|机场|滑行道|及|跑道|完成铺设',
        image: '../data/content_banner/临东金桦机场开工.png',
        link: '',
        date: '2025-03-20',
        summary: '在经过选址调整之后，机场一期于3月5日开工。设计飞行区等级为4F级，设有一条长度3800的跑道、一个货场以及一座航站楼。目前跑道及滑行道已完成铺设。',
        category: '运营信息',
        showInBanner: false
    },
    {
        title: '松山湖|有轨|电车|改造|计划公布',
        image: '../content/res/250221松山湖有轨电车公布改造计划/0.jpg',
        link: '../content/250221松山湖有轨电车公布改造计划.html',
        date: '2025-02-21',
        summary: '松山湖有轨电车全面升级：运力翻倍、混跑提速、色彩缤纷、标准统一、调度强大……点击查看全图，了解更多详情！',
        category: '有轨运营',
        showInBanner: false
    },
    {
        title: '松山湖有轨电车停止对外服务',
        image: '#00b0f0',
        link: '',
        date: '2025-02-18',
        summary: '为了合理利用资源，现决定松山湖有轨电车停止对外服务，园区穿梭巴士行车间隔由20分钟一班压缩至10分钟一班，至有轨电车松山湖线整改完成后恢复正常间隔。',
        category: '有轨运营',
        showInBanner: false
    },
    {
        title: '上官发表服务器2025年新年献词',
        image: '../data/content_banner/25贺词头图.png',
        link: 'https://www.bilibili.com/video/BV1DDFPesEqS',
        date: '2025-01-27',
        releaseTime: '2025-01-27 19:30',
        summary: '乙巳新年到来之际，临东市市长上官通过临东广播电视台和互联网发表了临东市服务器2025年新年献词',
        category: '通知公告',
        showInBanner: false
    },
    {
        title: '上官将发表服务器2025年新年献词',
        image: '../data/content_banner/25贺词头图.png',
        link: 'https://pd.qq.com/g/58ocn0s744/post/B_6cd695671d1d00001441152186775804310X60',
        date: '2025-01-26',
        expireDate: '2025-01-28',
        summary: '临东市市长上官将于27日晚19时30分通过临东广播电视台和互联网发表服务器2025年新年献词',
        category: '通知公告',
        showInBanner: false
    },
    {
        title: '服管会就"私营铁路"问题发表谈话',
        image: '',
        link: 'https://pd.qq.com/g/58ocn0s744/post/B_3e5d4467fb960e001441152186775804310X60',
        date: '2024-11-25',
        summary: '近日，针对社会各界关注的"私营铁路"问题，服管会发表正式谈话...',
        category: '通知公告',
        showInBanner: false
    },
    {
        title: '临东引入两款新型环保公交车',
        image: 'https://wiki.shangxiaoguan.top/images/archive/c/c2/20241207072144%21%E9%A6%96%E9%A1%B5%E8%A7%86%E8%A7%89.png',
        link: 'https://pd.qq.com/g/58ocn0s744/post/B_2a14b266f09c04001441152186805331340X60',
        date: '2024-08-18',
        summary: '为进一步推进公共交通绿色化发展，临东地区引入了两款新型环保公交车...',
        category: '公交运营',
        showInBanner: false
    },
    {
        title: '临北巴士调整春节期间运营时间',
        image: '',
        link: '',
        date: '2025-01-14',
        expireDate: '2025-03-02',
        summary: '155路部分车次终到石桥子，181路根据情况适当添加运力，分局站点乘车的乘客请提前15分钟联系调度：148-4032-7956。预祝各位玩家，居民，来访游客节日快乐！——临北巴士',
        category: '公交运营',
        showInBanner: false
    },
        {
        title: '310路调整运营时间',
        image: '',
        link: 'https://pd.qq.com/s/2kgyji3gt?shareSource=5',
        date: '2025-01-03',
        expireDate: '2025-03-02',
        summary: '发班时间调整为8:00（宣实发）和18:00（疏港发），310支线临时停运',
        category: '公交运营',
        showInBanner: false
    },
    {
        title: '公交181路开通运营',
        image: 'https://wiki.shangxiaoguan.top/images/5/5e/181%E8%B5%B0%E5%90%91%E5%9B%BE.png',
        link: 'https://wiki.shangxiaoguan.top/临东公交181路',
        date: '2025-01-17',
        summary: '临东公交181路由青咀子始发，以城海客运站为终点，是临东临北巴士有限责任公司旗下的一条线路。线路执行2元单一票制。',
        category: '公交运营',
        showInBanner: false
    },
    {
        title: '310路春节期间将停运',
        image: '',
        link: '',
        date: '2025-01-21',
        expireDate: '2025-02-05',
        summary: '310路春节期间将在1月22日至2月4日期间停运，请各位乘客注意',
        category: '公交运营',
        showInBanner: false
    },
    {
        title: '嘎联巴士调整运营班次',
        image: '',
        link: '',
        date: '2025-01-26',
        expireDate: '2025-02-04',
        summary: '嘎联巴士旗下路线将在春节期间减为逢半点和整点发班，带来的不变敬请谅解',
        category: '公交运营',
        showInBanner: false
    },
    {
        title: '松山湖巴士和有轨春节期间调整间隔',
        image: '',
        link: '',
        date: '2025-01-26',
        expireDate: '2025-02-13',
        summary: '花城广场运营有限公司将在2025年1月27日至2025年2月12日期间调整穿梭巴士和有轨电车的发车间隔：松山湖园区穿梭巴士发车间隔增加5分钟，松山湖有轨电车发车间隔增加100%，由原来3min一班车延长至6min',
        category: '有轨运营',
        showInBanner: false
    },
    {
        title: '公交“忌临大道地铁站”站更名',
        image: '',
        link: 'https://pd.qq.com/g/58ocn0s744/post/B_cdfea167758606001441152186805331340X60',
        date: '2025-02-04',
        summary: '为提高公交站名的周边关联度，“忌临大道地铁站” 站位名称更改为 “新阳小区北门”，涉及线路：环路、138 路。目前站名更改工作已经完成，乘客可登录“临东市服务器 Wiki”或“公交线路图”页面查询具体信息。',
        category: '公交运营',
        showInBanner: false
    },
    {
        title: '公交“翡翠池”站更名',
        image: '../data/content_banner/公交水镜未来馆站.png',
        link: '',
        date: '2025-02-19',
        summary: '“翡翠池“公交站更名为“水镜未来馆”，涉及152路、155路。目前站名更改工作正在进行，乘客可访问“公交线路图”页面查询具体信息。',
        category: '公交运营',
        showInBanner: false
    },
    {
        title: '临铁|海峡.|外运|轮渡|停运半年',
        image: '',
        link: '',
        date: '2025-02-19',
        expireDate: '2025-07-31',
        summary: '临铁海峡.外运轮渡决定于2025年2月至7月期间停运半年，进行旧有轮船的升级改造。给您带来的不便，敬请谅解。',
        category: '运营信息',
        showInBanner: false
    },
    {
        title: '临北巴士公布3月时刻表',
        image: '../data/content_banner/155路3月时刻表.jpg',
        link: '../content/250225临北巴士3月发车时间.html',
        date: '2025-02-25',
        expireDate: '2025-03-31',
        summary: '为方便广大乘客候车，现公布3月临东临北巴士155路和181路发车时刻表以供参考。日常运营中会根据实际运营情况临时调点，推荐广大乘客提前5-10分钟候车！！！',
        category: '公交运营',
        showInBanner: false
    },
    {
        title: '183路、|K881路|开通运营',
        image: '../data/content_banner/五间房公交枢纽.jpg',
        link: '',
        releaseTime: '2025-03-09 6:30',
        date: '2025-03-09',
        summary: '五间房公交枢纽，3月9日盛大启航，183路 K881路 双线齐发',
        category: '公交运营',
        showInBanner: false
    },
    {
        title: '综合|保税区|及|碧湖|新城|部分|公交|车站更名',
        image: '../data/content_banner/综合保税区部分公交站更名.png',
        link: '',
        date: '2025-03-03',
        summary: '为适应最新城市规划并配合市政道路更名，现对综合保税区（千池山街道）和碧湖新城境内部分公交车站更名，涉及线路：287路、K801路。目前站名更改工作正在进行，乘客可打开“公交线路图”页面或查阅服务器Wiki查询具体信息。如有问题，请及时联系服务器管理员反馈。',
        category: '公交运营',
        showInBanner: false
    },
    {
        title: '310路|支线|即将|暂停运营',
        image: '--bus-color',
        link: 'https://pd.qq.com/s/2q9tiutrn',
        date: '2025-03-08',
        expireDate: '2025-04-01',
        summary: '因受大环境及线路周转效率低下与客流较低等因素影响，公共汽车310支线将于2025年3月31日暂停运营，不便之处敬请谅解。顺鑫公司310车队',
        category: '公交运营',
        showInBanner: false
    },
    {
        title: '181支线、|183路|增加|南山|派出所|临时|停靠站',
        image: '--bus-color',
        link: '',
        date: '2025-03-20',
        summary: '临北巴士181支线及183路自即日起新增南山派出所临时停靠站。该站点为临时性设置，公交线路图页面的相关信息将延后更新，具体运营安排请关注后续通知。',
        category: '公交运营',
        showInBanner: false
    },
    {
        title: '临东|地铁|3号线|列车|开展|技术测试',
        image: '',
        link: 'https://pd.qq.com/g/58ocn0s744/post/B_49baef6748ef09001441152186775804310X60',
        date: '2025-04-05',
        summary:'经过连续4小时的高强度数据采集与分析，临东地铁集团于4月4日正式公布地铁3号线延长段列车性能测试完整报告。数据显示，新一代智能列车在加速性能、制动安全及线路适配性等维度均实现跨越式提升，其中平均加速度实测达0.95m/s²，为临东地铁后续建设指明方向。',
        category: '地铁运营',
        showInBanner: false
    },
    {
        title: '李家坎|片区|公交|站点更名',
        image: '--bus-color',
        link: '',
        date: '2026-01-06',
        summary: '为顺应李家坎片区发展，原“回南控股公司”“文景屯”“怒江中心东”公交站点将分别更名为“彩塔·创新天地”“怒江公园西”及“怒江公园东”，原“加油站”临时站点将转正为“怒江商务港”站，敬请各位乘客留意。',
        category: '公交运营',
        showInBanner: false
    },
    {
        title: '临东公交323路调整线路走向',
        image: '--bus-color',
        link: '/bus_routemap/index.html?route=323',
        date: '2026-01-06',
        summary: '临东公交323路调整在人杰湖片区及李家坎片区的线路走向，共新增4个站点，点击上方链接可查看具体线路走向。',
        category: '公交运营',
        showInBanner: false
    },
    {
        title: '临东公交V102路即将停运',
        image: '--bus-color',
        link: '',
        date: '2026-01-07',
        summary: '临东公交V102路将于1月18日正式停运，乘客可乘坐251、323路等线路继续前往市区各站。',
        category: '公交运营',
        showInBanner: false
    },
	{
		title: '临东|大学|片区|公交|站点调整',
		image: '--bus-color',
		link: '',
		date: '2026-03-18',
		summary: '为顺应临东大学片区发展，原“临东大学西门”“大学里”“临东交通大学”公交站点将分别更名为“平山隧道北”“临东大学西门”及“临东大学北门”，原“大学城地铁站”站点取消。251路增设“临东大学北门”站，原“沙海绿洲”站取消。本次更名以线路为单位推进，由于部分站点更名涉及线路较多，更新期间存在同一站点不同线路更名不同步，期间可能出现站牌、报站信息暂不一致的情况。由此给广大乘客带来的不便，敬请谅解。',
		category: '公交运营',
		showInBanner: true
	},
];

// 导出数据
export { contentData }; 