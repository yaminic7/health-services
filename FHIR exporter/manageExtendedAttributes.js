
// This library is used to manage the entity attributes 
// which are mapped in a different way respect to FHIR structure 
// exampe : code 	--> code.coding.system
//					--> code.coding.code
//					--> code.coding.display

const { conversionErrorLogger } = require('../util/logger/logger.js')
const FHIRStructureProducer = require('./FHIRStructureProducer.js')
const { resource } = require('./node-fhir-server-core/src/server/metadata/capability.template.js')

//create 'code' fhir resource and add it to the resource json list
module.exports.code = async function (data, resourceList) {

	let label = data.value.label
	let system = label.substring(0, label.indexOf('_'))
	let code = label.substring(label.indexOf('_')+1, label.length)
	//let display = data.value.name.eng
	let display = data.value.description.eng
 
	let jsonCodeSystem = await FHIRStructureProducer.createJSONService('code.coding.system'.split('.'), 'http://'+system+'.org')
	let jsonCodeCode = await FHIRStructureProducer.createJSONService('code.coding.code'.split('.'), code)
	let jsonCodeDisplay = await FHIRStructureProducer.createJSONService('code.coding.display'.split('.'), display)

	resourceList.push(jsonCodeSystem)
	resourceList.push(jsonCodeCode)
	resourceList.push(jsonCodeDisplay)

	return resourceList
}

module.exports.class = async function (data, resourceList) {

	let system = "http://terminology.hl7.org/CodeSystem/v3-ActCode"
	let code = "AMB"
	let display = "ambulatory"
 
	let jsonClassSystem = await FHIRStructureProducer.createJSONService('class.system'.split('.'), system)
	let jsonClassCode = await FHIRStructureProducer.createJSONService('class.code'.split('.'), code)
	let jsonClassDisplay = await FHIRStructureProducer.createJSONService('class.display'.split('.'), display)

	resourceList.push(jsonClassSystem)
	resourceList.push(jsonClassCode)
	resourceList.push(jsonClassDisplay)

	return resourceList
}

module.exports.valueCodeableConcept = async function (data, resourceList) {

	let label = data.value.label
	let system = label.substring(0, label.indexOf(':'))
	let code = label.substring(label.indexOf(':')+1, label.length)
	//let display = data.value.name.eng
	let display = data.value.description.eng
 
	let jsonCodeSystem = await FHIRStructureProducer.createJSONService('valueCodeableConcept.coding.system'.split('.'), 'http://'+system+'.org')
	let jsonCodeCode = await FHIRStructureProducer.createJSONService('valueCodeableConcept.coding.code'.split('.'), code)
	let jsonCodeDisplay = await FHIRStructureProducer.createJSONService('valueCodeableConcept.coding.display'.split('.'), display)

	resourceList.push(jsonCodeSystem)
	resourceList.push(jsonCodeCode)
	resourceList.push(jsonCodeDisplay)

	return resourceList
}

module.exports.atcCode = async function (data, resourceList, extendedAtt) {

	let display = data.value.description.eng
	let code = data.value.label.substring(data.value.label.lastIndexOf('_')+1)
 
	let jsonCodeSystem = await FHIRStructureProducer.createJSONService((extendedAtt+'.coding.system').split('.'), 'http://www.whocc.no/atc')
	let jsonCodeCode = await FHIRStructureProducer.createJSONService((extendedAtt+'.coding.code').split('.'), code)
	let jsonCodeDisplay = await FHIRStructureProducer.createJSONService((extendedAtt+'.coding.display').split('.'), display)

	resourceList.push(jsonCodeSystem)
	resourceList.push(jsonCodeCode)
	resourceList.push(jsonCodeDisplay)

	return resourceList
}

module.exports.observationCategory = async function (type, resourceList, extendedAtt) {

	let code = type
	let system = "http://terminology.hl7.org/CodeSystem/observation-category"

	let jsonCodeSystem = await FHIRStructureProducer.createJSONService((extendedAtt+'.coding.system').split('.'), system)
	let jsonCodeCode = await FHIRStructureProducer.createJSONService((extendedAtt+'.coding.code').split('.'), code)

	resourceList.push(jsonCodeSystem)
	resourceList.push(jsonCodeCode)
	return resourceList
}

module.exports.DRCategory = async function (code, resourceList, extendedAtt) {


	let system = "http://terminology.hl7.org/CodeSystem/v2-0074"

	let jsonCodeSystem = await FHIRStructureProducer.createJSONService((extendedAtt+'.coding.system').split('.'), system)
	let jsonCodeCode = await FHIRStructureProducer.createJSONService((extendedAtt+'.coding.code').split('.'), code)

	resourceList.push(jsonCodeSystem)
	resourceList.push(jsonCodeCode)
	return resourceList
}

module.exports.unitOfMeasure = async function (data, resourceList, extendedAtt) {
	let unit = data.value.name.eng
	let system = "http://unitsofmeasure.org"

	let jsonUnit = await FHIRStructureProducer.createJSONService((extendedAtt).split('.'), unit)
	let jsonSystem = await FHIRStructureProducer.createJSONService((extendedAtt.substring(0, extendedAtt.length - 5)+'.system').split('.'), system)
	let jsonCode = await FHIRStructureProducer.createJSONService((extendedAtt.substring(0, extendedAtt.length - 5)+'.code').split('.'), unit)

	resourceList.push(jsonUnit)
	resourceList.push(jsonSystem)
	resourceList.push(jsonCode)
	return resourceList
}

// this is the general version of the function for codableConcept
// extendedAtt is the element that contains coding
// i.e. valueCodeableConcept or code ..
module.exports.conceptStructure = async function (data, resourceList, extendedAtt) {

	let label = data.value.label
	let system = label.substring(0, label.indexOf('_'))
	let code = label.substring(label.indexOf('_')+1, label.length)
	if(code == "lab") code = code.toUpperCase()
	//let display = data.value.name.eng
	let display = data.value.description.eng
	
	let jsonCodeSystem = ""
	if(system.includes("icd9cm")) jsonCodeSystem = await FHIRStructureProducer.createJSONService((extendedAtt+'.coding.system').split('.'), 'http://hl7.org/fhir/sid/icd-9-cm')
	else if(system.includes("icd9")) jsonCodeSystem = await FHIRStructureProducer.createJSONService((extendedAtt+'.coding.system').split('.'), 'http://hl7.org/fhir/sid/icd-9')
	else if(system.includes("icd10")) jsonCodeSystem = await FHIRStructureProducer.createJSONService((extendedAtt+'.coding.system').split('.'), 'http://hl7.org/fhir/sid/icd-10')
	else jsonCodeSystem = await FHIRStructureProducer.createJSONService((extendedAtt+'.coding.system').split('.'), 'http://'+system+'.org')
	let jsonCodeCode = await FHIRStructureProducer.createJSONService((extendedAtt+'.coding.code').split('.'), code)
	let jsonCodeDisplay = await FHIRStructureProducer.createJSONService((extendedAtt+'.coding.display').split('.'), display)

	resourceList.push(jsonCodeSystem)
	resourceList.push(jsonCodeCode)
	resourceList.push(jsonCodeDisplay)

	return resourceList
}



module.exports.subjectReference = async function (entity) {

	let entityStr = JSON.stringify(entity)
	if(entityStr.includes("subject.Reference"))
		entityStr = entityStr.replace("subject.Reference", "subject.reference")

	return JSON.parse(entityStr)
}

module.exports.dateFormatConversion = async function (resource) {

	for (let attribute in resource){
		
		if (typeof resource[attribute] == 'object')
			resource[attribute] = await this.dateFormatConversion(resource[attribute])
		else if (Array.isArray(resource[attribute]))
			for (elem of resource[attribute])
				elem = await this.dateFormatConversion(elem)

		else if (
				attribute == 'effectiveDateTime' 
				|| attribute == 'birthDate'
				|| attribute == 'authoredOn'
				|| attribute == 'start'
				|| attribute == 'end'
				|| attribute == 'onsetDateTime'
				|| attribute == 'created'
		){

			//console.log("DATA "+attribute+" :"+resource[attribute])
			
			if(resource[attribute] != undefined){
				let date = new Date(resource[attribute])

				if(process.env.APP_LANGUAGE == 'fr'){
					let year = date.getFullYear();
					let month = ("0" + (date.getMonth() + 1)).slice(-2);
					let day = ("0" + date.getDate()).slice(-2);
					resource[attribute] = year+"-"+month+"-"+day
				}else {
					resource[attribute] = date.toISOString().substring(0, 10)
				}				
			}	
	}
		else continue
	}
	return resource
}

module.exports.unitOfMeasureAlignment = async function (resource) {

	for (let attribute in resource){
		
		if (typeof resource[attribute] == 'object')
			resource[attribute] = await this.unitOfMeasureAlignment(resource[attribute])
		else if (Array.isArray(resource[attribute]))
			for (elem of resource[attribute])
				elem = await this.unitOfMeasureAlignment(elem)

		else if(resource[attribute] != undefined){
			if(attribute == "unit"){
				if(resource[attribute] == "Percentage" || resource[attribute] == "pct")	resource[attribute] = '%'
				else if(resource[attribute] == "Millimetre of mercury") resource[attribute] = 'mmhg'
			}
		}
		else continue
	}
	return resource
}

module.exports.metaAttribute = async function (bundle) {	
	let i=0
	for(res of bundle.entry){
		let meta ={}
		if(res.resource.resourceType == "Encounter"){
			
			meta ={
				"profile" : ["http://interopehrate.eu/fhir/StructureDefinition/Encounter-IEHR"]
			}
		} else if(res.resource.resourceType == "DiagnosticReport"){

			if(res.resource.category == null)
				meta ={
					"profile" : ["http://interopehrate.eu/fhir/StructureDefinition/DiagnosticReport"]
				}
			else if(res.resource.category[0].coding[0].code == "LAB")
				meta ={
					"profile" : ["http://interopehrate.eu/fhir/StructureDefinition/DiagnosticReport-LaboratoryReport-IEHR"]
				}
			else	
				meta ={
					"profile" : ["http://interopehrate.eu/fhir/StructureDefinition/DiagnosticReport-ImagingReport-IEHR"]
				}
		}else if(res.resource.resourceType == "Observation"){
			if(res.resource.id.includes("obs-vitalsign-"))
				meta ={
					"profile" : ["http://hl7.org/fhir/StructureDefinition/vitalsigns"]
				}
			else if(res.resource.id.includes("obs-"))
				meta ={
					"profile" : ["http://interopehrate.eu/fhir/StructureDefinition/Observation-IEHR"]
				}
			else
				meta ={
					"profile" : ["http://hl7.org/fhir/uv/ips/StructureDefinition/Observation-results-laboratory-uv-ips"]
				}
		}else if(res.resource.resourceType == "Media"){
			meta ={
				"profile" : ["http://interopehrate.eu/fhir/StructureDefinition/Media-IEHR"]
			}
		}else if(res.resource.resourceType == "Condition"){
			if(res.resource.id.includes("cond-conclusion-")){
				meta ={
					"profile" : ["http://interopehrate.eu/fhir/StructureDefinition/DiagnosticConclusion-IEHR"]
				}
			} else{
				meta ={
					"profile" : ["http://hl7.org/fhir/uv/ips/StructureDefinition/"+res.resource.resourceType+"-uv-ips"]
				}
			}
		
		}
		else if(res.resource.resourceType == "CarePlan"){
			meta ={
				"profile" : ["http://interopehrate.eu/fhir/StructureDefinition/TreatmentPlan-IEHR"]
			}
		}
		else{
			meta ={
					"profile" : ["http://hl7.org/fhir/uv/ips/StructureDefinition/"+res.resource.resourceType+"-uv-ips"]
				}
		}

		res.resource["meta"] = meta
		i=i+1
	}
	return bundle
}

module.exports.languageAttribute = async function (resource) {
	let lang = resource.language
	for(let entry of resource.entry){
		entry.resource.language = lang
	}
	return resource
}

module.exports.indentifierAttribute = async function (resource) {
	for(let entry of resource.entry){
		let identifier = {"value" : entry.resource.id}
		entry.resource.identifier = identifier
	}
	return resource
}

module.exports.statusAttribute = async function (resource) {

	

	for(let entry of resource.entry){		
		if(entry.resource.resourceType == "Observation") entry.resource.status = "final"
		if(entry.resource.resourceType == "DiagnosticReport") entry.resource.status = "final"
		if(entry.resource.resourceType == "Media") entry.resource.status = "completed"
		if(entry.resource.resourceType == "MedicationStatement") entry.resource.status = "active"
		//if(entry.resource.resourceType == "MedicationStatement" && entry.resource.status == "accomplished") entry.resource.status = "completed"

	}
	return resource
}

module.exports.noAllergyCode = async function (resource) {
	for(let entry of resource.entry){
		if(entry.resource.resourceType == "AllergyIntolerance"){
			let allergyText = JSON.stringify(entry.resource.note[0].text)
			if(allergyText.includes("Non")){
				let coding = [{
					'system' : "http://snomed.info/sct",
					'code' : "373067005",
					'display' : "no allergy"
				}]
				entry.resource.code.coding = coding
				return resource
			}
		}
	}
	return resource
}

module.exports.undefinedMedication = async function (resource, mainID) {
	for(let entry of resource.entry){

		/*
		let drId = JSON.stringify(entry.resource.id)
		if(drId.includes("MEDST_")){
			entry.resource.id = "MEDST_"+mainID
			entry.resource.identifier[0].value = "MEDST_"+mainID
			entry.resource.medicationReference.reference = "Medication/MED_"+mainID
		}
		if(drId.includes("MED_")){
			entry.resource.id = "MED_"+mainID
			entry.resource.identifier[0].value = "MED_"+mainID
		}
		*/
		if(entry.resource.resourceType == "Medication"){
			if (typeof entry.resource['code'] === "undefined"){
				
				let coding = [{
					'system' : "http://snomed.info/sct",
					'code' : "261665006",
					'display' : "UNKNOWN"
				}]
				let code = {"coding":coding}
				entry.resource.code = code
			}		
			
		}
	}
	return resource
}



// temp until the icd9_8952 will be added in KB
module.exports.missingDRCode = async function (resource) {
	for(let entry of resource.entry){
		if(entry.resource.resourceType == "DiagnosticReport"){
			let drId = JSON.stringify(entry.resource.id)
			if(drId.includes("ECG")){
				let coding = [{
					'system' : "http://hl7.org/fhir/sid/icd-9",
					'code' : "8952",
					'display' : "Electrocardiogram"
				}]
				let code = {"coding":coding}
				entry.resource.code = code
				return resource
			}
		}
	}
	return resource
}