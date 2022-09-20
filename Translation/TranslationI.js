const config = require('config')
const conceptTranslation = require('./concept-translation.js');
const machineTranslation = require('./machine-translation.js');

//var currentLang = config.get('app.current_language'); //eng




module.exports.conceptTranslation = async (data, targetLang) => {
	console.log('Translation-core >>> Concept translation to '+targetLang);

	for (entry of data.entry){
		//console.log("DATA:"+JSON.stringify(entry))
		await conceptTranslation.translateConcepts(entry.resource, targetLang, data.entry, entry);
	}

	//console.log(JSON.stringify(data));
	return 	data;
};


module.exports.machineTranslation = async (data, targetLang) => {
	if(targetLang == 'ro') targetLang = 'en'
	//console.log(JSON.stringify(data));

	//let resourceLang = await getResourceLang(data)
	let translationModel = ""
	//if (resourceLang != null) translationModel = resourceLang+"-"+targetLang
	/*else{
		console.log("ERROR: invalid or missing resource language")
		//TO-DO dirty fix, because the language is missing in some FHIR resources
		translationModel = "it-"+targetLang
		//return null
	}
   	*/

	for (entry of data.entry){

		if(entry.resource.resourceType == "Provenance" || entry.resource.resourceType == "Device") continue

		if(entry.resource.language != null){
			if (entry.resource.language == targetLang) return data
			if (entry.resource.language.includes("-")){
				translationModel = entry.resource.language.substring(0, 2)+"-"+targetLang
			} else {
				translationModel = entry.resource.language+"-"+targetLang
			}
		} else{
			if (data.language == targetLang) return data
			translationModel = data.language+"-"+targetLang
		}
		console.log('Translation-core >>> Machine translation - MODEL: '+translationModel+' on resource:'+entry.resource.resourceType)
		await machineTranslation.translateText(entry.resource, translationModel, data.entry, entry, entry.resource.resourceType);
	}
	return data
}

getResourceLang = async (resource) => {
	for (entry of resource.entry){
		if (entry.resource.language != null){
			 for (lang of config.languages){
				if (entry.resource.language.includes(lang.iso1) || entry.resource.language.includes(lang.iso2)) {
					return lang.iso1
				}
			 }
		}
	}

	if (resource.language != null){
		for (lang of config.languages){
			if (resource.language.includes(lang.iso1) || resource.language.includes(lang.iso2)) {
				return lang.iso1
			}
		 }
	}

	return null
}