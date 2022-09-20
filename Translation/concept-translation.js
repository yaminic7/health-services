
const swebAPI = require('../Sweb hub/sweb-api.js')
const config = require('../config/default.json')
const FHIRLib = require('./FHIR-resources-lib.js')

const errorLog = require('../util/logger/logger').translationErrorLogger;

const LOINC = 'loinc'
const LOINC_numeric = '2.16.840.1.113883.6.1'
const SNOMED = 'sct'
const ICD9 = 'icd-9'
const ICD10 = 'icd-10'
const ATC = 'atc'


getISO2 = async (codeISO1) => {
	for (lang of config.languages)
		if (codeISO1 == lang.iso1) return lang.iso2
}

let checkCoding = async (att, lang, bundleResourcesList, resourceRef) => {

	if(lang.length == 2) lang = await getISO2(lang)
	var extendedAttribute = false

	// check if the fhir attribute is already extended
	//if(att['coding'][0].hasOwnProperty("_display")){

	//console.log("ATT:"+JSON.stringify(att))

	if(JSON.stringify(att['coding'][0]).includes("_display")){
		extendedAttribute = true
		for(let ext of att['coding'][0]['_display']['extension']){
			// check if the extension for the target lang already exist
			if(ext['extension'][0]['valueCode'] == lang)
				return
		}
	}

	if (att['coding'][0].hasOwnProperty("system") && 
			att['coding'][0].hasOwnProperty("code") &&
			att['coding'][0].hasOwnProperty("display")){

		sys = ''
		code = att['coding'][0]['code']
		displayTrans = att['coding'][0]['display']

		if (att['coding'][0]['system'].includes(LOINC)) sys = LOINC
		if (att['coding'][0]['system'].includes(LOINC_numeric)) sys = LOINC
		if (att['coding'][0]['system'].includes(SNOMED)) sys = SNOMED
		if (att['coding'][0]['system'].includes(ICD9)) sys = 'icd9'
		if (att['coding'][0]['system'].includes(ICD10)) sys = 'icd10'
		if (att['coding'][0]['system'].includes(ATC)) sys = 'atc'

		//console.log("sys:"+sys)

		if (sys != ''){
			await swebAPI.getConceptByPrefix(sys, code, lang).then(
				async result => {
				if (result.startsWith('Error')){ // no concepts available, save the log and return
					errorLog.error(result)
					return
				} 
				displayTrans = result
				console.log("res:"+displayTrans);
				//att['coding'][0]['display'] = displayTrans;

				var extInternal = await FHIRLib.createExtension(lang, displayTrans, bundleResourcesList, resourceRef)

				console.log("EXT:"+JSON.stringify(extInternal))

				if(!extendedAttribute){
					let extensionArray = []
					extensionArray.push(extInternal)
					let extensionElem = {'extension': extensionArray}
					att['coding'][0]['_display'] = extensionElem
				} else{
					att['coding'][0]['_display']['extension'].push(extInternal)
				}

				
			})
		}
	}
	return
}

module.exports.translateConcepts = async (resource, lang, bundleResourcesList, resourceRef) => {
	var sys = ''
	var code = ''
	var displayTrans = ''
	var single_att
	var att

	for (let j in resource){
		single_att = resource[j]
		if(single_att == null || single_att == undefined) continue
		if (Array.isArray(single_att)){
			for (var k = 0; k < single_att.length; k++){
				att = single_att[k]
				//console.log("TEST ARRAY:"+JSON.stringify(att))
				if (att.hasOwnProperty('coding'))
					await checkCoding(att, lang, bundleResourcesList, resourceRef)
				else
					if (typeof att == 'object')
						await this.translateConcepts(Object.values(att), lang, bundleResourcesList, resourceRef)
			}

		} else{
			att = single_att
			//console.log("TEST OBJECT:"+JSON.stringify(att))
			//console.log("CHECK:"+(typeof att['coding']  !== "undefined"))
			if (typeof att['coding']  !== "undefined")
				await checkCoding(att, lang, bundleResourcesList, resourceRef)
			else
				if (typeof att == 'object')
					await this.translateConcepts(Object.values(att), lang, bundleResourcesList, resourceRef)
		}		
	}
    return
}
