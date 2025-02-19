// 内容数据
const contentData = [
    {
        title: '服管会祝各位玩家新年快乐！',
        image: '#A61B29',
        link: '',
        date: '2025-01-21',
        expireDate: '2025-02-12',
        summary: '临东市服务器管理委员会祝各位玩家朋友新年快乐，身体健康，万事如意！',
        category: '网站公告',
        showInBanner: false
    },
    {
        title: '临东推出首枚文化纪念印章',
        image: '../data/content_banner/主题纪念章海报.png',
        link: 'https://pd.qq.com/g/58ocn0s744/post/B_e092aa67439105001441152186775804310X60',
        date: '2025-02-11',
        summary: '2月12日起，临东将正式推出首枚「文化纪念印章」，以记录每位玩家与服务器共同创造的回忆，现诚邀您参与这场跨越虚拟与现实的仪式！',
        category: '网站公告',
        showInBanner: true
    },
    {
        title: '松山湖有轨电车停止对外服务',
        image: '#00b0f0',
        link: '',
        date: '2025-02-18',
        summary: '为了合理利用资源，现决定，松山湖有轨电车停止对外服务，园区穿梭巴士行车间隔由20分钟一班压缩至10分钟一班，至有轨电车松山湖线整改完成后恢复正常间隔。',
        category: '运营信息',
        showInBanner: true
    },
    {
        title: '上官发表服务器2025年新年献词',
        image: '../data/content_banner/25贺词头图.png',
        link: 'https://www.bilibili.com/video/BV1DDFPesEqS',
        date: '2025-01-27',
        releaseTime: '2025-01-27 19:30',
        summary: '乙巳新年到来之际，临东市市长上官通过临东广播电视台和互联网发表了临东市服务器2025年新年献词',
        category: '网站公告',
        showInBanner: false
    },
    {
        title: '上官将发表服务器2025年新年献词',
        image: '../data/content_banner/25贺词头图.png',
        link: 'https://pd.qq.com/g/58ocn0s744/post/B_6cd695671d1d00001441152186775804310X60',
        date: '2025-01-26',
        expireDate: '2025-01-28',
        summary: '临东市市长上官将于27日晚19时30分通过临东广播电视台和互联网发表服务器2025年新年献词',
        category: '网站公告',
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
        category: '运营信息',
        showInBanner: false
    },
    {
        title: '公交“忌临大道地铁站”站更名',
        image: '',
        link: 'https://pd.qq.com/g/58ocn0s744/post/B_cdfea167758606001441152186805331340X60',
        date: '2025-02-04',
        summary: '为提高公交站名的周边关联度，“忌临大道地铁站” 站位名称更改为 “新阳小区北门”，涉及线路：环路、138 路。目前站名更改工作已经完成，乘客可登录“临东市服务器 Wiki”或“公交线路图”页面查询具体信息。',
        category: '运营信息',
        showInBanner: false
    },
    {
        title: '临铁海峡.外运轮渡停运半年',
        image: '',
        link: '',
        date: '2025-02-19',
        expireDate: '2025-07-31',
        summary: '临铁海峡.外运轮渡决定于2025年2月至7月期间停运半年，进行旧有轮船的升级改造。给您带来的不便，敬请谅解。',
        category: '运营信息',
        showInBanner: true
    },
];

// 导出数据
export { contentData }; 