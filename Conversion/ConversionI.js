var express = require('express')
const config = require('config')
require('dotenv').config()
const querystring = require('querystring');
var app = express()

const child_process = require('child_process');
const axios = require('axios')
const fs = require('fs')

const conversionCodes = require('./conversion-codes.js')
const FHIRExporter = require('../FHIR\ exporter/FHIRExporter.js');
const { resource } = require('../FHIR exporter/node-fhir-server-core/src/server/metadata/capability.template.js');
const swebAPI = require('../Sweb hub/sweb-api.js')

const errorLog = require('../util/logger/logger').conversionErrorLogger;
const { child } = require('winston');




module.exports.codeConversion = async (req, res) =>{ 
  var targetCodeSystem = req.query.target
  var sourceCode = req.query.source
  var data_result = await conversionCodes.codeConversion(sourceCode, targetCodeSystem)
  //console.log(JSON.stringify(data_result))
  return data_result
}

module.exports.codesConversion = async (data, mappingModelString) =>{
  var data_result = await conversionCodes.codesConversion(data, mappingModelString)
  //console.log(JSON.stringify(data_result))
  return data_result
}



/*
 /convertHealthData (file File, File mappingModel) RETURN int token
 Used to convert, file by file, a local health record, 
 represented as a list of CSV/XML/JSON files, 
 into an interoperable format.
 This call builds all the resources in the DI platform, linked together.
 This call is called for every file (resource) to be converted.
*/


module.exports.convertHealthData = async (resource, resourceName, resourceFormat) => {

  console.log('Follow the white rabbit Neo !')

  // ---------------- Data Mapper Converter call ----------------
  console.log("\n---------------- Data Mapper Converter call ----------------")

  let mappingModel = process.env.MAPPING_MODEL_PATH + resourceName+'.ttl'

/*
const fs = require('fs');
xmldata = await fs.readFile(resource, 'utf8', (err, data) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(data);
})
*/


  var karma = await child_process.spawnSync('java', [

    /*
      '-Dslf4j=false',
      '-Dlog4j.configuration=file:Conversion/automatic-process/log4j.properties',
    */
      '-cp',
      'Conversion/automatic-process/karma-offline-0.0.1-SNAPSHOT-shaded.jar',
      'edu.isi.karma.rdf.OfflineRdfGenerator',
      '--sourcetype', resourceFormat.toUpperCase(),
      '--filepath', resource,
      '--modelfilepath', mappingModel,
      '--selection', 'DEFAULT_TEST',
      '--scroll', 'http://'+ process.env.SWEB_HOST + ':' + process.env.SWEB_PORT,
      '--sourcename', resourceName,
      '--outputfile', process.env.RDF_DATA_PATH + resourceName + '.rdf',
      //'--root', process.env.DATA_SCHEMA_PATH + 'iehr-schema.owl'
    ], {encoding: 'utf-8'}
  )

  console.log(karma.output)

  if(karma.error) {
    console.log("Data Mapper ERROR: "+karma.error)
    errorLog.error("Data Mapper error - "+karma.error)
    return 1
  }
  if(karma.output.includes("ERROR")){
    console.log("Data Mapper: "+String(karma.output));
    errorLog.error("Data Mapper error - "+JSON.stringify(karma.output))
    //return 1
  } else console.log("Data Mapper status code: 200")
 




  // ---------------- RDF2EML Converter call ----------------
  console.log("\n---------------- RDF2EML Converter call ----------------")

  var rdfData
  try {
    rdfData = await fs.readFileSync(process.env.RDF_DATA_PATH + resourceName+'.rdf', 'utf8')
    //console.log(rdfData)
  } catch (err) {
    console.error(err)
    errorLog.error("RDF2EML import error reading RDF file - "+err)
    return 1
  }

  await axios
    .post('http://' + process.env.CONVERTER_HOST + ':' + process.env.CONVERTER_PORT + '//converter/rdf', rdfData, {headers: {'Content-Type': 'text/plain'}})
    .then(res => {
      console.log(`RDF2EML statusCode: ${res.status}`)
      fs.writeFileSync(process.env.EML_DATA_PATH + resourceName + '.eml', JSON.stringify(res.data));
      //console.log(res)
    })
    .catch(error => {
      console.error("RDF2EML:"+error)
      errorLog.error("RDF2EML error - "+error)
      return 1
    })



  // ---------------- KOS dataset-Import call ----------------
  console.log("\n---------------- KOS dataset-Import call ----------------")
 
  var emlData
  try {
    emlData = await fs.readFileSync(process.env.EML_DATA_PATH + resourceName+'.eml', 'utf8')
    //console.log(emlData)
  } catch (err) {
    console.error(err)
    errorLog.error("KOS import error reading EML file - "+err)
    return 1
  }

  axios.defaults.headers.common = {
    "x-api-key" : process.env.KOS_AUTH_TOKEN,
  }




  await axios
    .post('http://' + process.env.KOS_HOST + ':' + process.env.KOS_PORT + '/dataset-import/importDataset?bodyPayload=true&processName=iehr-import', 
    emlData, 
    {
      headers: 
      {
        'x-api-key': process.env.KOS_AUTH_TOKEN,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:94.0) Gecko/20100101 Firefox/94.0',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'it-IT,it;q=0.8,en-US;q=0.5,en;q=0.3',
        'Origin': 'http://'+ process.env.KOS_HOST + ':' + process.env.KOS_PORT + '/',
        'Connection': 'keep-alive',
        'Referer': 'http://' + process.env.KOS_HOST + ':' + process.env.KOS_PORT + '/',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors', 
        'Sec-Fetch-Site': 'same-origin',
      }
    })
    .then(res => {
      console.log(`KOS statusCode: ${res.status}`)
    })
    .catch(error => {
      console.error("KOS:"+error)
      errorLog.error("KOS error - "+error)
      /*
      child_process.spawn('docker', 
      [ 
        'cp',
        'ecfc644e7ce5:/kos/kos-core/log.txt', 
        './util/logger/logs/conversion/error-mapping-logfile.log'
      ])
      */
      return 1
    })

  return 0
}

/*
/checkIntegrationStauts(int token) RETURN boolean
The IHS internally call the automatic procedure to convert the healthData (extracted from the zip file recived) 
using the correct receipt identified for the resource to be converted .
*/

/*
 /retrieveConvertedFHIR (patientID)
 Retrieves the already converted health record specified 
 through its local patient ID from the EHR Data Cache, 
 and returns it in a serialised format outputFormat.
 This call retrieve the whole bundle including all the resources linked by the Patient ID.
  Basically is the call to the FHIR exporter.
*/
module.exports.retrieveConvertedFHIR = async (patientId) =>{
  return FHIRExporter.getBundle(patientId)
}