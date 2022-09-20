
/**
 * This Endpoint collection for the translation services,
 * allows to use the services separately from the IHS master component.
 * Normally these services are directly called by the ihs-api.js endpoint collection file.
 * / */



var express = require('express')
const config = require('config')
var app = express();

const translationCore = require('./translation-core.js');


let conceptTranslation = async (req, res) =>{
    
    var targetLang = req.query.targetLang;
    var jsonContent = req.body;

    console.log("TEST-LANG:"+targetLang)
    /*
    var data_result = await translationCore.conceptTranslation(jsonContent, targetLang);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data_result));
    */
}

let machineTranslation = async (req, res) =>{
    
    var targetLang = req.query.lang;
    var jsonContent = req.body;
    //console.log(language);
    
    var data_result = await translationCore.machineTranslation(jsonContent, targetLang);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data_result));
}

app.post("/concept-translation", express.json(), conceptTranslation);
app.post("/machine-translation", express.json(), machineTranslation);

let appPort = config.get('app.port');
app.listen(appPort, function () {
  console.log('Translation API listening on port '+appPort);
});
