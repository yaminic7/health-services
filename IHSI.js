const fs = require('fs')
var express = require('express')
var app = express()
var path = require('path')
var bodyParser = require('body-parser')
require('body-parser-xml-json')(bodyParser);
app.use(bodyParser.xml({
    extended: true,
    limit: '50mb',
    parameterLimit: 100000
  }));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true,
    limit: '50mb',
    parameterLimit: 100000
  }))

var convert = require('xml-js')



require('dotenv').config()
const config = require('./config/default.json')
const swebAPI = require('./Sweb\ hub/sweb-api.js')
const TranslationI = require('./Translation/TranslationI.js')
const ConversionI = require('./Conversion/ConversionI.js')
const conversionCodes = require('./Conversion/conversion-codes.js')
const FHIRExporter = require('./FHIR\ exporter/FHIRExporter.js')


let translateFHIRResource = async (req, res) =>{
    
    var targetLang
    if (req.query.targetLang == null || req.query.targetLang == "")
        targetLang = process.env.APP_LANGUAGE
    else
        targetLang = req.query.targetLang
    var jsonContent = req.body

    var data_result = await TranslationI.conceptTranslation(jsonContent, targetLang)
    data_result = await TranslationI.machineTranslation(data_result, targetLang)

    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(data_result))
}

let extendWithTranslation = async (req, res) =>{
    
    var targetLang = req.query.targetLang
    var jsonContent = req.body

    var data_result = await TranslationI.conceptTranslation(jsonContent, targetLang)
    data_result = await TranslationI.machineTranslation(data_result, targetLang)

    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(data_result))
}

let conceptTranslation = async (req, res) =>{
    
    var targetLang = req.query.targetLang
    var jsonContent = req.body

    var data_result = await TranslationI.conceptTranslation(jsonContent, targetLang)
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(data_result))
}

let machineTranslation = async (req, res) =>{
    
    var targetLang = req.query.targetLang
    var jsonContent = req.body
    
    var data_result = await TranslationI.machineTranslation(jsonContent, targetLang)
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(data_result))
}

let codeConversion = async (req, res) =>{
    
    var targetCodeSystem = req.query.target
    var sourceCode = req.query.source
    
    var data_result = await conversionCodes.codeConversion(sourceCode, targetCodeSystem)
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(data_result))

    //console.log(data_result)
}

let codesConversion = async (req, res) =>{
    
    var mappingModelString = req.query.model
    var jsonContent = req.body
      
    var data_result = await ConversionI.codesConversion(jsonContent, mappingModelString)
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(data_result))

    //console.log(data_result)
}




/* Automatic vonversion process flow */

/*

This call sends for conversion a single ZIP file 
containing one or more files that constitute the health record of a patient.
Each file contained in the zip will be converted calling the ConversionService endpoint convertHealthData

Params: zipfile, requestID
*/

const fileupload = require("express-fileupload")
app.use(fileupload())

let requestConversion = async (req, res) => {
    req.setTimeout(360000); // 5 minutes
    console.log(req.headers['content-type'])

    let resourceNameList = req.query.resourceName.split(";")
    let resourceFormat = "xml"
    if(req.headers['content-type'].includes("json")) resourceFormat = "json"

    for(resourceName of resourceNameList){

        let internalFilePath = process.env.DATA_PATH+resourceName+'.'+resourceFormat

        if(resourceFormat == "xml"){

            console.log(JSON.stringify(req.body))

            //console.log(convert.js2xml(req.body, {spaces: 2}))



            //TO DO: the newline are deleted before the js2xml conversion.

            fs.writeFileSync(internalFilePath, convert.json2xml(req.body))
            //fs.writeFileSync(internalFilePath, JSON.stringify(req.body))
            
            
        } else{ //JSON files
            fs.writeFileSync(internalFilePath, JSON.stringify(req.body))
        }
        console.log('File '+resourceName+'.'+resourceFormat+' is created successfully.')
        let fhirRes = await ConversionI.convertHealthData(internalFilePath, resourceName, resourceFormat)
        if(fhirRes != 0) res.status(500).end()
    }
    res.status(200).end()
}


/*
    procedure called after the conversion.
    it retrieve a list of homogeneous resources
    or an heterogeneous boundle 
    (starting from the ID of the main resource passed by paraeter).
    depending by the 'call' parameter
*/

let retrieveFHIRHealthRecord = async (req, res) =>{

    req.setTimeout(360000); // 5 minutes
    console.log("call type:"+req.query.call)
    let targetLang = req.query.lang
    let resourceId = req.query.call.split('/')[1]
    let FHIRBundle = {}

    if(req.query.call.includes("everything") ||
        req.query.call.includes("document") ||
        req.query.call.includes("patient-summary")
    ){  
        //heterogenous bundle (list)  
        FHIRBundle = await FHIRExporter.getHeterogeneousBundle(req.query.call, resourceId)
    } else{
        //homogeneous bundle
        FHIRBundle = await FHIRExporter.getHomogeneousBundle(req.query.call)
    }

    //Translation of data retrieved into citizen language
    //if(targetLang != process.env.APP_LANGUAGE){
        var data_result = await TranslationI.conceptTranslation(FHIRBundle, targetLang)
        FHIRBundle = await TranslationI.machineTranslation(data_result, targetLang)
    //}

    //conversion of codes
    FHIRBundle = await ConversionI.codesConversion(FHIRBundle, "icd9-icd10;icd9cm-icd10")

    //cleanEB()

    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(FHIRBundle)) 
}


/* 
    Delete a list of instances indiceted by parameter.
    i.e., http://localhost:3001/deleteInstances?instances=60618-60618"
*/ 
let deleteInstances = async (req, res) =>{
    let instances = req.query.instances.split('-')
    for (let id of instances){
        let response= await swebAPI.deleteInstance(id)
        console.log("Deleting:"+id+" - "+ response)
    }
    res.end()
}

let deleteInstanceRange = async (req, res) =>{
    let instances = req.query.instances.split('-')
    let response= await swebAPI.deleteInstanceRange(instances[0], instances[1])
    console.log("Deleting from:"+instances[0]+" to:"+instances[1]+" - return:"+ response)
    res.end()
}


let cleanEB = async (req, res) =>{
    console.log("Cleaning Entity Base")
    let typeList = [506, 
        704,
        801,
        702,
        1001,
        1101,
        703,
        901,
        1102,
        902,
        1201,
        1601,
        1701]

    for (let type of typeList){
        let ids = await swebAPI.getEntitiesIDByTypeId(type)
        for (let id of ids) await swebAPI.deleteInstance(id)
    }
    console.log("EB cleaned")
}



/*
/retrieveFHIRHealthRecord?id=1234&level=SEM&lang=ita
Retrieves the health record specified through its local patient  ID from the local DB system, 
converted into Smart Health Data, on the interoperability level level 
*/
app.get("/retrieveFHIRHealthRecord", express.json(), retrieveFHIRHealthRecord)


/*
/translateFHIRResource
Translates natural language labels inside a FHIR resource (or bundle) in input into the target language. 
The parameter targetLang may be omitted, in which case translation will happen towards the local language, 
as defined by the local IHS configuration.
*/
app.post("/translateFHIRResource", express.json(), translateFHIRResource)


/* TODO
/convertFHIRResource
This call allows to convert a FHIR resource (i.e. HCP update on Citizen’s SHER) 
produced by the HCP (using HCP App), and imported in the DI platform
in order to be later uploaded on the S-EHR app, and readable by the Citizen.
Export of entities from DI platform, and conversion in FHIR
*/


app.post("/requestConversion", requestConversion)
app.post("/conceptTranslation", express.json(), conceptTranslation)
app.post("/machineTranslation", express.json(), machineTranslation)
app.post("/extendWithTranslation", express.json(), extendWithTranslation)
app.get("/codeConversion", express.json(), codeConversion)
app.post("/codesConversion", express.json(), codesConversion)
app.get("/deleteInstances", express.json(), deleteInstances)
app.get("/deleteInstanceRange", express.json(), deleteInstanceRange)
app.get("/cleanEB", express.json(), cleanEB)

let appPort = process.env.APP_PORT
app.listen(appPort, function () {
  console.log('IHS API listening on port '+appPort)
})