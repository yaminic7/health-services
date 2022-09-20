const config = require('config')
const swebAPI = require('../Sweb hub/sweb-api.js')
const errorLog = require('../util/logger/logger').conversionErrorLogger;

// constants for the standards names, how they are found in the resources.
const LOINC = 'loinc'
const SNOMED = 'sct'
const ICD9 = 'icd-9'
const ICD9CM = 'icd-9-cm'
const ICD10 = 'icd-10'
const ATC = 'atc'

var currentLang = config.get('app.current_language')


// conversion of a single code
module.exports.codeConversion = async (sourceCode, targetCodeSystem) => {
	console.log('Conversion-core >>> code conversion to ['+targetCodeSystem+']')

    let conceptID = await swebAPI.getConceptIDByPrefix(sourceCode) 
    let synset = await swebAPI.getSynsetByConceptId(conceptID)
    let words = await swebAPI.getWordsBySynsetId(synset.id)

    for(let w of words)
        if(w.lemma.includes(targetCodeSystem))
            return w.lemma

    /*
    console.log("conceptID:"+conceptID)
    console.log("synsetID:"+synset.id)
    console.log(words)
    */
	return null
}

// conversion of all codes within a resource
// examples of mappingString = 'icd9-icd10;localXY-intXY'
module.exports.codesConversion = async (data, codeMappingString) => {
	
	var codeMappingModel = []
	for(m of codeMappingString.split(';')){
		let codes = m.split('-')
		let elem = {"local":codes[0], "international":codes[1]}
		codeMappingModel.push(elem)
	}
	console.log('Conversion-core >>> codes conversion using model '+JSON.stringify(codeMappingModel))

    for (entry of data.entry){
        await parseResource(entry.resource, codeMappingModel)
    }

	//console.log(JSON.stringify(data));
	return 	data;
}

parseResource = async (resourceStr, codeMappingModel) => {

	//console.log("RESOURCE:"+JSON.stringify(resourceStr))
	let elem
	var resource = JSON.parse(JSON.stringify(resourceStr))

	for (att in resource){
		if(typeof resource[att] === 'string' || resource[att] instanceof String){continue}
		if (Array.isArray(resource[att])){
			for (elem of resource[att]){
				if (elem.hasOwnProperty('coding'))
					await checkCoding(elem, codeMappingModel)
				else
					if (typeof elem == 'object')
						await parseResource(Object.values(elem), codeMappingModel)
			}
		} else{
			if (resource[att].hasOwnProperty('coding'))
				await checkCoding(resource[att], codeMappingModel)
			else{
				if (typeof resource[att] == 'object')
					await parseResource(Object.values(resource[att]), codeMappingModel)
			}
		}		
	}
    return
}

// anlyze <coding> elements in the resource
checkCoding = async (att, codeMappingModel) => {

	if (att['coding'][0].hasOwnProperty("system") && 
			att['coding'][0].hasOwnProperty("code") &&
			att['coding'][0].hasOwnProperty("display")){

		let sys = ''
		if (att['coding'][0]['system'].includes(LOINC)) sys = LOINC
		else if (att['coding'][0]['system'].includes(SNOMED)) sys = SNOMED
		else if (att['coding'][0]['system'].includes(ICD9CM)) sys = 'icd9cm'
		else if (att['coding'][0]['system'].includes(ICD9)) sys = 'icd9'
		else if (att['coding'][0]['system'].includes(ICD10)) sys = 'icd10'
		else if (att['coding'][0]['system'].includes(ATC)) sys = ATC
		else sys = ''

		if (sys != ''){

			//console.log("SYS:"+sys)
			//console.log("SYS:"+sys+" - CODE:"+att['coding'][0]['code'])

			let targetCodeSystem = await getTargetStandard(sys, codeMappingModel)
			//console.log("target:"+targetCodeSystem)

			if(targetCodeSystem != null){
				let conceptID = await swebAPI.getConceptIDByPrefix(sys+'_'+att['coding'][0]['code']) 
				if(conceptID != ''){

					let synset = await swebAPI.getSynsetByConceptId(conceptID)
					let words = await swebAPI.getWordsBySynsetId(synset.id)

					for(let w of words){
						if(w.lemma.includes(targetCodeSystem)){

							let code = w.lemma
							let codeDescription = w.senses[0].synset.gloss
							code = code.split('_')[1]
							
							/* 
							Provenance for converted codes.
							I can add the provenance resource when i add the new code.
							But in the new 'coding' element there is no possibility (now)
							To add a reference to that provenance fhir resource.
							
							Ask FRAU how to consider that.
							*/

							if (targetCodeSystem.includes('icd9cm')) targetCodeSystem = 'http://icd-9-cm.org'
							else if(targetCodeSystem.includes('icd9')) targetCodeSystem = 'http://icd-9.org'
							if (targetCodeSystem.includes('icd10')) targetCodeSystem = 'http://icd-10.org'
							
							newCodeElem = {'system': targetCodeSystem,
											'code': code,
											'display': codeDescription}

							att['coding'].push(newCodeElem)
							break
						} else{
							errorLog.error("Code Concept Missing Error - "+"[SYS:"+sys+" - CODE:"+att['coding'][0]['code']+" - TARGET SYS:"+targetCodeSystem+"]")
						}
					}
				} 
			//} else{
			//	errorLog.error("Code Conversion Error - "+"[SYS:"+sys+" - CODE:"+att['coding'][0]['code']+"]")
			}
		}
	}
	return
}

getTargetStandard = async (source, codeMappingModel) => {

	for(elem of codeMappingModel){
		if(elem.interantional == source) return	JSON.stringify(elem['local'])
		if(elem.local == source) return elem['international']
	}
	return null
}
