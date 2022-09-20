const config = require('../config/default.json')
require('dotenv').config()
const swebAPI = require('../Sweb\ hub/sweb-api.js')
const extendedAttributes = require('./manageExtendedAttributes.js')
const FHIRProducer = require('./FHIRStructureProducer.js')
const {Graph} = require('./ExporterDataStructures.js')
const { resolveSchema } = require('./node-fhir-server-core')
const dataStructures = require('./ExporterDataStructures.js')
const { streamToPromise } = require('ibm-cloud-sdk-core')
var date = new Date(Date.now())

initFHIRGraph = async function(){
    var g = new Graph()

    g.addNode("Patient")
    g.addNode("fhir_Observation")
    g.addNode("fhir_Practitioner")
    g.addNode("fhir_Organization")
    g.addNode("fhir_MedicationRequest")
    g.addNode("fhir_MedicationStatement")
    g.addNode("fhir_Medication")
    g.addNode("fhir_DiagnosticReport")
    g.addNode("fhir_Composition")
    g.addNode("fhir_Encounter")
    g.addNode("fhir_Condition")
    g.addNode("Fhir_media")
    g.addNode("fhir_AllergyIntolerance")
    g.addNode("fhir_CarePlan")

    g.addEdge("Patient", "fhir_Practitioner", "fhir_patient.generalpractitioner.reference")

    g.addEdge("fhir_CarePlan", "Patient", "fhir_careplan.subject.reference")
    g.addEdge("fhir_CarePlan", "fhir_Encounter", "fhir_careplan.encounter.reference")
    g.addEdge("fhir_CarePlan", "fhir_Practitioner", "fhir_careplan.author.reference")

    g.addEdge("Fhir_media", "Patient", "fhir_media.subject.reference")
    g.addEdge("Fhir_media", "fhir_Organization", "fhir_media.operator.reference")

    g.addEdge("fhir_Observation", "Patient", "fhir_observation.subject.reference")
    g.addEdge("fhir_Observation", "fhir_Practitioner", "fhir_observation.performer.reference")

    g.addEdge("fhir_DiagnosticReport", "Patient", "fhir_diagnosticreport.subject.reference")
    g.addEdge("fhir_DiagnosticReport", "fhir_Observation", "fhir_diagnosticreport.result.reference")
    g.addEdge("fhir_DiagnosticReport", "fhir_Practitioner", "fhir_diagnosticreport.performer.reference")
    g.addEdge("fhir_DiagnosticReport", "fhir_Practitioner", "fhir_diagnosticreport.resultsinterpreter.reference")
    g.addEdge("fhir_DiagnosticReport", "fhir_Encounter", "fhir_diagnosticreport.encounter.reference")
    g.addEdge("fhir_DiagnosticReport", "Fhir_media", "fhir_diagnosticreport.media.link")

    g.addEdge("fhir_MedicationRequest", "Patient", "fhir_medicationrequest.subject.reference")
    g.addEdge("fhir_MedicationRequest", "fhir_Medication", "fhir_medicationrequest.medicationreference.reference")
    g.addEdge("fhir_MedicationRequest", "fhir_Practitioner", "fhir_medicationrequest.requester.reference")

    g.addEdge("fhir_MedicationStatement", "Patient", "fhir_medicationstatement.subject.reference")
    g.addEdge("fhir_MedicationStatement", "fhir_Medication", "fhir_medicationstatement.medicationreference.reference")

    g.addEdge("fhir_Composition", "Patient", "fhir_composition.subject.reference")
    g.addEdge("fhir_Composition", "fhir_Practitioner", "fhir_composition.author.reference")

    g.addEdge("fhir_Encounter", "Patient", "fhir_encounter.subject.reference")
    g.addEdge("fhir_Encounter", "fhir_Observation", "fhir_encounter.reasonreference.reference")
    g.addEdge("fhir_Encounter", "fhir_Practitioner", "fhir_encounter.participant.individual.reference")

    g.addEdge("fhir_Condition", "Patient", "fhir_condition.subject.reference")

    g.addEdge("fhir_AllergyIntolerance", "Patient", "fhir_allergyintolerance.patient.reference")

    return g
}

/*

// ---------------- FHIR Exporter call ----------------


let typeId = await swebAPI.getTypeIdByPrefix(resourceName)
console.log("typeId:"+typeId)
let entityID = await swebAPI.getEntityIDByTypeIDAndIdentifier(typeId, identifier) 
console.log("entityID:"+JSON.stringify(entityID))


return FHIRExporter.getBundle(entityID)
*/

module.exports.getHeterogeneousBundle = async function (callType, entityIdentifier){
    console.log("Heterogeneous Bundle")
    let resourceInvolvedList = []
    let resourceType = callType.split('/')[0]
    let resourceID = callType.split('/')[1]


    let FHIRBundle = {
        "resourceType": "Bundle",
        //"fullUrl": "http://iehreampleurl/"+resourceType+"/"+entityIdentifier,
        "id": "1",
        "language": process.env.APP_LANGUAGE,
        "type": "",
        "timestamp": date.toISOString(),
        "entry": []
    }
    
    let FHIRComposition = {
        "fullUrl": "http://localhost:8080/NCP/fhir/Composition/1",
        "resource": {
            "resourceType": "Composition",
            "meta":{
                "profile":[
                    "http://hl7.org/fhir/uv/ips/StructureDefinition/Composition-uv-ips"
                ]
            },
            "id": "1",
            "language": process.env.APP_LANGUAGE,
            "status": "final",
            "type": {
                "coding": [
                    {
                        "system": "http://loinc.org",
                        "code": "34133-9",
                        "display": "Summary of episode note"
                    }
                ]
            },
            "subject":{},
            "date": date.toISOString().substring(0, 10),
            "author": [],
            "title": "",
            "section": [
                {
                    "title": "Problem list - Reported",
                    "code": {
                        "coding": [
                            {
                                "system": "http://loinc.org",
                                "code": "11450-4",
                                "display": "Problem list - Reported"
                            }
                        ]
                    },
                    "entry": []
                },
                {
                    "title": "History of Medication use Narrative",
                    "code": {
                        "coding": [
                            {
                            "system": "http://loinc.org",
                            "code": "10160-0",
                            "display": "History of Medication use Narrative"
                            }
                        ]
                    },
                    "entry": []
                },
                {
                    "title": "Allergies and adverse reactions",
                    "code": {
                        "coding": [
                            {
                            "system": "http://loinc.org",
                            "code": "48765-2",
                            "display": "Allergies and adverse reactions Document"
                            }
                        ]
                    },
                    "entry": []    
                },
                {
                    "title": "Vital signs",
                    "code": {
                        "coding": [
                            {
                            "system": "http://loinc.org",
                            "code": "8716-3",
                            "display": "Vital signs"
                            }
                        ]
                    },
                    "entry": []
                },
                {
                    "title": "Relevant diagnostic tests/laboratory data Narrative",
                    "code": {
                        "coding": [
                            {
                            "system": "http://loinc.org",
                            "code": "30954-2",
                            "display": "Relevant diagnostic tests/laboratory data Narrative"
                            }
                        ]
                    },
                    "entry": []
                }
            ]
        }
    }
    

    //Patient Summary heterogeneous bundle
    if(callType.includes("patient-summary")){
        FHIRBundle.type = "document"
        //FHIRBundle.entry.push(FHIRComposition)

        //resourceInvolvedList.push("Composition")
        resourceInvolvedList.push("Condition")
        resourceInvolvedList.push("AllergyIntolerance") 
        resourceInvolvedList.push("MedicationStatement") 
        resourceInvolvedList.push("Medication")       
        resourceInvolvedList.push("Organization") 
        resourceInvolvedList.push("Observation") 
        resourceInvolvedList.push("Patient") 
        resourceInvolvedList.push("Practitioner")  
        //resourceInvolvedList.push("media") 
        //resourceInvolvedList.push("fhir_CarePlan") 

    } else { //Laboratory Result heterogeneous bundle
        FHIRBundle.type = "searchset"
        if(callType.match("encounter\/(.*)\/everything")){
            resourceInvolvedList.push("DiagnosticReport")
            resourceInvolvedList.push("AllergyIntolerance") 
            resourceInvolvedList.push("Observation")
            resourceInvolvedList.push("Condition") 
            resourceInvolvedList.push("Organization") 
            resourceInvolvedList.push("Patient") 
            resourceInvolvedList.push("Practitioner")  
            resourceInvolvedList.push("MedicationStatement") 
            resourceInvolvedList.push("Medication") 
            resourceInvolvedList.push("media") 
            resourceInvolvedList.push("fhir_CarePlan")
        }
    }  


    var FHIRGraph = await initFHIRGraph()
    var BundledEntityList = []
    //FHIRGraph.printGraph()

    var entityId = ""

    if(callType.includes("patient-summary")){
        // get Patient instance ID    
        entityId = await swebAPI.getEntityIDByTypeIDAndIdentifier(506, entityIdentifier)
    }else{
        // get Encounter instance ID    
        entityId = await swebAPI.getEntityIDByTypeIDAndIdentifier(1102, entityIdentifier)
    }


    //var typeId = await swebAPI.getTypeIdByPrefix(callType.split('/')[0])
     
    //console.log("entityID:"+JSON.stringify(entityId))

    await collectEntities(entityId, BundledEntityList, FHIRGraph, resourceInvolvedList)

    for(let entity of BundledEntityList){
        //get FHIR version of the entity (specified by id)
        var FHIRRes = await getFHIREntity(entity)
        let mainBundleEntry = {
            //"fullUrl": "http://iehrexampleurl/"+FHIRRes.resourceType+"/"+FHIRRes.id,
            "resource": {}
        }
        //FHIRRes = await extendedAttributes.metaAttribute(FHIRRes)
        mainBundleEntry.resource = FHIRRes

        //add FHIR res in Bundle
        FHIRBundle.entry.push(mainBundleEntry)
    }

    FHIRBundle = await extendedAttributes.dateFormatConversion(FHIRBundle)
    /*
    if(FHIRBundle.type == "document"){
      FHIRBundle = await FHIRProducer.addCompositionReferences(FHIRBundle)  
    }
    */
    
    for(res of FHIRBundle.entry){
        res = await extendedAttributes.unitOfMeasureAlignment(res)
    }

    FHIRBundle = await FHIRProducer.removeInvalidResources(FHIRBundle)
    FHIRBundle = await extendedAttributes.metaAttribute(FHIRBundle)
    //FHIRBundle = await extendedAttributes.unitOfMeasureAlignment(FHIRBundle)
    FHIRBundle = await extendedAttributes.languageAttribute(FHIRBundle)
    FHIRBundle = await extendedAttributes.indentifierAttribute(FHIRBundle)
    FHIRBundle = await extendedAttributes.statusAttribute(FHIRBundle)
    FHIRBundle = await extendedAttributes.noAllergyCode(FHIRBundle)
    FHIRBundle = await extendedAttributes.undefinedMedication(FHIRBundle, resourceID)

    // temp until the icd9_8952 will be added in KB
    FHIRBundle = await extendedAttributes.missingDRCode(FHIRBundle)


    return FHIRBundle
}





collectEntities = async function (entityId, BundledEntityList, FHIRGraph, resourceInvolvedList){

    //get type of main entity
    let entity = await swebAPI.getEntityById(entityId)
    let entityType = await swebAPI.getTypeById(entity.typeId)

    //add FHIR entity in BEL
    BundledEntityList.push(entityId)

    //---------------- collect source entities in the graph ----------------

    //get the edges having DEST equal to the FHIR type of main entity
    var pointedBy = []
    for(let e of FHIRGraph.getEdges()){
        let d = e.getDest()
        if(d == entityType){
            pointedBy.push(e)
            //console.log("EDGE:"+e.getSource()+";"+e.getLabel()+";"+e.getDest())
        }
    }

    //get all the entities (from EB) which have a link to the main entity
    //if those entities not in BEL, collects their linked entities
    for(let e of pointedBy){
        let entities = await swebAPI.getLinkedEntities(e.getLabel(), entityId)     
        for(let entity of entities){
            if(! await isInBEL(entity.id, BundledEntityList)
                && await isResourceInvolved(entity.id, resourceInvolvedList)){
                await collectEntities(entity.id, BundledEntityList, FHIRGraph, resourceInvolvedList)
            } 
        }
    }
       
    //---------------- collect destination entities in the graph ----------------

    
    //get the edges having SOURCE equal to the FHIR type of main entity
    var pointTo = []
    for(let e of FHIRGraph.getEdges()){
        let s = e.getSource()
        if(s == entityType){
            pointTo.push(e)
        }
    }

    //get all the entities (from EB) linked by the main entity
    //if those entities not in BEL, collects their linked entities
    let entities = await swebAPI.getEntitiesByTypeId(entity.typeId)

    for(let e of pointTo){
        for(let entity of entities){
            if(entity.id == entityId){
                for(let attribute of entity.attributes){
                    if((attribute.name.eng).toLowerCase() == e.getLabel()){                
                        for(let item of attribute.values){
                            if(!await isInBEL(item.value.id, BundledEntityList) 
                                && await isResourceInvolved(item.value.id, resourceInvolvedList)){
                                await collectEntities(item.value.id, BundledEntityList, FHIRGraph, resourceInvolvedList)
                            }
                        }
                    }
                }
            }
        }
    }
}

isInBEL = async function (id, BundledEntityList){
    for(i in BundledEntityList)
        if(await BundledEntityList[i] == id) return true
    return false
}

//check if the entityType of a specific entity is one of those requested by the call
isResourceInvolved = async function(entityId, resourceList){
    let entity = await swebAPI.getEntityById(entityId)
    let entityType = await swebAPI.getTypeById(entity.typeId)
    for(let r of resourceList){
        if(entityType.includes(r)){
            return true
        }
    }
    return false
}

getFHIREntity = async function (id){
    let entity = await swebAPI.getEntityById(id)
    let FHIRResource = await FHIRProducer.convert(entity)
    return FHIRResource
}   

// return homogeneous FHIR bundle 
// (a list of resources of the same FHIR type) 
module.exports.getHomogeneousBundle = async function (typeName) {
    console.log("Homogeneous Bundle")

    let typeId = await swebAPI.getTypeIdByPrefix("fhir_"+typeName)
    let entitiList = await swebAPI.getEntitiesByTypeId(typeId)

    let FHIRBundle = {
        "resourceType": "Bundle",
        //"fullUrl": "http://iehrexampleurl/Bundle",
        "id": "1",
        "language": process.env.APP_LANGUAGE,
        "type": "searchset",
        "timestamp": date.toISOString(),
        "entry": []
    }

    for(let entity of entitiList){
        let FHIREntity = await FHIRProducer.convert(entity)
        let mainBundleEntry = {
            //"fullUrl": "http://iehrexampleurl/"+FHIREntity.resourceType+"/"+FHIREntity.id,
            "resource": {}
        }
        FHIREntity = await extendedAttributes.metaAttribute(FHIREntity)
        mainBundleEntry.resource = FHIREntity
        FHIRBundle.entry.push(mainBundleEntry)
    }

    FHIRBundle = await extendedAttributes.dateFormatConversion(FHIRBundle)
    FHIRBundle = await extendedAttributes.unitOfMeasureAlignment(FHIRBundle)
    FHIRBundle = await FHIRProducer.removeInvalidResources(FHIRBundle)
    FHIRBundle = await extendedAttributes.languageAttribute(FHIRBundle)
    FHIRBundle = await extendedAttributes.indentifierAttribute(FHIRBundle)
    FHIRBundle = await extendedAttributes.statusAttribute(FHIRBundle)
    FHIRBundle = await extendedAttributes.noAllergyCode(FHIRBundle)
    
	return FHIRBundle
}




//read and serailize FHIR resource
module.exports.serialize = async function () {
    var data = await getFHIREntity(54303)
	let Resource = require(resolveSchema('4_0_0', data.resourceType.toLowerCase()));
	let doc = new Resource(data).toJSON();
	let doc_string = JSON.stringify(doc);
	//console.log(doc_string); 
	return doc;
};