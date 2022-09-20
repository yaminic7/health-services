const axios = require('axios');
const config = require('../config/default.json');
const { conversionErrorLogger } = require('../util/logger/logger');
require('dotenv').config()

var swebHost = process.env.SWEB_HOST
//console.log(`sweb host: ${swebHost}`);
var swebPort = process.env.SWEB_PORT
//console.log(`sweb host: ${swebPort}`);
var swebVocabulary = process.env.SWEB_VOCABULARY
//console.log(`sweb host: ${swebPort}`);
var swebEb = process.env.SWEB_EB
//console.log(`sweb host: ${swebPort}`);
var swebKb = process.env.SWEB_KB
//console.log(`sweb host: ${swebPort}`)

module.exports.getConceptByPrefix = async(std, code, targetLang) =>{ 

	//console.log("http://"+swebHost+":"+swebPort+"/concepts?pageIndex=1&pageSize=10&knowledgeBase=1&wordPrefix="+std+"_"+code+"&considerTokens=false&excludeFirstToken=false&includeTimestamps=false&includeRelationsCount=false")

	//console.log(std+"_"+code.toLowerCase())

	let res = await axios.get("http://"+swebHost+":"+swebPort+"/concepts?pageIndex=1&pageSize=10&knowledgeBase=1&wordPrefix="+std+"_"+code.toLowerCase()+"&considerTokens=false&excludeFirstToken=false&includeTimestamps=false&includeRelationsCount=false&locale="+targetLang)
    .then(function (response) {
    	if (response.data.length > 0){

			let res

    		//dirty fix for wrong concepts name on LOINC and ICD std.
    		if (response.data[0].name[targetLang].includes("Loinc"))
				res = response.data[0]["description"][targetLang]
			else if (response.data[0].name[targetLang].includes("ICD"))
				res = response.data[0]["description"][targetLang]
			else if (response.data[0].name[targetLang].includes("icd"))
    			res = response.data[0]["description"][targetLang]
			else if (response.data[0].name[targetLang].includes("Icd"))
    			res = response.data[0]["description"][targetLang]
			else if (response.data[0].name[targetLang].includes("Atc"))
    			res = response.data[0]["description"][targetLang]
    		else if (response.data[0].name[targetLang].includes("Nan"))
    			res = response.data[0]["description"][targetLang]
    		else res = response.data[0].name[targetLang];

			return res;


    	} else return "Error there are no concepts, or senses, for the prefix:"+std+"_"+code.toLowerCase();
	})
	.catch(function (error) {
	  // handle error
	  console.log(error);
	})
	.finally(function () {
	  // always executed
	});
	//console.log(res);
	return res
}

module.exports.getConceptIDByPrefix = async(prefix) =>{ 

	//TO-DO adapt to multi language

	let res = await axios.get("http://"+swebHost+":"+swebPort+"/concepts?pageIndex=1&pageSize=10&knowledgeBase=1&wordPrefix="+prefix+"&considerTokens=false&excludeFirstToken=false&includeTimestamps=false&includeRelationsCount=false")
    .then(function (response) {
    	
    	// DIRTY FIX : usually getting data[0]
    	// here data[1] because there is a wrong concept version in KB to be deleted
		// delete operation on KB couse error (to solve)

    	if (response.data.length > 0) return response.data[0].id
		return '';
	})
	.catch(function (error) {
	  // handle error
	  console.log(error);
	})
	.finally(function () {
	  // always executed
	});
	//console.log(res);
	return res
}

module.exports.getTypeById = async(typeId) =>{

	let result = await axios.get("http://"+swebHost+":"+swebPort+"/types/"+typeId+"?includeAttributes=false&includeAttributesAsProperties=false&includeRestrictions=false&includeStdReferences=false&includeRules=false&includeTimestamps=false")
	.then(function (response) {
		return response.data.name.eng
	})
	.catch(function (error) {console.log(error);})
	.finally(function (){});

	return result
}

module.exports.getTypeIdByPrefix = async(prefix) =>{

	if(!prefix.includes('fhir')) prefix = 'fhir_'+prefix
	console.log(prefix)

	let result = await axios.get("http://"+swebHost+":"+swebPort+"/types?knowledgeBase=1&prefix="+prefix.toLowerCase()+"&includeAttributes=false&includeAttributesAsProperties=false&includeRestrictions=false&includeRules=false&includeStdReferences=false&includeTimestamps=false")
	.then(function (response) {
		return response.data[0].id
	})
	.catch(function (error) {console.log(error);})
	.finally(function (){});

	return result
}

module.exports.getEntityById = async(entityId) =>{

	let result = await axios.get("http://"+swebHost+":"+swebPort+"/instances/"+entityId+"?maxDepth=1&includeSemantics=false&maxValues=10&includeAttributes=true&createAttributeMap=false&attributeFilterType=ATTRIBUTE_DEF_ID&includeAttributesAsProperties=false&includeTimestamps=false")
  .then(function (response) {
    return response.data
  })
  .catch(function (error) {console.log(error);})
  .finally(function (){});

	return result
}

module.exports.getEntityIDByTypeIDAndIdentifier = async(typeID, identifier) =>{
	let result = await axios.get("http://"+swebHost+":"+swebPort+"/instances/search?query=Identifier%3D"+identifier+"&entityBase=1&instanceClass=Instance&type="+typeID+"&queryType=SIMPLE&parseSemantics=false&excludeMissingAttributes=false&useTypesGraph=false&includeExplanation=false&includeCount=false&idsOnly=false&pageIndex=1&pageSize=10&maxDepth=1&includeSemantics=false&maxValues=10&includeAttributes=true&createAttributeMap=false&attributeFilterType=ATTRIBUTE_DEF_ID&includeAttributesAsProperties=false&includeTimestamps=false")
  .then(function (response) {
    return response.data.results[0].id
  })
  .catch(function (error) {console.log(error);})
  .finally(function (){});

	return result
}

module.exports.getEntitiesByTypeId = async(typeId) =>{

	let result = await axios.get("http://"+swebHost+":"+swebPort+"/instances?pageIndex=1&pageSize=1000&entityBase=1&type="+typeId+"&isGlobalId=false&maxDepth=1&includeSemantics=false&maxValues=10&includeAttributes=true&createAttributeMap=false&attributeFilterType=ATTRIBUTE_DEF_ID&includeAttributesAsProperties=false&includeTimestamps=false")
  	.then(function (response) {
    	return response.data
 	})
  	.catch(function (error) {console.log(error);})
  	.finally(function (){});

	return result
}

module.exports.getEntitiesIDByTypeId = async(typeId) =>{

	let result = await axios.get("http://"+swebHost+":"+swebPort+"/instances?pageIndex=1&pageSize=1000&entityBase=1&type="+typeId+"&isGlobalId=false&maxDepth=1&includeSemantics=false&maxValues=10&includeAttributes=true&createAttributeMap=false&attributeFilterType=ATTRIBUTE_DEF_ID&includeAttributesAsProperties=false&includeTimestamps=false")
  	.then(function (response) {
    	return response.data
 	})
  	.catch(function (error) {console.log(error);})
  	.finally(function (){});

	IDList = new Array()
	for (let entity of result){
		IDList.push(entity.id)
	}

	return IDList
}

module.exports.getSensesByConceptId = async(conceptId) =>{

	let result = await axios.get("http://"+swebHost+":"+swebPort+"/synsets?pageIndex=1&pageSize=10&vocabulary="+swebVocabulary+"&concept="+conceptId+"&includeSenses=true&includeNestedSenses=false&includeTimestamps=false&includeRelationsCount=false")
	.then(function (response) {
		//console.log("TEST:"+JSON.stringify(response.data))
		return response.data[0].senses
	})
	.catch(function (error) {console.log(error);})
	.finally(function (){});

	return result
}

module.exports.getInstancesSearch = async(conceptId, instanceIdValue) =>{

	// this query search for the instances which have an attribute 
	// of type "COMPLEX_TYPE", related to the concept "conceptId",
	// with the vale "instanceIdValue"

	// temp bug fix for fhir_observation
	// the word is wrong imported in the kb, two concepts, the correct one is 554401
	if(conceptId == 554305) conceptId = 554401

	let query = {      
					"vocabularyId": swebVocabulary,      
					"knowledgeBaseId": swebKb,     
					"useComplexAttributeSearch": true,     
					"queryNode": {          
						"negated": false,          
						"or": false,          
						"queryNodes": [],         
						"attributeQueries": [{             
							"conceptId": conceptId, 
							"operator": "EQUAL",            
							"dataType": "COMPLEX_TYPE", 
							"value": instanceIdValue      
						}]     
					} 
				}

	let result = await axios.get("http://"+swebHost+":"+swebPort+"/instances/search?query="+JSON.stringify(query)+"&entityBase="+swebEb+"&instanceClass=Instance&queryType=%20COMPLEX&parseSemantics=false&excludeMissingAttributes=false&useTypesGraph=false&includeExplanation=false&includeCount=false&idsOnly=false&pageIndex=1&pageSize=100&maxDepth=1&includeSemantics=false&maxValues=10&includeAttributes=true&createAttributeMap=false&attributeFilterType=ATTRIBUTE_DEF_ID&includeAttributesAsProperties=false&includeTimestamps=false")
	.then(function (response) {
		return response.data
	})
	.catch(function (error) {console.log(error);})
	.finally(function (){});
	return result
}


// get entities linked to a main entity. 
// with the linking attribute and the entityID for the main entity

// example :
// linking attribute "fhir_Observation.subject.reference"
// entityId = 554401
module.exports.getLinkedEntities = async(attribute, entityId) =>{
	
	let attributeConceptId = await this.getConceptIDByPrefix(attribute)
	let instanceSearchResult = await this.getInstancesSearch(attributeConceptId, entityId)
	let resultEntityList = instanceSearchResult.results

	return resultEntityList
}

module.exports.getSynsetByConceptId = async(conceptId) =>{

	let result = await axios.get("http://"+swebHost+":"+swebPort+"/synsets?pageIndex=1&pageSize=10&vocabulary="+swebVocabulary+"&concept="+conceptId+"&includeSenses=false&includeNestedSenses=false&includeTimestamps=false&includeRelationsCount=false")
	.then(function (response) {
		return response.data[0]
	})
	.catch(function (error) {console.log(error);})
	.finally(function (){});

	return result
}

module.exports.getWordsBySynsetId = async(synsetId) =>{

	let result = await axios.get("http://"+swebHost+":"+swebPort+"/words?pageIndex=1&pageSize=10&vocabulary="+swebVocabulary+"&synset="+synsetId+"&considerTokens=false&excludeFirstToken=false&includeSenses=true&includeNestedSenses=false&includeTimestamps=false&includeRelationsCount=false")
	.then(function (response) {
		return response.data
	})
	.catch(function (error) {console.log(error);})
	.finally(function (){});

	return result
}

module.exports.deleteInstance = async(instanceId) =>{

	let result = await axios.delete("http://"+swebHost+":"+swebPort+"/instances/"+instanceId)
	.then(function (response) {
		return response.status
	})
	.catch(function (error) {console.log(error);})
	.finally(function (){});

	return result
}

module.exports.deleteInstanceRange = async(startInstanceId, endInstanceId) =>{

	if(isNaN(startInstanceId) || isNaN(endInstanceId)){
		console.log("Error !! wrong indexes")
		return
	}
	let counter = startInstanceId
	while(counter <= endInstanceId){
		let result = await axios.delete("http://"+swebHost+":"+swebPort+"/instances/"+counter)
		.then(function (response) {
			return response.status
		})
		.catch(function (error) {console.log(error);})
		.finally(function (){});

		console.log(result)
		counter++
	}
	return 0
}