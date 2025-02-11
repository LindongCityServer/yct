const productData = [
    {
        id: "yct-card",
        title: "雨城通卡",
        description: "雨城通平台在服务器上的“实体卡”，可以用于乘坐地铁、公交等交通工具，2022年开始启用第三代设计，2023年7月作为物品正式引入服务器内。",
        coverImage: "../product_gallery/res/雨城通卡/第三版雨城通卡面.png",
        detailImages: [
            "../product_gallery/res/雨城通卡/第三版雨城通卡面.png",
            "../product_gallery/res/雨城通卡/第三版学生卡面封面.png",
            "../product_gallery/res/雨城通卡/第三版地铁单程票.png",
            "../product_gallery/res/雨城通卡/第三版机场线单程票.png"
        ],
        date: "2023-07",
        pinned: true
    },
    {
        id: "8th-visual",
        title: "八周年视觉升级",
        description: "基于现有logo进行抽象化处理，兼具几何美和现代感。",
        coverImage: "../product_gallery/res/8周年视觉升级/视觉升级海报.png",
        detailImages: [
            "../product_gallery/res/8周年视觉升级/视觉升级海报.png",
            "../product_gallery/res/8周年视觉升级/1.png",
            "../product_gallery/res/8周年视觉升级/2.png",
            "../product_gallery/res/8周年视觉升级/3.png",
            "../product_gallery/res/8周年视觉升级/4.png",
            "../product_gallery/res/8周年视觉升级/5.png",
            "../product_gallery/res/8周年视觉升级/6.png"
        ],
        date: "2024-08",
    },
    {
        id: "lindong-map",
        title: "临东城区地图",
        description: "开服多年首次在卫星地图之余将地名记在纸上，是玩家积攒多年的情感和记忆的交汇点。",
        coverImage: "https://wiki.shangxiaoguan.top/images/archive/c/c2/20240725173346%21%E9%A6%96%E9%A1%B5%E8%A7%86%E8%A7%89.png",
        detailImages: [
            "../product_gallery/res/城区地图/1.png",
            "../product_gallery/res/城区地图/2.png",
        ],
        date: "2024-05"
    },
    {
        id: "yct-card-gen2",
        title: "雨城通卡第二代卡面",
        description: "基于五周年卡贴周边在外观上进行了升级，并增加了学生卡的选项。",
        coverImage: "../product_gallery/res/雨城通卡/雨城通卡面 第二版.png",
        detailImages: [
            "../product_gallery/res/雨城通卡/雨城通卡面 第二版.png",
            "../product_gallery/res/雨城通卡/学生卡卡面第二版.png",
            "../product_gallery/res/雨城通卡/老年卡卡面第二版.png"
        ],
        date: "2021-09"
    },
    {
        id: "5th-anniversary",
        title: "五周年纪念周边",
        description: "明信片、卡贴、卡套、钥匙链、徽章……花掉了服务器续费一年的费用，搭配打卡活动，盛况空前。",
        coverImage: "../product_gallery/res/5周年活动/5周年全部周边.jpg",
        detailImages: [
            "../product_gallery/res/5周年活动/5周年全部周边.jpg",
            "../product_gallery/res/5周年活动/5周年logo圆形.png",
            "../product_gallery/res/5周年活动/5周年卡面.png",
            "../product_gallery/res/5周年活动/5周年明信片.jpg",
            "../product_gallery/res/5周年活动/卡套-1.png"
        ],
        date: "2021-08"
    },
    {
        id: "5th-anniversary-card",
        title: "五周年明信片",
        description: "是明信片，也是打卡内容，服务器管理为每一个打卡点第一个到的玩家都写了一张。",
        coverImage: "../product_gallery/res/5周年活动/明信片-0.png",
        detailImages: [
            "../product_gallery/res/5周年活动/明信片-0.png",
            "../product_gallery/res/5周年活动/明信片-1.png",
            "../product_gallery/res/5周年活动/明信片-2.png",
            "../product_gallery/res/5周年活动/明信片-3.png",
            "../product_gallery/res/5周年活动/明信片-4.png",
            "../product_gallery/res/5周年活动/明信片-5.png",
            "../product_gallery/res/5周年活动/明信片-6.png",
            "../product_gallery/res/5周年活动/明信片-7.png",
            "../product_gallery/res/5周年活动/明信片-8.png",
            "../product_gallery/res/5周年活动/明信片-9.png"
        ],
        date: "2021-08"
    },
    {
        id: "first-badge",
        title: "开服纪念徽章",
        description: "第一次正式开门迎客，第一个实体纪念周边，意义不言而喻。",
        coverImage: "../product_gallery/res/开服纪念徽章.png",
        detailImages: [
            "../product_gallery/res/开服纪念徽章.png"
        ],
        date: "2020-08"
    },
    {
        id: "yct-card-gen1",
        title: "雨城通卡初代卡面",
        description: "将地铁、公交、轮渡整合在一起，从“小程序”升级到了“实体卡”。",
        coverImage: "../product_gallery/res/雨城通卡/雨城通卡面2.png",
        detailImages: [
            "../product_gallery/res/雨城通卡/关爱卡卡面.png",
            "../product_gallery/res/雨城通卡/夕阳红卡卡面.png",
            "../product_gallery/res/雨城通卡/残疾人乘车卡.png",
            "../product_gallery/res/雨城通卡/盲人乘车卡.png"
        ],
        date: "2021-07"
    },
    {
        id: "ldt-card",
        title: "临东通卡",
        description: "第一次尝试，脱胎于地铁储值票，具有一些早期交通卡的特征。",
        coverImage: "../product_gallery/res/临东通卡/老虎山.png",
        detailImages: [
            "../product_gallery/res/临东通卡/冰岭西路.png"
        ],
        date: "2019-08"
    },
    {
        id: "beacon-card",
        title: "银行“信标卡”",
        description: "信标卡是银行在服务器内的“实体”储蓄、信用卡系列，理论上也可以用于乘坐地铁、公交等交通工具，但暂时还没有正式上线。",
        coverImage: "../product_gallery/res/信标卡/信标借记卡卡面.png",
        detailImages: [
            "../product_gallery/res/信标卡/信标借记卡卡面.png",
            "../product_gallery/res/信标卡/信标信用卡卡面.png",
            "../product_gallery/res/信标卡/信标白金借记卡卡面.png",
            "../product_gallery/res/信标卡/信标白金信用卡卡面.png"
        ],
        date: "2023-11"
    }
];

export default productData; 