var host = "http://sweb:8080/";
var kbHost = false || "http://sweb:8080/";
var ebHost = false || "http://sweb:8080/";
module.exports = {
    logger: {
        "api": "logs/api.log",
        "exception": "logs/exceptions.log"
    },
    cores : {
        'kos-core-arbalest'    : {
            entryPoint              : 'arbalest',
            active                  : true,
            debug                   : true,
            appPath                 : "./../apps",
            appOptions              : {
                "em" : {
                    validDataTypes : ['BOOLEAN', 'INTEGER', 'LONG', 'FLOAT', 'DATE', 'CONCEPT', 'SSTRING', 'STRING', 'NLSTRING', 'COMPLEX_TYPE', 'GEOMETRY'],
                    kos_host : "http://localhost:5001/",
                    knowledgeBaseId : 1,
                    host : host,
                    database : {host: 'mongodb', dbName: 'kos_em_etypedev'},
                    active: true
                },					
                "etype-explorer" : {
                    active: true
                },					
                "userbase-management" : {
                    active: true
                },					
                "kb" : {
                    active: true
                },					
                "kb-import" : {
                    host : host,
                    database: {
                        host: "mongodb",
                        dbName: "kos_kbimport"
                    },
                    active: true
                },					
                "eb" : {
                    active: true
                },
                "dataset-import": {
                    active: true,
                    host: host,
                    api: {
                        host: host,
                        kos_host        : 'http://localhost:5001/',
                        knowledgeBaseId : 1,    //variable to consider to change knowledgebase
                        entityBaseId    : 1,  //variable to consider to change entitybase
                        dbhost: "mongodb",
                        dbname: "dataset-import"
                    }
                }
            }
        },
        'kos-core-entity-base' : {
            entryPoint      : 'eb',
            active          : true,
            entityBaseId    : 1,
            knowledgeBaseId : 1,
            host            : ebHost
        },

        'kos-core-knowledge-base' : {
            entryPoint      : 'kb',
            active          : true,
            knowledgeBaseId : 1,
            host            : kbHost
        },

        'kos-core-etype-core' : {
            entryPoint      : 'etypes',
            active          : true,
            knowledgeBaseId : 1,
            host            : kbHost
        },
        'kos-core-security' : {
            entryPoint          : 'security',
            "active"            : true,
            "strategy"          : "local",
            "adminRoles"        : ["ADMIN", "UKC_ADMIN"],

            // for DEMO strategy
            "credentials"       : {
                "identifier"        : "username",
                "password"          : "password"
            },
            "defaultGroups" : ["KNOWLEDGE_DESIGNER", "KNOWLEDGE_DEVELOPER", "ADMIN"],
            
            // for LOCAL strategy
            "mongoDbHost"   : "mongodb://mongodb/kos_security",
            "mongoIp"       : "mongodb",
            "mongoPort"     : 27017,
            "mongoDb"       : "kos_security",

            // for UKC strategy
            "host"          : "",
            "userHost"      : "",
            "kosAuth"       : false,
            secret          : "MY_SECRET",


                    }
    },
    kos:{
        name                    : "KOS",
        coreModulesDirectory    : "./core",
        baseUrl                 : "http://dreamfour.disi.unitn.it:5001/",
        server      : {
            ssl         : false,
            port        : 5000,
            ip          : "0.0.0.0"
        },
        identity    : "generic",
        index       : 'dashboard.jade',
        mode        : 'dashboard',
        bootLogin   : true,
        theme       : "paper",
        localcores  : false,
        hasFrontEnd : true,
        SECRET      : "MY_SECRET",
        monitoring  :  false ,
        info : {
                        loginInfo : '',
                        footerInfo : '',
                    },
        sidebars : {
                        top : 'show',
                        left : 'show',
                    }
    }
};
