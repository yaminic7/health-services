const extendedAttributes = require('./manageExtendedAttributes.js')
const swebAPI = require('../Sweb\ hub/sweb-api.js');
const { resolveSchema } = require('./node-fhir-server-core');
const { Console } = require('winston/lib/winston/transports');

// create ta JSON object for the resource to be exported in FHIR
//		- get a list of all the resource attributes (with the correct FHIR attribute names)
//		- create the JSON object following the attribute hierarchy (createJSON)
//		- manage correctly the structure of data inside the JSON object (mangeJSON)
getJSONResource = async function (data) {
	console.log("Creating resource typeId ---> "+data.typeId)

	let attributeList = {}
	let list = [] //list of json objects

	for(let k in data.attributes){
		let attribute = {}
		let name = data.attributes[k].name.eng;
		let conceptId = data.attributes[k].conceptId;
		let FHIRAttributes = name.split('.')
		let elemName = ''

		//search for fhir attribute's sense
		if(!FHIRAttributes[0].includes('fhir')){
			if(FHIRAttributes[0].toLowerCase() == 'identifier'){
				elemName = 'id'
			}
			else {
				let senses = await swebAPI.getSensesByConceptId(conceptId)
				for(let i in senses){
					let lemma = senses[i].word.lemma
					if(lemma != undefined && JSON.stringify(lemma).includes('fhir')){
						elemName = lemma.substring(lemma.indexOf('.')+1, lemma.length)
						break
					} else {
						elemName = 'no fhir definition'
					}
				}
			}
		} else {
			elemName = name.substring(name.indexOf('.')+1, name.length)
		}

		// temp bugs fix
		// birthdate has to be birthDate, the fhir API are not case sensitive
		// in the system this attribute (maybe others also) are not wrote correctly
		if(elemName == 'birthdate') elemName = 'birthDate'
		elemName = elemName.charAt(0).toLowerCase() + elemName.substring(1)

		// manage of structured attributes not mapped in karma
		// example : code 	--> code.coding.system
		//					--> code.coding.code
		//					--> code.coding.display

		

		if(elemName == 'code' ||
			elemName == 'valueCodeableConcept' ||
			elemName == 'itemCodeableConcept' ||
			elemName == 'route' ||
			elemName == 'medicationCodeableConcept' ||
			elemName == 'category' ||
			elemName == 'verificationStatus' ||
			elemName == 'clinicalStatus'
		){

			//console.log("CODE:"+data.attributes[k].values[0].value.name.eng)

			//dirty fix for ATC code labels
			if(data.attributes[k].values[0].value.description.eng.includes("ATC"))
				list = await extendedAttributes.atcCode(data.attributes[k].values[0], list, elemName)
			//dirty fix for Observation.category code and system labels
			else if(data.attributes[k].values[0].value.name.eng.includes("Hl7_laboratory_result")){
				list = await extendedAttributes.observationCategory('laboratory', list, elemName)
			}
			else if(data.attributes[k].values[0].value.name.eng.includes("Hl7_vital-sign")){
				
				list = await extendedAttributes.observationCategory('vital-signs', list, elemName)
			}
			//dirty fix for DiagnosticReport.category code and system labels
			else if(data.attributes[k].values[0].value.name.eng.includes("hl7_LAB")){
				list = await extendedAttributes.DRCategory("LAB", list, elemName)
			}
			else if(data.attributes[k].values[0].value.name.eng.includes("hl7_RDA")){
				list = await extendedAttributes.DRCategory("RAD", list, elemName)
			}		
			else
				list = await extendedAttributes.conceptStructure(data.attributes[k].values[0], list, elemName)

		}else if(elemName == 'class')
			list = await extendedAttributes.class(data.attributes[k].values[0], list)

		else if(elemName.endsWith("unit"))
			list = await extendedAttributes.unitOfMeasure(data.attributes[k].values[0], list, elemName)


		// add management of other structured attributes here (in 'else if')


		else {
			let objectArray = []
			let index = 0 
			for(let object of data.attributes[k].values){
				//let value = data.attributes[k].values[0]
				if(typeof object.value == 'object'){
					if(object.dataType == "COMPLEX_TYPE"){

						//build resource reference
						let entityType = await swebAPI.getTypeById(object.value.typeId)
						
						for(a of object.value.attributes){
							if(a.name.eng == "Identifier"){
								if(!a.values[0].value.includes(entityType)){
									
									if(entityType != "Patient") entityType = entityType.substr(5)
									if(entityType == "media") entityType = "Media"
									objectArray[index] = entityType + "/" + a.values[0].value
								} else {
									objectArray[index] = a.values[0].value
								}
								break
							}
						}
					}
					if(object.dataType == "CONCEPT"){
						// dirty fix over Fhir_Observation.status terminology concepts
						if(object.value.name.eng.toLowerCase() == "end-stage") objectArray[index] = "final"
						if(object.value.name.eng.toLowerCase() == "concluding") objectArray[index] = "final"
						else objectArray[index] = object.value.name.eng.toLowerCase()
					}
				}
				else{
					objectArray[index] = object.value
				}
				index = index + 1
			}

			let elemValue = objectArray

			//create JSON based on attributes structure
			let JSONAttribute = {}
			let composition = elemName.split('.')
			if(composition.length > 1){

				if(composition[composition.length-1]=="reference"  && Array.isArray(elemValue))
					JSONAttribute = await createJSONArrayList(composition, elemValue, composition[composition.length-1])
				else
					JSONAttribute = await createJSON(composition, elemValue)

				list.push(JSONAttribute)

			} else {
				attribute[elemName] = elemValue
				list.push(attribute)

			}		
		}		
	}

	attributeList.attributes = list
	attributeList = await mergeAttributes(attributeList.attributes)
	await manageJSON(attributeList)
	return attributeList
}


/*
This function tranforms the single item array attributes 
in simple (no-array) json objects.
*/
manageJSON = async function (jsonObj){

	for(let prop in jsonObj){
		if(Array.isArray(jsonObj[prop])){
			if(jsonObj[prop].length == 1){
				jsonObj[prop] = jsonObj[prop][0]
			}
		}
		if(typeof jsonObj[prop] == 'object'){
			await manageJSON(jsonObj[prop])
		}
	}
}

// merge the properties which have the same key in a JSON object
mergeAttributes = async function (jsonList){

	//console.log("TEST KEY:"+JSON.stringify(jsonList[0]))	
	if(Object.keys(jsonList[0])[0] == "reference") return jsonList
	if(Object.keys(jsonList[0])[0] == "conclusion") return jsonList


	let result = jsonList.reduce(function(r, e) {
		return Object.keys(e).forEach(function(k) {
			if(!r[k]) r[k] = [].concat(e[k])
			else r[k] = r[k].concat(e[k])
		}), r
	}, {})

	for(let elem in result){

		//console.log("TEST:"+JSON.stringify(result[elem]))
		if(result[elem].length > 1 && result[elem][0].length != 1) result[elem] = await mergeAttributes(result[elem])
		
	}

	//console.log("TEST:"+JSON.stringify(result))

	
	return result
}

createJSON = async function (attComposition, value){
	let jsonObj = {}
	if(attComposition.length == 1)
		jsonObj[attComposition[0]] = value
	else 
		jsonObj[attComposition[0]] = await createJSON(attComposition.slice(1, attComposition.length), value)
	return jsonObj
}

createJSONArrayList = async function (attComposition, refArray, refLabel){	
	let jsonObj = {}
	if(attComposition.length == 2){
		jsonObj[attComposition[0]] = []
		let index = 0
			for(let ref of refArray){
				jsonObj[attComposition[0]].push({
					[refLabel] : ref
				})
			}
			index = index + 1
	} else 
		jsonObj[attComposition[0]] = await createJSONArrayList(attComposition.slice(1, attComposition.length), refArray, refLabel)
	return jsonObj
}

module.exports.createJSONService = async function (attComposition, value) {
	return await createJSON(attComposition, value)
}

convertEntity = async function (entity) {
	let entityType = await swebAPI.getTypeById(entity.typeId)
	entityType = entityType.substring(entityType.indexOf('_')+1, entityType.length)
	let Resource = require(resolveSchema('4_0_0', entityType.toLowerCase()))
	let jsonResource = await getJSONResource(entity)
	let res = new Resource(jsonResource)
	return res
}

module.exports.convert = async function (entity) {
	return await convertEntity(entity)
}

module.exports.addCompositionReferences = async function (bundle) {

	var composition = bundle.entry[0].resource
	
	for (let entry of bundle.entry){
		//console.log(entry.resource.resourceType)
		if (entry.resource.resourceType == "Composition") continue
		console.log("Creating Composition reference for ---> "+entry.resource.resourceType)

		if(entry.resource.resourceType == "Observation"){
			let reference = "Observation/" + entry.resource.identifier[0].value
			for (let section of composition.section){
				if (section.title == "Vital signs"){
					let jsonRef = {"reference":reference}
					section.entry.push(jsonRef)
					break
				}
			}
		}
		else if(entry.resource.resourceType == "MedicationStatement"){
			let reference = "MedicationStatement/" + entry.resource.identifier[0].value
			for (let section of composition.section){
				if (section.title == "History of Medication use Narrative"){
					let jsonRef = {"reference":reference}
					section.entry.push(jsonRef)
					break
				}
			}
		}
		else if(entry.resource.resourceType == "Patient"){
			composition.subject = {"reference":entry.resource.resourceType + "/" + entry.resource.identifier[0].value}
		}
		else if(entry.resource.resourceType == "DiagnosticReport"){
			let reference = "DiagnosticReport/" + entry.resource.identifier[0].value
			for (let section of composition.section){
				if (section.title == "Relevant diagnostic tests/laboratory data Narrative"){
					let jsonRef = {"reference":reference}
					section.entry.push(jsonRef)
					break
				}
			}
		}


		// Continue to build references for the other resources to be considered in Composition

	}

	return bundle
}

//remove resources without identifier
module.exports.removeInvalidResources = async function (bundle) {
	let newBundle = JSON.parse(JSON.stringify(bundle));
	newBundle.entry = []
	for (let entry of bundle.entry){
		if(entry.resource["id"]){
			newBundle.entry.push(entry)
		}
	}
	return newBundle
}
