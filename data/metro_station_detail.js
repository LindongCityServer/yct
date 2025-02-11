window.stationDetail = [
    {
        name: "1号线",
        maxCarCount: 6,
        stationTemplate: [
            {
                name: "default",
                overGround: false,
                layers: [
                    { floor: "B1", type: "concourse", },
                    { floor: "B2", type: "platform", },
                ],
                facilities: [
                    { type: "toilet", location: 0, },
                    { type: "escalator_and_stairs", location: 1, endFloor: "B1", direction: "downwards", oneWay: "none" },
                    { type: "escalator_and_stairs", location: 3, endFloor: "B1", direction: "downwards", oneWay: "none" },
                    { type: "elevator", location: 3.5, endFloor: "B1", },
                    { type: "escalator_and_stairs", location: 5, endFloor: "B1", direction: "upwards", oneWay: "none" },
                    { type: "toilet", location: 6, },
                ],
            },
        ],
        stations: [
            { 
                name: "临北路", 
                template: "default",
                exits: [
                    {
                        floor: "B1",
                        upwards: [
                        {code:"A",description:"临北路 路南"},
                        {code:"D",description:"临北路 路南"},
                        ],                    
                    },
                ],
                surrounding_stations: ["临北路地铁站"]
            },

            { 
                name: "江阳路",  

                template: "default",
                exits: [
                    {
                        floor: "B1",
                        upwards: [
                            {code:"A",description:""},
                            {code:"D",description:""},
                        ],
                    },
                ]
            },
            { 
                name: "度假基地",  
                template: "default",
                exits: [
                    {
                        floor: "B1",
                        downwards: [
                            {code:"B",description:"建业街 路东/普济路 路北"},
                            {code:"C",description:"建业街 路东/普济路 路南"},
                        ],
                    },
                ],
                surrounding_stations: ["国际度假基地","市第一高中"]
            },

            { 
                name: "花城广场",

                template: "default",
                exits: [
                    {
                        floor: "B1",
                        upwards: [
                            {code:"A",description:"建业街 路西/草仓路 路北"},
                        {code:"B",description:"建业街 路西/草仓路 路南"},
                    ],
                    downwards: [
                        {code:"D",description:"建业街 路东/花城路 路南"},
                        ],
                    },
                ],
                surrounding_stations: ["花城广场地铁站","会展中心", "建业街草仓路","会展东","花城广场西"]
            },
            { 
                name: "建业街临医二院", 

                overGround: false,
                layers: [
                    { floor: "B1", type: "concourse", },
                    { floor: "B2", type: "platform", },
                    { floor: "B3", type: "transfer", },
                ],
                facilities: [
                    { type: "toilet", location: 0, },
                    { type: "escalator", location: 1, endFloor: "B3", direction: "downwards", oneWay: "none" },
                    { type: "escalator_and_stairs", location: 1.5, endFloor: "B1", direction: "upwards", oneWay: "none" },
                    { type: "escalator_and_stairs", location: 2, endFloor: "B1", direction: "upwards", oneWay: "none" },
                    { type: "escalator", location: 2.5, endFloor: "B3", direction: "downwards", oneWay: "none" },
                    { type: "elevator", location: 3, endFloor: "B1", },
                    { type:"escalator_and_stairs", location: 5, endFloor: "B1", direction: "downwards", oneWay: "none" },
                    { type: "toilet", location: 6, },
                ],
                transfer: [
                    { floor: "B1", direction: "here", location: 1.8, line: "10号线", },
                    { floor: "B3", direction: "here", location: 2.2, line: "10号线", },
                ],
                exits: [
                    {
                        floor: "B1",
                        upwards: [
                            {code:"D",description:"南运河北路 路北/建业街 路西"},
                    ],
                    downwards: [
                        {code:"B",description:"南运河北路 路南/建业街 路东"},
                        {code:"C",description:"南运河北路 路南/建业街 路西"},
                        ],
                    },
                ],
                surrounding_stations: ["临医二院","建业街南运河北路","虎山乐购","宣庆区政府","华为"]
            },

            { 
                name: "中华路",

                overGround: false,
                layers: [
                    { floor: "B1", type: "concourse", },
                    { floor: "B2", type: "platform", },
                    { floor: "B3", type: "transfer", },
                ],
                facilities: [
                    { type: "toilet", location: 0, },
                    { type: "escalator_and_stairs", location: 1, endFloor: "B1", direction: "downwards", oneWay: "none" },
                    { type: "escalator", location: 1.5, endFloor: "B3", direction: "downwards", oneWay: "none" },
                    { type: "escalator", location: 3, endFloor: "B3", direction: "upwards", oneWay: "none" },
                    { type: "elevator", location: 3.5, endFloor: "B1", },
                    { type:"escalator_and_stairs", location: 5, endFloor: "B1", direction: "upwards", oneWay: "none" },
                    { type: "toilet", location: 6, },
                ],
                transfer: [
                    { floor: "B1", direction: "here", location: 2.2, line: "3号线", },
                    { floor: "B3", direction: "here", location: 2.2, line: "3号线", },
                ],
                exits: [
                    {
                        floor: "B1",
                        upwards: [
                            {code:"A",description:"中华路 路北/建业街 路东"},
                        {code:"B",description:"中华路 路北/建业街 路西"},
                    ],
                    downwards: [
                        {code:"C",description:"中华路 路南/建业街 路西"},
                        ],
                    },
                ],
                surrounding_stations: ["禹城中学","天顺门","中华路地铁站","中华路文景西街"]
            },
            { 
                name: "市府大路",

                template: "default",
                exits: [
                    {
                        floor: "B1",
                        upwards: [
                        {code:"B",description:""},
                        {code:"D",description:""},
                    ],
                    },
                ],
                surrounding_stations: ["沙坛村轮渡码头","精卫街市府大路"]
            },
            { 
                name: "海洋基地",

                template: "default",
                transfer: [
                    //{ floor: "B1", direction: "here", location: 3, line: "2号线", transferDirection: "downwards"},
                    //{ floor: "B2", direction: "here", location: 3, line: "2号线", transferDirection: "upwards"},
                ],
                exits: [
                    {
                        floor: "B1",
                        upwards: [
                            {code:"A",description:"滨海街 路东"},
                    ],
                    downwards: [
                        {code:"C",description:"文化街 路东"},
                        ],
                    },
                ],
                surrounding_stations: ["海洋基地地铁站","海洋基地"]
            },
            { 
                name: "忌城路",

                template: "default",
                transfer: [
                    //{ floor: "B1", direction: "here", location: 3, line: "2号线", transferDirection: "upwards"},
                    //{ floor: "B2", direction: "here", location: 3, line: "2号线", transferDirection: "downwards"},
                ],
                exits: [
                    {
                        floor: "B1",
                        upwards: [
                            {code:"D",description:"忌城路 路西"},
                    ],
                    downwards: [
                        {code:"B",description:"疏港路 路东"},
                        ],
                    },
                ],
                surrounding_stations: ["海港桥北","疏港公园","忌城路地铁站"]
            },

            { 
                name: "冰岭西路", 

                overGround: true,
                layers: [
                    { floor: "2F", type: "platform", },
                    { floor: "1F", type: "concourse", },
                ],
                facilities: [
                    { type: "elevator", location: 0, endFloor: "1F", },
                    { type: "escalator", location: 1, endFloor: "1F", direction: "downwards", oneWay:"down" },
                    { type: "escalator", location: 2.5, endFloor: "1F", direction: "upwards", oneWay:"down" },
                    { type: "escalator", location: 4, endFloor: "1F", direction: "upwards", oneWay:"up", },
                ],
                facilitiesUpwards: [                
                    { type: "elevator", location: 0, endFloor: "1F", },
                    { type: "escalator", location: 1, endFloor: "1F", direction: "downwards", oneWay: "none" },
                    { type: "escalator", location: 2.5, endFloor: "1F", direction: "upwards", oneWay: "none" },
                    { type: "escalator", location: 4, endFloor: "1F", direction: "upwards", oneWay: "none" },
                ],
                exits: [
                    {
                        floor: "1F",
                        upwards: [
                            {code:"B",description:""},
                        ],
                    },
                ]
            }
        ]
    },
    {
        name: "3号线",
        maxCarCount: 6,
        stations: [
            {
                name: "临湖路",
                overGround: false,
                layers: [
                    { floor: "B1", type: "concourse", },
                    { floor: "B2", type: "platform", },
                ],
                facilities: [
                    { type: "escalator_and_stairs", location: 2, endFloor: "B1", direction: "upwards", oneWay:"up" },
                    { type: "escalator_and_stairs", location: 4, endFloor: "B1", direction: "downwards", oneWay:"up" },
                ],
                exits: [
                    {
                        floor: "B1",
                        downwards: [
                            {code:"A",description:"云峰北街 路东/小北三东路 路北"},
                        ],
                    },
                ]
            },
            {
                name: "临东站",
                overGround: false,
                layers: [
                    { floor: "B1", type: "concourse", },
                    { floor: "B2", type: "platform", },
                ],
                facilities: [
                    { type: "escalator_and_stairs", location: 2, endFloor: "B1", direction: "upwards", oneWay:"up" },
                    { type: "escalator_and_stairs", location: 4, endFloor: "B1", direction: "downwards", oneWay:"up" },
                ],
                transfer: [
                    { floor: "B1", direction: "here", location: 1.5, line: "10号线", transferDirection: "downwards" },
                    { floor: "B1", direction: "here", location: 4.5, line: "10号线", transferDirection: "upwards" },
                ],
                exits: [
                    {
                        floor: "B1",
                        upwards: [
                            {code:"B",description:"临东站"},
                            {code:"L1",description:"临东站出站口"},
                            {code:"L2",description:"临东站进站口"},
                        ],
                        downwards: [
                            {code:"C",description:"中华路 路南/胜利南街 路东"},
                            {code:"D",description:"中华路 路南/民族街 路东"},
                        ]
                    },
                ],
                surrounding_stations: ["临东站北", "临东站南（南一马路）", "临东站"]
            },
            {
                name:"青年大街",
                layers: [
                    { floor: "B1", type: "concourse", },
                    { floor: "B2", type: "platform", },
                ],
                facilities: [
                    { type: "escalator_and_stairs", location: 1.5, endFloor: "B1", direction: "upwards", oneWay:"up" },
                    { type: "elevator", location:3, endFloor:"B1", },
                    { type: "escalator_and_stairs", location: 4.5, endFloor: "B1", direction: "downwards", oneWay:"up" },
                ],
                transfer: [
                    { floor: "B1", direction: "here", location: 6, line: "6号线", },
                ],
                exits: [
                    {
                        floor: "B1",
                        upwards: [
                            {code:"B",description:"中华路 路南/府后街 路东"},
                            {code:"C",description:"青年大街 路西/中华路 路南"},
                        ],
                        downwards: [
                            {code:"A",description:"福佑车库"},
                            {code:"D",description:"青年大街 路东/中华路 路南"},
                            {code:"E",description:"临东路 路北/正阳街 路西"},
                            {code:"F",description:"青年大街 路西/中华路 路北"},
                        ],
                    },
                ],
                surrounding_stations: ["福佑车库", "中华路立交桥南", "市电视台", "府后街市场"]
            },
            {
                name: "中华路",
                overGround: false,
                layers: [
                    { floor: "B1", type: "concourse", },
                    { floor: "B2", type: "platform", },
                ],
                facilities: [
                        { type: "escalator", location: 1.5, endFloor: "B1", direction: "downwards", oneWay:"none" },
                        { type: "escalator", location: 2.5, endFloor: "B1", direction: "upwards", oneWay:"none" },                        
                        { type: "escalator", location: 3.5, endFloor: "B1", direction: "downwards", oneWay:"none" },
                        { type: "escalator", location: 4.5, endFloor: "B1", direction: "upwards", oneWay:"none" },
                ],
                transfer: [
                    { floor: "B1", direction: "here", location: 2, line: "1号线", },
                ],
                exits: [
                    {
                        floor: "B1",
                        upwards: [
                            {code:"B",description:"中华路 路北/建业街 路西"},
                            {code:"C",description:"中华路 路南/建业街 路西"}
                        ],
                        downwards: [
                            {code:"A",description:"中华路 路北/建业街 路东"}
                        ]
                    },
                ]
            },
            {
                name: "精卫街",
                overGround: true,
                layers: [
                    { floor: "2F", type: "platform", },
                    { floor: "1F", type: "concourse", },
                ],
                facilities: [
                    { type: "elevator", location: 1, endFloor: "1F" },
                    { type: "waiting_room", location: 1.5, },
                    { type: "stairs", location: 2.5, endFloor: "1F", direction: "upwards" },
                    { type: "stairs", location: 3.5, endFloor: "1F", direction: "downwards" },
                ],
                exits: [
                    {
                        floor: "1F",
                        upwards: [
                            {code:"A",description:"精卫街 路东"},
                        ],
                        downwards: [
                            {code:"B",description:"精卫街轮渡母港"},
                        ],
                    },
                ],
                surrounding_stations: ["精卫街地铁站"]
            }
        ]
    },
    {
        name: "10号线",
        maxCarCount: 6,
        stationTemplate: [
            {
                name: "岛式站台",
                overGround: false,
                layers: [
                    { floor: "B1", type: "concourse", },
                    { floor: "B2", type: "platform", },
                ],
                facilities: [
                    { type: "nursing_room", location: 0, },
                    { type: "escalator", location: 1, endFloor: "B1", direction: "downwards", oneWay:"down", },
                    { type: "escalator", location: 2, endFloor: "B1", direction: "upwards", oneWay:"up", },
                    { type: "stairs", location: 2.8, endFloor: "B1", },
                    { type: "elevator", location: 3.2, endFloor: "B1", },
                    { type: "escalator", location: 4, endFloor: "B1", direction: "downwards", oneWay:"up", },
                    { type: "escalator", location: 5, endFloor: "B1", direction: "upwards", oneWay:"down", },
                    { type: "toilet", location: 6, },
                ],
            },
            {
                name: "侧式站台",
                overGround: false,                
                swapExitLayers: ["B1", "B2"],
                layers: [
                    { floor: "B1", type: "platform", },
                    { floor: "B2", type: "passageway", },
                ],
                facilities: [
                    { type: "escalator_and_stairs", location: 3, endFloor: "B2", direction: "downwards", oneWay:"none", },
                    { type: "toilet", location: 5.5, },
                    { type: "nursing_room", location: 6, },
                ],
                facilitiesUpwards: [
                    { type: "police", location:1.5, },
                    { type: "escalator_and_stairs", location: 3, endFloor: "B2", direction: "downwards", oneWay:"none", },
                    { type: "toilet", location: 5.5, },
                    { type: "nursing_room", location: 6, },
                ]
            }
        ],
        stations: [
            {
                name: "坂田客运港",
                layers: [
                    { floor: "B3", type: "platform", },
                    { floor: "B4", type: "passageway", },
                ],
                overGround: false,
                facilities: [
                    { type: "escalator_and_stairs", location: 3, endFloor: "B2", direction: "downwards", oneWay:"none", },
                    { type: "toilet", location: 5.5, },
                    { type: "nursing_room", location: 6, },
                ],
                facilitiesUpwards: [
                    { type: "police", location:1.5, },
                    { type: "escalator_and_stairs", location: 3, endFloor: "B2", direction: "downwards", oneWay:"none", },
                    { type: "toilet", location: 5.5, },
                    { type: "nursing_room", location: 6, },
                ],
                exits: [
                    {
                        floor: "B3",
                        upwards: [
                            {code:"B",description:"阅江街 路西/花城路 路南"},
                        ],
                        downwards: [
                            {code:"C",description:""},
                        ],
                    },
                    {
                        floor: "B4",
                        upwards: [
                            {code:"A",description:"坂田客运港"},
                        ],
                    },
                ],
                swapExitLayers: ["B3", "B4"],
                surrounding_stations: ["坂田客运港北"]
            },
            {
                name: "方形广场",
                template: "岛式站台",
                flipTemplateForUpwards: false,
                transfer: [
                    //{ floor: "B2", direction: "here", location: 0.5, line: "2号线", },
                ],
                exits: [
                    {
                        floor: "B1",
                        upwards: [
                            {code:"A",description:""},
                            {code:"B",description:""},
                        ],
                        downwards: [
                            {code:"C",description:""},
                            {code:"D",description:""},
                        ],
                    },
                ],
                surrounding_stations: ["阅江街穗城路"]
            },
            {
                name: "工农桥",
                template: "岛式站台",
                exits: [
                    {
                        floor: "B1",
                        upwards: [
                            {code:"A",description:""},
                            {code:"B",description:""},
                        ],
                        downwards: [
                            {code:"C",description:""},
                            {code:"D",description:""},
                        ],
                    },
                ]
            },
            {
                name: "建业街临医二院",
                overGround: false,
                layers: [
                    { floor: "B3", type: "passageway", },
                    { floor: "B4", type: "platform", },
                ],
                facilities: [
                    { type: "escalator", location: 1, endFloor: "B2", direction: "downwards", oneWay:"down", },
                    { type: "escalator", location: 2, endFloor: "B1", direction: "upwards", oneWay:"none", },
                    { type: "stairs", location: 2.8, endFloor: "B2", },
                    { type: "elevator", location: 3.2, endFloor: "B2", },
                    { type: "escalator", location: 4, endFloor: "B1", direction: "downwards", oneWay:"none", },
                    { type: "escalator", location: 5, endFloor: "B2", direction: "upwards", oneWay:"none", },
                    { type: "nursing_room", location: 6, },
                ],
                transfer: [
                    { floor: "B3", direction: "here", location: 3.5, line: "1号线", },
                ],
                exits: [
                    {
                        floor: "B3",
                        upwards: [
                            {code:"B",description:"南运河北路 路南/建业街 路东"},
                            {code:"C",description:"南运河北路 路南/建业街 路西"},
                            {code:"D",description:"南运河北路 路北/建业街 路西"},
                        ],
                    },
                ]
            },
            {
                name: "宣庆文化宫",
                overGround: false,
                layers: [
                    { floor: "B2", type: "concourse", },
                    { floor: "B3", type: "platform", },
                ],                
                facilities: [
                    { type: "escalator", location: 0, endFloor: "B2", direction: "upwards", oneWay:"none", },
                    { type: "escalator", location: 1, endFloor: "B2", direction: "downwards", oneWay:"down", },
                    { type: "escalator", location: 2, endFloor: "B2", direction: "upwards", oneWay:"up", },
                    { type: "stairs", location: 2.8, endFloor: "B2", },
                    { type: "elevator", location: 3.2, endFloor: "B2", },
                    { type: "escalator", location: 4, endFloor: "B2", direction: "downwards", oneWay:"down", },
                    { type: "escalator", location: 5, endFloor: "B2", direction: "upwards", oneWay:"up", },
                    { type: "nursing_room", location: 6, },
                ],
                transfer: [
                    { floor: "B2", direction: "upwards", location: 0.5, line: "6号线", },
                    { floor: "B3", direction: "upwards", location: 0.5, line: "6号线", },
                ],
                exits: [
                    {
                        floor: "B2",
                        upwards: [
                            {code:"A",description:"青年大街 路西/南运河北路 路北"},
                            {code:"B",description:"青年大街 路东/南运河北路 路北"},
                        ],
                        downwards: [
                            {code:"C",description:"青年大街 路西/南运河北路 路南"},
                            {code:"D",description:""},
                        ],
                    },
                ],
                surrounding_stations: ["文化宫北", "临房启航小区", "金银库", "宣庆文化宫"]
            },
            {
                name: "临东站",
                overGround: false,
                layers: [
                    { floor: "B1", type: "platform", },
                    { floor: "B2", type: "passageway", },
                ],
                facilities: [
                    { type: "escalator_and_stairs", location: 3, endFloor: "B1", direction: "downwards", oneWay:"up", },
                    { type: "toilet", location: 5.5, },
                    { type: "nursing_room", location: 6, },
                ],
                facilitiesUpwards: [
                    { type: "police", location:1.5, },
                    { type: "escalator_and_stairs", location: 3, endFloor: "B1", direction: "downwards", oneWay:"up", },
                    { type: "toilet", location: 5.5, },
                    { type: "nursing_room", location: 6, },
                ],
                transfer: [
                    { floor: "B2", direction: "here", location: 3, line: "3号线", },
                ],
                swapExitLayers: ["B1", "B2"],
                exits: [
                    {
                        floor: "B1",
                        upwards: [
                            {code:"B",description:"临东站"},
                        ],
                        downwards: [
                            {code:"L1",description:"临东站出站口"},
                            {code:"L2",description:"临东站进站口"},
                        ],
                    },
                    {
                        floor: "B2",
                        downwards: [
                            {code:"C",description:"中华路 路南/胜利南街 路东"},
                            {code:"D",description:"中华路 路南/民族街 路东"},
                        ],
                    },
                ]
            },
            {
                name: "百鸟公园",
                template: "侧式站台",
                exits: [
                    {
                        floor: "B1",
                        upwards: [
                            {code:"C",description:"胜利南街 路西/临新东路 路南	"},
                        ],
                        downwards: [
                            {code:"D",description:"胜利南街 路东/凌州大道 路南"},
                        ],
                    },
                    {
                        floor: "B2",
                        upwards: [
                            {code:"A",description:"胜利南街 路东/凌州大道 路北"},
                        ],
                        downwards: [
                            {code:"B",description:"胜利南街 路西/临新东路 路北"},
                        ],
                    },
                ],
                surrounding_stations: ["胜利大街凌州大道", "百鸟公园", "百鸟公园地铁站"]
            },
            {
                name: "南市场",
                template: "侧式站台",
                exits: [
                    {
                        floor: "B1",
                        upwards: [
                            {code:"C",description:"胜利南街 路西"},
                        ],
                        downwards: [
                            {code:"D",description:""},
                        ],
                    },
                    {
                        floor: "B2",
                        upwards: [
                            {code:"A",description:"胜利南街 路东/南五马路 路北"},
                        ],
                        downwards: [
                            {code:"B",description:""},
                        ],
                    },
                ],
                surrounding_stations: ["胜利大街南五马路"]
            },
            {
                name: "和平门",
                template: "侧式站台",
                exits: [
                    {
                        floor: "B1",
                        upwards: [
                            {code:"C",description:"胜利南街 路西"},
                        ],
                        downwards: [
                            {code:"D",description:""},
                        ],
                    },
                    {
                        floor: "B2",
                        upwards: [
                            {code:"A",description:"胜利南街 路东/仁德路 路北"},
                        ],
                        downwards: [
                            {code:"B",description:""},
                        ],
                    },
                ],
                surrounding_stations: ["仁德医院西门"]
            },
        ]
    }
]