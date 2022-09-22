
const LanguageTranslatorV3 = require('ibm-watson/language-translator/v3')
const { IamAuthenticator } = require('ibm-watson/auth')
const FHIRLib = require('./FHIR-resources-lib.js')
const axios = require('axios')

const errorLog = require('../util/logger/logger').translationErrorLogger
const infoLog = require('../util/logger/logger').translationInfoLogger


// Object for Machine translation [Watson IBM]
const languageTranslator = new LanguageTranslatorV3({
  version: '2018-05-01',
  authenticator: new IamAuthenticator({
    apikey: 'Jp_HE3GaIFL8o-xYlJYrmMAA6JAr3CBvdcugbkT6feQo',
  }),
  url: 'https://api.eu-gb.language-translator.watson.cloud.ibm.com/instances/a0fb32e2-eff8-400f-b606-be37408651f0',
});

var translateParams = {
  text: 'Hello',
  modelId: 'en-it'
};

var translationWhiteList = [

	{
		resourceType: "Patient",
		attributes: []
	},
	{
		resourceType: "Observation",
		attributes: [
			'note',
			'text'
		]
	},
	{
		resourceType: "Composition",
		attributes: [
			'title'
		]
	},
	{
		resourceType: "Practitioner",
		attributes: []
	},
	{
		resourceType: "AllergyIntolerance",
		attributes: []
	},
	{
		resourceType: "Organization",
		attributes: []
	},
	{
		resourceType: "Condition",
		attributes: [
			'note',
			'text'
		]
	},
	{
		resourceType: "MedicationStatement",
		attributes: [
			'patientInstruction'
		]
	},
	{
		resourceType: "MedicationRequest",
		attributes: [
			'text',
			'unit'
		]
	},
	{
		resourceType: "CarePlan",
		attributes: [
			'description'
		]
	},
	{
		resourceType: "Media",
		attributes: [
			'note',
			'text'
		]
	}
]

// check if an attribute is included in the whiteList
allowTranslation = async (attribute, resourceType) => {
	let translation = false
	for(let res of translationWhiteList)
		if(res.resourceType == resourceType)
			for(let att of res.attributes)
				if(att == attribute){
					translation = true
					break
				}

	return translation
}

translate = async (attribute, translationModel) => {

	// UPGRADE FOR NEXT VERSION
	// check if attribute is a concept having the name in the source language.
	// if yes, check if exist the name also in target language for that concepst.
	// if yes, translate attribute with the target language name.

	translateParams.text = attribute
	translateParams.modelId = translationModel
	
	// use the watson translation
	let trad = await languageTranslator.translate(translateParams)
		.then(translationResult => {
			//console.log(translationResult.status)
	    	//console.log(JSON.stringify(translationResult.result.translations[0].translation, null, 2));
	    	return JSON.stringify(translationResult.result.translations[0].translation, null, 2)
	  	})
	 	.catch(err => {
	    	console.log('error:', err)
			errorLog.error("Machine translation error : "+err)
	  	});
	return trad
}

MTInternalTranslate = async (attribute, translationModel) => {
	let sourceLang = translationModel.substring(0, translationModel.indexOf('-'))
	let targetLang = translationModel.substring(translationModel.indexOf('-')+1, translationModel.length)
	let mtInput = {
		"from": sourceLang,
		"to": targetLang,
		"input": attribute
	}
	let result = await axios
		.post('http://' + process.env.MT_HOST + ':' + process.env.MT_PORT + '/translate', mtInput, 
		{
		headers: 
		{
			'Content-Type': 'application/json',
			'Authorization': 'Bearer universal'
		}
		})
		.then(res => {
		console.log(`MT statusCode: ${res.status}`)
		//console.log(`MT statusOut:`+JSON.stringify(res.data))
		return res.data
		})
		.catch(error => {
		console.error("MT:"+error)
		errorLog.error("MT error - "+error)
		return 1
		})

	//let decodedOutput = decodeURIComponent(JSON.parse('"' + JSON.stringify(result.translation).replace(/\"/g, '\\"') + '"'));
	//let decodedOutput = decodeURIComponent(JSON.parse(JSON.stringify(result.translation)));
	
	return result.translation
}


module.exports.translateText = async (resource, translationModel, bundleResourcesList, resourceRef, mainResourceType) => {

	let attribute
	let extendedAttribute = false
	var existingLang = false
	var targetLang = translationModel.substring(translationModel.indexOf('-')+1, translationModel.length)

	for (let j in resource){
		attribute = resource[j]
		if(attribute == null || attribute == undefined) continue

		//console.log("TranslateText:"+j+" - MainResource:"+mainResourceType)
		if(await allowTranslation(j, mainResourceType)){
			//if(typeof attribute['coding'] !== "undefined")

			//console.log("ATT CONSIDERED:"+j)

				if(typeof attribute == 'string'){
					// check if the fhir attribute is already extended	
					if(typeof resource["_"+j] !== "undefined"){
						if(typeof resource["_"+j]["extension"] !== "undefined"){
							extendedAttribute = true
							existingLang = false
							for(let ext of resource["_"+j]['extension']){
								// check if the extension for the target lang already exist
								if(ext['extension'][0]['valueCode'] == targetLang){
									existingLang = true
									break
								}
							}
						}
					}
					if(existingLang) continue

					//WATSON EXTERNAL TRANSLATOR
					let translation = await translate(attribute, translationModel)

					// TO BE USED WITH THE mt DOCKER IMAGE
					//let translation = await MTInternalTranslate(attribute, translationModel)

					console.log("MT out:"+translation)

					//if(attribute == translation.substring(1, translation.length-1)){
					if(attribute == translation){
						errorLog.error("Machine translation error : No translation for ["+attribute+"] for language ["+targetLang+"]")
					}
					var extInternal = await FHIRLib.createExtension(targetLang, translation, bundleResourcesList, resourceRef)

					if(!extendedAttribute){
						let extensionArray = []
						extensionArray.push(extInternal)
						let extensionElem = {'extension': extensionArray}
						resource["_"+j] = extensionElem
					} else{
						resource["_"+j]['extension'].push(extInternal)
					}

				} else if(Array.isArray(attribute)){
					for(let k in attribute){
						let keyName = Object.keys(attribute[k])
						if(typeof attribute[k] == 'string'){
							if(await allowTranslation(Object.keys(attribute[k])[0], mainResourceType)){
								// check if the fhir attribut is already extended	
								if(typeof resource["_"+j]  !== "undefined"){
									if(typeof resource["_"+j]["extension"]){
										extendedAttribute = true
										existingLang = false
										for(let ext of resource["_"+j]['extension']){
											// check if the extension for the target lang already exist
											if(ext['extension'][0]['valueCode'] == targetLang){
												existingLang = true
												break
											}
										}
									}
								}
								if(existingLang) continue
	
								//let translation = await translate(attribute[k][Object.keys(attribute[k])[0]], translationModel)
								let translation = await MTInternalTranslate(attribute[k][Object.keys(attribute[k])[0]], translationModel)
								var extInternal = await FHIRLib.createExtension(targetLang, translation, bundleResourcesList, resourceRef)
	
								if(!extendedAttribute){
									let extensionArray = []
									extensionArray.push(extInternal)
									let extensionElem = {'extension': extensionArray}
									attribute[k]["_"+keyName] = extensionElem
								} else{
									attribute[k]["_"+keyName]['extension'].push(extInternal)
								}
							}
						} else 
							await this.translateText(attribute[k], translationModel, bundleResourcesList, resourceRef, mainResourceType)
					}
				} else if(typeof attribute == 'object')
					await this.translateText(attribute, translationModel, bundleResourcesList, resourceRef, mainResourceType)	
				else
					continue	
		}
	}
}

